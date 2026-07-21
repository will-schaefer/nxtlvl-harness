---
id: ADR-029
title: "Domain-level ADRs — one major capability domain per ADR; not micro-slices"
status: Accepted
date: 2026-07-20
updated: 2026-07-20
---

# ADR-029: Domain-level ADRs — one major capability domain per ADR; not micro-slices

## Context

nxtlvl needs a grain for decision records that is citable without becoming unusable:

- **Too coarse:** one Draft bucket for "skill and agent authoring" mixes two primitives and
  muddies status when only one side is decided.
- **Too fine:** a separate ADR for every sub-question (markup vs section anatomy vs
  eval-first vs load rule) scatters a single contract (e.g. "how skills are written") across
  many files.

The intended split for authoring is: **skill design/canonical format** in one ADR, **agent
creation process** in another — not one ADR per every skill sub-detail.

## Decision

**1. Domain grain.** Each ADR covers **one major capability domain** (or one hard
cross-cutting constraint that stands alone). Examples of the right size:

- Skill design and canonical format → [ADR-030](ADR-030-skill-design-and-canonical-format.md)
- Agent creation process → [ADR-032](ADR-032-agent-creation-process.md)
- Hook layer contract, memory architecture, audit gate — each their own domain when decided

**2. Fold related open questions into the domain ADR.** Sub-questions of the same domain
(e.g. skill markup, section anatomy, skill eval discipline) are **sections of that domain
ADR**, amended as they resolve. They do **not** each get a new number.

**3. Split when domains differ.** Write a new ADR when the topic is a different domain
(skill vs agent creation, hooks vs skills, etc.), not when you answer the next bullet inside
an open table on the same domain ADR.

**4. Maps optional.** A short map ADR may index related domain ADRs (e.g.
[ADR-013](ADR-013-skill-agent-authoring-model.md)). Maps do not bulk-decide.

**5. Still ADR-worthy only.** Architectural **and** expensive to reverse. Specs hold facts;
plans hold sequencing; everyday reversible choices need no ADR.

**6. Global rule.** `~/.claude/rules/decisions.md` §1 uses this domain grain: prefer amending
the domain ADR for related questions; new ADR when the domain is different.

## Alternatives Considered

### One ADR per every sub-question (micro-atoms)

- Pros: maximum supersession precision.
- Cons: scatters one contract; status noise; empty stubs.
- Rejected: over-split skill design into 031/033/034 style atoms (corrected by folding into
  ADR-030 / ADR-032).

### One mega-ADR for all harness authoring forever

- Pros: one file.
- Cons: skill and agent processes evolve separately; status and ownership blur.
- Rejected: skill vs agent creation are separate domains.

### Multi-question buckets with "partial Accepted" subsections only

- Pros: fewer files than micro-atoms.
- Cons: still confuses "is skill format decided?" with "is agent creation decided?"
- Rejected in favor of domain ADRs with internal open-question tables.

## Consequences

- Skill work → amend [ADR-030](ADR-030-skill-design-and-canonical-format.md).
- Agent creation work → amend [ADR-032](ADR-032-agent-creation-process.md).
- Do not open a new ADR for the next skill-format bullet unless it leaves the skill domain.
- Supersedes the earlier reading of this ADR as "one micro-decision per file."
