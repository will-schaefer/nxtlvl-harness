# nxtlvl Core Plugin — Build Order

> Foundational → phase 0 → phase 1 → reactive. The order in which the core plugin's atoms should be built or promoted, based on dependency and workload carrying capacity.

## Foundational layer (must exist first)

These atoms other atoms depend on. Without them, the plugin cannot load or cannot keep itself safe.

### Packaging & config

- B1 Plugin manifest
- B2 Marketplace / install mechanism
- B3 Layered settings
- B4 Environment variables
- B5 Permissions
- B7 MCP server config
- B8 Namespace
- B10 Dev/prod separation

### Context & memory

- D1 Global memory file
- D2 Project memory file
- D3 SessionStart injection
- D4 Skill description surface
- D5 Context budget / token accounting
- D6 Pointers-over-content
- E1 Native file memory
- E2 Observation capture
- E6 Memory scoping (project identity)
- E7 Secret scrubbing on write
- E9 Concurrency guard

### Hooks

- F1 SessionStart
- F3 PreToolUse
- F4 PostToolUse
- F10 Exit-code contract
- F11 Fail-open-on-error
- F13 Kill switch
- F14 Flat registration / dispatcher

### Quality & safety

- E8 Write discipline / honesty
- I5 Secrets / no-leak gate

## Phase 0 (first working slice)

These atoms let the core plugin carry the first real workflows: review, dev, research, and git workflow.

### Components

- C1 Command
- C2 Agent
- C3 Skill
- C4 Rule
- C7 MCP tool
- C8 Typed output contract
- C9 Alias / router entry
- C10 Progressive-disclosure reference
- C11 Bundled script
- C12 Shared library

### Context & memory

- D7 Compaction steering
- D8 Per-prompt relevance routing
- D10 Context-pressure awareness
- D11 Session bookmark recall
- E3 Instinct distillation
- E4 Instinct lifecycle
- E5 Recall / retrieval

### Hooks

- F2 UserPromptSubmit
- F5 PreCompact
- F6 SessionEnd
- F12 Blocking gate (whitelisted)
- F15 Detached background spawn

### Composition

- G1 Orchestrator/specialist model
- G2 Delegation policy
- G3 Agent chaining
- G4 Parallel fan-out
- G5 Output composition
- G6 Native-agent-+-injected-skill vs custom agent
- G7 Context preservation via delegation

### Tooling

- H2 Per-agent tool scoping
- H3 Read-only sandbox
- H4 MCP server integration
- H5 Docs grounding (primary-source)
- H6 Repo orientation (non-evidence)
- H8 GitHub operations
- H10 Image/screenshot handling

### Quality

- I1 Five-axis review
- I2 Doubt-driven adversarial review
- I6 Dangerous-command guard

### Packaging & config

- B9 Versioning / promotion tag
- B11 Output style
- B13 Statusline

### Capability & workflow domains

- G10 Capability domain (build-now confident core: Python, TS/JS, Rust, Frontend & UI, Backend/Architecture)
- G11 Workflow domain (review, dev, research)

## Phase 1 (next wave)

These atoms mature the harness: broader workflows, structured audit, and deeper composition.

### Components

- C13 Sub-agent of an agent

### Context

- D9 Imported / `@`-referenced files

### Composition

- G8 Workflow DAG authoring

### Quality

- I3 Objective audit gate
- I4 Versioned audit rubric
- I7 Frontmatter / dead-ref validation

## Reactive / deferred

These atoms are built only when a real gap proves itself, or are explicitly deferred.

### Reactive

- C6 Custom tool
- F7 Stop
- F8 SubagentStop
- F9 Notification

### Deferred / out of scope

- B12 Keybindings (OOS)
- D12 Retriever / RAG (REJECTED)
- E10 Role/agent-scoped memory (OOS)
- E11 Cross-session episodic store (REJECTED)
- G9 Self-evolving topology (REJECTED)
- H7 Deferred / lazy tool loading (NATIVE)
- H9 Browser / computer-use tool (OOS)

## Build-order rules

1. **Foundational atoms are built first.** They have no intra-plugin dependencies that are not yet built.
2. **Phase 0 atoms are the first working slice.** They are enough to carry review, dev, research, and git workflows.
3. **Phase 1 atoms mature the harness.** They depend on phase 0 or are not needed for the first slice.
4. **Reactive atoms are intake-gated.** They require a real task to prove their need before being built.
5. **Deferred atoms are explicitly not built now.** They may be revisited later through the scope gate.
