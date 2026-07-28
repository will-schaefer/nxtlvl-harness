import * as fs from 'node:fs';
import * as path from 'node:path';

import { validateCatalogFragment } from './catalog.ts';
import type { HarnessSnapshot, RegistryFinding } from './types.ts';

export interface SnapshotRepositoryInput {
  source: string;
  repositoryRoot: string;
  catalog: unknown;
}

export interface SnapshotInput {
  generatedAt: string;
  repositories: SnapshotRepositoryInput[];
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
    components: [],
    capabilities: [],
    resources: [],
    findings,
  };
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
        const available = fs.existsSync(sourceRoot);
        snapshot.components.push({
          id: component.id,
          owner: validation.value.owner,
          name: component.name,
          kind: component.kind,
          sourceRoot,
          availability: available ? 'available' : 'unavailable',
        });
        if (!available) {
          snapshot.findings.push({
            code: 'component.source_missing',
            severity: 'error',
            message: `Component source path does not exist: ${sourceRoot}.`,
            source: repository.source,
            path: sourceRoot,
          });
        }
      }
    }

    snapshot.components.sort((left, right) => left.id.localeCompare(right.id));
    snapshot.findings.sort((left, right) => {
      const sourceOrder = (left.source ?? '').localeCompare(right.source ?? '');
      return sourceOrder || left.code.localeCompare(right.code) || (left.path ?? '').localeCompare(right.path ?? '');
    });
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
