import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, test } from 'node:test';

import { runParity } from './parity.ts';
import { fileSha256 } from './projectors.ts';
import { writeRegistry } from './store.ts';

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function makeDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nxtlvl-parity-'));
  temporaryDirectories.push(directory);
  return directory;
}

function write(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function fixtureProviders(root: string) {
  const claudeSettings = path.join(root, 'claude', 'settings.json');
  const codexConfig = path.join(root, 'codex', 'config.toml');
  write(claudeSettings, JSON.stringify({
    enabledPlugins: {
      'nxtlvl@nxtlvl-dev': true,
      'nxtlvl-wiki@nxtlvl-dev': false,
      'codex@openai-codex': true,
    },
    env: { SECRET: 'never-copy' },
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
  return {
    claude: { settingsPath: claudeSettings },
    codex: { configPath: codexConfig },
  };
}

test('parity candidate does not write provider files; pre/post hashes identical', () => {
  const root = makeDirectory();
  const stateRoot = path.join(root, 'state');
  const providers = fixtureProviders(root);
  const claudeBefore = fileSha256(providers.claude.settingsPath);
  const codexBefore = fileSha256(providers.codex.configPath);

  writeRegistry({
    schemaVersion: 1,
    phase: 'imported',
    desired: {
      'core/component/nxtlvl-plugin': 'active',
      'wiki/component/nxtlvl-wiki-plugin': 'benched',
    },
    appliedFingerprints: {},
  }, { env: { XDG_STATE_HOME: stateRoot }, home: '/home/u' });

  const parityDir = path.join(root, 'parity-out');
  const result = runParity({
    env: { XDG_STATE_HOME: stateRoot },
    home: '/home/u',
    claude: providers.claude,
    codex: providers.codex,
    parityDir,
    desired: {
      'core/component/nxtlvl-plugin': 'active',
      'wiki/component/nxtlvl-wiki-plugin': 'benched',
    },
    generatedAt: '2026-08-01T00:00:00.000Z',
  });

  assert.equal(result.allPassed, true);
  assert.equal(fileSha256(providers.claude.settingsPath), claudeBefore);
  assert.equal(fileSha256(providers.codex.configPath), codexBefore);
  assert.equal(result.providerHashes.claude.before, result.providerHashes.claude.after);
  assert.equal(result.providerHashes.codex.before, result.providerHashes.codex.after);

  assert.equal(fs.existsSync(path.join(parityDir, 'claude.json')), true);
  assert.equal(fs.existsSync(path.join(parityDir, 'codex.json')), true);
  assert.equal(fs.existsSync(path.join(parityDir, 'claude.candidate.json')), true);
  assert.equal(fs.existsSync(path.join(parityDir, 'codex.candidate.toml')), true);

  // Candidates land only under parityDir, never as the live provider paths.
  assert.notEqual(path.resolve(parityDir), path.resolve(path.dirname(providers.claude.settingsPath)));

  const claudeReport = JSON.parse(fs.readFileSync(path.join(parityDir, 'claude.json'), 'utf8')) as {
    passed: boolean;
    schemaVersion: number;
    provider: string;
  };
  assert.equal(claudeReport.schemaVersion, 1);
  assert.equal(claudeReport.provider, 'claude');
  assert.equal(claudeReport.passed, true);
  assert.equal(JSON.stringify(claudeReport).includes('never-copy'), false);
});

test('parity fails with mismatches when desired disagrees with observed', () => {
  const root = makeDirectory();
  const providers = fixtureProviders(root);
  const result = runParity({
    claude: providers.claude,
    codex: providers.codex,
    parityDir: path.join(root, 'parity'),
    desired: {
      'core/component/nxtlvl-plugin': 'benched',
      'wiki/component/nxtlvl-wiki-plugin': 'active',
    },
    generatedAt: '2026-08-01T00:00:00.000Z',
  });

  assert.equal(result.allPassed, false);
  assert.equal(result.reports.claude.passed, false);
  assert.ok(result.reports.claude.mismatches.length > 0);
  // Provider files still untouched.
  const settings = JSON.parse(fs.readFileSync(providers.claude.settingsPath, 'utf8')) as {
    enabledPlugins: Record<string, boolean>;
  };
  assert.equal(settings.enabledPlugins['nxtlvl@nxtlvl-dev'], true);
});
