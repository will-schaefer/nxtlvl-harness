'use strict';
/**
 * Unit tests for run-eval.js — the CLI. Exercises the load→evaluate→write path
 * and the exit-code contract. Writes only into $TMPDIR.
 * Run: node --test bin/run-eval.test.js
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { run, summarize, SCORECARD_NAME } = require('./run-eval.js');
const { validate } = require('./lib/scorecard.js');

const FIXTURE = path.join(__dirname, '__fixtures__', 'sample-eval');
const CLI = path.join(__dirname, 'run-eval.js');

function tmpCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'evals-cli-'));
  fs.cpSync(FIXTURE, dir, { recursive: true });
  return dir;
}

function runCli(args, opts = {}) {
  try {
    const stdout = execFileSync('node', [CLI, ...args], { encoding: 'utf8', ...opts });
    return { status: 0, stdout };
  } catch (e) {
    return { status: e.status == null ? -1 : e.status, stdout: e.stdout || '', stderr: e.stderr || '' };
  }
}

test('run() on the synthetic fixture ⇒ schema-valid scorecard, allPassed:true', () => {
  const sc = run(FIXTURE);
  assert.deepStrictEqual(validate(sc).errors, []);
  assert.strictEqual(sc.summary.allPassed, true);
  assert.strictEqual(sc.cases.total, 4);
});

test('CLI writes scorecard.json and exits 0 on a good eval', () => {
  const dir = tmpCopy();
  const { status, stdout } = runCli([dir]);
  assert.strictEqual(status, 0);
  assert.match(stdout, /allPassed: true/);
  const scPath = path.join(dir, SCORECARD_NAME);
  assert.ok(fs.existsSync(scPath), 'scorecard.json must be written');
  const sc = JSON.parse(fs.readFileSync(scPath, 'utf8'));
  assert.deepStrictEqual(validate(sc).errors, []);
  assert.strictEqual(sc.summary.allPassed, true);
});

test('CLI exits non-zero with a usage line when given no eval-dir', () => {
  const { status, stderr } = runCli([]);
  assert.notStrictEqual(status, 0);
  assert.match(stderr, /usage:/);
});

test('CLI exits non-zero when the eval dir has no eval.yaml', () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'evals-empty-'));
  const { status, stderr } = runCli([empty]);
  assert.notStrictEqual(status, 0);
  assert.match(stderr, /no eval\.yaml/);
});

test('a found-but-broken eval (malformed corpus) ⇒ status:"error" scorecard + exit 0', () => {
  const dir = tmpCopy();
  fs.writeFileSync(path.join(dir, 'corpus.jsonl'), '{"input":2,"expected":0,"tag":"even"}\n{ broken json\n');
  const { status } = runCli([dir]);
  assert.strictEqual(status, 0, 'the eval RAN to a verdict of error — still exit 0');
  const sc = JSON.parse(fs.readFileSync(path.join(dir, SCORECARD_NAME), 'utf8'));
  assert.strictEqual(sc.status, 'error');
  assert.strictEqual(sc.summary.allPassed, false);
  assert.deepStrictEqual(validate(sc).errors, []);
});

test('summarize emits pointers, never dumped case content', () => {
  const sc = run(FIXTURE);
  const text = summarize(sc);
  assert.match(text, /eval: sample-parity/);
  assert.match(text, /\[PASS\] even-rate/);
});
