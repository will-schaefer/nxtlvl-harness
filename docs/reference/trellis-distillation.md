# Trellis — Distillation (Adopt / Adapt / Reject)

> Distilled 2026-06-20 from a vendored clone of `mindfold-ai/Trellis` (`@mindfoldhq/trellis`) at
> `reference/Trellis-main/` (130M; gitignored, not tracked). **Mode B** (adopt/adapt/reject) against
> **nxtlvl**, run via a four-agent read-only parallel fan-out partitioned by subsystem — (1) the
> runtime-agnostic spec/task/workflow **spine**, (2) **sub-agent orchestration + commands**, (3)
> **hooks + context-injection + workspace memory** (the C&M analog), (4) the **skills** surface
> (ideation / authoring / spec-capture). The user pinned a comprehensive **LENS**: judge Trellis
> against *all four* nxtlvl surfaces it plausibly informs — the spec→plan spine, the context & memory
> (C&M) subsystem, the hooks, and ideation/skill-authoring. Every finding cited to `file:line` (paths
> relative to the clone root). **Purpose:** record an adopt/adapt/reject judgment per the nxtlvl build
> method (review harnesses to shape ours).
>
> Trellis is a **spec-driven, multi-runtime engineering framework**: `trellis init` installs a
> `.trellis/` project layer (specs, tasks, workspace journals, a Python CLI, a markdown workflow
> state-machine) plus per-platform agent/skill/hook renderings for 11–16 AI coding tools
> (Claude, Codex, Cursor, OpenCode, Pi, Gemini, …). It is a **real, dogfooded product** — 5 live
> tasks, archives back to 2026-01, 7 developer journals — not a demo repo. Sixth harness reviewed;
> the first that is a near-exact **structural mirror of nxtlvl's own pipeline**, which is what makes
> the comparison unusually sharp.
>
> *Citations are navigable anchors trued to within a few lines; where a line number and the quoted text
> disagree, the quote is authoritative.*

---

## 1. The spine — single-source the contract, multi-source the delivery: Trellis is *both* lessons in one repo

The cross-cutting Mode-B finding is not a feature to copy. It is a **contrast that validates nxtlvl's
core wiring discipline twice over, from the same harness:**

- **Where Trellis single-sources, it is excellent.** Its spec/task/workflow *engine* lives in exactly
  one place — Python under `.trellis/scripts/common/*.py` — and the TypeScript `packages/core`
  explicitly documents itself as a *passive mirror* of that writer (`packages/core/src/task/schema.ts:4-6`
  names `task_store.py::cmd_create` as the source of truth). The per-turn `<workflow-state>` breadcrumb
  is parsed from **one** markdown file (`.trellis/workflow.md`) with **no fallback dict** — a mirror that
  was deliberately deleted in v0.5.0-beta.20 because "the mirror inevitably drifted… removing the
  fallback collapses three sources to one" (`workflow-state-contract.md:117-124`). This is the best
  spec/task/workflow craft reviewed so far, and it is textbook nxtlvl doctrine: one source, parser-only
  hooks, degrade to a *visible* generic line so a break is noticed, never masked.

- **Where Trellis multi-sources, it is already rotting — and we caught it in the act.** The *delivery*
  layer is N hand-maintained per-platform copies, not template→render. The orchestration agent found a
  **live drift instance**: the project's `.codex/agents/trellis-implement.toml` carries a 25-line context
  block its own upstream template (`packages/cli/.../codex/agents/trellis-implement.toml`, package `0.6.3`)
  has dropped. The skills agent found the *same* skill diverging between its installed copies
  (`.claude/.../trellis-brainstorm/SKILL.md`, 155L, `name: trellis-brainstorm`) and the codex **template**
  (`packages/cli/src/templates/codex/skills/brainstorm/SKILL.md:2-3`, 112L, `name: brainstorm`) — same
  capability, a different name/description/length depending on which platform renders it. Two independent
  agents, the *exact* "encoded N×, drifts, no router" anti-pattern nxtlvl rejects — here not as a risk but
  as observed decay. (The 5 *installed* roots are byte-identical to each other; the drift is
  template↔installed and template↔template, not 5-way among installs.)

So the headline for nxtlvl: **Trellis is the strongest external validation to date of "one source of
truth + withhold tools mechanically + promote-by-move-not-copy."** Its single-sourced engine is what
nxtlvl is building; its N-plexed delivery is what nxtlvl deliberately refuses. And buried in the good
half is the one genuinely borrowable artifact — the **workflow-state-contract** documentation pattern,
which three of the four agents independently nominated as the single best thing in the repo.

A note on **signal vs demo** (Phase-4 filter): Trellis grafts its commercial code-intelligence MCP
(**GitNexus**, 14336 symbols) into `CLAUDE.md:67-109` as "Always Do / Never Do" instructions with no
shipped engine in the clone — external product advice, not spine craft. The TypeScript **channel
runtime** in `packages/core` is real but an *orthogonal* event-sourced worker pool that meets the task
spine only via `task.json` on disk. `docs-site/`, `marketplace/`, marketing `assets/`, and the
`06-17-benchmark-showcase` / `06-17-architecture-diagram` task dirs are filler. None of these inform the
ledger below.

---

## 2. The spec / task / workflow spine (lens: spec→plan + C&M)

**Data model.** A task is a directory `.trellis/tasks/MM-DD-slug/` holding `task.json`
(status/branch/parent/children/package metadata), `prd.md` (requirements), optional `design.md` /
`implement.md` (complex tasks only), `research/`, and `implement.jsonl` / `check.jsonl` — per-task
**context manifests**, one `{"file","reason"}` per line, injected into sub-agents (`workflow.md:381-403`).
Status is a three-writer state machine: `planning` (on `create`) → `in_progress` (on `start`, gated on
prior `planning`, `task.py:128-129`) → `completed` (on `archive`, `task_store.py:337`). The active-task
pointer is **session-scoped** (`.trellis/.runtime/sessions/<key>.json`), not a global file — so two
windows don't collide (`active_task.py:464-494`).

**Spec-as-living-memory.** `.trellis/spec/<package>/<layer>/index.md` is an entry point carrying a
**Pre-Development Checklist** (path-scoped routing — "editing X → read Y", `cli/backend/index.md:43-57`)
and a **Quality Check** section, injected on demand via `get_context.py --mode packages` and written back
after each task by the `trellis-update-spec` skill. Trellis dogfoods this: `cli/backend/index.md` *is*
Trellis's own dev guideline set.

**Real rigor, not theater.** The `[workflow-state:completed]` breadcrumb is documented as **DEAD** —
`cmd_archive` flips status *and* `mv`s the dir in one call while `clear_task_from_sessions` runs first, so
the resolver loses the pointer and the breadcrumb can never fire (`workflow.md:128-133`,
`workflow-state-contract.md:200`). It is kept "for a future explicit transition," the mechanism is
explained, and the enforcing test is named. The breadcrumb **INVARIANT** — "every `[required · once]`
step must have a matching enforcement line in its phase's breadcrumb block, or the AI silently skips it"
— cites *two real past production bugs* it was written to prevent (`workflow.md:113-118`). The
`workflow-state-contract.md` enumerates every status writer with `file:line`, asserts completeness via
`grep`, and lists "must update this spec when changing" triggers (`:156-168, 292-307`). This is the
audit-gate rigor nxtlvl wants, demonstrated on a live state machine.

**Risks.** The Python writer ↔ TS schema is mirrored *by hand* (doc-comment discipline, not codegen) —
a structural drift hazard (`schema.ts:4-6`). The breadcrumb is the *only* per-turn enforcement channel
and leaks across the main/sub-agent boundary by design (`workflow-state-contract.md:14-21`).

---

## 3. Sub-agent orchestration + commands (lens: spec→plan + skill-authoring)

**Roster (3 agents, dual-runtime).** `trellis-implement` (writes code, forbidden from `git
commit/push/merge`, `trellis-implement.md:45-50`), `trellis-check` (reviews diff vs specs and
**self-fixes** — "Fix issues yourself, don't just report them", `trellis-check.md:44-47`),
`trellis-research` (every finding MUST be persisted to `{TASK_DIR}/research/*.md` because "conversations
get compacted; files don't", `trellis-research.md:15-16`; returns only paths + one-line summaries, never
pasted content, `:53-61`).

**Dispatch protocol.** Every dispatch prompt must begin with `Active task: <path from task.py current>`
before role instructions — a hard, uniform contract across all platforms (`workflow.md:223`). Main
session is the only dispatcher (`:228`). Flow: `trellis-implement → trellis-check → trellis-update-spec →
commit → /trellis:finish-work` (`:227`).

**The standout: a three-layer anti-recursion guard.** (a) the agent's own prompt ("you are already the
`trellis-implement` sub-agent… do NOT spawn another", `trellis-implement.md:11-17`); (b) the per-turn
breadcrumb repeats it (`workflow.md:228`); (c) on Codex it is **structural** — `multi_agent=false` means
`spawn_agent`/`wait_agent` are *literally not in the tool list* (`trellis-implement.toml:55-65`). The
structural layer — remove the spawn tool from the dispatched agent — is stronger than any prompt and is
the single best orchestration pattern in the harness.

**Risks (all confirm nxtlvl positions).** Cross-runtime drift is structural and live (11+ divergent
implement-agent files; codex copy already drifted from its template). Secondary runtimes
(`gemini/opencode/reasonix/zcode`) declare **no `tools:` → inherit everything** — the same 0-declared-tools
over-grant seen in ruflo/superclaude; the scoped grant exists only on a *subset* of platforms, so it isn't
a guarantee. The research agent's "read-only outside research/" is **prose-only**: `sandbox_mode =
workspace-write` + unscoped `Write` grant, with a bulleted "FORBIDDEN" list the model is merely asked to
honor (`trellis-research.toml:2-3`, `trellis-research.md:65-80`) — claim > wiring. `create-manifest` /
`publish-skill` commands are Trellis-the-npm-product release plumbing, not reusable craft.

---

## 4. Hooks + context-injection + workspace memory (lens: hooks + C&M — the highest-value comparison)

**Three hooks, all inform-only / allow-only — none can block.** `session-start.py` (SessionStart:
startup/clear/compact) emits one `<session-context>` blob via `additionalContext`, every external read
guarded, config errors blanket-caught to defaults (`:456-457`). `inject-workflow-state.py`
(UserPromptSubmit, every turn) resolves the active task, reads `task.json.status`, parses the matching
`[workflow-state:*]` block from the single-source `workflow.md`, emits it as a `<workflow-state>`
breadcrumb, and **always `return 0`** (`:303-359`). `inject-subagent-context.py` (PreToolUse on
Task+Agent) is the one hook that *mutates* the call — it packs the jsonl manifests + prd/design/implement
into a rewritten prompt and returns `permissionDecision:"allow"` + `updatedInput` — **allow-only, never
denies** (`:687-767`). This is independent corroboration of "hooks inform, never force": a maximalist
multi-platform harness ships **zero blocking gates** in its entire C&M path.

**Injection-safe by construction.** No `shell=True`, no `os.system`, no `os.popen` anywhere in the
hooks/resolver; git runs via argv lists; the one shell-export bridge uses `shlex.quote`
(`session-start.py:160-168, 246`). The raw-`$TOOL_INPUT`/`$PROMPT` interpolation antipattern from ruflo
is **absent** — a clean counterexample.

**The C&M comparison (the headline).** Trellis and nxtlvl have made **opposite memory bets.** Trellis
stores **per-developer narrative worklogs** — `.trellis/workspace/<dev>/journal-N.md`, hard 2000-line
rotation with deterministic `journal-N+1` roll and an `index.md` rebuilt in place via `@@@auto:`
marker-delimited regions (`add_session.py:129-145, 233-314`). It is excellent **provenance / audit
trail** but **poor recall**: nothing retrieves a past *fact* into a new session — the journal surfaces
back only as a status line ("Journal: 667/2000 lines") and a Next-Action. It is written far more than it
is read. nxtlvl's **curated one-fact-per-file + `MEMORY.md` pointer index** is the stronger *recall*
design and should not be displaced. What is worth borrowing is mechanical, not architectural: the
bounded-rotation discipline, the `@@@auto:` pattern for mixing generated + hand-written content in one
file, and the atomic-rename fix Trellis *lacks*.

**Risks.** State writes are **non-atomic** — both `active_task._write_json` (`active_task.py:426-435`)
and shared `io.write_json` (`io.py:25-37`) do a bare `write_text` (no temp-file-and-rename, no fsync); a
crash mid-write truncates the pointer and silently degrades to "no active task." Fails *safe* (toward
silence) but loses state — nxtlvl's planned XDG store must use `os.replace`. The DEAD `completed` state
means the terminal lifecycle state is *unobservable* (the only real "done" signal is the `after_archive`
lifecycle event, not a breadcrumb). Thin-manifest warnings go to **stderr** (invisible to the agent and
operationally), so a sub-agent can silently receive empty curated context (`inject-subagent-context.py:209-254`).

---

## 5. The skills surface (lens: ideation + skill-authoring + spec-capture)

**`trellis-session-insight` is the single best artifact to mine.** A **capability-not-workflow** recall
skill (`:10-11` "no fixed output file… judgement call in the moment") that reaches raw platform JSONL via
a `trellis mem` CLI — **curated files + on-demand search, explicitly NOT a vector DB** (`:13-16`,
landing exactly on nxtlvl's locked position). It has an explicit **"When NOT to reach for it"** section
(`:32-37`) and **defers promotion to a sibling skill** (`:45` "session-insight ends at the discovery…
does not replace `trellis-update-spec`") — real composition, not duplication. This is the closest
external analog to nxtlvl's planned instinct/evolve **recall** half, done right.

**The learning loop mirrors nxtlvl's C&M path.** `session-insight` (recall) → `break-loop` (root-cause
retrospective) → `update-spec` (promote into durable guidance). `trellis-update-spec` carries explicit
when-to-write-back triggers and an enforced "code-spec (executable contracts in `<layer>/`) vs guide
(thinking checklist in `guides/`)" distinction (`update-spec/SKILL.md:30-66`) — the write-back half nxtlvl's
"distill reusable → doc + pointer" wants formalized.

**`.trellis/workflow.md` is a genuine, honest router.** `workflow.md:226` disambiguates the one real
name-collision in the harness: "`trellis-implement`/`trellis-research` are sub-agent types only (NOT
Skill); `trellis-update-spec` is a skill; **`trellis-check` exists as both — prefer the Agent form when
verifying**." A router that exists *because there are genuinely two sources* — exactly nxtlvl's "router
only when multiple sources exist."

**brainstorm proves the opposite lesson.** `trellis-brainstorm` has nxtlvl's interview ethos almost
verbatim — one-question-at-a-time, a recommended answer per question, and a sharp **Evidence Rule**:
"if a question can be answered by exploring the codebase, explore instead; do not ask the user to confirm
facts the repo can answer" (`:14-20`). But it **composes nothing** — a grep for `interview`/`spec`/`plan`
inside the skill returns zero downstream references; it inlines the interview, a first-principles
framework, and the prd/design/implement specs all in one 155-line file. It *is* the monolith nxtlvl's
thin-front-door-that-hands-off deliberately decomposes.

**Authoring hygiene risks.** Per-platform rendering drift (above). `SKILL.md.backup` editor cruft
shipped in the template tree. And `publish-skill` is **distribution with zero quality validation** — the *inverse* of nxtlvl's
planned 5-axis promotion validator; a publish step without a gate is a gap, not a feature.

---

## 6. Consolidated Adopt / Adapt / Reject ledger

IDs are stable (`TREL-NN`) and cross-linked from the
[adopt/adapt backlog](../plan/nxtlvl-harness-adopt-backlog.md) and memory. ADOPT/ADAPT are work items;
REJECTs stay here as evidence (most *confirm* a locked nxtlvl position — that is the point of the run).

### ADOPT

| ID | Finding (file:line) | nxtlvl surface | Rationale |
|---|---|---|---|
| **TREL-01** | `workflow-state-contract.md` — status-**writer table** + **reachability matrix** + parser↔stripper `\1` invariant + named regression test (`:52-63, 156-168, 237-246`) | C&M lifecycle spec / future audit gate | Three agents independently named this the best artifact. The documentation shape nxtlvl's C&M lifecycle should ship: who-writes-each-state + which-channel-reaches-whom, asserted mechanically. **Graduation candidate** when the C&M lifecycle spec is written. |
| **TREL-02** | Single-source markdown breadcrumb: parser-only hook, **no fallback dict**, degrade-to-visible-generic-line (`inject-workflow-state.py:174-197`; contract `:113-128`) | Hooks & context-injection | Textbook single-source + fail-toward-visible. Could drive a per-turn *pipeline-phase* breadcrumb (brainstorm→spec→plan→build) from one editable markdown source. |
| **TREL-03** | Three-layer anti-recursion guard, strongest layer = **structural tool-removal** (spawn tool not registered) (`trellis-implement.toml:55-65`; `workflow.md:228`) | Agents / fan-out cap | Removing the spawn tool from a dispatched agent beats any prompt-only guard; fits nxtlvl's 6–8 fan-out cap and read-only-by-withheld-tools. |
| **TREL-04** | `Active task: <path>` prompt prelude as a deterministic, hook-independent context anchor on every dispatch (`workflow.md:223`) | Spec→plan / sub-agent dispatch | One load-bearing first line gives every sub-agent a robust context anchor even when the inject hook is absent. |
| **TREL-05** | Research-as-files contract — chat reply is a *failure mode*, the written file is the deliverable (`trellis-research.md:15-16, 53-61`) | C&M / context-scout | Crisp phrasing of nxtlvl's pointers-over-content / persist-don't-narrate posture; confirms + sharpens context-scout/doc-keeper. |
| **TREL-06** | `trellis-session-insight` — capability-not-workflow **recall** skill, explicit "When NOT", composes to `update-spec`, curated-files-not-vector-DB (`session-insight/SKILL.md:10-16, 32-37, 45`) | C&M observer / recall (instinct/evolve) | Best-in-class model for the recall half of nxtlvl's planned instinct/evolve loop; lands on the locked no-vector-DB position. |
| **TREL-07** | brainstorm **Evidence Rule** — never ask the user what the repo can answer (`trellis-brainstorm/SKILL.md:14-20`) | Ideation (brainstorm/interview) | Cheap, high-value guard for the brainstorm→interview seam and context-scout's job. |

### ADAPT

| ID | Finding (file:line) | nxtlvl surface | Rationale |
|---|---|---|---|
| **TREL-08** | Journal model: bounded 2000-line rotation + `@@@auto:` marker-region rewrite mixing generated + curated content in one file (`add_session.py:129-145, 233-314`) | C&M memory store | Borrow the *mechanics* (rotation, marker-region pattern); **reject the per-developer narrative-worklog shape** — it's a worklog with poor recall, not curated memory. nxtlvl's pointer-index is the better recall design. |
| **TREL-09** | `implement.jsonl` / `check.jsonl` per-task context manifests — read-contract as **data, not prose**, explicitly excluding code paths (`workflow.md:381-403`) | Scoped read-contracts / per-task context | A clean read-contract: planning curates *which* context the executor sees, as data. Aligns with doubt-reviewer's ARTIFACT+CONTRACT pattern. |
| **TREL-10** | Single-session active-task fallback — adopt the sole session file, **refuse on 0 or ≥2** (`active_task.py:497-519`) | C&M session identity | Adopt the "exactly-one-or-none, never guess across windows" invariant for session journaling; note the failure mode (adopts wrong task if only one window has written state yet) → pin identity earlier. |
| **TREL-11** | Spec `index.md` Pre-Development-Checklist **path-scoped routing** ("editing X → read Y") + Quality Check, injected on demand (`cli/backend/index.md:37-77`) | Auto-injected spec shape | Scoped read-contract expressed as a path→doc routing table, injected not recalled; nxtlvl can drive an equivalent from CLAUDE.md layering. |
| **TREL-12** | `trellis-update-spec` when-to-write-back trigger table + code-spec-vs-guide split (`update-spec/SKILL.md:30-66`) | Spec-capture / distill-to-doc | The write-back half of spec-as-living-memory; adapt the trigger table + contract/checklist distinction. Reject the mandatory 7-section template (too heavy for curated-file ethos). |
| **TREL-13** | `finish-work` dirty-path classification (this-task vs other-window) + **bail rather than blind-commit** (`finish-work.md:19-44`; auto-commit path-scope `add_session.py:354-361`, cites issue #303) | git-workflow-runner safety | Parallel-session-aware commit hygiene — sound safety heuristic for the git-workflow-runner; pairs with the developer-repo "epitaxy" concurrency caveat. |
| **TREL-14** | Marker-checked hook injection with prose fallback — check for `<!-- trellis-hook-injected -->`, else self-load from the `Active task:` line (`trellis-implement.md:21-24`) | Hooks / context delivery | Hook-agnostic graceful degradation; portable regardless of which hook does the injecting. |
| **TREL-15** | **Non-atomic** state writes — bare `write_text`, no temp-rename/fsync (`active_task.py:426-435`; `io.py:25-37`) | C&M store (anti-pattern → requirement) | A concrete *don't-do*: nxtlvl's XDG store must write via `os.replace` atomic rename. Trellis fails safe (toward silence) but loses the pointer under crash. |

### REJECT — confirms a locked nxtlvl position (evidence, not a work item)

| Finding (file:line) | Confirms |
|---|---|
| N hand-maintained per-platform copies, **confirmed live drift** (codex `.toml` carries a 25-line block its template dropped; brainstorm diverges installed↔codex-template in name/desc/length) | Single source of truth; no N-copy fan-out; promote-by-`git mv`-not-copy |
| Over-grant on secondary runtimes — `gemini/opencode/reasonix/zcode` agents declare **no `tools:`** → inherit Write/Edit/Bash | Tool-withholding by default; scoped read-contracts (3rd–4th confirmation, after ruflo + superclaude) |
| Research agent write-scope is **prose-only** — `sandbox_mode=workspace-write` + unscoped `Write` + a bulleted "FORBIDDEN" list (`trellis-research.md:65-80`) | A read-only agent must *physically lack* Write, not be asked nicely |
| Hand-mirrored Python writer ↔ TS `task.json` schema (`schema.ts:4-6`) | Files-over-DB; single source — two typed writers for one on-disk shape is a drift hazard |
| `brainstorm` reconstructs interview+first-principles+spec+plan in one monolith, composes nothing | Thin-front-door-that-composes-the-pipeline over a fused monolith |
| DEAD `[workflow-state:completed]` state; terminal lifecycle state unobservable (`workflow-state-contract.md:200`) | Every lifecycle state needs a *live producer* **and** a *reachable consumer*, or be deleted |
| `publish-skill` ships a skill to docs with **zero** quality/frontmatter/trigger validation | The need for a promotion gate (the planned 5-axis validator) — a publish step without a gate is a gap |

---

## 7. Applying this to nxtlvl

**No ADR.** Every architectural contrast confirms an already-locked position (inform-don't-force,
files-over-DB recall, single-source-no-router, tool-withholding-not-prose, fail-loud-on-broken-state).
The ADOPTs are documentation patterns, skill-craft, and idioms — not architecture. The one graduation
candidate, **TREL-01** (the writer/reachability-matrix contract), graduates only *if and when* the C&M
lifecycle spec is written and chooses to adopt it as its documentation shape — note it now, decide then.

**Where the value concentrates, by surface:**

- **Context & memory (the in-flight ~15% build):** highest-value target. `TREL-06` (session-insight
  recall model) and `TREL-12` (update-spec write-back triggers) are the closest external analogs to the
  planned instinct/evolve loop; `TREL-08` (rotation + `@@@auto:` markers), `TREL-10` (refuse-to-guess
  session identity), and `TREL-15` (atomic-rename) are concrete mechanics for the XDG store; `TREL-01`
  is the spec's documentation shape. The architectural takeaway is a *negative*: Trellis's narrative
  worklog confirms nxtlvl's curated-fact recall is the better bet — don't drift toward worklogs.
- **Hooks:** `TREL-02` (single-source markdown breadcrumb, parser-only hook) is the cleanest borrow;
  the whole subsystem is an independent corroboration that informing-not-forcing scales.
- **Agents / orchestration:** `TREL-03` (structural anti-recursion via tool-removal) and `TREL-04`
  (`Active task:` prelude) are the two patterns worth bringing back.
- **Ideation / authoring:** `TREL-07` (Evidence Rule) sharpens the brainstorm seam; the brainstorm
  monolith and `publish-skill`-without-a-gate are the cautionary contrasts.

**Bottom line.** Trellis is the strongest spec/task/workflow spine reviewed and the sharpest external
validation of nxtlvl's wiring discipline — because the *same repo* shows both halves: a single-sourced
engine that is genuinely excellent, and an N-plexed delivery layer caught mid-drift. Mine the engine's
contract-documentation and recall-skill craft; treat the delivery layer as the worked counterexample for
why nxtlvl keeps one source and withholds tools mechanically.
