---
name: adr-numbering-collision-hazard
description: ADR numbers in the nxtlvl repo collide in BOTH directions — working-tree-only globs miss committed numbers, committed-tree-only checks miss uncommitted in-flight ADRs; verify against the UNION of both.
metadata: 
  node_type: memory
  type: project
  originSessionId: df828bd5-a951-4ac3-ae68-2548ff614ec1
---

When doc-keeper (or anyone) creates a new ADR in `docs/decisions/`, it picks the next number by scanning the working-tree files. This silently collides when a rebase, a stashed change, or a parallel branch has already claimed that number in the committed history but not in the current working view. This actually happened: a stash-pop left two ADR-013 files committed (confident-core + floor-on-demand) and doc-keeper then assigned ADR-014 on top of an already-committed ADR-014 (quality-first). Resolved 2026-06-19 by renumbering confident-core → ADR-016 and the session's load-rule ADR → ADR-015.

**Why:** the next-free-number check reads working-tree state, which diverges from committed/remote state during in-progress merges, stashes, or concurrent branches.

**How to apply:** before finalizing any new ADR number, check the **union** of committed tree AND working tree — the hazard runs both directions. Working-tree-only globs miss numbers claimed in committed history (the 2026-06-19 stash-pop incident above); committed-tree-only checks miss uncommitted in-flight ADRs (confirmed 2026-07-01: `git ls-tree HEAD` topped out at ADR-025, but an uncommitted ADR-026 from a parallel task sat untracked in the working tree — numbering by committed tree alone would have collided; doc-keeper checked both and correctly took ADR-027). E.g. `git ls-tree --name-only HEAD docs/decisions/` plus a plain `ls docs/decisions/`, take max+1 over both; confirm the number isn't on origin/main either. Also: before `git push`, verify the *committed* blobs are marker-free (`git show HEAD:<file> | grep -nE '^(<<<<<<<|=======|>>>>>>>)'`) — a `git commit --amend` will happily commit conflict markers. Relates to [[adrs-advisory-not-canonical]].
