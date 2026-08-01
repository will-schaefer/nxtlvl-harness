import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, test } from 'node:test';

import {
  applyClaudeProjection,
  applyCodexProjection,
  fileSha256,
  managedFromDesired,
  projectClaudeCandidate,
  projectCodexCandidate,
} from './projectors.ts';

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function makeDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nxtlvl-projector-'));
  temporaryDirectories.push(directory);
  return directory;
}

function write(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

test('Claude projector candidate preserves unrelated keys and env secrets', () => {
  const settings = {
    enabledPlugins: {
      'nxtlvl@nxtlvl-dev': true,
      'nxtlvl-wiki@nxtlvl-dev': false,
      'codex@openai-codex': true,
    },
    env: {
      ANTHROPIC_API_KEY: 'secret-value-must-survive',
      OTHER: 'keep-me',
    },
    permissions: { allow: ['Bash'] },
  };
  const managed = {
    'nxtlvl@nxtlvl-dev': false,
    'nxtlvl-wiki@nxtlvl-dev': true,
  };

  const projection = projectClaudeCandidate(JSON.stringify(settings, null, 2), managed);
  assert.equal(projection.findings.length, 0);
  assert.deepEqual(projection.settings.env, settings.env);
  assert.deepEqual(projection.settings.permissions, settings.permissions);
  const plugins = projection.settings.enabledPlugins as Record<string, boolean>;
  assert.equal(plugins['nxtlvl@nxtlvl-dev'], false);
  assert.equal(plugins['nxtlvl-wiki@nxtlvl-dev'], true);
  assert.equal(plugins['codex@openai-codex'], true);
  assert.equal(JSON.stringify(projection.settings).includes('secret-value-must-survive'), true);
});

test('Claude projector does not invent missing marketplace keys', () => {
  const settings = {
    enabledPlugins: {
      'nxtlvl@nxtlvl-dev': true,
    },
  };
  const managed = {
    'nxtlvl@nxtlvl-dev': false,
    'nxtlvl@nxtlvl-marketplace': true,
  };
  const projection = projectClaudeCandidate(JSON.stringify(settings), managed);
  const plugins = projection.settings.enabledPlugins as Record<string, boolean>;
  assert.equal(plugins['nxtlvl@nxtlvl-dev'], false);
  assert.equal(Object.prototype.hasOwnProperty.call(plugins, 'nxtlvl@nxtlvl-marketplace'), false);
});

test('Codex projector preserves unrelated model= line and only rewrites owned enabled', () => {
  const original = [
    'model = "example-model"',
    'model_provider = "openai"',
    '',
    '[marketplaces.nxtlvl-dev]',
    'source_type = "local"',
    'source = "/private/path"',
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
  ].join('\n');

  const managed = {
    'nxtlvl@nxtlvl-dev': false,
    'nxtlvl-wiki@nxtlvl-dev': true,
  };
  const projection = projectCodexCandidate(original, managed);
  assert.equal(projection.findings.length, 0);
  assert.match(projection.content, /^model = "example-model"$/mu);
  assert.match(projection.content, /model_provider = "openai"/u);
  assert.match(projection.content, /\[plugins\."nxtlvl@nxtlvl-dev"\]\nenabled = false/u);
  assert.match(projection.content, /\[plugins\."nxtlvl-wiki@nxtlvl-dev"\]\nenabled = true/u);
  assert.match(projection.content, /\[plugins\."codex@openai-codex"\]\nenabled = true/u);
  assert.match(projection.content, /\[marketplaces\.nxtlvl-dev\]/u);
});

test('apply Claude writes only through structured merge; hash changes only managed fields', () => {
  const root = makeDirectory();
  const settingsPath = path.join(root, 'settings.json');
  const initial = {
    enabledPlugins: {
      'nxtlvl@nxtlvl-dev': true,
      'other@marketplace': true,
    },
    env: { SECRET: 'x' },
  };
  write(settingsPath, `${JSON.stringify(initial, null, 2)}\n`);
  const before = fileSha256(settingsPath);

  const result = applyClaudeProjection(settingsPath, { 'nxtlvl@nxtlvl-dev': false });
  assert.equal(result.ok, true);
  const after = fileSha256(settingsPath);
  assert.notEqual(before, after);

  const parsed = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as {
    enabledPlugins: Record<string, boolean>;
    env: { SECRET: string };
  };
  assert.equal(parsed.enabledPlugins['nxtlvl@nxtlvl-dev'], false);
  assert.equal(parsed.enabledPlugins['other@marketplace'], true);
  assert.equal(parsed.env.SECRET, 'x');
});

test('managedFromDesired maps component state to all family plugin keys', () => {
  const managed = managedFromDesired({
    'core/component/nxtlvl-plugin': 'active',
    'wiki/component/nxtlvl-wiki-plugin': 'benched',
  });
  assert.equal(managed['nxtlvl@nxtlvl-dev'], true);
  assert.equal(managed['nxtlvl@nxtlvl-marketplace'], true);
  assert.equal(managed['nxtlvl-wiki@nxtlvl-dev'], false);
  assert.equal(managed['nxtlvl-wiki@nxtlvl-marketplace'], false);
});

test('fileSha256 is stable for identical content', () => {
  const root = makeDirectory();
  const filePath = path.join(root, 'a.txt');
  write(filePath, 'hello');
  const expected = createHash('sha256').update('hello').digest('hex');
  assert.equal(fileSha256(filePath), expected);
  assert.equal(fileSha256(path.join(root, 'missing')), '');
});
