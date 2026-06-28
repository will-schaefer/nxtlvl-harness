# nxtlvl Core Plugin — Interactions

> How the core `nxtlvl` plugin relates to `nxtlvl-labs` and `nxtlvl-wiki`.

## With `nxtlvl-wiki`

### Core reads from wiki

- The core plugin queries `nxtlvl-wiki` when designing or rebuilding a workflow.
- The query is treated as **orientation and leads, never evidence**.
- Every claim that influences a core build decision is verified at primary source before it reaches an ADR.

### What core does not do

- The core plugin does not write to the wiki.
- The core plugin does not treat wiki output as a command to execute.

## With `nxtlvl-labs`

### Core receives from labs

- New core components (skills, agents, commands, hooks, MCP servers, domain teams) are built in `nxtlvl-labs` and promoted to the core plugin.
- The promotion path is still being explored: file move, package publish, or spec-driven reimplementation.

### Core does not call labs

- The core plugin does not invoke the labs plugin during daily work.
- The labs plugin is a separate tool for building/extending the harness.

### Core may expose utilities for labs

- When both plugins are loaded, labs may use core utilities (shared libraries, audit helpers, config parsing) to avoid duplication.
- The core plugin may expose a plugin API for this purpose, but the labs plugin must remain standalone.

## With native Claude Code

### Core rides on native

- Skill routing, agent dispatch, tool loop, context-window assembly, and permission enforcement are native.
- The core plugin shapes inputs and owns composition above the loop.

### Core leaves orchestration to native

- The core plugin does not reconstruct orchestration primitives.

## Open questions

- What is the exact promotion handoff from labs to core?
- What core utilities should be exposed to the labs plugin?
- How does the core plugin stay stable while the labs plugin experiments with new patterns?
