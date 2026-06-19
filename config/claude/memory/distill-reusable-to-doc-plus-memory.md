---
name: distill-reusable-to-doc-plus-memory
description: "How to log reusable findings (strategy/architecture/distillations) — repo reference doc + auto-memory pointer; this is the default, don't re-ask."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8db67a93-7293-44df-9250-c3aa64fe7dc6
---

When a session produces a reusable distillation — an architecture, strategy, process, or analysis of an external reference worth reapplying — log it as a durable **repo doc under `docs/reference/`** plus a one-line **auto-memory `reference` pointer** and a **MEMORY.md index line**. Make every claim carry a `file:line` citation back to source so it stays verifiable.

**Why:** the user explicitly wants such findings captured for reuse rather than left in the conversation; this matches the established pattern (`ecc-main-map.md`, `ecc-continuous-learning-notes.md`, `ecc-agent-vs-skill-scoping.md` all live in `docs/reference/` with memory pointers). Confirmed as the chosen destination on 2026-06-18.

**How to apply:** default to this destination and just say "I'll log it to `docs/reference/…` + a memory pointer" — don't open a multi-option destination question unless cross-project/global reuse is genuinely in play. See [[ecc-component-scoping-doctrine]] for the latest instance. Commit the repo doc on request; memory files live outside the repo. Respects [[terse-confirms-momentum]].
