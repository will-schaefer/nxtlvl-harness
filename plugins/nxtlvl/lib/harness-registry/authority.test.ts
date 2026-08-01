import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, test } from 'node:test';

import {
  activate,
  bench,
  checkParity,
  cutover,
  exitCodeFor,
  importObserved,
  loadRegistry,
  reconcile,
} from './authority.ts';
import { fileSha256 } from './projectors.ts';
import { writeRegistry } from './store.ts';

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function makeDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nxtlvl-authority-'));
  temporaryDirectories.push(directory);
  return directory;
}

function write(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function setup(root: string) {
  const stateRoot = path.join(root, 'state');
  const claudeSettings = path.join(root, 'claude', 'settings.json');
  const codexConfig = path.join(root, 'codex', 'config.toml');
  write(claudeSettings, JSON.stringify({
    enabledPlugins: {
      'nxtlvl@nxtlvl-dev': true,
      'nxtlvl-wiki@nxtlvl-dev': false,
      'codex@openai-codex': true,
    },
    env: { SECRET: 'keep' },
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

  const options = {
    env: { XDG_STATE_HOME: stateRoot },
    home: '/home/u',
    claude: { settingsPath: claudeSettings },
    codex: { configPath: codexConfig },
    parityDir: path.join(root, 'parity'),
  };
  return { options, claudeSettings, codexConfig, stateRoot };
}

test('import seeds desired state, phase imported, no provider write', () => {
  const root = makeDirectory();
  const { options, claudeSettings, codexConfig } = setup(root);
  const claudeBefore = fileSha256(claudeSettings);
  const codexBefore = fileSha256(codexConfig);

  const result = importObserved(options);
  assert.equal(result.ok, true);
  assert.equal(result.outcome, 'passed');
  assert.equal(result.phase, 'imported');
  assert.equal(fileSha256(claudeSettings), claudeBefore);
  assert.equal(fileSha256(codexConfig), codexBefore);

  const registry = loadRegistry(options);
  assert.equal(registry.phase, 'imported');
  assert.equal(registry.desired['core/component/nxtlvl-plugin'], 'active');
  assert.equal(registry.desired['wiki/component/nxtlvl-wiki-plugin'], 'benched');
});

test('activate before cutover is blocked', () => {
  const root = makeDirectory();
  const { options } = setup(root);
  importObserved(options);

  const result = activate('core/component/nxtlvl-plugin', options);
  assert.equal(result.ok, false);
  assert.equal(result.outcome, 'blocked');
  assert.equal(exitCodeFor(result), 2);
  assert.match(result.message ?? '', /authoritative/u);
});

test('activate external id is blocked even when authoritative', () => {
  const root = makeDirectory();
  const { options } = setup(root);
  importObserved(options);
  checkParity(options);
  cutover(options);

  const result = activate('external/component/claude-codex-openai-codex', options);
  assert.equal(result.ok, false);
  assert.equal(result.outcome, 'blocked');
  assert.equal(exitCodeFor(result), 2);
});

test('cutover blocked until parity passes; succeeds when parity passes', () => {
  const root = makeDirectory();
  const { options, claudeSettings } = setup(root);
  importObserved(options);

  // Force desired out of sync so parity fails.
  writeRegistry({
    schemaVersion: 1,
    phase: 'imported',
    desired: {
      'core/component/nxtlvl-plugin': 'benched',
      'wiki/component/nxtlvl-wiki-plugin': 'active',
    },
    appliedFingerprints: {},
  }, { env: options.env, home: options.home });

  const blocked = cutover(options);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.outcome, 'blocked');
  assert.equal(loadRegistry(options).phase, 'imported');

  // Restore matching desired via re-import.
  // Re-import is allowed from imported.
  // First fix provider to match a clean desired seed.
  write(claudeSettings, JSON.stringify({
    enabledPlugins: {
      'nxtlvl@nxtlvl-dev': true,
      'nxtlvl-wiki@nxtlvl-dev': false,
    },
  }, null, 2));
  // Reset codex similarly already matches true/false.

  const reimport = importObserved(options);
  assert.equal(reimport.ok, true);

  const parity = checkParity(options);
  assert.equal(parity.ok, true, JSON.stringify(parity));
  assert.equal(parity.phase, 'parity-ready');

  const ready = cutover(options);
  assert.equal(ready.ok, true, JSON.stringify(ready));
  assert.equal(ready.phase, 'authoritative');
  assert.equal(loadRegistry(options).phase, 'authoritative');
});

test('activate and bench after cutover apply managed fields; model line survives', () => {
  const root = makeDirectory();
  const { options, codexConfig, claudeSettings } = setup(root);
  importObserved(options);
  assert.equal(checkParity(options).ok, true);
  assert.equal(cutover(options).ok, true);

  const benchResult = bench('core/component/nxtlvl-plugin', options);
  assert.equal(benchResult.ok, true, JSON.stringify(benchResult));
  assert.equal(benchResult.deployment, 'benched');
  assert.equal(benchResult.outcome, 'passed');

  const claude = JSON.parse(fs.readFileSync(claudeSettings, 'utf8')) as {
    enabledPlugins: Record<string, boolean>;
    env: { SECRET: string };
  };
  assert.equal(claude.enabledPlugins['nxtlvl@nxtlvl-dev'], false);
  assert.equal(claude.env.SECRET, 'keep');

  const codexText = fs.readFileSync(codexConfig, 'utf8');
  assert.match(codexText, /^model = "example"$/mu);
  assert.match(codexText, /\[plugins\."nxtlvl@nxtlvl-dev"\]\nenabled = false/u);

  const activateResult = activate('core/component/nxtlvl-plugin', options);
  assert.equal(activateResult.ok, true, JSON.stringify(activateResult));
  assert.equal(activateResult.deployment, 'active');
  const claudeAfter = JSON.parse(fs.readFileSync(claudeSettings, 'utf8')) as {
    enabledPlugins: Record<string, boolean>;
  };
  assert.equal(claudeAfter.enabledPlugins['nxtlvl@nxtlvl-dev'], true);
});

test('partial apply failure → drift outcome, never false Active', () => {
  const root = makeDirectory();
  const { options, codexConfig } = setup(root);
  importObserved(options);
  assert.equal(checkParity(options).ok, true);
  assert.equal(cutover(options).ok, true);

  // Make codex config directory read-only so apply fails on codex only.
  // First ensure the file exists, then remove write on parent by replacing
  // codex path with a non-writable nested path simulation: use a directory
  // as the "file" so write fails.
  fs.rmSync(codexConfig);
  fs.mkdirSync(codexConfig, { recursive: true });

  const result = bench('wiki/component/nxtlvl-wiki-plugin', options);
  assert.equal(result.ok, false);
  assert.equal(result.outcome, 'drift');
  assert.equal(result.deployment, 'drift');
  assert.notEqual(result.deployment, 'active');
  assert.equal(exitCodeFor(result), 3);

  // Desired may update even when apply drifts.
  const registry = loadRegistry(options);
  assert.equal(registry.desired['wiki/component/nxtlvl-wiki-plugin'], 'benched');
});

test('reconcile requires authoritative phase', () => {
  const root = makeDirectory();
  const { options } = setup(root);
  importObserved(options);
  const result = reconcile(options);
  assert.equal(result.ok, false);
  assert.equal(result.outcome, 'blocked');
});

test('parity advances imported → parity-ready on pass', () => {
  const root = makeDirectory();
  const { options } = setup(root);
  importObserved(options);
  const parity = checkParity(options);
  assert.equal(parity.ok, true);
  assert.equal(parity.phase, 'parity-ready');
  assert.equal(loadRegistry(options).phase, 'parity-ready');
});
