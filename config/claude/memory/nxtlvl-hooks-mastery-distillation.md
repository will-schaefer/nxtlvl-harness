---
name: nxtlvl-hooks-mastery-distillation
description: adopt/adapt/reject distillation of disler/claude-code-hooks-mastery — hook flow-control reference + read-only-validator pattern; at docs/reference/hooks-mastery-distillation.md
metadata: 
  node_type: memory
  type: reference
  originSessionId: 80fa2282-7cca-4ecb-8aa4-c40fe25c3998
---

Adopt/adapt/reject distillation of the `disler/claude-code-hooks-mastery` harness, at
`docs/reference/hooks-mastery-distillation.md` (vendored clone gitignored & disposable — only this
doc is tracked; reader-tested via fresh sub-agents 2026-06-19). Companion to
[[ecc-component-scoping-doctrine]].

**Headline:** the repo *preaches* "hooks force / deterministic control," but its shipped
`settings.json` blocks on exactly one event (PreToolUse: dangerous-`rm` + `.env`) and fails open
everywhere else — so it *corroborates* nxtlvl's "inform, don't force"
([[harness-hooks-inform-not-force]]). Synthesis: **template the inputs, don't compel the outputs.**

**Highest-value adopt:** read-only-by-*withheld-tools* (validator uses `disallowedTools: Write,
Edit, NotebookEdit`) → make `design-critic`/`context-scout` mechanically read-only, not merely
instructed. Verify `disallowedTools` vs `disallowed-tools` spelling first or the constraint won't
bind. Also reference-grade: §3.2 hook flow-control table (exit codes / which events `exit 2`
blocks / JSON priority) — but heed the **8-vs-13-event caveat** (table covers only the classic 8).

**Open §7 follow-ups (not yet done):** read-only critics → amend [[ecc-component-scoping-doctrine]];
PreCompact "Hook 2" design (pointer/digest not transcript, per ADR-007) → C&M lifecycle plan
([[nxtlvl-context-memory-subsystem]]); a second `.env`/secret objective PreToolUse gate. Reject:
uv/PEP-723 packaging (nxtlvl is Node — port contracts only), force-continuation hooks, unbounded
`logs/*.json`, TTS/cost machinery.
