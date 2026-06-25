'use strict';
/**
 * Unit tests for scorecard.js — the locked seam shape + the safety-inversion
 * invariants. Run: node --test bin/lib/scorecard.test.js
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { build, validate, ENGINE } = require('./scorecard.js');

const pass = (id) => ({ id, passed: true, score: 1.0, detail: '3/3' });
const fail = (id) => ({ id, passed: false, score: 0.5, detail: '1/2' });

// --- shape ----------------------------------------------------------------
test('build emits the superset shape with the harness-lab core keys', () => {
  const sc = build({ name: 'demo', results: [pass('a'), pass('b')], cases: { total: 6, passed: 6, failed: 0 } });
  assert.strictEqual(sc.eval, 'demo');
  assert.match(sc.engine, /^evals-lab@/);
  assert.strictEqual(sc.engine, ENGINE);
  assert.strictEqual(sc.status, 'ok');
  // core keys graduate.js reads:
  assert.ok(Array.isArray(sc.results) && sc.results.length === 2);
  assert.deepStrictEqual(sc.summary, { total: 2, passed: 2, failed: 0, allPassed: true });
  // additive provenance:
  assert.deepStrictEqual(sc.cases, { total: 6, passed: 6, failed: 0 });
  assert.deepStrictEqual(sc.failures, []);
  assert.deepStrictEqual(validate(sc).errors, []);
});

test('a result entry is normalized to exactly {id,passed,score,detail}', () => {
  const sc = build({ name: 'demo', results: [{ id: 'a', passed: true, score: 1, detail: 'x', extra: 'nope' }] });
  assert.deepStrictEqual(Object.keys(sc.results[0]).sort(), ['detail', 'id', 'passed', 'score']);
});

// --- a failing criterion ⇒ allPassed:false --------------------------------
test('a failing criterion ⇒ summary.allPassed:false (engine bites)', () => {
  const sc = build({ name: 'demo', results: [pass('a'), fail('b')] });
  assert.strictEqual(sc.summary.passed, 1);
  assert.strictEqual(sc.summary.failed, 1);
  assert.strictEqual(sc.summary.allPassed, false);
  assert.deepStrictEqual(validate(sc).errors, []);
});

// --- the safety inversion (the keystone) ----------------------------------
test('status:"error" forces results:[] + allPassed:false even if results were passed in', () => {
  const sc = build({ name: 'demo', status: 'error', results: [pass('a'), pass('b')] });
  assert.strictEqual(sc.status, 'error');
  assert.deepStrictEqual(sc.results, []);
  assert.strictEqual(sc.summary.allPassed, false);
  assert.strictEqual(sc.summary.total, 0);
  assert.deepStrictEqual(validate(sc).errors, []);
});

test('an error object forces status:"error" and a pointer-only failure (no dump)', () => {
  const sc = build({ name: 'demo', results: [pass('a')], error: new Error('adapter exploded') });
  assert.strictEqual(sc.status, 'error');
  assert.deepStrictEqual(sc.results, []);
  assert.strictEqual(sc.summary.allPassed, false);
  assert.strictEqual(sc.failures.length, 1);
  assert.strictEqual(sc.failures[0].ref, 'engine');
  assert.match(sc.failures[0].error, /adapter exploded/);
});

test('empty results ⇒ allPassed:false (zero criteria has not "all passed")', () => {
  const sc = build({ name: 'demo', results: [] });
  assert.strictEqual(sc.summary.allPassed, false);
  assert.deepStrictEqual(validate(sc).errors, []);
});

// --- failures are pointers, not dumps -------------------------------------
test('failures normalize to {ref[,criterion]} pointers', () => {
  const sc = build({
    name: 'demo',
    results: [fail('block-recall')],
    failures: [{ ref: 'corpus.jsonl:12', criterion: 'block-recall' }, 'corpus.jsonl:30'],
  });
  assert.deepStrictEqual(sc.failures[0], { ref: 'corpus.jsonl:12', criterion: 'block-recall' });
  assert.deepStrictEqual(sc.failures[1], { ref: 'corpus.jsonl:30' });
});

// --- validate is total + catches invariant violations ---------------------
test('validate is total: never throws on garbage input', () => {
  for (const bad of [null, undefined, 42, 'str', [], {}]) {
    const { errors } = validate(bad);
    assert.ok(Array.isArray(errors) && errors.length > 0, `expected errors for ${JSON.stringify(bad)}`);
  }
});

test('validate flags a hand-forged lying scorecard (error + allPassed:true)', () => {
  const lying = {
    eval: 'x', engine: 'evals-lab@0.1.0', status: 'error',
    results: [{ id: 'a', passed: true }],
    summary: { total: 1, passed: 1, failed: 0, allPassed: true },
    cases: { total: 1, passed: 1, failed: 0 }, failures: [],
  };
  const { errors } = validate(lying);
  assert.ok(errors.some((e) => /status:"error" must never have summary.allPassed:true/.test(e)));
  assert.ok(errors.some((e) => /status:"error" must carry no passing results/.test(e)));
});

test('validate flags summary counts that disagree with results', () => {
  const wrong = {
    eval: 'x', engine: 'e', status: 'ok',
    results: [{ id: 'a', passed: true }, { id: 'b', passed: false }],
    summary: { total: 2, passed: 2, failed: 0, allPassed: true }, // lies: only 1 passed
    cases: { total: 0, passed: 0, failed: 0 }, failures: [],
  };
  const { errors } = validate(wrong);
  assert.ok(errors.some((e) => /summary.passed must equal/.test(e)));
});
