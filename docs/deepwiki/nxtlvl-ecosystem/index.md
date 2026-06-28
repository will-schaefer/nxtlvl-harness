# nxtlvl Ecosystem Architecture

> **Architecture outline, ecosystem level.** A standing coverage map of the three plugins that make
> up the nxtlvl agent-harness ecosystem: the core plugin, the labs plugin, and the wiki plugin.
> It is not a commitment to build everything; it is the reference framework the reactive build
> and the deliberate `nxtlvl-wiki` coverage assessment measure against.
>
> **Anchor:** [`docs/intent/personal-harness.md`](../../../docs/intent/personal-harness.md).  
> **Inputs:** [`docs/reference/agent-harness-atomic-taxonomy.md`](../../../docs/reference/agent-harness-atomic-taxonomy.md) and
> [`docs/reference/nxtlvl-domain-map.md`](../../../docs/reference/nxtlvl-domain-map.md).

## One-line stack

**`nxtlvl-wiki` = the sole reference corpus / production bar · native Claude Code = the platform and runtime backstop · `nxtlvl-labs` = the creation plugin where agent harnesses, multi-agent teams, skills, commands, MCP servers, and plugins are built end-to-end through source-driven development · `nxtlvl` = the production-grade daily-driver plugin and the engine for an AI agent business.**

## The three plugins

| Plugin | Directory | Role | When you use it |
|---|---|---|---|
| **`nxtlvl`** (core) | [`plugins/nxtlvl/`](../../../plugins/nxtlvl/) | The daily-driver production plugin. | Every real work session. |
| **`nxtlvl-labs`** | (separate repo) | The creation plugin for building and extending the harness. | When designing, prototyping, or promoting a new component. |
| **`nxtlvl-wiki`** | (separate repo) | The ingested, queryable reference corpus over reviewed production harnesses. | When grounding a design decision in source-driven development. |

## How to read the architecture wikis

Each plugin has its own architecture DeepWiki:

| Wiki | Pages |
|---|---|
| [`nxtlvl-ecosystem`](./) | This wiki — ecosystem overview, boundaries, cross-plugin interactions, build order across plugins. |
| [`nxtlvl-architecture`](../nxtlvl-architecture/) | Core plugin architecture: subsystems, atoms, build order, interactions, open gaps. |
| [`nxtlvl-labs-architecture`](../nxtlvl-labs-architecture/) | Labs plugin architecture: subsystems, atoms, build order, interactions, open gaps. |
| [`nxtlvl-wiki-architecture`](../nxtlvl-wiki-architecture/) | Wiki plugin architecture: subsystems, atoms, build order, interactions, open gaps. |

Each plugin wiki follows the same contract:

- `index.md` — role and scope.
- `architecture.md` — subsystem map and design principles.
- `atoms.md` — atom-level coverage table.
- `build-order.md` — foundational → phase 0 → phase 1 → reactive.
- `interactions.md` — how this plugin relates to the other two.
- `open-gaps.md` — what is still undefined or exploratory.

## Design principles (shared across all three plugins)

1. **Source-driven, copy-or-create as justified.** Every component is grounded in `nxtlvl-wiki` and verified at primary source. A reference is copied when it is the best option; a custom version is authored when source-driven exploration surfaces a better one.
2. **Native orchestration, never reconstructed.** Skill routing, agent dispatch, tool loop, and context-window assembly stay in Claude Code. The plugins compose above the loop.
3. **Persona-agnostic core, preference-aware labs.** The core plugin is generic enough for others; the labs plugin is where user workflows and preferences are optimized.
4. **Fail-open, killable gates.** Hooks and session gates never crash the session. Every deliberate block has an env-var kill switch.
5. **No automatic north-star metric.** Coverage is assessed deliberately against `nxtlvl-wiki`, not through a hook-instrumented proxy.

## Pages in this wiki

| Page | What you'll find |
|---|---|
| [Boundaries](boundaries.md) | What each plugin owns and what it leaves to others. |
| [Cross-plugin interactions](cross-plugin-interactions.md) | How the plugins call into each other. |
| [Build order across plugins](build-order-across-plugins.md) | Which foundational atoms must exist before another plugin can stand. |

## Open questions at the ecosystem level

- The exact `nxtlvl-labs` → `nxtlvl` promotion mechanism is still being explored.
- The conditional dependency between `nxtlvl-labs` and `nxtlvl` (labs can call core but functions standalone) is still being explored.
- The `nxtlvl-wiki` ingestion and query interface is a placeholder; its architecture is speculative.
