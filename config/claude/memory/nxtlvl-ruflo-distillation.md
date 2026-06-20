---
name: nxtlvl-ruflo-distillation
description: "adopt/adapt/reject distillation of ruvnet/ruflo (claude-flow) — the functional maximalist harness whose shipped code collapses onto nxtlvl's locked positions."
metadata: 
  node_type: memory
  type: reference
  originSessionId: ba0748f8-4d38-434b-9e6a-f3bde12c4b4b
---

Adopt/adapt/reject of **ruvnet/ruflo** (formerly **claude-flow**) at
`docs/reference/ruflo-distillation.md`; clone was `reference/ruflo-main/` (80M, gitignored).
Reviewed via 3-agent fan-out on the user-pinned lenses: **multi-agent orchestration**,
**self-learning memory**, **hooks & task routing**.

**Spine — contrast that confirms, strongest yet.** Ruflo is a *functional* maximalist system (34
plugins, ~98 agents, swarms/federation/MCP/Rust engine), unlike the prior breadth reviews which were
catalogs/collections ([[nxtlvl-cct-distillation]], [[nxtlvl-toolkit-distillation]]). All three lenses
independently found ruflo's **shipped, installed code collapses back onto nxtlvl's locked positions** —
the rhetoric–wiring gap IS the validation:
- Orchestration: `swarm_init` = coordination record only; real executor is native `Task`; anti-drift
  default caps at 6–8 agents + "don't babysit" → confirms compose-on-native + main-thread-orchestrates.
- Memory: stripped of its npm/WASM engine the "self-learning DB" degrades to Jaccard recall +
  hash-vector HNSW reporting itself active + "SONA" = `quality *= 1.05` → confirms curated-file C&M;
  ruflo's memory has a degraded mode that LIES, nxtlvl's can't. No LOCKED C&M decision challenged.
- Hooks: README "auto-routes/learns/coordinates" is false vs live `settings.json` — inform-only regex
  router + one fail-open dangerous-bash denylist; the one steering hook (`Stop→{decision:continue}`)
  is quarantined out of live config → confirms "hooks inform not force" [[harness-hooks-inform-not-force]]
  + single-objective-gate [[nxtlvl-dangerous-bash-gate]].

**Real harvest is cultural/hygiene, not features** (more adopts than prior thin ledgers): Measured/
Target/Unverified benchmark annotation; fail-soft idioms (try/catch + force-exit safety timer + clean
no-op); `jq`/`xargs -0` injection-safe hook payload. Adapts: harden dangerous-bash gate beyond literal
substrings (`rm  -rf`/`$HOME` bypass ruflo's); archive-before-compaction + conditional PreCompact for
Hook 2; usage-count promotion signal + read-time graph-rank hint for /evolve/MEMORY.md (human-gated).
**No ADR candidates** — every finding confirms a LOCKED decision or is a hygiene note.

4th breadth/maximalist harness; reinforces [[analyze-all-harnesses-build-decisions]] and
[[compose-on-native-quality-first]]. Mine the doc instead of re-scanning the clone.
