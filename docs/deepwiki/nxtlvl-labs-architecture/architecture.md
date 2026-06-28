# nxtlvl-labs Plugin — Subsystem Map

> The nine subsystems of the labs plugin, mapped to dependency layers. The labs plugin mirrors the
> core plugin's structure where possible, but its components are meta-builders rather than
> production workflows.

## Subsystem stack

```
LAYER 7 · Creation output domains    harnesses · multi-agent teams · skills · commands · MCPs · plugins
        │ produced by
LAYER 6 · Meta-workflows             source-driven dev · eval · A/B · strategy comparison
        │ ride on
LAYER 5 · Composition layer          meta-builder teams · artifact chaining · promotion pipeline
        │ rides on
LAYER 4 · Tooling & capability       reference query · eval runner · A/B runner · artifact generator
        │ rides on
LAYER 3 · Context & memory             lab context assembly · experiment memory · decision log
        │ rides on
LAYER 2 · Components & packaging       lab commands · agents · skills · hooks · shared libraries
        │ rides on
LAYER 1 · Native floor                 skill routing · dispatch · tool loop · context-window assembly
```

## Subsystem descriptions

### LAB-A · Orchestration primitives (native)

Same native floor as the core plugin. The labs plugin also rides on Claude Code and does not reconstruct orchestration.

- LAB-A1 Skill routing
- LAB-A2 Agent dispatch
- LAB-A3 Deterministic multi-agent control
- LAB-A4 Tool-use loop
- LAB-A5 Context-window assembly
- LAB-A6 Model inference / sampling
- LAB-A7 Subagent context isolation
- LAB-A8 Permission enforcement engine

### LAB-B · Packaging & configuration

How the labs plugin is declared, layered, installed, versioned, and permissioned.

- LAB-B1 Plugin manifest
- LAB-B2 Marketplace / install mechanism
- LAB-B3 Layered settings
- LAB-B4 Environment variables
- LAB-B5 Permissions
- LAB-B6 Permission modes
- LAB-B7 MCP server config
- LAB-B8 Namespace (`nxtlvl-labs:`)
- LAB-B9 Versioning / promotion tag
- LAB-B10 Dev/prod separation for labs
- LAB-B11 Output style
- LAB-B12 Keybindings
- LAB-B13 Statusline

### LAB-C · Components

The meta-builder components that create core artifacts.

- LAB-C1 Lab command
- LAB-C2 Lab agent
- LAB-C3 Lab skill
- LAB-C4 Lab rule
- LAB-C5 Lab hook
- LAB-C6 Lab custom tool
- LAB-C7 Lab MCP tool
- LAB-C8 Typed output contract for lab artifacts
- LAB-C9 Lab alias / router entry
- LAB-C10 Progressive-disclosure reference
- LAB-C11 Bundled script
- LAB-C12 Shared library
- LAB-C13 Sub-agent of an agent

### LAB-D · Context assembly & injection

What the labs plugin needs to know to run source-driven development.

- LAB-D1 Lab global memory file
- LAB-D2 Lab project memory file
- LAB-D3 Lab SessionStart injection
- LAB-D4 Lab skill description surface
- LAB-D5 Lab context budget
- LAB-D6 Pointers-over-content
- LAB-D7 Lab compaction steering
- LAB-D8 Per-prompt relevance routing
- LAB-D9 Imported / `@`-referenced files
- LAB-D10 Lab context-pressure awareness
- LAB-D11 Lab session bookmark recall
- LAB-D12 Retriever / RAG over corpus

### LAB-E · Memory & learning

Memory for experiments, decisions, and comparisons.

- LAB-E1 Lab native file memory
- LAB-E2 Experiment capture
- LAB-E3 Decision distillation
- LAB-E4 Decision lifecycle
- LAB-E5 Experiment recall
- LAB-E6 Experiment scoping
- LAB-E7 Secret scrubbing on write
- LAB-E8 Write discipline / honesty
- LAB-E9 Concurrency guard
- LAB-E10 Role/agent-scoped lab memory
- LAB-E11 Cross-session episodic lab store

### LAB-F · Lifecycle hooks

Lean, flat, fail-open on error.

- LAB-F1 SessionStart
- LAB-F2 UserPromptSubmit
- LAB-F3 PreToolUse
- LAB-F4 PostToolUse
- LAB-F5 PreCompact
- LAB-F6 SessionEnd
- LAB-F7 Stop
- LAB-F8 SubagentStop
- LAB-F9 Notification
- LAB-F10 Exit-code contract
- LAB-F11 Fail-open-on-error
- LAB-F12 Blocking gate (whitelisted)
- LAB-F13 Kill switch
- LAB-F14 Flat registration / dispatcher
- LAB-F15 Detached background spawn

### LAB-G · Composition & orchestration

How meta-builder teams work together and how artifacts flow toward promotion.

- LAB-G1 Lab orchestrator/specialist model
- LAB-G2 Lab delegation policy
- LAB-G3 Meta-builder chaining
- LAB-G4 Parallel fan-out
- LAB-G5 Lab output composition
- LAB-G6 Native-agent-+-injected-skill vs custom agent
- LAB-G7 Context preservation via delegation
- LAB-G8 Meta-workflow DAG authoring
- LAB-G9 Self-evolving topology
- LAB-G10 Creation output domain
- LAB-G11 Meta-workflow domain

### LAB-H · Tooling & external capability

The tooling the labs plugin uses to evaluate and compare strategies.

- LAB-H1 Built-in tools
- LAB-H2 Per-agent tool scoping
- LAB-H3 Read-only sandbox
- LAB-H4 MCP server integration
- LAB-H5 Docs grounding (primary-source)
- LAB-H6 Repo orientation (non-evidence)
- LAB-H7 Deferred / lazy tool loading
- LAB-H8 GitHub operations
- LAB-H9 Browser / computer-use tool
- LAB-H10 Image/screenshot handling

### LAB-I · Quality & promotion gate

The gates that decide whether a lab artifact graduates to the core plugin.

- LAB-I1 Five-axis review of lab artifacts
- LAB-I2 Doubt-driven adversarial review of lab artifacts
- LAB-I3 Promotion gate
- LAB-I4 Versioned promotion rubric
- LAB-I5 Secrets / no-leak gate
- LAB-I6 Dangerous-command guard
- LAB-I7 Frontmatter / dead-ref validation
