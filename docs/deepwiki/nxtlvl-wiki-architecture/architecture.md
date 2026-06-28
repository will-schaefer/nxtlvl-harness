# nxtlvl-wiki Plugin — Subsystem Map

> The five subsystems of the wiki plugin: ingestion, storage, query/synthesis, evidence boundary,
> and curation.

## Subsystem stack

```
LAYER 5 · Curation & versioning        corpus lifecycle · quality gates · deprecation
        │ governs
LAYER 4 · Evidence boundary            orientation-only policy · citation hygiene · verification prompts
        │ enforces
LAYER 3 · Query & synthesis            natural-language query · synthesized answer · primary-source links
        │ reads
LAYER 2 · Storage & indexing           structured docs · embeddings · search index · version snapshots
        │ receives
LAYER 1 · Ingestion & sources          repo ingestion · research ingestion · top-tier source ingestion
```

## Subsystem descriptions

### WIKI-A · Ingestion & sources

How source material enters the wiki.

- WIKI-A1 Production-harness repo ingestion
- WIKI-A2 Research-paper / article ingestion
- WIKI-A3 Official documentation ingestion
- WIKI-A4 Primary-source link extraction
- WIKI-A5 Ingestion trigger (manual, scheduled, or event-driven)
- WIKI-A6 Source quality gate
- WIKI-A7 Incremental / delta ingestion
- WIKI-A8 Source metadata capture

### WIKI-B · Storage & indexing

How ingested material is stored and made searchable.

- WIKI-B1 Document storage format
- WIKI-B2 Chunking strategy
- WIKI-B3 Embedding index
- WIKI-B4 Keyword / symbolic index
- WIKI-B5 Version snapshot storage
- WIKI-B6 Cross-source linking
- WIKI-B7 Deduplication
- WIKI-B8 Storage backend (file, DB, vector store)

### WIKI-C · Query & synthesis

How users ask questions and receive answers.

- WIKI-C1 Natural-language query interface
- WIKI-C2 Query intent parsing
- WIKI-C3 Retrieval strategy (semantic + keyword + symbolic)
- WIKI-C4 Synthesized answer generation
- WIKI-C5 Primary-source citation
- WIKI-C6 Confidence scoring
- WIKI-C7 Multi-source reconciliation
- WIKI-C8 Query budget / cost control

### WIKI-D · Evidence boundary

How the wiki enforces its "orientation, not evidence" policy.

- WIKI-D1 Orientation-only framing in answers
- WIKI-D2 Verification prompts
- WIKI-D3 Confidence caveat surfacing
- WIKI-D4 No-direct-ADR rule
- WIKI-D5 Primary-source verification checklist
- WIKI-D6 Distinction between "what harnesses do" and "what you should do"

### WIKI-E · Curation & versioning

How the corpus is maintained over time.

- WIKI-E1 Ingestion review workflow
- WIKI-E2 Source deprecation
- WIKI-E3 Corpus coverage assessment
- WIKI-E4 Wiki update cadence
- WIKI-E5 Quality gate for new sources
- WIKI-E6 Conflict resolution between sources
- WIKI-E7 Version tagging and rollback
- WIKI-E8 Public vs. private corpus boundaries
