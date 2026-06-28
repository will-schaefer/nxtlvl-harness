# nxtlvl-wiki Plugin — Open Gaps

> What is still undefined or exploratory in the wiki plugin architecture.

## 1. Plugin / system form

- Is `nxtlvl-wiki` a Claude Code plugin, a separate service, a set of markdown files, or a vector database?
- What is its packaging and namespace?
- How is it installed and updated?
- Is it a separate repo in the same marketplace, like `nxtlvl-labs`?

## 2. Ingestion pipeline

- Which sources are ingested first? (ecc, agent-skills, official docs, research papers?)
- How is a repo ingested? (clone, parse, chunk, index)
- How is official documentation ingested? (Context7 MCP, web fetch, manual curation?)
- What is the source quality gate?

## 3. Storage and indexing

- What is the storage backend? (files, SQLite, vector store, etc.)
- Is there an embedding index, or is keyword/symbolic search sufficient for phase 0?
- How are sources chunked and cross-linked?
- How is versioning handled?

## 4. Query interface

- How do core and labs query the wiki? (MCP server, skill, command, API?)
- What does the query response look like? (synthesized text, structured JSON, ranked chunks?)
- How is the evidence boundary enforced in the response format?

## 5. Evidence boundary

- How does the wiki ensure its output is treated as orientation, not evidence?
- What prompts or framing are added to every response?
- How is the no-direct-ADR rule enforced? (Is it just policy, or is there a technical check?)

## 6. Curation and versioning

- Who decides which sources are added or removed?
- How often is the corpus refreshed?
- How are conflicting sources reconciled?
- How is the corpus coverage assessment run?

## 7. Relationship to Context7 / DeepWiki

- The core plugin already uses Context7 MCP for official docs and DeepWiki MCP for repo orientation.
- How does `nxtlvl-wiki` relate to these existing MCP tools?
- Does it replace them, wrap them, or complement them?

## 8. Cost and performance

- How expensive are ingestion and query?
- Is there a budget or cost control mechanism?
- How does the wiki scale as the corpus grows?
