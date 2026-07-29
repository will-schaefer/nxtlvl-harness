# Live rules — nxtlvl-core
# Injected automatically by the live-rules plugin. Global rules fire every prompt;
# scoped rules fire only when their files or keywords match. Keep each body tight — all rules
# matching one event share a ~10k-char injection budget. Anything above the first `---` fence is ignored.
# Edit freely; changes take effect on the next prompt. Commit this file so future sessions share it.
#
# Deliberately trimmed. This repo already carries a budgeted always-on context policy
# (CLAUDE.md plus the pointer files in config/claude/rules/), so the standard craft baseline is
# omitted here rather than duplicated. Only the self-improvement rule is always-on; the rest are
# scoped to the directories where they actually apply.

---
description: Self-improvement — turn friction into a fix that sticks
priority: 40
---
After finishing a chunk of work, take a beat: did you hit friction? Signs — you fumbled the stack or
its tooling, re-derived something that should've been written down, tripped over a missing or unclear
convention, guessed wrong about where code lives, or repeated a workaround. If so, don't just move on:
make that friction cheaper or impossible next time by improving the workspace itself.
- Wrong/missing convention → add or refine a **live rule** (scope it tightly).
- Stale or missing project knowledge → update the **codebase map** (`.claude/.codebase-info/`).
- A repeatable multi-step task you did by hand → propose a **skill** (via skill-creator).
- A durable project fact or decision → into **CLAUDE.md** or a map doc.
Keep it small and incremental — one improvement, not a rewrite. Do it as its own step/commit. If
nothing was off, skip it silently; don't manufacture busywork. For a deeper periodic pass, run `retro`.

---
description: Plugin sources are not live until deployed
globs: ["plugins/**"]
priority: 60
---
Editing a file under `plugins/` does **not** change the running harness. Plugin installs clone from
each repo's GitHub remote, never the local working tree — the `nxtlvl-dev` marketplace does not
bypass this. To make an edit take effect: commit → `git push origin main` →
`claude plugin update <plugin>@nxtlvl-dev` → restart affected sessions.
Contrast with `config/claude/rules/`, which is symlinked live into `~/.claude` and needs no deploy
step. Don't report a plugin change as working until it has been deployed and observed.

---
description: Architecture decision record discipline
globs: ["docs/decisions/**"]
priority: 60
---
- **Numbering:** take the next number from the union of committed *and* working-tree files in
  `docs/decisions/` — parallel sessions otherwise mint the same number. Check both before choosing.
- **Status changes are two edits, never one:** update the record's frontmatter `status:` field, then
  immediately update its row in `docs/decisions/README.md` so the index stays in sync. Verify with
  `grep -n 'ADR-NNN' docs/decisions/README.md`.
- **Superseded records are kept, never deleted** — set `status: Superseded` plus a `superseded-by:`
  pointer.
- **Domain grain:** one record per major capability domain. A related sub-question folds into the
  existing domain record as a section; a genuinely different domain gets a new record.
- Format and the record-worthy threshold live in `~/.claude/rules/decisions.md` — read it before
  authoring rather than reconstructing the format from memory.
