// evolve tests — verification = `node --test "plugins/nxtlvl/lib/evolve.test.js"` green.
// Acceptance criteria (C&M Phase 5, Task 5.4a):
//  - deterministic: two calls same args → deepStrictEqual
//  - skill: ≥2 strong same-topic → type:"skill"
//  - agent: ≥3 strong same-topic (avg raw ≥0.75) → type:"agent", NOT also a skill
//  - command: singleton strong domain:"workflow" → type:"command"
//  - strong bar honored: raw confidence < 0.8 excluded from clustering
//  - clustering: two habits sharing a domain topic land in the same cluster
//  - non-candidate: singleton non-workflow strong instinct → no candidate emitted
//  - total order: agents→skills→commands, then size, conf, clusterKey
//  - empty/insufficient store → { candidates: [], considered, total } no crash
//
// Clustering keys on the domain topic (ADAPTATION 4) and the strong bar reads
// RAW confidence (ADAPTATION 5) — age never makes an established instinct
// ineligible to graduate. Both are covered below.
//
// Hermetic: all writes under os.tmpdir() via XDG_STATE_HOME injection.

'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

const { evolve, normalizeDomain } = require('./evolve.js');
const { write } = require('./instincts.js');
const { layout } = require('./paths.ts');
const { atomicWrite } = require('./atomic.js');

// --- Hermetic tmp store -------------------------------------------------------
const _tmpDirs = [];
function mkTmp() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-evolve-'));
  _tmpDirs.push(d);
  return d;
}
function freshEnv() {
  return { XDG_STATE_HOME: mkTmp() };
}
const HOME = '/home/u';

after(() => {
  for (const d of _tmpDirs) {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

// Fixed clock: a known timestamp, used to seed deliberately stale instincts.
const T0 = Date.parse('2026-06-20T10:00:00.000Z');
const DAY = 86400000;

// Helpers to build instinct objects. Clustering keys on `domain`, so every
// instinct here carries one; `trigger` is now free text that never affects
// clustering.
function inst(id, trigger, confidence, domain, overrides = {}) {
  return {
    id,
    trigger,
    confidence,
    domain,
    scope: 'project',
    project_id: 'test-proj',
    source: 'observer',
    reinforcements: 1,
    action: 'do the thing',
    evidence: '- evidence',
    updated: new Date(T0).toISOString(),
    ...overrides,
  };
}

// Write a batch of instinct objects into env store.
function seedAll(instincts, env) {
  for (const i of instincts) {
    write(i, env, HOME);
  }
}

// Write an instinct with an EXACT `updated` timestamp, bypassing write()'s restamping.
// Used to seed intentionally stale instincts for the age-independence test.
// Computes the filepath via layout, then writes a raw Markdown file.
function writeWithTimestamp(inst, updatedISO, env) {
  const { projectInstinctsDir, globalInstinctsDir } = layout(inst.project_id || '_global_', env, HOME);
  const dir = inst.scope === 'global' ? globalInstinctsDir : projectInstinctsDir;
  fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, `${inst.id}.md`);
  const created = inst.created || updatedISO;
  const content = [
    '---',
    `id: ${inst.id}`,
    `trigger: ${inst.trigger}`,
    `confidence: ${inst.confidence}`,
    `domain: ${inst.domain}`,
    `scope: ${inst.scope}`,
    inst.scope !== 'global' ? `project_id: ${inst.project_id}` : null,
    `source: ${inst.source || 'observer'}`,
    `created: ${created}`,
    `updated: ${updatedISO}`,
    `reinforcements: ${inst.reinforcements || 0}`,
    '---',
    '',
    '## Action',
    inst.action || 'do the thing',
    '',
    '## Evidence',
    inst.evidence || '- evidence',
    '',
  ].filter((line) => line !== null).join('\n');
  atomicWrite(filepath, content);
}

// =============================================================================
// normalizeDomain unit tests
// =============================================================================

test('normalizeDomain: empty/null/undefined → ""', () => {
  assert.equal(normalizeDomain(''), '');
  assert.equal(normalizeDomain(null), '');
  assert.equal(normalizeDomain(undefined), '');
});

test('normalizeDomain: takes the first two words of the topic', () => {
  assert.equal(normalizeDomain('multi-cli compiler / codex config re-serialization'), 'multi-cli compiler');
});

test('normalizeDomain: the "/" separator folds away, it never joins the key', () => {
  // Without the separator being folded to whitespace, a one-word topic would
  // absorb "/" as its second word.
  assert.equal(normalizeDomain('shell / pipe handling'), 'shell pipe');
});

test('normalizeDomain: hyphenated words stay one word', () => {
  // "multi-cli" must not split into "multi" + "cli", which would make the key
  // "multi cli" and silently merge unrelated topics.
  assert.equal(normalizeDomain('multi-cli review'), 'multi-cli review');
});

test('normalizeDomain: single-word domain returns that word', () => {
  assert.equal(normalizeDomain('workflow'), 'workflow');
});

test('normalizeDomain: lowercases the input', () => {
  assert.equal(normalizeDomain('Git Workflow / Branch Landing'), 'git workflow');
});

test('normalizeDomain: collapses internal whitespace', () => {
  assert.equal(normalizeDomain('   git    workflow   / landing  '), 'git workflow');
});

test('normalizeDomain: word-fragments with no letter or digit are dropped', () => {
  // A leading separator must not become the first "word" of the key.
  assert.equal(normalizeDomain('/ - git workflow'), 'git workflow');
  assert.equal(normalizeDomain('/ - —'), '');
});

test('normalizeDomain: two domains sharing a topic produce the same key', () => {
  assert.equal(
    normalizeDomain('codebase map authoring / skill count verification'),
    normalizeDomain('codebase map state file / post-refresh hash'),
  );
});

test('normalizeDomain: sibling topics under a shared first word stay distinct', () => {
  assert.notEqual(
    normalizeDomain('multi-cli compiler / apply directory handling'),
    normalizeDomain('multi-cli review / response file recovery'),
  );
});

// =============================================================================
// evolve — empty / insufficient store
// =============================================================================

test('evolve: empty store → { candidates: [], considered: 0, total: 0 }', () => {
  const env = freshEnv();
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.deepStrictEqual(result, { candidates: [], considered: 0, total: 0 });
});

test('evolve: all instincts below strong bar → candidates: [], considered: 0', () => {
  const env = freshEnv();
  seedAll([
    inst('a', 'trigger a', 0.5, 'shell scripting / a'),
    inst('b', 'trigger b', 0.5, 'shell scripting / b'),
    inst('c', 'trigger c', 0.5, 'shell scripting / c'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.candidates.length, 0);
  assert.equal(result.considered, 0);
  assert.equal(result.total, 3);
});

// =============================================================================
// evolve — strong bar honored
// =============================================================================

test('strong bar: two same-topic instincts where one is below bar → not a skill', () => {
  const env = freshEnv();
  seedAll([
    inst('strong-one', 'trigger a', 0.9, 'test running / a'),
    inst('weak-one', 'trigger b', 0.5, 'test running / b'), // below 0.8
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  // Only one strong instinct in the cluster → singleton non-workflow → no candidate.
  assert.equal(result.candidates.length, 0);
  assert.equal(result.considered, 1);
  assert.equal(result.total, 2);
});

test('strong bar reads RAW confidence: a stale instinct is still eligible (ADAPTATION 5)', () => {
  const env = freshEnv();
  // Both raw 0.9. One was last reinforced 60 days before T0 — two half-lives, so
  // its effective confidence is ~0.225. Under the old decayed-confidence gate it
  // was excluded and the pair could never form a cluster; under the raw gate age
  // is irrelevant and the two graduate together.
  const oldUpdated = new Date(T0 - 60 * DAY).toISOString();
  writeWithTimestamp(inst('stale-one', 'trigger a', 0.9, 'test running / a'), oldUpdated, env);
  writeWithTimestamp(inst('fresh-one', 'trigger b', 0.9, 'test running / b'), new Date(T0).toISOString(), env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.considered, 2, 'age must not shrink the considered set');
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].type, 'skill');
  assert.deepStrictEqual(result.candidates[0].instinctIds, ['fresh-one', 'stale-one']);
});

test('a `now` key is accepted and changes nothing (evolve does no time math)', () => {
  const env = freshEnv();
  seedAll([
    inst('nw-a', 'trigger a', 0.9, 'test running / a'),
    inst('nw-b', 'trigger b', 0.85, 'test running / b'),
  ], env);
  const withoutNow = evolve({ projectId: 'test-proj' }, env, HOME);
  const withNow = evolve({ projectId: 'test-proj', now: T0 + 400 * DAY }, env, HOME);
  assert.deepStrictEqual(withNow, withoutNow);
});

// =============================================================================
// evolve — skill candidate
// =============================================================================

test('skill: ≥2 strong same-topic → type:"skill"', () => {
  const env = freshEnv();
  seedAll([
    inst('sk-a', 'trigger a', 0.9, 'test running / a'),
    inst('sk-b', 'trigger b', 0.85, 'test running / b'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.candidates.length, 1);
  const cand = result.candidates[0];
  assert.equal(cand.type, 'skill');
  assert.equal(cand.size, 2);
  assert.equal(cand.clusterKey, 'test running');
  assert.deepStrictEqual(cand.instinctIds, ['sk-a', 'sk-b']);
  assert.equal(result.considered, 2);
});

// =============================================================================
// evolve — agent candidate (NOT also a skill — partition)
// =============================================================================

test('agent: ≥3 strong same-topic (avg raw ≥0.75) → type:"agent", not also a skill', () => {
  const env = freshEnv();
  seedAll([
    inst('ag-a', 'trigger a', 0.9, 'deploy pipeline / a'),
    inst('ag-b', 'trigger b', 0.85, 'deploy pipeline / b'),
    inst('ag-c', 'trigger c', 0.88, 'deploy pipeline / c'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.candidates.length, 1);
  const cand = result.candidates[0];
  assert.equal(cand.type, 'agent');
  assert.equal(cand.size, 3);
  assert.deepStrictEqual(cand.instinctIds, ['ag-a', 'ag-b', 'ag-c']);
});

// =============================================================================
// evolve — command candidate
// =============================================================================

test('command: singleton strong domain:"workflow" → type:"command"', () => {
  const env = freshEnv();
  seedAll([
    inst('cmd-a', 'review pr', 0.9, 'workflow'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.candidates.length, 1);
  const cand = result.candidates[0];
  assert.equal(cand.type, 'command');
  assert.equal(cand.size, 1);
  assert.deepStrictEqual(cand.instinctIds, ['cmd-a']);
});

// =============================================================================
// evolve — non-candidates
// =============================================================================

test('non-candidate: singleton strong non-workflow instinct → no candidate emitted', () => {
  const env = freshEnv();
  seedAll([
    inst('lone-a', 'unique trigger', 0.95, 'shell scripting / a'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.candidates.length, 0);
  assert.equal(result.considered, 1);
  assert.equal(result.total, 1);
});

test('non-candidate: domainless strong instincts do not pool into a fabricated cluster', () => {
  const env = freshEnv();
  // Two unrelated habits with no usable domain. They must NOT cluster together
  // just because both normalize to the empty key. Still counted in `considered`.
  seedAll([
    inst('nd-a', 'trigger a', 0.9, ''),
    inst('nd-b', 'trigger b', 0.9, '/ -'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.considered, 2);
  assert.equal(result.candidates.length, 0);
});

// =============================================================================
// evolve — domain-topic clustering
// =============================================================================

test('clustering: different specifics under one topic land in the same cluster', () => {
  const env = freshEnv();
  // The whole point of ADAPTATION 4: these two have completely different
  // trigger sentences and different domain suffixes, but one shared topic.
  seedAll([
    inst('cl-a', 'when the compiler re-serializes a config file', 0.9,
      'multi-cli compiler / codex config re-serialization'),
    inst('cl-b', 'when extending apply() for a new symlink action kind', 0.88,
      'multi-cli compiler / apply directory handling'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].size, 2);
  assert.equal(result.candidates[0].clusterKey, 'multi-cli compiler');
});

test('clustering: sibling topics sharing a first word stay in separate clusters', () => {
  const env = freshEnv();
  seedAll([
    inst('sep-a', 'trigger a', 0.9, 'multi-cli compiler / a'),
    inst('sep-b', 'trigger b', 0.9, 'multi-cli compiler / b'),
    inst('sep-c', 'trigger c', 0.9, 'multi-cli review / c'),
    inst('sep-d', 'trigger d', 0.9, 'multi-cli review / d'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.candidates.length, 2);
  assert.deepStrictEqual(
    result.candidates.map((c) => c.clusterKey).sort(),
    ['multi-cli compiler', 'multi-cli review'],
  );
});

// =============================================================================
// evolve — domains field
// =============================================================================

test('domains: distinct sorted ascending from member instincts', () => {
  const env = freshEnv();
  seedAll([
    inst('dom-a', 'trigger a', 0.9, 'deploy pipeline / shell'),
    inst('dom-b', 'trigger b', 0.85, 'deploy pipeline / audit'),
    inst('dom-c', 'trigger c', 0.88, 'deploy pipeline / shell'), // duplicate domain
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  const cand = result.candidates[0];
  assert.deepStrictEqual(cand.domains, ['deploy pipeline / audit', 'deploy pipeline / shell']);
});

test('domains: ascending sort holds on a skill cluster too (not just agents)', () => {
  // The domains-sort assertion above only exercised an agent cluster (size 3).
  // Verify the same ordering on a size-2 SKILL cluster, with domains seeded in
  // reverse order so the ascending sort is genuinely exercised.
  const env = freshEnv();
  seedAll([
    inst('sd-a', 'trigger a', 0.9, 'ship release / zulu'),
    inst('sd-b', 'trigger b', 0.85, 'ship release / alpha'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].type, 'skill');
  assert.deepStrictEqual(
    result.candidates[0].domains,
    ['ship release / alpha', 'ship release / zulu'],
  );
});

test('instinctIds: ascending sort holds when the store seeds ids in reverse order', () => {
  // instinctIds is `members.map(m => m.id).sort()`. Seed ids in descending order
  // so the .sort() must reorder them — guards against the sort being silently
  // unnecessary (and thus untested) because upstream already returned them sorted.
  const env = freshEnv();
  seedAll([
    inst('zulu-id', 'trigger a', 0.9, 'cluster me / a'),
    inst('mike-id', 'trigger b', 0.88, 'cluster me / b'),
    inst('alpha-id', 'trigger c', 0.87, 'cluster me / c'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.candidates.length, 1);
  assert.deepStrictEqual(
    result.candidates[0].instinctIds,
    ['alpha-id', 'mike-id', 'zulu-id'],
    'instinctIds must be ascending regardless of store insertion order',
  );
});

// =============================================================================
// evolve — total ordering
// =============================================================================

test('total order: agents before skills before commands', () => {
  const env = freshEnv();
  seedAll([
    // skill cluster (2 instincts)
    inst('sk-x', 'trigger a', 0.9, 'skill topic / a'),
    inst('sk-y', 'trigger b', 0.85, 'skill topic / b'),
    // agent cluster (3 instincts)
    inst('ag-x', 'trigger c', 0.9, 'agent topic / a'),
    inst('ag-y', 'trigger d', 0.88, 'agent topic / b'),
    inst('ag-z', 'trigger e', 0.87, 'agent topic / c'),
    // command
    inst('cmd-x', 'trigger f', 0.9, 'workflow'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  const types = result.candidates.map((c) => c.type);
  assert.deepStrictEqual(types, ['agent', 'skill', 'command']);
});

test('total order: within same type, larger clusters first', () => {
  const env = freshEnv();
  // Use strongBar 0.65 so these pass; both clusters average < 0.75 → both skills.
  seedAll([
    inst('big-a', 'trigger a', 0.72, 'bigger topic / a'),
    inst('big-b', 'trigger b', 0.71, 'bigger topic / b'),
    inst('big-c', 'trigger c', 0.70, 'bigger topic / c'),
    inst('small-a', 'trigger d', 0.72, 'smaller topic / a'),
    inst('small-b', 'trigger e', 0.71, 'smaller topic / b'),
  ], env);
  const result = evolve({ projectId: 'test-proj', strongBar: 0.65 }, env, HOME);
  assert.equal(result.candidates.length, 2);
  assert.equal(result.candidates[0].size, 3);
  assert.equal(result.candidates[1].size, 2);
});

test('total order: same type+size, higher avgConfidence first', () => {
  const env = freshEnv();
  seedAll([
    inst('lo-a', 'trigger a', 0.82, 'low conf / a'),
    inst('lo-b', 'trigger b', 0.80, 'low conf / b'),
    inst('hi-a', 'trigger c', 0.95, 'high conf / a'),
    inst('hi-b', 'trigger d', 0.93, 'high conf / b'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.candidates.length, 2);
  // Both are skill (size 2); higher avg first.
  assert.ok(result.candidates[0].avgConfidence > result.candidates[1].avgConfidence);
  assert.deepStrictEqual(result.candidates[0].instinctIds, ['hi-a', 'hi-b']);
});

test('total order: same type+size+conf, clusterKey ascending as final tiebreak', () => {
  const env = freshEnv();
  // Two skill clusters with same avg confidence (both 0.9 raw, same size 2).
  seedAll([
    inst('zz-a', 'trigger a', 0.9, 'zzz topic / a'),
    inst('zz-b', 'trigger b', 0.9, 'zzz topic / b'),
    inst('aa-a', 'trigger c', 0.9, 'aaa topic / a'),
    inst('aa-b', 'trigger d', 0.9, 'aaa topic / b'),
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.candidates.length, 2);
  assert.equal(result.candidates[0].clusterKey, 'aaa topic');
  assert.equal(result.candidates[1].clusterKey, 'zzz topic');
});

// =============================================================================
// evolve — determinism
// =============================================================================

test('deterministic: two calls same args → deepStrictEqual', () => {
  const env = freshEnv();
  seedAll([
    inst('det-a', 'trigger a', 0.9, 'deploy pipeline / a'),
    inst('det-b', 'trigger b', 0.85, 'deploy pipeline / b'),
    inst('det-c', 'trigger c', 0.88, 'deploy pipeline / c'),
    inst('det-d', 'trigger d', 0.9, 'test running / a'),
    inst('det-e', 'trigger e', 0.82, 'test running / b'),
    inst('det-f', 'trigger f', 0.9, 'workflow'),
  ], env);
  const r1 = evolve({ projectId: 'test-proj' }, env, HOME);
  const r2 = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.deepStrictEqual(r1, r2);
});

test('deterministic: tie scenario resolves identically across runs', () => {
  const env = freshEnv();
  // Two skill clusters with identical sizes and average confidence.
  seedAll([
    inst('tie-aa', 'trigger a', 0.9, 'alpha topic / a'),
    inst('tie-ab', 'trigger b', 0.9, 'alpha topic / b'),
    inst('tie-ba', 'trigger c', 0.9, 'beta topic / a'),
    inst('tie-bb', 'trigger d', 0.9, 'beta topic / b'),
  ], env);
  const r1 = evolve({ projectId: 'test-proj' }, env, HOME);
  const r2 = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.deepStrictEqual(r1, r2);
  // Tiebreak = clusterKey ascending: "alpha topic" < "beta topic"
  assert.equal(r1.candidates[0].clusterKey, 'alpha topic');
  assert.equal(r1.candidates[1].clusterKey, 'beta topic');
});

// =============================================================================
// evolve — strongBar param override
// =============================================================================

test('strongBar override: lower bar admits more instincts', () => {
  const env = freshEnv();
  seedAll([
    inst('bar-a', 'trigger a', 0.75, 'log checking / a'), // below default 0.8 but above 0.7
    inst('bar-b', 'trigger b', 0.72, 'log checking / b'),
  ], env);
  // Default bar 0.8: both excluded.
  const r_default = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(r_default.candidates.length, 0);
  assert.equal(r_default.considered, 0);

  // Override bar to 0.65: both pass (avg ~0.735 < 0.75 → skill, not agent).
  const r_lower = evolve({ projectId: 'test-proj', strongBar: 0.65 }, env, HOME);
  assert.equal(r_lower.candidates.length, 1);
  assert.equal(r_lower.candidates[0].type, 'skill');
  assert.equal(r_lower.considered, 2);
});

// =============================================================================
// evolve — avgConfidence guard (explicit 0.75 check matters if strongBar lowered)
// =============================================================================

test('agent avgConfidence guard: ≥3 members but avg < 0.75 → skill, not agent', () => {
  const env = freshEnv();
  // strongBar 0.65 so these pass; 3 members, avg = ~0.71 < 0.75 → skill
  seedAll([
    inst('g-a', 'trigger a', 0.72, 'same topic / a'),
    inst('g-b', 'trigger b', 0.71, 'same topic / b'),
    inst('g-c', 'trigger c', 0.70, 'same topic / c'),
  ], env);
  const result = evolve({ projectId: 'test-proj', strongBar: 0.65 }, env, HOME);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].type, 'skill');
  assert.equal(result.candidates[0].size, 3);
});

// =============================================================================
// evolve — considered / total counts
// =============================================================================

test('considered and total counts are correct', () => {
  const env = freshEnv();
  seedAll([
    inst('cnt-a', 'trigger a', 0.9, 'topic one / a'),   // strong
    inst('cnt-b', 'trigger b', 0.85, 'topic one / b'),  // strong
    inst('cnt-c', 'trigger c', 0.5, 'topic two / a'),   // weak → excluded
    inst('cnt-d', 'trigger d', 0.6, 'topic three / a'), // weak → excluded
  ], env);
  const result = evolve({ projectId: 'test-proj' }, env, HOME);
  assert.equal(result.total, 4);
  assert.equal(result.considered, 2);
  assert.equal(result.candidates.length, 1); // one skill cluster
});
