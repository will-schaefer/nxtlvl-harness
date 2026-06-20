> **SuperClaude Framework — planning-domain review.** A deep specialist audit of the *planning*
> capability (design · estimate · task · workflow · spawn · brainstorm) across the commands, agents,
> and modes/rules that encode it. Analyzed 2026-06-20 · 3.6M · v4.3.0 ·
> source: https://github.com/SuperClaude-Org/SuperClaude_Framework.
> Scope: **DOMAIN=commands (spine) · FOCUS=planning** (feature-spanning: supporting slices = planning
> agents via `agents.md`, planning modes/core-rules via `rules.md`). Method: vendor → parallel
> read-only fan-out (3 specialist agents) → commands-spine synthesis.

---

## 1. Spine — the headline judgment

**SuperClaude's planning domain is well-written prose scaffolding that does not function as a wired
system. It is *strong in parts, broken as a whole* (≈ 2/5).** Every individual planning file reads
competently — the command bodies are consistently structured, `requirements-analyst` and
`system-architect` are textbook-clean personas, and `core/RULES.md` has a genuine priority/conflict
hierarchy rare in the genre. But the connective tissue that would make them a *planning system* is
absent at every seam:

1. **The commands don't delegate** — they re-inline procedures that sibling agents, modes, and skills
   were purpose-built to own. A grep for `system-architect|requirements-analyst|pm-agent|MODE_` across
   all six planning commands returns **zero hits**. The `personas:` and `mcp-servers:` frontmatter
   arrays are decorative; nothing dereferences them.
2. **The modes & core rules are dead text** — the plugin manifest
   (`plugins/superclaude/.claude-plugin/plugin.json`) declares `commands/agents/skills/hooks/mcpServers`
   and **omits `modes/` and `core/` entirely**. No `@import` in `CLAUDE.md`, no injection by the
   SessionStart hook, no flag parser. The advertised "7 modes / RULES / PRINCIPLES" feature loads
   nothing as shipped.
3. **The capability is encoded 3–5× with no source of truth and no router** — *brainstorm* exists as a
   command **and** a skill **and** a mode **and** the `requirements-analyst` agent; *pm* exists as a
   692-line agent **and** a skill **and** a test-only Python package; *design* is duplicated across a
   command and an agent. Nothing decides which copy fires, and the copies have drifted.

The cross-wiring absence **is** the central finding — exactly the failure feature-spanning Mode C is
built to surface, and the same structural verdict the [ruflo discovery review](ruflo-discovery-review.md)
reached: a capability is only as good as the routing between its copies, and here there is none.

A compounding **release-pipeline failure** sits underneath: the framework keeps two trees,
`src/superclaude/` (the edit surface) and `plugins/superclaude/` (what ships). Agents and modes are
byte-identical across them, but **all six planning commands have diverged** — and in every case
`plugins/` ships the **stale truncation** of `src/`, missing precisely the safety scaffolding
(`## CRITICAL BOUNDARIES` / "STOP AFTER…" / Output / Next-Step blocks) the newer `src/` copy added.
The better-engineered version of each planning command exists but is not the one users run.

---

## 2. What's there & how it works

**The planning surface (the spine — `plugins/superclaude/commands/`):**

| Command | Job (`description`) | How it actually works |
|---------|---------------------|-----------------------|
| `brainstorm.md` | Interactive requirements discovery | Inlines a Socratic dialogue; `brainstorm.md:12` self-declares *"NOT an executable command — a context trigger that activates the behavioral patterns defined below."* |
| `design.md` | System/component architecture | Inlines the architecture procedure that `system-architect.md` is built to own. |
| `estimate.md` | Development estimation | Inlined estimation prose; `src/` copy adds a "STOP AFTER ESTIMATION" guard the shipped copy lacks. |
| `task.md` | Complex task execution/breakdown | Describes mutating task state; STOP/Output guards live only in `src/`. |
| `workflow.md` | Generate implementation workflow from PRD | Writes `claudedocs/workflow_*.md`; bounding guards only in `src/`. |
| `spawn.md` | Meta-orchestration of complex operations | File ops + Bash described in prose; STOP guard only in `src/`. |

Each is a markdown context-file: YAML frontmatter (`name`, `description`, `category`, `complexity`,
`mcp-servers`, `personas`) then a stereotyped body (Triggers → Usage → Behavioral Flow → MCP
Integration → Tool Coordination → Key Patterns → Examples → Boundaries). `plugin.json` points
`commands → ./commands/`, confirming **`plugins/` is the shipped tree.** Invocation does **not** flow to
neighbouring components — the bodies name personas/MCP servers as abstract labels but never invoke the
agents in `agents/` or the modes in `modes/`.

**The supporting agents (`plugins/superclaude/agents/`):** `requirements-analyst` (48 lines, ideas →
PRD/spec via Socratic discovery, explicit `Will Not` carve-out from architecture at
`requirements-analyst.md:46`) and `system-architect` (48 lines, scalable architecture/ADRs, refuses
code/UI at `system-architect.md:46-48`) are clean single-job personas. `pm-agent.md` (692 lines, ~14× its
peers) is a grab-bag spanning session-memory restore, PDCA self-eval, a `docs/temp→docs/patterns→docs/mistakes`
filesystem workflow, monthly doc pruning, `CLAUDE.md` self-mutation, and a "meta-layer above specialist
agents" orchestration claim (`pm-agent.md:528-548`). **No agent declares `tools:`** (`grep -ic "^tools:"`
→ 0 of 20), so all inherit the full default toolset including Write/Edit/Bash.

**The pm triplication** — pm is encoded three times, none wired to each other:
- **Agent** `pm-agent.md` (prose persona driving Serena-MCP memory ops + filesystem moves);
- **Skill** `skills/pm/SKILL.md` (~50-line condensed restatement, different memory targets: `docs/memory/`, `TASK.md`);
- **Python** `src/superclaude/pm_agent/{confidence,reflexion,self_check,token_budget}.py`, exposed via
  `__init__.py` and consumed **only** by `pytest_plugin.py` as test fixtures — nothing the agent runs
  imports it. The marketed "PDCA / reflexion / confidence" capability is split: the *narrative* lives in
  unenforced agent prose; the *code* lives in unwired test-only Python; the two never connect.

**The supporting modes/rules (`plugins/superclaude/modes/` + `core/`):** `MODE_Task_Management.md`
(Plan→Phase→Task→Todo hierarchy keyed to Serena memory, `:14-17`), `MODE_Orchestration.md` (a tool-routing
matrix), `MODE_Brainstorming.md`, plus `core/RULES.md`, `PRINCIPLES.md`, `FLAGS.md`. **None is loaded:**
`plugin.json` omits `modes`/`core`; `CLAUDE.md` (342 lines, a Python-package dev guide) never references
them; `scripts/session-init.sh` only echoes a git-status banner and `exit 0`. The `--brainstorm` /
`--task-manage` / `--orchestrate` "flags" in `FLAGS.md:5-25` are *descriptions of when Claude should
choose to behave a certain way* — there is no flag parser, dispatcher, or hook that reads a flag and
loads a mode.

---

## 3. Specialist scorecard

Scored on three rubrics: the spine (**commands**) on the full `commands.md` rubric; supporting slices
(**agents**, **modes/rules**) on their own rubrics' dominant dimensions. Dominant dimensions carry ⭐;
a fatal flaw there caps the slice rather than being flat-averaged away.

### 3a. Planning commands (spine) — `commands.md` rubric

| # | Dimension | Score | Justification (`file:line`) |
|---|-----------|:----:|-----------------------------|
| D1 | Naming & namespacing ⭐ | **3** | `/sc:` advertised in every body (`brainstorm.md:9`) but frontmatter `name:` is bare & generic (`task.md:2` `name: task`, `design.md:2`) — namespace comes only from dir convention, collision-prone. |
| D2 | Argument design | **2** | `argument-hint` in **0 of 30** commands; flag grammar lives only in prose `## Usage` (`workflow.md:18`) — no inline hint, no surfaced defaults. |
| D3 | Thin-wrapper discipline | **1** | Zero delegation — grep for sibling agents/modes across all six is empty; `design.md` inlines what `system-architect.md` owns; brainstorm encoded 4× with no router. |
| D4 | Discoverability & usage clarity ⭐ | **3** | `description` lines are clean one-liners (`estimate.md:3`), but the "NOT executable" caveat is inconsistent (only `brainstorm.md:12`) and no `argument-hint` undercuts call-without-reading. |
| D5 | Idempotence / safety | **2** | `task`/`spawn`/`workflow` describe mutation, but the STOP/Output guards bounding re-runs exist only in `src/` (`src/.../workflow.md:99-110`), absent from the shipped copy. |
| D6 | Clarity & maintainability | **2** | Bodies readable individually, but two divergent trees + 4× brainstorm duplication make command→delegate→effect untraceable; "the real one" is the stale truncation. |

**Spine verdict: ≈ 2/5.** Capped by **D3=1** (the commands are not thin wrappers — they re-embed
procedures their siblings own) compounded by the divergence (the shipped copies dropped the safety
scaffolding). Even the dominant dimensions (D1/D4) only reach mediocre.

### 3b. Planning agents (supporting) — `agents.md` dominant dimensions

| # | Dimension | Score | Justification (`file:line`) |
|---|-----------|:----:|-----------------------------|
| D1 | Single clear job ⭐ | **3** | `requirements-analyst`/`system-architect` crisp & bounded (`requirements-analyst.md:45-48`); `pm-agent` a 692-line grab-bag (`pm-agent.md:18-548`) drags it down. |
| D2 | Prompt effectiveness ⭐ | **3** | The two architects are concrete & output-shaped (`system-architect.md:32-37`); `pm-agent` over-promises "continuous self-learning" with the real engine unwired (`pm-agent.md:271-278` vs `pytest_plugin.py:14-17`). |
| D3 | Tool least-privilege | **1** | No agent declares `tools:` → all inherit Write/Edit/Bash, analysis/design roles included. "Missing grant" ≠ default-safe; it's max-privilege. |
| D6 | Description & triggering | **2** | `requirements-analyst` vs Brainstorming-mode vs pm-skill collide on early-planning intent; `system-architect` vs `backend-architect` overlap; `pm-agent` "ALWAYS activates" over-fires (`pm-agent.md:10`). |

**Agents verdict: ≈ 2.5/5.** The two architect personas would score ~4 in isolation; **D3 over-grant +
the pm triplication/claims-vs-wiring gap** pull the slice down.

### 3c. Planning modes & core rules (supporting) — `rules.md` dominant + decisive dimension

| # | Dimension | Score | Justification (`file:line`) |
|---|-----------|:----:|-----------------------------|
| D1 | Behavior-shaping effectiveness ⭐ | **3** | *If loaded*, `RULES.md:46-52` & `MODE_Task_Management.md:14-17` are concrete; `PRINCIPLES.md:13-23` is vague SOLID/DRY recitation. |
| D2 | Clarity | **4** | Unambiguous, well-structured, good Right/Wrong exemplars (`RULES.md:40-44`); a newcomer could act on them. |
| D3 | Layering & precedence | **4** | Best feature: `RULES.md:11-15` states a real Safety>Scope>Quality>Context hierarchy; `FLAGS.md:127-133` a flag-priority order. |
| D5 | Freshness | **2** | Modes name Serena/Magic/Morphllm/Playwright MCP tools (`MODE_Task_Management.md:14-49`, `MODE_Orchestration.md:19-27`) the shipped `.mcp.json` (Context7 + Sequential only) doesn't provide. |
| D6 | Discoverability / wiring ⭐ | **1** | **Decisive.** `plugin.json` omits `modes`/`core`; `CLAUDE.md` doesn't `@import`; `session-init.sh` doesn't inject; no flag parser. Confirmed dead text. |

**Modes/rules verdict: ≈ 2/5.** The bodies are above genre average (D2/D3 = 4) but **capped by D6=1** —
as shipped, they shape nothing; D5 breaks even the hypothetical (their named tools don't resolve).

### Strengths (with evidence)

- **Clean persona pair.** `requirements-analyst.md` and `system-architect.md` are well-bounded
  single-job agents with explicit `Will Not` seams that prevent role bleed (`requirements-analyst.md:45-48`,
  `system-architect.md:45-48`) — a deliberate requirements→architecture handoff.
- **RULES.md is the strongest artifact in the domain** — a tiered priority system (🔴/🟡/🟢,
  `RULES.md:5-9`) and an explicit conflict-resolution hierarchy (`RULES.md:11-15`). Worth studying.
- **`MODE_Task_Management.md`** is a coherent planning loop (Plan→Phase→Task→Todo, `:14-17`, worked
  examples `:76-103`) — it would shape behavior well *if it loaded and its tools resolved*.
- **The `src/` tree shows the authors know what good looks like** — `src/` command copies add the
  `## CRITICAL BOUNDARIES` / "STOP AFTER…" guards (`src/.../workflow.md:99-110`). The intent is sound;
  the build pipeline doesn't ship it.

### Weaknesses & risks (the caps)

- **No delegation anywhere (D3 spine = 1).** Commands re-embed procedures their agents/modes own;
  `personas:`/`mcp-servers:` frontmatter is decorative.
- **Dead text (D6 modes = 1).** The manifest is the receipt: `modes/` and `core/` are loaded by nothing.
  The "7 modes" feature is claims-without-wiring.
- **Universal tool over-grant (D3 agents = 1).** Zero `tools:` declarations → max-privilege planners.
- **Triplication with no source of truth.** brainstorm ×4, pm ×3, design ×2; no router; copies drift.
- **Stale-copy ships.** `plugins/` planning commands are truncations of `src/`, dropping the safety guards.
- **Freshness rot (D5).** Mode/flag-named MCP tools (Serena/Magic/Morphllm/Playwright/Tavily) aren't in
  the shipped `.mcp.json`; "30-50% token reduction"/"3.5x faster" asserted, not measured.

### Headline verdict

**The planning domain caps at roughly 2/5 — strong files, broken system.** SuperClaude has the raw
materials of a good planning capability: bounded analyst/architect personas, a real priority/conflict
hierarchy in `RULES.md`, a coherent task-management mode. But none of it is *wired* — commands don't
delegate to the agents that should own the work, the modes and rules that would shape planning behavior
are loaded by no manifest key or hook, the agents carry no tool grants, and the whole capability is
duplicated 3–5× across component types with nothing routing between the copies. What's advertised as a
"30 commands / 20 agents / 7 modes" planning framework is, as shipped, a richly-structured documentation
*taxonomy* of planning behaviors rather than an executable, delegating, single-source-of-truth system.
The dominant cap is the cross-wiring absence (feature-spanning composition), with the dead-text modes
(`D6=1`) and the stale-copy release pipeline as the two sharpest individual failures.

---

## 4. Lessons for nxtlvl (negative-space, no ADR)

This is a neutral domain review, not an adopt/adapt/reject ledger — but the failure modes are
instructive by contrast, and they corroborate already-locked nxtlvl positions:

- **A capability encoded N times with no router is N maintenance liabilities** — the same lesson as the
  [ruflo discovery review](ruflo-discovery-review.md). nxtlvl's router-as-loaded-floor-brief (vs.
  frontmatter description) and single-source-of-truth discipline are validated by contrast.
- **A "feature" is only real if something *loads* it.** SuperClaude's manifest is the receipt that its
  modes are dead text — the same claims-vs-wiring audit lens that surfaced ruflo's lying memory and the
  agentic-os reflections. Judge the wiring (the manifest key, the `@import`, the hook), never the README.
- **A missing `tools:` grant is not default-safe — it's max-privilege.** nxtlvl's read-only-by-withheld-
  tools (context-scout, idea-critic) is enforced by the grant, not by prose; SuperClaude's zero-grant
  agents are the anti-pattern.
- **A `src/`↔`plugins/` two-tree layout silently ships the stale copy** unless the build guarantees
  byte-equality. Relevant to nxtlvl's own `sandbox/` → `plugins/` promotion discipline (the move *is* the
  activation, one tree, no drift).
- **Pointers-over-content is validated by the inverse:** SuperClaude's intended all-inline modes (~19K
  always-on tokens) is exactly the always-on tax nxtlvl avoids.

No finding here is architectural-and-expensive-to-reverse for nxtlvl; all are confirmations, so no ADR.
