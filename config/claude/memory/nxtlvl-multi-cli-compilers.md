---
name: nxtlvl-multi-cli-compilers
description: "Decision — Claude Code config is the single source; per-target compiler scripts populate the other CLIs (Antigravity/Gemini, Codex, Devin CLI, Grok Build CLI). Strategy recorded as ADR-028."
metadata: 
  node_type: memory
  type: project
  originSessionId: b5503153-a6d8-41a8-a89e-053fc8a47dea
---

Decided (before 2026-07-10): the Claude Code config in nxtlvl is the **single source of truth**,
and separate **compiler scripts** populate each additional CLI the user runs:
**Antigravity CLI (Gemini), Codex, Devin CLI, Grok Build CLI**.

**Why:** avoid N hand-maintained config copies drifting apart — same "single-source the
contract / multi-source the delivery" spine adopted from the Trellis review ([[nxtlvl-trellis-distillation]]).

**How to apply (updated 2026-07-10 after four per-CLI adversarial self-reviews):**
- **The strategy is recorded as ADR-028** (`docs/decisions/ADR-028-portable-source-of-truth-per-cli-supplements.md`
  in nxtlvl-core): CLAUDE.md (project + global) is authored **portable**; emitted instruction
  files are **per-CLI supplements, never filtered copies**; the compiler emits only the
  mechanical residue (MCP, permissions demux, agent transforms, skills relocation) with a
  per-CLI verification step. The earlier "compile filtered AGENTS.md copies" idea was
  invalidated — Grok, Devin, AND Antigravity *accumulate* every instruction file (a copy =
  duplication + the leak survives); only Codex is pick-one. Probe 2026-07-10 settled
  Antigravity: `agy --new-project` trusted-workspace test loaded GEMINI.md + AGENTS.md both
  AND expanded `@file.md` imports (its self-review had claimed neither — model self-reports
  about file discovery are unreliable; probe > self-report).
- Verified per-CLI facts (with every self-review correction folded in) live in
  `docs/reference/multi-cli-config-compat.md` — read it before any compiler work. Headline
  traps: Codex trust-gates repo-local `.codex/` files (emit + verify, never just emit);
  Antigravity user config is `~/.gemini/config/`, NOT `~/.gemini/antigravity-cli/` (app data);
  all first-party "import Claude" commands (Codex desktop import, `agy plugin import claude`,
  Grok Ctrl+I) are one-shot bootstraps, not re-runnable sync.
- Prior art: `nxtlvl-lab/scripts/sync-agent-configs.ts` (stack.toml→per-CLI compiler — the
  seed to generalize, refocused per ADR-028) + `nxtlvl-wiki/scripts/compile_agents.py`
  (agent tool map; must grow Antigravity's orchestration tools).
- Don't compile: Codex memories (convention — no doc forbids or blesses external writes),
  Devin Knowledge (no CLI surface), C&M.
- The pre-build doc gaps (Codex commands, Devin permission grammar) are **closed** — the
  2026-07-10 self-review passes in the compat doc ground them.
- **Compiler Task 1 DONE — built, applied, verified (2026-07-11):** global-scope compiler
  at `nxtlvl-core/scripts/multi-cli-compiler/` (spec `docs/spec/nxtlvl-multi-cli-compiler.md`,
  plan `docs/plan/nxtlvl-multi-cli-compiler-plan.md`). Emits: Codex
  `project_doc_fallback_filenames` managed TOML region + `~/.codex/AGENTS.md → ~/.claude/CLAUDE.md`
  symlink + `~/.gemini/GEMINI.md → ~/.claude/CLAUDE.md` symlink; RETIRES all of
  `~/.gemini/config/agents/` (five 2026-07-04 hand conversions + the first build's compiled
  `global-conventions.md` — a sentinel probe showed that directory is NEVER read; rules stay
  on-demand, deliberately NOT compiled per-rule, slash-command names would leak back
  always-on). Modes: dry-run default / `--write` (backups to gitignored
  `compiler-backup-workspace/`) / `--check` drift gate; portability gate hard-fails on
  Claude-only tokens. All emits applied live; `--check` in sync; symlink smoke passed
  (Antigravity quoted global-CLAUDE.md content through the `GEMINI.md` symlink with tools
  forbidden). Tasks 3–6 queued in the plan doc — Task 3 (skills/commands relocation) is next.
- **Compiler Task 2 DONE — repo-scope MCP emitters, built + verified (2026-07-12):**
  `--repo <path>` (repeatable) compiles the repo's `mcpServers` (union of `.mcp.json` +
  `.claude/settings*.json`, later wins) into a Codex `[mcp_servers.X]` managed region in
  `<repo>/.codex/config.toml` and a merge-preserving `<repo>/.agents/mcp_config.json`
  (`serverUrl` for HTTP; stdio skipped for Antigravity — key shape unverified). **Seed
  handshake:** a `.codex/config.toml` stamped "Generated from .agents/stack.toml" is never
  rewritten — the compiler asserts delivery instead (CONFLICT status, non-zero
  `--check`/`--write`; the fix belongs in stack.toml). Lab acceptance: compiled state
  byte-identical to the seed's output; lab's own sync `--check` green. Live probes: Codex in
  the lab lists `deepwiki` (repo-local `.codex/config.toml` loads — home-dir trust covers
  it); `agy --new-project -p` in the lab lists `context7, deepwiki` — the
  `.agents/mcp_config.json` channel is now PROBE-VERIFIED (was self-review-only). Probe
  discipline (from the Task 1 revision): plain `agy -p` without a project binding loads NO
  instruction files; always bind a project and pair probes with a positive control.
- **CLAUDE.md portable restructure DONE (2026-07-11):** all four instruction files swept
  (global + nxtlvl-core slash-syntax rewrites; stale sandbox-block stragglers deleted from
  nxtlvl-lab + nxtlvl-wiki), committed per repo. `grok inspect` ground truth: Grok's
  always-on stream is exactly global + project CLAUDE.md — `~/.claude/rules/` is on-demand
  only. Remaining build work: plan Tasks 2–6 — repo-scope MCP emitters, skills/commands
  relocation, agent transforms, permissions demux, verification deepening + Grok config
  hygiene. (The two global gaps once listed here — Codex missing the CLAUDE.md fallback,
  and a stale always-on Antigravity rule — were closed by the applied Task 1.)
