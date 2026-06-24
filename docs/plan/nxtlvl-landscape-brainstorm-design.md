# landscape-brainstorm — design brief (in progress)

**Status:** brainstormed + partially grilled · **pre-spec** (stopped mid-grill, not yet a contract)
**Date:** 2026-06-24
**Owner skill target:** `plugins/nxtlvl/skills/` (build in `sandbox/skills/` first, promote via `git mv`)
**Tracking issue:** [developer-config#24](https://github.com/will-schaefer/developer-config/issues/24)

> This is a frozen capture of an in-progress design so the thinking survives the
> session. It is **not** the spec. The spec gets written by
> `spec-driven-development` only after the open grill branches below are resolved.

## Problem

The nxtlvl `brainstorming` front door narrows scope too early. When the idea is a
*landscape* of related streams (e.g. "brainstorm all the streams in nxtlvl-labs"),
the session gets railroaded into designing **one** stream. Two halves to the pain:

1. The skill **picks the altitude for you** (dives into a single piece).
2. The **other streams evaporate** once it dives — nothing persists them.

Root cause (diagnosed): the brainstorming skill *already* has a scope-triage step,
but its hardcoded response is "decompose into subsystems, then brainstorm piece #1."
That auto-narrow **is** the bug. Detection exists; the reflex is wrong.

## Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | **Topology** | **C** — a new `landscape-brainstorm` skill **plus** a thin altitude seam in the brainstorming front door. Single entry point; clean separation. Matches how brainstorming already composes `interview-me` / `grill-me` / `idea-refine` / `spec`. |
| 2 | **What a landscape session produces** | The **map IS the artifact + durable backlog**. A portfolio doc (streams + relationships + shared substrate + sequencing) where each stream carries a status. Generic to any project — no dependency on labs-specific files (`inbox.md`/`ledger.md`). |
| 3 | **Visual** | The skill also renders a **stream-map visual** (like the brainstorming skill already renders structural things). Doc is source of truth; visual accompanies it. |
| 4 | **Handoff** | Pick one stream → it enters the normal per-stream `design → spec → plan`. The rest stay **queued** in the map. Reopen the map next session to pick the next. |
| 5 | **Name** | `landscape-brainstorm` |
| 6 | **Triage fate** (grill Q1) | **Replace** the front door's "decompose into subsystems" step. Multiplicity is one phenomenon with one response: ask "map the whole, or dive into one piece?" → route to `landscape-brainstorm` (which **scales down** to a few lines for trivial cases) or the normal flow. Nothing to misclassify. |

## The map artifact (shape)

A portfolio map. Each stream is a row with a status from the vocabulary
**diving / queued / parked / shipped**. Example (nxtlvl-labs, the motivating case):

| Stream | Role | Status |
|--------|------|--------|
| evals-lab | scores agent outputs | diving now |
| agents-lab | incubates → graduates cells | shipped |
| labs app | visual control panel over both | parked |

Plus: **relationships** (e.g. evals-lab scores feed the agents-lab graduation gate)
and a **shared substrate** (`bin/` runners · `manifest.yaml` · ledger · seam-contract ·
sandbox → promote). The rendered visual shows the rows as cards on the substrate, with
relationship arrows and a status legend.

## The seam (front door change — small)

On a multiplicity hit, the brainstorming front door asks **"map the whole landscape,
or dive into one piece?"** and routes accordingly. It never silently picks. The
existing detection stays; only the response changes (auto-narrow → ask-then-route).

## Open grill branches (resume here)

Stopped mid-grill after Q1. Remaining branches to stress-test before `/spec`:

1. **Resume loop** — when you return to pick stream #2, how does the half-finished map
   reopen? Does the front door detect an existing map in `docs/` and offer to resume,
   or is it a separate command? *(recommended: front door detects an existing landscape
   map and offers resume — no new command surface.)*
2. **Detection cues** — what exactly counts as a "multiplicity hit"? (collection nouns,
   "all the…", "across", plurals, ≥N independent pieces). Tune to avoid false positives
   (annoying altitude prompt on every multi-part feature) and false negatives (singular
   phrasing of a landscape idea).
3. **Map location & format** — `docs/landscape/` vs `docs/intent/` vs `docs/plan/`;
   markdown table as source of truth, visual regenerated on demand (not a saved-and-stale SVG).
4. **Status transitions** — who marks a stream `shipped`, and when? Manual vs derived
   from per-stream spec/plan existence. Guard against map rot.
5. **Map ↔ per-stream artifacts** — should the map link out to each stream's spec/plan so
   it becomes an index? (value vs coupling.)
6. **Recursion guard** — a stream could itself be a landscape. Flatten / disallow nesting
   (cf. anti-recursion guard, TREL-03).
7. **Boundary vs `idea-refine`** — refine = variants of ONE idea; landscape = MANY related
   streams. Make the router boundary explicit so it doesn't mis-route.
8. **MVP scope (YAGNI check)** — is durable backlog + status + visual + auto-resume all
   needed for v1, or is the thin MVP = map doc + visual + manual status, resume deferred?
9. **Coexistence with labs `inbox.md`/`ledger.md`** — does a labs landscape map duplicate
   or supersede those? (Decision #2 chose generic; reconcile the overlap.)

## Next steps (pipeline)

1. Finish grilling the branches above.
2. `spec-driven-development` → contract in `docs/spec/`.
3. `planning-and-task-breakdown` → ordered tasks.
4. Build `landscape-brainstorm` in `sandbox/skills/`; edit the brainstorming seam; wire the
   router + floor brief (skills don't fire by description alone — needs floor-brief entry).
5. Promote via `git mv` when ready.

## ADR note

Likely **not** ADR-worthy on its own — a reversible extension of the established
front-door compose-and-route pattern (ADR-003). Record an ADR only if grilling surfaces a
genuine architectural commitment (e.g. a new persistent artifact class under `docs/`).
