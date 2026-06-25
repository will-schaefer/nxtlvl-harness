#!/usr/bin/env node
'use strict';
/**
 * run-eval.js — the evals-lab CLI.
 *
 *   node bin/run-eval.js <eval-dir>      # → writes <eval-dir>/scorecard.json + prints a summary
 *   npm run eval -- <eval-dir>
 *
 * Resolves the eval dir → loads eval.yaml + corpus.jsonl + the adapter → runs
 * the pure engine → writes the scorecard → prints a pointer summary.
 *
 * EXIT-CODE CONTRACT (spec §Code Style):
 *   - exit 0 when the eval RAN — regardless of pass/fail. The verdict lives in
 *     the scorecard's `summary.allPassed`, NOT in the exit code. A found-but-
 *     broken eval (bad yaml, malformed corpus, throwing adapter, unknown grader)
 *     writes a `status:"error"` scorecard and STILL exits 0.
 *   - non-zero ONLY when the CLI itself could not run: no eval-dir arg, or no
 *     readable eval.yaml at the path.
 * The gate reads the scorecard, never this exit code.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { evaluate } = require('./lib/engine.js');
const { build } = require('./lib/scorecard.js');

const SCORECARD_NAME = 'scorecard.json';

function loadSpec(dir) {
  const spec = yaml.load(fs.readFileSync(path.join(dir, 'eval.yaml'), 'utf8'));
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    throw new Error('eval.yaml did not parse to an object');
  }
  return spec;
}

function loadCorpus(dir, spec) {
  const corpusPath = path.resolve(dir, (spec && spec.corpus) || './corpus.jsonl');
  const text = fs.readFileSync(corpusPath, 'utf8');
  const corpus = [];
  text.split('\n').forEach((raw, i) => {
    const lineNo = i + 1; // 1-indexed: pointers read `corpus.jsonl:<lineNo>`
    const trimmed = raw.trim();
    if (!trimmed) return; // skip blank lines without consuming a case slot
    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch (e) {
      throw new Error(`corpus.jsonl:${lineNo} is not valid JSON: ${e.message}`);
    }
    corpus.push({ ...obj, line: lineNo });
  });
  return corpus;
}

function loadAdapter(dir, spec) {
  const adapterPath = path.resolve(dir, (spec && spec.sut && spec.sut.adapter) || './adapter.js');
  delete require.cache[require.resolve(adapterPath)]; // fresh each run (in-process test safety)
  return require(adapterPath);
}

/** Load + evaluate. A found-but-broken eval ⇒ a status:"error" scorecard, never a throw. */
function run(dir) {
  const name = path.basename(String(dir).replace(/[/\\]+$/, '')) || 'unknown';
  try {
    const spec = loadSpec(dir);
    const corpus = loadCorpus(dir, spec);
    const adapter = loadAdapter(dir, spec);
    return evaluate({ spec, corpus, adapter });
  } catch (err) {
    return build({ name, status: 'error', error: err });
  }
}

/** A pointer-style summary — never dumps case content. */
function summarize(sc) {
  const out = [];
  out.push(`eval: ${sc.eval}  ·  engine: ${sc.engine}  ·  status: ${sc.status}`);
  out.push(
    `cases: ${sc.cases.passed}/${sc.cases.total} passed  ·  ` +
      `criteria: ${sc.summary.passed}/${sc.summary.total} passed  ·  allPassed: ${sc.summary.allPassed}`
  );
  for (const r of sc.results) out.push(`  [${r.passed ? 'PASS' : 'FAIL'}] ${r.id} — ${r.detail}`);
  if (sc.failures.length) {
    out.push('failures (pointers):');
    for (const f of sc.failures) {
      out.push(`  ${f.ref}${f.criterion ? ` (${f.criterion})` : ''}${f.error ? ` — ${f.error}` : ''}`);
    }
  }
  return out.join('\n') + '\n';
}

function main(argv) {
  const dirArg = argv.find((a) => !a.startsWith('-'));
  if (!dirArg) {
    process.stderr.write('usage: node bin/run-eval.js <eval-dir>\n');
    process.exit(1);
  }
  const dir = path.resolve(process.cwd(), dirArg);
  if (!fs.existsSync(path.join(dir, 'eval.yaml'))) {
    process.stderr.write(`error: no eval.yaml under ${dirArg} (not a readable eval directory)\n`);
    process.exit(1);
  }
  const sc = run(dir);
  fs.writeFileSync(path.join(dir, SCORECARD_NAME), JSON.stringify(sc, null, 2) + '\n');
  process.stdout.write(summarize(sc));
  process.exit(0); // the eval RAN (ok or error); the verdict is in the scorecard
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { run, loadSpec, loadCorpus, loadAdapter, summarize, main, SCORECARD_NAME };
