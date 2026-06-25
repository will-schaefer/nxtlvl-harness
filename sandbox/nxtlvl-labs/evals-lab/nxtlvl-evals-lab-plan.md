# Implementation Plan: `evals-lab` — the standing eval / measurement instrument (walking skeleton)

> SDD Phase: **Plan**. Implements the spec
> [`docs/spec/nxtlvl-evals-lab.md`](nxtlvl-evals-lab.md) (DRAFT → approve before build).
> 🤖 = agent-verifiable · 🧑 = manual gate · ◇ = decision to lock at plan review.
> **Status: DRAFT — awaiting human review before implementation.**

---

## 1. Framing

The spec defines a **self-contained Node subproject** (`evals-lab`, ships as `nxtlvl:evals-lab`) at
`sandbox/nxtlvl-labs/evals-lab/` — under the off-discovery `sandbox/` staging tree, beside `harness-lab/`.
Its one job: **run a capability's declared eval against a labeled corpus and emit a scorecard** — the
objective signal `harness-lab`'s `graduate.js` consumes. This plan orders the build of the engine, the
exact-match grader, the scorecard shape, the `run-eval` CLI, the **first real eval** (the dangerous-bash
gate, as artifacts living *with* the capability), the end-to-end proof, and the seam-contract doc.

Three constraints shape every task:

- **The measurement must never lie.** A gate fails *open* (a crash allows); a **measurement fails toward
  not-passed** — an engine/adapter crash yields `status:"error"`, `pass:false`, **never** `pass:true`.
  `engine.evaluate` is **pure and total** (never throws). This is the keystone discipline, regression-
  locked the same way the dangerous-bash gate was.
- **The seam is the contract.** Everything is built around one interface — `{eval spec} → engine →
  {scorecard}` — whose concrete shape the spec locks. The dependency graph is **foundation-first** (the
  scorecard shape + grader → the engine that produces it → the CLI that drives it), not vertically sliced
  by feature, because there is only one feature.
- **Additive, never a rewrite.** [`dangerous-bash.test.js`](../../../plugins/nxtlvl/hooks/dangerous-bash.test.js)
  stays **unchanged and green**; the eval re-expresses only the 35 corpus-shaped cases (19 block + 12 allow
  + 4 warn) as data. The other 18 cases stay test-only by design.

---

## 2. Architecture decisions (plan-level — surfaced for review)

- **A self-contained Node subproject with its own `package.json`.** Like `harness-lab`, `evals-lab` carries
  its own `package.json`, `npm run eval` / `npm test`, and `node:test` — tracked within the `Developer`
  repo (no separate `git init`).
- **One pure engine is the core.** `bin/lib/engine.js` exposes `evaluate({spec,corpus,adapter,grader}) →
  scorecard`, total and never-throwing; that purity makes the mutation + safety-inversion tests trivial.
  `graders.js` and `scorecard.js` are tiny pure modules it composes.
- **The corpus lives with the capability.** The dangerous-bash eval artifacts (`eval.yaml`,
  `corpus.jsonl`, `adapter.js`) are authored under `plugins/nxtlvl/hooks/evals/dangerous-bash/`, not in
  the lab — honoring the spec's "evals travel with the capability." The lab keeps only a synthetic
  `bin/__fixtures__/` eval for its own fast unit tests.
- **Pointers over dumped content** in the scorecard `failures[]` and all CLI output — `corpus.jsonl:line`
  refs, never pasted case blocks.

### ◇ Decisions — LOCKED at plan review (2026-06-22)

| ◇ | Decision | Resolution |
|---|----------|------------|
| **D1** | `js-yaml` dependency | **LOCKED: pin independently** in `evals-lab/package.json` — each lab is a self-contained Node subproject; trivial duplication buys full decoupling from `harness-lab`. |
| **D2** | Canonical smoke target | **LOCKED: the real dangerous-bash eval** is the canonical end-to-end smoke (real SUT, 35 cases); the synthetic `bin/__fixtures__/` eval stays only for fast, isolated engine unit tests. |
| **D3** | ADR numbers for the 3 decisions | **LOCKED: propose 034/035/036** (sequential after `harness-lab`'s existing 031–033); `nxtlvl:doc-keeper` re-verifies against the committed/remote tree at recording time (collision hazard). |

---

## 3. Dependency graph

```
Phase 0  PRE-FLIGHT (no code)
  T0  Lock ◇ D1–D3; confirm decide() signature + corpus source stable        🤖
        │
Phase 1  FOUNDATION (skeleton + the two pure leaf modules)
  T1  Scaffold evals-lab: tree · package.json (js-yaml) · README             🤖(sandboxed)
        │
        ├───────────────┐
  T2 scorecard.js      T3 graders.js
  (build+validate)     (exact-match registry)
        └───────┬───────┘
                ▼
Phase 2  ENGINE + CLI
  T4  engine.js — pure evaluate() → scorecard; mutation + safety-inversion    🤖
      tests on the synthetic fixture (KEYSTONE)
        │
  T5  run-eval.js — CLI: load → evaluate → write scorecard.json + pointers    🤖
        │
Phase 3  THE FIRST REAL EVAL + END-TO-END PROOF
  T6  dangerous-bash eval artifacts (corpus.jsonl 35 · eval.yaml · adapter)   🤖   [parallel after T1]
      under plugins/nxtlvl/hooks/evals/dangerous-bash/
        │
  T7  END-TO-END: run-eval on the dangerous-bash eval → pass:true, total 35;  🤖   [dep T5,T6]
      dangerous-bash.test.js still green
        │  ── Checkpoint: node --test 'bin/**/*.test.js' green; engine bites; measurement can't lie
  T8  docs/seam-contract.md — eval.yaml + scorecard schema written down       🤖   [dep T4,T6]
        │
Phase 4  RECORD DECISIONS (post-approval)
  T9  Record ADR-034/035/036 via nxtlvl:doc-keeper (verify numbering first)    🤖🧑 [dep approval]
```

**Critical path:** `T0 → T1 → T2/T3 → T4 → T5 → T7`. T6 is parallel (after T1); T8 after T4+T6; T9 last.

---

## 4. Phases & tasks

Sizes: XS (<30 min) · S (~1 hr) · M (~half day). Each task is an independently-verifiable slice.

### Phase 0 — Pre-flight (no code)

#### T0 — Lock ◇ D1–D3 + confirm the SUT seam *(XS, 🤖)*
- **Steps:** Resolve ◇ D1–D3 (§2) at plan review. Confirm `decide(rawInput, env)` is exported from
  [`dangerous-bash.js`](../../../plugins/nxtlvl/hooks/dangerous-bash.js) and returns `{code,message}` (it is,
  `:250`), and that the 35 corpus-shaped cases are lifted verbatim from
  [`dangerous-bash.test.js`](../../../plugins/nxtlvl/hooks/dangerous-bash.test.js) `MUST_BLOCK` / `MUST_ALLOW`
  / `MUST_WARN`.
- **Acceptance:** D1–D3 written into the §2 table; the corpus source rows identified.
- **Verify (agent):** the ◇ table shows resolutions; `grep -c` of the three case arrays = 19/12/4.
- **Depends on:** plan approval.

### Phase 1 — Foundation (skeleton + the two pure leaf modules)

#### T1 — Scaffold the `evals-lab` workspace *(S, 🤖 — sandboxed; writes under `Developer/sandbox/`)*
- **Steps:** Create the spec's tree (`bin/`, `bin/lib/`, `bin/__fixtures__/`, `docs/`); `package.json`
  with `scripts.eval` + `scripts.test` (`node --test 'bin/**/*.test.js'`) and the D1-resolved `js-yaml`
  pin; `README.md`. **No `git init`.**
- **Acceptance:** tree matches spec §Project Structure; `package.json` parses; appears in `git status`.
- **Verify (agent):** `node -e "require('./sandbox/nxtlvl-labs/evals-lab/package.json')"`;
  `ls -R sandbox/nxtlvl-labs/evals-lab` matches; `git status --short` lists the new path.
- **Depends on:** T0. **Files:** skeleton (scaffold). **Scope:** S.

#### T2 — `bin/lib/scorecard.js` (build + validate the shape) + tests *(S, 🤖)*
- **Steps:** `build(name, status, graded, criteria, err?) → scorecard` producing the spec's exact shape
  (`eval · status · cases{total,passed,failed} · criteria[] · pass · failures[]`); `pass = status==="ok"
  && criteria.every(c=>c.pass)`; `failures[]` are `corpus.jsonl:line` pointers. `validate(scorecard) →
  {errors[]}` (total). **`status:"error"` forces `pass:false`.**
- **Acceptance:** `build` with a failing criterion → `pass:false`; with `status:"error"` → `pass:false`
  even if criteria array is empty; `validate` flags a malformed scorecard.
- **Verify (agent):** `node --test bin/lib/scorecard.test.js`.
- **Depends on:** T1. **Files:** `bin/lib/scorecard.js`, `…test.js`. **Scope:** S.

#### T3 — `bin/lib/graders.js` (exact-match registry) + tests *(XS, 🤖)*
- **Steps:** `const graders = { 'exact-match': (actual, expected) => actual === expected }`; a
  `get(name)` that returns the grader or throws a typed "unknown grader" (caught upstream by the engine →
  `status:"error"`). ~3 lines + the lookup; **not** a plugin system.
- **Acceptance:** `exact-match` returns true on equal, false on unequal; `get('nope')` throws.
- **Verify (agent):** `node --test bin/lib/graders.test.js`.
- **Depends on:** T1. **Files:** `bin/lib/graders.js`, `…test.js`. **Scope:** XS.

### Phase 2 — Engine + CLI

#### T4 — `bin/lib/engine.js` — pure `evaluate()` (KEYSTONE) *(M, 🤖)*
- **Steps:** `evaluate({spec, corpus, adapter, grader}) → scorecard`: map each corpus case →
  `adapter.run(input)` → grade → aggregate per `criteria.select`/`metric`/`bar` → `build(...)`. Wrap the
  whole body in `try/catch`; **any throw → `build(name,'error',…)` (`pass:false`), never a re-throw and
  never `pass:true`.** Pointers-only failures.
- **Acceptance:** a clean synthetic fixture → `pass:true`; a **mutated** expected → the relevant criterion
  `pass:false`; a **throwing adapter** → `status:"error"`, `pass:false`.
- **Verify (agent):** `node --test bin/lib/engine.test.js` — regression-locked: pass-clean, mutation-bites,
  and **safety-inversion** (throwing adapter never yields `pass:true`) — the dangerous-bash-gate discipline.
- **Depends on:** T2, T3. **Files:** `bin/lib/engine.js`, `…test.js`, `bin/__fixtures__/*`. **Scope:** M.

#### T5 — `bin/run-eval.js` — the CLI *(S, 🤖)*
- **Steps:** `run-eval <eval-dir>`: resolve dir → load `eval.yaml` (js-yaml) → load `corpus.jsonl` →
  `require` the adapter → `grader = graders.get(spec.grader)` → `evaluate(...)` → write
  `<eval-dir>/scorecard.json` → print a pointer summary. Exit `0` when the eval **ran** (verdict lives in
  the scorecard); non-zero only when the CLI itself can't run (bad args / unreadable dir).
- **Acceptance:** on the synthetic fixture, writes a schema-valid `scorecard.json` and prints a summary;
  bad-args → non-zero with a usage line.
- **Verify (agent):** `node --test bin/run-eval.test.js` (writes into `$TMPDIR`); `npm run eval --` on the
  fixture exits 0 and the file validates.
- **Depends on:** T4. **Files:** `bin/run-eval.js`, `…test.js`. **Scope:** S.

### Phase 3 — The first real eval + end-to-end proof

#### T6 — Dangerous-bash eval artifacts (with the capability) *(M, 🤖 — parallel after T1)*
- **Steps:** Author under `plugins/nxtlvl/hooks/evals/dangerous-bash/`: `corpus.jsonl` (the 35 cases —
  19 `block`/expected 2, 12 `allow`/expected 0, 4 `warn`/expected 0 — lifted verbatim from the test
  arrays); `eval.yaml` (the spec's shape: adapter, `grader: exact-match`, corpus, 3 criteria); `adapter.js`
  (`exports.run = cmd => decide(JSON.stringify({tool_input:{command:cmd}}),{}).code`).
- **Acceptance:** `corpus.jsonl` has 35 well-formed lines with the right tag/expected split; `adapter.run`
  returns `2` for `rm -rf /` and `0` for `git branch -f main`.
- **Verify (agent):** `wc -l corpus.jsonl` → 35; a one-liner exercising `adapter.run` on two cases;
  `eval.yaml` parses.
- **Depends on:** T1. **Files:** 3 artifact files. **Scope:** M.

#### T7 — End-to-end proof + the test stays green *(S, 🤖)*
- **Steps:** Run `run-eval plugins/nxtlvl/hooks/evals/dangerous-bash` → expect `scorecard.pass === true`,
  `cases.total === 35`, `failures: []`. Re-run `node --test plugins/nxtlvl/hooks/dangerous-bash.test.js` →
  still green (additive proof). Add this as an integration test (or a documented smoke per D2).
- **Acceptance:** the real eval scores `pass:true`/`total 35`; the unit test is unchanged and green.
- **Verify (agent):** the scorecard file validates and shows `pass:true`; `git diff --stat
  plugins/nxtlvl/hooks/dangerous-bash.test.js` is empty.
- **Depends on:** T5, T6. **Files:** scorecard output + (optional) an integration test. **Scope:** S.

#### Checkpoint — Machinery + proof (🤖)
- [ ] `node --test 'bin/**/*.test.js'` green (scorecard, graders, engine, run-eval).
- [ ] Engine **bites** (mutation test reds) and **can't lie** (safety-inversion test) — spec Success
      Criteria 2 + 3.
- [ ] Real dangerous-bash eval → `pass:true`, `total 35`; `dangerous-bash.test.js` untouched + green.

#### T8 — `docs/seam-contract.md` — the locked seam *(S, 🤖)*
- **Steps:** Document the `eval.yaml` + `scorecard.json` schema (the normative shapes from spec §The seam
  contract), the `failures[]` pointer rule, and the `status:"error" ⇒ pass:false` invariant. State that
  changing it is an "ask first" boundary (both labs depend on it).
- **Acceptance:** the doc states both shapes + invariants; matches what `engine.js`/`scorecard.js` emit.
- **Verify (agent):** the schemas in the doc match the keys produced by `build(...)`.
- **Depends on:** T4, T6. **Files:** `docs/seam-contract.md`. **Scope:** S.

### Phase 4 — Record decisions (post-approval)

#### T9 — Record ADR-034/035/036 *(S, 🤖🧑)*
- **Steps:** Via `nxtlvl:doc-keeper`, record the three decisions (spec §Decisions): (1) engine-only +
  corpora-travel + ADR-019 reactive trigger; (2) locked seam schema; (3) the safety inversion. **Verify
  numbering against the committed/remote tree first** (031–033 taken by `harness-lab`; collision hazard).
- **Acceptance:** three ADRs in house format in `docs/decisions/`, README index updated, cross-linked, no
  numbering gap/dup vs `git ls-tree -r origin/main`.
- **Verify (agent):** `ls docs/decisions/ADR-03[4-6]*.md`; frontmatter parses; README rows present.
- **Depends on:** plan + spec approval.

---

## 5. Verification summary — who runs what

| Check | 🤖 | 🧑 |
|-------|:--:|:--:|
| ◇ D1–D3 locked; decide() seam confirmed (T0) | ✅ | ✅ |
| Workspace tree matches spec; tracked by Developer (T1) | ✅ | |
| `scorecard.js` build/validate; status:error ⇒ pass:false (T2) | ✅ | |
| `graders.js` exact-match + unknown-grader throws (T3) | ✅ | |
| `engine.js` pass-clean + mutation-bites + safety-inversion (T4) | ✅ | |
| `run-eval.js` writes schema-valid scorecard; pointer summary (T5) | ✅ | |
| Dangerous-bash eval: 35 cases, adapter returns 0/2 (T6) | ✅ | |
| E2E: real eval pass:true/total 35; test still green (T7) | ✅ | |
| `seam-contract.md` matches emitted shape (T8) | ✅ | |
| ADR-034/035/036 recorded, numbering verified (T9) | ✅ | ✅ |

---

## 6. Risks & mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| An engine **crash masquerades as `pass:true`** (a measurement that lies) | High | Pure/total `evaluate` + the dedicated safety-inversion test (T4); `status:"error" ⇒ pass:false` enforced in `scorecard.build` (T2). |
| Corpus **drifts** from the unit test (cases diverge silently) | Med | T6 lifts the 35 cases verbatim; T7 re-runs the unchanged test; a future check can diff corpus ↔ test arrays. |
| Seam schema **churns** after lock, breaking `harness-lab` | Med | T8 records it as the contract; changing it is an "ask first" boundary (spec). |
| ADR **numbering collision** (doc-keeper globs the working tree) | Med | T9 verifies vs committed/remote first (031–033 taken; propose 034–036). |
| `js-yaml` version skew between the two labs | Low | ◇ D1 locked at review (independent pin vs shared). |
| Scope creep — building graders/ledger/CI not needed yet | Med | Out of scope (spec §Deferred); only exact-match + one eval in this plan. |

---

## 7. Open questions / deferred

- **`select` expressiveness** — `{ tag: <x> }` only in the seed; richer selection deferred to a 2nd eval.
- **CI wiring** — a standing job running every eval is deferred (D2 fixes only the *canonical* smoke).
- **The message / kill-switch eval dimensions** — deferred until a predicate/regex grader exists.

## 8. Plan-level verification (before implementation)
- [x] Every task has acceptance criteria + a verification step.
- [x] Dependencies identified and ordered foundation-first (scorecard+graders → engine → CLI → real eval).
- [x] No task touches more than ~5 files.
- [x] Checkpoints between phases (the machinery + proof checkpoint; the engine is regression-locked).
- [x] 🤖/🧑 seam explicit; all build steps sandboxed (lab inside the write-allowlist).
- [x] ◇ D1–D3 locked (2026-06-22): pin `js-yaml` independently · real dangerous-bash eval is the canonical
      smoke · ADR-034/035/036 (verify at recording).
- [ ] Human has reviewed and approved this plan.
