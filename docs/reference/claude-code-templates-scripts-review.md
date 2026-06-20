> **claude-code-templates — scripts review.** A competent npm-distribution installer whose validator/audit subsystem is the real craft, wrapped around a 3,400-line god-module installer with `shell:true` injection surfaces and a dry-run leak — caps at "solid product tooling, not safe-by-construction." Analyzed 2026-06-20 · 116M · source: local vendored. Scope: scripts. Method: local read-only sampling fan-out (~14 scripts sampled across CLI entrypoints, installer, validation, API, catalog) → scripts-specialist synthesis.

## 1. Spine — the headline judgment

This repo is a **distribution-catalog product** (davila7/aitmpl, npm `claude-code-templates@1.28.13`), and the prior Mode-B distillation already established that the ~1150 scripts are mostly **catalog-mirrored template content**, not the harness's own engineering. This review audits the **actual CLI/tooling layer** — and that layer cleaves cleanly in two:

- **The high-water mark is the validation/audit subsystem** (`cli-tool/src/validation/` + `src/security-audit.js`). This is genuinely well-built script craft: a typed error-code vocabulary (`STRUCT_E001`…), a `BaseValidator` base class with a consistent `{valid, score, errorCount, warnings, errors, info}` result contract, an orchestrator that aggregates and degrades gracefully, dual human/JSON report renderers, and — critically — an **honest, documented two-mode exit contract** (`security-audit.js:137-148`: CI mode fails on errors, non-CI is advisory-and-exits-0, *with the comment saying so*). This is the part worth mining.

- **The low-water mark is the installer god-module** (`cli-tool/src/index.js`, **3,427 lines**). It does real work well (GitHub download with exponential backoff + rate-limit-aware retry in `file-operations.js`, dry-run support, overwrite prompts, `fs-extra.ensureDir` before every write) but is a single sprawling file mixing install, dashboards, sandbox, prompt-exec, and tracking, with two concrete defects: **shell-injection surfaces** (`spawn('sh', ['-c', \`claude "${prompt}"\`])` with naive quote-escaping; `spawn('claude', [prompt], {shell:true})`) and a **dry-run leak** (agents are installed at `index.js:408` *before* the `options.dryRun` guard at `:411`).

Signal-vs-demo verdict: the sampled catalog scripts (e.g. an App-Store-Optimization `CompetitorAnalyzer` Python class) are clean, typed, well-docstringed **distributable library demos** — they are content the tool *ships*, not the tool's own operational code. They should not be scored as this harness's craft, and they aren't.

## 2. What's there & how it works

| Layer | Path | Role | Craft tier |
|---|---|---|---|
| CLI entrypoint | `cli-tool/bin/create-claude-config.js` (69 L) | commander arg-parse → `createClaudeConfig`; single try/catch → `exit(1)` | clean, thin |
| Installer core | `cli-tool/src/index.js` (3,427 L) | template/agent/command/hook/skill install, overwrite prompts, dry-run, tracking, prompt-exec, dashboards launch | functional but god-module |
| Download/IO | `cli-tool/src/file-operations.js` (751 L) | GitHub raw+API fetch w/ exponential backoff, rate-limit detection, file-cache, post-install validation | strong retry craft |
| Validation | `cli-tool/src/validation/` (orchestrator + 5 validators + BaseValidator) | structural/integrity/semantic/reference/provenance checks; typed error codes; score aggregation | **best in repo** |
| Audit CLI | `cli-tool/src/security-audit.js` (164 L) | scans `components/`, runs orchestrator, dual report, honest dual-mode exit | **best in repo** |
| Serverless API | `api/track-*.js`, `api/claude-code-check.js` | Vercel handlers: env-var secrets, input validation, CORS, geo | competent |
| Build/ops scripts | `scripts/*.sh`, `scripts/*.py` | deploy, predeploy-check, catalog generation, SkillSpector scan | utilitarian |
| Catalog content | `cli-tool/components/**/scripts/` (~1000+) | distributable skill/template code (NOT harness craft) | demo / filler |

**End-to-end (install path):** `bin/create-claude-config.js:51` parses ~45 flags via commander → `createClaudeConfig(options)` (`index.js`) → resolves template config → `dryRun` guard (`:411`) → `copyTemplateFiles()` (`file-operations.js`) which downloads from `raw.githubusercontent.com` with backoff, caches, and writes via `fs-extra` with explicit modes (`index.js:1322`: `{ mode: executable ? 0o755 : 0o644 }`) → `runPostInstallationValidation()` → optional `handlePromptExecution()`. Failures bubble to the entrypoint's single catch and `process.exit(1)` (`bin:65`).

**End-to-end (audit path):** `security-audit.js:main()` → `scanComponents()` recurses `.md` files → `ValidationOrchestrator.validateComponents()` runs each validator, catches per-validator throws into a structured failure record (`ValidationOrchestrator.js:100-109`) rather than crashing the batch → aggregates score (average of non-zero scores) → renders → exits per the documented CI/non-CI contract.

## 3. Specialist scorecard

| # | Dimension | Score | Justification (file:line) |
|---|---|---|---|
| D1 | Input/interface contract | 4 | commander gives typed/declared flags w/ help (`bin:10-50`); validators take explicit `{content,path,type}` (`StructuralValidator.js:53`); only ding: `index.js` `options` is a 45-field grab-bag passed everywhere. |
| D2 | Deterministic output shape | 4 | Validators emit a stable `{valid,score,errorCount,warnings,errors,info}` contract (`ValidationOrchestrator.js:75-83`); dual human/JSON renderers (`:169`,`:275`); installer output is human-only prose w/ emoji. |
| D3 ⭐ | Observation quality | 4 | Strong: validator reports name the failing check + error code + next step (`ValidationOrchestrator.js:230-249`); installer prints explicit next-steps + retry status w/ reset times (`file-operations.js:99-101`). Opaque blobs absent. |
| D4 ⭐ | Error & exit-code contract | 3 | **High point:** honest documented dual-mode exit, comment-justified (`security-audit.js:137-148`); `unhandledRejection` + `.catch` guards (`:152-164`). **Drag:** `index.js` is the only installer exit path (`exit(1)` at `:307`) — no granular codes distinguishing network vs. validation vs. user-cancel; cancel returns `false` sentinel (`index.js:423`) not a code. |
| D5 | Side-effect safety & idempotence | 3 | `fs-extra.ensureDir` before writes, explicit file modes, overwrite *prompts* (`index.js:928,1254`), retry-with-backoff is re-run-safe. **But:** agents install at `:408` BEFORE the dry-run guard at `:411` (dry-run leaks a real write); no atomic/temp-file writes or backup-before-overwrite; partial-failure mid-batch leaves a half-installed tree. |
| D6 | Portability & hygiene | 3 | Good: `process.env` for all secrets (`track-download-supabase.js:6-7`, CLAUDE.md mandates it), `path.join`, relative paths, shebangs present. **Bad:** `spawn('sh',['-c',\`claude "${prompt}"\`])` w/ naive `.replace(/"/g,'\\"')` (`command-stats.js:266-268`, mirrored in mcp-stats/hook-stats/file-operations) and `spawn('claude',[prompt],{shell:true})` (`index.js:2447-2451`) — both defeat array-arg safety and are shell-injection surfaces for `--prompt`/optimization text. |
| D7 | Cohesion & composition | 3 | Validators are exemplary one-job-each w/ shared `BaseValidator` (`validation/`); audit CLI composes the orchestrator cleanly. **But** `index.js` (3,427 L) is a god-module fusing install/dashboard/sandbox/tracking/prompt-exec; `child_process` is `require()`'d inline at ~8 call sites instead of one wrapper, duplicating the same unsafe spawn idiom. |

**Strengths (evidence)**
- Validation subsystem is real, mineable craft: typed error codes (`STRUCT_E001`), base-class result contract, graceful per-validator failure isolation (`ValidationOrchestrator.js:100-109`), dual-format reporting.
- The audit CLI's exit contract is **honest** — the rare-in-this-survey case of a script that documents *why* it exits 0 in non-CI mode (`security-audit.js:144`) rather than lying a clean exit.
- Network layer is production-grade: exponential backoff, GitHub rate-limit header parsing with exact reset-time waits, fail-soft `return {}` on exhausted retries (`file-operations.js:84-117`).
- Secrets discipline is enforced and real — `process.env` everywhere, with a `security-audit` script gating CI.

**Weaknesses & risks (claim-vs-wiring)**
- **Injection surface (fatal-adjacent, D6):** CLAUDE.md preaches "injection-safe / relative paths," but the shipped install/optimize paths build shell strings (`claude "${userPrompt}"`) and run them through `sh -c` / `shell:true`. Naive quote-escaping does not neutralize `$()`, backticks, `;`. A malicious `--prompt` or workflow payload is a command-execution vector. This caps D6 at 3.
- **Dry-run is not honest (D5):** `--dry-run` is advertised as "show what would be copied without actually copying" (`bin:19`), yet `installAgents()` runs at `index.js:408` before the guard — a real filesystem write under a no-write flag.
- **No granular exit codes from the installer (D3/D4):** every installer failure collapses to `exit(1)`; a caller/CI cannot distinguish a transient network failure (safe-retry) from a validation stop (don't-retry).
- **God-module (D7):** `index.js` at 3,427 lines concentrates risk and duplicates the unsafe spawn idiom across ~8 inline `require('child_process')` sites instead of one audited wrapper.

**Headline verdict.** The tooling code is **good product engineering with one genuinely excellent subsystem and two real safety defects** — it does not have a fatal flaw in the dominant observation dimension (D3 is strong; reports name what happened and the next step), but it is held below "exemplary" by the dominant error/safety dimensions (D4/D5/D6): the installer's single coarse exit code, the dry-run write leak, and the `shell:true` / `sh -c` injection surfaces that directly contradict the repo's own security doctrine. The validation/audit layer (typed error codes, base-class contract, graceful failure isolation, honest dual-mode exit) is the part worth mining and would score 4.5 on its own; the 3,400-line installer god-module with unsafe spawn idioms is what drags the composite to a solid-but-not-safe-by-construction **3.4-ish**. Net: mine the validator/audit-CLI pattern (especially the honest exit contract and typed error codes); treat the installer as a cautionary example of how a real shipping tool still leaks side effects under a no-op flag and lets user text reach a shell.
