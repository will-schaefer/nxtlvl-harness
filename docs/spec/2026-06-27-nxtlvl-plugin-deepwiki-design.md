# Design: nxtlvl Plugin DeepWiki (Internal Milestone Snapshot)

Date: 2026-06-27
Status: Approved

## Goal

Create a comprehensive, hand-curated internal documentation artifact — a wiki-style snapshot — of the current state of the `plugins/nxtlvl/` Claude Code plugin. The artifact is read-oriented, file-by-file, and intended as a milestone reference rather than a living build target.

## Scope

- Covers every component currently in `plugins/nxtlvl/`:
  - plugin manifest and MCP configuration
  - agents
  - commands
  - hooks (registry + implementations + evals)
  - shared libraries (`lib/`)
  - skills
  - scripts
  - bundled references
- Stamped with the current date and commit hash so it reads as a historical snapshot.
- Links to relevant ADRs and intent docs where they explain the rationale behind a component.
- Does not cover `reference/ECC-main/`, `sandbox/`, or other plugins unless the plugin depends on them explicitly.

## Out of scope

- Auto-regeneration or CI integration.
- Tutorials or user-facing marketing copy.
- Full duplication of file contents; the wiki summarizes and points.
- Claims about future plans unless they are explicitly documented in the code as TODOs.

## Location

The artifact lives in a new directory:

```
docs/deepwiki/
```

This keeps the wiki distinct from the build-oriented `docs/spec/`, `docs/plan/`, and `docs/decisions/` directories while remaining part of the repo's documentation tree.

## Page inventory

| Page | Coverage |
|---|---|
| `index.md` | Wiki purpose, snapshot date/commit, navigation, top-level plugin summary |
| `manifest.md` | `plugin.json`, `.mcp.json`, and how the plugin is packaged |
| `agents.md` | Every agent in `agents/`: description, purpose, model, key contract |
| `commands.md` | Every command in `commands/`: trigger, purpose, typical flow |
| `hooks.md` | `hooks.json` orchestration, each hook implementation, lifecycle, kill switches, evals |
| `lib.md` | Every shared library in `lib/`: responsibility, exports, tests |
| `skills.md` | Every skill in `skills/`: what it does, when it fires, key files |
| `scripts.md` | `scripts/install-nxtlvl.sh`, `scripts/project-snapshot.sh` |
| `references.md` | `references/context7-grounding.md` and other bundled reference material |
| `state-at-a-glance.md` | Component counts, health snapshot, and a "what exists vs. what is still skeleton" summary |

## Content contract per page

Each page uses the same scannable template:

1. **Purpose** — one paragraph explaining what the domain is and why it exists in the harness.
2. **Files** — a table of `file` → `role` with paths relative to `plugins/nxtlvl/`.
3. **Contracts** — for each file: inputs, outputs, invariants, thresholds, defaults.
4. **Configuration / kill switches** — env vars, toggles, timeouts, or settings that control behavior.
5. **Tests** — what is tested and any gaps.
6. **Dependencies** — other plugin components or external services relied upon.
7. **Relevant ADRs / intent** — links to `docs/decisions/` or `docs/intent/` where the rationale lives.
8. **Open questions / TODOs** — unresolved items visible in the code or comments.

Tone: factual, concise, and reference-oriented. No tutorials, no promotional language.

## Verification

The implementation pass will:

- Read every file in `plugins/nxtlvl/` before summarizing it.
- Cross-check file lists and counts against the live tree.
- Use `<ref_file ... />` and `<ref_snippet ... />` citations where a specific claim needs grounding.
- Mark stubs, empty files, or TODO-only files explicitly so the snapshot does not overstate completeness.
- Summarize rather than paste full file contents.

## Maintenance / snapshot nature

- This is a **milestone snapshot**, not a live mirror.
- It is stamped with the date and commit hash in `index.md`.
- When the plugin changes significantly, a new snapshot is created manually or via a future generator; this one remains a historical reference.
- No build, test, or CI automation is tied to the wiki.

## Approach

**Curated manual snapshot (Approach 1).** I will read each component, write the wiki pages by hand, and verify claims against the source tree. This is the recommended approach for a one-time, high-quality milestone artifact.

## Open questions

None at design time; the scope, structure, and content contract were approved in the brainstorming session.
