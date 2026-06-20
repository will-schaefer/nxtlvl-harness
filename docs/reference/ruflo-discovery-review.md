# ruflo — discovery / brainstorming / exploration / ideation review

> **ruflo — discovery/ideation capability review.** How `ruvnet/ruflo` (formerly **claude-flow**)
> handles the "explore / research / specify a problem before building" capability. Analyzed
> 2026-06-19 · 80M vendored clone at `reference/ruflo-main/` (gitignored) · source:
> <https://github.com/ruvnet/ruflo>. **Scope:** `DOMAIN=agents` (scoring spine) · `FOCUS=discovery /
> brainstorming / exploration / ideation` — a *feature that spans component types* (agents + skills +
> commands + methodology-as-rule), so per Mode C's feature-spanning rule the **agents** are the
> scored spine and skills/commands/rule are assessed via their own rubrics' dominant dimensions, with
> the **cross-wiring** as the central composition finding. Method: vendor → parallel read-only fan-out
> (3 slices: agents · skills+rule · commands+wiring) → agents-specialist synthesis. Every claim cites
> `file:line` (paths relative to the clone). Companion to the whole-repo Mode-B
> [`ruflo-distillation.md`](ruflo-distillation.md).

---

## 1. Spine — the headline judgment

**ruflo has no brainstorming/ideation domain. It has a discovery capability — and that capability is
individually excellent in its newest parts but structurally broken as a whole.** Three findings
define it:

1. **The parts are good; the system is a pile of drifting duplicates.** The same "explore / research /
   spec before building" capability is encoded **~5 times** with **no single source of truth and no
   intent router**: (a) a legacy SPARC stack under `.claude/` that is **byte-for-byte triplicated**
   into `v3/@claude-flow/{cli,mcp}/.claude/`, (b) an `.agents/skills/` "agent-\*" persona copy, and
   (c) the new, marketplace-shipped `plugins/ruflo-{sparc,goals,core}` generation. Only (c) ships to
   users — but nothing deprecates (a) or (b), so a user faces `ruflo-sparc:` *and* `/sparc-*` legacy
   stubs *and* the MCP `sparc_mode` tool, none marked canonical. There is **no front-door** for "I
   want to explore/ideate."

2. **The "ideate" surface specifically is the weakest thing in the subsystem.** The closest ruflo
   comes to brainstorming is SPARC's `innovator` and `researcher` "modes" — and both are
   **frontmatter-less markdown docs**, not commands (`.claude/commands/sparc/innovator.md:1`,
   `researcher.md:1`): undiscoverable (D4=1) and uninvokable as slash-commands. The capability the
   ask cares about most is the least-built part.

3. **The genuine high-water mark is the new `ruflo-goals` research pipeline.** `deep-research →
   research-synthesize → dossier-collect` (plus the bonus `nested-researcher` / `nested-queen-researcher`
   agents) is **best-practice composable subagent design**: real procedures, evidence-grading rubrics,
   typed return contracts, sibling-disambiguating triggers, and hard budget/depth gates with "never
   silently truncate." These are worth mining. But two systemic defects cut across even the good
   parts (§3).

**What caps the subsystem:** not the quality of any single artifact — several score 4–5 — but the
**composition layer**. The two halves of "explore before build" live in *separate plugins that don't
reference each other* (`ruflo-goals` research vs `ruflo-sparc` spec), and `sparc-spec` re-derives
requirements instead of calling `deep-research` (`plugins/ruflo-sparc/skills/sparc-spec/SKILL.md:24-29`).
A capability encoded five times with no routing between the copies, and whose front-half handoff is
unwired, is the headline — and it caps an otherwise strong-in-parts subsystem at **≈3/5**.

---

## 2. What's there & how it works

### 2.1 The capability, by component type

| Component | Legacy generation (`.claude/`, `.agents/`) | New generation (`plugins/ruflo-*`, marketplace-shipped) |
|---|---|---|
| **Agents** (spine) | `sparc/specification`, `sparc/pseudocode`, `core/researcher`, `hive-mind/scout-explorer`, 3× `goal-planner`, `code-goal-planner` | `ruflo-goals/{deep-researcher, dossier-investigator, goal-planner}`, `ruflo-core/researcher`, `ruflo-sparc/sparc-orchestrator`, `ruflo-agent/{nested-researcher, nested-queen-researcher}` |
| **Skills** | `.claude/skills/sparc-methodology` (1106 lines), `.agents/skills/agent-{researcher,specification,scout-explorer}` (stubs) | `ruflo-sparc/skills/sparc-spec`, `ruflo-goals/skills/{deep-research, research-synthesize, dossier-collect, goal-plan}` |
| **Commands** | `sparc/{ask, innovator, spec-pseudocode, researcher, sparc, sparc-modes}`, `swarm/research`, `workflows/research` | `ruflo-sparc/commands/ruflo-sparc`, `ruflo-goals/commands/goals` |
| **Rule** | SPARC methodology doctrine (skill text only) | — (no rule-layer assertion) |

### 2.2 The wiring map (the central composition finding)

- **The v3 triplication is verbatim.** `diff` of `.claude/commands/sparc/{innovator,researcher,ask}.md`
  against both `v3/@claude-flow/cli/.claude/…` and `v3/@claude-flow/mcp/.claude/…` returned **identical**.
  All three `commands/sparc/` dirs hold exactly 32 files; all three `agents/sparc/` dirs hold 4. v3 is
  a byte-identical vendor copy of root `.claude/` — **3× duplication, zero divergence, no symlink, no
  generator note, no source-of-truth marker**. Any edit must be made in three places or they silently
  drift.
- **New supersedes legacy in distribution, but legacy is never retired.**
  `.claude-plugin/marketplace.json` ships **35 `ruflo-*` plugins** by `./plugins/...`;
  `grep -c '"./.claude'` = 0 — the legacy `.claude/sparc`
  stack is *not* distributed. But it survives live on disk, the v3 mirrors survive, the `.agents/skills`
  copy survives, and CLAUDE.md still teaches the legacy MCP `sparc_mode` path with no "use ruflo-sparc
  instead" note. Coexistence, not replacement.
- **No intent router, no front-door.** The only "front door" is the static legacy catalog
  `.claude/commands/sparc.md:25-40` (a list, not a dispatcher, pointing at the frontmatter-less stubs).
  `ruflo-sparc.md` has a `$ARGUMENTS` subcommand router but only *within* SPARC phases. The only real
  router in the repo (`v3/@claude-flow/cli/src/commands/route.ts`) is a **model/cost** router, not a
  capability router. "Research" alone maps to **6 different artifacts** (`sparc/researcher`,
  `swarm/research`, `workflows/research`, legacy `core/researcher`, new `ruflo-core/researcher`,
  `ruflo-goals/deep-researcher`); "ideate" maps to the broken `innovator` doc. No dispatcher chooses
  among them.
- **The good research pipeline composes; the spec front-half does not.** `deep-research` writes the
  `research`/`research-sources` memory namespaces; `research-synthesize` reads exactly those and
  refuses to re-research; `dossier-collect` explicitly routes specific-questions→`deep-research`,
  plans→`goal-plan` (`plugins/ruflo-goals/skills/dossier-collect/SKILL.md:13-17`). That is genuine
  routing — the strongest wiring in the subsystem. But `ruflo-sparc`'s `sparc-spec` does **not** call
  `deep-research` for requirement discovery; it re-derives requirements ad hoc, and the two plugins
  never reference each other. The advertised "spec hands off from research" seam is missing.

---

## 3. Specialist scorecard (agents spine + supporting components)

Scoring spine = the **agents** rubric (Mode C `domains/agents.md`). Dominant dimensions **D1 (single
clear job)** and **D2 (system-prompt effectiveness)**; the subsystem-level cap comes from **D3
(least-privilege)** and **D6 (description/triggering)** because both fail *systemically*, not per-agent.

### 3.1 Agents (spine) — subsystem rollup

| # | Dimension | Score | Justification (representative `file:line`) |
|---|-----------|:-:|--------|
| D1 | Single clear job ⭐ | **3** | Bimodal: new gen owns crisp jobs (`deep-researcher.md:7`, `dossier-investigator.md:7`) but legacy `code-goal-planner.md:227-275` is a GOAP+5-SPARC-phases+git+sprints grab-bag. |
| D2 | System-prompt effectiveness ⭐ | **4** | Genuinely strong where it counts: `dossier-investigator` typed inputs + BFS + budget caps (`:12-62`), `deep-researcher` High/Med/Low evidence rubric (`:31-41`), `sparc-orchestrator` per-phase gate criteria (`:11-101`), `nested-researcher` inline-vs-spawn decision table (`:19-62`). Legacy `scout-explorer` is the weak spot — ~10 repetitive `memory_usage` blobs, teaches reporting format not exploration method (`scout-explorer.md:20-246`). |
| D3 | Tool-grant least-privilege | **2** | **Systemic failure.** 12 of 14 discovery agents declare **no `tools:` field** → inherit full Write/Edit/Bash despite read-only charters ("Don't modify discovered code" `scout-explorer.md:218`; "Never modify source code" `ruflo-core/researcher.md:73`). Read-only exists only as prose. Only `nested-researcher` (`:5-12`) and `nested-queen-researcher` scope their grants — proof the harness *knows* the fix and applies it almost nowhere. |
| D4 | Context isolation & return shape | **3** | Bimodal: new gen has typed contracts (`dossier-investigator` `{nodes,edges,sources}` + per-claim provenance `:52-60`; `nested-researcher` "if child returns >500 tokens it's defeating the nesting" `:50`); legacy `researcher`/`scout-explorer` define output as fire-and-forget memory writes with no caller return (`core/researcher.md:170`). |
| D5 | Spawn boundaries | **3** | New gen bounded (`dossier-investigator` maxDepth/maxBreadth/budget; `nested-queen-researcher` monotonic scope reduction `:86,150-152`); legacy planners spawn unbounded ("Dynamically spawn specialized agents" `goal-planner.md:71,147`; MCP `agent_spawn` `code-goal-planner.md:338-347`). |
| D6 | Description & triggering | **2** | **Systemic collision.** `goal-planner` is **triplicated** — same `name`, near-identical description across `.claude/agents/goal/`, `.claude/agents/reasoning/`, `plugins/ruflo-goals/` (the two legacy copies already drifted in body) → router ambiguity. `researcher` collides 3-way (legacy `core`, new `ruflo-core`, `deep-researcher`). |
| D7 | Clarity & maintainability | **4** | Individually legible; the drift is cross-file (same name / different body), not within-file. |

**Spine overall: ≈3/5.** D2 is a genuine 4 and the new-gen agents are individually 4–5, but two
dominant-adjacent dimensions fail *systemically* — every read-only role is over-granted (D3), and the
identity-bearing `goal-planner`/`researcher` descriptions collide (D6). Per the don't-flat-average
rule, these cap the spine below its best artifacts.

### 3.2 Supporting components (assessed via their rubrics' dominant dimensions)

- **Skills — D1 (description-as-trigger):** the live `ruflo-goals` trio is **strong** —
  `research-synthesize` names its precondition so it won't mis-fire on cold research
  (`research-synthesize/SKILL.md:13-15`), `dossier-collect` disambiguates siblings in its trigger
  ("For specific questions use deep-research…" `dossier-collect/SKILL.md:13-17`). `deep-research` is a
  **real procedure, not a stub** (8 steps, evidence-graded synthesis `deep-research/SKILL.md:18-30`) —
  its one gap vs a best-practice research harness is **no adversarial claim-verification step** (it
  cross-references but never tries to *disprove*). `sparc-spec` is a competent single-phase skill
  (D1≈3 — trigger cues live in the body, not the description). The `.agents/skills/agent-*` "skills"
  are **non-functional stubs**: description is `"invoke with $agent-researcher"`
  (`agent-researcher/SKILL.md:3`) — zero task semantics, D1=1, auto-generated, double-frontmatter;
  disregard for adoption.
- **Commands — D1 (naming/namespacing) + D4 (discoverability):** the new gen is **textbook** —
  `ruflo-goals/commands/goals.md` is a model thin-wrapper (read-only status command delegating to the
  `deep-research` skill + agents, `:6-13`), namespaced with an exact description (D1/D4 = 5). The
  legacy gen **fails the dominant dimensions**: `innovator.md` and `researcher.md` have **no
  frontmatter** (D4=1, undiscoverable), and `ask`/`spec-pseudocode`/`sparc` carry **truncated
  ellipsis descriptions** (`ask.md:3`). One regression in new gen: `ruflo-sparc.md` **violates
  thin-wrapper discipline (D3)** — it re-implements the 5-phase gate logic inline (`:30-49`) while
  shipping an *unused* `sparc-orchestrator` agent + `sparc-spec/refine/implement` skills, so the
  procedure now lives in two places.
- **SPARC methodology as a rule — D1 (behavior-shaping) + D6 (wiring):** **does not govern behavior.**
  The always-loaded `CLAUDE.md` (1100+ lines) mentions "SPARC" only as a list of agent *names*
  (`CLAUDE.md:537-538`); a grep for a "specification-first / explore-before-build" directive returns
  0 hits. The doctrine lives only in opt-in skill text that must be triggered — **D6=2 (dead at the
  rule layer)**. "Explore before build" is a skill you can choose to invoke, **not** enforced
  behavior. (The terse 118-line `.agents/skills/sparc-methodology` *does* carry a When-to-Trigger /
  When-to-Skip contract `:14-27`, proving ruflo can write a trigger — it just never promoted it to a
  loaded rule.)

### 3.3 Strengths

- **The `ruflo-goals` research pipeline is genuinely best-practice** — real composed procedures with
  namespace handoffs, evidence-grading + contradiction-resolution rubrics, and hard budget gates
  ("never silently truncate" `dossier-collect/SKILL.md:57-61`).
- **`nested-researcher` / `nested-queen-researcher` are discipline exemplars** — the *only* agents
  with least-privilege grants (`nested-researcher.md:5-12`), explicit depth caps + `NESTING_DEPTH_EXCEEDED`,
  typed child-return token budgets. ruflo demonstrably knows how to do this right.
- **New-gen frontmatter hygiene is uniformly correct** (names match dirs, argument-hints present).
- The *distributed* surface (marketplace plugins only) is cleaner than the on-disk surface.

### 3.4 Weaknesses & risks

- **~5 parallel encodings, no source of truth, no front-door** — including a 3× byte-identical
  triplication that is a pure drift surface.
- **The ideation-critical surfaces (`innovator`, `researcher`) are frontmatter-less docs** — the very
  thing the ask is about is undiscoverable and uninvokable.
- **Systemic over-grant** — 12/14 agents run with full mutate capability despite read-only charters.
- **Front-half handoff unwired** — `sparc-spec` re-derives requirements instead of composing
  `deep-research`; the two halves live in non-cross-referencing plugins.
- **SPARC doctrine is aspirational at the rule layer** — never asserted where the runtime always reads.
- **`ruflo-sparc` command re-introduces drift** by inlining logic its own shipped skills/agent own.
- **Silent substrate degradation** — neural/agentdb/embeddings steps no-op on an empty store with no
  fallback note, so fresh-repo runs quietly skip memory/pattern phases.

### 3.5 Headline verdict

**Strong in parts, broken as a whole — ≈3/5.** ruflo's discovery capability contains some of the best
subagent and skill design in the repo: the `ruflo-goals` research trio and the `nested-*` agents are
4–5-calibre, composable, bounded, and worth mining. But the subsystem is not a *system*: the same
capability is encoded five times with no routing and no front-door, the two halves of "explore before
build" don't compose, the methodology that would tie it together is never loaded as a rule, and every
read-only role is over-granted. And the brainstorming/ideation surface the ask names most directly is
its weakest point — frontmatter-less docs that can't be discovered. The lesson is the cross-wiring,
not any single artifact: **a capability is only as good as the routing between its copies, and ruflo
has none.**
