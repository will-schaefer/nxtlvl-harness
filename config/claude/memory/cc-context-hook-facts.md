---
name: cc-context-hook-facts
description: "Claude Code platform facts for context-aware hooks — where live context size comes from, and that /compact can't be triggered programmatically."
metadata:
  node_type: memory
  type: reference
  originSessionId: d04f38f2-2d92-4957-b1c6-f8379cee9434
---

Platform facts for building context-management hooks in Claude Code (verified empirically 2026-06-17, not from docs):

- **PostToolUse (and other tool hooks) do NOT receive `context_window`.** Only the **statusline** input carries `context_window.remaining_percentage`. So a hook that wants the context number either couples to the statusline (writes it to a shared file — ecc's pattern) or derives it itself.
- **Derive live context size from `transcript_path`** (which PostToolUse *does* provide). Walk the JSONL newest-first to the last **non-sidechain** assistant turn (`type==='assistant' && isSidechain !== true`) and read `message.usage`. Live context = `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`. **Exclude `output_tokens`** — that's the reply, not context. Skipping sidechain keeps the number on the main thread, not a subagent's transient context. (Observed this session: 103K → 132K as the conversation grew.)
- **`/compact` cannot be triggered by a hook or the agent.** Only two triggers exist: the **user** typing `/compact`, or **native auto-compaction** near the cap. No hook-output field or agent tool fires it. A hook can only *instruct/recommend* via `additionalContext`; the agent winds down and prompts the user.
- **`PreCompact` hook** fires right before compaction (matchers `manual` and `auto`) and can inject instructions shaping what the summary preserves — the place to protect compaction quality.
- **Command hooks run as a FRESH process per event; the entry `run()` executes once, then the process exits.** There is NO in-memory state shared across tool calls — the only cross-invocation memory is a **persisted file** (e.g. the per-session state file in `os.tmpdir()`). Consequence for fire-once/dedup logic: an "in-process flag" cannot dedup across PostToolUse events (each is a new process). If the state write fails, the next process re-reads the unchanged file and re-fires → an alert on **every** tool call. Correct fix: have the writer report success and, on a crossing it can't persist, **stay silent** (fail toward no-op) rather than fire — a transient failure just defers the alert one call, a persistent one goes quiet. (Applied in [[nxtlvl-context-alert-hook]] via PR #1 review.)

Related: nxtlvl applies these in [[nxtlvl-context-alert-hook]]. Same family as the stdin-field platform facts in [[nxtlvl-m0-status]].
