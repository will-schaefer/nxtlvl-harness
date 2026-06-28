# nxtlvl-labs Plugin — Build Order

> Foundational → phase 0 → phase 1 → reactive. The order in which the labs plugin's atoms should be built.

## Foundational layer (must exist first)

### Packaging & config

- LAB-B1 Plugin manifest
- LAB-B2 Marketplace / install mechanism
- LAB-B3 Layered settings
- LAB-B4 Environment variables
- LAB-B5 Permissions
- LAB-B7 MCP server config
- LAB-B8 Namespace
- LAB-B10 Dev/prod separation for labs

### Context & memory

- LAB-D1 Lab global memory file
- LAB-D2 Lab project memory file
- LAB-D3 Lab SessionStart injection
- LAB-D4 Lab skill description surface
- LAB-D5 Lab context budget
- LAB-D6 Pointers-over-content
- LAB-E1 Lab native file memory
- LAB-E2 Experiment capture
- LAB-E6 Experiment scoping
- LAB-E7 Secret scrubbing on write
- LAB-E9 Concurrency guard

### Hooks

- LAB-F1 SessionStart
- LAB-F3 PreToolUse
- LAB-F4 PostToolUse
- LAB-F10 Exit-code contract
- LAB-F11 Fail-open-on-error
- LAB-F13 Kill switch
- LAB-F14 Flat registration / dispatcher

### Quality & safety

- LAB-E8 Write discipline / honesty
- LAB-I5 Secrets / no-leak gate

### Composition

- LAB-G1 Lab orchestrator/specialist model

## Phase 0 (first working slice)

These atoms let the labs plugin run its first source-driven development project and produce a core artifact.

### Components

- LAB-C1 Lab command
- LAB-C2 Lab agent
- LAB-C3 Lab skill
- LAB-C4 Lab rule
- LAB-C5 Lab hook
- LAB-C7 Lab MCP tool
- LAB-C8 Typed output contract for lab artifacts
- LAB-C9 Lab alias / router entry
- LAB-C12 Shared library

### Context & memory

- LAB-D8 Per-prompt relevance routing
- LAB-E3 Decision distillation
- LAB-E4 Decision lifecycle
- LAB-E5 Experiment recall

### Composition

- LAB-G2 Lab delegation policy
- LAB-G3 Meta-builder chaining
- LAB-G4 Parallel fan-out
- LAB-G5 Lab output composition
- LAB-G6 Native-agent-+-injected-skill vs custom agent
- LAB-G7 Context preservation via delegation
- LAB-G10 Creation output domain
- LAB-G11 Meta-workflow domain

### Tooling

- LAB-H2 Per-agent tool scoping
- LAB-H3 Read-only sandbox
- LAB-H4 MCP server integration
- LAB-H5 Docs grounding (primary-source)
- LAB-H6 Repo orientation (non-evidence)
- LAB-H8 GitHub operations

### Quality

- LAB-I1 Five-axis review of lab artifacts
- LAB-I2 Doubt-driven adversarial review of lab artifacts
- LAB-I3 Promotion gate
- LAB-I6 Dangerous-command guard

### Meta-workflows

- Source-driven development workflow (research → compare → test → eval → decide)
- Promotion handoff workflow

## Phase 1 (next wave)

- LAB-C13 Sub-agent of an agent
- LAB-D9 Imported / `@`-referenced files
- LAB-D7 Lab compaction steering
- LAB-D10 Lab context-pressure awareness
- LAB-D11 Lab session bookmark recall
- LAB-F5 PreCompact
- LAB-F6 SessionEnd
- LAB-F12 Blocking gate (whitelisted)
- LAB-F15 Detached background spawn
- LAB-G8 Meta-workflow DAG authoring
- LAB-I4 Versioned promotion rubric
- LAB-I7 Frontmatter / dead-ref validation
- LAB-B9 Versioning / promotion tag
- LAB-B11 Output style
- LAB-B13 Statusline
- LAB-H10 Image/screenshot handling

## Reactive / deferred

- LAB-C6 Lab custom tool
- LAB-F7 Stop
- LAB-F8 SubagentStop
- LAB-F9 Notification
- LAB-B12 Keybindings (OOS)
- LAB-D12 Retriever / RAG (REJECTED)
- LAB-E10 Role/agent-scoped lab memory (OOS)
- LAB-E11 Cross-session episodic lab store (REJECTED)
- LAB-G9 Self-evolving topology (REJECTED)
- LAB-H7 Deferred / lazy tool loading (NATIVE)
- LAB-H9 Browser / computer-use tool (OOS)
- LAB-C10 Progressive-disclosure reference
- LAB-C11 Bundled script

## Build-order rules

1. **Foundational atoms are built first.** Labs needs to load and stay safe before it can build anything.
2. **Phase 0 atoms enable the first source-driven project.** The first milestone is producing a proven core artifact.
3. **Phase 1 atoms mature the lab pipeline.** They add eval, A/B, structured promotion, and workflow DAGs.
4. **Reactive atoms are intake-gated.** They require a real lab project to prove their need.
5. **Deferred atoms are explicitly not built now.** They may be revisited later through the scope gate.
