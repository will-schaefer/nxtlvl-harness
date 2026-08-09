'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const hook = require('./agent-tool-drift.js');

// --- workbench resolution ----------------------------------------------------
// The regression this guards: run from the installed plugin cache, the relative
// walk lands nowhere near the repos and the hook silently scanned 0 files.

test('candidateWorkbenches always offers the home-directory fallback', () => {
  const candidates = hook.candidateWorkbenches({});
  assert.ok(
    candidates.includes(path.join(os.homedir(), 'Developer', 'nxtlvl')),
    'the ~/Developer/nxtlvl fallback must be present regardless of __dirname',
  );
});

test('NXTLVL_CORE_ROOT is tried before the relative walk', () => {
  const candidates = hook.candidateWorkbenches({ NXTLVL_CORE_ROOT: '/somewhere/wb/nxtlvl-core' });
  assert.strictEqual(candidates[0], path.resolve('/somewhere/wb'));
});

test('NXTLVL_AGENT_DRIFT_REPOS overrides resolution entirely', () => {
  const roots = hook.resolveRepoRoots({ NXTLVL_AGENT_DRIFT_REPOS: '/a:/b' });
  assert.deepStrictEqual(roots, ['/a', '/b']);
});

test('familyReposUnder only counts directories holding a .git', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drift-wb-'));
  fs.mkdirSync(path.join(tmp, 'nxtlvl-core', '.git'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'nxtlvl-wiki'), { recursive: true }); // no .git
  const found = hook.familyReposUnder(tmp).map((p) => path.basename(p));
  assert.deepStrictEqual(found, ['nxtlvl-core']);
});

// --- frontmatter parsing -----------------------------------------------------
// Both formats are in live use across the family.

test('parses the JSON-array tools format', () => {
  assert.deepStrictEqual(
    hook.parseToolsLine('---\ntools: ["Read", "Grep", "Glob"]\n---\n'),
    ['Read', 'Grep', 'Glob'],
  );
});

test('parses the bare comma-list tools format', () => {
  assert.deepStrictEqual(
    hook.parseToolsLine('---\ntools: Read, Write, Skill\n---\n'),
    ['Read', 'Write', 'Skill'],
  );
});

test('returns null when there is no tools line', () => {
  assert.strictEqual(hook.parseToolsLine('---\nname: x\n---\n'), null);
});

// --- detection ---------------------------------------------------------------

test('flags foreign names and leaves mcp__ and Claude names alone', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drift-scan-'));
  const dir = path.join(tmp, 'nxtlvl-wiki', 'plugins', 'p', 'agents');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'bad.md'), 'tools: ["view_file", "run_command"]\n');
  fs.writeFileSync(path.join(dir, 'good.md'), 'tools: ["Read", "Bash"]\n');
  fs.writeFileSync(path.join(dir, 'mcp.md'), 'tools: mcp__plugin_x__search, WebFetch\n');

  const findings = hook.scan([path.join(tmp, 'nxtlvl-wiki')]);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(path.basename(findings[0].file), 'bad.md');
  assert.deepStrictEqual(findings[0].foreign, ['view_file', 'run_command']);
});

test('compiler-output trees are excluded — foreign names are correct there', () => {
  assert.ok(hook.isExcluded('/x/.agents/agents/a/agent.md'));
  assert.ok(hook.isExcluded('/x/.codex/agents/a.toml'));
  assert.ok(hook.isExcluded('/x/build/agents/gemini/a.md'));
  assert.ok(hook.isExcluded('/x/vendor/plug/agents/a.md'));
  assert.ok(!hook.isExcluded('/x/plugins/p/agents/a.md'));
});

// --- fail-open contract ------------------------------------------------------

test('kill switch silences the hook', () => {
  assert.strictEqual(hook.run('{}', { NXTLVL_AGENT_TOOL_DRIFT: 'off' }), '');
});

test('subagent sessions are skipped', () => {
  assert.strictEqual(hook.run('{"isSidechain":true}', {}), '');
});

test('malformed stdin never throws', () => {
  assert.doesNotThrow(() => hook.run('not json', { NXTLVL_AGENT_DRIFT_REPOS: '/nonexistent' }));
});
