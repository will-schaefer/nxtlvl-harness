# Handoff: nxtlvl skill naming — the `/show-me` voice

> **Status:** Brainstorm input — nothing here is approved except the one rename already shipped.
> **Date:** 2026-07-03
> **For:** a fresh session to debate naming style across the harness skill set.
> **Shipped already:** `design-layer-authoring` → **`show-me`** (spec + plan + mandatory visuals).

## Why this doc exists

The author is a **visual learner**. Skill names should feel like a conversation with the harness —
imperative, directed at the user (`me`), outcome = **visible understanding** — not internal
taxonomy (`design-layer-authoring`, `documentation-and-adrs`).

`show-me` is the anchor. This handoff captures the **proposed rename bundle** discussed in the
prior session so the next brainstorm can approve, reject, or remix — without re-deriving context.

## The voice (draft principles)

1. **Imperative verb** — `show-me`, not `visual-design-layer`
2. **Second person / `me`** — pairs with existing `interview-me`, `grill-me`
3. **Outcome-named** — the slash command states what you get, not the mechanism
4. **Short enough to say aloud** — target ≤3 syllables per word where possible
5. **Meta/infrastructure exempt** — `nxtlvl-router` can stay technical

## Already on-brand (no change proposed)

| Skill | Slash | Role |
|---|---|---|
| `interview-me` | `/interview-me` | Sharpen underspecified intent |
| `grill-me` | `/grill-me` | Stress-test a plan or design |

## Shipped rename (done — do not re-litigate unless reverting)

| Was | Now | Slash (proposed) | Role |
|---|---|---|---|
| `design-layer-authoring` | **`show-me`** | `/show-me` | Spec + plan + diagrams (`docs/spec/`, `docs/plan/`, `docs/diagrams/`) |

**Pointer:** `plugins/nxtlvl/skills/show-me/SKILL.md` · `plugins/nxtlvl/commands/show-me.md` · rule:
`~/.claude/rules/visual-docs.md`

## Proposed bundle — spine (high priority)

Candidates for a future rename pass. **Current names unchanged until approved.**

| Current skill | Proposed name | Proposed slash | One-line why |
|---|---|---|---|
| `brainstorming` | **`shape-it`** | `/shape-it` | Front door before `show-me`; shapes direction, doesn't dump a spec |
| `documentation-and-adrs` | **`tell-me-why`** | `/tell-me-why` | ADRs = the *why*; pairs with `show-me` (what/how) |
| `review` | **`check-me`** | `/check-me` | Pre-merge diff review; matches `grill-me` grammar |
| `github-workflow` | **`ship-it`** | `/ship-it` | Branch → PR → merge; action verb |

### Draft spine flow (if bundle adopted)

```
interview-me → grill-me → shape-it → show-me → [build] → check-me → ship-it
                                    ↘ tell-me-why (ADRs, anytime)
```

## Proposed bundle — build-method (`-driven-development` family)

Doctrinal names appear in ADRs; renaming costs doc churn. Defer unless the spine bundle feels right.

| Current skill | Proposed name | Proposed slash | Notes |
|---|---|---|---|
| `doubt-driven-development` | **`challenge-me`** | `/challenge-me` | Adversarial review before a decision stands |
| `source-driven-development` | **`show-me-the-docs`** | `/show-me-the-docs` | Context7 / official-docs grounding |
| `wiki-driven-development` | **`show-me-prior-art`** | `/show-me-prior-art` | nxtlvl-wiki orientation before build |

## Proposed bundle — utility / meta

| Current skill | Proposed name | Proposed slash | Recommendation |
|---|---|---|---|
| `pointer-summary` | **`point-me`** | `/point-me` | Near-synonym; tiny rename |
| `harness-review` | **`show-me-theirs`** | `/show-me-theirs` | External harness — distinct from `show-me` (ours) |
| `headless-doubt` | **`challenge-me-headless`** | — | Only if `challenge-me` ships; executor variant |
| `nxtlvl-router` | *(keep)* | — | Infrastructure; not user voice |
| `idea-refine` (‡ interim) | **`show-me-options`** | `/show-me-options` | Divergent variants before converge |

## Three naming families to debate (pick one direction)

### A. `me` family (recommended in prior session)

`interview-me` · `grill-me` · `shape-it` · `show-me` · `challenge-me` · `check-me` · `ship-it` · `tell-me-why`

### B. `show-me-*` prefixes (maximal visual brand)

`show-me-the-idea` · `show-me` · `show-me-the-docs` · `show-me-prior-art` · `show-me-theirs`

### C. Short imperatives (mixed)

`shape-it` · `show-me` · `tell-me-why` · `challenge-me` · `check-me` · `ship-it` · `point-me`

## Rare / distinctive options (from prior session — for remix, not default)

| Role | Rare name | Character |
|---|---|---|
| Spec/plan | `cartograph-me` | "Chart the territory" |
| Brainstorm | `make-it-legible` | Can you understand it by sight? |
| Harness review | `autopsy-it` | Open the other harness up |
| ADRs | `fossilize-why` | Preserved decision strata |
| Router | `which-me` | Probably too cute |

## Open questions for the brainstorm session

1. **Minimum viable bundle** — adopt spine only (`shape-it`, `tell-me-why`, `check-me`) or all at once?
2. **Slash = skill name?** — Should every skill get a matching `/command`? (`show-me` now has both;
   many others are still skill-only.)
3. **Aliases** — Keep `/brainstorm` as alias for `shape-it` during migration?
4. **ADR / doc churn** — Which `-driven-development` renames are worth the ADR reference updates?
5. **Labs plugin** — Does `nxtlvl-labs` mirror the same voice for its thin plugin skills (`new-cell`, `eval`, …)?
6. **Description field** — Pushy `USE THIS WHEN…` style vs. the new conversational names — align both?

## What not to do in the brainstorm

- Don't rename anything until the bundle (or subset) is explicitly approved.
- Don't split `show-me` back into separate spec/plan skills — the pipeline argument already settled one skill, two phases.
- Don't rename `nxtlvl-router` for voice; it's the discovery layer, not a user verb.

## Pointers for the next session

- Current skill inventory: `plugins/nxtlvl/skills/*/SKILL.md` (12 skills)
- Router map: `plugins/nxtlvl/skills/nxtlvl-router/SKILL.md`
- Doc taxonomy: `docs/ideas/nxtlvl-doc-skills.md`
- Visual rule: `config/claude/rules/visual-docs.md`
- Prior naming exploration: git history / conversation that produced this handoff (2026-07-03)