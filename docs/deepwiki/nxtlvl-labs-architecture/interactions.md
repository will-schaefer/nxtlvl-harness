# nxtlvl-labs Plugin — Interactions

> How the labs plugin relates to the core `nxtlvl` plugin and `nxtlvl-wiki`.

## With `nxtlvl-wiki`

### Labs reads from wiki

- The labs plugin is the primary consumer of `nxtlvl-wiki`. The consultation surface is built: `nxtlvl-wiki-mcp` exposes the corpus over stdio (`search`, `list`, `get-page`, `get-source`), wired through the repo-root `.mcp.json`.
- Every source-driven development project starts with a wiki query to see how reviewed production harnesses approach the problem.
- The query is treated as **orientation and leads, never evidence**.
- Claims are verified at primary source before they influence a copy/create decision or reach an ADR.

### Labs does not write to wiki

- The labs plugin does not update the wiki corpus directly.
- If a new reference harness needs to be ingested, that is a separate curation action.

## With `nxtlvl` (core)

### Labs produces artifacts for core

- Skills, agents, commands, hooks, MCP servers, domain teams, and whole harnesses are built in labs and promoted to core.
- A first promotion implementation exists: the `/graduate` command runs an objective graduation gate (exit 2 = block) over a harness-lab cell. The full ritual beyond the gate (file move, package publish, or spec-driven reimplementation) is still being explored.

### Labs optionally calls into core

- When both plugins are loaded, the labs plugin may use core utilities to avoid duplication.
- The core plugin may expose a plugin API for labs to use.
- The labs plugin must remain **standalone** — it functions when the core plugin is not installed.

### Core does not call labs

- The core plugin does not invoke the labs plugin during daily work.
- The labs plugin is the creator; the core plugin is the consumer.

## With native Claude Code

### Labs rides on native

- Same as the core plugin: skill routing, dispatch, tool loop, and context-window assembly are native.
- The labs plugin composes above the loop.

## Open questions

- What is the exact promotion handoff from labs to core?
- What core utilities should be exposed to labs?
- How does labs detect whether core is present and branch accordingly?
- Can labs call core utilities while still being persona-agnostic, or does that introduce personal coupling?
