---
name: nxtlvl-ruflo-discovery-review
description: Mode-C harness-review of ruflo's discovery/brainstorming/exploration/ideation capability — where the good-in-parts/broken-as-a-whole verdict lives.
metadata:
  type: reference
---

Mode-C (Domain Review, feature-spanning) audit of ruflo's discovery/brainstorming/exploration/
ideation capability at `docs/reference/ruflo-discovery-review.md` (analyzed 2026-06-19). Companion to
the whole-repo Mode-B [[nxtlvl-ruflo-distillation]] (`docs/reference/ruflo-distillation.md`).

**Method:** scoring spine = `agents` rubric (the capability is *delivered* by subagents); skills /
commands / SPARC-methodology-as-rule assessed via their own rubrics' dominant dimensions; cross-wiring
treated as the central composition finding. 3-agent fan-out (agents · skills+rule · commands+wiring) +
cold reader-test (14 citations verified).

**Headline — strong in parts, broken as a whole (≈3/5):** ruflo has NO brainstorming/ideation domain.
The discovery capability is encoded **~5 times with no source of truth and no intent router** — a
legacy `.claude/` SPARC stack that is **byte-identical triplicated** into `v3/@claude-flow/{cli,mcp}/`,
an `.agents/skills/` persona copy, and the marketplace-shipped `plugins/ruflo-{sparc,goals,core}`
generation; only the last ships, but legacy is never retired (3 concurrent ways to invoke SPARC, none
canonical). Two systemic defects cut across even the good parts: **(1) tool-grant over-privilege** —
12/14 discovery agents declare no `tools:` → inherit Write/Edit/Bash despite read-only charters (only
`nested-researcher`/`nested-queen-researcher` scope grants, proving they know the fix); **(2) SPARC
"specification-first" doctrine is never asserted as a loaded rule** — CLAUDE.md lists SPARC only as
agent *names* (`:537-538`), so explore-before-build is opt-in skill text, not enforced behavior.

**The ideation surface specifically is the WEAKEST part** — SPARC `innovator`/`researcher` are
frontmatter-less docs (undiscoverable, uninvokable). **High-water mark worth mining:** the new
`ruflo-goals` research trio (`deep-research → research-synthesize → dossier-collect`) + `nested-*`
agents — real procedures, evidence-grading rubrics, typed return contracts, sibling-disambiguating
triggers, hard budget gates ("never silently truncate"). `deep-research` is a real 8-step procedure
(gap: no adversarial claim-verification). But the two halves of "explore before build" live in
non-cross-referencing plugins — `sparc-spec` re-derives requirements instead of composing
`deep-research`.

**Lesson for nxtlvl's [[nxtlvl-ideation-domain-status]]:** a capability is only as good as the routing
between its copies — ruflo has none, and the front-door/router absence is exactly what nxtlvl's
router-wired ideation front-door is built to avoid. Mine the goals-trio composition patterns; the
over-grant + untriggered-doctrine + N-copy-drift are the cautionary contrasts. NO ADR (review, not a
decision). 5th ruflo lens (after the 3-lens Mode-B distillation).
