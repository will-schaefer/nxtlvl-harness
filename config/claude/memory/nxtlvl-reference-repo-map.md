---
name: nxtlvl-reference-repo-map
description: High-level breadth map of all 13 vendored harnesses in reference/ — use to pick deep-review targets instead of re-scanning.
metadata:
  type: reference
---

High-level orientation map of **every harness in `reference/`** (13 repos) at
docs/reference/reference-repo-map.md — the cheap breadth pass that says which repos deserve a deep
[[nxtlvl-harness-adopt-backlog]]-feeding `/harness-review`, not the deep read itself. Has two
comparison tables (identity/lang/CC-native/size/reviewed; raw component counts) + per-repo capsules
grouped by kind.

**Counts are raw file-surface, not unique inventory** — flagged ⚠ where inflated (ruflo
triplication, ECC `ecc2/`, catalog mirroring). Trust shape, not magnitude.

**Reviewed (6):** ECC, ruflo, superclaude, claude-code-templates, awesome-claude-code-toolkit,
claude-code-hooks-mastery. **Un-reviewed (7), descending mining value for a markdown-harness:**
Trellis (spec/task/memory framework — most architecturally relevant), agents-main (wshobson
multi-harness marketplace, single-md-source→5 harnesses), claude-code-sub-agents (bare 33-agent
SDLC collection, easiest target), deepagents (LangChain Python — non-md contrast), hive (OpenHive
Python DAG runtime), CowAgent (Python multi-channel self-evolving assistant), CodeWhale (Rust
terminal coding agent — likely poor target, skim).

Buckets predict value: **A. curated CC harnesses** = peers to mine; **B. catalogs** (cct/agents-main/
toolkit) = breadth-as-product, mostly reject; **C. non-CC runtimes** (deepagents/hive/CowAgent/
CodeWhale) = architectural-contrast notes (harness lives in code, not markdown). See
[[ecc-component-map]] for ECC's deep map; mine this instead of re-scanning all 13.
