---
name: nxtlvl-ruflo-adr-distillation
description: adopt/adapt/reject of the ruflo-adr ADR plugin; its runnable verify.mjs is a working prototype of nxtlvl's planned §5 ADR-integrity audit
metadata:
  type: reference
---

Mode-B harness-review distillation of the **ruflo-adr** plugin (ruvnet/ruflo, v0.3.0) against
nxtlvl's decision-recording subsystem, at `docs/reference/ruflo-adr-distillation.md`. 5th
ruflo-flavored review (see [[nxtlvl-ruflo-distillation]], [[nxtlvl-ruflo-discovery-review]]).

**Spine = split-brain.** Two divergent ADR-lifecycle backends that can't see each other: the
surface (agent/command/REFERENCE) claims AgentDB causal-graph (`adr.md:14,30`); the only runnable
code (`import.mjs`/`verify.mjs`) writes a *different* `@claude-flow` CLI memory keystore
(`import.mjs:184`). An ADR made via `/adr create` is invisible to `adr-verify`. Rhetoric–wiring gap
IS the validation — same pattern as the parent ruflo distillation.

**Harvest is asymmetric.** The runnable `verify.mjs` is an accidental working prototype of nxtlvl's
*planned* §5 ADR-integrity audit → real **ADOPTS**: DFS supersede-cycle detector (`verify.mjs:62-82`),
two-tier exit contract (block on cycles / warn on dangling unless STRICT, `:118-121`), issue-number
false-positive sanitizer (`import.mjs:169-182`), argv-array `spawnSync` injection-safe idiom
(`:185-190`), typed `depends-on`/`amends` frontmatter fields. **ADAPT**: code-ADR drift detection
(grep ADR-IDs-in-source + git-blame-vs-acceptance-date) as a plain-script audit check, no DB, fixed
regex (theirs `[0-9]{3}` misses its own `ADR-0001`). Everything else **REJECTS = confirms locked
nxtlvl positions**: files-over-DB, scoped read-contracts (their agent = "All tools"),
single-source-of-truth (lifecycle encoded ≥3×, no router, template 3× drifting),
objective-gates-only (their `adr-review` flags taste as a "violation"), YAML frontmatter, the §1
threshold (their example = one boilerplate ADR-0001-per-plugin "for symmetry" = the dilution §1
forbids), and the logged numbering-collision hazard (working-tree-only `Glob`).

**Disqualifier to NOT copy:** `verify.mjs` fabricates a clean exit-0 from a missing/empty backend
(`:27`) — nxtlvl's audit must fail LOUD. Gaps ruflo doesn't cover (nxtlvl builds itself):
numbering gaps/dupes, README-index-vs-disk reconciliation. **No ADR** — audit-tactics + format-field
harvest; fold adopts into the future-audit plan when that work starts.

Promoted to the adopt backlog [[nxtlvl-harness-adopt-backlog]] as **RUFLO-01..05**: 01/02/05 under §5
ADR-integrity audit (DFS cycle detector / two-tier exit contract / cross-link sanitizer), 03 under §5
WARNING-tier (code-ADR drift detection), 04 under house ADR format §3 (typed `depends-on`/`amends`
fields). All `open`.
