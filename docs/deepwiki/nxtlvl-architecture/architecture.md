# nxtlvl Core Plugin — Subsystem Map

> The nine subsystems of the core plugin, mapped to dependency layers.

## Subsystem stack

```
LAYER 7 · Capability domains      Next.js/TS · Python · Rust · Knowledge · Quality · Agentic
        │ operate on
LAYER 6 · Workflow domains        review · dev · research · agent-building
        │ ride on
LAYER 5 · Composition layer       orchestrator + specialists · chaining · fan-out · Workflow DAG
        │ rides on
LAYER 4 · Tooling & capability    built-ins · MCP · Context7 · DeepWiki · GitHub · image handling
        │ rides on
LAYER 3 · Context & memory        context assembly · memory · learning · hooks
        │ rides on
LAYER 2 · Components & packaging  commands · agents · skills · hooks · shared libraries · plugin manifest
        │ rides on
LAYER 1 · Native floor            skill routing · dispatch · tool loop · context-window assembly
```

## Subsystem descriptions

### A · Orchestration primitives (native)

The dispatcher, the loop, the window. Provided by Claude Code. nxtlvl's first principle is that these stay native: a hand-built version is structurally a slower, capped shim around the real one.

- A1 Skill routing
- A2 Agent dispatch
- A3 Deterministic multi-agent control
- A4 Tool-use loop
- A5 Context-window assembly
- A6 Model inference / sampling
- A7 Subagent context isolation
- A8 Permission enforcement engine

### B · Packaging & configuration

How the plugin is declared, layered, installed, versioned, and permissioned.

- B1 Plugin manifest
- B2 Marketplace / install mechanism
- B3 Layered settings
- B4 Environment variables
- B5 Permissions
- B6 Permission modes
- B7 MCP server config
- B8 Namespace
- B9 Versioning / promotion tag
- B10 Dev/prod separation
- B11 Output style
- B12 Keybindings
- B13 Statusline

### C · Components

The five-plus component types every harness assembles from.

- C1 Command
- C2 Agent
- C3 Skill
- C4 Rule
- C5 Hook
- C6 Custom tool
- C7 MCP tool
- C8 Typed output contract
- C9 Alias / router entry
- C10 Progressive-disclosure reference
- C11 Bundled script
- C12 Shared library
- C13 Sub-agent of an agent

### D · Context assembly & injection

What earns a slot in the model's attention. The learning artifact is the policy, not the plumbing.

- D1 Global memory file
- D2 Project memory file
- D3 SessionStart injection
- D4 Skill description surface
- D5 Context budget / token accounting
- D6 Pointers-over-content
- D7 Compaction steering
- D8 Per-prompt relevance routing
- D9 Imported / `@`-referenced files
- D10 Context-pressure awareness
- D11 Session bookmark recall
- D12 Retriever / RAG over a corpus

### E · Memory & learning

Extend native file-memory; never a fourth store.

- E1 Native file memory
- E2 Observation capture
- E3 Instinct distillation
- E4 Instinct lifecycle
- E5 Recall / retrieval
- E6 Memory scoping (project identity)
- E7 Secret scrubbing on write
- E8 Write discipline / honesty
- E9 Concurrency guard
- E10 Role/agent-scoped memory
- E11 Cross-session episodic store

### F · Lifecycle hooks

Lean, flat, fail-open on error.

- F1 SessionStart
- F2 UserPromptSubmit
- F3 PreToolUse
- F4 PostToolUse
- F5 PreCompact
- F6 SessionEnd
- F7 Stop
- F8 SubagentStop
- F9 Notification
- F10 Exit-code contract
- F11 Fail-open-on-error
- F12 Blocking gate (whitelisted)
- F13 Kill switch
- F14 Flat registration / dispatcher
- F15 Detached background spawn

### G · Composition & orchestration

Native gives dispatch; nxtlvl owns the composition — who delegates to whom, when, and how outputs merge.

- G1 Orchestrator/specialist model
- G2 Delegation policy
- G3 Agent chaining
- G4 Parallel fan-out
- G5 Output composition
- G6 Native-agent-+-injected-skill vs custom agent
- G7 Context preservation via delegation
- G8 Workflow DAG authoring
- G9 Self-evolving topology
- G10 Capability domain
- G11 Workflow domain

### H · Tooling & external capability

The action surface — built-ins, MCP, and how tools are scoped per executor.

- H1 Built-in tools
- H2 Per-agent tool scoping
- H3 Read-only sandbox
- H4 MCP server integration
- H5 Docs grounding (primary-source)
- H6 Repo orientation (non-evidence)
- H7 Deferred / lazy tool loading
- H8 GitHub operations
- H9 Browser / computer-use tool
- H10 Image/screenshot handling

### I · Quality, audit & governance

The gates that decide what stands.

- I1 Five-axis review
- I2 Doubt-driven adversarial review
- I3 Objective audit gate
- I4 Versioned audit rubric
- I5 Secrets / no-leak gate
- I6 Dangerous-command guard
- I7 Frontmatter / dead-ref validation
