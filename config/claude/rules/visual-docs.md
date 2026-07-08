# Visual design-docs rule

**Scope:** how design documentation — specs, plans, intents, ADRs, architecture write-ups, and
proposals — includes diagrams and other visuals. The author is a **visual learner**; structure is
understood faster when shown, not only described.

## Pointers

- Persisted specs and plans (house format + required visuals): **`nxtlvl:show-me`**
  — `~/Developer/nxtlvl/plugins/nxtlvl/skills/show-me/SKILL.md`.
- In-session interactive visuals (mockups, comparisons, live architecture): **`nxtlvl:brainstorming`**
  §"Showing, not just telling — native visuals" and the `visualize` MCP tooling
  (`mcp__visualize__read_me`, then `mcp__visualize__show_widget`).
- Standalone diagram artifacts: `docs/diagrams/README.md` in the repo — durable, linkable
  Diagram-type files; other repos use an equivalent `docs/diagrams/` subtree by convention.

## Triggers

- **Authoring or materially revising** a design doc (`docs/spec/`, `docs/plan/`, `docs/intent/`,
  `docs/decisions/`, `docs/superpowers/specs/`, or equivalent)? Include **at least one structural
  visual** — lifecycle, architecture, data-flow, or component-boundary — not prose alone.
- **Explaining boundaries, pipelines, or stage machines?** Draw it: **mermaid** in markdown for
  persisted docs (preferred — renders in GitHub and most viewers); **ASCII** for simple one-way
  flows when mermaid is overkill; **table** for option/trade-off comparisons.
- **In a live session** where layout, boundaries, or side-by-side options are the question?
  **Render it** via the `visualize` tooling — don't wait to be asked; default to showing structure.
- **Need interactive exploration** that must survive the session? Write a standalone artifact under
  `docs/diagrams/` (HTML, SVG, or mermaid source) and **link** from the parent doc —
  pointers-over-content; don't inline huge blocks.
- **Pure policy or sequencing with no structural shape?** A diagram is optional — don't force a
  visual when the doc has nothing spatial to show.

## What not to do

- Don't paste page-long diagrams into always-on context — keep inline visuals lean; push heavy or
  interactive assets to `docs/diagrams/` and link.
- A UI *topic* isn't automatically a visual *question* — conceptual trade-offs can stay prose;
  structural questions should not.