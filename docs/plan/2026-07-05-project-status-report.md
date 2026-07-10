# nxtlvl Project Status Report

**Date:** July 5, 2026  
**Repo:** `/Users/willschaefer/Developer/nxtlvl/nxtlvl-core` (workbench monorepo)  
**Git:** `main` is **8 commits ahead** of `origin/main`; **41 uncommitted changes** (active WIP session)

---

## Executive Summary

nxtlvl is a **production-grade personal Claude Code harness** — the daily-driver engine for building an AI agent business. It is past the walking-skeleton phase: ideation → spec → plan → ship → document works end-to-end, with a substantial Context & Memory (C&M) subsystem, hook layer, and scout agents.

The main tension is **documentation and decisions ahead of implementation discipline**. The architecture describes a three-repo plugin family and build-from-scratch doctrine, but the repo ships as a monorepo `nxtlvl` plugin with upstream-composed skills, 21/27 ADRs still Draft, and several broken seams (wiki MCP, audit gate, router/docs drift).

**Bottom line:** Usable for design and shipping workflows today; not yet trustworthy as a complete "bet-a-company-on" foundation until wiki grounding, audit gate, and ADR/code alignment are closed.

---

## What This Project Is

| Layer | Role |
|-------|------|
| **`plugins/nxtlvl/`** | Live harness — skills, agents, commands, hooks, `lib/` |
| **`sandbox/`** | Staging (off discovery path) — **currently empty** |
| **`config/claude/`** | Global rules, memory, settings (symlinked to `~/.claude/`) |
| **`docs/`** | Intent → spec → plan → ADR pipeline + reference distillations |
| **External plugins** | `nxtlvl-labs`, `nxtlvl-wiki`, `nxtlvl-marketplace` (separate repos) |

**Intent anchor:** [`docs/intent/personal-harness.md`](../intent/personal-harness.md) — company-foundation stakes, `nxtlvl-wiki` as production bar, native CC for orchestration, source-driven build method.

---

## Live Plugin Inventory

| Category | Count | Status |
|----------|-------|--------|
| Skills | 13 | Most complete; 4 not in router |
| Commands | 13 | Missing commands for several live skills |
| Agents | 9 | `wiki-scout` exists; MCP not wired |
| Hooks | 8 | Unit-tested; live install checkpoints open |
| Lib (C&M) | ~13 modules | Substantial, tested |
| MCP (wired) | 2 | `deepwiki`, `context7` only |

### Primary user flow (works today)

```
Task → nxtlvl-router
  → brainstorming (/brainstorm) → show-me (/show-me)
  → implement (native, no skill)
  → doubt-driven-development (high stakes)
  → review → github-workflow (/git-workflow) → documentation-and-adrs
```

**Strong:** Ideation, spec/plan with visuals, doubt cycle, harness review, git workflow, C&M loop (`/evolve`, `/promote`, `/prune`, `/instinct-status`).

**Dark / missing:** Development phase (implement/test/debug) has no nxtlvl skills — largest frequency gap.

---

## Open Tasks Map

### P0 — Blocking broken seams

| Task | Source | Status |
|------|--------|--------|
| Wire `nxtlvl-wiki` MCP (ADR-026) | `wiki-driven-development`, `wiki-scout` | Skill + agent built; `.mcp.json` has only deepwiki + context7 |
| Ship `nxtlvl:audit` promotion gate | ADR-014, `CLAUDE.md` | Aspirational — no skill/command on disk |
| Add router entries for `source-driven`, `wiki-driven`, `headless-doubt` | `nxtlvl-router/SKILL.md` | Live but invisible to router |
| Resolve observability north star | ADR-011, intent reshape | `fallback-log.sh` + `metrics.js` still track superseded `ecc:` model |

### P1 — Complete primary journey

| Task | Source | Status |
|------|--------|--------|
| Author nxtlvl bodies for `interview-me`, `grill-me`, `idea-refine` | ADR-018, router ‡ ledger | Commands exist; bodies upstream-only |
| Rebuild `review` from scratch | ADR-003 | OFF-DOCTRINE thin wrapper to `agent-skills:review` |
| Development workflow skill(s) | Workflow curation handoff | ~85 candidates; none built |
| Workflow layer curation | `2026-07-03-workflow-layer-curation-handoff.md` | Handoff written; curation not done |

### P2 — Ops, hygiene, promotion

| Task | Source | Status |
|------|--------|--------|
| Hook 1 live install checkpoint | `nxtlvl-context-awareness-hooks-todo.md` | Built + tested; manual promote pending |
| Hook 2 (PreCompact pointer) | Same | Not built |
| `dangerous-bash` live install | `nxtlvl-hook-gate-backlog.md` | Built; install + live-test pending |
| `config-protection` gate | Hook gate backlog | Committed; design pass owed |
| `project-artifact` integration | Import plan | Live in plugin; no command, no router, skipped sandbox |
| C&M spec DOC checkpoint | `tasks/todo.md` | T1–T10 done; DOC + human review open |
| Refresh deepwiki docs | `state-at-a-glance.md` etc. | Stale (reports 8 skills; live has 13) |
| TypeScript migration | `nxtlvl-typescript-migration-plan.md` | Only `paths.ts`, `types.ts`; rest still `.js` |
| Parent-folder / repo split | ADR-001, migration plan | Deferred; monorepo persists |
| Promote decision-complete Draft ADRs | 21 Draft ADRs | Code shipped under Draft status |

### P3 — Labs / wiki / deferred

| Area | Open gaps |
|------|-----------|
| **nxtlvl-labs** | Post-`/graduate` promotion ritual, evals-lab ↔ harness-lab seam, labs memory model |
| **nxtlvl-wiki** | Corpus thin; ingestion pipeline; evidence boundary enforcement |
| **Doc skills** | `doc-drift-auditor`, `doc-index`, `harness-system-map` — triggers not met |
| **Project management** | Phase 1 read-side `/plan-status` — DRAFT, not built |

---

## Most Active Files & Modules

From git history since June 2026 (by change frequency):

| Hot zone | Files / areas | What's happening |
|----------|---------------|------------------|
| **Decisions** | `docs/decisions/README.md` (38 touches) | ADR reconciliation, ADR-017–026 re-record, ADR-027 rules split |
| **Config / memory** | `config/claude/memory/MEMORY.md`, `settings.json` | Global rules expansion, plugin wiring |
| **Router & workflows** | `nxtlvl-router/SKILL.md`, `github-workflow`, `brainstorming` | Workflow layer curation, show-me integration |
| **Hooks** | `hooks.json`, `context-alert.js`, `close.js`, `capture.js` | Context-awareness rebuild, C&M lifecycle |
| **Intent / plans** | `personal-harness.md`, phase-0 plan, skill intake backlog | Intent reshape, build-method reconciliation |
| **Recent commits** | project-artifact, deepwiki MCP auth, ADR-027, ADR-003 | Last week: artifact import, MCP switch, rules layer |

**Uncommitted WIP (41 files):** `show-me`, `source-driven-development`, `wiki-driven-development`, `headless-doubt`, `wiki-scout`, `project-artifact` promotion, deepwiki architecture updates, skill-naming handoff.

---

## Incomplete & Inconsistent Items

### Critical inconsistencies

1. **Wiki MCP gap** — `wiki-driven-development` + `wiki-scout` depend on `nxtlvl-wiki` plugin MCP tools; harness `.mcp.json` does not register them. ADR-003 "build from wiki" is not invokable in core sessions.

2. **Audit gate missing** — `CLAUDE.md` gates promotion on `nxtlvl:audit`; skill does not exist. Sandbox promotion is `git mv` with no objective gate.

3. **ADR status drift** — 78% of ADRs are Draft while code reflects their decisions. ADR-015 is `Accepted` in file but `Draft` in README. ADR-020 text still names retired upstream exceptions; router uses `show-me` + different ‡ ledger.

4. **Stale observability** — ADR-002 dropped fallback-rate; `fallback-log.sh`, `metrics.js`, `/instinct-status` still surface ecc-based metrics that never fire (`ecc@ecc` disabled).

5. **Router vs inventory** — 4 live skills (`source-driven-development`, `wiki-driven-development`, `headless-doubt`, `project-artifact`) not in router map.

6. **OFF-DOCTRINE skills** — `review` composes upstream; ideation sub-skills are ‡ interim upstream exceptions — contradicts ADR-003 build-from-scratch.

7. **Duplicate / drift artifacts**
   - Brainstorming in both `config/claude/skills/` and `plugins/nxtlvl/skills/`
   - Dual MCP configs: `mcp_config.json` vs `.mcp.json`
   - Deepwiki counts wrong (8 vs 13 skills)
   - Phantom ADR refs in hooks (`dangerous-bash.js` → nonexistent ADR-006; `fallback-log.sh` → wrong ADR-005)
   - `project-artifact` promoted without sandbox/audit/integration

8. **No CI for harness quality** — Only `.github/workflows/labels.yml`; no `npm test` / typecheck on PR.

9. **Plugin naming drift** — ADR-001 says `nxtlvl-harness`; manifest says `nxtlvl`.

---

## Architecture & Tech Debt

**Sound patterns:** Sandbox staging, ADR-heavy docs pipeline, C&M subsystem with tests, hook fail-open contract, scout-agent architecture (deepwiki/context7/wiki), global rules split (ADR-027).

**Primary structural tension:** Documents a three-repo plugin family; ships as monorepo with upstream composition and superseded observability still wired.

**Top tech-debt priorities:**

1. Resolve observability north star (ADR-011) — retarget or decommission fallback instrumentation
2. Promote decision-complete Draft ADRs; fix index drift and stale cross-references
3. Rebuild OFF-DOCTRINE skills (`review` first, then ideation sub-skills)
4. Complete or defer TS migration and ADR-001 repo split with explicit ADR amendment
5. Consolidate MCP config; document cross-plugin wiki dependency
6. Deduplicate brainstorming; clean `docs/decisions/.understand-anything/` artifacts
7. Add CI (`typecheck` + `test`); implement or delete audit gate

---

## Feature Completeness & User Flow

**Complete enough for daily use:** `brainstorm` → `show-me` → ship via `github-workflow`; C&M loop; `harness-review`; Context7 grounding via `/context7`.

**Largest user-value gaps:**

1. Wiki MCP not wired — breaks source-driven build story
2. No audit/promotion gate — trust gap at graduation
3. Development phase has no skills — router's biggest dark zone
4. Router/docs lag live inventory — discoverability problem
5. Three ideation sub-skills + `review` still upstream stubs

**Sandbox:** Empty. Recent `project-artifact` bypassed staging ritual entirely.

---

## Recommended Next Priorities

Ordered by leverage on "company foundation" readiness:

| # | Priority | Why |
|---|----------|-----|
| 1 | **Commit or reconcile current WIP** (41 files) | Unblocks clean baseline; includes show-me, wiki-driven, source-driven |
| 2 | **Wire wiki MCP + finalize ADR-026** | Unblocks ADR-003 doctrine end-to-end |
| 3 | **Ship `nxtlvl:audit`** | Objective promotion gate; sandbox/labs/evolved artifacts need it |
| 4 | **ADR hygiene sprint** | Promote 004/010/017/018/020/024–026; fix README, router text, hook citations |
| 5 | **Retire superseded observability** | Stop misleading `/instinct-status`; decide ADR-011 metric |
| 6 | **Router + deepwiki refresh** | Align discovery map with 13 skills; fix stale docs |
| 7 | **Rebuild `review` + ideation sub-skills** | Last upstream dependencies in primary SDLC path |
| 8 | **Hook live checkpoints + Hook 2** | Cheap continuity win across compaction |
| 9 | **Development workflow (start narrow)** | Highest-frequency dark zone; pick 1–2 stacks from curation handoff |
| 10 | **CI + TS migration decision** | Prevent regressions; resolve partial `paths.ts` interop fragility |

---

## Health Snapshot

| Dimension | Grade | Notes |
|-----------|-------|-------|
| **Documentation** | A- | Rich intent/ADR/plan pipeline; some drift |
| **Live plugin functionality** | B+ | SDLC path works; dev phase empty |
| **Decision record fidelity** | C | Draft/code mismatch, stale refs |
| **Promotion discipline** | D | Audit gate absent; sandbox bypassed |
| **Test coverage** | B | Good on `lib/` + hooks; no CI, no MCP smoke tests |
| **External ecosystem** | B- | labs/wiki split out; seams partially wired |

---

## Analysis Sources

This report was produced from a full codebase analysis on July 5, 2026, including:

- Two focused agent passes: **architecture & tech debt** and **feature completeness & user flow**
- Git activity analysis (recent commits, file change frequency)
- Live plugin inventory (`plugins/nxtlvl/`)
- Backlog and plan documents (`docs/plan/`, `tasks/todo.md`, open-gaps docs)