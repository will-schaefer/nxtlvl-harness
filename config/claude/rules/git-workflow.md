# Git workflow rule

**Scope:** commit and PR conventions for any work that lands on GitHub.

## Pointers

- Operating knowledge (the built source): the **`nxtlvl:github-workflow`** skill — the
  branch → commit → PR → review → CI → merge loop, refined for my conventions.
- Formal record: `~/Developer/nxtlvl/nxtlvl-core/docs/decisions/ADR-017-git-workflows-domain.md` — its
  `## Decision` section is fully written (the three-layer command → agent → skill shape);
  only the frontmatter `status` hasn't been bumped from `Draft` yet.

## Triggers

- Committing? Use **Conventional Commits** (`type(scope): subject`) and put **no AI
  attribution** lines in commits or PRs.
- Finished a logical change? **Commit it now** — verified work never sits uncommitted in the
  tree, where a parallel session's bulk checkpoint can absorb it.
- Pausing, switching tasks, or handing off with work in flight? Checkpoint it:
  `chore(wip): <slug> — <state>`, staged **explicitly** (never `git add -A`); squash-merge
  erases checkpoints before they reach `main`.
- Opening a PR? **Draft-PR-first**; keep bodies pointers-over-dumps.
- Edited a plugin source (`plugins/nxtlvl*`)? The change is **not live until deployed**:
  commit → `git push origin main` → `claude plugin update <plugin>@nxtlvl-dev` → restart
  sessions. Plugin installs clone from the GitHub remote (origin/main), never the local
  working tree — the `nxtlvl-dev` "local" marketplace does not bypass this. Rule files
  (`config/claude/rules/`) are the opposite: symlinked live, no deploy step.
