---
id: ADR-013
title: "Skill and agent authoring — decision map (skill vs agent)"
status: Accepted
date: 2026-06-28
updated: 2026-07-20
---

# ADR-013: Skill and agent authoring — decision map (skill vs agent)

## Context

Skill design and agent creation are related but **different domains**. This file is only a
navigation map. Domain grain: [ADR-029](ADR-029-atomic-adrs-one-decision-each.md).

## Decision

**Index only — decisions live in the domain ADRs below.**

| Domain | ADR | Status |
|---|---|---|
| Domain grain (how big an ADR is) | [ADR-029](ADR-029-atomic-adrs-one-decision-each.md) | Accepted |
| **Skill** design and canonical format | [ADR-030](ADR-030-skill-design-and-canonical-format.md) | Accepted (markup done; other skill open questions stay on that ADR) |
| **Agent** creation process | [ADR-032](ADR-032-agent-creation-process.md) | Draft |

Do not add skill or agent decision bodies here. Amend ADR-030 or ADR-032 instead.

### Historical note

This file was briefly a multi-question bucket, then an over-split map of micro-ADRs
(031–034). Corrected to the two-domain split above; micro-stubs are Superseded.

## Alternatives Considered

See [ADR-029](ADR-029-atomic-adrs-one-decision-each.md).

## Consequences

- Link **ADR-030** for skills, **ADR-032** for agents.
- ADR-012 may still discuss agent/skill **boundary** until narrowed; avoid duplicating skill
  format or agent creation process outside those domain ADRs.
