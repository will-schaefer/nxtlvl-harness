# Design: nxtlvl `.claude/rules` expansion

**Date:** 2026-06-30  
**Status:** Draft — pending review

## Context

`nxtlvl` is a personal Claude Code harness built to be the daily production engine. Today the global rules directory (`~/.claude/rules`, physically `config/claude/rules/` in this repo) contains only one rule file: `decisions.md`. The rest of the harness conventions live in ADRs under `docs/decisions/` and in the repo-level `CLAUDE.md`.

Those conventions are not always visible to a Claude session unless the user or an agent explicitly reads the ADRs. The goal is to make the most load-bearing harness conventions **ambient** — loaded automatically as always-on rules — without restating the ADRs or bloating the context window.

## Decision

Expand the global rules directory `config/claude/rules/` with a small set of thin, domain-specific rule files. Each rule is a **pointer** to the canonical ADR or skill, not a replacement. The existing repo-level `CLAUDE.md` keeps the project anchor and references the global rules.

Rules are **advisory only**. They never introduce session hooks or blocking behavior; enforcement stays in the invoked `nxtlvl:audit` gate.

## Rule files to add

| File | Governs | Points to |
|---|---|---|
| `decisions.md` | *(already exists)* When an ADR is required and the decision pipeline | `docs/decisions/`, `nxtlvl:documentation-and-adrs` |
| `memory.md` | Context assembly policy — `CLAUDE.md` vs memory vs per-session hooks | `ADR-007`, `ADR-008`, `docs/intent/personal-harness.md` §Context assembly |
| `hooks.md` | Hook safety contract — fail-open, exit codes, kill switches, whitelisted gates | `ADR-010`, `docs/intent/personal-harness.md` §Hook safety |
| `audit.md` | Promotion gate — when to run `nxtlvl:audit`, what it blocks, rollback via git tag | `ADR-014`, `docs/intent/personal-harness.md` §The audit / Dev/prod separation |
| `sandbox.md` | Scaffolding discipline — new items start in `sandbox/`, promoted with `git mv` | `sandbox/README.md`, `docs/intent/personal-harness.md` §Growth |
| `git-workflow.md` | Commit/PR conventions — Conventional Commits, draft-PR-first, no attribution | `ADR-017` |
| `skill-authoring.md` | How to author skills and agents — use `/nxtlvl:brainstorming` before code, write specs, review before merge | `ADR-012`, `ADR-013`, `nxtlvl:brainstorming`, `nxtlvl:review` |
| `coverage.md` | Periodic coverage check — compare `nxtlvl` against `nxtlvl-wiki` production bar | `ADR-002`, `docs/intent/personal-harness.md` §Success |

## Rule file format

Each rule file is a short Markdown document:

1. **Scope sentence** — one line stating what the rule governs.
2. **Pointer sections** — “For X, see Y” — links to the ADR, skill, or intent section that owns the full rationale.
3. **Actionable triggers** — 1–2 in-session cues: e.g., “If you are about to add a new skill, scaffold it in `sandbox/` first.”
4. **No restatement** — the rule does not duplicate the ADR body. If the ADR changes, the rule should still be valid.

## What stays in repo-level `CLAUDE.md`

The existing `CLAUDE.md` at the repo root keeps the nxtlvl workbench anchor:

- Build-from-scratch method and `nxtlvl-wiki` reference standard.
- `sandbox/` staging and promotion mechanics.
- ADR lifecycle and keep-never-delete policy.
- Reference to the global rules for the full conventions.

It is the **project-specific override layer**. The global rules are the **cross-project ambient layer**.

## Success criteria

1. A Claude session in any repo loads the rules and knows the nxtlvl conventions without the user explicitly opening the nxtlvl repo.
2. Each rule is thin enough that it does not restate ADRs or consume excessive context budget.
3. The rules remain stable for 6–12 months of nxtlvl growth; new ADRs are reflected by updating pointers, not rewriting rules.
4. No rule introduces a session hook, blocking gate, or secret handling.

## Open questions

1. Should any of these rules be project-level (inside the nxtlvl repo’s `.claude/rules/` instead of global)?
2. Should `coverage.md` include a concrete cadence (e.g., weekly, per-promotion) or stay deliberately vague?
3. Should the rules include a `meta.md` file explaining the rules architecture itself?

## Alternatives considered

- **Project-level `.claude/rules/`** — Rejected because nxtlvl conventions are meant to be the daily-driver harness across all repos, not just this one.
- **One large monolithic rule** — Rejected because it would be hard to maintain and would duplicate ADRs.
- **Layered global + project rules** — Deferred; can be adopted later if a real need for project-specific overrides emerges.

## Consequences

- `config/claude/rules/` becomes the canonical always-on guidance layer for the harness.
- ADRs remain the canonical decision records; rules are only a lightweight pointer layer.
- The repo-level `CLAUDE.md` becomes shorter and more focused over time as conventions migrate to global rules.
- The next build step after this spec is a concrete implementation plan, then creating the rule files.
