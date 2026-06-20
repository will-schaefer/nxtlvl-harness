> **SuperClaude — scripts review.** The script layer is the *best-engineered* part of SuperClaude reviewed so far — a real `click` CLI + idempotent file-copy installers + injection-safe `subprocess` + SHA-256 integrity checks — but it inherits the harness-wide `src/`↔`plugins/` duplication, which at the script level produces a genuine path-portability drift in the SessionStart hook and 3-way divergence in the shipped `confidence.ts`. Analyzed 2026-06-20 · 3.6M · source: local vendored. Scope: scripts. Method: local read-only sampling fan-out (14 scripts sampled of ~61) → scripts-specialist synthesis.

## 1. Spine — the headline judgment

The script layer is **substantively good and caps at "good, not great" on duplication/drift, not on craft.** Unlike the PLANNING and DISCOVERY layers (markdown that claimed delegation it didn't wire), the *executable* layer here actually does its job: `install_mcp.py` runs commands list-based with no `shell=True`, verifies downloads by SHA-256, supports `--dry-run`, and fails soft with honest warnings; the command/agent installers are idempotent (`exists()`-gated, `--force` to override), copy with `shutil.copy2`, and account for per-file success/skip/fail with truthful exit codes. This is the first SuperClaude subsystem where claims and wiring agree.

The cap is the *same structural disease* the prior reviews found — `src/` (pip pkg) vs `plugins/` (shipped) copy-divergence — but it bites **less** here because the load-bearing installers live only in `src/`. Where it does bite the script layer it is real, not cosmetic: the two `hooks.json` copies wire **different commands** for the same SessionStart hook (`./scripts/session-init.sh` relative-path in `src/` vs portable `${CLAUDE_PLUGIN_ROOT}/scripts/session-init.sh` in `plugins/`), and `confidence.ts` exists in **4 copies at 3 different line counts** (332/305/171). The installer Python is single-sourced and clean; the *shipped data artifacts* are N-plexed and drifting.

## 2. What's there & how it works

**End-to-end install path (the spine, all single-sourced in `src/`):**
`install.sh` (bash, 363L) checks Python≥3.10 / git / UV, `uv pip install -e ".[dev]"`, then shells to the `superclaude` console-script → `cli/main.py` (271L, `click` group) → dispatches to `install_commands.py` / `install_mcp.py` / `install_skill.py` / `doctor.py`. `superclaude install` copies command `.md` → `~/.claude/commands/sc/` and agent `.md` → `~/.claude/agents/`; `superclaude mcp` registers MCP servers via `claude mcp add`.

| Script | Lines | Role | Quality signal |
|---|---|---|---|
| `src/.../cli/install_mcp.py` | 771 | MCP installer (AIRIS gateway + 8 servers) | **High** — `_run_command` list-based no-shell (`:101`), SHA-256 `_verify_file_integrity` (`:128`), `--dry-run` (`:200`), idempotent `if not env_file.exists()` (`:313`), timeouts on every subprocess, fail-soft warnings to `err=True` |
| `src/.../cli/install_commands.py` | 271 | Copy commands+agents to `~/.claude/` | **High** — `exists()`-gated + `--force`, `shutil.copy2`, per-file skip/fail accounting (`:42-60`), honest `success = len(failed)==0` |
| `src/.../cli/main.py` | 271 | `click` CLI entrypoint | **High** — typed options, `Choice` enum on `--scope` (`:109`), `sys.exit(1)` on every failure path |
| `src/.../cli/doctor.py` | 147 | Health check | Good — structured `{checks:[...], passed}` dict, exit-1 on fail (`main.py:261`); optional-skill check returns `passed:True` honestly (`:100`) |
| `install.sh` | 363 | Bootstrap | Good — `set -e` (`:21`), `printf "%b"` not echo-escapes, `confirm()` + `--yes`; **one wart**: `export PATH="$HOME/.cargo/bin"` (`:157`) is the legacy UV path |
| `scripts/sync_from_framework.py` | 959 | Plugin-export pipeline | Real — typed `ProtectionViolationError` (`:46`), `--dry-run`, `dataclass` report, logging |
| `scripts/ab_test_workflows.py` | 310 | A/B test workflow metrics | **Signal not demo** — actual `scipy.stats` t-tests; but imports `scipy` (heavy, undeclared in core deps) |
| `scripts/analyze_workflow_metrics.py` | 331 | Metrics aggregation over JSONL | Real analysis tool, stdlib-only |
| `*/scripts/clean_command_names.py` | 167/168 | Strip `name:` frontmatter | Duplicated `src`↔`plugins`, **drifted** (quote-style + 1 trailing line) |
| `*/scripts/session-init.sh` | 30 | SessionStart hook | Identical copies, but wired by **divergent** `hooks.json` paths |

**Hook wiring (the real drift):** `src/superclaude/hooks/hooks.json:8` → `"command": "./scripts/session-init.sh"` (relative — resolves only if Claude Code's cwd is the repo root); `plugins/superclaude/hooks/hooks.json:8` → `"${CLAUDE_PLUGIN_ROOT}/scripts/session-init.sh"` (portable, correct). The shipped copy is right; the `src` copy would silently no-op from any other cwd.

## 3. Specialist scorecard

| Dim | Score | Justification (file:line) |
|---|---|---|
| D1 Input/interface contract | **5** | `click` typed options throughout; `--scope` is `Choice(["local","project","user"])` (`main.py:109`); installer fns take typed `Path`/`bool` and return `Tuple[bool,str]` (`install_commands.py:12`). |
| D2 Deterministic output shape | **4** | `doctor` returns stable `{checks, passed}` dict (`doctor.py:35`); installers return uniform `(success, message)`. Minus: human-facing messages are emoji prose, not machine-parseable — no `--json` anywhere. |
| D3 ⭐ Observation quality | **4** | Installers report installed/skipped/failed *per file* with the remediation inline ("use --force", "run manually: …", `install_commands.py:72`); MCP installer narrates each step + next-steps block (`install_mcp.py:425`). Minus: signal is prose-only, so callers parse strings. |
| D4 ⭐ Error & exit-code contract | **4** | Honest exit codes — `sys.exit(1)` on every real failure (`main.py:100,145,219,261`); `success = len(failed)==0` is truthful, no lying clean exits. Fail-soft is *appropriate* (MCP download falls back to a minimal valid config `:307` then warns, doesn't crash). Minor: `doctor` swallows a pytest-internal exception into a generic `passed:False` (`doctor.py:73`) — root cause is in `details` but coarse. |
| D5 Side-effect safety & idempotence | **4** | Re-run safe: every write is `exists()`-gated or `--force` (`install_commands.py:51`, `install_mcp.py:313`), `mkdir(parents=True, exist_ok=True)`, `copy2` overwrite-on-force. SHA-256 verify + `unlink(missing_ok=True)` on integrity fail (`install_mcp.py:241`). Minus: no transactional rollback if copy fails mid-batch (partial install left in place — but reported). |
| D6 Portability & hygiene | **3** | Strong: no `shell=True`, no embedded secrets (`publish.sh` clean), `shlex` imported, `platform.system()` Windows branch, timeouts. **Capped by**: `src` `hooks.json:8` relative `./scripts/...` path (cwd-fragile vs the portable plugin copy); `install.sh:157` hard-codes the stale `~/.cargo/bin` UV path; `install_mcp.py:315` defaults workspace to `~/github`; `ab_test_workflows.py` depends on undeclared `scipy`. |
| D7 Cohesion & composition | **2** | One-job-per-script is honored *within* `src/`, but the harness-wide `src/`↔`plugins/` copy-fork hits the script layer: `clean_command_names.py` (drifted) + `session-init.sh` (identical, divergently wired) are duplicated, and `confidence.ts` exists in **4 copies / 3 line-counts** (332/305/171) with no single source — the exact "encoded N×, no source-of-truth" pattern the prior SC reviews found, now at the executable layer. |

**Strengths (evidence)**
- Injection-safe by construction: `_run_command` builds arg lists, never `shell=True`; `claude mcp add` is argv-spread (`install_mcp.py:400`).
- Supply-chain hygiene rare in harness installers: optional SHA-256 pinning of downloaded `docker-compose.yml`/`mcp-config.json` with explicit "None skips check" semantics (`install_mcp.py:19-29,128`).
- Idempotent installers with truthful per-file accounting and correct exit codes — re-running `superclaude install` is safe and says what it skipped.
- `--dry-run` on both the MCP installer and the 959-line `sync_from_framework.py`, plus a typed `ProtectionViolationError` guarding the export pipeline.
- Analysis scripts are real signal (scipy t-tests, JSONL aggregation), not demo stubs.

**Weaknesses & risks (claim-vs-wiring gaps; fatal-flaw check)**
- **D7 duplication is the cap, not a fatal flaw.** It does NOT cap overall the way a D3/D4 fatal flaw would, because the *executable installers are single-sourced in `src/` and clean*; what's duplicated is data artifacts (`.ts`, hook scripts, a frontmatter-cleaner). So the rubric's "fatal in D3/D4 caps overall" does not trigger — D3/D4 are both 4.
- **Real script-level drift (new finding the prior SC reviews didn't reach):** `src/hooks.json` wires `./scripts/session-init.sh` (relative, cwd-fragile) while `plugins/hooks.json` wires the portable `${CLAUDE_PLUGIN_ROOT}` form — same hook, divergent reliability. `confidence.ts` 4 copies @ 3 sizes. `clean_command_names.py` drifted (cosmetic here, but proves the fork is unmanaged).
- Portability warts: hard-coded `~/.cargo/bin` (stale UV path), `~/github` workspace default, undeclared `scipy` dep for the A/B script.
- No `--json` / machine-readable output mode anywhere — observation is honest but prose-only, so any programmatic caller string-parses.

**Headline verdict.** The SuperClaude script layer is **genuinely good engineering — easily the strongest subsystem reviewed in this harness** — and is the one place where its claims and wiring actually agree: a typed `click` CLI, idempotent `exists()`-gated installers with honest per-file exit codes, injection-safe list-based `subprocess`, SHA-256 supply-chain verification, and `--dry-run` on the destructive paths. D3 and D4 (the dominant dimensions) both land at 4 with no lying clean exits, so nothing fatal caps the score. What holds it at "good, not great" is **D7 (2) and the D6 portability warts (3)**: the harness-wide `src/`↔`plugins/` copy-fork reaches the executable layer as unmanaged duplication (`confidence.ts` 4×/3 sizes, a drifted frontmatter-cleaner) and as a real reliability drift — the `src` SessionStart hook uses a cwd-fragile relative path where the shipped copy uses the portable `${CLAUDE_PLUGIN_ROOT}` form. Net: the *code* is worth mining (the MCP installer's no-shell + SHA-256 + dry-run pattern, the idempotent copy-installer with truthful accounting); the *packaging discipline* around it is the same single-source-the-contract lesson the other reviews keep surfacing.
