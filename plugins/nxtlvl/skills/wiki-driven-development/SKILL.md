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
past re-surveying those harnesses by hand every time something new gets built. Before now, using it
meant remembering to query it manually; this skill makes that step part of the build itself.

This is **orientation, not permission.** `nxtlvl-wiki` never blocks a build and never supplies
evidence for a decision — [ADR-002](../../../../docs/decisions/ADR-002-reference-corpus-nxtlvl-wiki.md)
settled that: "secondary sources orient; primary sources testify." What this skill adds is
*making the orientation step happen*, consistently, instead of relying on remembering to do it.

## When to Use

- Starting a new skill, agent, or command — before writing it, check whether `nxtlvl-wiki` already
  has a pattern for the kind of problem it solves.
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

## The Process

```
FRAME ──→ QUERY (via wiki-scout) ──→ WEIGH ──→ PROCEED
  │            │                       │           │
  ▼            ▼                       ▼           ▼
 What are    Spawn the read-only    Lead, near-   Build — informed,
 you about   scout, general or      miss, or      not blocked
 to build?   repo mode              nothing?
```

### Step 1: FRAME — name the candidate in one line

Before querying anything, write the one-line shape of what you're about to build or reconstruct —
the same discipline as a CLAIM in `doubt-driven-development`, but framed as a question the wiki
might already have an answer to:

```
CANDIDATE: a hook-layer dispatcher that fans out fail-open events to per-lane handlers.
QUESTION FOR THE WIKI: how have reviewed harnesses structured their hook/event layer?
```

If you can't state the candidate this compactly, it's too early to query — sharpen the idea first.

### Step 2: QUERY — spawn `wiki-scout`

Spawn the `wiki-scout` agent with `QUERY` (your one-line question) and `MODE`:

- **`general`** — "has anyone written about this kind of problem?" (concept/pattern pages).
- **`repo`** — "how does a specific real repo actually do this?" (entity pages + comparison
  overlays maintained by `nxtlvl-wiki:repo-keeper`). Use `repo` mode when the candidate names or
  implies a specific reference harness (ecc, agent-skills, superpowers, or any other ingested
  repo), or when you want to compare two repos' approaches rather than a synthesized pattern.

Both modes return the same shape: a lead-stamped orientation brief, never a verdict. Pass `wiki-scout`
only the `QUESTION FOR THE WIKI` line, not your full reasoning — same reason `doubt-driven-development`
strips reasoning before handing off to a fresh-context reviewer: a lead-generator that sees your
conclusion will just confirm it.

### Step 3: WEIGH — read the brief as leads, not a verdict

Every line in the brief is stamped `LEAD — verify at <slug>`. Treat each one as a pointer, not a
fact:

| What the brief says | What you do |
|---|---|
| Nothing relevant (corpus sparse or no match) | Expected today — proceed on your own judgment, as if you hadn't queried. |
| A near-miss pattern | Read the page (`get_page` via the lead) before deciding whether to borrow from it — the brief is a hypothesis, the page is what you actually judge. |
| A close match to something already covered | Verify it's really the same thing (not just similarly-named) before treating it as prior art; if it holds up, that's a build-vs-reuse decision for you, not the wiki. |

**Zero wiki claims reach an ADR, spec, or commit message as evidence** — same rule as ADR-002.
If a wiki-sourced pattern shapes what you build, cite what you verified at the primary
source (the actual reference repo, the actual page's cited `raw/` note), never "nxtlvl-wiki says."

### Step 4: PROCEED — build, informed

Whether the wiki surfaced something or came back empty, you proceed. The corpus being thin today
is a known, expected state ([ADR-026](../../../../docs/decisions/ADR-026-nxtlvl-wiki-mcp-source.md)) —
"no results" is a complete answer, not a blocker to work around.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I already know this domain, no need to check" | The point isn't your knowledge — it's whether a reviewed reference harness solved an adjacent problem in a way worth seeing before committing to a shape. |
| "The wiki is basically empty right now, why bother" | An empty result costs one scout spawn and returns instantly; skipping it silently means the corpus never gets the chance to actually help as it grows. |
| "This is too small to check" | Same instinct `doubt-driven-development` already rejects for doubt cycles — scale the check to the decision, but a new skill/agent/command is exactly the class of decision ADR-003 says should be source-driven. |
| "A lead came back, so I should use it" | A lead is a hypothesis, not a mandate. Verify at the primary source before it shapes anything real. |

## Red Flags

- Building a new piece of harness plumbing without ever having asked what `nxtlvl-wiki` knows about
  it.
- Treating a `wiki-scout` lead as settled fact and citing "nxtlvl-wiki says" in an ADR or commit.
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
- **`source-driven-development`:** complementary, not overlapping. That skill grounds a specific
  technical *claim about a library or framework* in official docs (via `context7-scout`); this
  skill orients a *design or build decision* against prior harness patterns (via `wiki-scout`).
  One verifies facts; the other surveys precedent.
- **`doubt-driven-development`:** orthogonal. This skill runs *before* or *during* building, to
  orient; doubt-driven runs on the resulting artifact, to find what's wrong with it.
- **`nxtlvl:documentation-and-adrs`:** if a wiki lead genuinely shapes an architectural decision,
  the ADR cites the primary source you verified, never the wiki brief itself.

## nxtlvl conventions

- **Pointers over dumped content** — the scout returns pointers (slugs, paths), not page dumps;
  keep it that way when relaying findings onward.
- **Surface assumptions** — if you skip this skill because you're confident you already know the
  domain, say so explicitly rather than silently proceeding, so a wrong assumption is visible.

## Verification

- [ ] The candidate was named in one line (a `CANDIDATE` / `QUESTION FOR THE WIKI` pair) before any
      query ran.
- [ ] `wiki-scout` was spawned with the right mode (`general` for patterns, `repo` for a specific
      reference harness or a comparison).
- [ ] Every returned lead was read as a hypothesis, not a fact — verified at the primary source
      before it shaped anything committed.
- [ ] Zero wiki claims reached an ADR, spec, or commit message as evidence.
- [ ] A sparse or empty result was treated as a complete answer, not a reason to stall or re-query.
