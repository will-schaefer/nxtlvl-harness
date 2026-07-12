---
name: ecc-knowledge-graph
description: "Understand-anything knowledge graph of the retired ECC-main vendored copy — graph JSON rescued to docs/reference/ecc-understand-anything/; dashboard defunct since source deletion."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 0182cc24-0575-4246-8682-f5c539cb5a87
---

Ran the `understand-anything:understand` 7-phase pipeline on `reference/ECC-main` at scope "Full system, noise excluded" (1,264 files; mirror dirs + docs/ + assets/ excluded via `.understand-anything/.understandignore`).

**2026-07-11 — vendored ECC-main deleted** (ADR-003 amendment: reference/ copies retired; wiki manifest is the durable record). The core graph artifacts were rescued to **`docs/reference/ecc-understand-anything/`** (tracked); `intermediate/` and trash were dropped. The dashboard and any file-content lens are **defunct** — they read the deleted source tree. To revive: re-clone affaan-m/ECC into gitignored `reference/`, place the rescued `.understand-anything/` contents inside it, or re-run `/understand` fresh. The launchd LaunchAgent `com.willschaefer.ecc-dashboard.plist` was unloaded and deleted the same day — no dashboard service exists anymore.

Original output (now at `docs/reference/ecc-understand-anything/`):
- `knowledge-graph.json` — 1,944 nodes (432 file, 754 function, 621 document, 70 config, 57 class, 10 pipeline), 1,781 edges, 9 layers, 11-step tour.
- 9 layers: Skills Catalog (355), Agents & Commands (175), Coding Rules (89), Automation Scripts (204), Rust Control Plane (19), LLM & Integration (26), Test Suite (135), Plugin Manifest & Config (89), CI/CD & Docs (41).
- `fingerprints.json` (TreeSitter baseline), `meta.json`, `intermediate/scan-result.json` preserved for incremental reruns.

Dashboard: `/understand-dashboard <project-path>` → Vite server at 127.0.0.1:5173 (tokenized URL). Other lenses: understand-chat / -explain / -onboard / -diff / -knowledge / -domain skills.

HISTORICAL — dashboard service (2026-06-18, removed 2026-07-11): installed a launchd LaunchAgent `~/Library/LaunchAgents/com.willschaefer.ecc-dashboard.plist` (RunAtLoad + KeepAlive) that always serves the ECC-main graph at a STABLE url **http://127.0.0.1:5173/?token=f3318ea88b1f871485831630251d9c60** (token fixed via `UNDERSTAND_ACCESS_TOKEN` env; GRAPH_DIR=reference/ECC-main). Logs: `~/Library/Logs/ecc-dashboard.log`. Manage: `launchctl unload/load <plist>`; remove = unload + rm plist. CAVEAT: plist hard-codes the version-pinned plugin path `.../understand-anything/2.8.0/packages/dashboard` — when the understand-anything plugin updates, edit the plist's path + reload. Static one-file export is NOT possible: the graph/file-content endpoints are Vite dev-server middleware, so the Node server must stay running.

Pipeline gotchas (driving understand-anything manually): Phase 2 (file-analyzer fan-out) can stall — a background Workflow died mid-run; resume by computing missing batch indices on disk and re-dispatching ONLY those. Batch files glob `batch-<i>(-part-<k>).json`; `batches.json` is an envelope (`.batches` holds the array). Phases 3→4→5 are SEQUENTIAL because assemble-reviewer writes back into assembled-graph.json. After Phase 4/5, normalize layers/tour (unwrap envelope, nodes→nodeIds, path→`file:` prefix, drop dangling). In Phase 7, `build-fingerprints.mjs` MUST print `Fingerprints baseline:` and exit 0 BEFORE writing meta.json. See also [[cc-workflow-args-not-array]] (hit while resuming Phase 2).

Complements [[ecc-component-map]] (the static 589-item markdown map at docs/reference/ecc-main-map.md). The map is hand-curated prose; this graph is queryable topology with import/contains/tested_by edges and a guided tour. Plugin cache: `~/.claude/plugins/cache/understand-anything/understand-anything/2.8.0` (core dist must be built; build needs `dangerouslyDisableSandbox`).
