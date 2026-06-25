# evals-lab — the standing eval / measurement instrument

> A self-contained Node subproject under the off-discovery `sandbox/` staging tree
> ([ADR-031](../../../docs/decisions/ADR-031-labs-in-sandbox-topology.md)), beside `harness-lab/`.
> Spec: [`docs/spec/nxtlvl-evals-lab.md`](../../../docs/spec/nxtlvl-evals-lab.md) ·
> Plan: [`docs/plan/nxtlvl-evals-lab-plan.md`](../../../docs/plan/nxtlvl-evals-lab-plan.md).

## What this is

`evals-lab` is the **engine**. Its one job: **run a capability's declared eval against a labeled
corpus and emit a scorecard** — the objective signal the `harness-lab` graduation gate
([`graduate.js`](../harness-lab/bin/graduate.js)) consumes. The two labs are decoupled by one
interface:

```
{ eval spec }  ──→  evals-lab engine  ──→  { scorecard }
```

**Corpora travel with the capability, not with the lab.** A capability's `eval.yaml` +
`corpus.jsonl` + `adapter.js` live next to the capability (e.g.
`plugins/nxtlvl/hooks/evals/dangerous-bash/`) and graduate alongside it. The lab keeps only a
synthetic fixture under `bin/__fixtures__/` so its own tests stay fast and self-contained.

## The safety inversion

A **gate** fails *open* (a crash allows, so a bug can't lock you out). A **measurement** fails the
*opposite* way: on any engine/adapter crash it emits `status:"error"` + `summary.allPassed:false`,
so a bug can never **fake a green light**. `engine.evaluate()` is pure and total — it never throws.

## Usage

```sh
npm install                                  # restore js-yaml (pinned, see package.json)
npm run eval -- <eval-dir>                   # → writes <eval-dir>/scorecard.json + prints a summary
node bin/run-eval.js <eval-dir>              # same, directly
npm test                                     # node --test 'bin/**/*.test.js'
```

## Layout

```
package.json            self-contained Node subproject; pins js-yaml; npm run eval / test
bin/
  run-eval.js           CLI: resolve eval-dir → load → evaluate → write scorecard.json
  lib/
    engine.js           pure evaluate({spec,corpus,adapter,grader}) → scorecard (total; never throws)
    graders.js          grader registry: { "exact-match": (actual,expected) => actual === expected }
    scorecard.js        build + validate the scorecard shape
  __fixtures__/         tiny synthetic eval — the engine's own fast, isolated unit fixture
  *.test.js             node:test (engine, graders, scorecard, run-eval)
docs/
  seam-contract.md      the eval.yaml + scorecard schema, written down — the LOCKED seam
```

## The seam, in one breath

The scorecard is a **superset**: it carries the locked `harness-lab` core keys
(`results[]` + `summary.allPassed`) that `graduate.js` reads **unchanged**, plus evals-lab's own
`status` / `failures[]` / `cases` as additive provenance. See
[`docs/seam-contract.md`](docs/seam-contract.md) for the normative shapes.
