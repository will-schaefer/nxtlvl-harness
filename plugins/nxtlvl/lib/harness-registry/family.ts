// Assemble the live family snapshot: catalog fragments from the three family
// repositories, provider observations, and the persisted registry phase.
//
// snapshot.json is a replaceable read model, never a second source of truth
// (family registry spec §3.2) — so the phase reported here always comes from
// registry.json via loadRegistry, not from what the assembly observed.

import * as os from 'node:os';
import * as path from 'node:path';

import { loadRegistry, type AuthorityOptions } from './authority.ts';
import { loadCatalogFragment } from './catalog-file.ts';
import {
  defaultClaudeProviderPaths,
  defaultCodexProviderPaths,
  readClaudeProvider,
  readCodexProvider,
} from './providers.ts';
import { buildSnapshot, type SnapshotRepositoryInput } from './snapshot.ts';
import type { HarnessSnapshot, RegistryFinding } from './types.ts';

export interface FamilyRoots {
  core: string;
  wiki: string;
  lab: string;
}

export function defaultFamilyRoots(env: NodeJS.ProcessEnv = process.env): FamilyRoots {
  const core = path.resolve(import.meta.dirname, '../../../..');
  return {
    core,
    wiki: env.NXTLVL_WIKI_ROOT ?? path.resolve(core, '../nxtlvl-wiki'),
    lab: env.NXTLVL_LAB_ROOT ?? path.resolve(core, '../nxtlvl-lab'),
  };
}

export interface FamilySnapshotOptions extends AuthorityOptions {
  roots?: FamilyRoots;
}

const FAMILY_SOURCES = ['core', 'wiki', 'lab'] as const;

/**
 * Build the normalized family snapshot from live inputs. Total like
 * buildSnapshot: a missing or invalid catalog, provider file, or registry
 * state degrades to findings, never a throw.
 */
export function assembleFamilySnapshot(options: FamilySnapshotOptions = {}): HarnessSnapshot {
  const env = options.env ?? process.env;
  const roots = options.roots ?? defaultFamilyRoots(env);
  const home = options.home ?? os.homedir();

  const repositories: SnapshotRepositoryInput[] = [];
  const loaderFindings: RegistryFinding[] = [];
  for (const source of FAMILY_SOURCES) {
    const repositoryRoot = roots[source];
    const loaded = loadCatalogFragment(path.join(repositoryRoot, 'nxtlvl.catalog.yaml'));
    loaderFindings.push(...loaded.findings.map((catalogFinding) => ({
      code: catalogFinding.code,
      severity: catalogFinding.severity,
      message: catalogFinding.message,
      source,
      path: catalogFinding.path,
    })));
    if (loaded.value === null) continue;
    repositories.push({ source, repositoryRoot, catalog: loaded.value });
  }

  const snapshot = buildSnapshot({
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    repositories,
    providers: [
      readClaudeProvider(options.claude ?? defaultClaudeProviderPaths(home)),
      readCodexProvider(options.codex ?? defaultCodexProviderPaths(home)),
    ],
  });

  if (loaderFindings.length > 0) {
    snapshot.findings.push(...loaderFindings);
    // Same ordering buildSnapshot applies, so appended findings keep the
    // snapshot byte-stable for identical inputs.
    snapshot.findings.sort((left, right) => {
      const sourceOrder = (left.source ?? '').localeCompare(right.source ?? '');
      return sourceOrder || left.code.localeCompare(right.code) || (left.path ?? '').localeCompare(right.path ?? '');
    });
    snapshot.parityEligible = snapshot.findings.every((finding) => finding.severity !== 'error');
  }

  snapshot.phase = loadRegistry(options).phase;
  return snapshot;
}
