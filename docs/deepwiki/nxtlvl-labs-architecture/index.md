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

The labs plugin's **foundation layer is partly built** — the incubation Spine, measurement
engine, reference MCP server, and slash commands exist on disk. The meta-builder **Teams layer**
is intentionally deferred, so most remaining atoms are `PLANNED` or `OPEN`.

| Status | Meaning | Count |
|---|---|---|
| NATIVE | Provided by Claude Code. | 13 atoms |
| BUILT | Exists on disk today. | 17 atoms |
| PLANNED | Committed or strongly intended. | 45 atoms |
| OPEN | No position taken yet. | 19 atoms |
| REJECTED | Deliberately not built. | 3 atoms |
| OOS | Out of scope for labs. | 3 atoms |

> **Two framings of labs.** This wiki organizes labs into nine atom families (LAB-A…I) that
> mirror the core plugin's structure. A complementary, build-oriented view — the confirmed
> intent — describes labs as a **three-layer model**: **Reference** (`nxtlvl-wiki` made
> consultable) + **Spine** (fused `harness-lab` + `evals-lab` lifecycle) + **Teams** (deferred
> meta-builder domain teams). The BUILT atoms above are the Spine and Reference foundation; the
> PLANNED/OPEN atoms are mostly the Teams layer. See
> [`nxtlvl-labs/docs/intent/nxtlvl-labs-redesign.md`](../../../../nxtlvl-labs/docs/intent/nxtlvl-labs-redesign.md).

## Open questions

- The promotion mechanism from labs to core has a first implementation (`/graduate` objective
  gate) but the full ritual (file move vs. publish vs. reimplementation) is still being explored.
- The conditional dependency on core (standalone vs. integrated) is still being explored.
- The Teams layer (per-component-type meta-builder domain teams) is designed but not yet built.
