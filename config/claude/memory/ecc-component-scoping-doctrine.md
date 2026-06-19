---
name: ecc-component-scoping-doctrine
description: "ECC's agent-vs-skill-vs-command-vs-hook-vs-rule decision doctrine, distilled as a reusable checklist for building nxtlvl components."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 8db67a93-7293-44df-9250-c3aa64fe7dc6
---

ECC's component-scoping doctrine — when to create an agent vs skill vs command vs hook vs rule. Full distillation at `docs/reference/ecc-agent-vs-skill-scoping.md` (written 2026-06-18, grounded in `reference/ECC-main` source + the `/go-review` trace).

Operative axis: **agent** = needs its own context window, a scoped `tools:` sandbox, or a `model:` tier (none of which a skill can have); **skill** = reusable knowledge/procedure applied in the current context; **hook** = event-triggered automatic firing; **rule** = always-on guidance; **command** = thin user-typed `/entry`. Tool-restriction is the decisive tell — a capability that *must not* write files has to be an agent (ECC splits read-only `*-reviewer` from write-capable `*-build-resolver`).

The pairing pattern: a domain ships `command (entry) → agent (isolated executor) → skills (knowledge)`, with knowledge factored OUT of the lean agent and depended on **one-way** (skills are caller-agnostic). Subagents don't auto-load skills — the parent injects skill conventions into the agent prompt.

Builds on [[ecc-component-map]] and [[ecc-knowledge-graph]]; apply when extending the [[nxtlvl-harness]].
