#!/usr/bin/env node
/**
 * nxtlvl capture hook  —  PreToolUse + PostToolUse matcher: *
 *
 * Silently records every tool call into the per-project observation log.
 * Three composed libs do the real work:
 *   scrub.js             — secret-scrubbing (fail-CLOSED: dropped obs never persists)
 *   obs-log.js           — append-only JSONL observation log
 *   project-identity.js  — deterministic project key from cwd
 *
 * This hook emits NOTHING to the agent. It is purely a write side-effect.
 *
 * Skip guards (never capture these):
 *   NXTLVL_CM_CAPTURE=off/0/false/no/disabled  — kill switch
 *   NXTLVL_CM_OBSERVER=<any truthy>            — observer subprocess (self-watch loop)
 *   isSidechain=true in the event payload      — subagent/Task turns
 *
 * Truncation: tool_input and tool_response are truncated to MAX_FIELD_CHARS (5000)
 * before scrubbing to bound memory and regex runtime.
 *
 * FAIL-OPEN IS ABSOLUTE: every path exits 0 and emits '' (no-op). Any error
 * (bad JSON, missing lib, disk error, scrub throw) is swallowed silently.
 */

'use strict';

const { safeScrubObservation } = require('../lib/scrub.js');
const obsLog = require('../lib/obs-log.js');
const { projectIdentity } = require('../lib/project-identity.js');

// --- Constants ----------------------------------------------------------------

/** Truncate each raw payload field to this many chars before scrubbing. */
const MAX_FIELD_CHARS = 5000;

/** Max bytes to read from stdin. */
const MAX_STDIN = 4 * 1024 * 1024;

/** Values that disable the hook. */
const OFF_VALUES = ['0', 'false', 'no', 'off', 'disabled'];

// --- Helpers ------------------------------------------------------------------

/** True when an env value reads as an explicit off/disable switch. */
function isOffLike(raw) {
  return OFF_VALUES.includes(String(raw || '').trim().toLowerCase());
}

function isCaptureDisabled(env) {
  return isOffLike(env.NXTLVL_CM_CAPTURE);
}

function isObserverRun(env) {
  // The observer subprocess sets NXTLVL_CM_OBSERVER to a non-empty truthy string.
  const v = env.NXTLVL_CM_OBSERVER;
  return v && !isOffLike(v);
}

/**
 * Truncate a value to MAX_FIELD_CHARS for strings, or leave non-string values
 * (objects/arrays/null) as-is — scrub.js handles deep-scrubbing of those.
 * Truncation of object fields: JSON-serialize then truncate, so the scrubber
 * always sees a string and we honour the 5k bound on storage size.
 */
function truncateField(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    return value.length > MAX_FIELD_CHARS ? value.slice(0, MAX_FIELD_CHARS) : value;
  }
  // object / array / number / boolean — serialize to string and truncate
  let s;
  try {
    s = JSON.stringify(value);
  } catch {
    s = String(value);
  }
  return s.length > MAX_FIELD_CHARS ? s.slice(0, MAX_FIELD_CHARS) : s;
}

// --- Core --------------------------------------------------------------------

/**
 * @param {string} rawInput    - Hook event JSON from stdin
 * @param {object} env         - process.env (or test substitute)
 * @param {Function} [scrubFn] - Optional injected scrubber (defaults to safeScrubObservation).
 *                               Accepts an obs object; returns { dropped, record } or { dropped: true }.
 *                               The default is the real scrubber; tests may inject a forced-drop
 *                               function to verify the fail-CLOSED path end-to-end through capture.
 * @returns {string}           - Always '' (capture is silent; no additionalContext)
 */
function run(rawInput, env = process.env, scrubFn = safeScrubObservation) {
  try {
    // Kill switch
    if (isCaptureDisabled(env)) return '';

    // Observer self-watch guard
    if (isObserverRun(env)) return '';

    // Parse event
    const input = rawInput && rawInput.trim() ? JSON.parse(rawInput) : {};

    // Subagent/sidechain guard.
    // Signal used: `isSidechain === true` on the event payload — the same flag
    // context-alert.js reads from transcript lines (line 114 of that file).
    // Claude Code sets this field on Tool-use events that originate inside a
    // spawned Task/subagent so the main hook can distinguish main-thread vs
    // sidechain execution.  If the field is absent (undefined/false) we proceed.
    // Residual: there is no in-payload signal to detect non-interactive automated
    // sessions (e.g. a CI `claude -p` run without a session_id).  Best-effort:
    // if session_id is absent and transcript_path is absent we treat it as
    // non-interactive and skip.
    if (input.isSidechain === true) return '';
    if (!input.session_id && !input.transcript_path) return '';

    const hookEvent = input.hook_event_name; // "PreToolUse" | "PostToolUse"
    const toolName  = input.tool_name ?? null;
    const cwd       = input.cwd || process.cwd();

    // Determine event type
    const isPost  = hookEvent === 'PostToolUse';
    const isPre   = hookEvent === 'PreToolUse';
    if (!isPre && !isPost) return ''; // unknown event — skip

    // Truncate raw payloads before scrubbing
    const rawInputField    = isPre  ? truncateField(input.tool_input)    : null;
    const rawOutputField   = isPost ? truncateField(input.tool_response) : null;

    // Build the pre-scrub observation in the obs-log shape
    const preScrubObs = {
      event:       isPre ? 'tool_start' : 'tool_complete',
      tool:        toolName,
      // Capture gates the off-phase field to null here; obs-log.append also hard-normalises it
      // (obs-log.js ~line 137-138) so the null is enforced at two layers — intentional defense.
      input:       rawInputField,
      output:      rawOutputField,
      session:     input.session_id ?? null,
      tool_use_id: input.tool_use_id ?? null,
      cwd,
    };

    // Scrub — fail-CLOSED: drop on any scrub failure
    const result = scrubFn(preScrubObs);
    if (result.dropped) return '';

    // Resolve project identity from cwd
    const identity = projectIdentity(cwd);

    // Append to log — best-effort; a disk error is swallowed
    obsLog.append(identity.key, result.record);
  } catch {
    // Fail-open: never block or alter a tool call
  }
  return '';
}

// --- stdin entrypoint --------------------------------------------------------

if (require.main === module) {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    if (data.length < MAX_STDIN) data += chunk.substring(0, MAX_STDIN - data.length);
  });
  process.stdin.on('end', () => {
    run(data);
    process.exit(0);
  });
}

// --- Exports (for testing) ---------------------------------------------------

module.exports = {
  run,
  isOffLike,
  isCaptureDisabled,
  isObserverRun,
  truncateField,
  MAX_FIELD_CHARS,
};
