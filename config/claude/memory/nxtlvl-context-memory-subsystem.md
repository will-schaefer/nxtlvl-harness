---
name: nxtlvl-context-memory-subsystem
description: "The C&M domain: design FINAL + ADRs recorded; floor /plan written + all 5 ◇ decisions LOCKED (D1-D5, spec amended for observer=Sonnet); build ~15%; next = Phase 0 spikes."
metadata: 
  node_type: memory
  type: project
  originSessionId: 32bba156-ec43-463c-a7a0-bbf1eed729b6
---

The harness's **Context & Memory (C&M) domain** — the umbrella over context-injection,
fallback/observe, and lifecycle-persist. Model: **two paths (read/inject + write/capture)
over three stores in two planes**, joined by a **SessionEnd cheap-model analyze pass** that
distills scoped obs → instincts (no 4th store). Through-line: restraint both ways. The user
**un-deferred the whole subsystem** as the deliberate exception to reactive-growth (ADR-008) —
it *is* the harness's core job.

**Design = DONE/FINAL (verified 2026-06-19).** The original subsystem spec was **superseded**
by `docs/spec/nxtlvl-context-memory-lifecycle.md` (Status: FINAL — design; supersedes both
`nxtlvl-context-memory-subsystem.md` and `context-awareness-hooks.md`). The ADR amendments my
old note flagged as "pending" are **all applied**, and the subsystem decision landed as
**ADR-013** (floor-on-demand backbone) + **ADR-014** (quality-first over leanness) — NOT
ADR-011 (that's stop-slop prose; numbering shifted as scope broadened — the collision hazard).
ADR-004/005/007 are amended on disk.

**Build = ~15% / early.** Only two pieces have code: `context-alert.js` (read-path budget FYI,
20/20 tests, wired PostToolUse, but Checkpoint-A live-verify + T6 promote still unchecked) and
`fallback-log.sh` (write-path capture, wired PreToolUse). **Unbuilt:** PreCompact pointer
(Hook 2), and the whole lifecycle floor — SessionStart brief, SessionEnd distill→instincts,
save-spot/resume, the separate instinct store (outside ~/.claude), `/evolve` + `/promote`.
No SessionStart/SessionEnd hooks wired in `hooks.json`.

**Next step:** the floor `/plan` now **exists** (drafted 2026-06-19, pending review) at
`docs/plan/nxtlvl-context-memory-lifecycle-plan.md` — 6 phases / ~25 tasks, bottom-up (stores →
write path → read path → lifecycle close → on-demand commands → ship), Phase 0 spikes the 3
platform unknowns (SessionStart injection, detached-observer survival, fail-closed scrub). It
supersedes the old narrow `nxtlvl-context-awareness-hooks-plan.md`. **All 5 `◇` decisions LOCKED
(2026-06-19):** D1 storage root = `${XDG_STATE_HOME:-~/.local/state}/nxtlvl`; D2 bookmark gate =
≥10 tool-calls OR any mutation; D3 `/evolve` = thin cmd + deterministic `lib/evolve` clustering
(adopt ecc) + `evolver` agent authoring via skill-creator (reject ecc's stub-gen) → split into
Tasks 5.4a/5.4b; D4 metrics in `/instinct-status` only (briefing stays lean); D5 observer model =
`claude-sonnet-4-6` (quality-first override of the spec's cost-era Haiku — **spec amended**, recorded
as spec X7; not ADR-worthy). Build still ~15% — next real work is **Phase 0** (de-risk spikes).
Related: [[nxtlvl-harness]],
[[adr-numbering-collision-hazard]], [[nxtlvl-context-alert-hook]], [[decision-recording-conventions]].
