'use strict';
/**
 * Unit tests for graders.js. Run: node --test bin/lib/graders.test.js
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { graders, get } = require('./graders.js');

test('exact-match returns true on equal, false on unequal', () => {
  const g = get('exact-match');
  assert.strictEqual(g(2, 2), true);
  assert.strictEqual(g(0, 0), true);
  assert.strictEqual(g(2, 0), false);
  assert.strictEqual(g('a', 'a'), true);
});

test('exact-match is strict (===): no type coercion', () => {
  const g = graders['exact-match'];
  assert.strictEqual(g(0, '0'), false);
  assert.strictEqual(g(2, '2'), false);
});

test('get returns the registered grader function', () => {
  assert.strictEqual(typeof get('exact-match'), 'function');
});

test('get throws a typed UNKNOWN_GRADER on an unknown grader', () => {
  assert.throws(() => get('nope'), (e) => e.code === 'UNKNOWN_GRADER' && /unknown grader/.test(e.message));
  assert.throws(() => get(undefined), (e) => e.code === 'UNKNOWN_GRADER');
});
