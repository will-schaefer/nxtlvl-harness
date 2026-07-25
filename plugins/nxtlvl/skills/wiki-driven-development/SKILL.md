---
name: wiki-driven-development
description: nxtlvl wiki-driven development — before building a new capability, workflow, or piece of harness plumbing, orients against nxtlvl-wiki's synthesized catalogue of production harness patterns via the read-only wiki-scout agent. Use when starting a new skill/agent/command, reconstructing a piece of harness machinery, or evaluating whether nxtlvl already covers something — anywhere ADR-003's "build from scratch, source-driven with nxtlvl-wiki as the source" doctrine applies. Formalizes that doctrine plus nxtlvl-labs' IDEAS.md idea A14 into an actual invokable step, not just prose intent.
---

# Wiki-Driven Development (nxtlvl)

Net-new — no upstream skill to vendor from. Formalizes [ADR-003](../../../../docs/decisions/ADR-003-build-from-scratch.md)'s
ruling ("workflows are built from scratch, source-driven with `nxtlvl-wiki` as the source") and
`nxtlvl-labs`' `IDEAS.md` idea **A14** into something actually invokable, composing the `wiki-scout`
agent ([ADR-026](../../../../docs/decisions/ADR-026-nxtlvl-wiki-mcp-source.md)). Self-contained — it
does not call any upstream skill.

## Overview

`nxtlvl-wiki` exists precisely so a new piece of the harness doesn't get built blind. It is a
synthesized, queryable layer over reference harnesses already reviewed and ingested — a shortcut
past re-surveying those harnesses by hand every time something new gets built.

The workflow is **question-driven**: every real framing session — with Codex, with `/brainstorm`,
with plain notes — already produces the most valuable artifact there is, a list of *specific open
design questions*. This skill captures that list, gets it approved by the user, answers it from the
wiki in clustered batches, and persists the answers alongside the user's eventual decisions in a
**framing doc**. The questions drive the wiki; the wiki never drives the decisions.

This is **orientation, not permission.** `nxtlvl-wiki` never blocks a build and never supplies
evidence for a decision — [ADR-002](../../../../docs/decisions/ADR-002-reference-corpus-nxtlvl-wiki.md)
settled that: "secondary sources orient; primary sources testify." What this skill adds is
*making the orientation step happen*, consistently, instead of relying on remembering to do it.

## When to Use

- Starting a new skill, agent, or command — before writing it, check whether `nxtlvl-wiki` already
  has a pattern for the kind of problem it solves.
- A framing session (Codex, `/brainstorm`, `/interview-me`, plain notes) just produced open design
  questions — catch them here before they evaporate.
- Reconstructing a piece of harness plumbing (context assembly, memory, hooks, composition,
  audit — the Layer-3 backlog in the domain map) — `nxtlvl-wiki` is the plumbing-guidance source
  ADR-002 names explicitly.
- Assessing whether `nxtlvl` already covers something, or a gap is real — `nxtlvl-wiki` is the
  reference standard ADR-002 names for coverage assessment.
- A `nxtlvl-labs` cell entering harness-lab's intake stage wants to check for prior art beyond its
  own in-repo overlap index — this is the wiki-sourced half of that check (the in-repo half is a
  separate, already-specced mechanism; see Interaction with Other Skills).

**When NOT to use:**

- The pattern is purely internal logic with no "how do other harnesses do this" dimension (a
  one-off bugfix, a rename, glue code with no design question behind it).
- The user explicitly wants speed over survey ("just write it, I know exactly what I want").
- The corpus has already been checked for this exact candidate earlier in the same session — don't
  re-query on every incremental edit to the same piece of work.
- A single one-off lookup mid-session — `nxtlvl-wiki:query` already covers that; this skill is for
  a framing pass with a real question list.

## The Process

```
FRAME ──→ QUESTIONS ──→ QUERY ──→ WEIGH ──→ PROCEED
  │           │            │         │          │
  ▼           ▼            ▼         ▼          ▼
 What are   Collect or   wiki-scout  Answers    Build —
 you about  draft the    per topic   into the   informed,
 to build?  list; user   cluster,    framing    not blocked
            approves     ≤5 each     doc; user
                                     decides
```

### Step 1: FRAME — name the candidate in one line

Before anything else, write the one-line shape of what you're about to build or reconstruct:

```
CANDIDATE: a hook-layer dispatcher that fans out fail-open events to per-lane handlers.
```

If you can't state the candidate this compactly, it's too early to query — sharpen the idea first.

### Step 2: QUESTIONS — collect or draft the list, then the user approves it

Two entry paths:

- **Handed in.** The user supplies the open questions from wherever framing happened — a pasted
  list, or a transcript you extract candidate questions from. Upstream tools (Codex, `/brainstorm`,
  `/interview-me`) are deliberately *not* changed; a plain question list is the only interface.
- **Drafted.** No list supplied → draft a situation-specific question list from the framing
  context.

Either way, normalize the list: **deduplicate**, **split compound questions**, and **prune**
questions with no "how do other harnesses do this?" dimension (pure preference questions never
reach the wiki).

Then the gate: **show the user the full result — surviving questions *and* pruned ones, each
pruned question with a one-line reason — and get approval or edits before any wiki spend. Nothing
is dropped silently.** Hard cap: **12 approved questions per pass** — over the cap, the user trims
or the pass is split.

### Step 3: QUERY — clustered `wiki-scout` spawns

Group the approved questions into **topic clusters** and spawn one `wiki-scout` per cluster —
**at most 5 questions per spawn**, clusters running in parallel. Questions in a cluster typically
hit the same wiki pages (fetch once, cite for all); unrelated topics stay out of each other's
context.

Each spawn's input is `QUESTIONS` — a numbered list, each question optionally tagged `repo:<name>`
to search the repo-reference layer (entity pages + comparison overlays); untagged questions search
the general concept/pattern pages.

**Anti-anchoring rule:** pass `wiki-scout` **only the questions — never your reasoning, your
preferred answers, or the user's leanings.** A lead-generator that sees your conclusion will just
confirm it. This matters more now than under the old one-line query: pointed questions already
reveal design shape; the reasoning behind them must not follow.

### Step 4: WEIGH — answers land in the framing doc

The scouts return per-question answer blocks — lead-stamped findings or an explicit `no coverage`
line. Fold them into a persisted **framing doc**:

- **Path:** `docs/framing/YYYY-MM-DD-<topic>.md` in the repo of the project *being built*.
  Name collision → `-2` suffix. If the project has no repo yet, the doc lands in `nxtlvl-lab`
  and moves when the repo exists.
- **Format:** a header (candidate line, date, question provenance), then one block per question:

  ```markdown
  ### Q3. How do reviewed harnesses structure their hook/event layer?
  **Wiki says:** fail-open dispatch is the common pattern — LEAD: verify at `hook-safety` (concept)
  **Decision:** (empty until the user fills it)
  ```

  Footer: leads are not evidence; any ADR or spec this feeds cites primary sources.

**The user fills every Decision line. The skill and the scout never do.**

Every wiki claim in the doc is stamped `LEAD — verify at <slug>`. Treat each one as a pointer, not
a fact:

| What the answer block says | What you do |
|---|---|
| `no coverage` (corpus sparse or no match) | Expected today — the user decides on their own judgment, as if the wiki hadn't been queried. |
| A near-miss pattern | Read the page (`get_page` via the lead) before deciding whether to borrow from it — the brief is a hypothesis, the page is what you actually judge. |
| A close match to something already covered | Verify it's really the same thing (not just similarly-named) before treating it as prior art; if it holds up, that's a build-vs-reuse decision for the user, not the wiki. |

**Zero wiki claims reach an ADR, spec, or commit message as evidence** — same rule as ADR-002.
If a wiki-sourced pattern shapes what you build, cite what you verified at the primary
source (the actual reference repo, the actual page's cited `raw/` note), never "nxtlvl-wiki says."

Framing-doc lifecycle rules:

1. **Back-link required.** The resulting spec or ADR must link back to its framing doc — that link
   is the provenance trail for "why did we choose X."
2. **Frozen once decided.** Once the Decision lines are filled, the doc is a historical record like
   an ADR: kept, never deleted, never edited into a second life.
3. **Framing is not intent.** Framing docs are per-build working records; `docs/intent/` docs are
   durable direction. Don't grow one into the other.

### Step 5: PROCEED — build, informed

Whether the wiki surfaced something or came back empty, you proceed. The corpus being thin today
is a known, expected state ([ADR-026](../../../../docs/decisions/ADR-026-nxtlvl-wiki-mcp-source.md)) —
`no coverage` is a complete answer, not a blocker to work around.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I already know this domain, no need to check" | The point isn't your knowledge — it's whether a reviewed reference harness solved an adjacent problem in a way worth seeing before committing to a shape. |
| "The wiki is basically empty right now, why bother" | An empty result costs a few scout spawns and returns quickly; skipping it silently means the corpus never gets the chance to actually help as it grows. |
| "The question list is obvious, skip the approval gate" | The gate is where pruned questions surface and the user redirects the spend. Skipping it silently drops questions the user may care about. |
| "Twelve questions, one spawn, saves cost" | Answer quality degrades across a long list in one context — that's why the cap is 5 per spawn. Cluster, don't cram. |
| "I'll fill in the obvious Decision lines to save time" | Decision lines are the user's, always. A pre-filled decision is anchoring in its purest form. |
| "A lead came back, so I should use it" | A lead is a hypothesis, not a mandate. Verify at the primary source before it shapes anything real. |

## Red Flags

- Building a new piece of harness plumbing without ever having asked what `nxtlvl-wiki` knows about
  it.
- Pruning or rewording a user's question without showing it at the approval gate — nothing is
  dropped silently.
- Passing the scout your reasoning or the user's leanings alongside the questions.
- Treating a `wiki-scout` lead as settled fact and citing "nxtlvl-wiki says" in an ADR or commit.
- Filling a Decision line yourself, or leaving the answers in chat instead of the framing doc.
- Re-querying the same candidate repeatedly within one session with no new information — that's
  stalling, not orienting.
- Padding a genuinely empty result into something that reads richer than the corpus actually
  supports.

## Interaction with Other Skills

- **In-repo overlap check (harness-lab, `nxtlvl-labs`):** this skill's wiki-sourced discovery is a
  *sibling*, not a replacement, for `nxtlvl-labs`' own in-repo overlap index
  (`docs/superpowers/specs/2026-06-29-capability-creation-process-design.md`'s Stage 1). That
  mechanism checks "does this already exist in this repo or the shipped plugin" deterministically;
  this skill checks "has a reviewed reference harness already solved something like this."
  Different corpora, same stage.
- **Upstream framing tools (Codex, `/brainstorm`, `/interview-me`):** deliberately untouched. They
  produce questions in whatever form they produce them; a plain question list (or a transcript to
  extract one from) is this skill's only interface to them.
- **`source-driven-development`:** complementary, not overlapping. That skill grounds a specific
  technical *claim about a library or framework* in official docs (via `context7-scout`); this
  skill orients a *design or build decision* against prior harness patterns (via `wiki-scout`).
  One verifies facts; the other surveys precedent.
- **`doubt-driven-development`:** orthogonal. This skill runs *before* or *during* building, to
  orient; doubt-driven runs on the resulting artifact, to find what's wrong with it.
- **`nxtlvl:documentation-and-adrs`:** if a wiki lead genuinely shapes an architectural decision,
  the ADR cites the primary source you verified, never the wiki brief itself — and the ADR links
  back to the framing doc it grew out of.

## nxtlvl conventions

- **Pointers over dumped content** — the scout returns pointers (slugs, paths), not page dumps;
  keep it that way when relaying findings into the framing doc.
- **Surface assumptions** — if you skip this skill because you're confident you already know the
  domain, say so explicitly rather than silently proceeding, so a wrong assumption is visible.

## Verification

- [ ] The candidate was named in one line (`CANDIDATE:`) before any questions were collected.
- [ ] The question list was normalized (deduplicated, compound questions split, non-harness
      questions pruned) and the user approved it — **pruned questions shown with reasons, nothing
      dropped silently** — before any scout spawned.
- [ ] At most 12 approved questions in the pass; at most 5 questions per `wiki-scout` spawn,
      grouped by topic cluster.
- [ ] The scouts received only the questions — no reasoning, no preferred answers.
- [ ] Every answer landed in the framing doc (`docs/framing/YYYY-MM-DD-<topic>.md` in the target
      repo; `-2` suffix on collision; `nxtlvl-lab` when no repo exists yet), each wiki claim
      stamped `LEAD — verify at <slug>`, each `no coverage` recorded as-is.
- [ ] Every Decision line was left for the user — none pre-filled.
- [ ] The spec or ADR that came out of this build links back to the framing doc.
- [ ] Zero wiki claims reached an ADR, spec, or commit message as evidence.
