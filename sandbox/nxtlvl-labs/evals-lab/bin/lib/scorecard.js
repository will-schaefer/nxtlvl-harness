'use strict';
/**
 * scorecard.js — build + validate the evals-lab scorecard shape.
 *
 * The scorecard is the LOCKED seam between this lab and `harness-lab`. It is a
 * SUPERSET: it carries the harness-lab core keys that `graduate.js` reads
 * unchanged — `results[]` (one per declared criterion: {id,passed,score,detail})
 * and `summary.allPassed` — PLUS evals-lab's own additive provenance:
 *   - `eval`      the eval name        (harness-lab's stub writes `cell`; an eval is not a cell)
 *   - `engine`    "evals-lab@<version>" (seam-contract.md anticipated this: "stub" now, engine later)
 *   - `status`    "ok" | "error"        (the safety-inversion field)
 *   - `cases`     case-level rollup     (criteria-level counts live in `summary`, per harness-lab semantics)
 *   - `failures[]` corpus.jsonl:line pointers — never dumped case content (house pointers-over-content rule)
 *
 * THE SAFETY INVERSION (keystone): a gate fails OPEN; a measurement fails toward
 * NOT-PASSED. `build` enforces this *structurally* — `status !== "ok"` forces
 * `results: []` and `summary.allPassed: false`, so a buggy engine can never emit
 * a green light from a crash. No call site has to remember the rule.
 *
 * Both functions are TOTAL: `build` and `validate` never throw.
 */

let ENGINE = 'evals-lab';
try {
  ENGINE = `evals-lab@${require('../../package.json').version}`;
} catch {
  /* keep the bare fallback if package.json is somehow unreadable */
}

const MAX_DETAIL = 200; // bound any string carried into the scorecard

function truncate(s, n = MAX_DETAIL) {
  const str = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return str.length > n ? `${str.slice(0, n)}…` : str;
}

/**
 * Assemble a scorecard from already-computed pieces and ENFORCE the invariants.
 *
 * @param {object}  o
 * @param {string}  o.name        the eval name
 * @param {string} [o.status]     "ok" | "error" (anything not "ok" ⇒ "error")
 * @param {object[]}[o.results]   per-criterion: { id, passed, score, detail }
 * @param {object} [o.cases]      { total, passed, failed } case-level rollup
 * @param {object[]}[o.failures]  pointer refs: { ref:"corpus.jsonl:<n>", criterion }
 * @param {*}      [o.error]      an error (presence forces status:"error")
 * @returns {object} the scorecard
 */
function build({ name, status = 'ok', results = [], cases = null, failures = [], error = null } = {}) {
  const ok = status === 'ok' && error == null;

  // Safety inversion, enforced structurally: on error NOTHING passes.
  const effResults = ok ? normalizeResults(results) : [];
  const total = effResults.length;
  const passed = effResults.filter((r) => r.passed === true).length;
  const failed = total - passed;
  const allPassed = ok && total > 0 && passed === total;

  const effFailures = ok
    ? normalizeFailures(failures)
    : [{ ref: 'engine', error: truncate(error && error.message ? error.message : error || 'evaluation error') }];

  return {
    eval: typeof name === 'string' && name ? name : 'unknown',
    engine: ENGINE,
    status: ok ? 'ok' : 'error',
    results: effResults,
    summary: { total, passed, failed, allPassed },
    cases: normalizeCases(ok ? cases : null),
    failures: effFailures,
  };
}

function normalizeResults(results) {
  if (!Array.isArray(results)) return [];
  return results.map((r) => ({
    id: typeof (r && r.id) === 'string' ? r.id : 'unknown',
    passed: (r && r.passed) === true,
    score: typeof (r && r.score) === 'number' ? r.score : null,
    detail: truncate(r && r.detail),
  }));
}

function normalizeCases(cases) {
  const c = cases && typeof cases === 'object' ? cases : {};
  const num = (v) => (Number.isFinite(v) ? v : 0);
  return { total: num(c.total), passed: num(c.passed), failed: num(c.failed) };
}

function normalizeFailures(failures) {
  if (!Array.isArray(failures)) return [];
  return failures.map((f) => {
    if (f && typeof f === 'object') {
      const out = { ref: truncate(f.ref, 80) };
      if (typeof f.criterion === 'string') out.criterion = f.criterion;
      return out;
    }
    return { ref: truncate(f, 80) };
  });
}

/**
 * Validate a scorecard's shape + invariants. TOTAL — returns {errors:[]} and
 * never throws, even on a non-object input.
 *
 * @param {*} sc
 * @returns {{errors: string[]}}
 */
function validate(sc) {
  const errors = [];
  try {
    if (!sc || typeof sc !== 'object' || Array.isArray(sc)) {
      return { errors: ['scorecard is not an object'] };
    }
    if (typeof sc.eval !== 'string' || !sc.eval) errors.push('eval must be a non-empty string');
    if (typeof sc.engine !== 'string' || !sc.engine) errors.push('engine must be a non-empty string');
    if (sc.status !== 'ok' && sc.status !== 'error') errors.push('status must be "ok" or "error"');

    if (!Array.isArray(sc.results)) {
      errors.push('results must be an array');
    } else {
      sc.results.forEach((r, i) => {
        if (!r || typeof r !== 'object') errors.push(`results[${i}] must be an object`);
        else {
          if (typeof r.id !== 'string' || !r.id) errors.push(`results[${i}].id must be a non-empty string`);
          if (typeof r.passed !== 'boolean') errors.push(`results[${i}].passed must be a boolean`);
        }
      });
    }

    const s = sc.summary;
    if (!s || typeof s !== 'object') {
      errors.push('summary must be an object');
    } else {
      for (const k of ['total', 'passed', 'failed']) {
        if (!Number.isFinite(s[k])) errors.push(`summary.${k} must be a number`);
      }
      if (typeof s.allPassed !== 'boolean') errors.push('summary.allPassed must be a boolean');
      if (Array.isArray(sc.results)) {
        if (s.total !== sc.results.length) errors.push('summary.total must equal results.length');
        const realPassed = sc.results.filter((r) => r && r.passed === true).length;
        if (s.passed !== realPassed) errors.push('summary.passed must equal the count of passed results');
        if (s.failed !== s.total - realPassed) errors.push('summary.failed must equal total - passed');
      }
    }

    const c = sc.cases;
    if (!c || typeof c !== 'object') {
      errors.push('cases must be an object');
    } else {
      for (const k of ['total', 'passed', 'failed']) {
        if (!Number.isFinite(c[k])) errors.push(`cases.${k} must be a number`);
      }
    }

    if (!Array.isArray(sc.failures)) errors.push('failures must be an array');

    // --- the safety-inversion invariants (the whole point) ---
    if (sc.status === 'error') {
      if (s && s.allPassed === true) errors.push('INVARIANT: status:"error" must never have summary.allPassed:true');
      if (Array.isArray(sc.results) && sc.results.length > 0) {
        errors.push('INVARIANT: status:"error" must carry no passing results (results must be empty)');
      }
    }
    if (s && s.allPassed === true) {
      if (sc.status !== 'ok') errors.push('INVARIANT: summary.allPassed:true requires status:"ok"');
      if (!(s.total > 0 && s.passed === s.total)) {
        errors.push('INVARIANT: summary.allPassed:true requires total>0 and every result passed');
      }
    }
  } catch (e) {
    errors.push(`validate crashed: ${e && e.message ? e.message : e}`);
  }
  return { errors };
}

module.exports = { build, validate, ENGINE };
