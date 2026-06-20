// Tests for lib/atomic.js — the path-agnostic write primitives.
//
// Hermetic: every test writes only under a fresh mkdtemp dir in os.tmpdir() and
// cleans it up in after(). node:test + node:assert/strict, run with `node --test`.

'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { atomicWrite, appendLine, writeLiveness } = require('./atomic.js');

let tmpDir;

before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nxtlvl-atomic-test-'));
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// Count leftover tmp files (.<basename>.tmp.*) in a directory.
function tmpResidue(dir) {
  return fs.readdirSync(dir).filter((n) => n.includes('.tmp.'));
}

test('atomicWrite creates the file with exact contents and leaves no tmp residue', () => {
  const target = path.join(tmpDir, 'create.txt');
  const ret = atomicWrite(target, 'hello world');
  assert.equal(ret, target, 'returns the target path');
  assert.equal(fs.readFileSync(target, 'utf8'), 'hello world');
  assert.deepEqual(tmpResidue(tmpDir), [], 'no .tmp.* residue after success');
});

test('atomicWrite mkdir -p creates a missing parent directory', () => {
  const target = path.join(tmpDir, 'nested', 'deep', 'file.json');
  atomicWrite(target, '{"ok":true}');
  assert.equal(fs.readFileSync(target, 'utf8'), '{"ok":true}');
});

test('atomicWrite overwrites cleanly (first then second -> second)', () => {
  const target = path.join(tmpDir, 'overwrite.txt');
  atomicWrite(target, 'first');
  atomicWrite(target, 'second');
  assert.equal(fs.readFileSync(target, 'utf8'), 'second');
  assert.deepEqual(tmpResidue(path.dirname(target)), []);
});

test('atomicWrite under concurrency: file is exactly one full value, no torn mix, no residue', async () => {
  const dir = fs.mkdtempSync(path.join(tmpDir, 'concurrency-'));
  const target = path.join(dir, 'shared.txt');

  const N = 50;
  // Distinct valid contents, each a fixed, recognizable length.
  const values = Array.from({ length: N }, (_, i) => `value-${String(i).padStart(4, '0')}-`.repeat(40));
  const valueSet = new Set(values);

  await Promise.all(values.map((v) => Promise.resolve().then(() => atomicWrite(target, v))));

  const finalContents = fs.readFileSync(target, 'utf8');
  // The winner must be ONE of the written values in full — never a torn concatenation.
  assert.ok(valueSet.has(finalContents), 'final file is exactly one of the written values in full');
  // Every written value has the same length; a torn file would differ.
  assert.equal(finalContents.length, values[0].length, 'final file length matches a single write');
  assert.deepEqual(tmpResidue(dir), [], 'no tmp residue after concurrent writes');
});

test('appendLine appends newline-terminated lines and splits back into the right count', () => {
  const target = path.join(tmpDir, 'log.jsonl');
  appendLine(target, 'one');
  appendLine(target, 'two');
  appendLine(target, 'three');
  const raw = fs.readFileSync(target, 'utf8');
  assert.equal(raw, 'one\ntwo\nthree\n');
  const lines = raw.split('\n').filter((l) => l.length > 0);
  assert.equal(lines.length, 3);
});

test('appendLine strips embedded newlines so a line stays exactly one physical line', () => {
  const target = path.join(tmpDir, 'embedded.jsonl');
  appendLine(target, 'has\nan\nembedded\nnewline');
  appendLine(target, 'next');
  const lines = fs.readFileSync(target, 'utf8').split('\n').filter((l) => l.length > 0);
  assert.equal(lines.length, 2, 'embedded newlines did not create extra physical lines');
  assert.equal(lines[0], 'has an embedded newline');
  assert.equal(lines[1], 'next');
});

test('appendLine mkdir -p creates a missing parent directory', () => {
  const target = path.join(tmpDir, 'append-nested', 'log.jsonl');
  appendLine(target, 'line');
  assert.equal(fs.readFileSync(target, 'utf8'), 'line\n');
});

test('writeLiveness appends a parseable bounded JSON line containing ts', () => {
  const target = path.join(tmpDir, 'liveness.jsonl');
  writeLiveness(target, { event: 'death', pid: 1234 });
  const raw = fs.readFileSync(target, 'utf8');
  const lines = raw.split('\n').filter((l) => l.length > 0);
  assert.equal(lines.length, 1, 'exactly one physical line');
  const parsed = JSON.parse(lines[0]);
  assert.ok(typeof parsed.ts === 'string' && parsed.ts.length > 0, 'has a ts field');
  assert.equal(parsed.event, 'death');
  assert.equal(parsed.pid, 1234);
});

test('writeLiveness truncates the serialized line to the bounded length', () => {
  const target = path.join(tmpDir, 'liveness-bounded.jsonl');
  writeLiveness(target, { blob: 'x'.repeat(5000) });
  const line = fs.readFileSync(target, 'utf8').replace(/\n$/, '');
  assert.ok(line.length <= 1000, `line bounded to <=1000 chars (got ${line.length})`);
});

test('writeLiveness NEVER throws when the parent cannot be created (path under a file)', () => {
  // Create a regular file, then try to write liveness to a path *under* it — mkdir
  // on a path whose ancestor is a file fails with ENOTDIR; writeLiveness must swallow it.
  const blocker = path.join(tmpDir, 'iam-a-file');
  fs.writeFileSync(blocker, 'block');
  const target = path.join(blocker, 'sub', 'liveness.jsonl');
  assert.doesNotThrow(() => writeLiveness(target, { event: 'death' }));
});

test('writeLiveness NEVER throws on an unstringifiable circular record', () => {
  const target = path.join(tmpDir, 'liveness-circular.jsonl');
  const circular = {};
  circular.self = circular; // JSON.stringify throws TypeError on this
  assert.doesNotThrow(() => writeLiveness(target, circular));
  // And it must not have written a partial line.
  assert.equal(fs.existsSync(target), false, 'no file written when serialization fails');
});
