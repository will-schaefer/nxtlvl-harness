---
name: ecc-component-map
description: Complete mapped index of the ECC reference repo (every skill/command/agent/rule/hook) lives at docs/reference/ecc-main-map.md.
metadata: 
  node_type: memory
  type: reference
  originSessionId: 0182cc24-0575-4246-8682-f5c539cb5a87
---

The ECC reference repo (formerly vendored at `reference/ECC-main`; local copy deleted 2026-07-11 — re-clone affaan-m/ECC on demand) (ECC = "Everything Claude Code" / npm `ecc-universal`, a harness-native agent OS) was exhaustively mapped on 2026-06-16 into **`docs/reference/ecc-main-map.md`**.

The map has a section per component type, each item explained by purpose + outcome: **271 skills** (35 domain groups), **92 commands** (legacy compat surface), **67 subagents**, **114 rule files**, **28 hooks**, **17 structural directories** — 589 items total. It also carries a Repository Overview covering ECC's philosophy, the modules/components/profiles install model, and a Workflows & Orchestration narrative (orch-*, multi-*, gan-*, santa-method, team-agent-orchestration, autonomous-loops).

A machine-readable companion index of every item path is at `docs/reference/ecc-main-map-manifest.json`. Use these when mining ECC for ideas to compose into the [[nxtlvl-harness]] rather than re-scanning the repo. ECC is reference-only here — see [[disable-ecc-active-hooks-dev]].
