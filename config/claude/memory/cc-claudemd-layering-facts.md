---
name: cc-claudemd-layering-facts
description: "CC platform facts — how CLAUDE.md / memory files load: global always-on, @import inlines, project loads last & wins, arbitrary ~/.claude files not auto-loaded."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 6ab596b9-0cf3-4631-8bc2-1091a664952c
---

Verified against the official CC memory docs (`code.claude.com/docs/en/memory.md`, 2026-06-17):

- **Global file:** `~/.claude/CLAUDE.md` is the user-level memory, **loaded into every session**
  regardless of project.
- **`@path` import = inlined + always-loaded:** an `@path/to/file` reference inside a CLAUDE.md
  expands the target's *contents* into context at launch (recursive). Use sparingly.
- **Plain path reference = on-demand:** mentioning a path in prose *without* `@` does NOT
  auto-load it; the model reads it only when relevant. This is the two-tier lever — a thin
  always-loaded trigger in CLAUDE.md + a larger procedure file read on demand.
- **Layering = concatenate, project wins:** all discovered CLAUDE.md files are concatenated (not
  override-merged), ordered filesystem-root → cwd, so project files are read **last** and
  effectively win on conflict. Recognized project paths: `./CLAUDE.md`, `./.claude/CLAUDE.md`,
  `./CLAUDE.local.md` (gitignored, appended last within a dir).
- **No magic auto-load:** arbitrary files under `~/.claude/` (e.g. `~/.claude/rules/`) are **not**
  auto-loaded — only CLAUDE.md / CLAUDE.local.md are, plus anything `@`-imported. (CC also has a
  separate path-specific "rules" feature that loads by file-path matchers — not used by the
  on-demand pointer pattern.)

**Why:** this is the mechanical basis for the ADR-007 budgeted-injection policy and the M1
layered-config milestone — it dictates what costs tokens every session vs. what's read on demand.

**How to apply:** put always-needed triggers in `~/.claude/CLAUDE.md` as plain pointers; keep
procedures in on-demand files; use `@import` only for content needed every session; rely on a
project CLAUDE.md to override globals. This is what placed the global decision rule
([[decision-recording-conventions]]). Relates to [[cc-context-hook-facts]] and [[nxtlvl-harness]].
