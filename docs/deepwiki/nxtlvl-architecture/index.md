# nxtlvl Core Plugin Architecture

> **Architecture outline for the core `nxtlvl` plugin.** The daily-driver production plugin that
> carries real income-generating work and is the engine for an AI agent business.
>
> **Ecosystem context:** this is one of three plugins. See the
> [ecosystem overview](../nxtlvl-ecosystem/index.md) for how it relates to `nxtlvl-labs` and
> `nxtlvl-wiki`.
>
> **Anchor:** [`docs/intent/personal-harness.md`](../../../docs/intent/personal-harness.md).  
> **Atomic taxonomy:** [`docs/reference/agent-harness-atomic-taxonomy.md`](../../../docs/reference/agent-harness-atomic-taxonomy.md).  
> **Domain map:** [`docs/reference/nxtlvl-domain-map.md`](../../../docs/reference/nxtlvl-domain-map.md).

## Role

The core plugin is the **production harness**. It is what you run in every real work session. It provides:

- Workflow entry points (`/dev`, `/review`, `/research`, etc.).
- Specialist agents and knowledge skills for the supported capability domains.
- Context assembly, memory, hooks, and composition machinery.
- Quality guardrails and an invoked promotion audit.

## Design principles

1. **Source-driven, copy-or-create as justified.** Every workflow and subsystem is grounded in `nxtlvl-wiki` and verified at primary source. A reference is copied when it is the best option; a custom version is authored when it is better.
2. **Native orchestration.** Skill routing, agent dispatch, tool loop, and context-window assembly stay in Claude Code.
3. **Persona-agnostic core.** No hardcoded personal assumptions; clean boundaries keep productization open.
4. **Fail-open hooks.** Any unexpected hook failure swallows, exits 0, and does nothing. Deliberate blocks have kill switches.
5. **No automatic north-star.** Coverage is assessed deliberately against `nxtlvl-wiki`.

## Pages in this wiki

| Page | What you'll find |
|---|---|
| [Architecture](architecture.md) | Subsystem map and dependency layers. |
| [Atoms](atoms.md) | Atom-level coverage table (status, priority, dependency layer). |
| [Build order](build-order.md) | Foundational → phase 0 → phase 1 → reactive. |
| [Interactions](interactions.md) | How the core plugin relates to `nxtlvl-labs` and `nxtlvl-wiki`. |
| [Open gaps](open-gaps.md) | What is still undefined or exploratory. |

## Status at a glance

| Status | Meaning | Approximate count |
|---|---|---|
| NATIVE | Provided by Claude Code; not reconstructed. | 8 atoms |
| BUILT | Already ships in `plugins/nxtlvl/` or `config/claude/`. | 50+ atoms |
| PLANNED | Committed via ADR/spec/plan; not yet on disk. | 10+ atoms |
| REJECTED | Deliberately not built. | 3 atoms |
| OOS | Out of scope; native CC is the backstop. | 4 atoms |
| OPEN | No position taken yet; candidate for reactive growth. | 15+ atoms |

> Counts are approximate and will be reconciled against `plugins/nxtlvl/` + `config/claude/`.

## Open questions

- The exact source-driven copy-or-create decision criteria are still being recorded in ADR-003.
- The audit's concrete rubric and hook safety details are still being explored.
- The precise graduation criteria from `nxtlvl-labs` are still being defined.
