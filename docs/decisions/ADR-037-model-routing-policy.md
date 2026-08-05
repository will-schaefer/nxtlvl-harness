---
id: ADR-037
title: "Model routing policy — task-class routing over the call-model transport"
status: Accepted
date: 2026-07-26
---

# ADR-037: Model routing policy — task-class routing over the call-model transport

## Context

`nxtlvl:call-model` is the house transport for invoking another coding-agent CLI
(command-line interface) — Codex, Grok, Gemini, Devin, or Claude headless — in five modes
(`setup` / `consult` / `adversarial` / `review` / `task`). Choosing *which* callee handles a
delegated task has been manual: callers such as `doubt-driven-development` present a flat menu
and the user picks. Issue nxtlvl-harness#54 asked for a routing policy layer that picks the
target from the task at hand, without becoming a second transport stack.

The goal behind the issue, sharpened in the design interrogation: maintain a living answer to
"which frontier model is currently best at which kind of task" (for example: planning →
Gemini, implementation handoff → Devin or Codex, deep reasoning → Claude) and have the
harness act on that answer through the existing transport.

Grounding from the nxtlvl-wiki corpus (leads, not evidence): production harnesses execute
routing as an **ordered cascade** where deterministic signals outrank model judgment and a
terminal default guarantees an answer (Gemini CLI's classifier-cascade model routing), and
the closest analog to a skill-based harness is **caller-declared category routing** — the
delegating agent names a work category from a closed menu and configuration resolves it to a
full preset (oh-my-openagent). The corpus holds no instance of routing policy expressed as a
prose document read by the deciding model; this decision adopts that unattested shape
deliberately, because this harness's policy consumer is a model reading skills, not a
runtime code layer.

## Decision

**Routing is policy; `call-model` remains the only transport.** The policy layer decides
*which target and mode*; it never invents invocation mechanics. No new script, no new skill.

1. **The router brain is the host model, constrained by a closed table.** The host's only
   judgment call is naming one task class from a closed five-class menu. Everything after
   that is a prose-deterministic walk the policy document specifies.

2. **Resolution is an ordered cascade** — deterministic overrides first, judgment last,
   terminal guaranteed:

   ```mermaid
   flowchart TD
       A[explicit --target pin] -->|absent| B[prior-failure fallback]
       B -->|none| C[classify: name one of the five task classes]
       C --> D[policy row: preferred CLI chain, walked in order]
       D -->|CLI available + row fresh| E[propose route to user]
       D -->|row stale| F[demote: suggest only, flag staleness]
       D -->|all CLIs in chain unavailable| G[terminal: surface + offer manual pick or skip]
   ```

   A dead or missing CLI declines and hands down-chain; the terminal is always "surface and
   offer," never a silent fall-through to single-model work.

3. **Five task classes (closed menu, v1):** planning / architecture design (`consult`),
   deep reasoning / adversarial doubt (`adversarial`), code review (`review`),
   implementation / debug handoff (`task`), cheap triage / classification (`consult`,
   smallest capable target). New classes require a policy edit — that friction is the point.

4. **Table rows are dated and provenance-carrying.** Each row maps task class → best
   *model* → executable *CLI chain* → mode → provenance (benchmark, community signal, or
   own judgment) → last-reviewed date. The best-model and executable-CLI columns stay
   separate: a model can lead a class while its CLI is deprioritized (Gemini today, until a
   real smoke test passes). Rows older than roughly 90 days demote from auto-route to
   suggest-only until re-reviewed.

5. **Routing proposes; it never fires.** Interactive sessions surface one line — class,
   route, source, and reasoning — and keep the existing per-call confirmation.
   Non-interactive contexts may only choose among targets the user pre-authorized; with none
   pre-authorized, skip and announce (unchanged from the transport's existing rule).

6. **Placement:** the policy lives at
   `plugins/nxtlvl/skills/call-model/references/routing-policy.md`. The skill's former
   "Default target policy" section becomes a short "Routing policy" pointer; the
   `nxtlvl-router` entry for call-model mentions task-class auto-routing so the policy is
   discoverable. `doubt-driven-development`'s cross-model offer leads with the policy
   default instead of a flat menu.

## Alternatives Considered

- **Code + configuration router** (a script or config consumed by `call-model.mjs`):
  deterministic and testable, but it needs structured task descriptors nobody produces,
  and it moves policy into the transport script — eroding the exact boundary this record
  exists to keep. Rejected for v1.
- **Hybrid (model classifies, script walks the fallback chain):** the testability gain did
  not justify a new moving part; the cascade is simple enough to state as prose the model
  follows. Revisit if misroutes or fallback mistakes show up in practice.
- **A standalone routing skill:** duplicates trigger conditions with `call-model` and gives
  the router a disambiguation burden between "routing" and "transport" — the confusion the
  boundary is meant to prevent. A reference document inside the owning skill won.
- **Policy inside `nxtlvl-router`:** mixes skill-dispatch with model-dispatch — different
  domains.
- **Measure-first (build per-class evals before trusting any row):** most rigorous, but a
  project in itself; the issue scoped metrics to v2. Judgment plus dated research rows was
  chosen for v1, with in-house measurement as the v2 upgrade path.

## Consequences

- Auto-routing lands with zero new executable surface: the transport script is untouched,
  so the safety envelope (read-only defaults, `--write` gating, per-call authorization) is
  inherited rather than re-implemented.
- The policy table is a maintenance commitment: rows decay, and a stale table degrades
  gracefully to suggest-only rather than misrouting confidently. Reviewing rows after each
  frontier model release is the expected upkeep.
- Routing decisions are not unit-testable (the brain is model judgment). Mitigations:
  the closed menu bounds the judgment, the cascade bounds the blast radius, and v2 metrics
  hooks (latency, cost proxy, catch-rate under doubt) are the path to tuning with data.
- Callers keep working with no changes — the policy only upgrades the *default suggestion*
  in existing offer points.

Related: [ADR-029](ADR-029-atomic-adrs-one-decision-each.md) (domain grain — this record
owns the cross-model routing domain; future routing questions amend it rather than opening
new records).
