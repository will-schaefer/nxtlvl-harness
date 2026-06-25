'use strict';
/**
 * graders.js — the grader registry.
 *
 * A grader is `(actual, expected) => boolean`. The seed ships exactly one:
 * `exact-match`. This is deliberately NOT a plugin system — predicate / regex /
 * LLM-judge graders are DEFERRED until a second eval actually needs one (YAGNI,
 * the walking skeleton's whole point).
 *
 * `get(name)` throws a typed error on an unknown grader; the engine catches it
 * and turns it into a scorecard with `status:"error"` (the safety inversion) —
 * a misconfigured grader fails toward NOT-PASSED, never a silent green light.
 */

const graders = {
  'exact-match': (actual, expected) => actual === expected,
};

/**
 * @param {string} name
 * @returns {(actual:*, expected:*) => boolean}
 * @throws {Error} typed `UNKNOWN_GRADER` when `name` is not registered
 */
function get(name) {
  const g = graders[name];
  if (typeof g !== 'function') {
    const err = new Error(`unknown grader: ${name == null ? '(none)' : name}`);
    err.code = 'UNKNOWN_GRADER';
    throw err;
  }
  return g;
}

module.exports = { graders, get };
