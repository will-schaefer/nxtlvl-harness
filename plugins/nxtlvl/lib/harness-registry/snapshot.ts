import * as fs from 'node:fs';
import * as path from 'node:path';

import { validateCatalogFragment } from './catalog.ts';
import { discoverComponent, resolveContainedRealPath } from './discovery.ts';
import type { ProviderObservation } from './providers.ts';
import type { HarnessSnapshot, RegistryFinding } from './types.ts';

interface TargetComponent {
  id: string;
  owner: 'core' | 'wiki' | 'lab';
  kind: 'plugin' | 'application' | 'service' | 'engine' | 'subsystem';
  repositoryRoot: string;
  sourceRoot: string;
}

export interface SnapshotRepositoryInput {
  source: string;
  repositoryRoot: string;
  catalog: unknown;
}

export interface SnapshotInput {
  generatedAt: string;
  repositories: SnapshotRepositoryInput[];
  providers?: ProviderObservation[];
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function emptySnapshot(generatedAt: string, findings: RegistryFinding[]): HarnessSnapshot {
  return {
    schemaVersion: 1,
    generatedAt,
    phase: 'catalog-only',
    parityEligible: findings.every((finding) => finding.severity !== 'error'),
    components: [],
    capabilities: [],
    resources: [],
    findings,
  };
}

function duplicateIdentities(entries: Array<{ id: string }>): Set<string> {
  const counts = new Map<string, number>();
  for (const entry of entries) counts.set(entry.id, (counts.get(entry.id) ?? 0) + 1);
  return new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id));
}

function containsPath(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function joinDevelopmentCells(snapshot: HarnessSnapshot, targetComponents: TargetComponent[]): void {
  for (const capability of [...snapshot.capabilities]) {
    const target = capability.development?.target;
    if (target === undefined) continue;

    const safeTarget = !path.isAbsolute(target)
      && !target.split(/[\\/]/u).includes('..');
    const matches = safeTarget
      ? targetComponents.filter((component) =>
        containsPath(component.sourceRoot, path.resolve(component.repositoryRoot, target)),
      )
      : [];

    if (matches.length !== 1) {
      snapshot.findings.push({
        code: matches.length === 0 ? 'cell.target_unresolved' : 'cell.target_conflict',
        severity: 'error',
        message: matches.length === 0
          ? `Cell target does not resolve to an owned component: ${target}.`
          : `Cell target resolves to more than one owned component: ${target}.`,
        source: capability.development?.source,
        path: capability.development?.manifestPath,
      });
      continue;
    }

    const component = matches[0];
    const previousId = capability.id;
    const nextId = `${component.owner}/${capability.kind}/${toIdentityName(capability.name)}`;
    const existing = snapshot.capabilities.find((entry) => entry !== capability && entry.id === nextId);
    const controlId = component.kind === 'plugin' ? component.id : nextId;

    capability.id = nextId;
    capability.componentId = component.id;
    capability.controlId = controlId;
    capability.controlMode = controlId === nextId ? 'self' : 'parent';
    capability.controlReason = controlId === nextId ? undefined : 'Managed by the owning plugin.';

    const cellResources = snapshot.resources.filter((resource) => resource.capabilityId === previousId);
    for (const resource of cellResources) {
      resource.capabilityId = nextId;
      resource.id = `${nextId}/${resource.relativePath}`;
    }

    if (existing !== undefined) {
      existing.development = capability.development;
      existing.lifecycle = capability.lifecycle;
      existing.provenance = [...new Set([...existing.provenance, ...capability.provenance])];
      existing.evidence = {
        evaluations: existing.evidence.evaluations + capability.evidence.evaluations,
        tests: existing.evidence.tests + capability.evidence.tests,
      };
      snapshot.capabilities = snapshot.capabilities.filter((entry) => entry !== capability);
    }
  }
}

function toIdentityName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

function isolateIdentityConflicts(snapshot: HarnessSnapshot, targetComponents: TargetComponent[]): void {
  const duplicateComponents = duplicateIdentities(snapshot.components);
  for (const id of duplicateComponents) {
    snapshot.findings.push({
      code: 'catalog.duplicate_component_identity',
      severity: 'error',
      message: `Duplicate component identity is blocked: ${id}.`,
      path: id,
    });
  }
  snapshot.components = snapshot.components.filter((component) => !duplicateComponents.has(component.id));
  snapshot.capabilities = snapshot.capabilities.filter(
    (capability) => !duplicateComponents.has(capability.componentId),
  );
  const visibleTargetComponents = targetComponents.filter(
    (component) => !duplicateComponents.has(component.id),
  );
  joinDevelopmentCells(snapshot, visibleTargetComponents);

  const duplicateCapabilities = duplicateIdentities(snapshot.capabilities);
  for (const id of duplicateCapabilities) {
    snapshot.findings.push({
      code: 'catalog.duplicate_capability_identity',
      severity: 'error',
      message: `Duplicate capability identity is blocked: ${id}.`,
      path: id,
    });
  }
  snapshot.capabilities = snapshot.capabilities.filter(
    (capability) => !duplicateCapabilities.has(capability.id),
  );
  const visibleCapabilityIds = new Set(snapshot.capabilities.map((capability) => capability.id));
  snapshot.resources = snapshot.resources.filter(
    (resource) => visibleCapabilityIds.has(resource.capabilityId),
  );
}

function externalComponentId(provider: string, key: string): string {
  return `external/component/${provider}-${toIdentityName(key)}`;
}

function reconcileProviders(snapshot: HarnessSnapshot, providers: ProviderObservation[] | undefined): void {
  if (providers === undefined || providers.length === 0) return;
  const familyStates = new Map<string, Array<{ provider: string; enabled: boolean }>>();

  for (const provider of providers) {
    snapshot.findings.push(...provider.findings.map((finding) => ({
      ...finding,
      source: provider.provider,
    })));

    for (const plugin of provider.plugins) {
      if (plugin.familyComponentId !== undefined) {
        const component = snapshot.components.find((entry) => entry.id === plugin.familyComponentId);
        if (component === undefined) {
          snapshot.findings.push({
            code: 'provider.family_component_missing',
            severity: 'error',
            message: `Provider plugin does not match a catalog component: ${plugin.key}.`,
            source: provider.provider,
            path: plugin.familyComponentId,
          });
          continue;
        }
        const states = familyStates.get(plugin.familyComponentId) ?? [];
        states.push({ provider: provider.provider, enabled: plugin.enabled });
        familyStates.set(plugin.familyComponentId, states);
        component.providers = [...new Set([...(component.providers ?? []), provider.provider])].sort();
        component.controlMode = 'self';
        component.controlId = component.id;
        continue;
      }

      const componentId = externalComponentId(provider.provider, plugin.key);
      if (snapshot.components.some((entry) => entry.id === componentId)) continue;
      snapshot.components.push({
        id: componentId,
        owner: 'external',
        name: plugin.key,
        kind: 'plugin',
        sourceRoot: plugin.source ?? '',
        availability: 'available',
        deployment: 'external',
        controlMode: 'read-only',
        controlId: componentId,
        providers: [provider.provider],
      });
    }

    for (const capability of provider.capabilities) {
      const component = snapshot.components.find((entry) => entry.id === capability.componentId);
      if (component === undefined) continue;
      if (snapshot.capabilities.some((entry) => entry.id === capability.id)) continue;
      snapshot.capabilities.push({
        id: capability.id,
        componentId: capability.componentId,
        name: capability.name,
        kind: capability.kind,
        entryPath: '',
        controlMode: capability.controlMode,
        controlId: capability.controlId,
        controlReason: 'Provider exposes this item as an individual control.',
        lifecycle: 'graduated',
        deployment: capability.enabled ? 'active' : 'benched',
        provenance: [provider.provider],
        evidence: { evaluations: 0, tests: 0 },
      });
    }
  }

  for (const [componentId, states] of familyStates) {
    const enabledValues = new Set(states.map((state) => state.enabled));
    const deployment = enabledValues.size > 1
      ? 'drift'
      : states[0]?.enabled === true
        ? 'active'
        : 'benched';
    const providersForComponent = states.map((state) => state.provider).sort();

    for (const component of snapshot.components.filter((entry) => entry.id === componentId)) {
      component.deployment = deployment;
      component.controlMode = 'self';
      component.controlId = component.id;
      component.providers = providersForComponent;
    }

    for (const capability of snapshot.capabilities.filter((entry) => entry.componentId === componentId)) {
      if (capability.provenance.some((source) => providersForComponent.includes(source))) continue;
      capability.deployment = deployment;
      capability.provenance = [...new Set([...capability.provenance, ...providersForComponent])].sort();
      if (capability.controlMode !== 'self') {
        capability.controlMode = 'parent';
        capability.controlId = componentId;
        capability.controlReason = 'Managed by the provider plugin switch.';
      }
    }
  }
  snapshot.phase = 'imported';
}

export function buildSnapshot(input: unknown): HarnessSnapshot {
  const fallbackTime = new Date(0).toISOString();

  try {
    if (!isRecord(input)) {
      return emptySnapshot(fallbackTime, [{
        code: 'snapshot.invalid_input',
        severity: 'error',
        message: 'Snapshot input must be an object.',
        path: '$',
      }]);
    }

    const validGeneratedAt = typeof input.generatedAt === 'string'
      && Number.isFinite(Date.parse(input.generatedAt));
    const generatedAt = validGeneratedAt ? new Date(input.generatedAt as string).toISOString() : fallbackTime;
    const inputFindings: RegistryFinding[] = validGeneratedAt ? [] : [{
      code: 'snapshot.invalid_generated_at',
      severity: 'error',
      message: 'generatedAt must be a valid date-time string.',
      path: '$.generatedAt',
    }];

    if (!Array.isArray(input.repositories)) {
      return emptySnapshot(generatedAt, [...inputFindings, {
        code: 'snapshot.invalid_repositories',
        severity: 'error',
        message: 'repositories must be an array.',
        path: '$.repositories',
      }]);
    }

    const snapshot = emptySnapshot(generatedAt, inputFindings);
    const targetComponents: TargetComponent[] = [];

    for (const [index, repository] of input.repositories.entries()) {
      const repositoryPath = `$.repositories[${index}]`;
      if (!isRecord(repository)
        || typeof repository.source !== 'string'
        || repository.source.trim().length === 0
        || typeof repository.repositoryRoot !== 'string'
        || repository.repositoryRoot.trim().length === 0) {
        snapshot.findings.push({
          code: 'snapshot.invalid_repository',
          severity: 'error',
          message: 'Repository input requires source and repositoryRoot strings.',
          path: repositoryPath,
        });
        continue;
      }

      const validation = validateCatalogFragment(repository.catalog);
      snapshot.findings.push(...validation.findings.map((catalogFinding) => ({
        code: catalogFinding.code,
        severity: catalogFinding.severity,
        message: catalogFinding.message,
        source: repository.source as string,
        path: catalogFinding.path,
      })));

      if (validation.value === null) continue;

      for (const component of validation.value.components) {
        const sourceRoot = path.resolve(repository.repositoryRoot, component.root);
        const containedRoot = fs.existsSync(sourceRoot)
          ? resolveContainedRealPath(repository.repositoryRoot, sourceRoot)
          : null;
        const available = containedRoot !== null;
        snapshot.components.push({
          id: component.id,
          owner: validation.value.owner,
          name: component.name,
          kind: component.kind,
          sourceRoot: containedRoot ?? sourceRoot,
          availability: available ? 'available' : 'unavailable',
        });
        if (!available) {
          snapshot.findings.push({
            code: fs.existsSync(sourceRoot) ? 'component.source_unsafe' : 'component.source_missing',
            severity: 'error',
            message: fs.existsSync(sourceRoot)
              ? `Component source path resolves outside its repository: ${sourceRoot}.`
              : `Component source path does not exist: ${sourceRoot}.`,
            source: repository.source,
            path: sourceRoot,
          });
          continue;
        }

        let discovery;
        try {
          discovery = discoverComponent({
            owner: validation.value.owner,
            source: repository.source,
            repositoryRoot: fs.realpathSync(repository.repositoryRoot),
            component,
            componentRoot: containedRoot,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown discovery error.';
          snapshot.findings.push({
            code: 'component.discovery_failed',
            severity: 'error',
            message: `Component discovery failed safely: ${message}`,
            source: repository.source,
            path: component.id,
          });
          continue;
        }
        snapshot.capabilities.push(...discovery.capabilities);
        snapshot.resources.push(...discovery.resources);
        snapshot.findings.push(...discovery.findings);
        targetComponents.push({
          id: component.id,
          owner: validation.value.owner,
          kind: component.kind,
          repositoryRoot: fs.realpathSync(repository.repositoryRoot),
          sourceRoot: containedRoot,
        });
      }
    }

    isolateIdentityConflicts(snapshot, targetComponents);
    reconcileProviders(snapshot, Array.isArray(input.providers) ? input.providers : undefined);
    snapshot.components.sort((left, right) => left.id.localeCompare(right.id));
    snapshot.capabilities.sort((left, right) => left.id.localeCompare(right.id));
    snapshot.resources.sort((left, right) => {
      const capabilityOrder = left.capabilityId.localeCompare(right.capabilityId);
      if (capabilityOrder !== 0) return capabilityOrder;
      if (left.kind === 'entry-file' && right.kind !== 'entry-file') return -1;
      if (right.kind === 'entry-file' && left.kind !== 'entry-file') return 1;
      return left.relativePath.localeCompare(right.relativePath);
    });
    snapshot.findings.sort((left, right) => {
      const sourceOrder = (left.source ?? '').localeCompare(right.source ?? '');
      return sourceOrder || left.code.localeCompare(right.code) || (left.path ?? '').localeCompare(right.path ?? '');
    });
    snapshot.parityEligible = snapshot.findings.every((finding) => finding.severity !== 'error');
    return snapshot;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown snapshot error.';
    return emptySnapshot(fallbackTime, [{
      code: 'snapshot.build_failed',
      severity: 'error',
      message: `Snapshot build failed safely: ${message}`,
      path: '$',
    }]);
  }
}
