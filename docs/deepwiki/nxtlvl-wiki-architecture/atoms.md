# nxtlvl-wiki Plugin — Atom Coverage

> Atom-level coverage of the `nxtlvl-wiki` plugin. The wiki is the reference corpus / production bar
> for the nxtlvl ecosystem.
>
> **Status legend:** `NATIVE` = provided by Claude Code / external platform; `BUILT` = ships today;
> `PLANNED` = committed; `REJECTED` = deliberate no; `OOS` = out of scope; `OPEN` = no position yet.
>
> **Priority legend:** `foundational` = other atoms depend on it; `phase-0` = first working slice;
> `phase-1` = next wave; `reactive` = built when a real gap proves itself; `deferred` = explicitly not now.

## WIKI-A · Ingestion & sources

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| WIKI-A1 | Production-harness repo ingestion | PLANNED | foundational | reference-corpus | Ingest ecc, agent-skills, etc. |
| WIKI-A2 | Research-paper / article ingestion | OPEN | phase-1 | reference-corpus | Top-tier research sources |
| WIKI-A3 | Official documentation ingestion | PLANNED | phase-0 | reference-corpus | Context7/primary-source docs |
| WIKI-A4 | Primary-source link extraction | PLANNED | foundational | reference-corpus | Extract links to official docs |
| WIKI-A5 | Ingestion trigger | OPEN | phase-0 | reference-corpus | Manual, scheduled, or event-driven |
| WIKI-A6 | Source quality gate | PLANNED | phase-0 | reference-corpus | Reject low-quality sources |
| WIKI-A7 | Incremental / delta ingestion | OPEN | phase-1 | reference-corpus | Update only changed sources |
| WIKI-A8 | Source metadata capture | PLANNED | phase-0 | reference-corpus | Date, version, source type |

## WIKI-B · Storage & indexing

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| WIKI-B1 | Document storage format | PLANNED | foundational | reference-corpus | Markdown, structured JSON, etc. |
| WIKI-B2 | Chunking strategy | PLANNED | foundational | reference-corpus | How docs are split |
| WIKI-B3 | Embedding index | OPEN | phase-1 | reference-corpus | Vector search |
| WIKI-B4 | Keyword / symbolic index | PLANNED | phase-0 | reference-corpus | Full-text / symbolic search |
| WIKI-B5 | Version snapshot storage | OPEN | phase-1 | reference-corpus | Rollback to prior corpus |
| WIKI-B6 | Cross-source linking | OPEN | phase-1 | reference-corpus | Links between related sources |
| WIKI-B7 | Deduplication | OPEN | phase-1 | reference-corpus | Avoid duplicate content |
| WIKI-B8 | Storage backend | OPEN | phase-0 | reference-corpus | File, DB, or vector store |

## WIKI-C · Query & synthesis

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| WIKI-C1 | Natural-language query interface | PLANNED | phase-0 | reference-corpus | How users ask questions |
| WIKI-C2 | Query intent parsing | OPEN | phase-1 | reference-corpus | Classify query type |
| WIKI-C3 | Retrieval strategy | PLANNED | phase-0 | reference-corpus | Semantic + keyword + symbolic |
| WIKI-C4 | Synthesized answer generation | PLANNED | phase-0 | reference-corpus | Compose answer from sources |
| WIKI-C5 | Primary-source citation | PLANNED | foundational | reference-corpus | Always cite primary sources |
| WIKI-C6 | Confidence scoring | OPEN | phase-1 | reference-corpus | How certain is the answer? |
| WIKI-C7 | Multi-source reconciliation | OPEN | phase-1 | reference-corpus | Handle conflicting sources |
| WIKI-C8 | Query budget / cost control | OPEN | phase-1 | reference-corpus | Limit expensive retrievals |

## WIKI-D · Evidence boundary

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| WIKI-D1 | Orientation-only framing | PLANNED | foundational | reference-corpus | Answers are leads, not evidence |
| WIKI-D2 | Verification prompts | PLANNED | phase-0 | reference-corpus | Prompt user to verify at source |
| WIKI-D3 | Confidence caveat surfacing | PLANNED | phase-0 | reference-corpus | Surface uncertainty |
| WIKI-D4 | No-direct-ADR rule | PLANNED | foundational | reference-corpus | Wiki claims do not reach ADRs directly |
| WIKI-D5 | Primary-source verification checklist | OPEN | phase-1 | reference-corpus | Checklist for consumers |
| WIKI-D6 | Distinction between "what harnesses do" and "what you should do" | PLANNED | phase-0 | reference-corpus | Avoid normative overreach |

## WIKI-E · Curation & versioning

| ID | Atom | Status | Priority | Dependency Layer | Pointer / note |
|---|---|---|---|---|---|
| WIKI-E1 | Ingestion review workflow | OPEN | phase-1 | reference-corpus | Review before adding source |
| WIKI-E2 | Source deprecation | OPEN | phase-1 | reference-corpus | Remove outdated sources |
| WIKI-E3 | Corpus coverage assessment | PLANNED | phase-0 | reference-corpus | Compare corpus to architecture map |
| WIKI-E4 | Wiki update cadence | OPEN | phase-1 | reference-corpus | How often corpus is refreshed |
| WIKI-E5 | Quality gate for new sources | PLANNED | phase-0 | reference-corpus | Minimum bar for ingestion |
| WIKI-E6 | Conflict resolution between sources | OPEN | phase-1 | reference-corpus | How to handle disagreements |
| WIKI-E7 | Version tagging and rollback | OPEN | phase-1 | reference-corpus | Tagged corpus versions |
| WIKI-E8 | Public vs. private corpus boundaries | OOS | deferred | reference-corpus | Not a current concern |

## Coverage summary

| Family | PLANNED | OPEN | OOS | Total |
|---|---|---|---|---|
| WIKI-A | 5 | 3 | 0 | 8 |
| WIKI-B | 3 | 5 | 0 | 8 |
| WIKI-C | 4 | 4 | 0 | 8 |
| WIKI-D | 5 | 1 | 0 | 6 |
| WIKI-E | 2 | 5 | 1 | 8 |

> **Note:** The wiki plugin is speculative. The actual implementation may differ significantly once source-driven exploration begins.
