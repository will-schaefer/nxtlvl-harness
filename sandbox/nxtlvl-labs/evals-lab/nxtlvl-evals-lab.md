# Spec: `evals-lab` — the standing eval / measurement instrument

> Status: **DRAFT** (awaiting approval). Produced via `nxtlvl:brainstorm` → `spec-driven-development`
> (2026-06-22). The approved design from the brainstorm is the input; this is its written contract.
> Sibling lab `harness-lab` ([`docs/spec/nxtlvl-harness-lab.md`](../../../docs/spec/nxtlvl-harness-lab.md)) is the consumer of
> this lab's output — its `graduate.js` reads the scorecard this lab emits. The two are decoupled by a
> single interface: **`{eval spec} → engine → {scorecard}`**.

## Objective

**What:** A self-contained measurement workspace, `evals-lab` (ships namespaced as `nxtlvl:evals-lab`),
living at `Developer/sandbox/nxtlvl-labs/evals-lab/`, whose one job is to **run a capability's declared
eval against a labeled corpus and emit a scorecard** — the objective signal the `harness-lab` graduation
gate consumes. It is the **engine**; the corpora live *with* the capabilities they measure.

**Why:** `harness-lab` ([ADR-033](../../../docs/decisions/ADR-033-three-part-objective-graduation-contract.md)) graduates a
capability only when its **declared evals pass** — which presupposes something that can *run* an eval and
*produce* a scorecard. Nothing in the harness does that yet. `evals-lab` is that instrument. Building it
now is not a reversal of [ADR-019](../../../docs/decisions/ADR-019-agent-evaluation-model.md) — it is that ADR's
deferral **firing on schedule** (see §Relationship to ADR-019).

**Who:** The user (solo), running daily, building agents *with* the agent harness (dogfooding).

**Success looks like:** a capability declares an eval (a spec + a labeled corpus + a tiny adapter), the
engine runs it and writes a scorecard whose `pass` verdict is **earned, falsifiable, and impossible to
fake** — a crash can never surface as a green light.

### Approach — walking skeleton (locked at brainstorm)

The instrument is **grown from one real, already-trustworthy eval**, not designed top-down. The first
eval is the **dangerous-bash gate** ([`plugins/nxtlvl/hooks/dangerous-bash.js`](../../../plugins/nxtlvl/hooks/dangerous-bash.js)),
whose 53-case unit test already proves the gate's behavior. Its **corpus-shaped subset** (35 cases — see
§The eval↔test boundary) is re-expressed as a labeled corpus, graded by an exact-match grader, and run by
a thin engine that emits a scorecard. Making that *one* case work end-to-end fixes the seam schema and
proves the whole pipeline; every other grader and feature waits for a *second* eval that needs it (§Deferred).

### The 3-tier promotion ladder (shared with `harness-lab`)

```
harness-lab          →   nxtlvl plugin      →   installed ~/.claude
(incubation)            (the workbench)        (stable daily driver)
     │
     │ graduate.js reads ▲ scorecard
     ▼                   │
evals-lab ──────────────┘   (the measurement instrument: {eval spec} → engine → {scorecard})
```

Both labs are tracked subdirs of the `Developer` repo under the off-discovery `sandbox/` staging tree
([ADR-031](../../../docs/decisions/ADR-031-labs-in-sandbox-topology.md)) — never loaded, routed to, or warned
about by the live plugin. `evals-lab` is decoupled from `harness-lab` *only by the seam contract*: it never
imports `harness-lab`, and `harness-lab` never imports the engine's internals — it reads the scorecard.

## Relationship to ADR-019 (this activates a deferral; it does not contradict one)

[ADR-019](../../../docs/decisions/ADR-019-agent-evaluation-model.md) §Decision.4 reserved standing eval suites as
*"intake-gated machinery, attached to the promotion audit when justified — not a standing harness built
now,"* and rejected standing `eval-harness` because there was *"nothing yet to regress against."* Two
things flipped that condition:

1. **A consumer now requires a scorecard.** The `harness-lab` graduation gate
   ([ADR-033](../../../docs/decisions/ADR-033-three-part-objective-graduation-contract.md)) blocks unless declared evals
   pass — it cannot exist without an engine that produces the scorecard.
2. **A concrete regression target now exists.** The dangerous-bash gate (53-case test, live and firing) is
   a real, trustworthy thing to regress against — exactly what ADR-019 said was missing.

So `evals-lab` is the **"when justified" trigger firing**. It **refines** ADR-019 (the standing instrument
is now warranted, scoped to one eval) rather than overturning it — recorded as an ADR (§Decisions, #1).
The advisory per-task self-evaluation of ADR-019 is untouched and remains *not a gate*.

## Future consumer — the cross-lab `labs` app (out of scope)

A planned `nxtlvl` **`labs` app** (a visual tool) will sit *above* every lab — `harness-lab`, `evals-lab`,
and any future lab — reading each lab's **state** and invoking its **actions** through a uniform per-lab
descriptor (`{ state, actions }`). `evals-lab` is **app-ready by construction**: its state is the
machine-readable `scorecard.json` and its action is the `run-eval` CLI, both documented in
`docs/seam-contract.md`. **This adds no build work here** — the app is a *sibling subsystem* with its own
brainstorm → spec → plan cycle, designed **after** the labs are built (so it designs against real
scorecards + ledger data, not vaporware). The only requirement it places on `evals-lab` is the one already
met: keep outputs machine-readable and the CLI programmatically invocable. The uniform descriptor shape is
defined in the app's cycle, which then adds a parallel note to each lab spec — symmetric, not
evals-lab-special.

## Tech Stack

- **Node.js** (LTS) — the engine, graders, scorecard builder, CLI.
- **`node:test`** — unit/regression tests (matches the nxtlvl convention, e.g.
  [`plugins/nxtlvl/hooks/dangerous-bash.test.js`](../../../plugins/nxtlvl/hooks/dangerous-bash.test.js)).
- **YAML** — `eval.yaml` per capability (structured, script-parseable) via a pinned **`js-yaml`** in the
  lab's own `package.json` (the same controlled-single-dep call `harness-lab` made for `manifest.yaml`,
  [ADR-032](../../../docs/decisions/ADR-032-cells-installable-as-plugin-architecture.md) / its plan ◇ D2).
- **JSONL** — the corpus format (one labeled case per line; appendable, diffable, streamable).
- **bash** — thin glue only.

## Commands

> Intended surface (nothing is built yet). Final names land in the plan.

```
Run one eval:      node bin/run-eval.js <eval-dir>     # → writes <eval-dir>/scorecard.json + prints summary
Run via npm:       npm run eval -- <eval-dir>          # package.json wrapper
Test the machinery: node --test 'bin/**/*.test.js'     # explicit glob (a directory arg breaks the runner)
```

## Project Structure

```
sandbox/nxtlvl-labs/evals-lab/        # tracked subdir of the Developer repo (beside harness-lab/)
  package.json                        # self-contained Node subproject; pins js-yaml; npm run eval/test
  README.md
  bin/
    run-eval.js                       # CLI: resolve eval-dir → load → evaluate → write scorecard.json
    lib/
      engine.js                       #   pure evaluate({spec,corpus,adapter,grader}) → scorecard (total; never throws)
      graders.js                      #   grader registry: { "exact-match": (actual,expected) => actual === expected }
      scorecard.js                    #   build + validate the scorecard shape
    __fixtures__/                     #   tiny synthetic eval — the engine's own fast, isolated unit fixture
    *.test.js                         #   node:test (engine, graders, scorecard, run-eval)
  docs/
    seam-contract.md                  # the eval.yaml + scorecard schema, written down — the LOCKED seam

plugins/nxtlvl/hooks/evals/dangerous-bash/   # the FIRST real eval — lives WITH the capability it measures
  eval.yaml                           #   the eval spec (declares sut adapter, grader, corpus, criteria)
  corpus.jsonl                        #   35 labeled cases (block/allow/warn) from the dangerous-bash test
  adapter.js                          #   the SUT bridge: a corpus input → decide() → graded value
```

**Corpora travel with the capability, never with the lab.** The engine is the only thing that lives in
`evals-lab`; a capability's `eval.yaml` + `corpus.jsonl` + `adapter.js` sit next to the capability and
**graduate alongside it** (`harness-lab` spec: *"a cell's `evals/` travel with it on graduation"*). The
lab keeps only a *synthetic* fixture under `bin/__fixtures__/` so the engine's own tests stay fast and
self-contained. This is recorded as an ADR (§Decisions, #1).

### The eval↔test boundary (why this is additive, not a rewrite)

The existing [`dangerous-bash.test.js`](../../../plugins/nxtlvl/hooks/dangerous-bash.test.js) **stays
untouched** — it is the *code* regression lock (runs on every `node --test`). The eval is a **different
instrument with a different consumer**: the same classification cases, re-expressed as a labeled corpus,
graded into a scorecard the gate reads.

Of the 53 test cases, exactly **35 are corpus-shaped** — those that map a *command string* to an *expected
classifier decision*:

| Group | Count | Expected `code` | In corpus? |
|-------|------:|-----------------|-----------|
| MUST_BLOCK | 19 | `2` (tag `block`) | ✅ |
| MUST_ALLOW | 12 | `0` (tag `allow`) | ✅ |
| MUST_WARN  | 4  | `0` (tag `warn`)  | ✅ |
| FAIL_OPEN  | 8  | n/a — malformed/raw stdin, not a command | ❌ test-only |
| KILL_VALUES | 6 | n/a — varies the env, not the command | ❌ test-only |
| detector contract | 4 | n/a — calls internal helpers, not `decide()` | ❌ test-only |

The 18 non-corpus cases are **not expressible** through the adapter (which always wraps a command in valid
JSON with a fixed env), so they remain the unit test's job. This gives the eval↔test split a *principled*
line, not an arbitrary one: the eval owns input→decision classification; the test owns malformed-input
fail-open, the kill switch, and detector-unit contracts.

## The seam contract (centerpiece — the shape is LOCKED by this spec)

This spec fixes the **concrete schema** the `harness-lab` spec deferred to *"co-design with the evals-lab
cycle."* The full schema is documented in `docs/seam-contract.md`; the shapes below are normative.

**`eval.yaml`** — declared *with* the capability:

```yaml
name: dangerous-bash
sut: { adapter: ./adapter.js }    # adapter exports run(input) -> actual
grader: exact-match               # registry key; only exact-match is built in this seed
corpus: ./corpus.jsonl
criteria:                         # each maps to a graduation_criteria bar the cell declared
  - { id: block-recall,    select: { tag: block }, metric: pass-rate, bar: 1.0 }
  - { id: allow-precision, select: { tag: allow }, metric: pass-rate, bar: 1.0 }
  - { id: warn-recall,     select: { tag: warn },  metric: pass-rate, bar: 1.0 }
```

**`corpus.jsonl`** — one labeled case per line:

```jsonl
{"input":"rm -rf /","expected":2,"tag":"block","label":"rm -rf /"}
{"input":"git branch -f main","expected":0,"tag":"allow","label":"branch -f (not a push)"}
{"input":"git reset --hard","expected":0,"tag":"warn","label":"reset --hard"}
```

**`adapter.js`** — the entire SUT bridge (the only capability-specific glue):

```js
const { decide } = require('../../dangerous-bash.js');
// a corpus input (a command string) → the graded value (the gate's exit code: 0 | 2)
exports.run = (command) => decide(JSON.stringify({ tool_input: { command } }), {}).code;
```

**`scorecard.json`** — the engine's output, **the exact shape `graduate.js` reads**:

```json
{
  "eval": "dangerous-bash",
  "status": "ok",
  "cases": { "total": 35, "passed": 35, "failed": 0 },
  "criteria": [
    { "id": "block-recall",    "bar": 1.0, "value": 1.0, "pass": true },
    { "id": "allow-precision", "bar": 1.0, "value": 1.0, "pass": true },
    { "id": "warn-recall",     "bar": 1.0, "value": 1.0, "pass": true }
  ],
  "pass": true,
  "failures": []
}
```

- `pass` is `true` **iff** `status === "ok"` *and* every criterion passes.
- `failures[]` carries **pointers** — `corpus.jsonl` line refs (e.g. `corpus.jsonl:12`) — never dumped
  case content (house pointers-over-content rule).
- `status` is `"ok"` or `"error"`; on `"error"`, `pass` is forced `false` (§The safety inversion).

> **Known seam limitation (acceptable for the seed):** under the code-only `exact-match` grader, a `warn`
> case (`expected: 0`) asserts only *"not blocked"* — identical to an `allow` case. Verifying the WARNING
> *message* is the **deferred message dimension** (needs a predicate/regex grader, §Deferred). The `tag:
> warn` label is kept in the corpus now so that dimension can attach later without re-tagging.

## Code Style

Follow existing nxtlvl conventions:

- **Pointers over dumped content** in the scorecard and all CLI output — reference `path:line`, never
  paste case blocks.
- **Pure, total core.** `engine.js`'s `evaluate(...)` never throws: malformed input, a thrown adapter, a
  missing corpus line → a scorecard with `status: "error"`, not a crash.
- **Exit-code contract for `run-eval.js`:** `exit 0` when the eval *ran* (regardless of `pass` — the
  verdict lives in the scorecard, not the exit code); a non-zero exit means the CLI itself could not run
  (bad args, unreadable dir). The gate reads the scorecard's `pass`, not the CLI exit code.

```js
// bin/lib/engine.js — the measurement core (illustrative)
function evaluate({ spec, corpus, adapter, grader }) {
  try {
    const graded = corpus.map((c, i) => ({ i, ...c, actual: adapter.run(c.input) }))
                         .map(g => ({ ...g, pass: grader(g.actual, g.expected) }));
    const criteria = spec.criteria.map(cr => scoreCriterion(cr, graded));
    return buildScorecard(spec.name, 'ok', graded, criteria); // pass = every criterion passes
  } catch (err) {
    return buildScorecard(spec.name, 'error', [], [], err);   // status:error ⇒ pass:false, NEVER pass:true
  }
}
```

## The safety inversion (a named design principle — recorded as an ADR)

A **gate** and a **measurement** fail in *opposite* directions, on purpose:

- A **gate fails OPEN** — on a crash it *allows*, so a bug can never lock you out
  ([ADR-006](../../../docs/decisions/ADR-006-hook-fail-open-gated-blocking.md), the dangerous-bash gate,
  `harness-lab`'s `graduate.js`).
- A **measurement fails toward NOT-PASSED** — on a crash it emits `status:"error"`, `pass:false`, so a bug
  can never *fake a green light*.

These compose cleanly: `graduate.js` still fails open on *its own* crash, but a well-formed scorecard that
says `pass:false` is a **clean signal** it deliberately blocks on (`exit 2`). No crash anywhere
masquerades as a clean result. This is recorded as an ADR (§Decisions, #3).

## Testing Strategy

- **Engine / graders / scorecard** unit-tested with `node:test`, run via the explicit glob
  `node --test 'bin/**/*.test.js'`.
- **Mutation discipline** (the same proof the dangerous-bash gate earned): flip a `corpus.jsonl`
  `expected` value → the engine must report that criterion `pass:false`. Proves the engine *bites* and the
  suite is non-vacuous.
- **Safety-inversion test:** an induced engine/adapter error → `status:"error"`, `pass:false` — asserted
  to **never** be `pass:true`.
- **End-to-end proof:** `run-eval` against the real dangerous-bash eval → `scorecard.pass === true`,
  `cases.total === 35`.
- The engine's unit tests use the synthetic `bin/__fixtures__/` eval (fast, isolated); the dangerous-bash
  eval is the end-to-end integration proof.

## Deferred on purpose (YAGNI — the walking skeleton's whole point)

Each waits for a *second* eval that actually needs it:

- **LLM-judge & predicate graders** (the latter unlocks the deferred WARNING-message dimension).
- **Multi-eval ledger / dashboard** and **auto-discovery** of all evals in the tree.
- **CI wiring** (a standing job that runs every eval).
- The **message** and **kill-switch / env** eval dimensions of dangerous-bash.

## Boundaries

- **Always:** keep the eval **additive** (never replace `dangerous-bash.test.js`); keep corpora *with* the
  capability; make scorecard failures **pointers, not dumps**; keep `engine.evaluate` total (never throws);
  make a measurement **fail toward not-passed**.
- **Ask first:** changing the seam schema (`eval.yaml` / `scorecard.json`) once locked; adding a new grader
  type; changing the safety-inversion rule; sharing vs. independently pinning `js-yaml` with `harness-lab`.
- **Never:** report `pass:true` on an engine error; dump case content into the scorecard; let an engine
  crash surface as `pass:true`; let the CLI exit code stand in for the scorecard verdict.

## Success Criteria

- [ ] `run-eval` against the dangerous-bash eval emits a **schema-valid** scorecard with `pass:true`,
      `cases.total === 35`.
- [ ] A **mutated** `corpus.jsonl` `expected` value flips the relevant criterion to `pass:false` (the
      engine bites) — proven by a `node --test` case.
- [ ] An **induced engine error** yields `status:"error"`, `pass:false` — never `pass:true`.
- [ ] `docs/seam-contract.md` documents the `eval.yaml` + `scorecard.json` schema as the locked seam.
- [ ] The dangerous-bash eval artifacts live **with the capability** under
      `plugins/nxtlvl/hooks/evals/dangerous-bash/`.
- [ ] [`dangerous-bash.test.js`](../../../plugins/nxtlvl/hooks/dangerous-bash.test.js) remains **unchanged and
      green**.
- [ ] `node --test 'bin/**/*.test.js'` green (engine, graders, scorecard, run-eval).

## Open Questions

- **Exact ADR numbers** — proposed **034–036**, *after* `harness-lab`'s already-present 031–033; verify
  against the committed/remote tree at recording time (numbering-collision hazard — doc-keeper globs the
  working tree).
- **`js-yaml` sharing** — pin independently in `evals-lab/package.json`, or share one pin with
  `harness-lab`? (an "ask first" boundary.)
- **Canonical smoke target** — is the synthetic `__fixtures__/` eval or the real dangerous-bash eval the
  thing a future CI job runs? (Deferred with CI wiring.)
- **`select` expressiveness** — the seed supports `{ tag: <x> }` only; richer selection (multiple tags,
  predicates) is deferred until a second eval needs it.
- **Lab-descriptor shape for the `labs` app** — the uniform `{ state, actions }` contract the cross-lab
  app discovers each lab through; defined in the **app's own cycle** (after the labs are built), not here.
  `evals-lab` already exposes both sides (`scorecard.json` state + `run-eval` action).

## Decisions to record as ADRs (after this spec + plan are approved)

Per the decision rule (`~/.claude/rules/decisions.md`), record after spec+plan — each is architectural and
expensive to reverse. **Verify numbering against the committed/remote tree first** (031–033 are taken by
`harness-lab`; propose 034–036).

1. **`evals-lab` = engine-only; corpora travel with capabilities; ADR-019 reactive trigger fires.** The
   measurement instrument owns only the engine; a capability's eval spec + corpus live with it and
   graduate alongside it. Records that this is [ADR-019](../../../docs/decisions/ADR-019-agent-evaluation-model.md)'s
   *"when justified"* deferral activating (refines, does not overturn it), enabled by
   [ADR-033](../../../docs/decisions/ADR-033-three-part-objective-graduation-contract.md)'s scorecard requirement and the
   topology of [ADR-031](../../../docs/decisions/ADR-031-labs-in-sandbox-topology.md).
2. **The eval-spec + scorecard schema is the LOCKED seam contract.** Fixes the concrete `{eval spec} →
   scorecard}` shape the `harness-lab` spec deferred; changing it afterward is an "ask first" boundary
   because both labs depend on it.
3. **The safety inversion: a measurement fails toward not-passed.** Complements
   [ADR-006](../../../docs/decisions/ADR-006-hook-fail-open-gated-blocking.md)'s fail-open-for-gates: a gate fails
   open, a measurement fails toward `pass:false`, so no crash ever fakes a green light.
