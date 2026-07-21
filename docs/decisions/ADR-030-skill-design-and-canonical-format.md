---
id: ADR-030
title: "Skill design and canonical format — one home for how nxtlvl skills are written"
status: Accepted
date: 2026-07-20
---

# ADR-030: Skill design and canonical format — one home for how nxtlvl skills are written

## Context

Skills (`SKILL.md` and their bundles) are a core Claude Code primitive. How they are
designed and what the **canonical file format** is must be stable across the harness library:
markup, frontmatter, body structure, progressive disclosure, and authoring discipline all
shape every skill. Spreading those choices across many micro-ADRs makes the skill contract
hard to find and re-litigates the same domain.

[ADR-029](ADR-029-atomic-adrs-one-decision-each.md) places **skill design** and **agent
creation** in separate ADRs. This record is the **skill** side only. Agent creation lives in
[ADR-032](ADR-032-agent-creation-process.md). The former multi-topic bucket
[ADR-013](ADR-013-skill-agent-authoring-model.md) is a map pointing here and at ADR-032.

Build context: [ADR-003](ADR-003-build-from-scratch.md). Lab-repo parallel (incubation /
skill-creator / scaffold): `../nxtlvl-lab/docs/decisions/ADR-040-skill-design-and-canonical-format.md`
— keep markup and domain scope aligned when either side amends.

## Decision

**All skill design and canonical format decisions for nxtlvl live in this ADR.** Open
sub-questions are amended here as they resolve; they do not get their own ADRs unless the
topic leaves the skill domain (e.g. agent creation → ADR-032).

### 1. Canonical unit

A skill is a directory with at least `SKILL.md` (YAML frontmatter + body), optionally
`scripts/`, `references/`, and `assets/`, aligned with the Agent Skills open layout unless
this ADR records a deliberate nxtlvl extension.

### 2. Markup (Accepted 2026-07-20)

**Skills are Markdown process documents.**

1. **Frontmatter — hard ban on angle brackets.** `name` and `description` must not contain
   `<` or `>`. Description is trigger/catalog prose only.
2. **Body — Markdown structure only.** Headings, lists, tables, checklists, fenced code,
   bold callout markers (e.g. `**REQUIRED SUB-SKILL:**`, `**HARD GATE:**`), and concrete
   Markdown output templates. No author-invented XML dialects in instruction prose.
3. **Closed exceptions only:**
   - Domain payload that *is* XML → only inside **fenced code blocks**.
   - Host / bootstrap **injector** wraps → injector/client layer only, not ordinary skill
     authoring.
   - A later **named harness meta-skill contract** may define a closed tag list in one place;
     never freeform per skill.
4. **HTML is out of the skill format.** Teaching labels in human documentation are not
   skill-body convention.

**One-line markup rule:** No angle brackets in frontmatter. No author-invented XML in the
body. XML only as fenced domain payload. Salience wrappers belong to the injector. No HTML.

### 3. Still open (record answers in this file when decided)

| Open question | Notes |
|---|---|
| Frontmatter field set beyond `name` / `description` | Host extensions (`disable-model-invocation`, etc.) |
| Required body section anatomy | House style vs open-spec minimum |
| Size / progressive-disclosure budgets | When to split to `references/` |
| Trigger-oriented description conventions | CSO / "Use when…" |
| Eval-first / pressure-test authoring discipline | How skills are proven before ship |
| Bundled scripts and assets conventions | When code beats prose |

## Alternatives Considered

### Separate micro-ADRs per skill subtopic (markup, anatomy, eval-first, …)

- Pros: fine-grained supersession.
- Cons: skill contract scatters; agents cannot load "the skill format" in one place.
- Rejected: skill design is one domain; see ADR-029 domain grain.

### One ADR bundling skill format **and** agent creation

- Pros: single authoring doc.
- Cons: conflates two primitives and two authoring processes; harder to evolve independently.
- Rejected: agent creation is [ADR-032](ADR-032-agent-creation-process.md).

### Free XML / HTML in skill bodies

- Pros: familiar prompt-engineering tags; some tutorial HTML comments.
- Cons: no open-spec tag schema; drift; host-wrap collision; HTML in docs is pedagogy only.
- Rejected for markup (see Decision §2).

## Consequences

- New skill work cites **ADR-030** for format and design; amend this file when a skill-domain
  open question resolves.
- Lint (when wired) enforces §2 markup; further gates follow sections added here.
- Agent creation, agent file shape, and agent–skill **load from the agent side** are **not**
  decided here — [ADR-032](ADR-032-agent-creation-process.md).
- Supersedes the short-lived markup-only framing of this number and the Draft stubs
  [ADR-031](ADR-031-skill-file-contents-and-section-anatomy.md),
  [ADR-034](ADR-034-eval-first-skill-authoring.md) (skill-side topics fold here).
