import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadCatalogFragment } from './catalog-file.ts';
import type { CatalogFragment } from './catalog.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const coreRoot = path.resolve(here, '../../../..');
const wikiRoot = process.env.NXTLVL_WIKI_ROOT ?? path.resolve(coreRoot, '../nxtlvl-wiki');
const labRoot = process.env.NXTLVL_LAB_ROOT ?? path.resolve(coreRoot, '../nxtlvl-lab');

const family = [
  {
    owner: 'core',
    root: coreRoot,
    required: [
      'core/component/nxtlvl-plugin',
      'core/component/global-agent-config',
      'core/component/multi-cli-compiler',
    ],
    requiredCapabilities: [
      'core/component/nxtlvl-plugin|skills|skill|SKILL.md',
      'core/component/nxtlvl-plugin|agents|agent|*.md',
      'core/component/nxtlvl-plugin|commands|command|*.md',
      'core/component/nxtlvl-plugin|hooks|hook|hooks.json',
      'core/component/nxtlvl-plugin|.|mcp-server|mcp_config.json',
    ],
  },
  {
    owner: 'wiki',
    root: wikiRoot,
    required: [
      'wiki/component/nxtlvl-wiki-plugin',
      'wiki/component/nxtlvl-wiki-mcp',
      'wiki/component/analytics',
      'wiki/component/corpus',
    ],
    requiredCapabilities: [
      'wiki/component/nxtlvl-wiki-plugin|skills|skill|SKILL.md',
      'wiki/component/nxtlvl-wiki-plugin|agents|agent|*.md',
      'wiki/component/nxtlvl-wiki-plugin|commands|command|*.md',
      'wiki/component/nxtlvl-wiki-plugin|hooks|hook|hooks.json',
      'wiki/component/nxtlvl-wiki-mcp|.|mcp-server|src/server.ts',
    ],
  },
  {
    owner: 'lab',
    root: labRoot,
    required: [
      'lab/component/labs-app',
      'lab/component/harness-lab',
      'lab/component/evals-lab',
      'lab/component/nxtlvl-wiki-mcp',
      'lab/component/nxtlvl-labs-plugin',
    ],
    requiredCapabilities: [
      'lab/component/harness-lab|cells|configuration-module|manifest.yaml',
      'lab/component/nxtlvl-wiki-mcp|.|mcp-server|src/server.ts',
      'lab/component/nxtlvl-labs-plugin|skills|skill|SKILL.md',
      'lab/component/nxtlvl-labs-plugin|commands|command|*.md',
    ],
  },
] as const;

function loadRequiredCatalog(repository: (typeof family)[number]): CatalogFragment {
  const catalogPath = path.join(repository.root, 'nxtlvl.catalog.yaml');
  const result = loadCatalogFragment(catalogPath);
  assert.deepEqual(result.findings, [], JSON.stringify(result.findings, null, 2));
  assert.ok(result.value);
  return result.value;
}

for (const repository of family) {
  const catalogExists = fs.existsSync(path.join(repository.root, 'nxtlvl.catalog.yaml'));
  const skip = !catalogExists && process.env.NXTLVL_REQUIRE_FAMILY_CATALOGS !== '1';
  test(`${repository.owner} publishes a valid catalog with real component roots`, { skip }, () => {
    const catalog = loadRequiredCatalog(repository);
    assert.equal(catalog.owner, repository.owner);

    const ids = catalog.components.map((component) => component.id);
    for (const requiredId of repository.required) {
      assert.ok(ids.includes(requiredId), `missing required component ${requiredId}`);
    }
    const capabilities = catalog.components.flatMap((component) =>
      component.capability_roots.map((root) =>
        `${component.id}|${root.path}|${root.kind}|${root.entry}`,
      ),
    );
    for (const requiredCapability of repository.requiredCapabilities) {
      assert.ok(capabilities.includes(requiredCapability), `missing capability root ${requiredCapability}`);
    }
    for (const component of catalog.components) {
      assert.equal(
        fs.existsSync(path.resolve(repository.root, component.root)),
        true,
        `missing source root for ${component.id}`,
      );
    }
  });
}

test('family component identities are collision-free', () => {
  const available = family.filter((repository) =>
    fs.existsSync(path.join(repository.root, 'nxtlvl.catalog.yaml')),
  );
  const catalogs = available.map(loadRequiredCatalog);
  const componentIdentities = catalogs.flatMap((catalog) =>
    catalog.components.map((component) => component.id),
  );
  assert.equal(new Set(componentIdentities).size, componentIdentities.length);

  const capabilityDeclarations = catalogs.flatMap((catalog) =>
    catalog.components.flatMap((component) =>
      component.capability_roots.map((root) =>
        `${component.id}|${root.path}|${root.kind}|${root.entry}`,
      ),
    ),
  );
  assert.equal(new Set(capabilityDeclarations).size, capabilityDeclarations.length);
});

const temporaryDirectories: string[] = [];
after(() => {
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('malformed YAML becomes a structured finding', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nxtlvl-catalog-file-'));
  temporaryDirectories.push(directory);
  const catalogPath = path.join(directory, 'nxtlvl.catalog.yaml');
  fs.writeFileSync(catalogPath, 'owner: [not valid\n');

  const result = loadCatalogFragment(catalogPath);
  assert.equal(result.value, null);
  assert.equal(result.findings[0]?.code, 'catalog.parse_failed');
});
