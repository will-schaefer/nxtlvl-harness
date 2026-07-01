# Git workflow rule

**Scope:** commit and PR conventions for any work that lands on GitHub.

## Pointers

- Operating knowledge (the built source): the **`nxtlvl:github-workflow`** skill — the
  branch → commit → PR → review → CI → merge loop, refined for my conventions.
- Formal record: `~/Developer/nxtlvl/docs/decisions/ADR-017-git-workflows-domain.md` — its
  `## Decision` section is fully written (the three-layer command → agent → skill shape);
  only the frontmatter `status` hasn't been bumped from `Draft` yet.

## Triggers

- Committing? Use **Conventional Commits** (`type(scope): subject`) and put **no AI
  attribution** lines in commits or PRs.
- Opening a PR? **Draft-PR-first**; keep bodies pointers-over-dumps.
