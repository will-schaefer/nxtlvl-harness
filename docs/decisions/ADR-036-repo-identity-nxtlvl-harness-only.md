---
id: ADR-036
title: "Narrow the repo to a strict nxtlvl-harness identity: one published plugin, Claude config stays, terminal dotfiles externalized"
status: Accepted
date: 2026-06-25
---

# ADR-036: Narrow the repo to a strict nxtlvl-harness identity: one published plugin, Claude config stays, terminal dotfiles externalized

## Context

This repo (locally `~/Developer`, remote formerly `will-schaefer/developer-config`) had
accumulated four tangled concerns over time:

1. **The nxtlvl harness** — `plugins/nxtlvl/`, `docs/`, `sandbox/`, `scripts/`.
2. **Global Claude Code config source** — `config/claude/`, which `~/.claude/*` symlinks into via
   `config/claude/link.sh`.
3. **A vendored reference corpus** — `reference/ECC-main/` plus a carved-out `plugins/agent-dev/`
   plugin (an ECC carve-out; see [ADR-002](ADR-002-ecc-dormant-reference-backstop.md)).
4. **Terminal/editor dotfiles** — `config/iterm2/`, `config/kitty/`, and a nested local
   `config/helix/` repo.

The repo was originally created as a general `developer-config` holder, so the drift was natural —
but it obscured the repo's real purpose: **building and shipping nxtlvl**. A single-concern
identity makes the plugin the clear subject, reduces accidental coupling, and sharpens what "done"
and "shipped" mean for this repo.

The key constraint is that `config/claude/` — the symlink source for `~/.claude/*` — is
*inseparable* from the harness: it is the harness's own Claude Code configuration, not a general
dotfile. Extracting it would break the `~/.claude` chain for no benefit.

## Decision

Narrow this repo to: **one published plugin (`nxtlvl`) + the Claude Code config that backs it**.

Specifically:

- **Single published plugin.** `.claude-plugin/marketplace.json` lists exactly one plugin:
  `nxtlvl`. The `agent-dev` plugin (an ECC carve-out with no runtime dependency from nxtlvl —
  only `docs/` and memory references) is **demoted**: removed from `marketplace.json` (unpublished)
  but its source is **kept tracked** in `plugins/agent-dev/` as dormant reference, with a status
  banner added to its README. This mirrors the ADR-002 dormant-reference pattern exactly.

- **`config/claude/` stays.** It is the harness's own Claude config and the `~/.claude` symlink
  source (`link.sh` touches only this directory, never terminal dotfiles). Keeping it is coherent
  with a harness repo; pulling it out would force re-pointing the `~/.claude` chain for no benefit.

- **Terminal/editor dotfiles externalized.** `config/iterm2/` and `config/kitty/` were migrated
  to the canonical separate repo `will-schaefer/dotfiles` and removed from this repo via
  `git rm -r`. `config/helix/` was already a gitignored nested repo (never tracked here) and
  remains local-only. AI-tool scratch that had leaked into committed paths under
  `config/{iterm2,kitty}/.claude/.planning/.serena` was dropped — not migrated.

- **Remote renamed, local dir unchanged.** The GitHub remote was renamed
  `developer-config` → `nxtlvl-harness` (GitHub redirects the old URL). The local clone directory
  intentionally stays `~/Developer` — renaming it would break the `~/.claude` symlinks and the
  `-Users-willschaefer-Developer` project-memory path. Remote name and local directory name are
  allowed to differ.

Implementation committed as `b3c6da7 chore(repo): transition toward strict nxtlvl-harness repo`.

## Alternatives Considered

### Extract all of `config/` (including `config/claude`) to a dotfiles repo
- Pros: single dotfiles home; cleanest separation.
- Cons: `config/claude/` is the harness's own Claude Code configuration and the `~/.claude`
  symlink source; pulling it out would require re-pointing that chain with no semantic benefit.
  The harness config is not a general dotfile — it is the harness itself.
- Rejected.

### Keep all config in-repo; only delete scratch/cruft
- Pros: no migration effort; no risk of losing the terminal dotfiles.
- Cons: preserves the diffuse identity — the repo still carries terminal and editor config,
  obscuring that this is a harness repo. "Strict" requires an actual boundary.
- Rejected: not actually strict.

### Keep `agent-dev` published in marketplace.json
- Pros: immediately available without a manifest edit.
- Cons: dilutes the single-plugin identity; `agent-dev` has no runtime dependency from nxtlvl.
- Rejected in favor of demote-but-keep-source-tracked, so the carve-out stays reviewable without
  advertising it as a published plugin.

### Move `plugins/agent-dev/` source to `reference/` (effectively deleting it from the tracked tree, since `reference/` is gitignored)
- Pros: physically removes it from visible tracked paths.
- Cons: `reference/` is gitignored — moving there is a silent deletion from the repo. The dormant
  source would disappear from history and from the working tree, making the carve-out unreviable.
  Keeping it tracked in `plugins/agent-dev/` with a status banner is more honest.
- Rejected in favor of demote-but-keep-source-tracked.

### Rename the local `~/Developer` directory to match the new remote name
- Pros: consistent naming between remote and local.
- Cons: `~/.claude/*` symlinks point into `~/Developer/config/claude/`; the CC project-memory
  path is keyed on `-Users-willschaefer-Developer`. Both break on a rename.
- Rejected: remote name and local directory name are allowed to differ.

## Consequences

- **Single-plugin marketplace.** The published surface of this repo is exactly `nxtlvl`. Re-adding
  `agent-dev` to `marketplace.json` reactivates it; until then it is dormant but source-inspectable
  — consistent with the ADR-002 pattern for `ecc`.
- **Dotfiles live in `will-schaefer/dotfiles` (canonical).** This repo no longer carries terminal
  or editor configuration. The migration is complete; there is no partial state to manage.
- **`~/.claude` symlinks unaffected.** `link.sh` was not modified; the symlink chain remains.
- **GitHub auto-redirects `will-schaefer/developer-config` URLs** to `nxtlvl-harness` — no broken
  references in external bookmarks or CI.
- **`reference/ECC-main/` is unchanged** — still present as dormant review fuel per
  [ADR-002](ADR-002-ecc-dormant-reference-backstop.md).
- **`agent-dev` demotion follows the same dormant-reference pattern as ADR-002.** The README
  banner makes the status honest; no external consumer depends on it being published.
- Cross-links: [ADR-001](ADR-001-plugin-local-marketplace-packaging.md) (plugin packaged via
  local marketplace — the single-plugin constraint flows directly from this), [ADR-002](ADR-002-ecc-dormant-reference-backstop.md)
  (ecc installed-but-dormant — `agent-dev`'s demotion follows the same pattern).
