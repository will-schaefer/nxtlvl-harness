import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, test } from 'node:test';

import { buildSnapshot } from './snapshot.ts';
import { resolveContainedRealPath } from './discovery.ts';

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function makeRepository(owner: 'core' | 'wiki' | 'lab'): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `nxtlvl-${owner}-assembly-`));
  temporaryDirectories.push(root);
  return root;
}

function write(root: string, relativePath: string, contents = ''): void {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

test('assembles a skill bundle while isolating an invalid repository fragment', () => {
  const coreRoot = makeRepository('core');
  write(coreRoot, 'plugins/nxtlvl/skills/example/SKILL.md', '# Example\n');
  write(coreRoot, 'plugins/nxtlvl/skills/example/references/guide.md', '# Guide\n');
  write(coreRoot, 'plugins/nxtlvl/skills/example/scripts/check.ts', 'export {};\n');
  write(coreRoot, 'plugins/nxtlvl/skills/example/assets/prompt.txt', 'Prompt\n');
  write(coreRoot, 'plugins/nxtlvl/skills/example/tests/example.test.ts', 'export {};\n');
  write(coreRoot, 'plugins/nxtlvl/skills/example/evals/cases.yaml', 'cases: []\n');
  write(coreRoot, 'plugins/nxtlvl/skills/example/agents/reviewer.md', '# Reviewer\n');

  const snapshot = buildSnapshot({
    generatedAt: '2026-07-28T12:00:00.000Z',
    repositories: [
      {
        source: 'core-fixture',
        repositoryRoot: coreRoot,
        catalog: {
          schema_version: 1,
          owner: 'core',
          components: [{
            id: 'core/component/nxtlvl-plugin',
            name: 'nxtlvl plugin',
            kind: 'plugin',
            root: 'plugins/nxtlvl',
            capability_roots: [{ path: 'skills', kind: 'skill', entry: 'SKILL.md' }],
          }],
        },
      },
      {
        source: 'wiki-fixture',
        repositoryRoot: makeRepository('wiki'),
        catalog: null,
      },
    ],
  });

  assert.equal(snapshot.parityEligible, false);
  assert.deepEqual(snapshot.capabilities, [{
    id: 'core/skill/example',
    componentId: 'core/component/nxtlvl-plugin',
    name: 'example',
    kind: 'skill',
    entryPath: fs.realpathSync(path.join(coreRoot, 'plugins/nxtlvl/skills/example/SKILL.md')),
    controlMode: 'parent',
    controlId: 'core/component/nxtlvl-plugin',
    controlReason: 'Managed by the owning plugin.',
    lifecycle: 'graduated',
    deployment: 'unavailable',
    provenance: ['core-fixture'],
    evidence: { evaluations: 1, tests: 1 },
  }]);
  assert.deepEqual(
    snapshot.resources.map((resource) => [resource.kind, resource.relativePath]),
    [
      ['entry-file', 'plugins/nxtlvl/skills/example/SKILL.md'],
      ['nested-agent', 'plugins/nxtlvl/skills/example/agents/reviewer.md'],
      ['asset', 'plugins/nxtlvl/skills/example/assets/prompt.txt'],
      ['evaluation', 'plugins/nxtlvl/skills/example/evals/cases.yaml'],
      ['reference', 'plugins/nxtlvl/skills/example/references/guide.md'],
      ['helper-script', 'plugins/nxtlvl/skills/example/scripts/check.ts'],
      ['test', 'plugins/nxtlvl/skills/example/tests/example.test.ts'],
    ],
  );
  assert.ok(snapshot.findings.some((finding) => finding.code === 'catalog.invalid_type'));
});

test('assembles workflow bundles with diagram resources', () => {
  const coreRoot = makeRepository('core');
  write(coreRoot, 'plugins/nxtlvl/workflows/eval-loop/workflow.md', '# Evaluation loop\n');
  write(coreRoot, 'plugins/nxtlvl/workflows/eval-loop/diagrams/eval-loop.md', [
    '```mermaid',
    'flowchart LR',
    '  A[Draft eval] --> B[Run pack]',
    '  B --> C[Review scorecard]',
    '```',
    '',
  ].join('\n'));

  const snapshot = buildSnapshot({
    generatedAt: '2026-07-28T12:00:00.000Z',
    repositories: [{
      source: 'core-fixture',
      repositoryRoot: coreRoot,
      catalog: {
        schema_version: 1,
        owner: 'core',
        components: [{
          id: 'core/component/nxtlvl-plugin',
          name: 'nxtlvl plugin',
          kind: 'plugin',
          root: 'plugins/nxtlvl',
          capability_roots: [{ path: 'workflows', kind: 'workflow', entry: 'workflow.md' }],
        }],
      },
    }],
  });

  assert.deepEqual(snapshot.capabilities.map((capability) => [capability.id, capability.kind]), [
    ['core/workflow/eval-loop', 'workflow'],
  ]);
  assert.deepEqual(snapshot.resources.map((resource) => [resource.kind, resource.relativePath]), [
    ['entry-file', 'plugins/nxtlvl/workflows/eval-loop/workflow.md'],
    ['diagram', 'plugins/nxtlvl/workflows/eval-loop/diagrams/eval-loop.md'],
  ]);
});

test('blocks only duplicate component and capability identities', () => {
  const firstRoot = makeRepository('core');
  const secondRoot = makeRepository('core');
  write(firstRoot, 'plugins/shared/skills/repeated/SKILL.md', '# First\n');
  write(secondRoot, 'plugins/shared/skills/repeated/SKILL.md', '# Second\n');
  write(firstRoot, 'plugins/unique/commands/inspect.md', '# Inspect\n');

  const component = {
    id: 'core/component/shared',
    name: 'Shared',
    kind: 'plugin',
    root: 'plugins/shared',
    capability_roots: [{ path: 'skills', kind: 'skill', entry: 'SKILL.md' }],
  };
  const snapshot = buildSnapshot({
    generatedAt: '2026-07-28T12:00:00.000Z',
    repositories: [
      {
        source: 'first-core',
        repositoryRoot: firstRoot,
        catalog: {
          schema_version: 1,
          owner: 'core',
          components: [
            component,
            {
              id: 'core/component/unique',
              name: 'Unique',
              kind: 'plugin',
              root: 'plugins/unique',
              capability_roots: [
                { path: 'commands', kind: 'command', entry: '*.md' },
                { path: 'commands', kind: 'command', entry: '*.md' },
              ],
            },
          ],
        },
      },
      {
        source: 'second-core',
        repositoryRoot: secondRoot,
        catalog: { schema_version: 1, owner: 'core', components: [component] },
      },
    ],
  });

  assert.equal(snapshot.parityEligible, false);
  assert.deepEqual(snapshot.components.map((entry) => entry.id), ['core/component/unique']);
  assert.deepEqual(snapshot.capabilities, []);
  assert.deepEqual(snapshot.resources, []);
  assert.deepEqual(
    snapshot.findings.filter((finding) => finding.code.startsWith('catalog.duplicate_'))
      .map((finding) => [finding.code, finding.path]),
    [
      ['catalog.duplicate_capability_identity', 'core/command/inspect'],
      ['catalog.duplicate_component_identity', 'core/component/shared'],
    ],
  );
});

test('rejects traversal and symlink escapes after real-path resolution', () => {
  const coreRoot = makeRepository('core');
  const outsideRoot = makeRepository('wiki');
  write(coreRoot, 'outside.md', 'outside component\n');
  write(coreRoot, 'plugins/nxtlvl/skills/safe/SKILL.md', '# Safe\n');
  write(outsideRoot, 'secret.md', 'outside\n');
  fs.mkdirSync(path.join(coreRoot, 'plugins/nxtlvl/skills/safe/references'), { recursive: true });
  fs.symlinkSync(
    path.join(outsideRoot, 'secret.md'),
    path.join(coreRoot, 'plugins/nxtlvl/skills/safe/references/secret.md'),
  );

  const componentRoot = path.join(coreRoot, 'plugins/nxtlvl');
  assert.equal(
    resolveContainedRealPath(componentRoot, path.join(componentRoot, '..', '..', 'outside.md')),
    null,
  );

  const snapshot = buildSnapshot({
    generatedAt: '2026-07-28T12:00:00.000Z',
    repositories: [{
      source: 'core-fixture',
      repositoryRoot: coreRoot,
      catalog: {
        schema_version: 1,
        owner: 'core',
        components: [{
          id: 'core/component/nxtlvl-plugin',
          name: 'nxtlvl plugin',
          kind: 'plugin',
          root: 'plugins/nxtlvl',
          capability_roots: [{ path: 'skills', kind: 'skill', entry: 'SKILL.md' }],
        }],
      },
    }],
  });

  assert.deepEqual(snapshot.capabilities.map((capability) => capability.id), ['core/skill/safe']);
  assert.deepEqual(snapshot.resources.map((resource) => resource.relativePath), [
    'plugins/nxtlvl/skills/safe/SKILL.md',
  ]);
  assert.equal(snapshot.parityEligible, false);
  assert.ok(snapshot.findings.some((finding) => finding.code === 'resource.path_unsafe'));
});

test('exposes Model Context Protocol tools and resources without scanning dependencies', () => {
  const wikiRoot = makeRepository('wiki');
  write(wikiRoot, 'mcp/src/server.ts', 'export {};\n');
  write(wikiRoot, 'mcp/src/tools/search.ts', 'export {};\n');
  write(wikiRoot, 'mcp/src/resources/pages.ts', 'export {};\n');
  write(wikiRoot, 'mcp/node_modules/dependency/index.js', 'module.exports = {};\n');

  const snapshot = buildSnapshot({
    generatedAt: '2026-07-28T12:00:00.000Z',
    repositories: [{
      source: 'wiki-fixture',
      repositoryRoot: wikiRoot,
      catalog: {
        schema_version: 1,
        owner: 'wiki',
        components: [{
          id: 'wiki/component/nxtlvl-wiki-mcp',
          name: 'Wiki Model Context Protocol server',
          kind: 'service',
          root: 'mcp',
          capability_roots: [{ path: '.', kind: 'mcp-server', entry: 'src/server.ts' }],
          exclusions: ['node_modules/**'],
          entry_overrides: [{
            path: 'src/server.ts',
            name: 'nxtlvl-wiki Model Context Protocol server',
            control_parent: 'wiki/component/nxtlvl-wiki-mcp',
          }],
        }],
      },
    }],
  });

  assert.deepEqual(snapshot.capabilities.map((capability) => capability.id), [
    'wiki/mcp-server/nxtlvl-wiki-model-context-protocol-server',
  ]);
  assert.deepEqual(snapshot.resources.map((resource) => [resource.kind, resource.relativePath]), [
    ['entry-file', 'mcp/src/server.ts'],
    ['resource', 'mcp/src/resources/pages.ts'],
    ['tool', 'mcp/src/tools/search.ts'],
  ]);
  assert.ok(snapshot.resources.every((resource) => !resource.relativePath.includes('node_modules')));
});

test('joins a Lab cell through its literal target instead of its name', () => {
  const coreRoot = makeRepository('core');
  const wikiRoot = makeRepository('wiki');
  const labRoot = makeRepository('lab');
  write(coreRoot, 'plugins/nxtlvl/skills/same-name/SKILL.md', '# Core skill\n');
  write(wikiRoot, 'extensions/wiki/.gitkeep');
  write(labRoot, 'harness/cells/same-name/SKILL.md', '# Candidate skill\n');
  write(labRoot, 'harness/cells/same-name/evals/cases.yaml', 'cases: []\n');
  write(labRoot, 'harness/cells/same-name/manifest.yaml', [
    'name: same-name',
    'type: skill',
    'stage: pressure-test',
    'target: extensions/wiki/skills/same-name',
    '',
  ].join('\n'));

  const snapshot = buildSnapshot({
    generatedAt: '2026-07-28T12:00:00.000Z',
    repositories: [
      {
        source: 'core-fixture',
        repositoryRoot: coreRoot,
        catalog: {
          schema_version: 1,
          owner: 'core',
          components: [{
            id: 'core/component/nxtlvl-plugin',
            name: 'Core plugin',
            kind: 'plugin',
            root: 'plugins/nxtlvl',
            capability_roots: [{ path: 'skills', kind: 'skill', entry: 'SKILL.md' }],
          }],
        },
      },
      {
        source: 'wiki-fixture',
        repositoryRoot: wikiRoot,
        catalog: {
          schema_version: 1,
          owner: 'wiki',
          components: [{
            id: 'wiki/component/wiki-extension',
            name: 'Wiki extension',
            kind: 'plugin',
            root: 'extensions/wiki',
            capability_roots: [{ path: 'skills', kind: 'skill', entry: 'SKILL.md' }],
          }],
        },
      },
      {
        source: 'lab-fixture',
        repositoryRoot: labRoot,
        catalog: {
          schema_version: 1,
          owner: 'lab',
          components: [{
            id: 'lab/component/harness',
            name: 'Harness Lab',
            kind: 'subsystem',
            root: 'harness',
            capability_roots: [{ path: 'cells', kind: 'configuration-module', entry: 'manifest.yaml' }],
          }],
        },
      },
    ],
  });

  assert.deepEqual(snapshot.capabilities.map((capability) => capability.id), [
    'core/skill/same-name',
    'wiki/skill/same-name',
  ]);
  const candidate = snapshot.capabilities.find((capability) => capability.id === 'wiki/skill/same-name');
  assert.ok(candidate);
  assert.equal(candidate.componentId, 'wiki/component/wiki-extension');
  assert.equal(candidate.lifecycle, 'development');
  assert.equal(candidate.controlMode, 'parent');
  assert.equal(candidate.development?.stage, 'pressure-test');
  assert.equal(candidate.development?.target, 'extensions/wiki/skills/same-name');
  assert.ok(candidate.provenance.includes('lab-fixture'));
  assert.deepEqual(
    snapshot.resources.filter((resource) => resource.capabilityId === candidate.id)
      .map((resource) => [resource.kind, resource.relativePath]),
    [
      ['entry-file', 'harness/cells/same-name/SKILL.md'],
      ['evaluation', 'harness/cells/same-name/evals/cases.yaml'],
      ['resource', 'harness/cells/same-name/manifest.yaml'],
    ],
  );
});

test('reports unresolved and conflicting cell targets', () => {
  const wikiRoot = makeRepository('wiki');
  const labRoot = makeRepository('lab');
  write(wikiRoot, 'extensions/wiki/.gitkeep');
  for (const [name, target] of [
    ['conflicting', 'extensions/wiki/skills/conflicting'],
    ['unresolved', 'not-owned/skills/unresolved'],
  ]) {
    write(labRoot, `harness/cells/${name}/SKILL.md`, `# ${name}\n`);
    write(labRoot, `harness/cells/${name}/manifest.yaml`, [
      `name: ${name}`,
      'type: skill',
      'stage: develop',
      `target: ${target}`,
      '',
    ].join('\n'));
  }

  const snapshot = buildSnapshot({
    generatedAt: '2026-07-28T12:00:00.000Z',
    repositories: [
      {
        source: 'wiki-fixture',
        repositoryRoot: wikiRoot,
        catalog: {
          schema_version: 1,
          owner: 'wiki',
          components: [
            {
              id: 'wiki/component/extensions',
              name: 'Extensions',
              kind: 'subsystem',
              root: 'extensions',
              capability_roots: [],
            },
            {
              id: 'wiki/component/wiki-extension',
              name: 'Wiki extension',
              kind: 'plugin',
              root: 'extensions/wiki',
              capability_roots: [],
            },
          ],
        },
      },
      {
        source: 'lab-fixture',
        repositoryRoot: labRoot,
        catalog: {
          schema_version: 1,
          owner: 'lab',
          components: [{
            id: 'lab/component/harness',
            name: 'Harness Lab',
            kind: 'subsystem',
            root: 'harness',
            capability_roots: [{ path: 'cells', kind: 'configuration-module', entry: 'manifest.yaml' }],
          }],
        },
      },
    ],
  });

  assert.equal(snapshot.parityEligible, false);
  assert.deepEqual(
    snapshot.findings.filter((finding) => finding.code.startsWith('cell.target_'))
      .map((finding) => finding.code),
    ['cell.target_conflict', 'cell.target_unresolved'],
  );
});
