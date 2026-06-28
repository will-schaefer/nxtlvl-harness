# nxtlvl-wiki Plugin Architecture

> **Architecture outline for the `nxtlvl-wiki` plugin.** The sole reference corpus and production bar
> for the nxtlvl ecosystem — a queryable, synthesized knowledge layer over reviewed production
> harnesses and top-tier research.
>
> **Ecosystem context:** this is one of three plugins. See the
> [ecosystem overview](../nxtlvl-ecosystem/index.md) for how it relates to `nxtlvl` and
> `nxtlvl-labs`.
>
> **Anchor:** [`docs/intent/personal-harness.md`](../../../docs/intent/personal-harness.md).  
> **Governing ADR:** [`ADR-002`](../../../docs/decisions/ADR-002-reference-corpus-nxtlvl-wiki.md).

## Role

The wiki plugin is the **reference corpus**. It provides:

- Ingested, structured knowledge from reviewed production harnesses (ecc, agent-skills, and others).
- A queryable interface that returns synthesized orientation.
- The production bar against which the deliberate coverage assessment measures `nxtlvl`.

It is **not** a fallback runtime. It does not make build decisions. It informs them.

## Design principles

1. **Sole reference corpus.** It is the only source-driven reference; no other reference-corpus plugin is installed.
2. **Orientation and leads, never evidence.** Every wiki output is verified at primary source before it reaches an ADR or build decision.
3. **Ingested, not dormant.** The corpus is queryable knowledge, not an installed plugin waiting to be invoked.
4. **Curated and versioned.** The corpus is actively maintained, not an automatic scrape.
5. **Evidence boundary.** The wiki may cite primary sources; the consumer (core or labs) must verify before acting.

## Pages in this wiki

| Page | What you'll find |
|---|---|
| [Architecture](architecture.md) | Subsystem map and dependency layers. |
| [Atoms](atoms.md) | Atom-level coverage table for the wiki plugin. |
| [Build order](build-order.md) | Foundational → phase 0 → phase 1 → reactive. |
| [Interactions](interactions.md) | How the wiki plugin relates to `nxtlvl` and `nxtlvl-labs`. |
| [Open gaps](open-gaps.md) | What is still undefined or exploratory. |

## Status at a glance

The wiki plugin exists as a concept and is partially implemented through `nxtlvl-wiki` (a separate plugin). Its architecture is still being defined.

| Status | Meaning | Approximate count |
|---|---|---|
| NATIVE | Provided by an external platform. | 3 atoms |
| BUILT | Already exists in some form. | 5 atoms |
| PLANNED | Committed or strongly intended. | 15 atoms |
| OPEN | No position taken yet. | 20 atoms |
| REJECTED | Deliberately not built. | 1 atom |
| OOS | Out of scope. | 2 atoms |

## Open questions

- The exact ingestion pipeline and storage mechanism are not yet defined.
- The query interface and synthesis strategy are placeholders.
- The wiki plugin's packaging and namespace are not yet defined.
