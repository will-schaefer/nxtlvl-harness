---
description: Write or revise specs and plans with mandatory structural visuals — invoke the show-me skill on the main thread. Use after an approved design, or when you have a contract that needs diagram-first docs in docs/spec/ and docs/plan/.
argument-hint: "[spec | plan | both] [topic or path hint] (optional)"
---

# /show-me

Direct entry into the **design-layer authoring** skill. Turns an approved direction into visible,
buildable artifacts — spec in `docs/spec/`, plan in `docs/plan/`, diagrams inline or in
`docs/diagrams/` — with at least one structural visual per doc (mermaid preferred).

**Invoke the `show-me` skill** (Skill tool) on the main thread. Interactive authoring stays on the
thread; don't delegate spec/plan writing to an agent.

## What it does

1. **Classify the ask** — spec only, plan only (requires an existing spec), or both in sequence.
2. **Invoke `show-me`** with `$ARGUMENTS` as the topic, target paths, or phase hint.
3. **Run the house format** — headers, intent links, required architecture/dependency visuals,
   pointers over pasted blocks. Follow `~/.claude/rules/visual-docs.md`.
4. **Route ADRs out** — architectural + expensive-to-reverse decisions go to the decision rule →
   `documentation-and-adrs`, not buried in the spec body.
5. **Stop at plan** — terminal for ideation; do not jump to implementation.

## When to use

- `/brainstorm` (or equivalent) just approved a design and you need the written contract + task
  breakdown.
- An existing spec or plan needs a visual pass or a material revision.
- You want diagram-first docs without re-running the full brainstorming arc.

## When not to use

- Raw idea with no approved direction yet → `/brainstorm` (or `/interview-me` / `/grill-me`).
- Recording an ADR only → `/doc-keeper` or `documentation-and-adrs` inline.
- Pure implementation with an unchanged contract → proceed natively.

For the full front door (idea → approved design → spec → plan), `/brainstorm` composes this skill
at the end. `/show-me` is the slice when you already know *what* to document.

$ARGUMENTS