# Handoff — nxtlvl workflow-layer curation

> **For a fresh session.** Self-contained: everything you need is here or behind the pointers in §1.
> Produced 2026-07-03 from a collaborative mapping session. Run this session **in `~/Developer/nxtlvl`**
> (this repo) so you can write the outputs.

## 0. Your task, in one sentence
Curate the **~85-workflow candidate superset** (embedded in §8) down to nxtlvl's **real** workflow-layer
list — assigning each candidate a disposition (own / compose-native / fold / defer) with a one-line
rationale — and propose a build order. Keep it **lightweight** (one line per workflow); we are mapping
coverage, not writing per-workflow contracts.

## 1. Read these first (durable pointers — don't skip)
- **The anchor:** `docs/intent/personal-harness.md` — esp. *"The build, in three layers"* (defines the
  **workflow layer**: dev · review · research · documentation · agent-building, source-driven against
  `nxtlvl-wiki`) and *"Workload"* (the income surface: Next.js/TS · Python · Rust · KB · LLM-wiki ·
  agentic engineering). This is what "needed" is measured against.
- **The domain shape:** `docs/decisions/ADR-017-git-workflows-domain.md` — the canonical
  **`command → agent → skill`** domain template every workflow follows (thin command → isolated
  executor agent → skill as source of truth). Also ADR-016 (orchestration model), ADR-018 (ideation),
  ADR-019 (project-management), ADR-021/022/023 (agent eval / debug / operation).
- **The prior art:** `plugins/nxtlvl/{commands,skills,agents}/` — what's already built (the 🔁 rows below).
- **The gate:** global decision rule `~/.claude/rules/decisions.md` (spec→plan→ADR; ADR-worthy test).

## 2. How we got here (compressed journey)
1. Goal: outline the **"most common needed workflows"** for the workflow layer → a coverage map.
2. Reframed from a *status* map to a **NEEDS map** (each workflow defined by its **job**), because —
3. **all existing workflows will be reviewed and possibly REWRITTEN by Fable 5.** So prior art is
   *material to review*, never the definition. Don't anchor curation to today's commands.
4. Diverged **wide** into a ~85-candidate superset across 5 domains (arc-of-work taxonomy).
5. Made **Quality per-domain** — dissolved the standalone "Quality" family; each domain now owns a
   `Quality / verify` workflow = a domain-specific CONTRACT over one shared adversarial-review engine
   (`doubt-driven-development` / `doubt-reviewer`, which takes `ARTIFACT + CONTRACT`).

## 3. Framing you MUST preserve while curating
- **Needs map, not status map.** 🔁 = prior art exists to review (may be rewritten by Fable 5);
  ⬜ = greenfield (a need only this map surfaces — it can't be "found" in existing code).
- **Quality is per-domain**, built as ~5 contracts over 1 reused doubt engine (not 5 engines).
  Meta's quality contract is special: it's the **audit gate** — the one gate *meant* to block promotion.
- **`(native /x)` rows are compose-don't-rebuild candidates** — native CC or another plugin already
  covers them; nxtlvl likely shouldn't own them (the intent doc's runtime-backstop principle).
- **Orchestration stays native.** Workflows compose the `command → agent → skill` contract; they never
  reconstruct routing/dispatch.
- **Development is the known gap** — nearly all ⬜, yet highest frequency × income value.

## 4. The curation method (what to actually do)
For **each** candidate row in §8, assign exactly one disposition:
- **OWN** — nxtlvl builds/owns it (net-new, or a rewrite of prior art).
- **COMPOSE / NATIVE** — leave to native CC or another plugin; nxtlvl composes it, doesn't rebuild.
- **FOLD** — merge into another workflow (dedupe near-duplicates).
- **DEFER** — a real need, but not now (park it with a one-line reason).

Annotate each OWN/DEFER with two cheap signals:
- **freq × value** = H / M / L (daily-frequency × income-value, per the Workload section).
- **fit** = does it map cleanly onto one `command → agent → skill` domain? (Y / partial / N)

Then:
- Group the **OWN** set back into the 5 domains.
- Propose a **build order** (greenfield + high freq×value first — expect Development to lead).
- Flag any **new domain** the superset implies but the ADRs don't yet name.

## 5. The deliverable (write it to `docs/plan/`)
A curated companion doc, e.g. `docs/plan/2026-07-03-workflow-layer-curated.md`, containing:
- Per domain: the **OWN** workflows (freq×value + one-line why each).
- A **COMPOSE/NATIVE** list, a **FOLD/dedupe** list, a **DEFER** list (each with reasons).
- A recommended **build order** for the OWN set.
- Then resolve the open decisions in §6 with the user before it's finalized.
Keep it lightweight — one line per workflow. This is the seed of the **coverage map** the intent doc
calls the "standing reference framework."

## 6. Open decisions to settle with the user
1. **Taxonomy** — keep the arc-of-work grouping, or reorganize by workload (app-dev / KB / LLM-wiki /
   agent-building), by frequency tiers, or to match the ADR-domain vocabulary?
2. **Home** — this handoff lives in `docs/plan/`; does the curated map belong in `docs/plan/`
   (coverage-map seed) or `docs/spec/` (a spec-level contract)?
3. **Expand vs curate** — is the superset wide enough, or first mine the reference harnesses
   (`reference/ECC-main`, `reference/superclaude-main`, `reference/claude-code-templates-main`,
   `reference/awesome-claude-code-toolkit-main`) for workflows not yet listed? (Recommendation from the
   prior session: **curate first** — curation reveals exactly where it's thin, giving a *targeted*
   reason to mine, rather than mining blindly.)

## 7. Relationship to the Fable 5 review (don't conflate them)
- **This map = the durable spec** — *what* workflows must exist, defined by their job.
- **Fable 5 review = the implementation pass** — *does each existing workflow do its job well; rewrite
  where not.* It consumes this map; it doesn't redefine it. Greenfield (⬜) rows must be authored — the
  review can't surface them from code that doesn't exist.

---

## 8. THE CANDIDATE SUPERSET (v0.4 — curate this)

**Markers:** 🔁 nxtlvl prior art (under Fable 5 review) · ⬜ greenfield · *(native `/x`)* = native/other-plugin
already covers some of this. Arc: **frame → make → know → ship → build the builder**, with a
`Quality / verify` workflow woven into every domain.

### A. Inception — frame a fuzzy want into a contract
*Intent & ideation:* 🔁 ideate/brainstorm · 🔁 surface intent (interview) · 🔁 stress-test intent/plan
(grill) · 🔁 refine idea into variants
*Spec & planning:* 🔁 specify (→ contract) · 🔁 plan/decompose · ⬜ scope & boundary-setting · ⬜ acceptance
criteria/DoD · ⬜ estimate/size · ⬜ prioritize/triage backlog
*Risk & decision:* ⬜ pre-mortem/risk · ⬜ feasibility spike · ⬜ requirements elicitation (client) · ⬜ frame
a decision (→ ADR) · ⬜ project kickoff
*Quality / verify — "is the plan sound before we build?":* 🔁 spec/plan soundness review (holes ·
contradictions · feasibility — composes grill-me, idea-critic) · ⬜ acceptance-criteria coverage check

### B. Development — the core making loop  *(language-plural; the biggest need)*
*Build:* ⬜ implement a feature · ⬜ scaffold a project (Next.js/Python/Rust) · ⬜ scaffold a module ·
⬜ design+build API/endpoint · ⬜ data model/schema+migration · ⬜ integrate 3rd-party API/SDK · ⬜ build a
UI component · ⬜ wire config/env/secrets
*Fix:* ⬜ debug/fix a failure (reproduce→isolate→fix→verify) · ⬜ reproduce a prod incident · ⬜ hotfix ·
⬜ fix red CI/build
*Improve:* ⬜ refactor · ⬜ perf optimization/profiling · ⬜ type-strengthening · ⬜ error-handling/resilience ·
⬜ logging/instrumentation · ⬜ dependency/version migration · ⬜ port across languages · ⬜ remove dead
code · ⬜ lint/format cleanup
*Understand:* ⬜ codebase orientation · ⬜ dependency/library adoption · ⬜ explain how X works
*Quality / verify — "is the code correct & safe to merge?":* 🔁 code review (five-axis) · 🔁 doubt/
adversarial review · ⬜ pre-commit self-check · ⬜ verify e2e *(native /verify)* · ⬜ security review
*(native /security-review)* · ⬜ test-coverage gap-fill · ⬜ regression check · ⬜ perf-regression check ·
⬜ accessibility audit · ⬜ dependency vuln scan · ⬜ API/contract compat check

### C. Knowledge — research, orient, document
*Research:* ⬜ research a question (conductor over scouts) · ⬜ deep multi-source report *(native
/deep-research)* · 🔁 ground on library docs (context7) · ⬜ paper/literature survey · ⬜ competitive/market
research *(startup: skills)* · ⬜ orient to a new tool
*Document:* 🔁 docs & ADRs · ⬜ README/getting-started · ⬜ API reference gen · ⬜ changelog · ⬜ tutorial/
how-to · ⬜ architecture/diagram authoring (visual-docs rule)
*Distill/capture:* ⬜ summarize/distill · ⬜ extract structured data · 🔁 KB/LLM-wiki construction (wiki
plugin) · ⬜ capture session knowledge (memory/instincts)
*Quality / verify — "is every claim true, cited, complete?":* ⬜ citation & accuracy review (source-
verified, no hallucinated/uncited facts) · ⬜ completeness check (enumerable sets fully covered) ·
⬜ source-tier/attribution check *(seed: `nxtlvl-wiki:lint` 🔁 — generalize the pattern)*

### D. Delivery — ship it, track it, operate it
*Ship:* 🔁 git → PR → merge · ⬜ release/version cut · ⬜ deploy · ⬜ rollback/revert · ⬜ CI/CD pipeline
*Track:* ⬜ project/plan tracking (dashboard — ADR-019) · ⬜ issue/backlog triage · ⬜ review others' PRs
*(native /review)* · ⬜ status/standup summary · 🔁 session handoff/bookmark · ⬜ client deliverable packaging
*Operate:* ⬜ monitoring/alerting · ⬜ incident response · 🔁 promote/prune harness items
*Quality / verify — "is it safe to ship & reversible?":* ⬜ release-readiness gate (CI · changelog ·
rollback · no secrets) · ⬜ pre-merge diff review · ⬜ post-deploy smoke/health check

### E. Meta — build the builder  *(differentiated product surface)*
*Author:* ⬜ build a skill/agent/command · ⬜ author a hook · ⬜ build/integrate an MCP server · ⬜ prompt
engineering · ⬜ plugin packaging/marketplace
*Improve/govern:* 🔁 evolve an item · 🔁 instinct/memory curation (promote/prune) · ⬜ config/settings mgmt
*(native /update-config)* · ⬜ cost/token-budget optimization · ⬜ model selection/migration
*Incubate:* 🔁 cell incubation/graduation (nxtlvl-labs) · 🔁 ingest a reference harness (wiki) ·
⬜ multi-agent orchestration (native `Workflow` tool)
*Quality / verify — "does it meet the bar to promote?":* ⬜ audit gate (config parses · no dead refs ·
valid frontmatter · hooks exit 0 · no secrets — ADR-014) · 🔁 harness coverage review (vs wiki bar) ·
🔁 reference-harness review (adopt/adapt/reject) · ⬜ agent eval (ADR-021) · ⬜ agent debug (ADR-022) ·
🔁 eval-suite construction (nxtlvl-labs)

### The cross-cutting quality primitive (why per-domain is cheap)
Every `Quality / verify` workflow above is a **domain CONTRACT over one shared engine** (`doubt-reviewer`
— fresh-context, biased-to-disprove, typed output). Inception: "does the plan hold?" · Development: "is
the code correct?" · Knowledge: "is every claim true & cited?" · Delivery: "safe to ship & reversible?" ·
Meta: "does it pass the objective bar to promote?" (the audit — the deliberate blocking gate).

---
*Prior-session working draft (ephemeral, do not rely on):*
`/private/tmp/claude-502/-Users-willschaefer-Developer-nxtlvl-wiki/a846a95c-47ac-4f99-860e-3966c6ca8c1d/scratchpad/nxtlvl-workflow-outline-draft.md`
