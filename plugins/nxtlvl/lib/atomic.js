// atomic — path-AGNOSTIC write primitives shared by the whole C&M subsystem.
//
// The obs-log, instinct store, and bookmark trail all build on these. This module
// knows NOTHING about the storage layout (that is paths.js's job): every function
// takes an absolute target path and operates on it. It owns two spec §7 invariants:
//
//   §7-b Write-atomicity — every write to a shared store is atomic (tmp + rename),
//        so a crashed or concurrent writer can never leave a torn, half-written, or
//        lost-update file. A crash mid-write leaves the *previous* target intact.
//   §7-a Liveness — a hook or background observer that dies leaves a one-line
//        heartbeat record. The liveness writer is BOUNDED and NEVER throws: a silent
//        death is a fault to surface, never an exception that propagates.
//
// The tmp+rename+unlink-on-error idiom is productionized from context-alert.js's
// writeState() and cm-phase0-workspace/identity.js's atomicWrite() (Spike 0.5).

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Bound the serialized liveness line so a fat record can never balloon the log.
const MAX_LIVENESS_LEN = 1000;

// --- Atomic whole-file write (§7-b) -----------------------------------------
// mkdir -p the parent, write to a per-writer unique tmp file, then rename it over
// the target. rename(2) is atomic on a single filesystem, so a reader sees either
// the old file or the new one in full — never a torn mix. On any error, best-effort
// unlink the tmp (no residue) and rethrow. Leaves NO .tmp.* residue on success.
function atomicWrite(target, data) {
  const dir = path.dirname(target);
  fs.mkdirSync(dir, { recursive: true });
  // pid + random suffix => collision-proof even under concurrent writers / restarts.
  const tmp = path.join(
    dir,
    `.${path.basename(target)}.tmp.${process.pid}.${crypto.randomBytes(6).toString('hex')}`,
  );
  try {
    fs.writeFileSync(tmp, data);
    fs.renameSync(tmp, target); // atomic on the same filesystem
  } catch (err) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* best effort — the tmp may never have been created */
    }
    throw err;
  }
  return target;
}

// --- Append one line (§7-b, for JSONL stores) -------------------------------
// mkdir -p the parent and append `line` + '\n' in a single appendFileSync call,
// which opens O_APPEND — atomic for small lines on a local FS, so concurrent
// appenders never interleave a partial record. Embedded newlines are stripped so a
// JSONL line stays exactly one physical line.
function appendLine(target, line) {
  const dir = path.dirname(target);
  fs.mkdirSync(dir, { recursive: true });
  const oneLine = String(line).replace(/\r?\n/g, ' ');
  fs.appendFileSync(target, oneLine + '\n');
}

// --- Liveness heartbeat (§7-a) ----------------------------------------------
// Append ONE bounded single-line JSON heartbeat. EVERYTHING is wrapped in try/catch
// so it NEVER throws: an un-stringifiable record, an unwritable path, a missing
// parent — all fail toward silence (return, never propagate). A dead writer leaving
// no heartbeat is itself the signal to surface; it must not become an exception that
// takes down the caller.
function writeLiveness(target, record) {
  try {
    const payload = { ts: new Date().toISOString(), ...record };
    let line = JSON.stringify(payload);
    if (line.length > MAX_LIVENESS_LEN) {
      line = line.slice(0, MAX_LIVENESS_LEN);
    }
    const dir = path.dirname(target);
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(target, line + '\n');
  } catch {
    // fail toward silence — never throw from the liveness writer.
  }
}

module.exports = {
  atomicWrite,
  appendLine,
  writeLiveness,
};
