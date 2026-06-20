# nxtlvl `reference/` domain map — capability lens

*Mapped 2026-06-20.* The **capability companion** to the structural
[reference-repo-map.md](reference-repo-map.md). That map answers *"what's in each repo"*
(components, size, language); this one answers *"what can each repo do, and which one do I mine for
surface X."* You mine by capability, not by component count — so for build decisions this is the more
directly useful of the two.

**Rows are nxtlvl's own taxonomy** (from [nxtlvl-domain-map.md](nxtlvl-domain-map.md)) — Layer-2
workflows + Layer-3 subsystems — *not* a neutral catalog. That's deliberate: it makes the matrix
answer a question nxtlvl has ("where are my mining candidates per surface?") instead of faithfully
cataloguing ECC's 40+ domains, most of which are out-of-scope ([ADR-008](../decisions/ADR-008-reactive-growth-intake-gate.md) fallback-only).

### Two caveats baked into every cell

1. **Counts ≠ quality.** Cells were seeded from a keyword scan of agent/skill/command *names*, then
   corrected by the prior deep reviews. Where a repo has high surface but a review found it hollow,
   the cell is downgraded and footnoted (¹). *A filename is a claim; the review is the wiring.*
2. **Code-harnesses are under-counted by name-scan.** deepagents/hive/CowAgent encode their
   capability in Python, not `*.md` — their spine cells are rated from architecture, footnoted (²).

---

## The matrix

**Coverage:** ● strong · ◐ present · ○ thin/claimed · – none.
**Columns** (bucketed as in the repo-map): *A curated CC* — ECC, ruflo, **SC**=superclaude,
**Trel**=Trellis, **hk**=hooks-mastery, **sub**=claude-code-sub-agents · *B catalogs* —
**cct**=claude-code-templates, **agm**=agents-main, **tk**=toolkit · *C code-runtimes* —
**dp**=deepagents, **hv**=hive, **cow**=CowAgent, **cw**=CodeWhale.

| Domain (nxtlvl frame) | ECC | ruflo | SC | Trel | hk | sub | cct | agm | tk | dp | hv | cow | cw |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **L2 · Ideation / brainstorm** | ◐ | ○¹ | ○¹ | **◐** | – | ○ | ◐ | ○ | ○ | ○ | – | – | – |
| **L2 · Spec / plan** (dev) | ● | ●¹ | ◐¹ | **●** | ○ | ○ | ● | ◐ | ◐ | ◐² | ◐² | ○² | ○ |
| **L2 · Research** | ● | ◐ | ◐¹ | ◐ | ○ | – | ● | ○ | ◐ | **◐** | – | ○ | – |
| **L2 · Code review / quality** | ● | ◐ | ◐ | ○ | – | ◐ | ● | ● | ◐ | ○ | ○ | – | – |
| **L2 · Testing** | ● | ◐ | ○ | ○ | – | ◐ | ● | ◐ | ◐ | – | ○ | – | ○ |
| **L2 · Security** | ● | ◐ | ○ | – | – | ○ | ◐ | ◐ | ◐ | – | – | ○ | ○³ |
| **L2 · Git workflow** | ◐ | ● | ○ | ◐ | ○ | – | ◐ | ◐ | ◐ | – | – | – | ◐ |
| **L2 · Docs / ADRs** | ● | ◐ | ○ | ○ | ○ | ◐ | ● | ◐ | ◐ | ◐ | – | ○ | ○ |
| **L3 · Memory** | ◐ | ●¹ | – | **●** | – | – | ◐ | ◐ | ○ | ◐² | **●²** | ◐² | ○ |
| **L3 · Hooks / automation** | ● | ◐¹ | ○ | **●** | ● | – | ◐ | ○ | ○ | ○ | ○ | – | ○ |
| **L3 · Orchestration / composition** | ● | ● | ◐¹ | ◐ | – | ◐ | ◐ | ● | ○ | **●²** | **●²** | ○ | ◐ |
| **L3 · Agent-building / meta** | ● | ● | ○ | ◐ | ◐ | ○ | ● | ● | ○ | ◐ | ◐ | ◐ | **◐** |
| **Out-of-scope breadth** | ● | ◐ | ○ | – | – | ○ | ● | ● | ○ | ○ | ◐ | ◐ | ○ |

¹ **High surface, low wiring** (prior reviews): ruflo ideation = encoded ~5× *no router*; ruflo
memory = degraded mode that *lies*; SC = `plugin.json` omits modes/core so modes are dead text +
ships stale truncated command copies. Treat as anti-patterns, not mining targets.
² **Capability is in code, not markdown** — rated from architecture: deepagents = built-in
planning + filesystem memory + subagent spawning; hive = DAG-compiled topology + role-based evolving
memory; CowAgent = "proactively plans tasks" + long-term memory. Name-scan can't see these.
³ CodeWhale's security is a *posture* (approval-gated tools, OS sandbox, `/restore`), not a domain
skillset.

---

## Per-repo domain profiles

Each: **spine** (defining domain) · strong elsewhere · notable gap · mining note.

### A. Curated CC harnesses

- **ECC** — *spine: comprehensiveness.* Strong on **every** in-scope domain plus huge out-of-scope
  breadth; the reference superset. Gap: none by coverage — its weakness is curation, not gaps. Mine:
  the per-domain depth (reviewers, orch-*, deep-research), already mapped in [ecc-main-map.md](ecc-main-map.md).
- **ruflo** — *spine: orchestration (maximalist, 202 hits).* Also heavy git + agent-building. Gaps
  that *matter*: ideation and memory look strong by count but are the **anti-pattern exhibits** (no
  router; lying memory). Mine: cultural/hygiene only — see [ruflo-distillation.md](ruflo-distillation.md).
- **superclaude** — *spine: behavioral "modes" over commands* — but the modes are dead text. Thin
  everywhere real. Mine: `RULES.md` tiered-priority hierarchy; otherwise a what-not-to-do. See
  [superclaude-planning-review.md](superclaude-planning-review.md).
- **Trellis** — *dual spine: spec/plan + memory, both persisted into the repo.* **The closest peer
  to nxtlvl's own spec→plan→memory spine.** Uniquely (among un-reviewed) also has *real* ideation
  (`brainstorm`, `first-principles-thinking`), is hook-heavy (59 files), and ships a skill-authoring
  surface (`bootstrap-skill`, `create-manifest`, `publish-skill`). Gap: security, code-review. **Top
  deep-review target — strongest overlap with nxtlvl's build.**
- **claude-code-hooks-mastery** — *spine: hooks (teaching).* Everything else is demo scaffolding.
  Mine: the hook lifecycle exemplar; already distilled ([hooks-mastery-distillation.md](hooks-mastery-distillation.md)).
- **claude-code-sub-agents** — *spine: a flat SDLC agent roster* (frontend/backend/review/qa/security
  + an `agent-organizer`). No skills/commands/hooks/memory. Mine: a clean "what a bare subagent
  library looks like" contrast; the `agent-organizer` routing pattern. Easy, low-yield.

### B. Distribution catalogs (breadth-as-product)

- **claude-code-templates** — *spine: distribution.* Mirror-wide coverage of every domain (counts are
  catalog mirroring, not craft). Mine: the validator/promotion mechanism, not the content. See
  [claude-code-templates-distillation.md](claude-code-templates-distillation.md).
- **agents-main** (wshobson) — *spine: multi-harness marketplace.* Genuine strength on review,
  orchestration (`conductor`, `agent-teams`), plan, + huge out-of-scope. The interesting bit is the
  **one-md-source → 5-harness compile**, and `plugin-eval`/`improve-agent` governance. Un-reviewed;
  mid-value (breadth) but the compile pipeline is worth a look.
- **toolkit** — *spine: a `rules/`+`contexts/` lens.* Thin everywhere; activation is manual `cp`.
  Already distilled (mostly reject) — [awesome-claude-code-toolkit-distillation.md](awesome-claude-code-toolkit-distillation.md).

### C. Non-CC code-runtimes (harness lives in code — contrast, not copy)

- **deepagents** (LangChain) — *spine: a subagent-spawning framework with built-in planning +
  filesystem memory.* Research is a showcase (`web-research`, `arxiv-search`). The `²` cells are its
  real strengths, invisible to name-scan. Mine: the *planning-as-builtin* and *filesystem-as-memory*
  patterns — architectural contrast to nxtlvl's skill-composed flow.
- **hive** (OpenHive) — *spine: DAG-compiled multi-agent topology + role-based evolving memory.* Both
  in Python. Mine: the "objective → strict execution DAG" model and persistent role-memory as a
  contrast to nxtlvl's composition layer.
- **CowAgent** — *spine: a self-evolving multi-channel personal assistant* (plans, long-term memory,
  runs its own Skills, IM channels). Mine: the self-evolution + long-term-memory loop; otherwise
  out-of-shape (personal-assistant, not dev-harness).
- **CodeWhale** — *spine: a Rust terminal coding agent* — **but** surprisingly ships a meta-authoring
  suite (`skill-creator`, `plugin-creator`, `mcp-builder`, `skill-installer`), GitHub issue/PR ops
  (`gh-*`), and `fleet-manager`/`delegate`. Not the pure skip the structural map implied. Mine: the
  in-tool skill/plugin-authoring UX as a contrast; the coding loop itself is out-of-scope.

---

## What the matrix says — mining shortlist per nxtlvl surface

For each nxtlvl build surface, the candidate(s) worth a deep review (★ = best fit), and the
anti-patterns to learn *against*:

| nxtlvl surface | Mine from | Learn-against (anti-pattern) |
|---|---|---|
| **Ideation / brainstorm** | ★ Trellis (real brainstorm + first-principles); ECC (council/taste/product-lens) | ruflo, SC (capability with no router) |
| **Spec / plan** | ★ Trellis (repo-persisted spec spine); ECC (prp/orch depth) | SC (commands that don't delegate) |
| **Research** | ECC (deep-research); deepagents (web/arxiv showcase) | SC (depth in dead files) |
| **Memory** (ADR-004 extend-native) | ★ Trellis (repo-persisted); hive (role-based evolving); deepagents (filesystem) | ruflo (memory that lies) |
| **Hooks** (ADR-006 fail-open) | hooks-mastery (lifecycle); Trellis (59-file real automation) | ruflo (registration drift) |
| **Orchestration / composition** (ADR-003) | deepagents + hive (code-level DAG/subagent contrast); agents-main (`conductor`) | ruflo (maximalist sprawl) |
| **Agent-building / meta** | ★ CodeWhale (in-tool authoring suite); Trellis (skill authoring); agents-main (1-source→5-harness); cct (validator) | toolkit (manual `cp` activation) |

**Headline:** **Trellis is the un-reviewed standout** — it's the only reference repo whose *spine*
(spec + plan + memory, persisted into the repo) directly mirrors nxtlvl's, and it independently
covers ideation, hooks, and skill-authoring. Every other un-reviewed repo is either a breadth catalog
(agents-main) or an architectural contrast (the code-runtimes). If one deep `harness-review` gets run
next, it's Trellis.

*Deep findings → `docs/reference/*-distillation.md` (Mode B) / `*-review.md` (Mode C); adopt/adapt
items → [`docs/plan/nxtlvl-harness-adopt-backlog.md`](../plan/nxtlvl-harness-adopt-backlog.md).*
