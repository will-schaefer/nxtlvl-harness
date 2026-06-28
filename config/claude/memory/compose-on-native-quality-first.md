---
name: compose-on-native-quality-first
description: "The user's decision lens is \"what provides higher quality\". For nxtlvl that resolved (2026-06-28) to build-from-scratch source-driven above the loop; compose only on native orchestration."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 794f06a2-18d8-40ab-b498-49d6500c44eb
---

The user's tiebreaker for build-vs-reuse is **"what provides higher quality"** — lead every such decision with the quality comparison. That lens is stable and was reaffirmed.

**What the lens resolved to for nxtlvl (changed 2026-06-28):** build **everything above the native loop from scratch** — plumbing *and* workflow substance — via **source-driven development with `nxtlvl-wiki` as the source** (ADR-003, file `docs/decisions/ADR-003-build-from-scratch.md`). Compose **only on native orchestration** (skill routing, dispatch, tool-loop, context assembly stay native — "compose on native, and it isn't close" still holds *there*).

**Superseded:** the earlier "lean toward composition / vendor-and-refine upstream skills (e.g. agent-skills), don't rebuild" default. That was the now-dead compose-not-reconstruct model. Do **not** recommend vendoring/wrapping/refining upstream for nxtlvl substance; recommend building it from scratch grounded in the wiki (harness-arch decisions) or official docs/Context7 (language/library decisions), verified at primary source.

**How to apply:** still lead with the quality comparison — but for nxtlvl the answer above the loop is build-from-scratch-source-driven, not compose. Shipped composed artifacts (e.g. `nxtlvl:review`, `github-workflow`) are off-doctrine and queued for from-scratch rebuild. Relates to [[nxtlvl-harness]], [[nxtlvl-purpose-commercial-reshape]], [[distill-reusable-to-doc-plus-memory]].
