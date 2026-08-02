import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { after, test } from 'node:test';

import { harnessLayout } from '../paths.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.resolve(here, '../../scripts/harness-registry.ts');
const fixture = path.join(here, 'fixtures', 'snapshot-input.json');

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function makeDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nxtlvl-registry-cli-'));
  temporaryDirectories.push(directory);
  return directory;
}

function write(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function run(args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, NODE_NO_WARNINGS: '1', ...env },
  });
}

test('snapshot command emits normalized JSON from a fixture without writing state', () => {
  const stateRoot = path.join(os.tmpdir(), `nxtlvl-registry-cli-${process.pid}-${Date.now()}`);
  const result = run(['snapshot', '--fixture', fixture], { XDG_STATE_HOME: stateRoot });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  const snapshot = JSON.parse(result.stdout) as Record<string, unknown>;
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.generatedAt, '2026-07-28T12:00:00.000Z');
  assert.deepEqual(
    (snapshot.components as Array<{ id: string }>).map((component) => component.id),
    ['core/component/nxtlvl-plugin'],
  );
  assert.deepEqual(
    (snapshot.findings as Array<{ code: string; source: string }>).map((finding) => [finding.code, finding.source]),
    [
      ['component.source_missing', 'core-fixture'],
      ['catalog.invalid_type', 'wiki-fixture'],
    ],
  );
  assert.equal(fs.existsSync(stateRoot), false);
});

test('snapshot with no arguments assembles live, caches snapshot.json, and reports the registry phase', () => {
  const root = makeDirectory();
  const stateRoot = path.join(root, 'state');
  const home = path.join(root, 'home');
  const wikiRoot = path.join(root, 'wiki');
  const labRoot = path.join(root, 'lab');
  write(path.join(wikiRoot, 'nxtlvl.catalog.yaml'), 'schema_version: 1\nowner: wiki\ncomponents: []\n');
  write(path.join(labRoot, 'nxtlvl.catalog.yaml'), 'schema_version: 1\nowner: lab\ncomponents: []\n');
  write(path.join(home, '.claude', 'settings.json'), JSON.stringify({
    enabledPlugins: { 'nxtlvl@nxtlvl-dev': true },
  }));
  write(path.join(home, '.codex', 'config.toml'), '[plugins."nxtlvl@nxtlvl-dev"]\nenabled = true\n');
  const env = {
    XDG_STATE_HOME: stateRoot,
    HOME: home,
    NXTLVL_WIKI_ROOT: wikiRoot,
    NXTLVL_LAB_ROOT: labRoot,
  };

  const first = run(['snapshot'], env);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stderr, '');
  const snapshot = JSON.parse(first.stdout) as { schemaVersion: number; phase: string };
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.phase, 'catalog-only');

  const snapshotFile = harnessLayout(env, home).snapshotFile;
  const cached = JSON.parse(fs.readFileSync(snapshotFile, 'utf8')) as Record<string, unknown>;
  assert.deepEqual(cached, JSON.parse(first.stdout));

  const importResult = run(['import'], env);
  assert.equal(importResult.status, 0, importResult.stderr + importResult.stdout);

  const second = run(['snapshot'], env);
  assert.equal(second.status, 0, second.stderr);
  const refreshed = JSON.parse(second.stdout) as { phase: string };
  assert.equal(refreshed.phase, 'imported');
});

test('unknown command reports usage on stderr and exits 1', () => {
  const result = run(['unknown']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage:/);
  assert.match(result.stderr, /harness-registry snapshot/);
  assert.equal(result.stdout, '');
});

test('import and parity CLI seed state and write parity reports only under out dir', () => {
  const root = makeDirectory();
  const stateRoot = path.join(root, 'state');
  const claudeSettings = path.join(root, 'claude', 'settings.json');
  const codexConfig = path.join(root, 'codex', 'config.toml');
  const parityOut = path.join(root, 'parity');

  write(claudeSettings, JSON.stringify({
    enabledPlugins: {
      'nxtlvl@nxtlvl-dev': true,
      'nxtlvl-wiki@nxtlvl-dev': false,
    },
    env: { SECRET: 'x' },
  }, null, 2));
  write(codexConfig, [
    'model = "example"',
    '',
    '[plugins."nxtlvl@nxtlvl-dev"]',
    'enabled = true',
    '',
    '[plugins."nxtlvl-wiki@nxtlvl-dev"]',
    'enabled = false',
    '',
  ].join('\n'));

  const claudeBefore = fs.readFileSync(claudeSettings);
  const codexBefore = fs.readFileSync(codexConfig);

  const importResult = run([
    'import',
    '--claude-settings', claudeSettings,
    '--codex-config', codexConfig,
  ], { XDG_STATE_HOME: stateRoot });

  assert.equal(importResult.status, 0, importResult.stderr + importResult.stdout);
  const importBody = JSON.parse(importResult.stdout) as { ok: boolean; phase: string; operation: string };
  assert.equal(importBody.ok, true);
  assert.equal(importBody.phase, 'imported');
  assert.equal(importBody.operation, 'import');
  assert.deepEqual(fs.readFileSync(claudeSettings), claudeBefore);
  assert.deepEqual(fs.readFileSync(codexConfig), codexBefore);

  const parityResult = run([
    'parity',
    '--out', parityOut,
    '--claude-settings', claudeSettings,
    '--codex-config', codexConfig,
  ], { XDG_STATE_HOME: stateRoot });

  assert.equal(parityResult.status, 0, parityResult.stderr + parityResult.stdout);
  const parityBody = JSON.parse(parityResult.stdout) as {
    ok: boolean;
    phase: string;
    parity?: { claude?: boolean; codex?: boolean };
  };
  assert.equal(parityBody.ok, true);
  assert.equal(parityBody.phase, 'parity-ready');
  assert.equal(parityBody.parity?.claude, true);
  assert.equal(parityBody.parity?.codex, true);
  assert.equal(fs.existsSync(path.join(parityOut, 'claude.json')), true);
  assert.equal(fs.existsSync(path.join(parityOut, 'codex.json')), true);
  assert.deepEqual(fs.readFileSync(claudeSettings), claudeBefore);
  assert.deepEqual(fs.readFileSync(codexConfig), codexBefore);

  const cutoverResult = run([
    'cutover',
    '--claude-settings', claudeSettings,
    '--codex-config', codexConfig,
  ], { XDG_STATE_HOME: stateRoot });
  assert.equal(cutoverResult.status, 0, cutoverResult.stderr + cutoverResult.stdout);
  const cutoverBody = JSON.parse(cutoverResult.stdout) as { phase: string };
  assert.equal(cutoverBody.phase, 'authoritative');

  const benchResult = run([
    'bench',
    'core/component/nxtlvl-plugin',
    '--claude-settings', claudeSettings,
    '--codex-config', codexConfig,
  ], { XDG_STATE_HOME: stateRoot });
  assert.equal(benchResult.status, 0, benchResult.stderr + benchResult.stdout);
  const benchBody = JSON.parse(benchResult.stdout) as { deployment?: string; ok: boolean };
  assert.equal(benchBody.ok, true);
  assert.equal(benchBody.deployment, 'benched');

  const claudeAfter = JSON.parse(fs.readFileSync(claudeSettings, 'utf8')) as {
    enabledPlugins: Record<string, boolean>;
    env: { SECRET: string };
  };
  assert.equal(claudeAfter.enabledPlugins['nxtlvl@nxtlvl-dev'], false);
  assert.equal(claudeAfter.env.SECRET, 'x');
  assert.match(fs.readFileSync(codexConfig, 'utf8'), /model = "example"/u);
});

test('activate before cutover exits 2 with blocked outcome', () => {
  const root = makeDirectory();
  const stateRoot = path.join(root, 'state');
  const claudeSettings = path.join(root, 'claude', 'settings.json');
  const codexConfig = path.join(root, 'codex', 'config.toml');
  write(claudeSettings, JSON.stringify({ enabledPlugins: { 'nxtlvl@nxtlvl-dev': true } }));
  write(codexConfig, '[plugins."nxtlvl@nxtlvl-dev"]\nenabled = true\n');

  run([
    'import',
    '--claude-settings', claudeSettings,
    '--codex-config', codexConfig,
  ], { XDG_STATE_HOME: stateRoot });

  const result = run([
    'activate',
    'core/component/nxtlvl-plugin',
    '--claude-settings', claudeSettings,
    '--codex-config', codexConfig,
  ], { XDG_STATE_HOME: stateRoot });

  assert.equal(result.status, 2);
  const body = JSON.parse(result.stdout) as { outcome?: string; ok: boolean };
  assert.equal(body.ok, false);
  assert.equal(body.outcome, 'blocked');
});
