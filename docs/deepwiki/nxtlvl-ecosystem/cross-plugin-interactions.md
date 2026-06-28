# Cross-Plugin Interactions

> How the three plugins call into, depend on, and hand off to each other.

## Interaction matrix

| Caller | Callee | Direction | Mechanism | Purpose |
|---|---|---|---|---|
| `nxtlvl` (core) | `nxtlvl-wiki` | Read-only query | MCP / query interface | Ground a workflow or component design in the reference corpus. |
| `nxtlvl-labs` | `nxtlvl-wiki` | Read-only query | Same interface | Source-driven development: research references before building. |
| `nxtlvl-labs` | `nxtlvl` (core) | Optional call | Plugin API / shared library | Use core utilities while building a core artifact; labs functions standalone when core is absent. |
| `nxtlvl-labs` | `nxtlvl` (core) | Promotion handoff | File move / package publish / spec | Graduate a proven artifact into the core plugin. |
| `nxtlvl` (core) | `nxtlvl-labs` | None at runtime | — | The core plugin does not invoke the labs plugin during daily work. |
| `nxtlvl-wiki` | `nxtlvl` or `nxtlvl-labs` | None | — | The wiki is a read-only corpus; it does not invoke the plugins. |

## Core → Wiki

- The core plugin queries `nxtlvl-wiki` before designing or rebuilding a workflow.
- The query is treated as **orientation and leads, never evidence**.
- Every claim that informs a build decision is verified at primary source before it reaches an ADR.

## Labs → Wiki

- The labs plugin is the primary consumer of `nxtlvl-wiki`.
- Source-driven development: research → compare → test → eval → decide.
- The wiki feeds the research and compare phases; primary-source verification feeds the decide phase.

## Labs → Core

- **Optional call:** when both plugins are loaded, labs can use core utilities (e.g., shared libraries, audit helpers, config parsing) to avoid duplication.
- **Promotion handoff:** when a lab artifact is proven, it graduates into the core plugin. The exact mechanism is still being explored (file move, package publish, or spec-driven reimplementation).
- **Standalone mode:** the labs plugin must function without the core plugin installed. It may duplicate or reimplement core utilities locally for this case.

## Core → Labs

- There is **no runtime call** from core to labs.
- The core plugin receives artifacts from labs through the promotion process.

## Wiki → Core / Labs

- The wiki is a **read-only reference corpus**. It does not invoke either plugin.
- Its output is consumed as context during design, not as instructions during execution.

## Open questions

- What is the exact API surface the core plugin exposes for the labs plugin to call into?
- How does the labs plugin detect whether the core plugin is present and branch accordingly?
- What is the promotion handoff format? (file move, package publish, or spec-driven reimplementation)
