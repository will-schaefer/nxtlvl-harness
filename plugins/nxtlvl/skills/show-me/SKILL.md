---
name: show-me
description: nxtlvl show-me — write specs and plans with mandatory structural visuals for a visual learner. Use when capturing an approved design as a spec in docs/spec/, breaking a spec into an ordered plan in docs/plan/, revising either, or authoring any design-layer doc (intent links, architecture, proposals). Use even when the user only says "write the spec", "make a plan", or "/show-me" — visuals are part of the house format, not optional garnish. Composes with documentation-and-adrs for ADRs and the visual-docs rule for diagram discipline.
---

# show-me (nxtlvl)

Slash entry: `/show-me` (`plugins/nxtlvl/commands/show-me.md`). Owns the **design layer** — the
written artifacts agents build *to* before implementation:

| Doc type | Home | This skill |
|---|---|---|
| Intent | `docs/intent/` | link up from specs; don't duplicate intent prose |
| Spec | `docs/spec/` | **author** — the verified contract |
| Plan | `docs/plan/` | **author** — sequencing and tasks |
| Diagram | `docs/diagrams/` | **author** standalone visuals; link from parent docs |
| Decision | `docs/decisions/` | → `◆ documentation-and-adrs` (not this skill) |

Self-contained. Replaces the interim upstream `spec-driven-development` and
`planning-and-task-breakdown` pointers in the router — one nxtlvl skill, two phases, one visual
standard.

## When to use

- An approved design needs a written contract → **spec phase**
- A spec exists and needs ordered, verifiable tasks → **plan phase**
- Materially revising an existing spec or plan
- Authoring or revising a design-layer doc in `docs/superpowers/specs/` or equivalent

**When NOT to use:** recording an ADR (`◆ documentation-and-adrs`); throwaway notes; pure
implementation with an unchanged contract.

## Cross-cutting rules (compose, don't restate)

- **Visual-docs rule** — `~/.claude/rules/visual-docs.md`: at least one structural visual per
  design doc; mermaid preferred in markdown; `docs/diagrams/` for durable interactive artifacts.
- **Decision rule** — `~/.claude/rules/decisions.md`: facts → spec; sequencing → plan;
  architectural + expensive-to-reverse → ADR via `◆ documentation-and-adrs`.
- **Pointers over content** — link `docs/intent/`, related specs/plans, and `docs/diagrams/`
  artifacts; don't paste large blocks.

## Phase 1 — Spec (`docs/spec/`)

**Input:** an approved design (typically from `◆ brainstorming`). **Output:** one spec file the
agent can build to.

### Header block (house format)

```markdown
# Spec: [Name]

> Status: **Draft for review** | **FINAL** | …
> Date: YYYY-MM-DD
> Anchor intent: [`docs/intent/…`](…)
> Related: [ADR-NNN](…), prior specs — as needed
```

Add **Assumptions** when anything is unresolved but you're proceeding anyway.

### Body sections

1. **Objective** — what, why, who consumes it, testable success criteria
2. **Scope / boundaries** — in-scope, out-of-scope, non-goals
3. **Architecture** — **required visual**: mermaid diagram (component boundaries, data flow, or
   lifecycle). ASCII only for trivial one-way flows.
4. **Interfaces & contracts** — APIs, file shapes, seam contracts — tables welcome
5. **Constraints & decisions already locked** — pointer to ADRs, not re-litigation
6. **Verification** — how an agent proves the build matches the spec

### Spec checklist

- [ ] Links up to intent (or states greenfield)
- [ ] At least one mermaid (or justified ASCII) architecture/flow diagram
- [ ] Success criteria are testable, not vibes
- [ ] Facts live here; ADR-worthy choices routed to `◆ documentation-and-adrs`

## Phase 2 — Plan (`docs/plan/`)

**Input:** a spec in `docs/spec/`. **Output:** one plan file — ordered tasks with acceptance
criteria. **Do not write code during planning.**

### Header block

```markdown
# Implementation Plan: [Name]

> Consumes [`docs/spec/…`](../spec/…)
> Status: **Draft for review** | …
> Date: YYYY-MM-DD
```

### Body sections

1. **Overview** — one paragraph: what the plan delivers against the spec
2. **Architecture decisions** — only what's needed for sequencing (pointer to spec for the rest)
3. **Dependency graph** — **required visual**: mermaid `flowchart` or `graph` (or ASCII for
   simple spines). Show task/order dependencies explicitly.
4. **Task list** — numbered, vertically sliced where possible

### Task shape

```markdown
## Task N: [Short title]

**Description:** One paragraph.

**Acceptance criteria:**
- [ ] Testable condition

**Verification:** commands or manual checks

**Dependencies:** Task M, or None

**Files likely touched:** pointers only
```

### Plan checklist

- [ ] Consumes link resolves to the spec
- [ ] Dependency graph is visual, not prose-only
- [ ] Tasks are small enough for one focused session each
- [ ] Each task leaves the system in a verifiable state (vertical slices preferred)

## Visuals — three tiers

| Tier | When | Where |
|---|---|---|
| **Inline mermaid** | Default for persisted specs/plans | In the `.md` file |
| **Session interactive** | Live layout/compare during authoring | `visualize` MCP per `◆ brainstorming` §"Showing, not just telling" |
| **Standalone artifact** | Rich/interactive, reused across docs | `docs/diagrams/<slug>.{md,html,svg}` — see `docs/diagrams/README.md` |

Link standalone artifacts from the parent doc:

```markdown
→ Diagram: [`docs/diagrams/provider-projector-flow.md`](../diagrams/provider-projector-flow.md)
```

## Pipeline position

```
◆ brainstorming (approved design)
    → ◆ show-me — spec phase → docs/spec/
    → (ADR if warranted) ◆ documentation-and-adrs
    → ◆ show-me — plan phase → docs/plan/   ← terminal for ideation
    → implement natively (or ◆ doubt-driven-development when stakes are high)
```

## Verification

- [ ] Spec or plan landed in the correct `docs/` home with the house header
- [ ] At least one structural visual present (mermaid preferred)
- [ ] Intent/spec links are pointers, not duplicated prose
- [ ] ADR-worthy decisions routed out of the spec body to `◆ documentation-and-adrs`