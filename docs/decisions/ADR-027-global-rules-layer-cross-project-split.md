---
id: ADR-027
title: "Global rules layer scoped to cross-project conventions, activated only via CLAUDE.md trigger wiring"
status: Accepted
date: 2026-07-01
---

# ADR-027: Global rules layer scoped to cross-project conventions, activated only via CLAUDE.md trigger wiring

## Context

The global rules directory (`~/.claude/rules/`, physically `config/claude/rules/` in this repo)
held exactly one file, `decisions.md`, before this decision. Every other harness convention lived
either in an ADR under `docs/decisions/` or in the repo-level `CLAUDE.md` — neither of which a
session reads unless a user or agent explicitly opens it. The goal was to make the most
load-bearing conventions **ambient** (loaded automatically, always-on) without restating ADR
bodies or bloating every session's context window regardless of repo.

A first draft proposed 8 new global rule files, one per convention. `nxtlvl:doubt-driven-development`
review (2 cycles; the design's review-history note lives at
`docs/superpowers/specs/2026-06-30-nxtlvl-rules-design.md:6`) found this draft conflated two
different things: conventions that generalize to *any* Claude Code session, and mechanics specific
to *building nxtlvl itself* (sandbox scaffolding, skill/agent authoring order, the promotion/audit
gate, the wiki-coverage check). Loading the latter ambiently in an unrelated repo would misfire or
sit as inert noise — the session would carry nxtlvl-specific instructions it can never act on.
Cycle 1 also found no wiring mechanism was specified: a file merely existing under `rules/` does
not make Claude read it. Cycle 2 caught follow-on issues in the fix itself (ADR-017
mischaracterized as an empty `Pending` placeholder when its `## Decision` is fully written;
ADR-012/013 left uncaveated in new `CLAUDE.md` prose; `memory.md` silently conflating ADR-007's and
ADR-008's distinct scopes) — see the spec's review-history note for the full list.

The load-bearing questions this ADR records: (1) what belongs in the global cross-project layer
versus the project-level layer, and (2) what makes a rule file ambient rather than inert. Both
are structural (they define a durable boundary future rule files must respect) and expensive to
reverse (getting the split wrong either pollutes every other repo's context or silently fails to
surface a convention that should be ambient) — the ADR-worthy bar per
`~/.claude/rules/decisions.md` §1.

## Decision

**Two decisions, both implemented and live as of commit `b6242d2`:**

### 1. The global/project layering split

`config/claude/rules/` (symlinked live as `~/.claude/rules/`) carries **only** conventions that
are genuinely cross-project — general Claude Code engineering practice, not nxtlvl-build-specific.
Four files, unchanged in scope from what shipped:

| File | Governs |
|---|---|
| `config/claude/rules/decisions.md` | When an ADR is required and the decision pipeline (pre-existing) |
| `config/claude/rules/memory.md` | Context assembly — what belongs in `CLAUDE.md` vs. memory vs. per-session hook injection; the token-budget test (pointer over content) |
| `config/claude/rules/hooks.md` | Hook safety contract — fail-open as default, blocking gates as rare whitelisted exceptions |
| `config/claude/rules/git-workflow.md` | Commit/PR conventions — Conventional Commits, draft-PR-first, no AI attribution |

nxtlvl-build-specific conventions — skill/agent authoring order, the promotion/audit gate, the
periodic `nxtlvl` vs. `nxtlvl-wiki` coverage check — stay as prose in the project-root `CLAUDE.md`
(`CLAUDE.md:33-46` in this repo) instead of becoming global rule files. They name nxtlvl-specific
skills, agents, and a not-yet-built gate (`nxtlvl:audit`) that don't exist and wouldn't resolve in
another repo.

### 2. The wiring convention

A rule file under `config/claude/rules/` is **inert** unless the always-loaded
`config/claude/CLAUDE.md` carries a matching `## <Topic>` trigger section naming the in-session
condition under which to read it — mirroring the pre-existing `## Decisions` section that already
governed `decisions.md`. This shipped as three new sections (`## Context assembly`,
`## Hooks`, `## Git workflow`) in `config/claude/CLAUDE.md`, each one sentence stating the trigger
condition and a "just proceed" carve-out for the common case that doesn't need the rule. File
existence under `rules/` alone does not make a convention ambient — only the trigger does.

Both parts are recorded as one ADR because they're inseparable in practice: the split determines
*what* can safely go global, and the wiring is *how* anything that does go global actually reaches
a session. Neither is useful without the other.

## Alternatives Considered

### All-global, no split
- Pros: simplest mental model — every convention is one file under `rules/`, no project-vs-global
  judgment call per file.
- Cons: several of the originally-proposed 8 files (sandbox scaffolding, the audit gate,
  skill-authoring order, the coverage check) are nxtlvl-build-specific; loaded ambiently in an
  unrelated repo they'd either misfire (naming skills/gates that don't exist there) or sit as inert
  noise consuming context budget for no benefit.
- Rejected during doubt-review cycle 1, once the draft's 8-file list was examined file-by-file
  against "would this make sense loaded into an arbitrary other repo."

### One large monolithic rule file
- Pros: one file to maintain instead of four.
- Cons: hard to keep thin — a single file covering decisions, memory, hooks, and git workflow
  would either restate ADR bodies (defeating the pointer-not-restatement design) or become a long
  document loaded into every session regardless of which single convention is actually relevant
  right now.
- Rejected: domain-scoped files let a session's trigger match load only the relevant rule, not the
  whole set.

### Layered global + project rules — Adopted
- Pros: global rules stay small and genuinely portable across repos; nxtlvl-build-specific
  mechanics get a home (project `CLAUDE.md`) without inventing new machinery, since Claude Code
  already loads project `CLAUDE.md` last and it already wins on conflict.
- Cons: two places to look (global rules, project `CLAUDE.md`) instead of one; requires an explicit
  per-file judgment call ("does this generalize?") that a flat single-tier design wouldn't need.
- Adopted: the first draft had this as "Deferred"; doubt-review cycle 1 surfaced a concrete need
  (the 4 nxtlvl-build-specific files) that made the layering necessary rather than optional, and no
  new mechanism was required to implement it.

## Consequences

- `config/claude/rules/` is now the canonical always-on layer for genuinely cross-project
  conventions only — 4 files, not the originally-drafted 8. The project-root `CLAUDE.md` does
  *not* shrink over time the way the first draft assumed; it keeps, and will likely grow, the
  sandbox/audit/skill-authoring/coverage material.
- **Where the rule points at content is honestly mixed, and this ADR does not settle that
  content.** `memory.md` and `hooks.md` point at `docs/intent/personal-harness.md` as the current
  *provisional* source because their formal ADRs — ADR-007 (memory architecture), ADR-008 (context
  assembly), ADR-010 (hook layer contract) — are `status: Draft` with an explicit `Pending`
  placeholder in `## Decision` (no content decided yet). `git-workflow.md` points at the
  `nxtlvl:github-workflow` skill as the built, working source and at ADR-017 (git-workflows
  domain) as the formal record; ADR-017's `## Decision` is fully written, but its frontmatter
  `status` has not yet been bumped from `Draft` to `Accepted`. This ADR decides only the layering
  and wiring of the rules layer itself — it does not decide, accept, or otherwise resolve ADR-007,
  ADR-008, ADR-010, or ADR-017. When any of those is accepted, the corresponding rule file's
  pointer should be updated to cite it as settled rather than provisional (Success Criterion 3 in
  the spec anticipates this as a pointer edit, not a rewrite).
- The project-root `CLAUDE.md`'s retained "coverage check" convention points at
  [ADR-002](ADR-002-reference-corpus-nxtlvl-wiki.md) (`nxtlvl-wiki` as the sole reference corpus,
  Accepted) — the one settled ADR among those this decision's implementation touches. That
  convention (periodically comparing the harness against the `nxtlvl-wiki` production bar) stays
  project-level for the same reason as the other three retained items: it only makes sense while
  working on nxtlvl itself, not in an arbitrary other repo.
- New decided/drafted domains without a rule file today (ADR-015 scope/extension gate, ADR-016
  orchestration model, ADR-020 router, ADR-024/025 sourcing doctrine) will likely need *new* rule
  files as they mature into ambient, cross-project-relevant conventions — a restructuring event,
  not a failure of this design (spec Success Criterion 3).
- No rule introduces a session hook, blocking gate, or secret handling — all four global rules
  remain advisory-only, consistent with `decisions.md`'s existing "advisory only" enforcement tier
  (`~/.claude/rules/decisions.md` §5).
- Realized as: `config/claude/rules/memory.md`, `config/claude/rules/hooks.md`,
  `config/claude/rules/git-workflow.md` (new); three new trigger sections in
  `config/claude/CLAUDE.md`; a new "nxtlvl-build conventions" section in the project-root
  `CLAUDE.md`. Shipped in commit `b6242d2` ("feat(rules): expand global rules layer per
  doubt-reviewed design"), implementing
  `docs/superpowers/specs/2026-06-30-nxtlvl-rules-design.md`.
- Cross-links: [ADR-002](ADR-002-reference-corpus-nxtlvl-wiki.md) (the one Accepted ADR the
  retained project-level `CLAUDE.md` content points at); ADR-007, ADR-008, ADR-010, ADR-017
  (provisional sources this ADR does not decide — see above).
