import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadCatalogFragment } from './catalog-file.ts';
import { buildSnapshot } from './snapshot.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const coreRoot = path.resolve(here, '../../../..');
const wikiRoot = process.env.NXTLVL_WIKI_ROOT ?? path.resolve(coreRoot, '../nxtlvl-wiki');
const labRoot = process.env.NXTLVL_LAB_ROOT ?? path.resolve(coreRoot, '../nxtlvl-lab');
const roots = [
  { source: 'core', repositoryRoot: coreRoot },
  { source: 'wiki', repositoryRoot: wikiRoot },
  { source: 'lab', repositoryRoot: labRoot },
];
const familyAvailable = roots.every((repository) =>
  fs.existsSync(path.join(repository.repositoryRoot, 'nxtlvl.catalog.yaml')),
);

test('assembles the real family catalog snapshot', {
  skip: !familyAvailable && process.env.NXTLVL_REQUIRE_FAMILY_CATALOGS !== '1',
}, () => {
  const repositories = roots.map((repository) => {
    const catalog = loadCatalogFragment(path.join(repository.repositoryRoot, 'nxtlvl.catalog.yaml'));
    assert.deepEqual(catalog.findings, [], JSON.stringify(catalog.findings, null, 2));
    assert.ok(catalog.value);
    return { ...repository, catalog: catalog.value };
  });
  const snapshot = buildSnapshot({
    generatedAt: '2026-07-28T12:00:00.000Z',
    repositories,
  });

  assert.deepEqual({
    parityEligible: snapshot.parityEligible,
    componentIds: snapshot.components.map((component) => component.id),
    representativeCapabilities: [
      'core/skill/pointer-summary',
      'lab/mcp-server/lab-wiki-model-context-protocol-server',
      'wiki/skill/query',
    ].filter((id) => snapshot.capabilities.some((capability) => capability.id === id)),
    developmentTargets: snapshot.capabilities
      .filter((capability) => capability.development?.target !== undefined)
      .map((capability) => [capability.id, capability.development?.target]),
    findingCodes: snapshot.findings.map((finding) => finding.code),
  }, {
    parityEligible: true,
    componentIds: [
      'core/component/global-agent-config',
      'core/component/multi-cli-compiler',
      'core/component/nxtlvl-plugin',
      'lab/component/evals-lab',
      'lab/component/harness-lab',
      'lab/component/labs-app',
      'lab/component/nxtlvl-labs-plugin',
      'lab/component/nxtlvl-wiki-mcp',
      'wiki/component/analytics',
      'wiki/component/corpus',
      'wiki/component/nxtlvl-wiki-mcp',
      'wiki/component/nxtlvl-wiki-plugin',
    ],
    representativeCapabilities: [
      'core/skill/pointer-summary',
      'lab/mcp-server/lab-wiki-model-context-protocol-server',
      'wiki/skill/query',
    ],
    developmentTargets: [
      ['core/skill/pointer-summary', 'plugins/nxtlvl/skills/pointer-summary'],
      ['core/skill/skill-creator', 'plugins/nxtlvl/skills/skill-creator'],
      ['core/skill/thinking-archetypes', 'plugins/nxtlvl/skills/thinking-archetypes'],
    ],
    findingCodes: [],
  });
});
