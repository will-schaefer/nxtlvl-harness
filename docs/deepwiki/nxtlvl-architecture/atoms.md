# nxtlvl Core Plugin — Atom Coverage

> Atom-level coverage of the core `nxtlvl` plugin. Each row is one atom from the
> [atomic taxonomy](../../../docs/reference/agent-harness-atomic-taxonomy.md), with owner, status,
> priority, and dependency layer.
>
> **Status legend:** `NATIVE` = provided by Claude Code; `BUILT` = ships today; `PLANNED` = committed;
> `REJECTED` = deliberate no; `OOS` = out of scope; `OPEN` = no position yet.
>
> **Priority legend:** `foundational` = other atoms depend on it; `phase-0` = first working slice;
> `phase-1` = next wave; `reactive` = built when a real gap proves itself; `deferred` = explicitly not now.

## A · Orchestration primitives (native)

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| A1 | Skill routing | NATIVE | foundational | native | The router *biases* (D8); dispatch is native |
| A2 | Agent dispatch | NATIVE | foundational | native | nxtlvl owns *which* agents + *when*, not the mechanism |
| A3 | Deterministic multi-agent control | NATIVE | foundational | native | Intent: "deterministic control uses native `Workflow`" |
| A4 | Tool-use loop | NATIVE | foundational | native | — |
| A5 | Context-window assembly | NATIVE | foundational | native | nxtlvl shapes *inputs* (family D), not the packer |
| A6 | Model inference / sampling | NATIVE | foundational | native | — |
| A7 | Subagent context isolation | NATIVE | foundational | native | The substrate delegation rides on (G) |
| A8 | Permission enforcement engine | NATIVE | foundational | native | nxtlvl writes the *rules* (B5); platform enforces |

## B · Packaging & configuration

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| B1 | Plugin manifest | BUILT | foundational | packaging | `plugins/nxtlvl/.claude-plugin/plugin.json` |
| B2 | Marketplace / install mechanism | BUILT | foundational | packaging | `plugins/nxtlvl/scripts/install-nxtlvl.sh` |
| B3 | Layered settings | BUILT | foundational | packaging | `config/claude/settings.json` (g) |
| B4 | Environment variables | BUILT | foundational | packaging | `NXTLVL_*` switches across `hooks.json` |
| B5 | Permissions (allow/deny/ask) | BUILT | foundational | packaging | `settings.json` (g) |
| B6 | Permission modes | NATIVE | foundational | packaging | Platform feature; nxtlvl sets defaults |
| B7 | MCP server config | BUILT | foundational | packaging | `plugins/nxtlvl/.mcp.json` (context7, deepwiki) |
| B8 | Namespace | BUILT | foundational | packaging | `nxtlvl:` prefix |
| B9 | Versioning / promotion tag | PLANNED | phase-0 | packaging | Install script exists; tag ritual pending |
| B10 | Dev/prod separation | BUILT | foundational | packaging | This repo = workbench |
| B11 | Output style | BUILT | phase-0 | packaging | `config/claude/output-styles/co-builder.md` (g) |
| B12 | Keybindings | OOS | deferred | packaging | Native config; not nxtlvl-managed |
| B13 | Statusline | BUILT | phase-0 | packaging | `config/claude/statusline-command.sh` (g) |

## C · Components

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| C1 | Command | BUILT | phase-0 | components | 13 shipped (`commands/`) |
| C2 | Agent | BUILT | phase-0 | components | 8 shipped (`agents/`) |
| C3 | Skill | BUILT | phase-0 | components | 8 shipped (`skills/`) |
| C4 | Rule | BUILT | phase-0 | components | `config/claude/rules/decisions.md` (g) |
| C5 | Hook | BUILT | foundational | components | Family F |
| C6 | Custom tool | OPEN | reactive | components | No bespoke tools yet; MCP (B7) covers current need |
| C7 | MCP tool | BUILT | phase-0 | components | via context7 / deepwiki servers |
| C8 | Typed output contract | BUILT | phase-0 | components | `skills/doubt-driven-development/reviewer-output.schema.json` |
| C9 | Alias / router entry | BUILT | phase-0 | components | `/interview-me`, `/grill-me`, `/idea-refine` |
| C10 | Progressive-disclosure reference | BUILT | phase-0 | components | `skills/harness-review/references/**` |
| C11 | Bundled script | BUILT | phase-0 | components | `skills/crop/scripts/`, `lib/*.js` |
| C12 | Shared library | BUILT | foundational | components | `plugins/nxtlvl/lib/` |
| C13 | Sub-agent of an agent | NATIVE | phase-1 | components | Mechanism native; composition is G |

## D · Context assembly & injection

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| D1 | Global memory file | BUILT | foundational | context | `config/claude/CLAUDE.md` (g) |
| D2 | Project memory file | BUILT | foundational | context | `./CLAUDE.md` |
| D3 | SessionStart injection | BUILT | foundational | context | `hooks/briefing.js` |
| D4 | Skill description surface | BUILT | foundational | context | Every `SKILL.md` frontmatter |
| D5 | Context budget / token accounting | BUILT | foundational | context | `ADR-008` policy |
| D6 | Pointers-over-content | BUILT | foundational | context | `ADR-008` hard rule |
| D7 | Compaction steering | BUILT | phase-0 | context | `hooks/precompact.js` |
| D8 | Per-prompt relevance routing | BUILT | foundational | context | `skills/nxtlvl-router/` |
| D9 | Imported / `@`-referenced files | NATIVE | phase-1 | context | Native CLAUDE.md feature; used sparingly |
| D10 | Context-pressure awareness | BUILT | phase-0 | context | `hooks/context-alert.js` |
| D11 | Session bookmark recall | BUILT | phase-0 | context | `lib/bookmarks.js` + `briefing.js` |
| D12 | Retriever / RAG over a corpus | REJECTED | deferred | context | Hand-built retriever = orchestration anti-goal |

## E · Memory & learning

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| E1 | Native file memory | BUILT | foundational | memory | `config/claude/memory/` (g) |
| E2 | Observation capture | BUILT | foundational | memory | `hooks/capture.js` + `lib/obs-log.js` |
| E3 | Instinct distillation | BUILT | phase-0 | memory | `hooks/observe.js` + `lib/observer-runner.js` |
| E4 | Instinct lifecycle | BUILT | phase-0 | memory | `/instinct-status` `/promote` `/evolve` `/prune` |
| E5 | Recall / retrieval | BUILT | phase-0 | memory | `lib/recall.js` |
| E6 | Memory scoping (project identity) | BUILT | foundational | memory | `lib/project-identity.js` |
| E7 | Secret scrubbing on write | BUILT | foundational | memory | `lib/scrub.js` |
| E8 | Write discipline / honesty | BUILT | foundational | memory | `ruflo-distillation.md` learn-against |
| E9 | Concurrency guard | BUILT | foundational | memory | `observe.js` guard |
| E10 | Role/agent-scoped memory | OOS | deferred | memory | Architectural contrast only |
| E11 | Cross-session episodic store | REJECTED | deferred | memory | "A fourth memory system" — explicitly out |

## F · Lifecycle hooks

| ID | Atom (event) | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| F1 | SessionStart | BUILT | foundational | hooks | `briefing.js` |
| F2 | UserPromptSubmit | BUILT | phase-0 | hooks | `session-title.js` |
| F3 | PreToolUse | BUILT | foundational | hooks | `fallback-log.sh`, `dangerous-bash.js`, `capture.js` |
| F4 | PostToolUse | BUILT | foundational | hooks | `context-alert.js`, `capture.js`, `observe.js` |
| F5 | PreCompact | BUILT | phase-0 | hooks | `precompact.js` |
| F6 | SessionEnd | BUILT | phase-0 | hooks | `close.js` |
| F7 | Stop | OPEN | reactive | hooks | No Stop hook; candidate for stop-slop gate |
| F8 | SubagentStop | OPEN | reactive | hooks | Uncovered |
| F9 | Notification | OPEN | reactive | hooks | Uncovered |
| F10 | Exit-code contract | BUILT | foundational | hooks | `ADR-010` |
| F11 | Fail-open-on-error | BUILT | foundational | hooks | Absolute, gates included |
| F12 | Blocking gate (whitelisted) | BUILT | phase-0 | hooks | `dangerous-bash.js` |
| F13 | Kill switch | BUILT | foundational | hooks | `NXTLVL_*=off` on every hook |
| F14 | Flat registration / dispatcher | BUILT | foundational | hooks | `ADR-015` hook corollary |
| F15 | Detached background spawn | BUILT | phase-0 | hooks | `observe.js` spawns detached observer |

## G · Composition & orchestration

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| G1 | Orchestrator/specialist model | BUILT | foundational | composition | Intent L3 operating model |
| G2 | Delegation policy | BUILT | phase-0 | composition | `ADR-023` |
| G3 | Agent chaining | BUILT | phase-0 | composition | Ideation pipeline |
| G4 | Parallel fan-out | BUILT | phase-0 | composition | `harness-review` fan-out |
| G5 | Output composition | BUILT | phase-0 | composition | Pointers-over-content briefs |
| G6 | Native-agent-+-injected-skill vs custom agent | BUILT | phase-0 | composition | `ADR-012` / `ADR-013` |
| G7 | Context preservation via delegation | BUILT | phase-0 | composition | Intent L3 operating model |
| G8 | Workflow DAG authoring | PLANNED | phase-1 | composition | Rides native `Workflow`; authored per domain |
| G9 | Self-evolving topology | REJECTED | deferred | composition | Autonomous-loop shape — out |
| G10 | Capability domain | PLANNED | phase-0 | composition | Confident-core committed, unbuilt |
| G11 | Workflow domain | PLANNED | phase-0 | composition | Phase-0 scaffolds |

## H · Tooling & external capability

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| H1 | Built-in tools | NATIVE | foundational | tooling | Platform |
| H2 | Per-agent tool scoping | BUILT | phase-0 | tooling | Read-only reviewers |
| H3 | Read-only sandbox | BUILT | phase-0 | tooling | `doubt-reviewer`, `context-scout` |
| H4 | MCP server integration | BUILT | phase-0 | tooling | context7, deepwiki |
| H5 | Docs grounding (primary-source) | BUILT | phase-0 | tooling | `/context7` + `context7-scout` |
| H6 | Repo orientation (non-evidence) | BUILT | phase-0 | tooling | `deepwiki-scout` |
| H7 | Deferred / lazy tool loading | NATIVE | phase-1 | tooling | Platform `ToolSearch` |
| H8 | GitHub operations | BUILT | phase-0 | tooling | `git-workflow-runner` + `github-workflow` |
| H9 | Browser / computer-use tool | OOS | deferred | tooling | Native CC is the runtime backstop |
| H10 | Image/screenshot handling | BUILT | phase-0 | tooling | `/crop` + `skills/crop/` |

## I · Quality, audit & governance

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| I1 | Five-axis review | BUILT | phase-0 | quality | `skills/review/` |
| I2 | Doubt-driven adversarial review | BUILT | phase-0 | quality | `skills/doubt-driven-development/` + `doubt-reviewer` |
| I3 | Objective audit gate | PLANNED | phase-1 | quality | `ADR-014`; `nxtlvl:audit` not yet on disk |
| I4 | Versioned audit rubric | PLANNED | phase-1 | quality | `ADR-014` |
| I5 | Secrets / no-leak gate | BUILT | foundational | quality | `lib/scrub.js` |
| I6 | Dangerous-command guard | BUILT | phase-0 | quality | `hooks/dangerous-bash.js` |
| I7 | Frontmatter / dead-ref validation | PLANNED | phase-1 | quality | Audit sub-check |

## Coverage summary

| Family | NATIVE | BUILT | PLANNED | OPEN | REJECTED | OOS | Total |
|---|---|---|---|---|---|---|---|
| A | 8 | 0 | 0 | 0 | 0 | 0 | 8 |
| B | 1 | 9 | 1 | 0 | 0 | 1 | 12 |
| C | 1 | 10 | 0 | 1 | 0 | 0 | 12 |
| D | 1 | 9 | 0 | 0 | 1 | 1 | 12 |
| E | 0 | 8 | 0 | 0 | 1 | 2 | 11 |
| F | 0 | 11 | 0 | 3 | 0 | 0 | 14 |
| G | 0 | 6 | 2 | 0 | 1 | 1 | 10 |
| H | 2 | 6 | 0 | 0 | 0 | 2 | 10 |
| I | 0 | 3 | 2 | 0 | 0 | 0 | 5 |

> **Note:** Status and priority are directional and may shift as the architecture map evolves.
