#!/usr/bin/env bash
# nxtlvl fallback-log hook  —  PreToolUse matcher: Skill|Task|Agent
#
# FAIL-OPEN IS ABSOLUTE. This hook must NEVER block or alter a session.
# Every path exits 0 and emits no decision output. Any internal error is swallowed.
#
# Role (ADR-005): the NORTH-STAR fallback log. When an `ecc:`-prefixed Skill/Task/Agent
# fires, append ONE JSONL line to the GLOBAL log ~/.claude/nxtlvl/fallback-log.jsonl:
#   { ts, session, ecc_thing, task }
# Non-ecc invocations append nothing. The log is global (spans all work, survives reinstall)
# and powers /instinct-status's fallback-rate readout (lib/metrics.js).
#
# The invoked name lives in ONE of two stdin fields (M0 spike, resolved 2026-06-17):
#   Skill            -> .tool_input.skill
#   Task/Agent       -> .tool_input.subagent_type
# Branch on which is present; append iff it starts with "ecc:".

# No `set -e`/`set -u`: a non-zero step must not abort the hook.
NXTLVL_DIR="${HOME}/.claude/nxtlvl"
LOG="${NXTLVL_DIR}/fallback-log.jsonl"

# Observer subprocess never counts as a fallback session (symmetry with the other hooks).
if [ -n "${NXTLVL_CM_OBSERVER:-}" ]; then exit 0; fi

# jq is required for injection-safe parsing; without it, fail open silently.
command -v jq >/dev/null 2>&1 || exit 0

# Consume stdin once. Never fail if it is empty.
input="$(cat 2>/dev/null)" || input=""
[ -n "${input}" ] || exit 0

ts="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" || ts=""

# jq: pull the invoked name from whichever field carries it; emit a compact JSON line
# ONLY when it starts with "ecc:". Otherwise jq's `select` yields no output -> nothing appended.
line="$(printf '%s' "${input}" | jq -c --arg ts "${ts}" '
  (.tool_input.skill // .tool_input.subagent_type // "") as $name
  | select($name | type == "string" and (startswith("ecc:")))
  | { ts: $ts, session: (.session_id // null), ecc_thing: $name, task: (.tool_input.description // .tool_name // null) }
' 2>/dev/null)" || line=""

if [ -n "${line}" ]; then
  mkdir -p "${NXTLVL_DIR}" 2>/dev/null
  # Single >> of a compact one-line JSON is atomic under PIPE_BUF (best-effort north-star log).
  printf '%s\n' "${line}" >> "${LOG}" 2>/dev/null
fi

exit 0
