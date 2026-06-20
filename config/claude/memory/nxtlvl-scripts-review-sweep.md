---
name: nxtlvl-scripts-review-sweep
description: Mode-C scripts-layer audit of ALL 13 reference/ harnesses (one doc each) — comparative ranking + the headline that script-craft INVERTS whole-harness reputation.
metadata: 
  node_type: memory
  type: reference
  originSessionId: 2cb0b4f0-5f94-450e-b192-2958acd68512
---

13-way parallel `harness-review` **Mode C, DOMAIN=scripts** sweep (2026-06-20): one
`docs/reference/<repo>-scripts-review.md` per vendored harness, all scored on a **shared 7-dim
scripts rubric** (D1 input-contract · D2 deterministic-output · **D3⭐ observation** · **D4⭐
error/exit-code** · D5 side-effect-safety/idempotence · D6 portability/hygiene · D7 cohesion),
so the scores compose. Files: `ecc-`, `ruflo-`, `hive-`, `deepagents-`, `claude-code-templates-`,
`trellis-`, `superclaude-`, `hooks-mastery-`, `awesome-claude-code-toolkit-`, `codewhale-`,
`cowagent-`, `agents-main-`, `claude-code-sub-agents-scripts-review.md`.

**HEADLINE — the script LAYER inverts whole-harness reputation.** Harnesses that scored ≈2/5 as
*whole harnesses* in prior Mode-B/feature reviews (ruflo, SuperClaude) have genuinely **good
executable code** — their disqualifiers (memory-that-lies, dead modes, encoded-N×-routed-0×,
`verify.mjs` fabricating success) live in the **markdown/orchestration layer, not the scripts**.
ruflo's worst sins are layer-specific, not repo-wide (`learning-service.mjs:487` *announces* its
degraded mode rather than lying). So a low whole-harness verdict ≠ low script-craft; judge the layer.

**Ranking (dominant D3+D4):**
- **Reference-grade (~4.5–5):** `agents-main` (Tier-1 build/transpile/eval toolchain, all 5s — but
  Tier-2 per-skill demo scripts are not load-bearing), `deepagents` (~4.7, typed per-op `error`-field
  results), `codewhale` (~4.7, Rust workspace; security lives in the type system), `hive` (~4.4,
  capability-in-Python done right), `ECC` (~4.3, library-structured Node hooks/CLI/CI — best under the
  ECC maps).
- **Strong, one capping flaw:** `Trellis` (D3/D4 = 5/5 but **D5=2** non-atomic writes pervasive,
  confirmed broader than prior work — `active_task.py:429` et al, zero `os.replace`), `cowagent`
  (~4.1; mar by `base_tool.py:61` swallow→returns `None` + one fabricated-success bash),
  `hooks-mastery` (better-than-demo craft, **D5=2** non-atomic log rewrite ×13 hooks).
- **Mixed:** `ruflo` (~3.7, fail-*silent* D3 + non-atomic D5), `SuperClaude` (~3.7, good `click`
  CLI/SHA-256 installer; dragged by src/↔plugins/ copy-fork + portability warts),
  `claude-code-templates` (~3.4, excellent validator subsystem wrapped around a 3.4k-line installer
  god-module with `shell:true` injection + dry-run write leak).
- **Broken where it matters:** `awesome-claude-code-toolkit` (**D4=1 fatal** — 10/19 home-grown JS
  hooks read `process.argv[2]` but CC delivers payload on **stdin** → parse `{}`, no-op, **exit 0 =
  lying clean exit**; same vaporware shape as its feature-level `/context load`).
- **No script layer:** `claude-code-sub-agents` (pure markdown subagent collection, 0 executables —
  explicit poor-target; quality is all prompt-design → a Mode-C *agents* review's job).

**Recurring cross-harness findings (≥2 harnesses):**
1. **Non-atomic writes are THE recurring craft gap** — bare `write_text`/`writeFileSync`, no
   `os.replace`/temp+rename: Trellis (fatal), hooks-mastery (fatal), ECC (1 SQLite lapse), deepagents
   (1 backend), ruflo, SuperClaude data artifacts. **Directly corroborates nxtlvl backlog
   [[nxtlvl-harness-adopt-backlog]] TREL-15** (atomic-rename the C&M store).
2. **Injection-safe subprocess** (argv-array / `execFileSync` / `.arg()`, never shell-string) is the
   adopted baseline among the good ones; cct's installer is the cautionary exception.
3. **Fail-open + honest exit codes** (observer hooks fail-open, gates fail-closed, 0/1/2 semantics)
   marks the high scorers (ECC, hive, hooks-mastery) — corroborates LOCKED inform-don't-force.
4. **"Lying clean exit"** (claim success while doing nothing / over a missing backend) is the
   disqualifier nxtlvl already guards against — awesome-toolkit (fatal), cowagent None-swallow, cct
   dry-run leak.

**Surfaced ADOPT candidate (neutral review, not auto-filed):** CodeWhale's **execpolicy
arity-dictionary** (`bash_arity.rs`) is a direct upgrade path for nxtlvl's
[[nxtlvl-dangerous-bash-gate]] — solves the exact `git branch -f` over-block class. Plus "make
docs-drift a CI failure" (CodeWhale + agents-main gates) as portable hygiene. Mine the docs, don't
re-scan. Related: [[analyze-all-harnesses-build-decisions]], [[nxtlvl-reference-repo-map]].
