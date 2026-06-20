---
name: nxtlvl-trellis-distillation
description: "Mode-B adopt/adapt/reject of Trellis (mindfold-ai) vs nxtlvl — spec-spine, C&M, hooks, ideation; TREL-01..15 in backlog."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 549c4bbe-9121-4024-9752-40a82737e1e6
---

Adopt/adapt/reject of `mindfold-ai/Trellis` (`@mindfoldhq/trellis`) at
[docs/reference/trellis-distillation.md](../../../../Developer/docs/reference/trellis-distillation.md);
6th harness review, **Mode B**, comprehensive 4-surface LENS (spec→plan spine · C&M · hooks ·
ideation/skill-authoring), 4-agent fan-out partitioned by subsystem. Trellis = a **real, dogfooded**
spec-driven multi-runtime framework (`.trellis/` project layer: specs/tasks/workspace-journals + Python
CLI + a markdown workflow state-machine, rendered per-platform for 11–16 tools).

**Spine = "single-source the contract, multi-source the delivery" — both lessons in one repo.** Where
Trellis single-sources (its Python engine; the one-markdown breadcrumb with no fallback dict) it's the
**best spec/task/workflow craft reviewed**; where it multi-sources (N hand-rendered per-platform copies)
it's **caught mid-drift** (codex `.toml` carries a 25-line block its template dropped; brainstorm skill
divergent in name/desc/length installed↔codex-template). Sharpest external validation yet of nxtlvl's
single-source + withhold-tools-mechanically + promote-by-`git mv` discipline.

**Harvest:** ADOPT/ADAPT rows = **TREL-01..TREL-15** in
[the adopt backlog](../../../../Developer/docs/plan/nxtlvl-harness-adopt-backlog.md) (abbrev `TREL`),
grouped by surface. Highest-value: **TREL-01** workflow-state writer/reachability-matrix as the C&M
lifecycle-spec doc shape (3 agents independently nominated it; ADR graduation candidate when that spec is
written); **TREL-06** session-insight = best-in-class capability-not-workflow *recall* skill (composes to
update-spec, curated-files-not-vector-DB) = the model for the instinct/evolve recall half; **TREL-03**
structural anti-recursion guard (remove the spawn tool, don't just prompt); **TREL-02** single-source
markdown breadcrumb. C&M headline = **opposite memory bets**: Trellis stores per-dev narrative worklogs
(great provenance, *poor recall* — written >> read); nxtlvl's curated one-fact-per-file + MEMORY.md
pointer index is the stronger recall design — borrow the *mechanics* (rotation, `@@@auto:` markers,
atomic-rename it lacks), not the worklog shape.

**NO ADR** — every architectural REJECT *confirms* a locked position (inform-don't-force, files-over-DB
recall, single-source-no-router, tool-withholding-not-prose, fail-loud-on-broken-state). Two REJECTs now
recur ≥3 harnesses → promoted to **doctrine notes** in the backlog (tool-withholding-not-prose;
single-source-no-N-copy). Filler to ignore: GitNexus MCP (their commercial product, no engine in clone),
the channel runtime, docs-site/marketplace/assets. Mine the distillation instead of re-scanning the 130M
clone. Related: [[nxtlvl-harness-adopt-backlog]], [[nxtlvl-context-memory-subsystem]],
[[analyze-all-harnesses-build-decisions]], [[nxtlvl-reference-domain-map]].
