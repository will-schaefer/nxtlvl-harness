# nxtlvl-wiki Plugin — Interactions

> How the wiki plugin relates to the core `nxtlvl` plugin and `nxtlvl-labs`.

## With `nxtlvl` (core)

### Core queries the wiki

- The core plugin queries the wiki when designing or rebuilding a workflow.
- The wiki returns synthesized orientation with primary-source citations.
- The core plugin treats the output as **leads, not evidence**.
- Every claim that influences a build decision is verified at primary source.

### Core does not write to wiki

- The core plugin does not add sources, update the corpus, or change the wiki's evidence boundary.

## With `nxtlvl-labs`

### Labs is the primary consumer

- The labs plugin uses the wiki as the source in source-driven development.
- The wiki feeds the research and compare phases of the labs workflow.
- Claims are verified at primary source before they influence a copy/create decision.

### Labs does not write to wiki

- The labs plugin does not update the corpus directly.
- Ingestion and curation are separate actions (likely performed by the user or a curation workflow).

## With native Claude Code

### Wiki may use native tools

- The wiki plugin may use native tools (read, web fetch, etc.) for ingestion and primary-source verification.
- It does not reconstruct orchestration primitives.

## With external sources

### Wiki ingests from external sources

- Production harnesses (ecc, agent-skills, etc.).
- Official documentation (via Context7 or direct fetching).
- Top-tier research (papers, articles).

### Wiki is not a search engine

- It does not perform real-time web search for arbitrary queries.
- It queries its ingested corpus.

## Open questions

- Is the wiki plugin a Claude Code plugin, a separate service, or a knowledge-base tool?
- How does the wiki expose its query interface to core and labs? (MCP, skill, API, etc.)
- Who performs ingestion and curation?
- How often is the corpus refreshed?
