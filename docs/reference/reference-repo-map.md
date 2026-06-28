# nxtlvl `reference/` harness map — high-level

*Mapped 2026-06-20.* A one-screen orientation over **every vendored harness in
[`reference/`](../../reference/)** (13 repos): what each one *is*, how it's shaped, whether it's
Claude-Code-native, and whether we've already distilled it. This is the **breadth pass** — the cheap
high-level read that tells you which repos deserve a deep [`harness-review`](../../plugins/nxtlvl/skills/harness-review/SKILL.md),
not the deep read itself. Per-repo deep dives live in the linked `*-distillation.md` / `*-review.md`.

> **Read the component counts as raw surface area, not unique inventory.** They are file counts and
> include vendored duplication and catalog mirroring. Rows flagged ⚠ are known-inflated (ruflo's
> byte-triplication, ECC's `ecc2/` second tree, the catalogs that mirror every template). Trust the
> *shape*, not the magnitude.

---

## At a glance

| Repo | What it is (one phrase) | Primary lang | CC-native | Size | Reviewed? |
|---|---|---|---|---|---|
| **ECC** | CC mega-harness — the vendored reference backstop (ADR-002) | md/JS | ✅ `.claude` + `.claude-plugin` + `.mcp.json` | 72M | ✅ [map](ecc-main-map.md) · [scoping](ecc-agent-vs-skill-scoping.md) · [lifecycle](ecc-agent-lifecycle.md) |
| **ruflo** (claude-flow) | Functional maximalist — 34 plugins, MCP, Rust AgentDB engine | TS/md | ✅ `.claude` + `.claude-plugin` | 80M | ✅ [distill](ruflo-distillation.md) · [discovery](ruflo-discovery-review.md) · [adr](ruflo-adr-distillation.md) · [hooks](ruflo-hooks-review.md) |
| **superclaude** | CC plugin + pip framework — behavioral "modes" over a command set | md/Python | ✅ `.claude` | 3.6M | ✅ [planning](superclaude-planning-review.md) · [discovery](superclaude-discovery-review.md) |
| **claude-code-templates** (aitmpl) | Distribution catalog product — installer + dashboard over a huge template set | md/JSON/Python | ✅ `.claude` + `.mcp.json` | 116M | ✅ [distill](claude-code-templates-distillation.md) |
| **awesome-claude-code-toolkit** | Breadth catalog — rules/+contexts/ lens, hand-copied | md/JSON | ✅ `.claude-plugin` | 3.3M | ✅ [distill](awesome-claude-code-toolkit-distillation.md) |
| **claude-code-hooks-mastery** | Hooks teaching/demo repo (disler) | md/Python | ✅ `.claude` | 5.2M | ✅ [distill](hooks-mastery-distillation.md) |
| **Trellis** | Spec/task/memory framework persisted into the repo, multi-platform | md/TS/Python | ✅ `.claude` | 130M | ⬜ un-reviewed |
| **agents-main** (wshobson) | Multi-harness plugin marketplace — 84 plugins, one md source → 5 harnesses | md/JSON | ✅ `.claude-plugin` | 9.4M | ⬜ un-reviewed |
| **claude-code-sub-agents** | Agent collection — 33 SDLC subagents, plain `agents/` tree | md only | ➖ no markers (bare `agents/`) | 8.0M | ⬜ un-reviewed |
| **deepagents** | LangChain "batteries-included" Python agent harness | Python | ➖ `.mcp.json` only (code framework) | 45M | ⬜ un-reviewed |
| **hive** (OpenHive/Aden) | Zero-setup multi-agent DAG runtime, role-based memory | Python/TSX | ➖ `.claude` present, but a Python runtime | 22M | ✅ reviewed (Mode A → `hive-analysis.md`) |
| **CowAgent** | Python multi-channel "super assistant" — plans, self-evolves, runs Skills | Python | ➖ none (own skill system) | 7.4M | ⬜ un-reviewed |
| **CodeWhale** | Rust terminal coding agent (TUI/CLI), 25 providers | Rust | ➖ none | 18M | ⬜ un-reviewed |

## Raw component surface (file counts — ⚠ = known-inflated)

| Repo | agents | skills | commands | hooks | plugins | note |
|---|---:|---:|---:|---:|---:|---|
| ECC | 306 | 881 | 422 | 138 | 5 | ⚠ includes `ecc2/` second-gen tree |
| ruflo | 369 | 336 | 472 | 97 | 4 | ⚠ byte-triplicated across `v3/`, `plugins/`, `.agents` |
| claude-code-templates | 449 | 870 | 388 | 37 | 0 | ⚠ catalog mirrors every template |
| agents-main | 192 | 156 | 102 | 5 | 3 | counts match README claims (marketplace aggregate) |
| awesome-claude-code-toolkit | 138 | 40 | 262 | 2 | 1 | ⚠ breadth catalog |
| Trellis | 44 | 82 | 14 | 59 | 1 | hooks-heavy; TS/py packages under `packages/` |
| superclaude | 42 | 9 | 61 | 4 | 1 | `src/` (pip) ↔ `plugins/` ship divergent copies |
| claude-code-sub-agents | 37 | 0 | 0 | 0 | 0 | pure agent collection |
| CodeWhale | 0 | 21 | 0 | 5 | 0 | "skills" are Rust-side, not CC SKILL.md harness |
| claude-code-hooks-mastery | 19 | 0 | 21 | 9 | 0 | teaching repo; hooks are the point |
| deepagents | 0 | 29 | 0 | 2 | 0 | agents are Python classes, not `agents/*.md` |
| hive | 5 | 18 | 0 | 3 | 0 | orchestration lives in Python, not md |
| CowAgent | 0 | 3 | 0 | 0 | 1 | skills are its own runtime format |

---

## Per-repo capsules

Grouped by *kind*, because kind predicts review value: curated CC harnesses are peers to mine;
catalogs are breadth-as-product (expect thin ledgers, mostly reject); non-CC runtimes are
contrast-by-architecture (the harness lives in code, not markdown).

### A. Curated CC-native harnesses (peers — richest mining)

- **ECC** — ingested reference-corpus material only, surfaced via nxtlvl-wiki (the sole reference corpus, [ADR-002](../decisions/ADR-002-reference-corpus-nxtlvl-wiki.md)); it is **not** an installed/dormant backstop — the runtime backstop is native Claude Code.
  CC-native triple marker (`.claude` + `.claude-plugin` + `.mcp.json`). Everything: `agents/`,
  `commands/`, `hooks/`, `skills` across `plugins/`, plus a second-gen `ecc2/` tree (the source of
  count inflation). The most-mined repo here; start from [ecc-main-map.md](ecc-main-map.md), don't re-scan.

- **ruflo** (claude-flow) — the functional maximalist: 34 plugins, an MCP layer, a Rust `agentdb.rvf`
  engine, and `v3/` + `plugins/` + `.agents` copies of the same agents (the triplication). Already
  reviewed four ways; the recurring finding is *rhetoric–wiring gap* — shipped code collapses onto
  nxtlvl's locked positions. See [ruflo-distillation.md](ruflo-distillation.md).

- **superclaude** — a CC plugin *and* a pip package (`src/`), the two shipping divergent copies. Its
  pitch is behavioral "modes" layered over a command set, but `plugin.json` omits the modes/core keys
  so much of it is dead text. Reviewed for [planning](superclaude-planning-review.md) and
  [discovery](superclaude-discovery-review.md).

- **Trellis** — *un-reviewed, strong candidate.* An engineering framework that persists **specs,
  tasks, and memory** into your repo so any agent works to your standards. `.claude` + multi-platform
  `marketplace/` + TS/Python `packages/`. Hooks-heavy (59). Directly adjacent to nxtlvl's
  spec→plan→memory spine — the most architecturally-relevant un-reviewed repo.

- **claude-code-hooks-mastery** (disler) — a teaching repo whose *point* is the hook lifecycle (9 hook
  files, Python). Reviewed: its "hooks force" rhetoric vs its one-gate/fail-open shipped config is the
  evidence for nxtlvl's "inform, don't force." See [hooks-mastery-distillation.md](hooks-mastery-distillation.md).

- **claude-code-sub-agents** — *un-reviewed, easy target.* The simplest repo here: a bare `agents/`
  tree of 33 SDLC subagents (frontend/ui/ux/react/...), no `.claude` markers, no skills/commands/hooks.
  A pure agent-collection — fast to map, useful as a "what does a flat subagent library look like" contrast.

### B. Distribution catalogs / marketplaces (breadth-as-product — expect mostly reject)

- **claude-code-templates** (aitmpl) — a *product*, not a peer harness: an installer + dashboard + API
  over a massive mirrored template set (the 449/870/388 counts are catalog mirroring). Reviewed; weight
  the contrasts over the content. See [claude-code-templates-distillation.md](claude-code-templates-distillation.md).

- **agents-main** (wshobson) — *un-reviewed.* A genuine multi-harness marketplace: one Markdown
  source-of-truth (`plugins/`) compiled into idiomatic artifacts for 5 harnesses (CC, Codex, Cursor,
  OpenCode, Gemini, Copilot). 84 plugins / 192 agents / 156 skills / 102 commands — counts match its
  README. The "single source → many harnesses" build is the interesting bit; otherwise breadth-as-product.

- **awesome-claude-code-toolkit** — *reviewed.* A focused `rules/` + `contexts/` lens, hand-copied
  (activation is manual `cp`, `/context load` is vaporware). Mostly reject; confirms nxtlvl's
  router-auto-discovery by contrast. See [awesome-claude-code-toolkit-distillation.md](awesome-claude-code-toolkit-distillation.md).

### C. Non-CC agent runtimes (contrast-by-architecture — the harness lives in code)

- **deepagents** (LangChain) — *un-reviewed.* "Batteries-included" Python harness (666 `.py`), agents
  are Python classes not `agents/*.md`, only `.mcp.json` as a CC marker. Long-horizon/multi-step
  defaults. Weak ideation surface; valuable as a *non-markdown* harness contrast (planning/todo tooling
  in code).

- **hive** (OpenHive / Aden, YC) — *reviewed (Mode A → [`hive-analysis.md`](hive-analysis.md)).*
  Zero-setup, model-agnostic runtime that compiles an objective into a **two-tier graph-of-agents**:
  a typed-DAG actor-model worker engine whose nodes are multi-turn LLM loops governed by an internal
  ACCEPT/RETRY/ESCALATE judge escalating to a "queen" overseer; curated-`.md` memory with LLM
  recall/reflection (not vectors); model-agnostic via litellm. Python + a real React frontend;
  `.claude` present but the orchestration is the Python runtime. **Verdict ~3.5–3.8/5:** reference-grade
  execution engine + tool/skills surface, *capped* by a single-tenant-trusted-by-default security
  substrate (no auth, no agent isolation, key co-located with ciphertext) + god-files + doc drift.
  Contrast for "DAG-compiled topology" vs nxtlvl's skill-composed flow.

- **CowAgent** — *un-reviewed.* A Python multi-channel ("super assistant") harness: proactively plans
  tasks, controls the computer + external services, runs its own Skills, builds long-term memory, and
  "self-evolves." Channel adapters for IM platforms (`channel/`, `bridge/`). Own skill format (3
  SKILL.md), not CC-native. Self-evolution + memory are the notable surfaces.

- **CodeWhale** — *un-reviewed, likely a poor target.* A Rust **terminal coding agent** (TUI + CLI, 391
  `.rs`), 25 providers, approval-gated tools, OS sandbox, full-turn `/restore`. Not an agent *harness*
  in the skills/agents/commands sense — it's a coding tool. Map it for completeness; expect a short note,
  not a distillation.

---

## What this map is for

- **Pick deep-review targets by kind, not by curiosity.** Bucket A repos (esp. **Trellis**) are peers
  worth a full `harness-review`; bucket C repos are short architectural-contrast notes; **CodeWhale** is
  a skip-or-skim.
- **Un-reviewed set (5):** Trellis, agents-main, claude-code-sub-agents, CowAgent,
  CodeWhale — in rough descending order of mining value for a markdown-harness like nxtlvl.
  (deepagents and hive are now reviewed — Mode A each.)
- Deep findings land in `docs/reference/*-distillation.md` (Mode B) / `*-review.md` (Mode C); adopt/adapt
  items graduate to [`docs/plan/nxtlvl-harness-adopt-backlog.md`](../plan/nxtlvl-harness-adopt-backlog.md).
