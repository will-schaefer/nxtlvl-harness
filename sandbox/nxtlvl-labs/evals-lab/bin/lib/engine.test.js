'use strict';
/**
 * Unit tests for engine.js — the KEYSTONE. Proves the engine BITES (a mutated
 * expected value reds the right criterion) and CANNOT LIE (any error yields
 * status:"error" / allPassed:false, never allPassed:true).
 * Run: node --test bin/lib/engine.test.js
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { evaluate } = require('./engine.js');
const { validate } = require('./scorecard.js');

// A synthetic SUT: classify a number's parity. n%2 → 0 even, 1 odd.
const adapter = { run: (n) => n % 2 };

// spec with two pass-rate criteria over disjoint tags
const spec = {
  name: 'sample-parity',
  grader: 'exact-match',
  criteria: [
    { id: 'even-rate', select: { tag: 'even' }, metric: 'pass-rate', bar: 1.0 },
    { id: 'odd-rate', select: { tag: 'odd' }, metric: 'pass-rate', bar: 1.0 },
  ],
};

// a clean corpus: every case's expected matches adapter.run(input)
function cleanCorpus() {
  return [
    { input: 2, expected: 0, tag: 'even', label: 'two', line: 1 },
    { input: 4, expected: 0, tag: 'even', label: 'four', line: 2 },
    { input: 3, expected: 1, tag: 'odd', label: 'three', line: 3 },
    { input: 5, expected: 1, tag: 'odd', label: 'five', line: 4 },
  ];
}

test('pass-clean: a corpus the SUT satisfies ⇒ allPassed:true, schema-valid', () => {
  const sc = evaluate({ spec, corpus: cleanCorpus(), adapter });
  assert.strictEqual(sc.status, 'ok');
  assert.strictEqual(sc.summary.allPassed, true);
  assert.deepStrictEqual(sc.cases, { total: 4, passed: 4, failed: 0 });
  assert.deepStrictEqual(sc.failures, []);
  assert.strictEqual(sc.results.length, 2);
  assert.ok(sc.results.every((r) => r.passed === true && r.score === 1));
  assert.deepStrictEqual(validate(sc).errors, []);
});

test('MUTATION BITES: flip one expected ⇒ that criterion reds, allPassed:false, pointer emitted', () => {
  const corpus = cleanCorpus();
  corpus[2].expected = 0; // line 3 is odd (3%2===1) but now claims expected 0 → must fail
  const sc = evaluate({ spec, corpus, adapter });
  assert.strictEqual(sc.status, 'ok'); // a measured failure is still a valid measurement
  assert.strictEqual(sc.summary.allPassed, false);
  const odd = sc.results.find((r) => r.id === 'odd-rate');
  const even = sc.results.find((r) => r.id === 'even-rate');
  assert.strictEqual(odd.passed, false, 'the odd criterion must red');
  assert.strictEqual(even.passed, true, 'the even criterion is untouched');
  assert.ok(sc.failures.some((f) => f.ref === 'corpus.jsonl:3' && f.criterion === 'odd-rate'),
    'the failing case must surface as a corpus.jsonl:line pointer');
  assert.deepStrictEqual(validate(sc).errors, []);
});

test('SAFETY INVERSION: a throwing adapter ⇒ status:"error", allPassed:false — NEVER allPassed:true', () => {
  const boom = { run: () => { throw new Error('adapter exploded'); } };
  const sc = evaluate({ spec, corpus: cleanCorpus(), adapter: boom });
  assert.strictEqual(sc.status, 'error');
  assert.strictEqual(sc.summary.allPassed, false);
  assert.notStrictEqual(sc.summary.allPassed, true);
  assert.deepStrictEqual(sc.results, []);
  assert.deepStrictEqual(validate(sc).errors, []);
});

test('SAFETY INVERSION: an unknown grader ⇒ status:"error" (not a crash, not a pass)', () => {
  const sc = evaluate({ spec: { ...spec, grader: 'no-such-grader' }, corpus: cleanCorpus(), adapter });
  assert.strictEqual(sc.status, 'error');
  assert.strictEqual(sc.summary.allPassed, false);
});

test('SAFETY INVERSION: an unknown metric ⇒ status:"error"', () => {
  const badSpec = { ...spec, criteria: [{ id: 'x', select: { tag: 'even' }, metric: 'f1-score', bar: 1.0 }] };
  const sc = evaluate({ spec: badSpec, corpus: cleanCorpus(), adapter });
  assert.strictEqual(sc.status, 'error');
});

test('an empty selection ⇒ that criterion is passed:false (measured nothing)', () => {
  const badSpec = { ...spec, criteria: [{ id: 'ghost', select: { tag: 'nonexistent' }, metric: 'pass-rate', bar: 1.0 }] };
  const sc = evaluate({ spec: badSpec, corpus: cleanCorpus(), adapter });
  assert.strictEqual(sc.status, 'ok');
  assert.strictEqual(sc.results[0].passed, false);
  assert.strictEqual(sc.summary.allPassed, false);
});

test('totality: garbage inputs never throw — they yield status:"error"', () => {
  for (const bad of [undefined, {}, { spec, corpus: null, adapter }, { spec, corpus: cleanCorpus(), adapter: {} }]) {
    const sc = evaluate(bad);
    assert.strictEqual(sc.status, 'error');
    assert.strictEqual(sc.summary.allPassed, false);
  }
});

test('partial credit: 1 of 2 even cases wrong ⇒ even-rate 0.5 < bar 1.0 ⇒ reds', () => {
  const corpus = cleanCorpus();
  corpus[0].expected = 1; // line 1 even (2%2===0) now claims 1 → fails; even-rate = 1/2
  const sc = evaluate({ spec, corpus, adapter });
  const even = sc.results.find((r) => r.id === 'even-rate');
  assert.strictEqual(even.score, 0.5);
  assert.strictEqual(even.passed, false);
  assert.strictEqual(even.detail, '1/2 cases');
});
