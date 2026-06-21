---
name: nxtlvl-hive-analysis
description: Mode-A whole-harness review of aden-hive/hive (Aden/YC) at docs/reference/hive-analysis.md; also the first live DeepWiki-accelerator dogfood.
metadata:
  type: reference
---

Mode-A general review of **aden-hive/hive** (Aden/YC) — landed at `docs/reference/hive-analysis.md`
(2026-06-21, 22M clone at `reference/hive-main`). 7th harness reviewed; 2nd Mode-A whole-harness review
(after [[nxtlvl-deepagents-analysis]]).

**What hive is — the spine:** a **two-tier graph-of-agents runtime.** A natural-language objective
compiles to a typed DAG (JSON worker configs → `NodeSpec`/`EdgeSpec`/`GraphSpec`), executed by an
**actor-model worker engine** (`NodeWorker` + `Activation` messages, fan-out/fan-in, quiescence
detection — no central scheduler); each node is a multi-turn LLM **AgentLoop** governed by an internal
**ACCEPT/RETRY/ESCALATE judge** that escalates to a **"queen"** overseer coordinating a "colony" of
workers. Memory = **curated `.md` files** with LLM recall-selector (read) + fire-and-forget
reflection-agent (write), NOT vectors. Model-agnostic via **litellm delegation**. Runs as a
single-process asyncio runtime behind an **aiohttp** API + **React** dashboard, spawned as an **Electron
subprocess**, with the **Aden platform brokering secrets** (agents get only short-lived access tokens).

**Verdict ~3.5–3.8/5 — high-quality engine, capped by its envelope.** Robustness=3 is *capped, not
averaged*: execution spine + tool/skills surface are **reference-grade** (4–5), but the
security/deployment substrate is **single-tenant-trusted-by-default** — no auth (no-op middleware when
`HIVE_DESKTOP_TOKEN` unset), no agent isolation (`IsolationLevel` vestigial), Fernet key co-located with
+ logged beside ciphertext. Sound only inside the Electron-desktop + Aden-secrets envelope; unsafe on a
network. Other caps: pervasive **god-files** (`agent_loop.py` 210KB, `queen_lifecycle_tools.py` 4192L,
`litellm.py` 123KB) violating the repo's own "keep files small" rule; **doc drift** (dead `load_agent_export`,
docs name a nonexistent `AgentRunner`/`GraphExecutor`); one real defect = **non-atomic durable-memory
write** (`reflection_agent.py:270`).

**Mineable for nxtlvl** (Mode A surfaced, not a Mode-B ledger): curated-`.md` memory with
recall-selector + reflection-agent (a recall-capable files-over-DB design — contrast/peer to nxtlvl's
own); **file-state-cache + hash-anchored edits** (`file_state_cache.py`, `hashline.py`) = read-before-edit
discipline; per-call deny-list `_FilePolicy` (read-permissive/write-restrictive + write-ceiling);
verified/unverified **manifest-sentinel** tool gate; **tool-gated foundation-skill pre-activation** as a
narrow, deliberate exception to progressive disclosure; ported-and-*credited* Claude Code safety catalogs
kept informational-not-blocking (corroborates [[harness-hooks-inform-not-force]]). NO ADR (Mode A is
neutral; these are notes, not decisions).

**Also the first live dogfood of the [[nxtlvl-harness-review-deepwiki]] accelerator** — and the payoff
case for *leads-not-evidence* (ADR-029). DeepWiki's leads named the right **concepts** (typed DAG,
ACCEPT/RETRY/ESCALATE, three-layer memory) but its **paths were substantially stale**: a nonexistent
`core/framework/graph/` dir, `GraphExecutor`, `event_loop_node.py`, and an `adapt.md`/`save_data`/`edit_data`
role-memory mechanism that **three independent fan-out agents refuted at source**. Because leads were
stamped "verify at source" and agents cite only `file:line`, **zero stale claims reached the artifact**
(reader-test confirmed zero DeepWiki citations-of-evidence). Lesson: DeepWiki accelerates the *concept
map* but its tree-structure claims must always be re-derived from the clone.
