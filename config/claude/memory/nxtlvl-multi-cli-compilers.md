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
- **The strategy is recorded as ADR-028** (`docs/decisions/ADR-028-portable-sot-per-cli-supplements.md`
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
