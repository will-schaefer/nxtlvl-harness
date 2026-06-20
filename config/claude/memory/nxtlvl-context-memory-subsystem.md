---
name: nxtlvl-context-memory-subsystem
description: "The C&M domain: design FINAL + ADRs recorded; all 5 ◇ decisions LOCKED; Phase 0 spikes GREEN; Phase 1 foundation DONE (2026-06-20 — 6 libs, 79 tests green, on branch feat/cm-phase1-foundation, nothing wired); next = Phase 2 write path."
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

**Build = Phase 1 DONE (2026-06-20).** Six foundation libs built via parallel subagents (2 waves:
`paths`/`project-identity`/`atomic` → `obs-log`/`instincts`/`bookmarks`) under `plugins/nxtlvl/lib/`,
each unit-tested — **79/79 lib tests green**, existing **24/24 hook tests green** (no regression),
`hooks.json` untouched (no behavior change in a live session yet), + a cross-module integration smoke
passed. Key shapes: `paths.layout(projectId)` = single source of truth for the storage tree; obs-log
cursor = monotonic `seq` (purge-safe); instinct decay = read-time exponential (`raw·0.5^(days/30)`,
stored confidence never mutated). On branch `feat/cm-phase1-foundation` (uncommitted unless noted).
**Next = Phase 2 (write path): scrub → capture hook → one-shot Sonnet observer.** The throwaway
`cm-phase0-workspace/` (scrub.js/identity.js spikes) can be deleted now that Phase 1 landed.

**(Historical) Build was ~15% / early.** Two pieces had code: `context-alert.js` (read-path budget FYI,
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
as spec X7; not ADR-worthy).

**Phase 0 = DONE, all four spikes GREEN (2026-06-20), no pivots** — built in gitignored
`cm-phase0-workspace/` (throwaway; delete when Phase 1 lands). 0.4 scrub + 0.5 path/identity =
`node --test` (17 tests). 0.2 + 0.3 run against the **real `claude` binary** headlessly via
`claude -p --settings <isolated>` (no live-settings change): **0.2** SessionStart `additionalContext`
sentinel reached the model (control returned `NONE`); **0.3** detached observer wrote +13.5s **after**
a real claude process exited (reparented to `init`/own process group via `detached:true` — CC never
had a handle to kill it), fail-open held → **the detached one-shot observer architecture stands, no
queue-file pivot**. Plan Risks table + acceptance boxes updated; only the **human-review gate**
(Checkpoint A-pre) remains before **Phase 1** (six foundation libs: paths, project-identity, atomic,
obs-log, instincts, bookmarks — three parallel-safe). Technique worth reusing: hooks needing a live
`claude` can be tested non-interactively with `claude -p --settings <file>` + epoch-ms ordering.
Related: [[nxtlvl-harness]],
[[adr-numbering-collision-hazard]], [[nxtlvl-context-alert-hook]], [[decision-recording-conventions]].
