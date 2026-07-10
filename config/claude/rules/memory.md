# Context assembly rule

**Scope:** how always-on context gets assembled — what belongs in a `CLAUDE.md`, what in
memory, what in per-session hook injection. Context is a **budgeted injection policy, not a
firehose**.

## Pointers

- Full policy & rationale: `~/Developer/nxtlvl/nxtlvl-core/docs/intent/personal-harness.md`
  §"Context assembly = a budgeted injection policy (not a firehose)" — the current source.
- This is ADR-008's domain (context assembly); ADR-007 covers the separate memory-store /
  ownership decision. Both live in `~/Developer/nxtlvl/nxtlvl-core/docs/decisions/` and are
  `Draft`/`Pending` — once decided they supersede the intent-doc pointer above, and this
  file may split if their decisions don't share one file cleanly.

## Triggers

- About to add always-on content to any `CLAUDE.md` (global or project)? Ask whether it
  earns its per-session token cost — prefer a **pointer to the content over the content
  itself**.
- Something only needed occasionally? Prefer on-demand delivery (a pointer, a rule file
  like this one, a hook injection) over always-loaded prose.
