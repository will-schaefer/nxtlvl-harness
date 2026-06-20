---
name: nxtlvl-ruflo-plugins-map
description: Structural map of ruflo's 35 marketplace plugins — archetype split + count drift; use instead of re-scanning the plugin dirs.
metadata:
  type: reference
---

Within-repo structural map of the **35 plugins** in ruflo's marketplace
(`reference/ruflo-main/plugins/`, manifest `.claude-plugin/marketplace.json`) at
docs/reference/ruflo-plugins-map.md — zooms into one harness below the breadth
[[nxtlvl-reference-repo-map]] and capability [[nxtlvl-reference-domain-map]]. Structural (what each
plugin contains/wraps), NOT a quality review — verdicts live in [[nxtlvl-ruflo-distillation]] +
[[nxtlvl-ruflo-hooks-review]] + [[nxtlvl-ruflo-discovery-review]] + [[nxtlvl-ruflo-adr-distillation]].

**Headline:** three disagreeing plugin counts in one repo — manifest ships **35**, CLAUDE.md claims
"21 native", its Optional-Plugins section says "20 Available"; only the manifest matches disk.

**Archetype split:** 6 domains; color/tag by archetype. **24 wrappers** = uniform `v0.2.0` boilerplate
(`1c·1a·2s`) shelling out to the shared `npx ruflo`/`claude-flow` CLI whose engine is in `v3/@claude-flow/*`,
not the plugin. **9 substantive** = core, agent (9 agents), workflows (8 cmds), goals (GOAP), metaharness
(24 scripts), cost-tracker (v0.26, most-iterated, 20 skills/22 scripts), neural-trader, browser (9 skills),
iot-cognitum. **2 code-runtime** = graph-intelligence (22 TS, 10 adapters, PageRank) + arena (tournament
engine) — newest `v0.1.0-alpha.1`, only self-contained plugins, **zero CC surfaces** (a cmd/agent/skill
sweep reads them "empty"; capability is in `src/`). Plumbing: `.mcp.json` in **core only**; `hooks.json`
in **core + cost-tracker** only — the other 33 register neither.

Same "encoded N× routed 0×" theme at PLUGIN granularity = confirms LOCKED positions (curated-depth,
single-source, manifest-as-truth) by contrast; NO ADR. Low mining value (only the graph-intelligence
10-adapters→1-graph pattern is novel, noted not adopted). Mine this instead of re-scanning 35 dirs.
