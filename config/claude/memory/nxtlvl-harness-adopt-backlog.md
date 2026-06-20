---
name: nxtlvl-harness-adopt-backlog
description: the live cross-harness staging ledger where every harness-review's ADOPT/ADAPT findings land, grouped by target surface with stable IDs
metadata:
  type: project
---

The **adopt/adapt backlog** at `docs/plan/nxtlvl-harness-adopt-backlog.md` is the single live staging
area for ADOPT/ADAPT findings harvested from harness reviews. It exists so that when you build an
nxtlvl surface (e.g. the §5 ADR-integrity audit), every finding that informs it is in one file, not
scattered across six distillations.

**Why:** distillations ([[nxtlvl-ruflo-adr-distillation]] and siblings) are per-harness and
read-once; the backlog is per-target-surface and burned down over time. Stable IDs make findings
cross-linkable from memory, plans, and ADRs.

**How to apply:**
- Every `/harness-review` (Mode B) appends its **ADOPT/ADAPT rows only**, grouped under the matching
  **target surface** heading (new heading if the surface is new). **REJECTs do NOT land here** — they
  stay in the distillation as evidence; promote a reject only as a one-line **doctrine note** when the
  same contrast recurs across ≥2 harnesses.
- ID = `<HARNESS-ABBREV>-NN`, assigned once, never reused (register the abbrev in the file's table).
- Status lifecycle: `open → planned` (folded into a /plan) `→ landed` (link commit/PR/ADR) `→ dropped`
  (keep the row + reason). Not a checkbox.
- An ADOPT that is **both architectural and expensive-to-reverse graduates to an ADR** (per
  [[decision-recording-conventions]] / ~/.claude/rules/decisions.md); status becomes `landed → ADR-0NN`.
  Most rows never graduate — they're hygiene/tactics, and that's fine.
- **Curate hard** — its value is being short and live; a dump of every finding stops being actionable.

Seeded 2026-06-20 with ruflo-adr **RUFLO-01..05** — RUFLO-01 (DFS cycle detector) / RUFLO-02 (two-tier
exit contract) / RUFLO-05 (cross-link sanitizer) under §5 ADR-integrity audit; RUFLO-03 (code-ADR
drift detection) under §5 WARNING-tier; RUFLO-04 (typed `depends-on`/`amends` fields) under house
ADR format (§3) — all `open`. Also carries a Trellis review (TREL-01..15) and a doctrine-notes
section (recurring REJECT contrasts confirmed across ≥2 harnesses).
