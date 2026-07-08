---
id: ADR-004
title: "nxtlvl-harness internal structure — layers, runtime contracts, and language"
status: Draft
date: 2026-06-28
---

# ADR-004: nxtlvl-harness internal structure — layers, runtime contracts, and language

## Context

ADR-001 establishes `nxtlvl-harness` as a Claude Code plugin — the daily-driver harness.
ADR-003 establishes that everything is built from scratch. Neither records what the plugin
should actually contain, how its layers should be structured, what runtime each layer runs
under, or what language the executable layers should be written in.

These are the foundational structural decisions for the harness, and they need to be
made explicitly and deliberately.

### The questions

**1. What layers does the harness have, and what is each layer's job?**

A Claude Code plugin can contain skills, agents, commands, hooks, and arbitrary
executable code. The right set of layers — and the boundaries between them — is an open
question. Options range from a thin markdown-only plugin that delegates all execution to
native CC, to a richer plugin with significant executable machinery.

**2. What are the runtime contracts for executable layers?**

CC spawns hooks as child processes on every matching event. MCP servers run as long-lived
processes. Scripts run on demand. Each execution model has different constraints on
startup time, dependencies, language, and build tooling. The runtime contract for each
executable layer needs to be defined before language can be decided.

**3. What language and build tooling?**

Language and build tooling are downstream of the runtime contract. A hook spawned on
every tool call has different constraints than a CLI tool run once at promotion. The
question cannot be answered globally — it needs to be answered per layer, once the layers
and their contracts are defined.

### What nxtlvl-wiki answered

The following queries were collected from `nxtlvl-wiki` to ground this decision:

- **Layers and responsibility** — production harnesses divide work across commands, agents, and skills, with invocation priority falling to the lightest-weight mechanism that can handle the intent. Hooks are reserved for deterministic control, not judgment.
- **Runtime contracts** — hooks are per-event child processes with strict timeouts and output contracts; MCP servers are long-lived with lazy loading and scope-based configuration; durable plugin state belongs in `${CLAUDE_PLUGIN_DATA}`, not the plugin root.
- **Language and build tooling** — engine/hot-loop layers trend toward Rust or Go; framework and SDK layers trend toward Python or TypeScript; hook-style one-shot code can use Node native type stripping for zero-build TypeScript, but distributed dependencies still need a real build.
- **Anti-patterns** — harness components encode assumptions about model capabilities that go stale; every layer should be built with a kill switch and deleted when quality improves; hard allow/deny belongs in the permission system, not hook `if` filters.

Remaining gaps are noted at the end of this ADR.

## Decision

**1. Plugin packaging**

`nxtlvl-harness` is a Claude Code plugin — the unit that bundles skills, agents, commands, hooks, MCP servers, and executable tooling into a single versioned directory under the standard layout (`skills/`, `agents/`, `commands/`, `hooks/`, `bin/`, `settings.json`, `.mcp.json` / `.lsp.json`, `.claude-plugin/plugin.json`). The plugin name is the skill namespace.

**2. Layer responsibility**

Use the three native extension mechanisms as the primary mental model, defaulting to the lightest-weight layer that can satisfy the intent:

- **Skill** — the default unit for reusable, auto-invocable, inline procedures. Use when the work can be done in context without spawning a separate process or isolated context.
- **Agent** — use when work is autonomous, multi-step, or benefits from an isolated context window, persistent memory, and preloaded skills.
- **Command** — use for user-triggered workflows that orchestrate skills and agents; never auto-invoked.

Reserve **hooks** for cases that need *deterministic control* — actions that must always happen rather than relying on the model to choose to run them. Do not use hooks for judgment; escalate to prompt or agent hooks only when the decision needs judgment.

Use **MCP servers** for long-lived, stateful capabilities and tools that would be too expensive to spawn per event, or that need to push unprompted updates.

**3. Runtime contracts**

- **Skills and commands** run under Claude Code's native orchestration. Skills are inline; commands spawn as needed and run to completion.
- **Agents** run in isolated contexts with tool restrictions and memory as configured via frontmatter.
- **Hooks** are per-event child processes:
  - Command hooks spawn a shell per matching event.
  - Default timeouts: 60 seconds for agent hooks, 50 tool-use turns for prompt hooks.
  - Use the `if` field for targeted matching, but never for hard allow/deny (filters fail open on unparseable input).
  - Communicate via stdout/stderr and exit code, or structured JSON on stdout for permission decisions.
- **MCP servers** are long-lived:
  - Default to lazy tool search (`alwaysLoad: false`) to minimize context impact at session start.
  - Respect the 5-second connect timeout.
  - Store durable state in `${CLAUDE_PLUGIN_DATA}`; never treat `${CLAUDE_PLUGIN_ROOT}` as durable.
- **State precedence** for MCP configuration follows local/user/project scopes, with whole-file precedence and no field merging.

**4. Language and build tooling**

- **First-party harness code** — TypeScript executed via Node native type stripping (Node >=22.12), constrained to erasable syntax only. This gives zero-build local execution for skills, hooks, and scripts.
- **Distributed or reusable packages** — a real build (TypeScript + esbuild or Vite) because TypeScript in `node_modules` cannot run directly.
- **Engine/hot-loop** — start with TypeScript/Node and measure before considering a rewrite to Rust or Go. A personal daily-driver harness is unlikely to need engine-layer performance optimization early.
- **Tool bundles** — self-contained directories with a `config.yaml`, `bin/`, and optional assets, following the SWE-agent pattern; duplicate names fail loudly.

**5. Build-to-delete discipline**

Every layer must ship with a kill switch so it can be disabled and measured. When disabling a layer pushes work to a heavier layer (e.g., a skill to an agent), track the context-window cost and delete the layer only when quality has improved enough to justify it.

## Alternatives Considered

- **Markdown-only plugin** — thin plugin with no executable code, relying entirely on native CC. Rejected because it cannot provide deterministic control (hooks) or long-lived tools (MCP servers) and would force all automation into inline prompts.
- **Go or Rust for the first-party harness** — matches the engine-layer pattern seen in Codex, Goose, and Open Interpreter. Rejected as the starting point because it increases the cost of iteration and the daily-driver harness does not yet have proven hot-loop constraints; we can re-evaluate if measurements justify it.
- **Python first-party** — strong agent-framework ecosystem (AutoGen, ADK-Python). Rejected because the plugin's executable layers are closer to hook-style one-shot scripts and CLI tools than to a dynamic control-flow engine; TypeScript zero-build is a better fit for CC's Node-based environment.
- **Built TypeScript everywhere** — safer and more familiar distribution. Rejected for first-party code because it adds a build step to every edit; Node native type stripping is sufficient for code that stays in the repo and is not published as a dependency.

## Consequences

- **Pros**
  - The skill-first layering minimizes context-window overhead and keeps the harness lightweight.
  - Zero-build TypeScript removes friction for editing first-party hooks and scripts.
  - Reserving hooks for deterministic control and MCP servers for long-lived tools keeps each layer's runtime contract coherent.
  - Build-to-delete discipline prevents the harness from accumulating stale assumptions about model capabilities.

- **Cons / risks**
  - Node native type stripping restricts TypeScript syntax (no enums, decorators, parameter properties).
  - Per-event hook spawn cost is unmeasured in this harness; heavy per-tool hooks may need to be reclassified as MCP servers.
  - The "lightest-weight wins" default can be subtle in practice — ambiguous intent may route to the wrong layer.
  - A future engine rewrite to Rust/Go remains an open possibility, and this decision should be revisited if hot-loop performance becomes a constraint.

## Remaining gaps for follow-up

- No measured hook cold-start/throughput benchmarks for this harness.
- No canonical layer diagram for a personal/daily-driver harness; the current split is prose/table-based.
- No anti-pattern catalogue of layers that were later removed in real harnesses.
- Unclear whether `erasable-syntax-only`, `tsx-typescript-loader`, and `bun-as-bundler` pages exist in the wiki; worth confirming for the polyglot-packaging story.
