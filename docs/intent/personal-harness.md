# Intent: `nxtlvl` — A Production-Grade Agent Harness to Build an AI Agent Business On

> Confirmed statement of intent. **Re-derived via `interview-me` (2026-06-28).** Supersedes the
> 2026-06-16 snapshot (produced via `interview-me` + a 20-question `grill-me` pass), whose
> *mechanism layer* — the fallback-rate metric, ecc-as-dormant-backstop, and the fallback-fed
> intake gate — was overtaken by the build itself and by [ADR-002](../decisions/ADR-002-reference-corpus-nxtlvl-wiki.md).
> The prior version is recoverable in git history. **Status:** confirmed intent; a `grill-me`
> hardening pass is the natural next step before this is treated as locked. This is the anchor the
> build is measured against. Downstream specs/plans consume it.

## One-line stack

**`nxtlvl-wiki` = the sole reference corpus / production bar · native Claude Code = the platform I compose on *and* the runtime backstop, never reconstruct · `nxtlvl-labs` = the incubation / creation plugin where agent harnesses, multi-agent teams, skills, commands, MCP servers, and plugins are built end-to-end through source-driven development, then promoted to the core plugin · `nxtlvl` = the production-grade plugin I build, own, and run daily — the engine for an AI agent business.**

## Name

- **`nxtlvl`** — namespace `nxtlvl:<skill>` / `nxtlvl:<agent>`. Theme: a harness for building
  *next-level agents*. Chosen to scan cleanly against other harness namespaces and to avoid
  colliding with `next` (Next.js is in the workload).

## Confirmed intent

- **Outcome:** A **top-tier, production-quality personal agent harness** (`nxtlvl`) I own to the
  metal and run daily — the **force-multiplier engine I use to generate income and build
  businesses.** Initially a *personal* competitive edge; **with the potential to become a product
  itself** (option kept open, not pursued now).
- **User:** Me — primary user, beneficiary, and daily driver, across my real income-generating work.
- **Why now:** I lost my job (≈2026-06-21) and I am **strongly considering starting my own AI
  agent company.** `nxtlvl` is the **foundation I would build that company on** — the
  production-grade engine I would use to deliver agent work and stand the business up. Getting its
  shape right *now*, before the build goes further, is the moment that matters: the harness has to
  be good enough to **bet a company on.**

## Purpose & stakes

This is no longer a learning project. **Learning-by-building has been demoted from *goal* to
*method*** — I still learn new areas (plumbing and workflow substance alike) by working through them
in source-driven development (copying or creating as justified), but the *why* is commercial leverage,
not understanding for its own sake. A learning project tolerates churn
and rough edges; a **company foundation does not.** That raised risk profile is what justifies the
reshape in this document: the original "walking-skeleton, whitelist-not-full, learn-by-building"
posture was right for a lower-stakes exercise, but a foundation you bet a company on needs the
**complete architecture mapped up front** (so I know what I'm missing before a client does) and a
**hard production-quality floor.**

The "potential to be a product itself" now has a concrete vehicle: **the AI agent company.**
`nxtlvl` is my private force-multiplier *and* plausibly the core IP / delivery engine of that
company. So "don't foreclose productization" carries real weight — **clean boundaries, no
personal-only lock-in baked into the core.**

## Success — two signals, no automatic metric

The thing I measure the build against is **whether the harness carries the work I'd build a business
on, at a quality I'd put my name to.** Concretely:

- **Lived signal (felt, continuous):** the harness carries my real production workload
  end-to-end — Next.js/TS, Python, Rust, knowledge-base construction, LLM-wiki construction,
  and agentic engineering — **without me routing around it into raw native-CC workarounds** to get
  the job done. When nxtlvl doesn't cover something, I notice the drop-out; that's the signal.
- **Periodic signal (deliberate):** a **deliberate coverage assessment against `nxtlvl-wiki`'s
  production bar** ([ADR-002](../decisions/ADR-002-reference-corpus-nxtlvl-wiki.md)) — judgment-assisted,
  run at a chosen cadence, comparing what production harnesses cover against what `nxtlvl` actually
  covers — shows no embarrassing gaps.
- **Quality never drops.** Production quality is what the income rides on, so a falling-coverage
  signal that comes *with* dropping quality means I'm white-knuckling a real gap, not succeeding.

There is **no hook-instrumented north-star number.** An automatic proxy measures a signal once
removed from actual coverage and is gameable; a deliberate assessment against a reference standard is
more honest ([ADR-002](../decisions/ADR-002-reference-corpus-nxtlvl-wiki.md)). *(This replaces the
prior anchor's fallback-rate metric, which was structurally welded to the now-removed
ecc-dormant-backstop model and is dropped.)*

## Build posture: map the whole, build it reactively

**Map first, fill reactively.** Up front, as part of the planning this intent feeds, outline a
**pretty-complete agent-harness architecture** — the components and areas a production harness needs.
That outline + spec is the **standing reference framework: the coverage map.** It is *not* a
commitment to build all of it.

Then **build incrementally and reactively against the map** — start from a thin working slice and
thicken; build by priority; and stay **open to additions discovered mid-build.** The map tells me
*what could exist and what I'm missing*; reactive growth governs *what gets built, and when*.

This is the one place the new anchor **inverts** the old one. The 2026-06-16 version was deliberately
anti-completeness ("a whitelist, not full"; "everything else stays empty"). That conflated two
different things — *don't map it all* and *don't build it all*. This version **splits them: map it
all, build it reactively.** The complete map is precisely what the deliberate coverage assessment and
`nxtlvl-wiki` need something to measure against — you cannot assess gaps without a picture of full
coverage.

## The build, in three layers: source-driven above the loop, native at the loop

- **Plumbing layer → source-driven, copy-or-create as justified.** The machinery native CC
  doesn't hand me: plugin packaging + layered config, **context assembly/injection**, **memory**
  (extending native CC), a lean **hook** layer, and the **audit**. Researching these options and
  owning the chosen implementation is how I earn the right to trust and extend an engine I'll bet
  income on. *(Much of this is now built; the architecture map will surface the areas that aren't.)*
- **Workflow layer → source-driven, copy-or-create as justified (`nxtlvl-wiki` is the source).** Dev,
  review, research, and documentation workflows are **built through source-driven development** —
  we copy a reference when source-driven exploration shows it is the best option, or author our own
  when we identify a better one. The method is **source-driven development**: each workflow grounds its
  design in `nxtlvl-wiki` *before* it's written — how reviewed production harnesses approach that
  area ([ADR-002](../decisions/ADR-002-reference-corpus-nxtlvl-wiki.md)), verified at primary source —
  then nxtlvl's version is authored, copied, or adapted as justified and owned end-to-end. Ownership
  comes from the source-driven reasoning and the ability to modify, not from original authorship of
  every line (build method: [ADR-003](../decisions/ADR-003-build-from-scratch.md), currently being
  revised).
- **Orchestration → native, always.** Skill routing, agent dispatch, the tool-use loop, and
  context-window assembly live below the plugin boundary and **must not be reconstructed** — a
  hand-built router is structurally a slower, capped shim around the real dispatcher. Deterministic
  multi-agent control uses the native `Workflow` tool.

**Operating model → orchestrator + specialists.** The main session is a *lean orchestrator*: it
holds the task and the context budget and delegates specialized work to subagents chosen by the
present task. This rides on the **native** dispatch primitive — I own *which* specialists exist and
*when* to delegate; the dispatch underneath stays native. Specialists are **scoped** to my actual
stacks (Next.js/TS, Python, Rust + cross-cutting general agents + agent-building) and **grow
reactively.** Delegation is also context preservation: heavy work runs in an isolated subagent
context, keeping the orchestrator lean.

## Reference standard & runtime backstop

- **`nxtlvl-wiki` is the sole reference corpus** — a queryable knowledge layer over reviewed
  production harnesses (ecc, agent-skills, and others, ingested as source material). It is the
  **production bar** the build is held to, and the standard the coverage assessment measures against.
  Its output is **orientation and leads, never evidence**: every build decision is verified at
  primary source; no wiki claim reaches an ADR directly ([ADR-002](../decisions/ADR-002-reference-corpus-nxtlvl-wiki.md)).
- **Native Claude Code is the runtime backstop.** When `nxtlvl` doesn't cover something, native CC
  fills the gap — *not* a dormant fallback plugin.
- **ecc is ingested corpus only — not an installed dormant plugin.** *(This replaces the prior
  anchor's "ecc = dormant reference + backstop"; the dormant-plugin model was explicitly rejected in
  [ADR-002](../decisions/ADR-002-reference-corpus-nxtlvl-wiki.md).)*

## Growth & anti-explosion — the loop that actually holds

The growth loop:

1. **Gap in real work** → handle it in native CC / hand-roll it to get the job done.
2. **If it recurs** → it becomes a **`nxtlvl-labs` incubation cell** — the staging tier where a
   capability proves itself before it touches the live plugin.
3. **Graduate to the live `nxtlvl` plugin** only when earned, via **`spec → plan → ADR`**.

The three real controls against re-exploding to ecc scale are: **(a) `nxtlvl-labs` as the incubation
buffer** (nothing reaches the live plugin without earning graduation), **(b) `spec → plan → ADR` as
the justification each promotion must pass** (heavier than a one-line backlog entry — which is *why*
it holds in practice), and **(c) the periodic `nxtlvl-wiki` coverage assessment** as the check that
the buffer isn't hiding real gaps.

> *Why this replaces the old loop:* the prior anchor's growth loop was *fallback-log → intake
> backlog → un-defer*, with a "falsifiable one-line backlog entry naming the task that required it
> and the thing that failed" as the gate. In practice that gate did **not** hold — an audit
> (2026-06-28) found only 1 of 12 major shipped components had such an entry; the rest came through
> `spec → plan → ADR`, which became the *de facto* gate. The original gate was "fed by the fallback
> log," but the log stayed empty (I never reached for ecc), so the gate had no fuel. The lesson:
> growth needs a gate, but the old anchor named the wrong one. This version adopts the gate that
> actually held. See [ADR-015](../decisions/ADR-015-scope-determination-and-extension-gate.md).

## The audit

- **My own, tailored to the codebase.** *(Design in progress — see
  [ADR-014](../decisions/ADR-014-audit-gate.md), currently a draft pending a recorded decision.)*
- **Objective, binary, scope-independent gate:** config parses, no dead skill/agent refs, valid
  frontmatter, hooks exit 0 on a smoke test, no secrets. **All must pass to promote.** Taste/quality
  items are *warnings*, never blockers, so the gate can never encode "not enough skills." Rubric is
  **versioned**; deltas are intra-version only.
- **Runs at promotion only, as an invoked skill (`nxtlvl:audit`)** — not continuous, not a session
  hook (a buggy gate-hook would lock me out of my own daily driver).

## Dev/prod separation

- **This repo = the workbench.** Where I build, experiment, break the plumbing, run the audit.
  Churn lives here and never touches live sessions until I promote.
- **Installed `~/.claude` = the daily driver.** Stable. Only proven, audited changes land here.
- **Promotion = install = the gate** the audit guards. Mechanics: **local-marketplace install**
  ([ADR-001](../decisions/ADR-001-plugin-local-marketplace-packaging.md), never hand-edit
  `~/.claude`); test in repo / scratch profile *before* promoting; **git-tag per promotion** so
  rollback = checkout previous tag + reinstall.

## Hook safety (highest-severity failure mode)

- **Errors always fail open — absolutely, gates included.** Any *unexpected* failure (exception, bad
  parse, missing dep, timeout) → swallow, exit 0, do nothing. A broken hook must never halt a
  session. A block is only ever a decision a hook reached *cleanly*; never the byproduct of a crash.
- **Deliberate blocking (exit 2) is permitted but gated** — only as a *named, whitelisted gate* that
  earned its slot through the growth/promotion discipline. Exit-code contract: exit 0 = pass/warn
  (stderr surfaced as a non-blocking nudge), exit 2 = block.
- **Every blocking gate ships an env-var kill switch.** One variable disables it with no reinstall —
  the in-session escape hatch before rollback is needed.
- **The invoked audit still blocks unconditionally** — it is the one gate *meant* to stop promotion.
  Session gates are advisory-by-construction: killable, and fail-open on error.
- **Restraint is a policy choice, not a missing capability.** The harness *can* block; which gates
  turn on is governed by the growth discipline. nxtlvl stays "a book on the shelf, not a coworker"
  by enabling *few* gates — not by being unable to.

## Context assembly = a budgeted injection policy (not a firehose)

- The *learning artifact is the policy* — what earns a slot in the model's attention. Over-injection
  degrades quality.
- **By lifetime:** durable facts/conventions → `CLAUDE.md` (global vs project); learned/evolving
  facts → native memory; per-session dynamic context (git state, current task) → a lean
  `SessionStart` hook; per-prompt relevance → native skill routing (no hand-built retriever — that's
  the orchestration anti-goal).
- **Hard rule:** every auto-injected block justifies its tokens or it's cut; prefer *pointers* over
  dumping content.

## Workload (the fuel for reactive growth, and the income surface)

The real monthly stream — and, post-job-loss, the surface I expect to monetize:

- **Web/desktop apps, multiple languages** — Next.js full-stack, Python, Rust.
- **Knowledge-base construction.**
- **LLM-wiki construction.**
- **Agentic engineering / AI-agent building** — my differentiated work, the likely core of the
  company, and *meta*: I build agents *with* the harness, so dogfooding is automatic.

Implication: dev/review are **language-plural from day one**, and **agent-building is a first-class
workflow** (the company's product surface), not a deferred afterthought.

## Out of scope

- **Dropped from the prior anchor:** the fallback-rate metric · ecc-as-dormant-backstop · the
  fallback-fed one-line intake gate.
- Reconstructing orchestration primitives (skill router / dispatch / tool-loop) — **native.**
- **Productizing `nxtlvl` itself, now** — the option is kept open (clean boundaries, no personal-only
  lock-in), but it is not a current goal.
- ecc's 250+-skill breadth; a fourth memory system; continuous-learning/governance/optimizer
  machinery built up front.

## What changed from the 2026-06-16 anchor (reshape ledger)

| Area | Old anchor | This anchor |
|---|---|---|
| **Why** | Learn harness architecture by reconstruction | Build a company foundation; learning is now the *method*, not the goal |
| **Stakes** | Personal learning project | Bet-a-company-on production quality |
| **Success metric** | Fallback-rate north star (+ dual quality check) | Lived "did it carry my work" + deliberate `nxtlvl-wiki` coverage assessment; no auto metric |
| **Backstop** | ecc installed-but-dormant | Native CC; `nxtlvl-labs` incubation; ecc = ingested corpus only |
| **Scope posture** | "Whitelist, not full"; keep the map small | Map the full architecture up front; fill it reactively |
| **Growth gate** | Fallback-fed one-line backlog entry | `nxtlvl-labs` buffer + `spec → plan → ADR` + periodic wiki assessment |
| **Build strategy** | Compose on native + agent-skills; reconstruct only plumbing | Source-driven, copy-or-create as justified — copy a reference when source-driven exploration shows it is the best option, build our own when we identify a better one; orchestration stays native (build method: [ADR-003](../decisions/ADR-003-build-from-scratch.md), currently being revised) |

## Still open (resolve during planning, not blocking)

- **The complete agent-harness architecture outline** — the coverage map this intent feeds; the
  immediate downstream deliverable.
- A `grill-me` hardening pass on this re-derived intent before it is locked.
- The source-driven copy-or-create decision criteria and the status of
  [ADR-003](../decisions/ADR-003-build-from-scratch.md) (currently being revised to match this
  intent).
- The audit's concrete rubric items and the details of hook safety / context assembly policy —
  to be explored once the architecture map exists.
- Exact `nxtlvl-labs` taxonomy and graduation criteria (what "earned promotion" means in detail).
