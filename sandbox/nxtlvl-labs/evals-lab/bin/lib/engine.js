'use strict';
/**
 * engine.js — the measurement core.
 *
 *   evaluate({ spec, corpus, adapter, grader? }) -> scorecard
 *
 * PURE and TOTAL. It never throws: a thrown adapter, an unknown grader, an
 * unknown metric, a malformed criterion — anything — is caught and turned into
 * a scorecard with `status:"error"` (and therefore `summary.allPassed:false`).
 * This is THE SAFETY INVERSION: a measurement fails toward NOT-PASSED, so a bug
 * can never fake a green light. (A gate fails the opposite way — open.)
 *
 * A thrown adapter fails the WHOLE eval, not just one case: if the SUT bridge
 * throws, no measurement from it is trustworthy, so the engine reports no green.
 *
 * Inputs:
 *   spec    { name, grader, criteria: [{ id, select:{tag}, metric, bar }] }
 *   corpus  [{ input, expected, tag, label, line }]   (line: 1-indexed corpus.jsonl line)
 *   adapter { run(input) -> actual }                  (the only capability-specific glue)
 *   grader  optional (actual,expected)=>boolean       (else resolved from spec.grader)
 */

const graders = require('./graders.js');
const { build } = require('./scorecard.js');

/** Does a graded case match a criterion's `select`? Seed supports `{ tag }` only. */
function matches(c, select) {
  if (!select || typeof select !== 'object') return false; // no select ⇒ selects nothing ⇒ fails
  if (typeof select.tag === 'string') return c.tag === select.tag;
  return false; // unknown select shape ⇒ selects nothing (fail toward not-passed)
}

/** Score one criterion over the graded corpus. Returns {result, failures}. */
function scoreCriterion(crit, graded) {
  const metric = crit.metric == null ? 'pass-rate' : crit.metric;
  if (metric !== 'pass-rate') {
    const err = new Error(`unknown metric: ${metric} (criterion '${crit.id}')`);
    err.code = 'UNKNOWN_METRIC';
    throw err; // misconfigured criterion ⇒ status:error (never a silent mis-score)
  }
  const subset = graded.filter((g) => matches(g, crit.select));
  const total = subset.length;
  const passed = subset.filter((g) => g.pass).length;
  const value = total > 0 ? passed / total : 0; // empty selection measured nothing ⇒ 0
  const bar = typeof crit.bar === 'number' ? crit.bar : 1.0;
  const ok = total > 0 && value >= bar; // an empty selection never passes
  const detail = total > 0 ? `${passed}/${total} cases` : '0/0 cases (no cases matched select)';
  const failures = subset
    .filter((g) => !g.pass)
    .map((g) => ({ ref: `corpus.jsonl:${g.line}`, criterion: crit.id }));
  return { result: { id: crit.id, passed: ok, score: value, detail }, failures };
}

/**
 * @param {{spec:object, corpus:object[], adapter:object, grader?:Function}} args
 * @returns {object} scorecard (never throws)
 */
function evaluate({ spec, corpus, adapter, grader } = {}) {
  const name = spec && typeof spec.name === 'string' ? spec.name : 'unknown';
  try {
    if (!spec || typeof spec !== 'object') throw new Error('spec is missing or not an object');
    if (!Array.isArray(corpus)) throw new Error('corpus is missing or not an array');
    if (!adapter || typeof adapter.run !== 'function') throw new Error('adapter.run is not a function');
    const grade = typeof grader === 'function' ? grader : graders.get(spec.grader);

    const criteria = Array.isArray(spec.criteria) ? spec.criteria : [];
    if (criteria.length === 0) throw new Error('spec declares no criteria');

    // Grade every corpus case once. A thrown adapter here propagates ⇒ status:error.
    const graded = corpus.map((c, i) => {
      const line = Number.isFinite(c && c.line) ? c.line : i + 1;
      const actual = adapter.run(c.input);
      return { ...c, line, actual, pass: grade(actual, c.expected) === true };
    });

    const results = [];
    const failures = [];
    for (const crit of criteria) {
      if (!crit || typeof crit.id !== 'string') throw new Error('a criterion is missing a string id');
      const { result, failures: critFailures } = scoreCriterion(crit, graded);
      results.push(result);
      failures.push(...critFailures);
    }

    const casePassed = graded.filter((g) => g.pass).length;
    const cases = { total: graded.length, passed: casePassed, failed: graded.length - casePassed };

    return build({ name, status: 'ok', results, cases, failures });
  } catch (err) {
    return build({ name, status: 'error', error: err }); // status:error ⇒ allPassed:false, NEVER true
  }
}

module.exports = { evaluate, scoreCriterion, matches };
