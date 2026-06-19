---
name: nxtlvl-fallback-log-write-guard-risk
description: "CC's sensitive-path guard may silently block background hook writes to ~/.claude — nxtlvl's fallback-log/metric path is at risk; verify in M0 spike."
metadata: 
  node_type: memory
  type: project
  originSessionId: 3e22852b-cb8d-4643-9582-e811ec4849ae
---

ecc's continuous-learning-v2 deliberately stores its observer data **outside** `~/.claude`
(`$XDG_DATA_HOME/ecc-homunculus`) — its own docs say this is "so Claude Code's sensitive-path guard
does not block background instinct writes."

**Why this matters for nxtlvl:** the Phase-0 spec writes `fallback-log.jsonl` and `sessions.jsonl` to
**`~/.claude/nxtlvl/`** (M6/M7). A background hook write to `~/.claude` may be silently guarded —
which would break the north-star fallback-rate metric without any error.

**How to apply:** in the **M0 stdin spike**, also verify the fallback-log hook can *write* to
`~/.claude/nxtlvl/`. If blocked, relocate the log to `~/.local/share/nxtlvl/` (or an override path)
and reconcile the M7 path decision. Full reference (incl. `observe.sh` as a template for
`fallback-log.sh`): `docs/reference/ecc-continuous-learning-notes.md`. Relates to [[nxtlvl-harness]]
and [[ecc-component-map]].
