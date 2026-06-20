> **ECC — scripts review.** A genuinely production-grade Node script layer — fail-soft hook dispatch, structured deny-not-exit-2 gating, atomic writes, two-tier CI validators — whose only real soft spots are a non-atomic SQLite save and craft that's wide enough to be uneven at the edges. Analyzed 2026-06-20 · 72M · source: local vendored. Scope: scripts. Method: local read-only sampling fan-out (~22 scripts read in full or part, across every script kind) → scripts-specialist synthesis.

## 1. Spine — the headline judgment

ECC's script layer is the **functional opposite of the "encoded N× / routed 0×" pattern** the other harness reviews keep hitting: the wiring is real, the code does what the docs claim, and the craft is consistently above the bar for executable agent-harness code. The hook subsystem in particular is the strongest single thing reviewed across the ECC maps — it is built as a **library of composable sub-hooks behind a single dispatcher**, with a deliberately-engineered fail-soft posture (every hook `exit 0` on non-critical error per `.claude/rules/node.md`, blocking done through Claude Code's structured `permissionDecision: deny` JSON rather than exit-2 abuse) and a tested, documented edge-case for the `node -e` eval-bootstrap that would otherwise silently no-op every hook on Node 21+ (`scripts/hooks/plugin-hook-bootstrap.js:174-183`).

This is not a demo repo dressed as a product. The CLIs have subcommand dispatch tables, `--json`/`--help`/exit-code contracts; the CI validators have a clean strict-vs-warn two-tier exit contract; the shell scripts uniformly carry `set -euo pipefail`; atomic writes use the correct `pid+random tmp → renameSync` idiom *with an inline comment explaining the race it prevents* (`scripts/lib/session-bridge.js:60-112`). The dominant dimensions (D3 observation, D4 error/exit contract) are where it's **strongest**, not weakest — the inverse of every ruflo/SuperClaude review. What caps it from a 5 is **breadth-induced unevenness**: ~506 scripts is a lot of surface, the SQLite state-store does a **bare `fs.writeFileSync` (non-atomic)** save (`scripts/lib/state-store/index.js:43`) while the rest of the codebase is scrupulously atomic, and a sampled cross-section can't certify all 506 hold this line.

## 2. What's there & how it works

**Inventory (by kind):**

| Kind | Where | Count (approx) | Notes |
|---|---|---|---|
| Hook scripts | `scripts/hooks/` | ~46 .js | The crown jewel; dispatcher-composed |
| Hook libs | `scripts/lib/` | ~120 .js across subdirs | state-store, session-adapters, github-coordination, skill-evolution |
| CLI entrypoints | `scripts/*.js` | ~37 | `ecc.js`, `doctor.js`, `repair.js`, `catalog.js`, `harness-audit.js`, etc. |
| CI validators | `scripts/ci/` | ~13 | validate-skills/agents/commands/hooks, scan-supply-chain-iocs |
| Shell | repo + `scripts/` | 32 .sh | `install.sh`, `release.sh`, codex git-hooks |
| Discord bots | `scripts/discord/` | 3 .mjs | crash-only supervised design |
| Python | `ecc_dashboard.py` + `scripts/lib/*.py` | 59 .py | TkInter GUI + runtime helpers |
| TS | `scripts/codemaps/`, `src/` | 18 .ts | codemap generation |
| Tests | `tests/` mirrors `scripts/` | ~140 .js | real mirrored coverage, `node tests/run-all.js` |

**End-to-end (the Bash PreToolUse path, the load-bearing flow):**

1. `hooks/hooks.json` wires a `PreToolUse/Bash` matcher to an **inline `node -e` plugin-root resolver** that probes `CLAUDE_PLUGIN_ROOT`, then `~/.claude`, then a fixed list of plugin-cache layouts, sets the env, and `require()`s `plugin-hook-bootstrap.js` (`hooks/hooks.json` PreToolUse block).
2. `scripts/hooks/plugin-hook-bootstrap.js` re-spawns the real hook via `spawnSync` with a **path-traversal guard** (`resolveTarget` rejects escapes, :49-59), a **30s timeout** (:98), Windows drive-letter normalization, and **fail-open passthrough** on any spawn failure (:152-169 — writes stderr, re-emits stdin, `exit 0`).
3. `scripts/hooks/pre-bash-dispatcher.js` (thin stdin reader, 1 MB cap, :7-23) calls `runPreBash` in `bash-hook-dispatcher.js`.
4. `bash-hook-dispatcher.js` runs an **array of sub-hooks** (`block-no-verify`, `auto-tmux-dev`, `gateguard-fact-force`, …) each gated by `isHookEnabled(id, {profiles})` (`ECC_HOOK_PROFILE`/`ECC_DISABLED_HOOKS` runtime gating); each sub-hook is wrapped in `try/catch` so one failure logs to stderr and **does not abort the chain** (:159-161); it carefully emits **nothing** in the passthrough case to avoid Claude Code's hook-output JSON-schema rejection (:124-130, a non-obvious correctness subtlety).
5. `gateguard-fact-force.js` (1132 lines) is the substantive gate: strips quoted strings before destructive-pattern matching so a commit message mentioning "drop table" doesn't false-positive (:55, :114-118), memoizes an operator-supplied extra-regex with once-per-pattern warn-on-malformed (:66-99), and on a real block returns structured `permissionDecision: deny` with a **recovery hint** (`denyResult`, :1000-1013) — and if its own session state can't be persisted, it **fails open with an explanatory stderr** to avoid a permanent retry loop (`allowWithStateWarning`, :1015-1020).

**CLI shape:** `ecc.js` is a subcommand router (`COMMANDS` table → delegated script, :6-40); `doctor.js` parses `--target`/`--json`, has `showHelp(exitCode)` (:6-13). CI validators (`validate-skills.js` tail) accumulate `hasErrors`/`warnCount`/`validCount`, `process.exit(1)` only on real errors, and **always print a summary line** ("Validated N skill directories (M warnings)"). Discord bots are **crash-only**: missing env → `exit 1` with a clear message, any gateway failure → `exit 1` for a supervisor to restart (`ecc-bot.mjs:18-22,178-222`).

## 3. Specialist scorecard

| Dim | Score | Justification (file:line) |
|---|---|---|
| D1 Input/interface contract | 4 | Typed arg parsers + env gating (`doctor.js:16-25` `--target/--json`; `bash-hook-dispatcher.js:135` profile-gated hooks); inline `node -e` resolver in `hooks/hooks.json` is powerful but opaque/grab-bag — the one un-narrow interface. |
| D2 Deterministic output shape | 4 | Hooks emit structured JSON or **nothing** in passthrough (deliberate, to pass CC's schema — `bash-hook-dispatcher.js:124-130`); CLIs offer `--json`; deny is a stable `hookSpecificOutput` object (`gateguard:1004-1010`). |
| D3 ⭐ Observation quality | 5 | Tells caller what happened + next step: deny carries a recovery hint (`gateguard:1000-1013`), state-loss is explained not swallowed (`:1015-1020`), CI prints validated/warn counts (`validate-skills.js` tail), `[HookName]` stderr prefixes throughout. |
| D4 ⭐ Error & exit-code contract | 5 | Honest, role-appropriate posture: hooks fail **open** (`exit 0`) with stderr root-cause (`plugin-hook-bootstrap.js:152-169`); blocking via structured `deny` not exit-2 abuse (`gateguard:1006-1011`); CI fails **closed** (`exit 1`) only on real errors; bots **crash-only** `exit 1` (`ecc-bot.mjs:22`). No lying clean exits over a missing backend. |
| D5 Side-effect safety & idempotence | 3 | Mostly correct atomic writes (`session-bridge.js:60-112` pid+random tmp → renameSync, race-commented); per-session state dirs avoid cross-session clobber (`gateguard:34`). **Capped by** the SQLite state-store's bare non-atomic `fs.writeFileSync(dbPath, buffer)` (`state-store/index.js:43`) — a crash mid-save corrupts the DB while the rest of the repo is scrupulous. |
| D6 Portability & hygiene | 4 | All sampled `.sh` carry `set -euo pipefail` (`install.sh:7`, `release.sh:2`, `sync-ecc-to-codex.sh:2`); cross-platform via `os`/path helpers (`utils.js:13-36`, Windows reserved-name set :21-25); no hard-coded user paths in core (env-resolved). Minor: `gan-harness.sh` uses `#!/bin/bash` not `/usr/bin/env bash`; 1 MB stdin cap silently truncates. |
| D7 Cohesion & composition | 5 | Textbook compose-don't-duplicate: sub-hooks are one-job modules behind a dispatcher (`bash-hook-dispatcher.js:22-52`), CLIs delegate via a router table (`ecc.js:6`), shared libs in `scripts/lib/` per the <200-line hook rule (`.claude/rules/node.md`). Honest naming throughout. |

**Strengths (evidence)**
- **Fail-soft is designed, not accidental.** The eval-bootstrap no-op edge-case is *documented and guarded* (`plugin-hook-bootstrap.js:174-183`); the dispatcher's per-hook `try/catch` (`bash-hook-dispatcher.js:159-161`) and the passthrough-emits-nothing schema subtlety (:124-130) show someone hit these in production and fixed them.
- **Honest blocking.** `permissionDecision: deny` + recovery hint (`gateguard:1000-1013`) is the *correct* Claude Code contract; the state-persistence-failure → fail-open-with-explanation path (`:1015-1020`) is the exact fail-soft idiom nxtlvl prizes, shipped here unprompted.
- **Atomic writes done right where it counts**, with a comment explaining the two-writer race it prevents (`session-bridge.js:60-112`).
- **Two-tier CI exit contract** (strict→`exit 1`, else WARN + summary) mirrors nxtlvl's objective-gate discipline (`validate-skills.js` tail).

**Weaknesses & risks**
- **D5 cap (real, not fatal):** SQLite state-store saves via bare `fs.writeFileSync` (`state-store/index.js:43`) — non-atomic, can corrupt on crash; inconsistent with the repo's own `session-bridge.js` atomic idiom. The save also fires after every `exec()`, so a partial write window exists on every state mutation.
- **D1 opacity:** the `hooks/hooks.json` inline `node -e` plugin-root resolver is a multi-branch fallback embedded as a JSON string — powerful and necessary for plugin-cache portability, but un-reviewable in place and a grab-bag interface vs. the clean dispatchers it bootstraps.
- **Breadth unevenness:** ~506 scripts; this audit sampled ~22 across every kind. The sampled core is excellent, but `.understand-anything/.trash-*` directories carry stray `.js` (tool detritus, not signal — flag as non-craft), and `ecc2/`/duplicate trees mean some surface is mirrored. No claim that all 506 hold the sampled line.
- **Minor hygiene:** `gan-harness.sh` non-portable `#!/bin/bash` shebang; the 1 MB stdin cap (`pre-bash-dispatcher.js:7`) silently truncates oversized events rather than signalling.
- **No fatal flaw found** in the dominant dimensions — D3/D4 are the codebase's strongest, so nothing caps the overall below the headline.

**Headline verdict** — This is the highest-craft script layer reviewed under the ECC maps and one of the better ones across all harnesses: a real, dogfooded, library-structured Node hook+CLI+CI codebase whose dominant dimensions (observation, error/exit contract) are its *strengths*, with honest fail-open hooks, structured deny-based blocking, correct atomic writes, and composable one-job modules behind dispatchers. What keeps it at a strong-4 rather than a 5 is breadth-induced unevenness and one concrete D5 lapse — the SQLite state-store's non-atomic save — sitting incongruously inside an otherwise scrupulous codebase. For nxtlvl, the harvest is **pattern-level and high-value**: the plugin-root resolver's fail-open spawn wrapper, the dispatcher's emit-nothing-on-passthrough schema discipline, GateGuard's deny+recovery-hint+fail-open-on-state-loss triad, and the strict/warn two-tier CI exit contract are all directly relevant to nxtlvl's own hook and gate work and corroborate its LOCKED inform-don't-force / single-objective-gate positions from a codebase that actually shipped them.
