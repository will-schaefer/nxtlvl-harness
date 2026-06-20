# awesome-claude-code-toolkit — scripts review

> **awesome-claude-code-toolkit — scripts review.** A thin script layer of one solid installer + 20 hook scripts, dominated by a single vendored 623-line Python gem (smart-approve.py) and a fleet of ~40-line JS hooks — but **10 of the 19 JS hooks are inert by construction**: they read input from a CLI arg (`process.argv[2]`) that the shipped `hooks.json` never passes, so they parse `{}` and no-op on every invocation. Analyzed 2026-06-20 · 3.3M · source: local vendored. Scope: scripts. Method: local read-only sampling (12 of 21 scripts read in full — install.sh, smart-approve.py, and a 10-hook JS spread; remaining 9 JS confirmed by input-source grep + hooks.json wiring) → scripts-specialist synthesis.

## 1. Spine — the headline judgment

This harness has **almost no script layer of its own design**. Twenty-one executables: one bash installer, one **vendored third-party Python hook** (smart-approve.py, MIT, credited to Yair Liberzon, `smart-approve.py:8-10`), and 19 short home-grown JS hooks. The Python file is genuinely excellent — a careful recursive bash-command decomposer with a real test-grade parser. The bash installer is clean and idiomatic. The JS hooks are where the spine snaps.

**The fatal flaw is a claims-vs-wiring break in the input contract.** Claude Code delivers hook payloads on **stdin**. But 10 of the 19 JS hooks read their payload from `JSON.parse(process.argv[2] || "{}")` (`secret-scanner.js:4`, `commit-guard.js:3`, `block-dev-server.js:4`, `auto-test.js:5`, `block-md-creation.js:3`, `bundle-check.js`, `post-edit-check.js`, `lint-fix.js`, `pre-push-check.js`, `type-check.js`) — a **positional CLI argument**. The shipped `hooks/hooks.json` wires every one of them as a bare `"command": "node hooks/scripts/<name>.js"` with **no argument appended** (verified across all 25 command entries). So `process.argv[2]` is always `undefined`, the fallback `"{}"` is parsed, `file_path`/`command` come back empty, and the script hits its `if (!filePath) process.exit(0)` guard and silently no-ops. **Half the advertised guardrails — the secret scanner, the commit-message linter, the dev-server blocker, auto-test — never run against real input.** They are vaporware that *looks* runnable: syntactically valid, locally testable if you hand-feed argv, but dead on the only wiring the repo ships.

This is the same shape the prior Mode-B distillation found at the feature level (`/context load` was vaporware) — here it recurs one layer down, in the executable contract itself.

## 2. What's there & how it works (inventory + end-to-end, cited)

**Inventory (21 scripts):**
- `setup/install.sh` (192 L) — the only shell script, only file with an exec bit.
- `hooks/scripts/smart-approve.py` (623 L) — vendored Python PreToolUse permission hook.
- `hooks/scripts/*.js` (19 files, 29–56 L each) — home-grown hook scripts.

**Input-source split (the load-bearing axis):**
- **Correct (stdin):** `smart-approve.py` (`sys.stdin`, `:581`), `prompt-check.js` (`process.stdin.on("data")`, streams + handles TTY fallback `:34`), `notification-log.js`, `session-end.js` — **4 scripts**.
- **Broken (argv[2], never supplied):** the 10 listed in §1 — **10 scripts, all inert**.
- **Self-sourcing (reads neither; pulls from `process.cwd()` + git):** `context-loader.js`, `learning-log.js`, `session-start.js`, `stop-check.js`, `suggest-compact.js`, `pre-compact.js` — **6 scripts, these actually function** since they don't depend on the missing payload.

**End-to-end, the one that works well — smart-approve.py:** reads JSON on stdin (`:581`), bails unless `tool_name == "Bash"` (`:587`), loads + merges 3 settings layers matching CC's own precedence (global → project → project-local, dedup-preserving, `load_merged_settings:35-80`), then **decomposes the compound command**: strips heredoc bodies (`strip_heredocs:189`), splits on `&& || ; |` and newlines while respecting quotes and `$()` depth (`split_on_operators:220`), recursively extracts subshells and backticks (`extract_subshells:131`), strips env-var prefixes/redirections/keyword-prefixes (`normalize_command:464`), filters shell structural keywords (`is_shell_structural:440`). It then denies if ANY sub-command matches a deny pattern, allows only if ALL match allow (`decide:513-547`), else **silently exits to fall through to normal prompting** (`:619`) — a correct, conservative fail-open posture. Output is the proper `hookSpecificOutput`/`permissionDecision` envelope (`:610-618`). Verbose logging is env-gated (`SMART_APPROVE_VERBOSE`, `:553-560`). This is the best single script in the harness and it isn't theirs.

**End-to-end, the installer — install.sh:** `set -euo pipefail` (`:2`), OS detection, interactive y/N prompts per category, copies commands/hooks/rules/templates/mcp-configs into `~/.claude/`. Honest about its own limitation — it prints a NOTE that you must hand-edit `hooks.json` to absolute paths for production (`:95-96`), and only copies `*.js` hooks (`:86`), **silently skipping the one Python hook it ships** (smart-approve.py never gets installed). Idempotent via `cp` overwrite + `mkdir -p`; non-destructive (never deletes).

**The self-sourcing hooks** are modest but real: `session-start.js` sniffs the lockfile to name the package manager and resets an editCount in `~/.claude/session-context.json`; `suggest-compact.js` increments that counter and nudges every 50 edits; `learning-log.js` appends a git-oneline snapshot to a dated JSON, capped at 100 entries (`:42`). All guard their JSON reads with `try/catch {}` and `mkdirSync(...,{recursive:true})`. These work because they never needed the payload.

## 3. Specialist scorecard

The harness is thin but there IS enough real code to score — and the dominant dimensions (D3/D4) have a clear, citable fatal flaw, so the overall is capped rather than averaged.

| Dim | Score | One-line justification (file:line) |
|-----|:---:|---|
| D1 Input/interface contract | **2** | Split-brain: stdin (correct, `smart-approve.py:581`) vs `process.argv[2]` (`secret-scanner.js:4`) that hooks.json never feeds → 10/19 read an always-empty source. Defensive `input.file_path \|\| input.filePath` aliasing papers over an undisclosed contract. |
| D2 Deterministic output shape | **2** | No shared envelope: `{decision:"block"}` (`secret-scanner.js`, valid CC field) vs `{blocked:true}`+`exit 1` (`block-dev-server.js:35-40`) vs `{warning:...}` (`block-md-creation.js`) vs `{allowed:true}` vs ad-hoc `{reminders,editCount}`. Each script invents its own shape; most aren't CC-recognized. |
| D3 ⭐ Observation quality | **2** | When fed input the messages are good and actionable (`smart-approve.py` names the offending sub-command `:535`; `commit-guard.js` lists each violation). But the 10 argv hooks observe `{}` and emit *nothing* — silent `exit(0)` — so the caller is told a guard ran when it saw no input. Opaque-by-omission on the dominant path. |
| D4 ⭐ Error & exit-code contract | **1** | **Caps the score.** The 10 argv hooks exit 0 (clean success) while having processed empty input — a **lying clean exit / vaporware-that-claims-success**. A secret scanner that always passes because it scanned `""` is worse than no scanner. smart-approve.py is the lone honest contract (explicit allow/deny/passthrough, fail-open on bad stdin `:582-584`). block-dev-server.js's `exit(1)` is the only real block and it's on a working (self-sourced env) path. |
| D5 Side-effect safety & idempotence | **4** | Genuinely good. install.sh is `cp`-overwrite idempotent + non-destructive; JS state writes are `mkdirSync({recursive})` + `writeFileSync` whole-file (`session-start.js`), reads are `try/catch{}` guarded, learning-log caps growth at 100 (`:42`). No partial-write corruption risk on these small files. auto-test guards path traversal (`:7`) and 30s-timeouts subprocesses (`:43`). |
| D6 Portability & hygiene | **4** | Shebangs on the two that need them; `execFileSync` (not `exec`) with array args throughout → **injection-safe**, no shell string interpolation; no hard-coded user paths (uses `os.homedir()`/`$HOME`); no secrets; `set -euo pipefail`. Minor: Node/Python/git assumed-present with no preflight; install.sh skips the Python hook it ships. |
| D7 Cohesion & composition | **3** | One job per script, honest names. But heavy **duplication of the session-context read/write boilerplate** across session-start/stop-check/suggest-compact (each re-implements the same `contextFile` load/parse/guard) with no shared lib — and the input-reading divergence is itself a cohesion failure (no common hook-input helper, so 10 drifted to the wrong source). |

**Strengths**
- `smart-approve.py` is a legitimately strong, well-documented, test-grade bash-decomposition hook with a correct CC output envelope and conservative fail-open default. Worth mining as a *reference implementation* of compound-command permission checking (it is itself vendored MIT — credit upstream, don't relabel).
- Uniformly **injection-safe subprocess handling** (`execFileSync` + arg arrays) and **non-destructive, idempotent side effects** — the hygiene floor is high.
- install.sh is honest about its own gaps (the absolute-path NOTE).

**Weaknesses & risks**
- **Dominant flaw (D4/D3):** 10/19 JS hooks are dead-on-arrival against shipped wiring — they read `process.argv[2]` while hooks.json passes no argv and CC delivers on stdin. They exit 0 cleanly, manufacturing false "guard passed" signals. A user installing this gets a secret-scanner, commit-linter, and dev-server blocker that **silently never fire**.
- **No output contract (D2):** five-plus different output shapes, most not CC-recognized fields; the harness has no shared hook-IO convention.
- **Installer/payload mismatch (D6):** install.sh copies only `*.js`, so the one genuinely-working high-value hook (smart-approve.py) is never installed by the supplied installer.
- **Boilerplate duplication (D7):** the session-context pattern is copy-pasted across 3–4 hooks with no shared module.

**Headline verdict.** As a script layer this is **thin and mostly broken where it matters most**. The honest count: one excellent *vendored* Python hook, one clean bash installer, six modest-but-working self-sourcing JS hooks, three correctly-stdin JS hooks — and ten home-grown JS hooks that are **inert by construction**, reading a CLI argument the harness never supplies and exiting 0 as if they'd done their job. The dominant observation/error-contract dimensions fail on a binary, citable fact (wrong input source vs both the shipped wiring AND the platform contract), which caps the whole at a low score regardless of the genuinely good D5/D6 hygiene. The mining value is narrow and specific: smart-approve.py as a *reference* for compound-bash permission decomposition and fail-open posture, and the uniform `execFileSync`-with-arg-arrays injection-safety idiom. Everything home-grown here is a cautionary example of the exact failure nxtlvl already guards against — a hook that *claims success while doing nothing* — and should be treated as anti-pattern, not adopt-material.
