# ruflo-adr — adopt / adapt / reject distillation

**Date:** 2026-06-20 · **Mode:** harness-review B (adopt/adapt/reject) · **Reviewed:** `ruflo-adr` plugin
(ruvnet/ruflo marketplace, v0.3.0), local install at
`~/.claude/plugins/marketplaces/ruflo/plugins/ruflo-adr` (~72K, 13 files: 4 skills, 1 command,
1 agent, 3 scripts, README/REFERENCE/manifest, 1 example ADR) ·
**Target:** nxtlvl · **Lens:** nxtlvl's decision-recording subsystem — the
`~/.claude/rules/decisions.md` threshold + house ADR format/lifecycle, the `doc-keeper` agent, and
the future ADR-integrity audit (§5).

> 5th ruflo-flavored review. Sibling artifacts: [`ruflo-distillation.md`](ruflo-distillation.md)
> (whole-harness), [`ruflo-discovery-review.md`](ruflo-discovery-review.md) (Mode C discovery domain).

---

## Spine — a split-brain plugin whose runnable half is a working prototype of nxtlvl's planned ADR audit

ruflo-adr ships **two divergent implementations of one ADR lifecycle that cannot see each other's
data**:

- **Backend A — AgentDB/MCP (claimed):** the agent, the `/adr` command, and REFERENCE.md persist to
  `mcp__claude-flow__agentdb_hierarchical-store` + `agentdb_causal-edge` (`commands/adr.md:14,30`;
  `agents/adr-architect.md:20-22`). Inert without a sibling `claude-flow` MCP server this plugin's
  manifest never declares.
- **Backend B — `@claude-flow` CLI memory keystore (what actually runs):** `adr-index`/`adr-verify`
  shell out to `scripts/import.mjs`/`verify.mjs`, which call `npx @claude-flow/cli memory store|list`
  against namespaces `adr-patterns` / `adr-edges` (`import.mjs:184-196`, `verify.mjs:22-44`).

An ADR created through `/adr create` (Backend A) is **invisible** to `adr-verify` (Backend B) — and
vice-versa. The "graph" the surface claims to write and the graph the scripts read back are different
stores with different shapes. The rhetoric–wiring gap *is* the finding, and it matches the broader
ruflo pattern: confident philosophy docs over thin, inconsistent wiring.

**Consequence for nxtlvl — the harvest is asymmetric and narrow:**

1. The **runnable scripts** (`verify.mjs` especially) are an accidental working prototype of nxtlvl's
   *planned* §5 ADR-integrity audit. They yield a small set of **genuine algorithm/idiom adopts**.
2. Everything on the **surface** (DB backend, over-granted agent, router-less redundancy, bold-list
   metadata, per-plugin boilerplate ADRs) is a **contrast that confirms a locked nxtlvl position** —
   files-over-DB, scoped read-contracts, single-source-of-truth, objective-gates-only, YAML
   frontmatter, the §1 ADR-worthy threshold, and the already-logged numbering-collision hazard.

**No ADR warranted.** This is a hygiene / audit-tactics harvest, not a feature borrow.

---

## 1. Surface & orchestration (skills · command · agent)

**Lifecycle encoded ≥3× with no router.** `create` exists as both `commands/adr.md adr create` (`:11`)
and `skills/adr-create`; `supersede/status/graph/search/check` live **only** in the command
(`adr.md:22-46`); `index/verify` live **only** as skills. Nothing reconciles them — agent, command,
and skills each restate the lifecycle in their own vocabulary. The ADR template is duplicated 3× (in
`REFERENCE.md`, `adr-create/SKILL.md:23-51`, and the agent's pointer) and the copies **already
disagree** (§3).

**Over-grant.** `adr-architect` is registered as an agent type with **"All tools"** despite its body
enumerating a scoped set (`adr-architect.md:18-25`) — and the prose grant already includes
`Write`/`Edit`/`Bash`. An ADR *recorder* with unrestricted Bash is exactly the over-grant nxtlvl's
read-contract discipline guards against. Skills inherit it: `adr-create` carries
`Bash Read Write Edit Grep Glob` + 5 MCP tools (`adr-create/SKILL.md:5`); read-only `adr-review` still
ships `Bash` (`adr-review/SKILL.md:5`).

**Numbering hazard, present and unguarded.** `adr-create/SKILL.md:18` and `adr.md:13` assign the next
number by `Glob`-ing the **local working tree only** — the exact dup-against-committed/remote hazard
nxtlvl already logged.

**Compliance-as-taste.** `adr-review` flags code that "contradicts an accepted decision"
(`adr-review/SKILL.md:30-34`) — a subjective LLM judgment presented as a compliance *violation*, with
no separation from objective integrity.

**Learning theater.** `adr-architect.md:40-45` appends `hooks post-task --train-neural true` after
every task — an unfalsifiable "compounds over time" claim with no wired consumer.

*Honest strengths:* the scripts-over-MCP-round-trips instinct is correct (`adr-index/SKILL.md:15`);
the lean-agent-via-REFERENCE-pointer matches nxtlvl's ADR-007 pointers-over-content policy
(`adr-architect.md:14-16`); the relationship vocabulary (`supersedes`/`amends`/`depends-on`/`related`)
is well-defined.

## 2. Mechanism & wiring (the runnable spine)

**`verify.mjs` is a real objective gate** operating on what `import.mjs` persisted:

- **DFS supersede-cycle detection** — genuine recursive DFS with `visited`/`stack`, records the path on
  re-entry, deduped via `Set` (`verify.mjs:62-82,90`).
- **Dangling-ref detection** — edges whose `to`/`from` ADR id isn't present in `adr-patterns`
  (`verify.mjs:59-60`).
- **Two-tier exit contract** (`verify.mjs:118-121`): exit **1** on any cycle (always, fail-closed);
  `VERIFY_STRICT=1` *additionally* fails on dangling refs; otherwise exit 0. **This is nxtlvl's
  block-on-objective-facts / warn-on-the-softer-stuff doctrine expressed as an exit contract.**

**Reusable hygiene idioms:**

- **Issue-number false-positive guard** (`extractAdrRefs`, `import.mjs:169-182`): strips
  `#1697`/`issue 1697`/`PR 1234`/commit hashes/backtick spans *before* matching `ADR-NNN` — fixes a
  real prior bug where `#1697` was captured as `ADR-1697` (`import.mjs:132-136`).
- **`spawnSync` argv-array, never a shell string** (`import.mjs:185-190`, `verify.mjs:23-26`): ADR
  titles with quotes/`$`/backticks can't break the call. Injection-safe by construction; it's the
  stated reason for the script (`import.mjs:19-21`).

**Degraded / silently-lying modes (the disqualifiers):**

- **verify.mjs fabricates a clean pass from a missing backend.** `memoryListJson` returns `[]` on any
  non-zero CLI status (`verify.mjs:27`), so an absent/broken backend is indistinguishable from a clean
  graph → "0 ADRs, 0 issues, exit 0." It reports a verification it never performed — the exact
  fail-soft-and-lie pattern the broader ruflo memory subsystem is known for (here without the
  Jaccard/`quality*=1.05` fudging, but the same family trait).
- **`exists`-counts-as-stored.** A `UNIQUE constraint` collision is mapped to `'exists'` and counted as
  success (`import.mjs:192,216`); under `CLI_CORE=1` the JSON backend overwrites by default, so re-runs
  silently overwrite while still reporting success.
- **`smoke.sh` tests nothing behavioral** — 15 static grep/`node --check` steps; steps 12-13 merely
  confirm the *strings* `cycles`/`danglingRefs`/`process.exit(1)` are *present* in the source
  (`smoke.sh:108-115`), not that the checks work. A verify.mjs that detected cycles incorrectly would
  still pass smoke. (It also carries version-pin drift: header says v0.2.0, step 1 asserts 0.3.0, step 6
  pins README to v3.6.)
- **Gaps nxtlvl must build itself:** neither script checks **numbering gaps/dupes** or
  **README-index-vs-disk** reconciliation (ruflo's "index" *is* the keystore, rebuilt from disk, so the
  two can't disagree by construction — nxtlvl's separate index table can).

## 3. Format, docs & example

**Two incompatible formats that don't match.** The REFERENCE template
(`REFERENCE.md:9-40`) prescribes a **bold-list** metadata form (`- **Status**`, lowercase
`proposed | accepted | deprecated`), 3-digit `ADR-NNN`, sections Context·Decision·Consequences with a
`### Positive/Negative/Neutral` sub-split, and **no Alternatives Considered section**. The one
dogfooded example (`docs/adrs/0001-adr-plugin-pattern.md:1-9`) instead uses **YAML frontmatter**,
**4-digit** `0001`/`ADR-0001`, capitalized `status: Proposed`, renames `Deciders`→`authors`, and adds
a `## Verification` section the template never mentions. The plugin's "single template" claim is
**self-falsified by its own only example**, on four axes. The status case is incoherent too: the
template says lowercase `proposed` (`REFERENCE.md:12`), the only example says `Proposed`
(`0001-…:5`), and `adr-create/SKILL.md:26` emits lowercase — three of the four disagree. (The import
parser itself is case-insensitive — `/^status:\s*(.+)$/im`, `import.mjs:97` — so this is
documentation/dogfooding drift, not a parse bug.)

**The genuinely distinctive idea — code-ADR drift detection** (`REFERENCE.md:86-101`):
`grep -rnE "ADR-[0-9]{3}" src/` → `git blame` each hit → compare code-change timestamp against the
ADR's `Date:` → flag code that changed *after* an accepted ADR without a same-PR amendment. nxtlvl has
no analog. (Their grep is hardcoded `[0-9]{3}` and would **miss their own 4-digit `ADR-0001`** — copy
the concept, not the regex.)

**Threshold dilution — the strongest cultural reject.** Nothing in README/REFERENCE/example states
*when* a decision is ADR-worthy. The example ADR's own framing — "every other plugin in this repo is
documenting itself with an ADR-0001 by the very contract this plugin proposes" (`:13`) — endorses **one
boilerplate ADR per plugin for symmetry**. The artifact itself records housekeeping ("add an ADR, bump
version, add a smoke script") and admits the bump is "not by behavior change" (`:76`). It's an ADR
about adding an ADR — precisely the "ADR for every choice" dilution nxtlvl's §1 forbids (methodology →
plan, not ADR).

**Grandiose claims vs a 14-file set:** "compliance checking that scans git diffs" (`README.md:7`),
`adr search` "Semantic search across ADRs" (`README.md:41`), "cross-project pattern transfer"
(`README.md:62`) — all depend on undeclared sibling plugins and an MCP server `plugin.json` never
declares. Treat every README capability claim as unverified.

*Format ideas worth keeping:* typed edge vocabulary — `amends` matches nxtlvl's "resolved question →
amend that ADR" guidance but gives it a name; `depends-on` answers a traversal nxtlvl's flat index
can't.

---

## Consolidated ledger — Adopt / Adapt / Reject (mapped to nxtlvl surfaces)

### ADOPT — port the algorithm/idiom, drop the backend

> Backlog IDs (`docs/plan/nxtlvl-harness-adopt-backlog.md`): the two §5-audit rows are **RADR-01**,
> **RADR-02**; the ADAPT drift-detection row is **RADR-03**. The finer tactical adopts below
> (sanitizer, argv-array, typed fields) remain build-time notes — promote to the backlog only if/when
> worth tracking as standalone work items.

| ID | Item | nxtlvl surface | Rationale | Evidence |
|---|---|---|---|---|
| **RADR-01** | **DFS supersede-cycle detector** | §5 ADR-integrity audit | Correct, self-contained; maps 1:1 onto "superseded ADRs form no impossible loop." Run over edges parsed from **markdown frontmatter**, not a keystore. Objective+binary → may BLOCK. | `verify.mjs:62-82` |
| **RADR-02** | **Two-tier exit contract** (block on cycles / warn on dangling unless STRICT) | §5 audit exit discipline | Already expresses block-on-facts / warn-on-the-rest. | `verify.mjs:118-121` |
| — | **Issue-number false-positive sanitizer** (strip `#N`/`PR N`/commit/backticks before `ADR-NNN`) | doc-keeper / audit cross-link parsing | nxtlvl parses the same cross-links and hits the identical `#1697`→`ADR-1697` trap. | `import.mjs:169-182` |
| — | **`spawnSync` argv-array (never shell-string) idiom** | audit, when it shells `git`/`gh` | Injection-safe by construction; ADR titles/paths can't break the call. | `import.mjs:185-190` |
| — | **Typed `depends-on` (optional frontmatter field)** | house format (§3) | nxtlvl already cross-links ADRs but untyped; typing the dependency edge is pure gain, no DB needed. | `REFERENCE.md:81-84` |

### ADAPT — borrow the idea, reject the plumbing

| ID | Item | nxtlvl surface | Rationale | Evidence |
|---|---|---|---|---|
| **RADR-03** | **Code-ADR drift detection** (grep ADR IDs in source + git-blame-vs-acceptance-date) | §5 invoked audit check | A real capability nxtlvl's documentary ADRs lack — but implement as a plain script against `docs/decisions/`, no AgentDB, and a regex that matches nxtlvl's actual `ADR-NNN` slug (theirs is broken). | `REFERENCE.md:86-101` |
| — | **Dangling-ref + status-mismatch checks** | §5 audit | Keep the checks; source the id-set/edges from the **filesystem** (glob `docs/decisions/`, parse frontmatter), not a keystore. | `verify.mjs:59-60`; `import.mjs:227-232` |
| — | **`amends` as a named relationship** | §1 amend-existing-ADR guidance | §1 already says resolved questions "amend that ADR" but has no field/marker; record in-file (`amended-by:`), reject out-of-band edge storage. | `REFERENCE.md:83` |
| — | **Frontmatter-first / body-fallback parser robustness** | doc-keeper (legacy ingest only) | nxtlvl is single-format, but the parse *ordering* is sane if doc-keeper ever ingests legacy ADRs. | `import.mjs:69-130` |

### REJECT — confirms a locked nxtlvl position

| Item | nxtlvl position confirmed | Evidence |
|---|---|---|
| **AgentDB/CLI keystore as ADR backend** | files-over-DB; markdown *is* the store | `adr.md:14,30`; `import.mjs:184`; `verify.mjs:43-44` |
| **verify.mjs backend-absent silent-pass** (fabricates exit 0) | the audit must **fail loud** when inputs are missing, never report a verification it didn't perform | `verify.mjs:27,43-44` |
| **"All tools" / Bash+Write on an ADR recorder** | doc-keeper's deliberately scoped read-contract | `adr-architect.md` "All tools"; `adr-create/SKILL.md:5` |
| **Subjective "code contradicts ADR" as a *violation*** | §5 taste-never-gates (compliance is WARNING-only) | `adr-review/SKILL.md:30-34` |
| **Redundant lifecycle across command+skills+agent, no router, template 3× drifting** | single-source-of-truth (doc-keeper loads ONE skill; router dispatches) | `adr.md:11-46` vs `adr-create/SKILL.md`; drift `:26` vs `import.mjs:97-102` |
| **Working-tree-only `Glob` for next number** | known numbering-collision hazard (verify vs committed/remote) | `adr-create/SKILL.md:18`; `adr.md:13` |
| **Bold-list `**Status**:` metadata** | YAML frontmatter (ruflo's own example abandoned the bold-list) | `REFERENCE.md:11-15` vs `0001-…:1-9` |
| **`Positive/Negative/Neutral` consequences split + no Alternatives section** | Context·Decision·**Alternatives Considered**·Consequences | `REFERENCE.md:27-34` |
| **One boilerplate ADR-0001 per plugin "for symmetry"** | §1 threshold: architectural **AND** expensive-to-reverse; curate hard | `0001-…:13,76` |
| **smoke.sh grep-as-contract** | test the audit's *behavior* against fixture ADRs (seed a cycle/dangling/dup), not its source strings | `smoke.sh:108-115` |
| **`--train-neural` / "compounds over time" hooks** | no wired consumer; rhetoric–wiring gap | `adr-architect.md:40-45` |

---

## Applying to nxtlvl

**One actionable thread, one confirmation thread.**

1. **When nxtlvl builds the §5 invoked ADR-integrity audit, `verify.mjs` is the reference
   implementation to port** — lift the DFS cycle detector, dangling-ref check, two-tier exit contract,
   issue-number sanitizer, and argv-array spawn idiom, but **read the markdown filesystem directly**
   (never a keystore) and **fail loud on missing inputs** (the opposite of ruflo's silent-pass). Then
   build the two checks ruflo *doesn't* have — numbering gaps/dupes (against the committed/remote tree,
   per the logged hazard) and README-index-vs-disk reconciliation. Optionally graft **typed
   `depends-on`/`amends` frontmatter fields** and a **code-ADR drift check** (plain grep + git-blame,
   fixed regex) as the audit's softer, WARNING-tier signals.

2. **Everything else confirms positions already locked** — files-over-DB, scoped read-contracts,
   single-source-of-truth + router, objective-gates-only, YAML frontmatter, the Context·Decision·
   **Alternatives**·Consequences skeleton, and the §1 threshold against per-artifact boilerplate ADRs.
   ruflo-adr is most useful to nxtlvl as a worked counter-example: a plugin that split its own
   source-of-truth, over-granted its recorder, and generated an ADR about adding an ADR — each the
   negative image of a decision nxtlvl already made deliberately.

**No ADR.** Audit-tactics + format-field harvest only; fold the adopts into the C&M / future-audit
plan when that work starts.
