import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, test } from 'node:test';

import { readClaudeProvider, readCodexProvider } from './providers.ts';
import { buildSnapshot } from './snapshot.ts';

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function makeDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nxtlvl-provider-fixture-'));
  temporaryDirectories.push(directory);
  return directory;
}

function write(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function writeIn(root: string, relativePath: string, contents: string): void {
  write(path.join(root, relativePath), contents);
}

test('readClaudeProvider imports enabled plugins from sanitized fixtures', () => {
  const root = makeDirectory();
  const settingsPath = path.join(root, 'settings.json');
  const marketplacesPath = path.join(root, 'known_marketplaces.json');
  write(settingsPath, JSON.stringify({
    enabledPlugins: {
      'nxtlvl@nxtlvl-dev': true,
      'nxtlvl-wiki@nxtlvl-dev': false,
      'codex@openai-codex': true,
    },
    env: {
      SHOULD_NOT_APPEAR: 'secret-value',
    },
  }, null, 2));
  write(marketplacesPath, JSON.stringify({
    'nxtlvl-dev': {
      source: {
        source: 'file',
        path: '/private/sanitized/local/path',
      },
    },
    'openai-codex': {
      source: {
        source: 'github',
        repo: 'openai/codex-plugin-cc',
      },
    },
  }, null, 2));

  const observed = readClaudeProvider({ settingsPath, marketplacesPath });

  assert.deepEqual(observed, {
    provider: 'claude',
    plugins: [
      {
        key: 'codex@openai-codex',
        name: 'codex',
        marketplace: 'openai-codex',
        enabled: true,
        source: 'github:openai/codex-plugin-cc',
        controllable: true,
      },
      {
        key: 'nxtlvl-wiki@nxtlvl-dev',
        name: 'nxtlvl-wiki',
        marketplace: 'nxtlvl-dev',
        enabled: false,
        familyComponentId: 'wiki/component/nxtlvl-wiki-plugin',
        source: 'local',
        controllable: true,
      },
      {
        key: 'nxtlvl@nxtlvl-dev',
        name: 'nxtlvl',
        marketplace: 'nxtlvl-dev',
        enabled: true,
        familyComponentId: 'core/component/nxtlvl-plugin',
        source: 'local',
        controllable: true,
      },
    ],
    capabilities: [],
    findings: [],
  });
  assert.equal(JSON.stringify(observed).includes('secret-value'), false);
});

test('readCodexProvider imports plugins and verified self-controlled hook state', () => {
  const root = makeDirectory();
  const configPath = path.join(root, 'config.toml');
  write(configPath, [
    'model = "example"',
    '',
    '[marketplaces.nxtlvl-dev]',
    'source_type = "local"',
    'source = "/private/sanitized/nxtlvl-dev"',
    '',
    '[marketplaces.openai-codex]',
    'source_type = "git"',
    'source = "https://github.com/openai/codex-plugin-cc.git"',
    '',
    '[plugins."nxtlvl@nxtlvl-dev"]',
    'enabled = true',
    '',
    '[plugins."nxtlvl-wiki@nxtlvl-dev"]',
    'enabled = false',
    '',
    '[plugins."codex@openai-codex"]',
    'enabled = true',
    '',
    '[hooks.state."nxtlvl@nxtlvl-marketplace:hooks/hooks.json:session_start:0:0"]',
    'trusted_hash = "sha256:sanitized"',
    'enabled = true',
    '',
  ].join('\n'));

  const observed = readCodexProvider({ configPath });

  assert.deepEqual(observed.plugins.map((plugin) => [
    plugin.key,
    plugin.enabled,
    plugin.familyComponentId,
    plugin.source,
  ]), [
    ['codex@openai-codex', true, undefined, 'git:https://github.com/openai/codex-plugin-cc.git'],
    ['nxtlvl-wiki@nxtlvl-dev', false, 'wiki/component/nxtlvl-wiki-plugin', 'local'],
    ['nxtlvl@nxtlvl-dev', true, 'core/component/nxtlvl-plugin', 'local'],
  ]);
  assert.equal(observed.capabilities.length, 1);
  assert.equal(observed.capabilities[0]?.componentId, 'core/component/nxtlvl-plugin');
  assert.equal(observed.capabilities[0]?.controlMode, 'self');
  assert.equal(JSON.stringify(observed).includes('/private/sanitized/nxtlvl-dev'), false);
});

test('buildSnapshot reconciles provider state without path-only guesses or mutable external entries', () => {
  const coreRoot = makeDirectory();
  const wikiRoot = makeDirectory();
  writeIn(coreRoot, 'plugins/nxtlvl/skills/pointer-summary/SKILL.md', '# Pointer Summary\n');
  writeIn(wikiRoot, 'plugins/nxtlvl-wiki/skills/query/SKILL.md', '# Query\n');

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
        repositoryRoot: wikiRoot,
        catalog: {
          schema_version: 1,
          owner: 'wiki',
          components: [{
            id: 'wiki/component/nxtlvl-wiki-plugin',
            name: 'nxtlvl-wiki plugin',
            kind: 'plugin',
            root: 'plugins/nxtlvl-wiki',
            capability_roots: [{ path: 'skills', kind: 'skill', entry: 'SKILL.md' }],
          }],
        },
      },
    ],
    providers: [
      {
        provider: 'claude',
        plugins: [
          {
            key: 'nxtlvl@nxtlvl-dev',
            name: 'nxtlvl',
            marketplace: 'nxtlvl-dev',
            enabled: true,
            familyComponentId: 'core/component/nxtlvl-plugin',
            source: 'local',
            controllable: true,
          },
          {
            key: 'nxtlvl-wiki@nxtlvl-dev',
            name: 'nxtlvl-wiki',
            marketplace: 'nxtlvl-dev',
            enabled: false,
            familyComponentId: 'wiki/component/nxtlvl-wiki-plugin',
            source: 'local',
            controllable: true,
          },
          {
            key: 'codex@openai-codex',
            name: 'codex',
            marketplace: 'openai-codex',
            enabled: true,
            source: 'github:openai/codex-plugin-cc',
            controllable: true,
          },
        ],
        capabilities: [],
        findings: [],
      },
      {
        provider: 'codex',
        plugins: [
          {
            key: 'nxtlvl@nxtlvl-dev',
            name: 'nxtlvl',
            marketplace: 'nxtlvl-dev',
            enabled: true,
            familyComponentId: 'core/component/nxtlvl-plugin',
            source: 'local',
            controllable: true,
          },
        ],
        capabilities: [{
          id: 'core/hook/codex-session-start',
          componentId: 'core/component/nxtlvl-plugin',
          name: 'Codex session start hook',
          kind: 'hook',
          enabled: true,
          controlMode: 'self',
          controlId: 'core/hook/codex-session-start',
        }],
        findings: [],
      },
    ],
  });

  const coreSkill = snapshot.capabilities.find((capability) => capability.id === 'core/skill/pointer-summary');
  const wikiSkill = snapshot.capabilities.find((capability) => capability.id === 'wiki/skill/query');
  const codexHook = snapshot.capabilities.find((capability) => capability.id === 'core/hook/codex-session-start');
  const external = snapshot.components.find((component) => component.id === 'external/component/claude-codex-openai-codex');

  assert.equal(snapshot.phase, 'imported');
  assert.equal(coreSkill?.deployment, 'active');
  assert.equal(coreSkill?.controlMode, 'parent');
  assert.equal(coreSkill?.controlId, 'core/component/nxtlvl-plugin');
  assert.equal(wikiSkill?.deployment, 'benched');
  assert.equal(wikiSkill?.controlMode, 'parent');
  assert.equal(codexHook?.controlMode, 'self');
  assert.equal(codexHook?.deployment, 'active');
  assert.equal(external?.owner, 'external');
  assert.equal(external?.deployment, 'external');
  assert.equal(external?.controlMode, 'read-only');
});

test('conflicting provider observations mark family components as drift', () => {
  const coreRoot = makeDirectory();
  writeIn(coreRoot, 'plugins/nxtlvl/skills/pointer-summary/SKILL.md', '# Pointer Summary\n');

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
    providers: [
      {
        provider: 'claude',
        plugins: [{
          key: 'nxtlvl@nxtlvl-dev',
          name: 'nxtlvl',
          marketplace: 'nxtlvl-dev',
          enabled: true,
          familyComponentId: 'core/component/nxtlvl-plugin',
          controllable: true,
        }],
        capabilities: [],
        findings: [],
      },
      {
        provider: 'codex',
        plugins: [{
          key: 'nxtlvl@nxtlvl-dev',
          name: 'nxtlvl',
          marketplace: 'nxtlvl-dev',
          enabled: false,
          familyComponentId: 'core/component/nxtlvl-plugin',
          controllable: true,
        }],
        capabilities: [],
        findings: [],
      },
    ],
  });

  assert.equal(snapshot.components.find((component) => component.id === 'core/component/nxtlvl-plugin')?.deployment, 'drift');
  assert.equal(snapshot.capabilities.find((capability) => capability.id === 'core/skill/pointer-summary')?.deployment, 'drift');
});
