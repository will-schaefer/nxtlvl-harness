# nxtlvl Documentation Skill Suite — Taxonomy & Deferred Backlog

> Produced via `/idea-refine` (2026-06-19). Audience for all nxtlvl docs is **agents only**
> (confirmed). Decision this pass: **map everything, build nothing** — honor ADR-008
> reactive-growth. Each candidate skill carries an explicit un-defer trigger.

## Problem Statement
**How might we** know which documentation-type skills nxtlvl should eventually build — without
pre-building machinery that ADR-008 says to defer until repeat-need is logged?

## Recommended Direction
**Map, don't build.** nxtlvl already operates six doc types but only encodes the *format* for
one (ADRs). The honest move for an agent-only audience under reactive-growth is to (1) name all
six types and their canonical homes so routing is unambiguous *today*, and (2) hold a prioritized
backlog where each candidate skill carries an explicit **un-defer trigger** — the logged
repeat-need that promotes it from "write the doc by hand" to "worth a skill." This keeps the
curated doc system from fragmenting into thin skills an agent must choose between, while ensuring
nothing real gets lost.

The one skill with evidence already sufficient to un-defer (specs/plans: 11 existing files,
proven format) is noted as trigger-met so it can be pulled forward at will — but per this pass's
decision, nothing is built yet.

## The Taxonomy (canonical homes — true today)

| Doc type | Home | Purpose for agents | Format encoded? |
|---|---|---|---|
| Decision | `docs/decisions/ADR-NNN` | *Why* a hard-to-reverse choice was made | ✅ `documentation-and-adrs` |
| Spec | `docs/spec/` | Verified architecture/impl the agent builds *to* | ✅ `show-me` |
| Plan | `docs/plan/` | Sequencing/task-order for execution | ✅ `show-me` |
| Intent | `docs/intent/` | Anchor *why-at-all*; specs link up to it | ❌ uncovered |
| Reference | `docs/reference/` | Vendored external knowledge (e.g. ECC) | ❌ informal |
| Diagram | `docs/diagrams/` | Visual flow (e.g. context-alert hook) | ✅ README + `visual-docs` rule |

## Prioritized Backlog (each with an un-defer trigger)

1. **`show-me`** (was `writing-design-docs` → `design-layer-authoring`) — specs + plans +
   visuals, folds in intent links — *Trigger: MET; **built** 2026-07-03* at
   `plugins/nxtlvl/skills/show-me/SKILL.md`. Retires the interim
   `spec-driven-development` / `planning-and-task-breakdown` router pointers. Further renames:
   → [`docs/intent/skill-naming-show-me-handoff.md`](../intent/skill-naming-show-me-handoff.md).
2. **doc-index / taxonomy maintenance** — *Trigger: when a 2nd agent visibly fails to find or
   mis-routes a doc.* For an agent audience this is the retrieval bottleneck; extends the ADR
   README-index pattern to all six types.
3. **doc-drift-auditor** — *Trigger: when doc/code disagreement ships ≥2×.* Inverts doc-keeper's
   reactive checklist into a proactive sweep.
4. **harness-system-map** — *Trigger: when onboarding a new agent/context costs real
   re-derivation.* Likely a *doc* maintained by doc-keeper, not a standalone skill.
5. **operational-runbook** — *Trigger: when the same hook/gate misfire is debugged ≥2×.* Surface
   is small; recovery hints already inline in the hooks.
6. **authoring-guide** — *Trigger: when house-format drift appears in a new hook/agent/skill.*
   Largely redundant with component files + plugin-dev today.

## Key Assumptions to Validate
- [ ] **Agents actually mis-route docs without a taxonomy skill** — test: watch the next 3 doc
  tasks; if routing is already unambiguous from the table above, #2 stays deferred indefinitely.
- [ ] **Spec/plan format is stable enough to encode** — test: diff the 5 specs for structural
  divergence before writing #1; if they vary a lot, the "house format" is a mirage.
- [ ] **Reactive-growth triggers will actually fire and get logged** — test: confirm there's a
  place these repeat-needs get recorded (fallback-log / skill-intake backlog), else "defer"
  silently becomes "never."

## Not Doing (and Why)
- **Tutorials / onboarding / contributor guides** — audience is agents-only; human-stranger docs
  have no reader.
- **Building any skill this pass** — ADR-008; no logged repeat-need except specs/plans, left
  trigger-met-but-unbuilt by choice.
- **A skill per genre (6 skills)** — fragments a curated system; an agent picking among 7 doc
  skills is worse than 1 good router + deep formats.
- **Changelog/README skill** — already inside `documentation-and-adrs`; no split justified.

## Open Questions
- Where do un-defer triggers get **logged** so they actually fire? (`docs/plan/nxtlvl-skill-intake-backlog.md`
  already exists — is that the ledger?)
- ~~Should `writing-design-docs` be **one skill or two**?~~ **Resolved:** one skill — `show-me` —
  two internal phases (spec → plan).
