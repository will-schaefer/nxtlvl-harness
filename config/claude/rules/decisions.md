# Decision rule

**Scope (Phase 0):** how a *genuinely architectural, expensive-to-reverse* decision gets
**made** and **recorded** (as an ADR). Everyday ask-vs-proceed is deliberately **out of
scope for now** — this rule is built to grow into a full decision-tier ladder later; today
it governs only the ADR-worthy top tier.

This rule is **mostly pointers**: it composes existing skills for the mechanics and owns only
three things they don't provide — the **threshold** (when), the **wiring** (how), and the
**format override** (what the ADR looks like).

## 1. When — the ADR-worthy test

Record an ADR **only** when a decision is *both*:

- **architectural** — it shapes structure, boundaries, or a hard constraint; and
- **expensive to reverse** — re-litigating it later costs real work.

**Not ADRs (don't dilute the set):**

- verified platform/implementation **facts** → they live in the **spec**;
- **methodology / sequencing / task order** → lives in the **plan**;
- everyday, easily-reversible choices → just proceed (no ADR).

**Domain grain (one major domain per ADR):** each ADR covers **one major capability domain**
(or one standalone hard constraint) — e.g. skill design/canonical format vs agent creation
process, not a separate ADR per every sub-question inside a domain. Related open questions
**fold into the domain ADR** as sections and are amended when they resolve. Open a **new**
ADR when the topic is a **different domain**, not the next bullet on the same contract.
Optional short **map** ADRs may only index domain ADRs. Still: not every config knob.
(Recorded for nxtlvl as `docs/decisions/ADR-029-atomic-adrs-one-decision-each.md`.)

Curation is the hard part. An ADR is for the decisions the project *is*, not every choice
made along the way.

## 2. How — made → recorded (compose, don't restate)

Use the existing skills for the mechanics; this rule adds only the order, not their internals.

1. **Underspecified intent?** → `/interview-me` (surface) / `/grill-me` (stress-test) until
   intent is sharp. Skip if it already is.
2. **Needs a written contract first?** → `/spec`. (Verified facts land here, not in an ADR.)
3. **Needs breakdown?** → `/plan`. (Sequencing lands here, not in an ADR.)
4. **Record the decision** → `/nxtlvl:documentation-and-adrs` (it bakes in the format below),
   applying the format override in §3.

## 3. Format override (the canonical format; `/nxtlvl:documentation-and-adrs` bakes it in)

This is the source of truth for the ADR format. `nxtlvl:documentation-and-adrs` is vendored to
emit it directly; the upstream `agent-skills` skill uses a `## Status` / `## Date` heading style
that this overrides:

- **YAML frontmatter:** `id`, quoted `title`, `status`, clean-ISO `date`; add
  `implementation:` when Accepted-but-build-deferred; `superseded-by:` when superseded.
- **Body:** an H1 title (for rendering), then **Context · Decision · Alternatives Considered ·
  Consequences**. Cross-link related ADRs.
- **Location:** `docs/decisions/` (relative to repo root) — sequential `ADR-NNN-slug.md`
  files + a `README.md` index table. *(project-overridable — see §4)*
- **Lifecycle:** superseded ADRs are **kept, never deleted** (`status: Superseded` +
  `superseded-by:`).

## 4. Layering (global default, project override)

This is a **global** convention — it applies to all my work by default. A project may, in its
own `./.claude/CLAUDE.md` or `./CLAUDE.md` (read **last**, so it wins on conflict):

- **rebind** the ADR location if `docs/decisions/` doesn't fit the repo, or
- **opt out** of ADR recording entirely, or
- **add** project-specific decision conventions.

"On by default everywhere" is safe because the ADR-worthy test (§1) is **self-limiting** —
repos with no architectural decisions simply never trigger an ADR.

## 5. Enforcement

- **In-session: advisory only.** The trigger nudges; nothing blocks. This is **never a session
  hook** — a buggy gate-hook could lock me out of my own daily driver.
- **Earmarked for the invoked `nxtlvl:audit`** (Phase ≥1), in two tiers consistent with the
  objective-gate discipline (block on facts, never on taste):
  - **ADR integrity → may BLOCK** (objective/binary): valid frontmatter, resolvable
    cross-links, README index matches files on disk, superseded ADRs have a live
    `superseded-by:`, no numbering gaps/dupes.
  - **ADR completeness → WARNING only**, never a blocker ("a decision may be unrecorded") —
    judging ADR-worthiness is taste, and the gate must never encode taste.

No enforcement machinery is built yet; this section *is* the spec the future audit consumes.

---

*Origin / rationale:* generalized from the nxtlvl ADRs — `docs/decisions/` ADR-003
(compose, don't reconstruct), ADR-007 (pointers-over-content context policy), ADR-009
(objective, invoked audit gate). Read those for the *why* before re-litigating this rule.
