# nxtlvl-labs Plugin Architecture

> **Architecture outline for the `nxtlvl-labs` plugin.** The creation plugin where agent harnesses,
> multi-agent teams, skills, commands, MCP servers, and plugins are built end-to-end through
> source-driven development, then promoted to the core plugin.
>
> **Ecosystem context:** this is one of three plugins. See the
> [ecosystem overview](../nxtlvl-ecosystem/index.md) for how it relates to `nxtlvl` and
> `nxtlvl-wiki`.
>
> **Anchor:** [`docs/intent/personal-harness.md`](../../../docs/intent/personal-harness.md).

## Role

The labs plugin is the **creation plugin**. It is where you build and extend the harness. It provides:

- A source-driven development workflow for designing new components.
- Meta-builder domain teams that author artifacts for the core plugin.
- Experimentation infrastructure: eval runner, A/B runner, strategy comparison.
- A promotion handoff to the core `nxtlvl` plugin.

It is **not** invoked during daily work; it is invoked when designing, prototyping, or preparing a promotion.

## Design principles

1. **Separate from core.** The labs plugin is a separate plugin in a separate repo, with its own namespace and lifecycle.
2. **Can function standalone.** The labs plugin can run without the core plugin installed. It may duplicate core utilities locally to achieve this.
3. **Can call into core when present.** When both plugins are loaded, labs may use core utilities through a plugin API.
4. **Meta-creation.** The primary agents/skills in labs are builders: they build artifacts for the core plugin.
5. **Source-driven.** Every lab project is grounded in `nxtlvl-wiki` and verified at primary source.

## Pages in this wiki

| Page | What you'll find |
|---|---|
| [Architecture](architecture.md) | Subsystem map and dependency layers. |
| [Atoms](atoms.md) | Atom-level coverage table for the labs plugin. |
| [Build order](build-order.md) | Foundational → phase 0 → phase 1 → reactive. |
| [Interactions](interactions.md) | How the labs plugin relates to `nxtlvl` and `nxtlvl-wiki`. |
| [Open gaps](open-gaps.md) | What is still undefined or exploratory. |

## Status at a glance

The labs plugin is largely **speculative** at this stage. Most atoms are `PLANNED` or `OPEN`.

| Status | Meaning | Approximate count |
|---|---|---|
| NATIVE | Provided by Claude Code. | 4 atoms |
| BUILT | Already exists in some form. | 0 atoms |
| PLANNED | Committed or strongly intended. | 20+ atoms |
| OPEN | No position taken yet. | 30+ atoms |
| REJECTED | Deliberately not built. | 2 atoms |
| OOS | Out of scope for labs. | 3 atoms |

## Open questions

- The labs plugin's own packaging and namespace are not yet defined.
- The promotion mechanism from labs to core is still being explored.
- The conditional dependency on core (standalone vs. integrated) is still being explored.
