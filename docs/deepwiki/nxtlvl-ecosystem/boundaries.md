# Ecosystem Boundaries

> What each plugin owns and what it explicitly leaves to the others or to native Claude Code.

## Core `nxtlvl` plugin

### Owns

- The daily-driver user surface: commands, skills, agents, hooks, and workflows.
- The production harness's plumbing: config, context assembly, memory, hooks, composition, audit.
- The quality and safety guardrails: review, doubt-driven development, dangerous-bash gate, audit.
- The installed daily-driver state in `~/.claude` (via local-marketplace install).

### Does not own

- Orchestration primitives (routing, dispatch, tool loop, context-window assembly) — native Claude Code.
- Building new harness components or agent teams — `nxtlvl-labs`.
- The reference corpus of reviewed production harnesses — `nxtlvl-wiki`.
- General-purpose web search, browser use, or GUI automation — native CC or external tools.

## `nxtlvl-labs` plugin

### Owns

- The creation environment for new harness components: skills, agents, commands, hooks, MCP servers, domain teams, and whole new harnesses.
- The source-driven development workflow: research → compare → test → eval → decide.
- Meta-builder domain teams: agents/skills whose job is to build artifacts for the core plugin.
- Experimentation infrastructure: eval runner, A/B runner, strategy comparison.
- The promotion handoff from lab artifact to core plugin artifact.

### Does not own

- Daily production work — `nxtlvl`.
- The reference corpus — `nxtlvl-wiki`.
- Native orchestration — Claude Code.

## `nxtlvl-wiki` plugin

### Owns

- The ingestion pipeline for reviewed production harnesses and top-tier research.
- The queryable, synthesized knowledge layer over those sources.
- The evidence-boundary policy: orientation and leads, never evidence.
- Curation and versioning of the corpus.

### Does not own

- Build decisions — it informs them; the core/labs plugins decide.
- The execution of workflows — `nxtlvl`.
- The creation of new harness components — `nxtlvl-labs`.

## Native Claude Code (the platform floor)

### Owns

- Skill routing, agent dispatch, tool-use loop, context-window assembly, permission enforcement.
- The marketplace/install surface and plugin loading.
- Model inference, subagent isolation, and built-in tools.

### Does not own

- Any nxtlvl-specific logic, conventions, or workflows.

## Boundary rules

1. **Core never builds itself.** When nxtlvl needs a new component, the work happens in `nxtlvl-labs` and is promoted.
2. **Labs never does daily work.** When real client/agent work is in progress, only the core plugin is invoked.
3. **Wiki never decides.** It provides leads and orientation; every claim is verified at primary source before it reaches an ADR.
4. **Native orchestration is never reconstructed.** The plugins compose above it, not below it.
