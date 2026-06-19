---
name: nxtlvl-context-memory-subsystem
description: "The C&M subsystem design + the deliberate un-defer pivot; spec written, ADR amendments still pending."
metadata: 
  node_type: memory
  type: project
  originSessionId: 32bba156-ec43-463c-a7a0-bbf1eed729b6
---

Brainstormed (2026-06-17) the harness's **Context & Memory subsystem** — the umbrella over
the context-injection, fallback/observe, and lifecycle-persist hooks. Model: **two paths
(read/inject + write/capture) over three stores in two planes** (knowledge: CLAUDE.md +
native memory/instincts; operational: telemetry + resume), joined by a **SessionEnd cheap-model
analyze pass** that distills scoped obs → instincts in native-memory frontmatter (no 4th store).
Through-line: restraint both ways — budgeted inject, scoped capture.

**The pivot:** the user un-deferred the whole subsystem — it's built **now** as the deliberate
**exception** to reactive-growth (ADR-008), because it *is* the harness's core job. Reactive
growth still governs all other growth.

Spec: `docs/spec/nxtlvl-context-memory-subsystem.md`.

**Still pending (do in /plan):** the ADR amendments are NOT yet applied — new ADR-011 (record
the subsystem + un-defer pivot), amend ADR-004 (CL un-deferred, no-4th-store reinforced),
ADR-005 (fallback log retires its un-defer-trigger role), ADR-007 (read path 3→5 blocks,
budget ~300→~400), ADR-008 (carve out the exception), and update the anchor intent (lines
67–69, 212). Re-milestone as its own phase, not folded into Phase-0. Related: [[nxtlvl-harness]],
[[decision-recording-conventions]].
