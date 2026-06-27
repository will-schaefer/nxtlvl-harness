---
id: ADR-037
title: "Reframe ~/Developer as a parent workspace folder; relocate the harness repo to ~/Developer/nxtlvl/"
status: Accepted
date: 2026-06-25
implementation: "Done 2026-06-27 — repo relocated to ~/Developer/nxtlvl/; ~/.claude symlinks, memory slug (-Users-willschaefer-Developer-nxtlvl), and plugin marketplace re-pointed; Phase 4 checklist passed. Runbook: docs/plan/nxtlvl-parent-folder-migration.md"
---

# ADR-037: Reframe ~/Developer as a parent workspace folder; relocate the harness repo to ~/Developer/nxtlvl/

## Context

[ADR-036](ADR-036-repo-identity-nxtlvl-harness-only.md) narrowed this repo to a strict
nxtlvl-harness identity and, in doing so, explicitly chose to leave the local clone directory
at `~/Developer`. That choice was driven by two constraints: the `~/.claude/*` symlinks point
into `~/Developer/config/claude/`, and the CC project-memory path is keyed on the slug
`-Users-willschaefer-Developer`. Renaming the directory would break both.

Since ADR-036 was accepted, the situation has changed: the user wants `~/Developer` to become a
plain parent workspace folder that hosts several sibling git repos (the harness, `llm-wiki`, and
future additions). Keeping the harness at `~/Developer/` directly conflicts with that goal —
a git repo cannot simultaneously be a clean parent folder for other repos.

The two constraints from ADR-036 remain real, but they are *re-pointable*: `link.sh` can be
re-run from the new path, and the project-memory slug changes predictably (memory content moves
with the repo). The cost is a one-time migration with a runbook, not a permanent structural
blocker.

`llm-wiki` was already its own git repo nested inside the `~/Developer` working tree (technically
a nested repo, which git treats awkwardly). The move de-nests it into a clean sibling position.

## Decision

- **`~/Developer` becomes a plain parent folder with no `.git` at its root.**
- **The harness repo is relocated intact** — whole repo as one unit, full history + working tree
  preserved — into `~/Developer/nxtlvl/`. The remote (`nxtlvl-harness`) is unchanged.
- **`llm-wiki` moves to `~/Developer/llm-wiki/`** (sibling, already its own git repo; de-nesting
  it removes the awkward nested-repo state).
- **The `~/.claude` symlink chain is re-pointed** by re-running `config/claude/link.sh` from
  `~/Developer/nxtlvl/` after the move.
- **The CC project-memory symlink is re-keyed** from slug `-Users-willschaefer-Developer` to
  `-Users-willschaefer-Developer-nxtlvl`. Memory content is preserved — it lives in
  `config/claude/memory/` which moves with the repo.
- **The nxtlvl-dev local marketplace source path** (in `config/claude/settings.json` and
  `~/.claude/plugins/*.json`) is updated from `/Users/willschaefer/Developer` to
  `/Users/willschaefer/Developer/nxtlvl`.
- **Selected scratch is deleted during the move** (not migrated): `.smart-env` (~204 MB,
  regenerable), empty `projects/`, throwaway `*-workspace/` directories, and
  `ai-engineering-from-scratch`. `.superpowers/`, `node_modules/`, `.envrc`, `.grok` move with
  the repo.
- **Execution is deferred** until in-flight work is pushed. The full runbook lives at
  [`docs/plan/nxtlvl-parent-folder-migration.md`](../plan/nxtlvl-parent-folder-migration.md).

This decision reverses the "local dir stays `~/Developer`" consequence of ADR-036 (see the note
added to that ADR). All other ADR-036 decisions stand unchanged: single published plugin,
`config/claude/` stays in-repo, terminal dotfiles externalized, `agent-dev` dormant-but-tracked,
remote name `nxtlvl-harness`.

## Alternatives Considered

### Keep ADR-036 as-is — local dir stays `~/Developer`
- Pros: no migration work; symlinks and memory slug remain valid without changes.
- Cons: `~/Developer` cannot cleanly host sibling repos if the harness repo lives at its root.
  The nested-repo state of `llm-wiki` persists. The user's explicit goal (a multi-repo workspace)
  is blocked.
- Rejected: user explicitly wants a parent workspace folder.

### Split the plugin into its own repo separate from the workbench
- Pros: harness plugin in one repo, Claude config + workbench tooling in another; cleanest
  separation of concerns.
- Cons: breaks the inseparability rationale from ADR-036 — `config/claude/` is the harness's
  own Claude Code configuration; splitting it means two repos must stay in sync. Cross-repo
  coordination overhead outweighs the separation benefit at this scale.
- Rejected: move whole repo as one unit.

### Move scratch into `~/Developer/nxtlvl/` and keep `.smart-env`
- Pros: no deletion decisions required; simpler mechanical move.
- Cons: `.smart-env` is 204 MB of regenerable cache that would inflate the new directory
  unnecessarily. Throwaway `*-workspace/` directories carry no durable value.
- Rejected: delete regenerable scratch; migrate only tracked + durable content.

## Consequences

- **`~/Developer` becomes a clean workspace root.** Future sibling repos drop cleanly into
  `~/Developer/<name>/` without nested-repo awkwardness.
- **`llm-wiki` de-nests.** Previously an awkward nested git repo inside the working tree; now a
  clean sibling at `~/Developer/llm-wiki/`.
- **One-time migration cost.** Symlinks, memory slug, and marketplace path each need one re-point.
  The runbook at [`docs/plan/nxtlvl-parent-folder-migration.md`](../plan/nxtlvl-parent-folder-migration.md)
  covers each step with a verification checklist and a rollback procedure.
- **Session transcript history splits at the move boundary.** Old transcripts remain under the
  `-Users-willschaefer-Developer` slug; new sessions use `-Users-willschaefer-Developer-nxtlvl`.
  Memory content (in `config/claude/memory/`) carries over intact because it moves with the repo.
- **The nxtlvl plugin install path changes.** Any agent or tool that hardcodes
  `/Users/willschaefer/Developer` as the plugin source must be updated; the runbook covers this.
- **ADR-001 is unaffected in substance.** The local marketplace packaging decision
  ([ADR-001](ADR-001-plugin-local-marketplace-packaging.md)) continues to hold — the relative
  source path inside the repo is unchanged; only the absolute prefix moves.
- Cross-links: [ADR-036](ADR-036-repo-identity-nxtlvl-harness-only.md) (this reverses its
  "local dir stays `~/Developer`" clause; all other ADR-036 decisions stand),
  [ADR-001](ADR-001-plugin-local-marketplace-packaging.md) (marketplace packaging — relative
  source path survives the move; only the absolute prefix changes).
