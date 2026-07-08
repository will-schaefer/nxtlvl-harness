# nxtlvl-labs Plugin — Atom Coverage

> Atom-level coverage of the `nxtlvl-labs` plugin. The plugin **exists on disk** — its foundation
> layer (Spine + reference MCP + commands) is partly built; the meta-builder **Teams layer** is
> deferred, so most remaining atoms are PLANNED or OPEN.
>
> **Status legend:** `NATIVE` = provided by Claude Code; `BUILT` = ships today; `PLANNED` = committed;
> `REJECTED` = deliberate no; `OOS` = out of scope; `OPEN` = no position yet.
>
> **Priority legend:** `foundational` = other atoms depend on it; `phase-0` = first working slice;
> `phase-1` = next wave; `reactive` = built when a real gap proves itself; `deferred` = explicitly not now.

## LAB-A · Orchestration primitives (native)

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| LAB-A1 | Skill routing | NATIVE | foundational | native | Same native floor as core |
| LAB-A2 | Agent dispatch | NATIVE | foundational | native | Same native floor as core |
| LAB-A3 | Deterministic multi-agent control | NATIVE | foundational | native | Same native floor as core |
| LAB-A4 | Tool-use loop | NATIVE | foundational | native | Same native floor as core |
| LAB-A5 | Context-window assembly | NATIVE | foundational | native | Same native floor as core |
| LAB-A6 | Model inference / sampling | NATIVE | foundational | native | Same native floor as core |
| LAB-A7 | Subagent context isolation | NATIVE | foundational | native | Same native floor as core |
| LAB-A8 | Permission enforcement engine | NATIVE | foundational | native | Same native floor as core |

## LAB-B · Packaging & configuration

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| LAB-B1 | Plugin manifest | BUILT | foundational | packaging | `plugins/nxtlvl-labs/.claude-plugin/plugin.json` |
| LAB-B2 | Marketplace / install mechanism | BUILT | foundational | packaging | `.claude-plugin/marketplace.json` (`nxtlvl-labs-dev`) |
| LAB-B3 | Layered settings | PLANNED | foundational | packaging | Lab-specific settings + global fallback |
| LAB-B4 | Environment variables | PLANNED | foundational | packaging | `NXTLVL_LABS_*` switches |
| LAB-B5 | Permissions (allow/deny/ask) | PLANNED | foundational | packaging | Lab permission rules |
| LAB-B6 | Permission modes | NATIVE | foundational | packaging | Platform feature |
| LAB-B7 | MCP server config | BUILT | foundational | packaging | Root `.mcp.json` registers `nxtlvl-wiki` server |
| LAB-B8 | Namespace | BUILT | foundational | packaging | Plugin name `nxtlvl-labs` → `nxtlvl-labs:` prefix |
| LAB-B9 | Versioning / promotion tag | OPEN | phase-1 | packaging | Lab promotion tag ritual |
| LAB-B10 | Dev/prod separation for labs | BUILT | foundational | packaging | Separate `nxtlvl-labs` repo = workbench |
| LAB-B11 | Output style | OPEN | phase-0 | packaging | Lab-specific output style |
| LAB-B12 | Keybindings | OOS | deferred | packaging | Native config |
| LAB-B13 | Statusline | OPEN | phase-0 | packaging | Lab statusline |

## LAB-C · Components

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| LAB-C1 | Lab command | BUILT | phase-0 | components | `/new-cell` `/eval` `/graduate` `/ledger` |
| LAB-C2 | Lab agent | PLANNED | phase-0 | components | Meta-builder agents (Teams layer, deferred) |
| LAB-C3 | Lab skill | PLANNED | phase-0 | components | Meta-builder skills (Teams layer, deferred) |
| LAB-C4 | Lab rule | PLANNED | foundational | components | Lab always-on shaping (`CLAUDE.md` is interim) |
| LAB-C5 | Lab hook | PLANNED | foundational | components | Lab lifecycle hooks |
| LAB-C6 | Lab custom tool | OPEN | reactive | components | Lab-specific tools |
| LAB-C7 | Lab MCP tool | BUILT | phase-0 | components | `nxtlvl-wiki-mcp` (4 tools over stdio) |
| LAB-C8 | Typed output contract for lab artifacts | BUILT | phase-0 | components | zod schemas + cell `manifest.yaml`/`scorecard.json` |
| LAB-C9 | Lab alias / router entry | BUILT | phase-0 | components | Slash entries = the 4 plugin commands |
| LAB-C10 | Progressive-disclosure reference | OPEN | phase-1 | components | Lab reference docs |
| LAB-C11 | Bundled script | OPEN | phase-1 | components | Lab scripts |
| LAB-C12 | Shared library | BUILT | foundational | components | `harness-lab/bin/lib`, `evals-lab/bin/lib`, MCP `src/` |
| LAB-C13 | Sub-agent of an agent | NATIVE | phase-1 | components | Mechanism native |

## LAB-D · Context assembly & injection

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| LAB-D1 | Lab global memory file | PLANNED | foundational | context | Lab global conventions |
| LAB-D2 | Lab project memory file | BUILT | foundational | context | `nxtlvl-labs/CLAUDE.md` |
| LAB-D3 | Lab SessionStart injection | PLANNED | foundational | context | Lab session briefing |
| LAB-D4 | Lab skill description surface | PLANNED | foundational | context | Lab skill routing |
| LAB-D5 | Lab context budget | PLANNED | foundational | context | Lab token policy |
| LAB-D6 | Pointers-over-content | PLANNED | foundational | context | Same policy as core |
| LAB-D7 | Lab compaction steering | OPEN | phase-0 | context | Lab precompact hook |
| LAB-D8 | Per-prompt relevance routing | PLANNED | foundational | context | Lab router |
| LAB-D9 | Imported / `@`-referenced files | NATIVE | phase-1 | context | Native CLAUDE.md feature |
| LAB-D10 | Lab context-pressure awareness | OPEN | phase-0 | context | Lab context alert |
| LAB-D11 | Lab session bookmark recall | OPEN | phase-0 | context | Lab bookmarks |
| LAB-D12 | Retriever / RAG over corpus | REJECTED | deferred | context | Same anti-goal as core |

## LAB-E · Memory & learning

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| LAB-E1 | Lab native file memory | PLANNED | foundational | memory | Native memory |
| LAB-E2 | Experiment capture | BUILT | foundational | memory | Cells: `manifest.yaml` + `run.md` + `scorecard.json` |
| LAB-E3 | Decision distillation | PLANNED | phase-0 | memory | Distill source-driven decisions |
| LAB-E4 | Decision lifecycle | PLANNED | phase-0 | memory | Pending → promote → evolve → prune |
| LAB-E5 | Experiment recall | BUILT | phase-0 | memory | `/ledger` regenerates from cell manifests |
| LAB-E6 | Experiment scoping | BUILT | foundational | memory | Cell model binds experiments to harness-lab |
| LAB-E7 | Secret scrubbing on write | PLANNED | foundational | memory | Same policy as core |
| LAB-E8 | Write discipline / honesty | PLANNED | foundational | memory | Same policy as core |
| LAB-E9 | Concurrency guard | PLANNED | foundational | memory | Same guard as core |
| LAB-E10 | Role/agent-scoped lab memory | OOS | deferred | memory | Same as core |
| LAB-E11 | Cross-session episodic lab store | REJECTED | deferred | memory | Same as core |

## LAB-F · Lifecycle hooks

| ID | Atom (event) | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| LAB-F1 | SessionStart | PLANNED | foundational | hooks | Lab session briefing |
| LAB-F2 | UserPromptSubmit | OPEN | phase-0 | hooks | Lab prompt hook |
| LAB-F3 | PreToolUse | PLANNED | foundational | hooks | Lab capture / guard |
| LAB-F4 | PostToolUse | PLANNED | foundational | hooks | Lab observe / capture |
| LAB-F5 | PreCompact | OPEN | phase-0 | hooks | Lab precompact |
| LAB-F6 | SessionEnd | OPEN | phase-0 | hooks | Lab session close |
| LAB-F7 | Stop | OPEN | reactive | hooks | Uncovered |
| LAB-F8 | SubagentStop | OPEN | reactive | hooks | Uncovered |
| LAB-F9 | Notification | OPEN | reactive | hooks | Uncovered |
| LAB-F10 | Exit-code contract | PLANNED | foundational | hooks | Same as core |
| LAB-F11 | Fail-open-on-error | PLANNED | foundational | hooks | Same as core |
| LAB-F12 | Blocking gate (whitelisted) | OPEN | phase-0 | hooks | Lab gates |
| LAB-F13 | Kill switch | PLANNED | foundational | hooks | Same as core |
| LAB-F14 | Flat registration / dispatcher | PLANNED | foundational | hooks | Same as core |
| LAB-F15 | Detached background spawn | OPEN | phase-0 | hooks | Lab observer |

## LAB-G · Composition & orchestration

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| LAB-G1 | Lab orchestrator/specialist model | PLANNED | foundational | composition | Lab orchestrator + meta-builder specialists |
| LAB-G2 | Lab delegation policy | PLANNED | phase-0 | composition | When to spawn meta-builders |
| LAB-G3 | Meta-builder chaining | PLANNED | phase-0 | composition | Chain meta-builders |
| LAB-G4 | Parallel fan-out | PLANNED | phase-0 | composition | Compare strategies in parallel |
| LAB-G5 | Lab output composition | PLANNED | phase-0 | composition | Merge lab outputs |
| LAB-G6 | Native-agent-+-injected-skill vs custom agent | PLANNED | phase-0 | composition | Same as core |
| LAB-G7 | Context preservation via delegation | PLANNED | phase-0 | composition | Same as core |
| LAB-G8 | Meta-workflow DAG authoring | PLANNED | phase-1 | composition | Source-driven dev DAG |
| LAB-G9 | Self-evolving topology | REJECTED | deferred | composition | Same as core |
| LAB-G10 | Creation output domain | PLANNED | phase-0 | composition | Skills, agents, teams, MCPs, harnesses |
| LAB-G11 | Meta-workflow domain | PLANNED | phase-0 | composition | Source-driven dev, eval, A/B |

## LAB-H · Tooling & external capability

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| LAB-H1 | Built-in tools | NATIVE | foundational | tooling | Platform |
| LAB-H2 | Per-agent tool scoping | PLANNED | phase-0 | tooling | Same as core |
| LAB-H3 | Read-only sandbox | PLANNED | phase-0 | tooling | Same as core |
| LAB-H4 | MCP server integration | BUILT | phase-0 | tooling | `nxtlvl-wiki` server wired via `.mcp.json` |
| LAB-H5 | Docs grounding (primary-source) | PLANNED | phase-0 | tooling | Context7-style testimony; same as core |
| LAB-H6 | Repo orientation (non-evidence) | BUILT | phase-0 | tooling | `nxtlvl-wiki-mcp` = leads over the corpus |
| LAB-H7 | Deferred / lazy tool loading | NATIVE | phase-1 | tooling | Platform |
| LAB-H8 | GitHub operations | PLANNED | phase-0 | tooling | Lab uses GitHub |
| LAB-H9 | Browser / computer-use tool | OOS | deferred | tooling | Same as core |
| LAB-H10 | Image/screenshot handling | OPEN | phase-0 | tooling | Same as core |

## LAB-I · Quality & promotion gate

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| LAB-I1 | Five-axis review of lab artifacts | PLANNED | phase-0 | quality | Review lab artifacts |
| LAB-I2 | Doubt-driven adversarial review of lab artifacts | PLANNED | phase-0 | quality | Adversarial review |
| LAB-I3 | Promotion gate | BUILT | foundational | quality | `graduate.ts` objective gate (exit 2 = block) |
| LAB-I4 | Versioned promotion rubric | OPEN | phase-1 | quality | Promotion criteria |
| LAB-I5 | Secrets / no-leak gate | PLANNED | foundational | quality | Same as core |
| LAB-I6 | Dangerous-command guard | PLANNED | phase-0 | quality | Same as core |
| LAB-I7 | Frontmatter / dead-ref validation | PLANNED | phase-1 | quality | Same as core |

## Coverage summary

| Family | NATIVE | BUILT | PLANNED | OPEN | REJECTED | OOS | Total |
|---|---|---|---|---|---|---|---|
| LAB-A | 8 | 0 | 0 | 0 | 0 | 0 | 8 |
| LAB-B | 1 | 5 | 3 | 3 | 0 | 1 | 13 |
| LAB-C | 1 | 5 | 4 | 3 | 0 | 0 | 13 |
| LAB-D | 1 | 1 | 6 | 3 | 1 | 0 | 12 |
| LAB-E | 0 | 3 | 6 | 0 | 1 | 1 | 11 |
| LAB-F | 0 | 0 | 7 | 8 | 0 | 0 | 15 |
| LAB-G | 0 | 0 | 10 | 0 | 1 | 0 | 11 |
| LAB-H | 2 | 2 | 4 | 1 | 0 | 1 | 10 |
| LAB-I | 0 | 1 | 5 | 1 | 0 | 0 | 7 |
| **Total** | **13** | **17** | **45** | **19** | **3** | **3** | **100** |

> **Note:** The labs plugin's **foundation layer is partly built** — the incubation Spine
> (`harness-lab`), measurement engine (`evals-lab`), `nxtlvl-wiki-mcp` server, and the four
> slash commands all exist on disk. The **Teams layer** (meta-builder domain teams: agents,
> skills, hooks, composition) is intentionally **deferred** — see the three-layer model in
> [`nxtlvl-labs/docs/intent/nxtlvl-labs-redesign.md`](../../../../nxtlvl-labs/docs/intent/nxtlvl-labs-redesign.md).
> Remaining PLANNED/OPEN atoms concentrate there.
