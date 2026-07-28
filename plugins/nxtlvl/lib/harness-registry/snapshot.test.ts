import assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';

import { buildSnapshot } from './snapshot.ts';

test('buildSnapshot normalizes valid fragments and keeps invalid fragments as findings', () => {
  const snapshot = buildSnapshot({
    generatedAt: '2026-07-28T12:00:00.000Z',
    repositories: [
      {
        source: 'wiki-fixture',
        repositoryRoot: '/fixtures/wiki',
        catalog: null,
      },
      {
        source: 'core-fixture',
        repositoryRoot: '/fixtures/core',
        catalog: {
          schema_version: 1,
          owner: 'core',
          components: [
            {
              id: 'core/component/nxtlvl-plugin',
              name: 'nxtlvl',
              kind: 'plugin',
              root: 'plugins/nxtlvl',
              capability_roots: [],
            },
          ],
        },
      },
    ],
  });

  assert.deepEqual(snapshot.components, [
    {
      id: 'core/component/nxtlvl-plugin',
      owner: 'core',
      name: 'nxtlvl',
      kind: 'plugin',
      sourceRoot: path.resolve('/fixtures/core/plugins/nxtlvl'),
      availability: 'unavailable',
    },
  ]);
  assert.deepEqual(snapshot.capabilities, []);
  assert.deepEqual(snapshot.resources, []);
  assert.deepEqual(snapshot.findings, [
    {
      code: 'component.source_missing',
      severity: 'error',
      message: `Component source path does not exist: ${path.resolve('/fixtures/core/plugins/nxtlvl')}.`,
      source: 'core-fixture',
      path: path.resolve('/fixtures/core/plugins/nxtlvl'),
    },
    {
      code: 'catalog.invalid_type',
      severity: 'error',
      message: 'Catalog must be an object.',
      source: 'wiki-fixture',
      path: '$',
    },
  ]);
});

test('buildSnapshot reports an invalid generatedAt while keeping deterministic output', () => {
  const snapshot = buildSnapshot({ generatedAt: 'not-a-date', repositories: [] });

  assert.equal(snapshot.generatedAt, '1970-01-01T00:00:00.000Z');
  assert.deepEqual(snapshot.findings, [{
    code: 'snapshot.invalid_generated_at',
    severity: 'error',
    message: 'generatedAt must be a valid date-time string.',
    path: '$.generatedAt',
  }]);
});
