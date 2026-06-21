> **hive — harness analysis.** Aden/YC's zero-setup, model-agnostic multi-agent runtime: a goal
> compiles into a typed DAG of LLM agents executed by an actor-model engine with an internal
> judge/escalation loop. Analyzed 2026-06-21 · 22M · source: https://github.com/aden-hive/hive.
> Scope: whole harness. Method: vendor → DeepWiki orientation (leads only, not evidence — ADR-029) →
> parallel read-only fan-out (5 domains) → synthesis. Every claim below is cited to the vendored
> clone; no claim is sourced to DeepWiki.

## 1. Overview & thesis

hive turns a natural-language **objective** into a **typed DAG of specialized LLM agents** and runs it
to completion on one user's machine. Its central design strategy is a **two-tier execution model**:

1. **Outer tier — a DAG worker engine.** An agent on disk is a directory of JSON worker configs that
   `AgentLoader` deserializes into pydantic `NodeSpec`/`EdgeSpec`/`GraphSpec` models
   (`core/framework/loader/agent_loader.py:1356-1382`; `core/framework/orchestrator/edge.py:305`). The
   graph executes as an **actor model** — one `NodeWorker` per node that self-activates on `Activation`
   messages, checks fan-in readiness, runs, then evaluates outgoing edges to emit downstream
   activations (`core/framework/orchestrator/node_worker.py:112,240,439`). There is no central
   scheduler loop; completion is detected by quiescence against terminal nodes
   (`core/framework/orchestrator/orchestrator.py:1380`).
2. **Inner tier — a per-node agent loop with a judge.** Each node is a multi-turn LLM conversation
   (`core/framework/agent_loop/agent_loop.py`) whose every turn is evaluated by a judge returning a
   `JudgeVerdict{action: "ACCEPT"|"RETRY"|"ESCALATE"}` (`core/framework/agent_loop/internals/types.py:31-34`,
   consumed at `agent_loop.py:2031`). ACCEPT writes outputs and returns; RETRY continues with feedback;
   ESCALATE exits to a **"queen"** — hive's term for the supervisory overseer agent that coordinates a
   "colony" of worker nodes and handles escalations they can't resolve.

Everything else serves those two tiers: a **curated-`.md` memory** subsystem with LLM-driven recall and
reflection (not a vector DB), a **model-agnostic LLM seam** over litellm, a **reference-grade tool +
skills capability surface**, and an **aiohttp API + React dashboard** that runs as a subprocess of an
Electron desktop app with the **Aden platform brokering secrets**.

**The thesis — and the tension that caps it:** hive's execution engine and capability surface are
*genuinely reference-grade* — robustness is engineered, not asserted. But its security/deployment
substrate is **single-tenant-trusted by default** (no auth, no agent isolation, encryption key
co-located with ciphertext). hive is built to a precise threat model — *a trusted local desktop where
Aden holds the crown-jewel secrets* — and several of its security properties are sound only inside that
envelope. It is a high-quality engine wrapped in a deployment story you must not exceed.

## 2. Architecture map

| Domain (analysis partition) | Where | Role | Scale |
|---|---|---|---|
| **Execution spine** | `core/framework/{orchestrator,agent_loop,pipeline,runtime,loader,tasks,tracker}` | Compile objective→DAG; actor-model schedule; per-node judge loop | ~36K LOC |
| **Agent model, LLM & memory** | `core/framework/{agents,llm,schemas,storage,observability}` (+ memory mechanics in `orchestrator/`) | Agent declarations; model-agnostic LLM; curated-`.md` memory | ~18K LOC |
| **Tools, MCP & skills** | `core/framework/{tools,skills}` + `tools/src/{aden_tools,gcu,terminal_tools,chart_tools}` | ~150 capability tools over FastMCP + in-process control tools + Agent-Skills runtime | ~15K LOC + tool pkgs |
| **Host, server & credentials** | `core/framework/{server,host,credentials,debugger}` | aiohttp control plane (Electron subprocess), in-process colony runtime, key vault | ~34K LOC |
| **CC surface, frontend & periphery** | `.claude/`, `core/frontend/`, `examples/templates/`, `docs/` | Maintainer dev-skills; React operator UI; demo agents; docs | 89 ts/tsx + 11 demo agents |

**Control flow of one run:** goal → `AgentLoader.load()` deserializes the DAG + runs an admission
`PipelineRunner` of ordered stages (`input_validation, credential_resolver, mcp_registry,
skill_registry, rate_limit, cost_guard, llm_provider` — `core/framework/pipeline/runner.py:52`,
`agent_loader.py:1493`) → `Orchestrator.execute()` dispatches `_execute_with_workers()`
(`orchestrator/orchestrator.py:486,1255`) → each `NodeWorker` runs its `AgentLoop`, whose judge drives
ACCEPT/RETRY/ESCALATE → ESCALATE routes to the queen → quiescence ends the run; a tracker logs a
3-level `ToolCallLog → NodeStepLog → RunSummaryLog` hierarchy throughout.

**Two-level retry, deliberately separated:** the worker does exponential-backoff retry for deterministic
custom nodes but **sets `max_retries=0` for AgentLoop nodes** — "retry is handled internally by the
judge" (`orchestrator/node_worker.py:358-361`). Clean division of a notoriously muddy concern.

## 3. Component deep-dives

### 3.1 Execution spine — *reference-quality routing/retry, buried under a god-file*
- **Typed DAG with 5 edge conditions:** `ALWAYS / ON_SUCCESS / ON_FAILURE / CONDITIONAL / LLM_DECIDE`
  (`orchestrator/edge.py:39-47`). `CONDITIONAL` expressions run through a real AST-walking **sandboxed
  evaluator** with guards against exponentiation-blowup (e.g. `2**2**...`) and SIGALRM wall-clock
  timeouts (`orchestrator/safe_eval.py:9-16`), and edge
  evaluation **fails closed** (returns `False` on error — `edge.py:200`). `ON_FAILURE` edges fire even
  on node failure (`node_worker.py:337`) — failure is a first-class routing signal.
- **Engineered failure paths:** judge-outage → fall back to ACCEPT with a logged reason to keep moving
  (`agent_loop.py:3722`); n-gram **stall detection**, tool **doom-loop** fingerprinting, and a
  text-only **grace-then-auto-escalate** net (`agent_loop.py:1374,1443,1547`); `max_node_visits` cap
  with synthetic-success propagation (`node_worker.py:256-278`); worker crash caught and published as a
  failure event (`node_worker.py:344`). **Resumability** via checkpoint store + session-state restore
  (`orchestrator.py:556-617`).
- **Weaknesses:** `agent_loop.py` is a **~5,700-line / 210KB single file** with a ~1,500-line method —
  the most safety-critical loop in the system is also its least maintainable unit. A **second, legacy
  execution engine** (`_execute_parallel_branches`, `orchestrator.py:936`) still ships beside the live
  one. Documented load paths are **stale/dead**: `load_agent_export()` and `_import_agent_module()`
  have zero callers (`agent_loader.py:1031,1259`) and the docs name a nonexistent `AgentRunner`.
  Logging fail-posture is **inconsistent** — `end_run` is fail-open but hot-path `log_step` has no
  try/except, so a disk error mid-run can kill a successful run, contradicting the module's own claim
  (`tracker/runtime_logger.py:17-18`); L2/L3 appends are non-atomic.

### 3.2 Agent model, LLM & memory — *sound curated-file memory; one real defect*
- **Memory is curated `.md` files, not vectors.** Durable memory is a `.md`-file-per-memory hierarchy
  under `~/.hive/memories/{global,colonies,agents}` with a 4KB/file and 200-file cap and
  never-raises frontmatter parsing (`agents/queen/queen_memory_v2.py:1-13,32-33,66`). Evolution is a
  **read path** — an LLM recall-selector picks ≤5 relevant files per turn and injects them, fail-open
  to `[]` so memory never blocks the conversation (`recall_selector.py:58,112,134`) — and a **write
  path**: a fire-and-forget background **reflection agent** distills learnings and dedups
  (`reflection_agent.py:7-13,17`), guarded by `.md`-extension/type-whitelist/size-cap/path-traversal
  checks (`reflection_agent.py:189,242,279`).
- **Three storage layers, two crash-safe:** per-node conversation (`storage/conversation_store.py:57`,
  `atomic_write`) and session state (`storage/session_store.py:69`, atomic + traversal guard) are
  atomic; **the durable memory write is NOT** — `reflection_agent.py:270` uses plain `write_text`,
  so a crash mid-write corrupts a memory file. The one concrete defect in an otherwise crash-safe story.
- **Model-agnostic by delegation.** `LLMProvider` ABC (`llm/provider.py:73`) with a `LiteLLMProvider`
  workhorse (`llm/litellm.py:939`) and a thin `AnthropicProvider` shim that just delegates
  (`llm/anthropic.py:57`). Agnosticism is litellm's, not in-house — and the bulk of `litellm.py`
  (123KB) is **version-fragile monkey-patches** of litellm internals (`litellm.py:71,137,999-1045`).
- **The "suspicious-content" write guard is shallower than its name.** Real, at `orchestrator/node.py:291`,
  but it is a crude substring scan for ~22 tokens (`"def "`, `"class "`, `"SELECT "`… `node.py:380-404`),
  **opt-out** (`validate=False`), and guards only the in-process `DataBuffer` — not durable memory. High
  false-positive (rejects prose containing `class ` >5KB), high false-negative (misses code lacking
  those tokens). A heuristic tripwire, not an integrity guard.
- Strong **least-privilege schema:** `ToolAccessConfig` rejects `policy="all"` — agents must enumerate
  every tool (`schemas/agent_config.py:46`).

### 3.3 Tools, MCP & skills — *the strongest domain; reference-grade*
- **Two non-overlapping tool mechanisms:** external capability tools are **FastMCP servers** run over
  stdio/HTTP (`tools/src/{gcu,terminal_tools,chart_tools}/server.py`, with lifespan + `atexit` +
  parent-PID watchdog to avoid orphaned Chrome/PTY procs — `terminal_tools/server.py:51-72`); the
  queen's **control verbs** are in-process registry tools closing over a live session
  (`core/framework/tools/queen_lifecycle_tools.py:1050`). `aden_tools` composes **~104 integration
  tools** onto one server with a **verified/unverified gate** off by default and a manifest sentinel
  (`tools/src/aden_tools/tools/__init__.py`); with the FS/MCP toolkit and the `gcu`
  (browser/computer-use), `terminal_tools`, and `chart_tools` servers below, the working surface is
  **~150 tools** total.
- **Production-grade FS tooling:** `file_ops.py` (~1,900 LOC) unifies read/write/edit/search with a
  per-call deny-list `_FilePolicy` (read-permissive, write-restrictive, optional write-ceiling —
  `file_ops.py:415-478`), a **stale-read cache** and **hash-anchored edits** (`file_state_cache.py`,
  `hashline.py`) — the same read-before-edit discipline as Claude Code itself. Ported and *credited*
  Claude Code safety catalogs (`destructive_warning.py`, `semantic_exit.py`), kept **informational, not
  blocking** (`destructive_warning.py:3-6`) — an "inform, don't force" posture.
- **A full Agent-Skills standard implementation** (`core/framework/skills/manager.py:77`):
  6-level scope precedence with last-wins (`discovery.py`), progressive-disclosure XML catalog with a
  compact fallback (`catalog.py:29-52`), a deliberate **tool-gated pre-activation** bypass for
  foundation skills (`tool_gating.py`), a real **trust/consent gate** for untrusted-remote project
  skills (`trust.py`, persisted to `~/.hive/trusted_repos.json`), and dual lenient-runtime/strict-author
  validation (`parser.py`, `validator.py`).
- **Weaknesses:** `queen_lifecycle_tools.py` is a **4,192-line god-module**; `register_all_tools`
  double-registers credentialed tools (idempotent but dead/confusing); `tools/src/pyproject.toml`
  declares `dependencies = []` while hard-importing fastmcp/httpx/pydantic — not installable as
  declared.

### 3.4 Host, server & credentials — *fit for a local desktop; unsafe outside it*
- **aiohttp control plane** (`server/app.py:8` — not FastAPI), spawned as an **Electron subprocess**
  (`app.py:319-322`), serving the built SPA from `frontend/dist` plus ~80 `/api/*` routes; session-centric
  (`session_manager.py:51,125`) with SSE live updates and replay-on-connect (`routes_events.py:142,204`).
- **`host/` is an in-process asyncio orchestrator, not a sandbox.** `IsolationLevel` is a 3-value enum
  with **zero enforcement** (`host/isolation.py:6-9`), defaulting to `"shared"` (`colony_runtime.py:120`).
  Workers are `asyncio.create_task` coroutines in the **same process** as the host and every sibling
  (`worker.py:402`). The dir is mid-refactor — `AgentHost` + `ExecutionManager` are declared replaced by
  `ColonyRuntime` yet all three still ship (`colony_runtime.py:6-10`).
- **Credentials — good architecture, flawed local hardening.** The production path is sound: **Aden holds
  refresh-tokens/client-secrets server-side; agents get only short-lived access tokens over HTTPS**
  (`credentials/store.py:714,773-807`); `SecretStr` is used consistently; the template resolver is
  injection-safe (alphanumeric-constrained, single-pass — `credentials/template.py:46`).
- **Security smells (the cap on the whole harness):**
  - **No authentication by default** — `desktop_auth_middleware` is a pass-through no-op when
    `HIVE_DESKTOP_TOKEN` is unset; "OSS behaviour is preserved" (`server/app.py:174-184`). Every mutating
    endpoint (save credentials, hot-swap LLM keys, spawn agents) is reachable with zero credentials in any
    non-Electron deployment. The skill-author identity is a client-trusted `X-User` header
    (`routes_skills.py:771-774`).
  - **No agent isolation** — tool code runs with full host-process privilege; safe only for trusted
    single-tenant use.
  - **Encryption key co-located with ciphertext in plaintext** — Fernet key at
    `~/.hive/secrets/credential_key` decrypts sibling `~/.hive/credentials/*.enc` (`credentials/key_storage.py:4,77`).
    At-rest encryption that doesn't survive a local read. Worse, **the full key is logged** when
    auto-generated (`credentials/storage.py:163-168`), and `.enc` files get **no chmod** unlike the key
    file (`storage.py:180-207` vs `key_storage.py:75-78`).
  - Per-handler `str(exc)` leaks bypass the no-leak error middleware in ~10 handlers
    (`routes_sessions.py:167,328`); broad default OAuth scopes (HubSpot 6 scopes, Zoho `.ALL`).

### 3.5 CC surface, frontend & periphery — *real UI + dogfooded dev-skills; a leaky settings file*
- **Two distinct "skills" worlds.** `.claude/skills/` (3) are **maintainer dev-workflow** skills, not
  agent-builders; only `browser-edge-cases` has proper frontmatter + 10 executable test scripts + a
  verified 17-entry registry (`.claude/skills/browser-edge-cases/{SKILL.md:1-5,registry.md:9-19}`) — genuinely
  excellent dogfooded knowledge capture. `triage-issue` and `test-reporting` are **frontmatter-less**
  runbooks that can't auto-discover (`.claude/skills/triage-issue/SKILL.md`), violating hive's own
  documented skill standard (`docs/skills-user-guide.md:108-117`). hive's *agent-facing* skill runtime is
  the separate, in-framework implementation in §3.3.
- **The frontend is load-bearing**, not a toy — a Vite 6 + React 18 + Tailwind 4 SPA with a typed API
  client, 7 contexts, mermaid/echarts rendering, and 9 routes (`core/frontend/src/App.tsx:16-29`,
  `ColonyContext.tsx:11-15`); it's the operator console the quickstart builds and opens.
- **Signal vs demo:** the **11 `examples/templates/` agents** are DEMO scaffolds (`templates/README.md:3`)
  — instructive (a `Goal` + weighted `SuccessCriterion` + node DAG, e.g. `job_hunter/agent.py:22-60`) but
  **excluded from scoring as craft**.
- **Risk:** `.claude/settings.json` leaks a maintainer's machine state — hardcoded
  `/home/timothy/aden/hive/...` paths and stale `kill 746636`/`pkill` allowlist entries
  (`.claude/settings.json:10,16-22,27,36-37`); `settings.local.json.example` is the right pattern this
  file abandons. README's "Zero Setup" is a marketing gloss over a 91KB interactive wizard + uv workspace
  + Node frontend build (`README.md:50` vs `quickstart.sh`).

## 4. Strategy & workflow

hive optimizes for **getting a non-trivial multi-agent workflow to run robustly to completion on one
user's machine, with minimal user configuration and no self-hosted secret management.** The tradeoffs
that buys are visible throughout:

- **Actor-model DAG over a central scheduler** → genuinely event-driven and resumable, at the cost of
  "which engine runs?" friction (two engines, two MCP-registry modules) and harder traceability.
- **Internal judge loop + queen escalation** → each node self-corrects (RETRY) or punts upward
  (ESCALATE) instead of failing the run; the price is a 5,700-line loop file concentrating the
  complexity.
- **Curated-`.md` memory + LLM recall/reflection** → human-legible, recall-capable, fail-open memory
  with no vector-DB dependency; the price is LLM calls on the memory path and one non-atomic write.
- **Aden brokers secrets + Electron-subprocess deployment** → the user never manages OAuth secrets and
  the local app needs no auth; the price is that the OSS runtime is **unsafe to expose on a network** —
  a tradeoff the code's own comments concede.

The recurring craft signature is **real failure-mode engineering** (sandboxed eval, fail-closed edges,
stall/doom-loop nets, atomic conversation/session stores, trust-gating, token scoping, process
watchdogs) sitting beside **a few god-files and documentation drift** — the work of a fast-moving team
that has learned its failure modes the hard way but hasn't paid down structural debt.

## 5. Quality assessment

| # | Dimension | Overall | Justification |
|---|-----------|:------:|---------------|
| 1 | Cohesion & purpose | **4** | Strong central two-tier concept and clean compile/admit/schedule/loop split (`node_worker.py:358`); docked for god-files, a surviving legacy engine, and a mid-refactor `host/`. |
| 2 | Composition & reuse | **4** | Compose-don't-fork is real: framework consumes `tools/src/`, one credential adapter, one `_FilePolicy`, one actor model for all topologies (`store_adapter.py:639`). |
| 3 | Robustness & safety | **3** | *Split, and capped deliberately.* Execution + tools are reference-grade (4–5); but the credential/auth/isolation substrate (no-auth default, no isolation, key-beside-ciphertext — `app.py:174`, `key_storage.py:4`) caps the harness-wide score at 3 rather than averaging up. |
| 4 | Discoverability & triggering | **3** | Sound routing + a thoughtful skills catalog, dragged by active documentation drift (docs name nonexistent `AgentRunner`/`GraphExecutor`) and 2 frontmatter-less `.claude` skills. |
| 5 | Clarity & maintainability | **3** | Good docstrings and typed specs, but repeated violations of the repo's *own* "keep files small" rule — `agent_loop.py` (210KB), `queen_lifecycle_tools.py` (4,192L), `litellm.py` (123KB), several 1,500–2,000L route/host files. |
| 6 | Effectiveness / fitness | **4** | Demonstrably works and is dogfooded: ~150 tools, a real operator UI, production-grade execution behavior under failure; fitness is high *within its intended single-tenant envelope*. |

**Strengths (evidenced):**
- A robust, event-driven DAG engine with sandboxed conditional routing, layered retry, and a multi-net
  escalation system (`safe_eval.py:9-16`, `node_worker.py:358-361`, `agent_loop.py:1374-1547`).
- A reference-grade capability surface: ~150 FastMCP tools, production FS tooling with stale-read +
  hash-anchored edits, and a complete Agent-Skills runtime with a real trust model (`file_ops.py:415-478`,
  `skills/trust.py`, `catalog.py:29-52`).
- A sound, human-legible curated-`.md` memory model with fail-open recall (`recall_selector.py:112`).
- A genuinely good secret-brokering architecture (Aden holds refresh tokens; agents get short-lived
  access tokens — `credentials/store.py:773-807`).
- Honest engineering culture: ported safety catalogs are *credited*; multi-agent-safety rules in
  `AGENTS.md`; the code comments concede their own limits.

**Weaknesses & risks:**
- **Security substrate is single-tenant-trusted by default** — no auth, no agent isolation, encryption
  key co-located with (and logged beside) ciphertext. Safe in the Electron-desktop envelope; dangerous
  outside it (§3.4).
- **God-files** concentrate the most critical logic and violate the repo's own conventions (§3.1, §3.3).
- **Documentation drift** — stale internal docs and dead load paths name classes/dirs that don't exist
  (`agent_loader.py:1031`); a maintainer's machine state is committed in `.claude/settings.json`.
- **One concrete data-integrity defect:** non-atomic durable-memory write (`reflection_agent.py:270`).
- The "suspicious-content" guard and "zero-setup" claim both **oversell** what the wiring delivers
  (`node.py:380`, `README.md:50`).

**Headline verdict.** hive is a sophisticated, genuinely dogfooded multi-agent runtime whose execution
engine and capability surface are **reference-grade** — the kind of failure-mode engineering most
harnesses only claim. Its curated-file memory and model-agnostic LLM seam are sound, pragmatic choices.
What caps it at **~3.5–3.8/5** is not its engine but its envelope: a security/deployment substrate that
is **trusted-localhost-by-default** and collapses outside the Electron-desktop, Aden-brokers-secrets
model it is actually built for, plus structural debt (god-files, doc drift) that its own conventions
forbid. **Who it's for:** a single user running an agent workflow locally through the desktop app — for
that audience it is excellent. **What you must not do:** expose the OSS runtime on a network or treat its
at-rest credential encryption as a defense against a local attacker. Mine it for the execution engine,
the tool/skills surface, and the curated-memory model; do **not** mine its default security posture.

---

*Method note: this review opened with a DeepWiki orientation pass (ADR-029, leads-not-evidence). Its
leads named the right concepts (typed DAG, ACCEPT/RETRY/ESCALATE judge, three-layer memory) but its
path-level claims were substantially stale against this clone — a nonexistent `core/framework/graph/`
dir, `GraphExecutor`, `event_loop_node.py`, and an `adapt.md`/`save_data`/`edit_data` memory mechanism
that three independent fan-out agents refuted at source. Per the orientation-not-evidence rule those
leads shaped where to look but contributed zero citations here; every claim above is grounded in the
vendored clone.*
