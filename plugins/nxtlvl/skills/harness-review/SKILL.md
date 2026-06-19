---
name: harness-review
description: nxtlvl harness review — vendor an external harness/repo, fan out parallel read-only analysis, and distill a durable adopt/adapt/reject judgment into docs/reference/. USE THIS whenever an outside agent harness, plugin, subagent collection, or .claude/-style repo comes up as something nxtlvl might learn from — phrases like "review this harness", "what should we adopt from <repo>", "vendor and distill X", "let's study <owner/name> for nxtlvl", or any "should we copy how they do Y" about an external project. This is NOT code review of our own diff (that's nxtlvl:review) — it reviews someone else's harness to decide what nxtlvl should borrow.
---

# Harness Review — vendor → fan-out → distill

The mechanical realization of nxtlvl's build method: *systematically review existing harnesses and
decide, area by area, what to **adopt / adapt / reject**.* You vendor a repo as a disposable "book
on the shelf," fan out parallel read-only analysis over its independent subsystems, and distill the
findings into one tracked, citable judgment. Only the analysis is kept — the clone is throwaway.

The deep-dive report — full phase detail, every lesson, the worked example, the parameter table —
lives in [`references/harness-review-workflow.md`](references/harness-review-workflow.md). Read it
before your first run or when a phase below needs more than its summary. This body is the
executable spine; the reference is the rationale.

## When to use (and when not)

Use it when an **external** harness/repo needs a verdict on what nxtlvl should borrow. **Good
targets** (full pipeline): multi-component harnesses (hooks/agents/commands/skills) and substantial
subagent collections. **Poor targets** (skim or skip): "awesome" meta-lists, single-file gists —
they produce a short ledger, not a distillation. The adopt/adapt/reject test is self-limiting: a
repo with nothing transferable simply yields a thin result, so when in doubt, start and let the
findings decide.

This is **not** `nxtlvl:review` — that reviews *our own* diff across five axes before merge. This
reviews *someone else's* harness to mine it for patterns. If the user means "review my code," route
there instead.

## The contract — two inputs that decide everything

- **`REPO`** — the GitHub URL or `owner/name`.
- **`LENS`** — the specific nxtlvl surfaces this repo most plausibly informs. *This is the most
  important per-run parameter.* It is what turns a neutral code-read into an adopt/adapt/reject
  judgment: without it the fan-out returns a generic summary; with it, every finding gets mapped
  against a decision nxtlvl actually faces. State it explicitly before any work, and **ask the user
  if it's unclear** — don't guess a lens.

**Outputs:** the gitignored clone at `reference/<repo>-main/`; the tracked distillation at
`docs/reference/<repo>-distillation.md`; a `MEMORY.md` pointer + auto-memory file; and zero or more
ADR candidates when a finding rises to an architectural decision.

## The pipeline

Work the phases in order. Each phase's output feeds the next; the fan-out (Phase 3) is the one
parallel step.

**Phase 0 — Frame & select.** State `REPO` and `LENS` out loud. Apply the good/poor-target test and
decide go/skip. Everything downstream maps against the LENS, so pin it here.

**Phase 1 — Vendor ("book on the shelf").** Clone shallow, flatten, measure:
```
git clone --depth 1 https://github.com/<owner>/<repo>.git reference/<repo>-main
rm -rf reference/<repo>-main/.git        # flat tree, matches the ECC-main convention
du -sh reference/<repo>-main             # capture size
```
The clone needs network egress, so **run it with the sandbox disabled** — that's a harness/permission
action, so if you can't toggle it yourself, ask the user. The `rm -rf` only ever deletes the *fresh
clone's own* `.git`, so it is safe to run. `.gitignore` is
`/reference/*` with one tracked exception (`!/reference/ECC-main`), so new clones are local-only *by
design* — do not add a tracking exception; the distillation is the durable artifact, not the clone.

**Phase 2 — Structural map.** `find reference/<repo>-main -maxdepth 3` + read the README intro. Partition the
subsystems into **independently analyzable domains** (no shared state) so they can run in parallel.
For a `.claude/`-style harness the natural partition is roughly: (1) hooks/automation, (2)
agents/orchestration, (3) philosophy/docs/commands/periphery. Adjust to the repo's real shape; 2–4
domains is typical. This partition is the key design choice of the run.

**Phase 3 — Parallel fan-out analysis.** Dispatch one `general-purpose` agent per domain, **all in
one message** (compose `superpowers:dispatching-parallel-agents`). Every agent prompt MUST carry
these five elements — they are what make the fan-out produce decisions instead of summaries:
1. **Build-method context** — pass nxtlvl's "review harnesses to shape ours" framing along (the
   `CLAUDE.md` requirement when spawning subagents).
2. **Read-only mandate** — "modify nothing; your output is a digest the main session synthesizes."
3. **Scoped target** — the exact files/dirs this agent owns + the absolute repo path.
4. **The LENS** — the specific nxtlvl surfaces to map findings against (from Phase 0).
5. **Required output shape** — a structured markdown digest, every claim cited to `file:line`,
   **ending in an explicit Adopt / Adapt / Reject list**.

Agents return *conclusions, not file dumps* — that preserves the main thread's context for synthesis.

**Phase 4 — Synthesize.** Read the digests and find the **cross-cutting spine**: the single most
important finding. It is frequently *not* a feature to copy but a **contrast that confirms or
challenges a decision nxtlvl already made** — budget time for "what does this repo's stance reveal
about our existing choice?" Also **separate signal from demo**: teaching/demo repos ship deliberate
filler (toy apps, demo domains) that must not be mistaken for craft.

**Phase 5 — Distill.** Write `docs/reference/<repo>-distillation.md` in the house format, drafted
section-by-section (scaffold every header with a placeholder, then fill and review each in turn): a
dated blockquote header (what it is, what was analyzed,
Purpose, companion links); numbered `##` sections with verbatim quotes cited to `file:line`; a
consolidated **Adopt / Adapt / Reject ledger** mapped to nxtlvl surfaces; an **"Applying to nxtlvl"**
/ ADR-candidates close. Lead with the Phase-4 spine as the headline section.

**Phase 6 — Reader-test.** Dispatch a fresh-context agent to read the finished distillation cold:
does it stand alone, are the adopt/adapt/reject calls actionable, any unsupported claim or missing
citation? Fix what it surfaces.

**Phase 7 — Land it.** Add an auto-memory pointer + a one-line `MEMORY.md` index entry (per the
`distill-reusable-to-doc-plus-memory` memory note). For any finding that is **architectural and expensive to
reverse**, raise an **ADR candidate** via the decision rule
(`/interview-me`→`/grill-me`→`/spec`→`/plan`→`nxtlvl:documentation-and-adrs`). Curate hard — most
findings are notes, not ADRs.

## Knobs (what varies per run)

`REPO` and `LENS` are the two required inputs (see the contract above); domain partition (2–4),
fan-out agent count, signal-vs-demo filter, and distillation depth are the per-run knobs. The full
knobs table — each knob's "varies by" and default — lives in
[`references/harness-review-workflow.md`](references/harness-review-workflow.md) §5.

## Gotchas worth knowing before you start

The phases above already carry the recurring traps (the contrast-not-feature spine and the
signal-vs-demo split are Phase 4; the always-require-Adopt/Adapt/Reject rule is Phase 3 element 5).
The one that lives outside the phase flow:

- **Cross-check stale reference material** against current upstream docs before trusting it (a
  reviewed repo's own tables can be incomplete).

## Composes (don't reconstruct)

- Phase 3 → `superpowers:dispatching-parallel-agents`.
- Phase 7 → the decision rule (`~/.claude/rules/decisions.md`) + `nxtlvl:documentation-and-adrs`;
  the `distill-reusable-to-doc-plus-memory` memory note for the memory-pointer pattern.
- Cross-run → the `triangulate-three-harnesses-build-decisions` memory note: every distillation this
  skill produces is one of the three voices that practice weighs when a *build decision* (not a repo
  review) is on the table.
