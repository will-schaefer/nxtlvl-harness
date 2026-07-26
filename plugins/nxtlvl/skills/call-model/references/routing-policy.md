# Routing policy — which callee for which task class

Decision record: ADR-037 (`docs/decisions/ADR-037-model-routing-policy.md`). This document is
the source of truth for **which target and mode** `call-model` should propose when the user
has not pinned a target. It decides; the skill's transport mechanics invoke.

**How to use this document:** name the task's class from the closed menu below (that naming
is your only judgment call), then walk the resolution cascade. Surface the proposed route —
class, target, mode, row provenance and date — and keep per-call authorization. **Routing
proposes; it never fires.**

## Resolution cascade (in order; first to commit wins)

1. **Explicit `--target` pin** — always honored, ends the walk.
2. **Prior-failure fallback** — a target that failed earlier this session hands to the next
   CLI (command-line interface) in its row's chain.
3. **Class row** — the table below: walk the row's CLI chain in order, skipping any CLI that
   is missing from PATH or fails `setup`.
4. **Freshness check** — a row past its review horizon (90 days after *last reviewed*)
   demotes to **suggest-only**: present it flagged as stale, never as the confident default.
5. **Terminal** — all CLIs in the chain unavailable: surface that plainly and offer a manual
   pick or skip. Never silently fall through to single-model work.

Ties between equally good available targets break toward a callee **≠ host family**.

## The class table

*Best model* is the aspirational answer ("which frontier model is best at this");
*CLI chain* is what is actually invokable, in preference order. They differ wherever a
model's CLI is dead, gated, or runs a different model than the flagship (see caveats).

| # | Task class | Mode | Best model (aspirational) | CLI chain (executable) | Confidence | Last reviewed |
|---|---|---|---|---|---|---|
| 1 | Planning / architecture design | `consult` | Claude Fable 5; runner-up GPT-5.6 Sol | `claude` → `codex` | Moderate — proxy measures only | 2026-07-26 |
| 2 | Deep reasoning / adversarial doubt | `adversarial` | Gemini 3.1 Pro (Deep Think) for abstract flaw-finding; Claude Opus 5 close | `codex` → `claude` (`gemini` blocked — see caveats) | Moderate — split by sub-task | 2026-07-26 |
| 3 | Code review | `review` | Claude Opus 5 (inferred, not measured) | `codex` (composes the OpenAI companion) → `claude` | **Weak — no model-level benchmark exists** | 2026-07-26 |
| 4 | Implementation / debug handoff | `task` (write only with explicit auth) | Contested: GPT-5.6 Sol vs Claude Fable 5 | `codex` → `devin` → `claude` | Moderate shortlist, low ordering | 2026-07-26 |
| 5 | Cheap triage / classification | `consult` | Gemini 3.x Flash Lite; Claude Haiku 4.5 at ~13× the cost | `claude` (smallest model available) → `codex` | Moderate — best-measured class, but stale source | 2026-07-26 |

## Row provenance (July 2026 research pass)

- **Planning:** no benchmark cleanly measures long-horizon design. Proxies: Zylos Research
  (May 14 2026) on agentic planning horizons; BuildFastWithAI "Best AI Models of July 2026"
  (July 2 2026) ranks Fable 5 top for planning/agentic with GPT-5.6 Sol close on
  TerminalBench 2.1. Held contrarian view (devforth.io): 2026 studies still find LLM-designed
  architectures fragmented — "best" here is relative, not good.
- **Deep reasoning:** Gemini 3.1 Pro Deep Think leads abstract pattern-breaking (ARC-AGI-2
  84.6%, TeamAI June 25 2026); GPQA Diamond is a statistical tie with Claude. A two-day-old,
  vendor-derived claim (Vellum) has Opus 5 far ahead on ARC-AGI-3 — if independently
  confirmed, this row flips to Claude; re-review then.
- **Code review:** every 2026 benchmark measures review *products*, not models (Tenki,
  CodeAnt's 200k-pull-request study); the one model-level head-to-head (llmtest.io,
  May 18 2026) used an obsolete lineup and a Claude judge scoring Claude models. The Opus 5
  pick is an inference from multi-file reasoning strength. Treat this row as a placeholder
  until measured — a candidate for an in-house eval (v2 metrics).
- **Implementation:** vendor sources directly conflict — Artificial Analysis Coding Agent
  Index favors GPT-5.6 Sol; CodingFleet's SWE-bench Pro board (July 25 2026) favors
  Fable 5/Opus 5. Devin's in-house SWE-1.7 (July 8 2026) is "near-frontier at a discount."
  Load-bearing reality check (Presenc AI, May 2026): real pull-request acceptance for top
  agents runs 25–40 points below SWE-bench Verified — headline ordering matters less than
  the benchmark-to-production gap.
- **Cheap triage:** OpenMark (March 2026): Gemini 3.1 Flash Lite tied GPT-5.4 on accuracy at
  ~1/13th the cost. Four months stale and omits Haiku 4.5. Transferable methodology finding:
  exact-match scoring made one model score 0% purely from prose around the label — for
  triage, **output-format discipline dominates raw model quality**; demand bare labels.

## CLI caveats (why the two columns differ)

- **`gemini`:** individual free-tier access ended June 18 2026 (enterprise continues); the
  CLI stays **blocked in chains** until a real smoke test passes under a working
  authorization. Best-model claims for Gemini remain recorded so the row heals the moment
  access does.
- **`grok`:** the CLI ("Grok Build", early beta, subscription-gated) runs `grok-build-0.1`,
  a purpose-built coding model — **not** the flagship Grok whose reasoning benchmarks make
  headlines. Do not route reasoning work to it on the flagship's scores; currently in no
  chain.
- **`codex`:** the underlying model changed to GPT-5.6 on July 9 2026 — pre-July benchmarks
  of "Codex CLI" measured a different model.
- **`devin`:** runs Cognition's in-house SWE-1.7, positioned as near-frontier; billing is
  metered in compute units, so cost per task is harder to predict than token pricing.
- **`claude`:** four Anthropic releases in under two months (through Opus 5, July 24 2026);
  Opus 5 benchmark coverage is days old and mostly vendor-sourced.

## Context rules

- **Interactive:** surface the proposed route in one line and keep the existing per-call
  confirmation. The policy replaces the flat target menu with a ranked default — nothing
  else changes.
- **Non-interactive** (continuous integration, loops, scheduled runs): the policy may only
  choose **among targets the user pre-authorized** for that context. None pre-authorized →
  skip and announce, per the skill's house rules.

## Maintenance

Rows decay. Re-review a row (and bump *last reviewed*) after any frontier model release
touching it, or when its 90-day horizon passes. Provenance stays in this file so the next
reviewer can see what the last one trusted and why. General reliability warning from the
research pass: much of the public benchmark corpus is low-quality and circular; distrust
near-saturated SWE-bench Verified numbers and anything specific about code review.
