---
id: ADR-035
title: "Reconstruct only the plumbing; compose the substance from any reviewed harness; orchestrate on native first"
status: Accepted
date: 2026-06-24
supersedes: ADR-003
---

# ADR-035: Reconstruct only the plumbing; compose the substance from any reviewed harness; orchestrate on native first

## Context

[ADR-003](ADR-003-compose-not-reconstruct.md) set nxtlvl's founding build strategy: **reconstruct
the plumbing, compose the workflow substance, leave orchestration native.** That three-tier spine
is sound and carries forward. But three things have moved enough that the *framing* — not just a
detail — is now wrong, so ADR-003 is **superseded** rather than amended.

1. **agent-skills lost its privileged status.** ADR-003 led with "compose on native **+
   agent-skills**," naming one upstream library as *the* workflow floor.
   [ADR-027](ADR-027-router-endorses-only-established-items.md) already delisted that floor in the
   router (precedence collapsed to `nxtlvl → native`), but the broader build strategy never caught
   up. The harness-review program now studies many reference harnesses area-by-area; agent-skills is
   one entry among them, not a foundation.

2. **The real input substrate became explicit.** What feeds the build is the **reviewed reference
   harnesses plus the agents-wiki** — and they serve in *two* roles ADR-003 couldn't express: as
   **sources** (workflow content vendored into the repo) and as **strategy/structure guidance** (how
   to architect the plumbing). ADR-003 tied inputs to the compose tier alone.

3. **Orchestration stopped being permanently closed.** ADR-003 declared orchestration native
   **"always"** and out of scope **"permanently."** The actual plan is *sequenced*: build the
   harness fully on native orchestration, **then** explore adding nxtlvl's own runtime/orchestration
   — guided by the agents-wiki and the reference harnesses, many of which ship their own runtimes.
   Today nxtlvl is a Claude Code plugin ([ADR-001](ADR-001-plugin-local-marketplace-packaging.md))
   that composes on the native runtime; owning a runtime is a **deferred, not foreclosed**, future.

The dividing question is unchanged from ADR-003 — *"learn by reconstruction" applies to the harness,
not the SDLC content* — but two of its three tiers needed re-leading, and the orchestration tier
shed a permanent constraint.

## Decision

Keep the three-tier spine, re-led so it no longer privileges any upstream library and no longer
forecloses owning orchestration. **Inputs to the build are a single substrate — the reviewed
reference harnesses plus the agents-wiki — serving as both *sources* and *guidance*; agent-skills is
one entry in it, with no reserved tier.**

- **Plumbing → reconstruct.** The machinery native CC and upstream skills don't hand me is where the
  learning lives: layered config + plugin packaging, context assembly
  ([ADR-007](ADR-007-context-budgeted-injection.md)), memory
  ([ADR-004](ADR-004-extend-native-memory.md)), the composition layer, a lean hook layer
  ([ADR-006](ADR-006-hook-fail-open-gated-blocking.md)), and the audit
  ([ADR-009](ADR-009-objective-invoked-audit-gate.md)). The substrate **guides** this work — the
  reference harnesses and the agents-wiki inform structure and boundaries. (The CLAUDE.md "review
  harnesses to shape ours" build-method is the operational form of this guidance; it is cross-linked,
  not restated here.)

- **Workflow substance → compose, never reconstruct.** Dev, review, research, documentation — the
  SDLC — is *content*, not harness machinery, and is already well-solved upstream. nxtlvl wraps and
  refines existing work rather than re-deriving it, vendoring **reactively, area-by-area, by quality,
  from whichever reviewed harness wins** — agent-skills among many, on equal footing. Adopted skills
  are vendored into the repo and refined for fit — not called untouched, not rebuilt from scratch.
  Precedence is `nxtlvl → native`; no upstream library holds a reserved tier.

- **Orchestration → native through the build-out; own runtime a deferred exploration.** Skill
  routing, agent dispatch, the tool-use loop, and context-window assembly stay native while the
  harness is built to completion. During the build a hand-built dispatcher is only a slower, capped
  shim, and as a CC plugin nxtlvl composes *above* the native loop rather than replacing it.
  Deterministic multi-agent control uses the native `Workflow` tool. **Once the harness stands fully
  on native rails, a later phase explores adding nxtlvl's own runtime/orchestration**, guided by the
  substrate. Sequenced after the native build — *not* excluded permanently.

The **composition layer** (when skills fire, how agents chain, how outputs compose) is mine, as in
ADR-003. What changes is that the orchestration *primitive* underneath it is native **for now**, not
forever.

## Alternatives Considered

### Amend ADR-003 instead of superseding it
- Pros: lighter; ADR-003 stays the single record.
- Cons: the change reverses a stated *permanent* constraint (orchestration) and removes a
  *privileged floor* (agent-skills) — that is a changed decision, not a clarification. An amendment
  buries a reversal in a footnote, the exact failure mode that made ADR-003's own ADR-027 amendment
  hard to read.
- Rejected: supersede is the honest lifecycle move when the decision itself changes.

### Keep a privileged upstream library (the agent-skills floor)
- Pros: a simple default source; fastest answer to "what skill do I use here."
- Cons: advertises vetting the project never did — contradicts reactive growth
  ([ADR-008](ADR-008-reactive-growth-intake-gate.md)) and the bounded confident-core
  ([ADR-016](ADR-016-confident-core-capability-domains.md)); already delisted in the router by
  ADR-027.
- Rejected: the substrate replaces the floor — many reviewed sources, no default.

### Reconstruct orchestration now (own the runtime up front)
- Pros: maximal ownership; nxtlvl becomes its own harness immediately.
- Cons: re-explodes scope to reference-repo breadth before there is a harness worth orchestrating;
  collides with [ADR-001](ADR-001-plugin-local-marketplace-packaging.md) (CC-plugin identity) and
  [ADR-021](ADR-021-agent-orchestration-model.md) (own the composition, never the dispatch runtime);
  a premature dispatcher is a slower shim.
- **Deferred, not rejected:** sequenced *after* the native build, when there is something real to
  orchestrate and the agents-wiki has accumulated guidance. This is the key shift from ADR-003, which
  rejected it permanently.

### Compose everything / reconstruct nothing
- Pros: fastest to a working harness.
- Cons: defeats the learning goal; leaves the plumbing un-owned and un-tailorable. (Carried forward
  unchanged from ADR-003.)
- Rejected: I want a harness I understand to the metal, not one I merely configure.

## Consequences

- **ADR-003 is superseded** (`status: Superseded`, `superseded-by: ADR-035`) and kept on disk as
  history per the house lifecycle. Its spine carries forward; its agent-skills framing and its
  permanent orchestration exclusion do not.
- **ADR-027 stays Accepted.** It remains the router-specific realization of `nxtlvl → native`;
  ADR-035 generalizes that posture to the whole build strategy without invalidating the router
  decision. ADR-003's "amended by 027" link is kept as history.
- **Orchestration is phased, not closed.** Native through the build-out; nxtlvl's own
  runtime/orchestration is an explicit future exploration. When that phase opens it will revisit
  [ADR-001](ADR-001-plugin-local-marketplace-packaging.md) (plugin identity) and
  [ADR-021](ADR-021-agent-orchestration-model.md) (dispatch-runtime stance) — flagged now, decided
  then. Until then both hold unchanged.
- **The input substrate cross-cuts the build.** The reviewed reference harnesses + the agents-wiki
  *guide* the plumbing reconstruction and *source* the workflow composition. This ADR owns the
  *strategy*; the CLAUDE.md build-method owns the *mechanics*. (The agents-wiki is a synthesized,
  queryable guidance layer over the reviewed harnesses — an emerging component, referenced here as
  the intended guidance source.)
- **agent-skills stays installed and composable** — de-privileged, not removed. A direct invocation
  of an upstream skill is still possible; no upstream library is a default.
- **The "production quality" bar applies to the plumbing layer**, not the composed envelope
  (unchanged from ADR-003).
- Recorded per the global decision rule ([ADR-010](ADR-010-global-decision-rule.md)).
