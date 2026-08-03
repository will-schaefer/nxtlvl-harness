import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateCatalogFragment } from './catalog.ts';

const validCatalog = {
  schema_version: 1,
  owner: 'core',
  components: [
    {
      id: 'core/component/nxtlvl-plugin',
      name: 'nxtlvl',
      kind: 'plugin',
      root: 'plugins/nxtlvl',
      capability_roots: [
        { path: 'skills', kind: 'skill', entry: 'SKILL.md' },
      ],
    },
  ],
};

test('validateCatalogFragment returns a normalized value for a valid catalog', () => {
  assert.deepEqual(validateCatalogFragment(validCatalog), {
    value: validCatalog,
    findings: [],
  });
});

test('validateCatalogFragment accepts workflow capability roots', () => {
  const catalog = {
    ...validCatalog,
    components: [{
      ...validCatalog.components[0],
      capability_roots: [
        { path: 'workflows', kind: 'workflow', entry: 'workflow.md' },
      ],
    }],
  };

  assert.deepEqual(validateCatalogFragment(catalog), {
    value: catalog,
    findings: [],
  });
});

test('validateCatalogFragment returns structured findings instead of throwing', () => {
  assert.deepEqual(validateCatalogFragment(null), {
    value: null,
    findings: [
      {
        code: 'catalog.invalid_type',
        severity: 'error',
        path: '$',
        message: 'Catalog must be an object.',
      },
    ],
  });
});

test('validateCatalogFragment reports duplicate identities and unsafe nested paths', () => {
  const result = validateCatalogFragment({
    ...validCatalog,
    components: [
      validCatalog.components[0],
      {
        ...validCatalog.components[0],
        root: '../outside',
        capability_roots: [
          { path: 'skills/../outside', kind: 'unknown', entry: '/absolute.md' },
        ],
      },
    ],
  });

  assert.equal(result.value, null);
  assert.deepEqual(result.findings.map((item) => item.code), [
    'catalog.duplicate_component_id',
    'catalog.invalid_component_root',
    'catalog.invalid_capability_path',
    'catalog.invalid_capability_kind',
    'catalog.invalid_capability_entry',
  ]);
});

test('validateCatalogFragment contains unexpected property access failures', () => {
  const hostile = new Proxy({}, {
    get() {
      throw new Error('fixture getter failed');
    },
  });

  const result = validateCatalogFragment(hostile);
  assert.equal(result.value, null);
  assert.deepEqual(result.findings, [
    {
      code: 'catalog.validation_failed',
      severity: 'error',
      path: '$',
      message: 'Catalog validation failed safely: fixture getter failed',
    },
  ]);
});

test('validateCatalogFragment preserves exclusions and entry overrides', () => {
  const catalog = {
    ...validCatalog,
    components: [{
      ...validCatalog.components[0],
      exclusions: ['node_modules', 'dist'],
      entry_overrides: [{
        path: 'skills/pointer-summary',
        name: 'Pointer Summary',
        control_parent: 'core/component/nxtlvl-plugin',
        related_components: ['wiki/component/nxtlvl-wiki-plugin'],
      }],
    }],
  };

  assert.deepEqual(validateCatalogFragment(catalog), { value: catalog, findings: [] });
});

test('validateCatalogFragment rejects unknown fields instead of silently erasing them', () => {
  const result = validateCatalogFragment({ ...validCatalog, componnets: [] });

  assert.equal(result.value, null);
  assert.deepEqual(result.findings.map((item) => item.code), ['catalog.unknown_field']);
  assert.equal(result.findings[0]?.path, '$.componnets');
});
