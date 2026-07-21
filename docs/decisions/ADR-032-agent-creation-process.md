---
id: ADR-032
title: "Agent creation process — how nxtlvl agents are defined and wired"
status: Draft
date: 2026-07-20
---

# ADR-032: Agent creation process — how nxtlvl agents are defined and wired

## Context

Agents are a distinct Claude Code primitive from skills. How agents are **created** — file
shape, role/tools/output contract, how they point at skills, when skills load into an agent
context, orchestration vs specialist spawn — must be decided separately from skill design so
each domain can evolve without rewriting the other.

Skill design and canonical format live only in
[ADR-030](ADR-030-skill-design-and-canonical-format.md). Domain grain:
[ADR-029](ADR-029-atomic-adrs-one-decision-each.md). Related boundary questions may also
appear on [ADR-012](ADR-012-agent-design-contract.md) until that Draft is folded or narrowed
into this domain ADR.

Build context: [ADR-003](ADR-003-build-from-scratch.md). Lab-repo parallel:
`../nxtlvl-lab/docs/decisions/ADR-041-agent-creation-process.md`.

## Decision

> **Pending as a whole.** This file is the **only** home for agent-creation decisions.
> Answers are recorded as Decision subsections here when chosen — not as new micro-ADRs.

### Scope (what belongs here)

| Topic | Status |
|---|---|
| Agent markdown file structure (role, tools, output contract, skill pointers) | Open |
| Agent creation / authoring process (how a new agent is designed and shipped) | Open |
| When an agent loads skills (load rule from the agent side) | Open |
| Orchestrator vs specialist agent shape (if not owned solely by ADR-012/016) | Open |
| Eval or graduation criteria specific to agents | Open |

### Out of scope (other ADRs)

- Skill `SKILL.md` format, markup, skill body anatomy → [ADR-030](ADR-030-skill-design-and-canonical-format.md)
- Orchestration model broadly → [ADR-016](ADR-016-orchestration-model.md)
- Audit/promotion gate → [ADR-014](ADR-014-audit-gate.md)

## Alternatives Considered

### Keep agent creation inside a joint skill+agent authoring ADR

- Rejected: mixes two domains; see ADR-029 and the skill/agent split.

### Micro-ADRs for agent file vs load rule vs creation workflow

- Rejected: same over-split corrected for skills; agent creation is one domain.

## Consequences

- New agent work cites and amends **this ADR**.
- Skill format changes never land here — [ADR-030](ADR-030-skill-design-and-canonical-format.md).
- Supersedes the Draft stub framing of agent-file-only and the agent-side load-rule stub
  [ADR-033](ADR-033-agent-skill-load-rule.md).
