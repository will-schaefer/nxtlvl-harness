# superpowers — Plugin Distillation

> Distilled 2026-06-19 from a full read of **superpowers** v6.0.3
> (`~/.claude/plugins/cache/claude-plugins-official/superpowers/6.0.3/skills/`, 14 skills).
> Every `SKILL.md` was read in full plus support files (references/, scripts/, CREATION-LOGs,
> graphviz flowcharts). **Purpose:** a standalone adopt/adapt/reject reference for the nxtlvl
> build, so harness-component decisions cite this instead of re-reading the plugin. Companion to
> the per-plugin [agent-skills-distillation.md](agent-skills-distillation.md), the head-to-head
> [agent-skills-vs-superpowers-domain-map.md](agent-skills-vs-superpowers-domain-map.md), and the
> **ecc** distillations ([ecc-main-map.md](ecc-main-map.md),
> [ecc-agent-vs-skill-scoping.md](ecc-agent-vs-skill-scoping.md)) — the three reference harnesses
> to triangulate against for any build decision.

---

## 1. What superpowers is

**A vertical agent-orchestration spine** — narrow, hard-enforced skills for *how an agent drives
multi-step work* (brainstorm → plan → isolate → execute via subagents → review → verify → finish),
not *what you build*. Skills are verb/process-named and built TDD-for-process: each discipline skill
claims a baseline RED phase (run a pressure scenario without the skill, capture the verbatim
rationalizations, then write counters). This is **visible, not just claimed** — `systematic-debugging`
ships its actual `CREATION-LOG.md` and four `test-*.md` pressure scenarios.

Two doctrines define the house: (a) **context is a scarce resource managed via files** — subagents
never inherit session context ("construct exactly what they need"), and artifacts are handed over as
files, never pasted history; (b) **never fight the harness** — worktree provenance checks and
native-tool preference so the agent doesn't create phantom state the host can't see.

---

## 2. The orchestration spine (how the skills interlock)

The backbone is a mostly-rigid pipeline entered through a coercive meta-skill. The interlock is
**mechanical, not just narrative**: `writing-plans`' *Global Constraints* block and *Consumes/Produces*
interface slots are literally what make `subagent-driven-development`'s file-handoff dispatches
possible, and the `task-brief`/`review-package` scripts are the physical handoff medium.

```
using-superpowers        (gate: invoke skills first; 1%-rule)
   └─> brainstorming      (design + committed spec; <HARD-GATE>)
        └─> writing-plans  (zero-context bite-sized TDD plan; Global Constraints + interfaces)
             └─> using-git-worktrees   (isolate workspace)
                  └─> EXECUTE ─┬─ subagent-driven-development   (preferred: fresh subagent per task)
                              └─ executing-plans               (fallback: no subagents)
                                   └─> finishing-a-development-branch  (integrate: merge/PR/keep/discard)
```

Three cross-cutting disciplines plug in at every step: **test-driven-development** (inside each task),
**requesting-/receiving-code-review** (between tasks and at branch end), **verification-before-completion**
(before any claim), and **systematic-debugging** (whenever something breaks).

---

## 3. Per-skill profiles (14)

**`using-superpowers`** — *meta/router, Rigid/coercive.* The always-on gate: "even a 1% chance a skill
might apply → you ABSOLUTELY MUST invoke it." Establishes instruction priority (user > superpowers >
default), a brainstorm-before-plan-mode flow digraph, a 12-row Red-Flags rationalization table, and a
`<SUBAGENT-STOP>` so dispatched subagents skip it. Ships **6 per-platform tool-mapping references**
(claude-code, codex, copilot, gemini, pi, antigravity) for cross-runtime portability. *Caveat:* the
"1% → must invoke" coercion conflicts with the user's "inform, don't force" stance, and it relies on
being injected/always-on — which won't transfer cleanly into nxtlvl's plumbing (router skills don't
fire from frontmatter). **→ Adapt:** mine the priority ladder + cross-runtime tool tables, reject the
coercion.

**`brainstorming`** — *ideation front-door, Rigid.* A `<HARD-GATE>` forbids any implementation "until
you have presented a design and the user has approved it"; 9-item ordered checklist; one question at a
time (multiple-choice preferred); 2-3 approaches with a recommendation; per-section approval; writes +
commits a dated spec; terminal state hard-wired ("the ONLY skill you invoke after brainstorming is
writing-plans"). Signature: the anti-simplicity gate — *"'Simple' projects are where unexamined
assumptions cause the most wasted work."* Ships a real **just-in-time visual companion**
(`scripts/server.cjs`, `frame-template.html`) offered only when a question "would genuinely be clearer
shown than described." **→ Adapt:** overlaps the user's `/interview-me`→`/grill-me` front door; steal
the hard gate + visual-companion-on-demand pattern (re-express via the nxtlvl visualize widget).

**`writing-plans`** — *planning, Rigid template.* Map file structure first (decomposition locked
here) → right-size tasks ("smallest unit that carries its own test cycle and is worth a fresh
reviewer's gate") → bite-sized 2-5 min TDD steps with complete code, exact paths, exact commands +
expected output → a Global Constraints block copied **verbatim** from the spec → self-review (coverage,
placeholder scan, type-consistency) → hand off. Signature: **plan for a zero-context engineer** "with
questionable taste"; the No-Placeholders rule bans "TBD," "add appropriate error handling," and
"Similar to Task N." The *Consumes/Produces* interface block is how isolated implementers learn
neighbor signatures. Ships `plan-document-reviewer-prompt.md`. **→ Adapt:** overlaps `agent-skills:plan`;
harvest the verbatim Global Constraints + Consumes/Produces slots — they're the connective tissue that
makes subagent execution work.

**`subagent-driven-development`** — *plan execution / orchestration spine, Rigid. The crown jewel.* Per
task: dispatch implementer (via a `task-brief` file) → implementer implements/tests/commits/self-reviews
→ build a review package → dispatch reviewer for **two verdicts (spec compliance + code quality)** →
dispatch a fix subagent for Critical/Important → mark complete in a **durable ledger**. After all tasks,
one broad whole-branch review on the most capable model, then finish. Signature: file-handoff to protect
the controller's context — *"Everything you paste into a dispatch prompt stays resident in your context
for the rest of the session and is re-read on every later turn. Hand artifacts over as files."* Measured
anti-patterns: "a real session's dispatch hit 42k chars of which 99% was pasted history"; "controllers
that lost their place re-dispatched entire completed task sequences — the single most expensive failure
observed"; "the final-review fix wave cost more than all its tasks combined." Model guidance: "Turn count
beats token price — cheapest models routinely take 2-3× the turns." Ships `implementer-prompt.md`,
`task-reviewer-prompt.md`, and three working scripts — `task-brief` (awk-extracts one task),
`review-package` (commit-list + stat + `git diff -U10`), `sdd-workspace` (resolves a self-ignoring
`.superpowers/sdd/` dir **explicitly because** "Claude Code treats `.git/` as a protected path and
denies agent writes there"). **→ Adopt (selectively):** the file-handoff discipline, durable ledger
(compaction-survival), dual-verdict review, and per-role model selection are the highest-value assets
for nxtlvl's orchestration. The `.git/`-write-guard workaround independently confirms a known nxtlvl
platform fact.

**`executing-plans`** — *plan execution (fallback), Rigid-leaning.* Load plan → review critically and
raise concerns **before** starting → todos → execute task-by-task with verifications → hand off to
finishing. Self-deprecating routing: "If subagents are available, use subagent-driven-development
instead of this skill." **→ Adapt:** keep the critical-review-before-execute step + STOP discipline;
nxtlvl will prefer the subagent path as primary.

**`systematic-debugging`** — *debugging, Rigid.* "The Iron Law: NO FIXES WITHOUT ROOT CAUSE
INVESTIGATION FIRST"; four gated phases (investigate → pattern-analysis → single-hypothesis test → fix
root cause with a failing test first). Signature: the **3-strikes architectural escalation** — "If ≥ 3
[failed fixes]: STOP and question the architecture. This is NOT a failed hypothesis — this is a wrong
architecture" — plus reading partner frustration signals ("'Stop guessing'… 'Ultra-think this'").
Richest support set: `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md`,
executable `find-polluter.sh`, a **`CREATION-LOG.md`**, and four shipped pressure-test scenarios.
Measured: "Systematic 15-30 min vs random fixes 2-3 hours; first-time fix rate 95% vs 40%." *Minor:*
CREATION-LOG + test-pressure files cite old nested paths (cosmetic). **→ Adopt:** strongest debugging
discipline in any reviewed harness; the CREATION-LOG models nxtlvl's distill-as-we-go.

**`test-driven-development`** — *TDD, Rigid.* "The Iron Law: NO PRODUCTION CODE WITHOUT A FAILING TEST
FIRST"; "violating the letter is violating the spirit." RED → verify-RED (fail for the *right* reason)
→ GREEN → verify-GREEN (pristine output) → REFACTOR. Wrote code first? "Delete it. Delete means delete."
Signature: watch-it-fail epistemics — "Tests-after = 'what does this do?' Tests-first = 'what *should*
this do?'" Ships `testing-anti-patterns.md` (5 anti-patterns, each with a gate function + real
human-correction quotes). **→ Adopt:** canonical; the rationalization-table format and the
anti-patterns gate functions are the reusable assets.

**`verification-before-completion`** — *verification, Rigid.* "The Iron Law: NO COMPLETION CLAIMS
WITHOUT FRESH VERIFICATION EVIDENCE"; a 5-step Gate Function where "Skip any step = lying, not
verifying." Claim→Requires→Not-Sufficient table (e.g., "Agent completed → VCS diff shows changes → NOT
agent reports 'success'"). Reframes optimism as dishonesty; flags even "Great!"/"Done!". Cites "From 24
failure memories: your human partner said 'I don't believe you' — trust broken." **→ Adopt:** the
"verify agent diffs, never trust agent self-reports" rule is essential for an orchestration harness;
pairs with the user's `/verify`.

**`requesting-code-review`** — *code review (mechanism), Flexible.* Capture BASE/HEAD SHAs → dispatch a
`general-purpose` reviewer filling a `code-reviewer.md` template → act by severity (Critical now,
Important before proceeding, Minor noted) → push back with reasoning if the reviewer is wrong. Signature:
context isolation as a quality lever — "the reviewer gets precisely crafted context, never your
session's history." Template enforces read-only review ("never move HEAD"). **→ Adapt:** overlaps
`nxtlvl:review`; harvest the fresh-context-isolation rationale + SHA-range dispatch mechanics.

**`receiving-code-review`** — *code review (response), Rigid.* 6-step pattern (READ → UNDERSTAND →
VERIFY against codebase → EVALUATE for THIS stack → RESPOND → IMPLEMENT one at a time) + a "Forbidden
Responses" list. Signature: the anti-sycophancy ban — "NEVER 'You're absolutely right!'… ANY gratitude
expression. If you catch yourself about to write 'Thanks': DELETE IT. State the fix instead." External
feedback = "suggestions to evaluate, not orders to follow"; applies a YAGNI grep before "implementing
properly." **→ Adapt:** strong verify-before-implement discipline; tune the absolute no-gratitude rule
to the user's voice.

**`using-git-worktrees`** — *git isolation, Rigid procedure / flexible fallback.* Step 0 detect existing
isolation (`GIT_DIR != GIT_COMMON`) with a submodule guard → prefer native worktree tools → fall back to
`git worktree add` only if none → verify `.gitignore` → clean baseline tests. Signature: "Never fight
the harness — using `git worktree add` when you have a native tool creates phantom state your harness
can't see or manage." *Caveat:* POSIX/bash-only. **→ Adopt:** the detect-then-defer-to-native ladder +
submodule guard directly serve the user's harness-owned-worktree / epitaxy-automation reality.

**`finishing-a-development-branch`** — *git integration, Rigid.* Verify tests → detect environment via
`GIT_DIR`/`GIT_COMMON` → present exactly 4 options (merge/PR/keep/discard; 3 for detached HEAD) →
execute with careful ordering (merge before worktree removal before branch delete) → clean up **only
worktrees it created** (provenance check). Signature: provenance-based cleanup — "the host environment
owns this workspace. Do NOT remove it… Only clean up worktrees you didn't create." Plus the ordering
bug-trap: delete branch before removing worktree and `git branch -d` fails. *Caveat:* POSIX/bash-only.
**→ Adopt:** the provenance check ("never fight the harness") matches the user's harness-owned-worktree
concerns; the 4-option menu is reusable.

**`dispatching-parallel-agents`** — *parallel orchestration, Flexible.* One agent per independent
problem domain, each with a focused, self-contained prompt (scope, goal, constraints, expected output);
issue all dispatches **in one response** for concurrency; review/integrate; run the full suite.
Signature: the concrete lever most agents miss — "Multiple dispatch calls in one response = parallel
execution. One per response = sequential." Dated evidence (2025-10-03: 6 failures / 3 files / 3 agents /
zero conflicts). **→ Adopt:** clean, portable, harness-agnostic — used to run *this very scan*.

**`writing-skills`** — *meta / skill authoring, Rigid. The methodology jewel.* "The Iron Law (Same as
TDD): NO SKILL WITHOUT A FAILING TEST FIRST" — applies to edits too. Maps RED-GREEN-REFACTOR onto skill
authoring (pressure scenario = test, SKILL.md = production code, baseline failure = RED). Covers SDO
("description = *when* to use only, never the workflow"), token-efficiency targets, flowchart-only-for-
decisions, and bulletproofing. Two empirical findings worth the whole skill: (1) "a description saying
'code review between tasks' caused an agent to do ONE review, even though the flowchart clearly showed
TWO"; (2) the **"Match the Form to the Failure"** table — prohibitions for discipline failures, positive
recipes for *shaping* failures ("the prohibition arm produced clearly more of the unwanted content than
the recipe arm — fully separated distributions"). Ships `anthropic-best-practices.md`,
`persuasion-principles.md` (cites Meincke et al. 2025, N=28,000, compliance 33%→72%),
`testing-skills-with-subagents.md`, `graphviz-conventions.dot`, executable `render-graphs.js`. The
micro-test protocol — "5+ reps per variant. Single samples lie. Variance is a metric." **→ Adopt:**
highest-value methodology asset for how nxtlvl authors its own skills/rules.

---

## 4. House style & authoring discipline

| Aspect | superpowers convention |
|---|---|
| Authoring method | **TDD-for-process** — baseline-failure → minimal skill → close loopholes; `CREATION-LOG`s document the adversarial pressure-tests (e.g. `systematic-debugging`) |
| Structure | Thin `SKILL.md` + **progressive disclosure** to support files; runnable scripts (not pseudocode); graphviz `dot` flowcharts rendered offline via `render-graphs.js` |
| Bulletproofing | Iron Law + "letter = spirit" openings; rationalization tables; Red-Flags lists; severity vocabulary (Critical/Important/Minor) shared across review skills |
| Evidence | **Dated real sessions + measured outcomes** (95% vs 40% fix rate; 42k-char dispatch; 24 failure memories) and real human-correction quotes |
| Portability | Cross-runtime by design — "speak in actions," resolve to 6 per-platform tool tables |
| Context economics | Subagents never inherit session context; artifacts handed over as files; durable ledger for compaction-survival |

---

## 5. Systemic strengths & weaknesses

**Strengths**
- Empirically validated authoring (wording micro-tests with no-guidance controls; variance-as-metric).
- Context-economics rigor unmatched in the reviewed harnesses — file-handoff + durable ledger built from measured real-session costs.
- Honest about its own limits and platform coupling (`executing-plans` defers to the subagent path; `sdd-workspace` explains the `.git/` write-guard workaround).
- Genuinely cross-runtime, with maintained per-platform tool tables.
- High internal consistency — shared bulletproofing format makes the set feel like one system.

**Weaknesses / defects**
- **Coercion-heavy** ("1% → must invoke," "delete means delete," absolute no-gratitude) — conflicts with nxtlvl's "inform, don't force" stance; can over-fire.
- **POSIX/bash-only** git logic (worktrees, finishing) — no Windows path, despite the cross-runtime framing.
- Opinionated hard-coded default paths (`docs/superpowers/specs/`, `.superpowers/sdd/`) — overridable but baked into prose.
- Minor staleness — `systematic-debugging` CREATION-LOG + `test-pressure-*.md` reference the old nested `skills/debugging/...` layout (cosmetic).
- The meta-skill assumes it's injected/always-on — the "description doesn't fire" problem the user already logged is **not** solved here; won't transfer cleanly into nxtlvl's plumbing.

---

## 6. Adopt / adapt / reject for nxtlvl (ranked)

1. **`subagent-driven-development`** (Adopt, selective) — file-handoff + durable ledger + dual-verdict
   review + per-role model selection. Mine `scripts/{task-brief,review-package,sdd-workspace}`.
2. **`writing-skills`** (Adopt) — "Match the Form to the Failure" + micro-test-with-control protocol;
   the methodology for how nxtlvl builds its own skills/rules. Mine `persuasion-principles.md` +
   `testing-skills-with-subagents.md`.
3. **`systematic-debugging`** (Adopt) — Iron Law + 4 phases + 3-strikes-architecture-stop; the
   `CREATION-LOG.md` is itself a model artifact.
4. **`verification-before-completion`** (Adopt) — Gate Function; "verify agent diffs, not self-reports."
5. **`using-git-worktrees`** + **`finishing-a-development-branch`** (Adopt) — detect-then-defer-to-native
   ladder + provenance cleanup; serves the epitaxy/harness-owned-worktree reality. ⚠️ Reconcile with the
   "never amend/rebase/force while epitaxy active" workflow.
6. **`dispatching-parallel-agents`** (Adopt) — "one response = parallel" mechanic; small and portable.
7. **`writing-plans`** (Adapt) — Global Constraints (verbatim) + Consumes/Produces interface block; fold
   into the existing plan step.
8. **`brainstorming`** / **`interview`-style gate** (Adapt) — hard design-gate + visual-companion-on-demand.
9. **`requesting-/receiving-code-review`** (Adapt) — fresh-context isolation + verify-before-implement;
   fold into `nxtlvl:review`. Soften the no-gratitude absolute.
10. **`using-superpowers`** (Adapt) — priority ladder + cross-runtime tool tables. **Reject** the
    coercive "1% rule" and the assume-always-on routing.

**Each merge on a contested overlap is an ADR-worthy boundary decision** (architectural +
expensive to reverse) — see the [domain map](agent-skills-vs-superpowers-domain-map.md) §3 for the
head-to-head verdicts.

---

## 7. Method note

Scanned via `superpowers:dispatching-parallel-agents` itself — one read-only scanner profiled all 14
skills to a uniform schema (purpose / type / mechanism / signature technique / structure / evidence /
defects / nxtlvl call), keeping the heavy reading in subagent context. The standing rule: **triangulate
harness-build decisions across superpowers, agent-skills, and ecc** before deciding.
