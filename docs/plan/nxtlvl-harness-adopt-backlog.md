# nxtlvl harness adopt/adapt backlog

The staging area for **ADOPT / ADAPT** findings harvested from harness reviews
(`docs/reference/*-distillation.md`, `*-review.md`). Each row is a candidate work item awaiting a
`/plan` or an ADR. **Grouped by target surface** — so when you build a surface, every finding that
informs it is already in one place (open one file, not six).

## How this works

**What lands here.** Only **ADOPT** and **ADAPT** verdicts are work items. **REJECTs stay in their
distillation as evidence** — most are confirmations of locked positions, not a backlog. Promote a
REJECT here *only* as a one-line **doctrine note** when the same contrast recurs across ≥2 harnesses
(that recurrence is itself the signal — e.g. "files-over-DB confirmed by ecc, ruflo, ruflo-adr").

**ID** — `<HARNESS-ABBREV>-NN`, assigned once, **never reused**. The stable anchor memory, plans, and
ADRs cross-link to. The abbrev is **harness-level**, not plugin-level — every finding from anywhere in
a harness shares one prefix and one number sequence; the row's **Source** field records which
sub-plugin/file it came from. (The whole ruflo/claude-flow harness → `RUFLO`, including its `ruflo-adr`
plugin.)

**Status is a lifecycle, not a checkbox** — burn it down, don't let it become a graveyard:
- `open` — harvested, not yet acted on
- `planned` — folded into a `/plan` (link it)
- `landed` — shipped; link the commit / PR / ADR
- `dropped` — reconsidered; **keep the row + a one-line reason** (same discipline as superseded ADRs)

**Graduation to ADR.** This ledger is a *staging area*, not a decision record. When an ADOPT is **both
architectural and expensive-to-reverse**, it graduates out into an ADR (per
`~/.claude/rules/decisions.md`) and its status becomes `landed → ADR-0NN`. Most rows never graduate —
they're hygiene/tactics, and that's fine.

**Curate hard.** The value is that it's short and live. If it becomes a dump of every finding it stops
being actionable — the same failure mode as an ADR set with no threshold.

## Abbrev registry

| Harness | Abbrev | Distillation(s) |
|---|---|---|
| ruflo (claude-flow) | `RUFLO` | per-plugin: [`ruflo-adr-distillation.md`](../reference/ruflo-adr-distillation.md); harness-level: [`ruflo-distillation.md`](../reference/ruflo-distillation.md), [`ruflo-discovery-review.md`](../reference/ruflo-discovery-review.md) |
| Trellis | `TREL` | [`docs/reference/trellis-distillation.md`](../reference/trellis-distillation.md) |
| CodeWhale | `CW` | [`docs/reference/codewhale-scripts-review.md`](../reference/codewhale-scripts-review.md) |

---

## Target: §5 ADR-integrity audit

- **[RUFLO-01]** · ADOPT · **DFS supersede-cycle detector** · ruflo-adr `verify.mjs:62-82` · `open` · [→](../reference/ruflo-adr-distillation.md)
- **[RUFLO-02]** · ADOPT · **two-tier exit contract** (block on cycles / warn on dangling unless `VERIFY_STRICT`) · ruflo-adr `verify.mjs:118-121` · `open` · [→](../reference/ruflo-adr-distillation.md)
- **[RUFLO-05]** · ADOPT · **issue-number false-positive sanitizer** (strip `#N`/`PR N`/commit-hash/backtick spans *before* matching `ADR-NNN`) — for the audit's "resolvable cross-links" check · ruflo-adr `import.mjs:169-182` · `open` · [→](../reference/ruflo-adr-distillation.md)

## Target: §5 audit — softer / WARNING-tier

- **[RUFLO-03]** · ADAPT · **code-ADR drift detection** (grep ADR-IDs in source + git-blame-vs-acceptance-date; plain script, **fixed regex** — theirs misses 4-digit IDs) · ruflo-adr `REFERENCE.md:86-101` · `open` · [→](../reference/ruflo-adr-distillation.md)

## Target: house ADR format (§3)

- **[RUFLO-04]** · ADOPT · **typed `depends-on` / `amends` frontmatter fields** (in-file edge, no DB) — types nxtlvl's currently-untyped prose cross-links; `amends` gives §1's "resolved question → amend that ADR" guidance an actual marker · ruflo-adr `REFERENCE.md:81-84` · `open` · [→](../reference/ruflo-adr-distillation.md)

---

## Target: Context & memory (C&M) subsystem

- **[TREL-01]** · ADOPT · **workflow-state writer-table + reachability-matrix** as the doc shape for the C&M lifecycle spec (who-writes-each-state + which-channel-reaches-whom, asserted mechanically) · Trellis `workflow-state-contract.md:52-63,156-168,237-246` · `open` · **graduation candidate** when the C&M lifecycle spec is written · [→](../reference/trellis-distillation.md)
- **[TREL-06]** · ADOPT · **capability-not-workflow recall skill** (explicit "When NOT", composes to a promote skill, curated-files-not-vector-DB) as the model for the instinct/evolve recall half · Trellis `session-insight/SKILL.md:10-16,32-37,45` · `open` · [→](../reference/trellis-distillation.md)
- **[TREL-08]** · ADAPT · **bounded journal rotation + `@@@auto:` marker-region** for mixing generated + curated content in one file (reject the per-dev narrative-worklog *shape* — poor recall) · Trellis `add_session.py:129-145,233-314` · `open` · [→](../reference/trellis-distillation.md)
- **[TREL-10]** · ADAPT · **single-session "exactly-one-or-none, refuse to guess across windows"** invariant for session identity · Trellis `active_task.py:497-519` · `open` · [→](../reference/trellis-distillation.md)
- **[TREL-12]** · ADAPT · **when-to-write-back trigger table + code-spec-vs-guide split** for spec-capture (reject the heavy 7-section template) · Trellis `update-spec/SKILL.md:30-66` · `open` · [→](../reference/trellis-distillation.md)
- **[TREL-15]** · ADAPT · **atomic-rename the C&M store** (`os.replace`, not bare `write_text`) — Trellis's non-atomic writes are the counterexample · Trellis `active_task.py:426-435`, `io.py:25-37` · `open` · [→](../reference/trellis-distillation.md)

## Target: Hooks / context-injection

- **[TREL-02]** · ADOPT · **single-source markdown breadcrumb, parser-only hook, no fallback dict, degrade-to-visible** — could drive a per-turn pipeline-phase breadcrumb (brainstorm→spec→plan→build) · Trellis `inject-workflow-state.py:174-197`, `workflow-state-contract.md:113-128` · `open` · [→](../reference/trellis-distillation.md)
- **[TREL-14]** · ADAPT · **marker-checked hook injection with prose fallback** (check `<!-- injected -->` marker, else self-load) — hook-agnostic graceful degradation · Trellis `trellis-implement.md:21-24` · `open` · [→](../reference/trellis-distillation.md)

## Target: Dangerous-bash gate / command-policy

- **[CW-01]** · ADAPT · **arity-aware command classification** for the dangerous-bash gate — a flag-stripping tokenizer + a static arity table classify a command to its canonical *positional* prefix (`git branch -f main` → `git branch`; flags are recognized, never substring-matched), replacing the substring/regex deny-matching that produced the recorded `git branch -f main` false-positive. The portable shape is **two matchers, two jobs**: word-boundary deny matching that *keeps* flags (blocks the specific invocation — `git push --force` ≠ `--force-with-lease`) paired with flag-insensitive arity allow matching (trust a whole command family). Port the *idea* into the Node hook (it's a compiled Rust crate, not liftable); their test suite is a ready-made spec. · CodeWhale `bash_arity.rs:304-378` (table :27-259) + deny word-boundary `lib.rs:358-372`, tests `bash_arity.rs:404-578` · `open` · [→](../reference/codewhale-scripts-review.md)

## Target: Spec→plan pipeline / scoped read-contracts

- **[TREL-04]** · ADOPT · **`Active task: <path>` prompt prelude** as a deterministic, hook-independent context anchor on every dispatch · Trellis `workflow.md:223` · `open` · [→](../reference/trellis-distillation.md)
- **[TREL-09]** · ADAPT · **per-task context manifest** (`{file,reason}` jsonl, data not prose, excludes code paths) — read-contract the planner curates for the executor · Trellis `workflow.md:381-403` · `open` · [→](../reference/trellis-distillation.md)
- **[TREL-11]** · ADAPT · **spec `index.md` path-scoped routing** ("editing X → read Y") + Quality Check, injected on demand not recalled · Trellis `cli/backend/index.md:37-77` · `open` · [→](../reference/trellis-distillation.md)

## Target: Agents / sub-agent orchestration

- **[TREL-03]** · ADOPT · **structural anti-recursion guard** — remove the spawn tool from the dispatched agent's tool list (stronger than any prompt guard) · Trellis `trellis-implement.toml:55-65`, `workflow.md:228` · `open` · [→](../reference/trellis-distillation.md)
- **[TREL-05]** · ADOPT · **research-as-files contract** — chat reply is a failure mode, the written file is the deliverable; return paths + one-line summaries only · Trellis `trellis-research.md:15-16,53-61` · `open` · [→](../reference/trellis-distillation.md)

## Target: Ideation / brainstorm

- **[TREL-07]** · ADOPT · brainstorm **Evidence Rule** — never ask the user what the repo can answer · Trellis `trellis-brainstorm/SKILL.md:14-20` · `open` · [→](../reference/trellis-distillation.md)

## Target: git-workflow

- **[TREL-13]** · ADAPT · **dirty-path classification (this-task vs other-window) + bail-rather-than-blind-commit** — parallel-session-aware commit hygiene · Trellis `finish-work.md:19-44`, `add_session.py:354-361` · `open` · [→](../reference/trellis-distillation.md)

## Doctrine notes (recurring contrasts — REJECTs confirmed across ≥2 harnesses)

- **Tool-withholding-not-prose** — a read-only agent must *physically lack* Write, not be asked via a prose "FORBIDDEN" list. Confirmed by ruflo, superclaude, **Trellis** (`trellis-research.md:65-80` grants Write then forbids in prose; secondary-runtime agents declare no `tools:` → inherit all).
- **Single-source, no N-copy fan-out** — encoding a capability across N hand-maintained per-target copies drifts. Confirmed by ruflo (byte-triplication), superclaude (src/↔plugins/ stale copy), **Trellis** (caught mid-drift: codex `.toml` carries a 25-line block its template dropped; brainstorm skill divergent in name/desc/length installed↔codex-template).

---

*Appended by `/harness-review` runs: a new harness's ADOPT/ADAPT rows go under the matching target
heading (add a new heading when the target surface is new). REJECTs do **not** land here unless they
become a recurring-contrast doctrine note.*
