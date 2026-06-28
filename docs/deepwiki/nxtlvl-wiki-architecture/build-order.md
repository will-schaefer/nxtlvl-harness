# nxtlvl-wiki Plugin — Build Order

> Foundational → phase 0 → phase 1 → reactive. The order in which the wiki plugin's atoms should be built.

## Foundational layer (must exist first)

The wiki cannot inform source-driven decisions until it can ingest, store, and cite sources with an evidence boundary.

### Ingestion & sources

- WIKI-A1 Production-harness repo ingestion
- WIKI-A3 Official documentation ingestion
- WIKI-A4 Primary-source link extraction
- WIKI-A6 Source quality gate
- WIKI-A8 Source metadata capture

### Storage & indexing

- WIKI-B1 Document storage format
- WIKI-B2 Chunking strategy
- WIKI-B4 Keyword / symbolic index

### Evidence boundary

- WIKI-D1 Orientation-only framing
- WIKI-D4 No-direct-ADR rule
- WIKI-D6 Distinction between "what harnesses do" and "what you should do"

## Phase 0 (first working slice)

These atoms let the wiki answer its first useful queries and support the first source-driven project in `nxtlvl-labs`.

### Query & synthesis

- WIKI-C1 Natural-language query interface
- WIKI-C3 Retrieval strategy
- WIKI-C4 Synthesized answer generation
- WIKI-C5 Primary-source citation

### Evidence boundary

- WIKI-D2 Verification prompts
- WIKI-D3 Confidence caveat surfacing

### Curation

- WIKI-E3 Corpus coverage assessment
- WIKI-E5 Quality gate for new sources

### Ingestion

- WIKI-A5 Ingestion trigger
- WIKI-A7 Incremental / delta ingestion

### Storage

- WIKI-B8 Storage backend

## Phase 1 (next wave)

- WIKI-A2 Research-paper / article ingestion
- WIKI-B3 Embedding index
- WIKI-B5 Version snapshot storage
- WIKI-B6 Cross-source linking
- WIKI-B7 Deduplication
- WIKI-C2 Query intent parsing
- WIKI-C6 Confidence scoring
- WIKI-C7 Multi-source reconciliation
- WIKI-C8 Query budget / cost control
- WIKI-D5 Primary-source verification checklist
- WIKI-E1 Ingestion review workflow
- WIKI-E2 Source deprecation
- WIKI-E4 Wiki update cadence
- WIKI-E6 Conflict resolution between sources
- WIKI-E7 Version tagging and rollback

## Deferred / out of scope

- WIKI-E8 Public vs. private corpus boundaries (OOS)

## Build-order rules

1. **The evidence boundary is foundational.** The wiki is useless if its output is treated as evidence.
2. **Ingestion and storage come before query.** You cannot query what you have not stored.
3. **Phase 0 atoms enable the first source-driven decision.** The wiki needs to answer concrete questions about production harnesses.
4. **Phase 1 atoms mature the corpus.** They add research sources, embeddings, versioning, and reconciliation.
5. **Deferred atoms are not needed for the company-foundation phase.** They can be revisited later.
