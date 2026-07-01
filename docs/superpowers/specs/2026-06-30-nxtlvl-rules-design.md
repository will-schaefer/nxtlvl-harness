# Design: nxtlvl `.claude/rules` expansion

**Date:** 2026-06-30  
**Status:** Implemented 2026-07-01 — survived 2 doubt-review cycles (`nxtlvl:doubt-driven-development`); rule files + `CLAUDE.md` wiring landed

**Review history:** Cycle 1 (fresh-context adversarial review) found 3 blockers and 4 majors: several cited ADRs were `Draft`/`Pending` (not settled content), `nxtlvl:audit` doesn't exist yet, no wiring mechanism was specified for ambient loading, and 4 of the original 8 rule files described nxtlvl-build-specific mechanics that don't generalize across repos. Cycle 1's fix narrowed the global set to 4 files, moved the rest to the project `CLAUDE.md`, added the wiring step, and pointed at current provisional sources instead of undecided ADRs. Cycle 2 caught 3 fresh-but-contained issues in that fix (ADR-017 mischaracterized as empty-Pending when its Decision is fully written; ADR-012/013 left uncaveated in the new CLAUDE.md prose unlike its sibling bullet; `memory.md` silently conflating ADR-007 and ADR-008's distinct scopes) plus 2 minor items (a stray cross-reference, an ADR-worthiness call deliberately left to the plan step) — all now fixed except the deliberate one.

## Context

`nxtlvl` is a personal Claude Code harness built to be the daily production engine. Today the global rules directory (`~/.claude/rules`, physically `config/claude/rules/` in this repo) contains only one rule file: `decisions.md`. The rest of the harness conventions live in ADRs under `docs/decisions/` and in the repo-level `CLAUDE.md`.

Those conventions are not always visible to a Claude session unless the user or an agent explicitly reads the ADRs. The goal is to make the most load-bearing harness conventions **ambient** — loaded automatically as always-on rules — without restating the ADRs or bloating the context window.

## Decision

Expand the global rules directory `config/claude/rules/` with a small set of thin, domain-specific rule files — but only for conventions that are genuinely cross-project (general Claude Code engineering practice, not nxtlvl-build-specific). Each rule is a **pointer** to the canonical ADR or skill — or, where the ADR is still `Draft`/`Pending`, to the current provisional source in `docs/intent/personal-harness.md`, explicitly marked provisional. The existing repo-level `CLAUDE.md` keeps the project anchor; nxtlvl-build-specific conventions (scaffolding, skill authoring, the audit gate, wiki-coverage checks) stay there as prose, not as separate global rule files — see "What stays in repo-level `CLAUDE.md`" below, which resolves what was Open Question 1 in the first draft.

Rules are **advisory only**. They never introduce session hooks or blocking behavior. Enforcement is intended to eventually live in the `nxtlvl:audit` gate — but that gate does not exist yet (ADR-014 is `Draft`/`Pending`; no skill, agent, or command named `audit` exists anywhere in `plugins/nxtlvl/`). Until it ships, these rules have **no enforcement backstop** — pure advisory — and any rule referencing "the audit" must say so explicitly.

**Wiring:** the existing `decisions.md` isn't ambient just by sitting in `config/claude/rules/` — it works because `config/claude/CLAUDE.md` (the always-loaded global file) carries one explicit trigger section, `## Decisions`, telling a session when to go read it. Every new global rule file needs the same: one new `## <Topic>` section added to `config/claude/CLAUDE.md`, mirroring that pattern. A rule file with no corresponding trigger section in `CLAUDE.md` is inert.

## Rule files to add (global — `config/claude/rules/`)

Only conventions that are genuinely cross-project belong here. nxtlvl-build-specific mechanics
(sandbox scaffolding, skill authoring, the audit gate, wiki-coverage checks) are **not** in this
table — see "What stays in repo-level `CLAUDE.md`" below.

| File | Governs | Points to |
|---|---|---|
| `decisions.md` | *(already exists)* When an ADR is required and the decision pipeline | `docs/decisions/`, `nxtlvl:documentation-and-adrs` |
| `memory.md` | Scope: context assembly policy — `CLAUDE.md` vs memory vs per-session hooks | `docs/intent/personal-harness.md` §"Context assembly = a budgeted injection policy" (current source — this is `ADR-008`'s domain specifically; `ADR-007` covers the separate memory-store/ownership decision. Both `Draft`/`Pending`; if their eventual decisions don't share one file cleanly, `memory.md` may need to split once decided) |
| `hooks.md` | Scope: the hook safety contract | `docs/intent/personal-harness.md` §"Hook safety (highest-severity failure mode)" (current source; `ADR-010` is `Draft`/`Pending` — will supersede once decided) |
| `git-workflow.md` | Scope: commit/PR conventions — Conventional Commits, draft-PR-first, no attribution | `nxtlvl:github-workflow` skill (current, already-built source); `ADR-017` (formal record — its `## Decision` section is fully written, unlike ADR-007/008/010/012/013/014's empty `Pending` placeholders; only the frontmatter `status` hasn't been bumped from `Draft` to `Accepted` yet) |

Each rule file gets one matching `## <Topic>` trigger section added to `config/claude/CLAUDE.md`
(see "Wiring" above) — that's what makes it ambient, not the file's mere existence.

## Rule file format

Each rule file is a short Markdown document:

1. **Scope sentence** — one line stating what the rule governs.
2. **Pointer sections** — “For X, see Y” — links to the ADR, skill, or intent section that owns the full rationale.
3. **Actionable triggers** — 1–2 in-session cues: e.g., “If a hook you're writing can throw, make sure the failure mode is fail-open.”
4. **No restatement** — the rule does not duplicate the ADR body. If the ADR changes, the rule should still be valid.

## What stays in repo-level `CLAUDE.md`

The existing `CLAUDE.md` at the repo root keeps the nxtlvl workbench anchor **and** the
nxtlvl-build-specific conventions that don't generalize to other repos:

- Build-from-scratch method and `nxtlvl-wiki` reference standard.
- `sandbox/` staging and promotion mechanics.
- ADR lifecycle and keep-never-delete policy.
- Skill/agent authoring workflow (`nxtlvl:brainstorming` before code, spec, review before merge) — proposed as a global `skill-authoring.md` in the first draft; kept here because it names nxtlvl-specific skills that don't exist in other repos. `ADR-012`/`ADR-013` (the formal agent-design-contract and authoring-model decisions) are both `Draft`/`Pending` — this bullet describes current provisional practice, not a recorded decision.
- The promotion/audit gate (`nxtlvl:audit`, not yet built — `ADR-014` is `Draft`/`Pending`) and its rollback-via-git-tag convention — proposed as global `audit.md`; kept here for the same reason, and flagged **aspirational** until the gate ships.
- The periodic `nxtlvl` vs. `nxtlvl-wiki` coverage check — proposed as global `coverage.md`; kept here since it only makes sense while working on nxtlvl itself.
- Reference to the global rules for the cross-project conventions.

It is the **project-specific override layer** — and, after this revision, also the home for
nxtlvl-build-specific *conventions*, not just project-specific *overrides* of global ones. The
global rules are the **cross-project ambient layer**, scoped to general Claude Code engineering
practice only (`decisions.md`, `memory.md`, `hooks.md`, `git-workflow.md`).

## Success criteria

1. A Claude session in any repo loads the **genuinely cross-project** rules and knows the relevant conventions without the user explicitly opening the nxtlvl repo — achieved via one new `## <Topic>` trigger section per rule file added to `config/claude/CLAUDE.md`, mirroring the existing `## Decisions` section (not by the file merely existing under `config/claude/rules/`).
2. Each rule is thin enough that it does not restate ADRs or consume excessive context budget.
3. Within an existing rule file's domain, new ADRs are reflected by updating pointers, not rewriting rules. A genuinely new domain (several already exist — `ADR-015`/`016`/`020`/`024`/`025` have no rule file today) requires a new rule file; that's expected restructuring as nxtlvl grows, not a failure of this design.
4. No rule introduces a session hook, blocking gate, or secret handling.
5. nxtlvl-build-specific conventions (scaffolding, skill authoring, promotion gates, wiki-coverage checks) are documented in the project `CLAUDE.md`, not loaded ambiently into unrelated repos.

## Open questions

1. ~~Should any of these rules be project-level...~~ **Resolved** during doubt-review cycle 1 — see "What stays in repo-level `CLAUDE.md`" above. nxtlvl-build-specific conventions live there as prose; only genuinely cross-project conventions get a global rule file.
2. Should the project-level coverage-check convention include a concrete cadence (e.g., weekly, per-promotion) or stay deliberately vague?
3. Should the global rules include a `meta.md` file explaining why only 4 files are global versus the nxtlvl-build-specific conventions kept in `CLAUDE.md`?

## Alternatives considered

- **All-global, no split** — Rejected (revised after doubt-review cycle 1): several originally-proposed rule files (sandbox, audit, skill-authoring, coverage) are nxtlvl-build-specific and would misfire or sit as inert noise when loaded ambiently in an unrelated repo; see "What stays in repo-level `CLAUDE.md`" above.
- **One large monolithic rule** — Rejected because it would be hard to maintain and would duplicate ADRs.
- **Layered global + project rules** — **Adopted** (was "Deferred" in the first draft; doubt-review cycle 1 surfaced a concrete need). Global rules are general Claude Code engineering practice (`decisions.md`, `memory.md`, `hooks.md`, `git-workflow.md`); project-level conventions are nxtlvl-build-specific mechanics, kept as `CLAUDE.md` prose — no new mechanism needed since Claude Code already loads project `CLAUDE.md` last.

## Consequences

- `config/claude/rules/` becomes the canonical always-on guidance layer for **genuinely cross-project** conventions only (4 files, not 8); nxtlvl-build-specific conventions stay in the project `CLAUDE.md`, which does *not* shrink over time the way the first draft assumed — it keeps (and likely grows) the sandbox/audit/skill-authoring/coverage material.
- ADRs remain the canonical decision records; rules are only a lightweight pointer layer. Where an ADR is still `Draft`/`Pending`, the rule points at the current provisional source (`docs/intent/personal-harness.md` or an existing skill) and notes the ADR as the future canonical source — never at settled content that doesn't exist yet.
- 4 rule files map to 4 of nxtlvl's 25 existing ADRs; other decided/drafted domains (`ADR-015` scope/extension gate, `ADR-016` orchestration model, `ADR-020` router, `ADR-024`/`025` sourcing doctrine) have no rule file yet. New domains will likely need *new* rule files (a restructuring event), not just pointer edits within existing ones — Success Criterion 3 is written to expect this.
- The next build step after this spec is a concrete implementation plan; per `~/.claude/rules/decisions.md` §1, the plan step should include an explicit ADR-worthiness check on the global/project split decided here before implementation — not because it's certain to clear the bar (rules are advisory-only and cheaply reversible), but because the check itself is cheap and the call is close.
