import * as fs from 'node:fs';
import * as path from 'node:path';

import { parse } from 'yaml';

import type {
  CatalogComponent,
  CatalogOwner,
  CatalogCapabilityRoot,
  CatalogEntryOverride,
} from './catalog.ts';
import type {
  CapabilitySnapshot,
  RegistryFinding,
  ResourceSnapshot,
} from './types.ts';

export interface ComponentDiscoveryInput {
  owner: CatalogOwner;
  source: string;
  repositoryRoot: string;
  component: CatalogComponent;
  componentRoot: string;
}

export interface ComponentDiscoveryResult {
  capabilities: CapabilitySnapshot[];
  resources: ResourceSnapshot[];
  findings: RegistryFinding[];
}

interface EntryCandidate {
  entryPath: string;
  bundleRoot: string;
  identityName: string;
}

interface EntryCandidates {
  entries: EntryCandidate[];
  missingEntryPaths: string[];
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const RESOURCE_DIRECTORIES: Record<string, string> = {
  agents: 'nested-agent',
  assets: 'asset',
  evals: 'evaluation',
  evaluations: 'evaluation',
  references: 'reference',
  scripts: 'helper-script',
  tests: 'test',
  tools: 'tool',
  resources: 'resource',
};

function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}

function toIdentityName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');
}

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export function resolveContainedRealPath(root: string, candidate: string): string | null {
  try {
    const realRoot = fs.realpathSync(root);
    const realCandidate = fs.realpathSync(candidate);
    return isWithin(realRoot, realCandidate) ? realCandidate : null;
  } catch {
    return null;
  }
}

function isExcluded(relativePath: string, exclusions: string[]): boolean {
  const normalized = toPosix(relativePath);
  return exclusions.some((pattern) => path.matchesGlob(normalized, pattern));
}

function findOverride(component: CatalogComponent, entryPath: string): CatalogEntryOverride | undefined {
  const relativePath = toPosix(path.relative(component.root, entryPath));
  return component.entry_overrides?.find((override) => override.path === relativePath);
}

function listEntryCandidates(
  componentRoot: string,
  capabilityRoot: CatalogCapabilityRoot,
  exclusions: string[],
): EntryCandidates {
  const root = path.resolve(componentRoot, capabilityRoot.path);
  const safeRoot = resolveContainedRealPath(componentRoot, root);
  if (safeRoot === null || !fs.statSync(safeRoot).isDirectory()) {
    return { entries: [], missingEntryPaths: [] };
  }

  if (capabilityRoot.entry.includes('*')) {
    const entries = fs.readdirSync(safeRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && path.matchesGlob(entry.name, capabilityRoot.entry))
      .map((entry) => ({
        entryPath: path.join(safeRoot, entry.name),
        bundleRoot: path.join(safeRoot, entry.name),
        identityName: path.basename(entry.name, path.extname(entry.name)),
      }));
    return {
      entries,
      missingEntryPaths: entries.length === 0
        ? [path.join(safeRoot, capabilityRoot.entry)]
        : [],
    };
  }

  const candidates: EntryCandidate[] = [];
  const missingEntryPaths: string[] = [];
  const directEntry = path.resolve(safeRoot, capabilityRoot.entry);
  if (fs.existsSync(directEntry) && fs.statSync(directEntry).isFile()) {
    const rootName = path.basename(safeRoot);
    candidates.push({
      entryPath: directEntry,
      bundleRoot: capabilityRoot.entry.includes('/') || capabilityRoot.path !== '.'
        ? safeRoot
        : directEntry,
      identityName: capabilityRoot.path === '.'
        ? path.basename(capabilityRoot.entry, path.extname(capabilityRoot.entry))
        : rootName,
    });
    return { entries: candidates, missingEntryPaths };
  }

  let foundChildDirectory = false;
  for (const entry of fs.readdirSync(safeRoot, { withFileTypes: true })) {
    const childRoot = path.join(safeRoot, entry.name);
    const componentRelative = toPosix(path.relative(componentRoot, childRoot));
    if (entry.name.startsWith('.') || isExcluded(componentRelative, exclusions)) continue;
    let childIsDirectory = entry.isDirectory();
    if (entry.isSymbolicLink()) {
      try {
        childIsDirectory = fs.statSync(childRoot).isDirectory();
      } catch {
        childIsDirectory = false;
      }
    }
    if (!childIsDirectory) continue;
    foundChildDirectory = true;

    const nestedEntry = path.resolve(childRoot, capabilityRoot.entry);
    if (fs.existsSync(nestedEntry) && fs.statSync(nestedEntry).isFile()) {
      candidates.push({ entryPath: nestedEntry, bundleRoot: childRoot, identityName: entry.name });
    } else {
      missingEntryPaths.push(nestedEntry);
    }
  }

  if (!foundChildDirectory) missingEntryPaths.push(directEntry);
  return { entries: candidates, missingEntryPaths };
}

function resourceKind(bundleRoot: string, entryPath: string, filePath: string): string {
  if (filePath === entryPath) return 'entry-file';
  const directories = toPosix(path.relative(bundleRoot, filePath)).split('/').slice(0, -1);
  for (const directory of directories) {
    const kind = RESOURCE_DIRECTORIES[directory];
    if (kind !== undefined) return kind;
  }
  return 'resource';
}

function previewSupported(filePath: string): boolean {
  return !['.gif', '.jpeg', '.jpg', '.png', '.webp'].includes(path.extname(filePath).toLowerCase());
}

function cellEntryPath(bundleRoot: string, name: string, kind: string): string | null {
  const entryName = kind === 'skill'
    ? 'SKILL.md'
    : kind === 'hook'
      ? 'hooks.json'
      : `${name}.md`;
  const entryPath = path.join(bundleRoot, entryName);
  return fs.existsSync(entryPath) ? resolveContainedRealPath(bundleRoot, entryPath) : null;
}

function walkBundleFiles(
  repositoryRoot: string,
  componentRoot: string,
  bundleRoot: string,
  entryPath: string,
  exclusions: string[],
  findings: RegistryFinding[],
  source: string,
): Array<{ absolutePath: string; relativePath: string; kind: string }> {
  const files: Array<{ absolutePath: string; relativePath: string; kind: string }> = [];
  const visitedDirectories = new Set<string>();

  if (fs.statSync(bundleRoot).isFile()) {
    return [{
      absolutePath: bundleRoot,
      relativePath: toPosix(path.relative(repositoryRoot, bundleRoot)),
      kind: 'entry-file',
    }];
  }

  function visit(directory: string): void {
    const realDirectory = fs.realpathSync(directory);
    if (visitedDirectories.has(realDirectory)) return;
    visitedDirectories.add(realDirectory);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') && entry.isDirectory()) continue;
      const candidate = path.join(directory, entry.name);
      const repositoryRelative = toPosix(path.relative(repositoryRoot, candidate));
      const componentRelative = toPosix(path.relative(componentRoot, candidate));
      if (isExcluded(componentRelative, exclusions)) continue;

      const realCandidate = resolveContainedRealPath(componentRoot, candidate);
      if (realCandidate === null) {
        findings.push({
          code: 'resource.path_unsafe',
          severity: 'error',
          message: `Resource resolves outside its component: ${candidate}.`,
          source,
          path: repositoryRelative,
        });
        continue;
      }

      let isDirectory = entry.isDirectory();
      if (entry.isSymbolicLink()) isDirectory = fs.statSync(candidate).isDirectory();
      if (isDirectory) {
        visit(realCandidate);
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        files.push({
          absolutePath: realCandidate,
          relativePath: repositoryRelative,
          kind: resourceKind(bundleRoot, entryPath, candidate),
        });
      }
    }
  }

  visit(bundleRoot);
  return files;
}

export function discoverComponent(input: ComponentDiscoveryInput): ComponentDiscoveryResult {
  const capabilities: CapabilitySnapshot[] = [];
  const resources: ResourceSnapshot[] = [];
  const findings: RegistryFinding[] = [];

  for (const capabilityRoot of input.component.capability_roots) {
    const declaredRoot = path.resolve(input.componentRoot, capabilityRoot.path);
    const safeDeclaredRoot = resolveContainedRealPath(input.componentRoot, declaredRoot);
    if (safeDeclaredRoot === null || !fs.statSync(safeDeclaredRoot).isDirectory()) {
      findings.push({
        code: 'capability.root_unsafe',
        severity: 'error',
        message: `Capability root is missing or resolves outside its component: ${declaredRoot}.`,
        source: input.source,
        path: toPosix(path.relative(input.repositoryRoot, declaredRoot)),
      });
      continue;
    }

    const candidates = listEntryCandidates(
      input.componentRoot,
      capabilityRoot,
      input.component.exclusions ?? [],
    );
    for (const missingEntryPath of candidates.missingEntryPaths) {
      findings.push({
        code: 'capability.entry_missing',
        severity: 'error',
        message: `Declared capability entry does not exist: ${missingEntryPath}.`,
        source: input.source,
        path: toPosix(path.relative(input.repositoryRoot, missingEntryPath)),
      });
    }

    for (const candidate of candidates.entries) {
      const safeEntry = resolveContainedRealPath(input.componentRoot, candidate.entryPath);
      const safeBundle = resolveContainedRealPath(input.componentRoot, candidate.bundleRoot);
      if (safeEntry === null || safeBundle === null) {
        findings.push({
          code: 'capability.entry_unsafe',
          severity: 'error',
          message: `Capability entry resolves outside its component: ${candidate.entryPath}.`,
          source: input.source,
          path: toPosix(path.relative(input.repositoryRoot, candidate.entryPath)),
        });
        continue;
      }

      const override = findOverride(
        input.component,
        toPosix(path.relative(input.repositoryRoot, candidate.entryPath)),
      );
      let capabilityKind = capabilityRoot.kind;
      let capabilityName = override?.name ?? candidate.identityName;
      let identityName = override?.name
        ? toIdentityName(override.name)
        : candidate.identityName;
      let capabilityEntry = safeEntry;
      let lifecycle: CapabilitySnapshot['lifecycle'] = 'graduated';
      let development: CapabilitySnapshot['development'];

      if (capabilityRoot.kind === 'configuration-module'
        && path.basename(candidate.entryPath) === 'manifest.yaml') {
        let manifest: unknown;
        try {
          manifest = parse(fs.readFileSync(safeEntry, 'utf8'), { strict: true, uniqueKeys: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown parse error.';
          findings.push({
            code: 'cell.manifest_parse_failed',
            severity: 'error',
            message: `Could not parse cell manifest: ${message}`,
            source: input.source,
            path: toPosix(path.relative(input.repositoryRoot, safeEntry)),
          });
          continue;
        }

        const validKinds = ['skill', 'agent', 'command', 'hook'] as const;
        if (!isRecord(manifest)
          || typeof manifest.name !== 'string'
          || !validKinds.includes(manifest.type as (typeof validKinds)[number])
          || typeof manifest.stage !== 'string') {
          findings.push({
            code: 'cell.manifest_invalid',
            severity: 'error',
            message: 'Cell manifest requires name, type, and stage strings.',
            source: input.source,
            path: toPosix(path.relative(input.repositoryRoot, safeEntry)),
          });
          continue;
        }

        capabilityKind = manifest.type as (typeof validKinds)[number];
        capabilityName = manifest.name;
        identityName = toIdentityName(manifest.name);
        capabilityEntry = cellEntryPath(safeBundle, manifest.name, capabilityKind) ?? safeEntry;
        lifecycle = manifest.stage === 'graduated' ? 'graduated' : 'development';
        development = {
          source: input.source,
          stage: manifest.stage,
          manifestPath: toPosix(path.relative(input.repositoryRoot, safeEntry)),
          cellRoot: toPosix(path.relative(input.repositoryRoot, safeBundle)),
          ...(typeof manifest.target === 'string' && manifest.target.trim().length > 0
            ? { target: manifest.target }
            : {}),
        };
      }

      const id = `${input.owner}/${capabilityKind}/${identityName}`;
      const controlId = override?.control_parent
        ?? (input.component.kind === 'plugin' ? input.component.id : id);
      const controlMode = controlId === id ? 'self' : 'parent';
      const bundleFiles = walkBundleFiles(
        input.repositoryRoot,
        input.componentRoot,
        safeBundle,
        capabilityEntry,
        input.component.exclusions ?? [],
        findings,
        input.source,
      );
      const capabilityResources = bundleFiles.map((file) => ({
        id: `${id}/${file.relativePath}`,
        capabilityId: id,
        source: input.source,
        kind: file.kind,
        relativePath: file.relativePath,
        displayName: path.basename(file.relativePath),
        previewSupported: previewSupported(file.absolutePath),
      }));

      capabilities.push({
        id,
        componentId: input.component.id,
        name: capabilityName,
        kind: capabilityKind,
        entryPath: capabilityEntry,
        controlMode,
        controlId,
        ...(controlMode === 'parent' ? { controlReason: 'Managed by the owning plugin.' } : {}),
        lifecycle,
        deployment: 'unavailable',
        provenance: [input.source],
        ...(development === undefined ? {} : { development }),
        evidence: {
          evaluations: capabilityResources.filter((resource) => resource.kind === 'evaluation').length,
          tests: capabilityResources.filter((resource) => resource.kind === 'test').length,
        },
      });
      resources.push(...capabilityResources);
    }
  }

  return { capabilities, resources, findings };
}
