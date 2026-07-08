# `docs/diagrams/` — standalone visual artifacts

> House convention for the **Diagram** doc type. Agents-only audience. Governed by
> `◆ show-me` and `~/.claude/rules/visual-docs.md`.

## Purpose

Hold **durable, linkable visuals** that are too heavy or too interactive to inline in a spec,
plan, or ADR. Parent docs point here — pointers over content.

## When to use this folder vs inline mermaid

| Use **inline mermaid** in the parent `.md` | Use **`docs/diagrams/`** |
|---|---|
| One architecture or flow diagram per doc | Reused across multiple docs |
| Renders fine in GitHub/markdown viewers | Interactive (hover, tabs, zoom) |
| Stays byte-small | Large or generated assets |

## File naming

```
docs/diagrams/<topic-slug>.md      # mermaid source + optional prose caption
docs/diagrams/<topic-slug>.html    # interactive companion (local-first, no CDN required)
docs/diagrams/<topic-slug>.svg     # exported static when HTML is overkill
```

Slug matches the subject (`provider-projector-flow`, `context-memory-lifecycle`), not the parent
doc's date prefix.

## Linking from parent docs

```markdown
→ Diagram: [`docs/diagrams/<slug>.md`](diagrams/<slug>.md)
```

Keep the parent doc's **summary** diagram inline when it orients the reader; link here for the
deep or interactive version.

## Formats

- **`.md`** — preferred for mermaid-only diagrams. Start with a one-line caption, then a
  fenced ` ```mermaid ` block.
- **`.html`** — self-contained interactive views (no external network deps in v1). Open locally
  or serve from the labs web cockpit when available.
- **`.svg`** — static export when markdown/HTML viewers differ.

## Index

Maintain a one-line entry in this README when adding a diagram:

| Slug | Parent doc | What it shows |
|---|---|---|
| *(add rows as diagrams land)* | | |