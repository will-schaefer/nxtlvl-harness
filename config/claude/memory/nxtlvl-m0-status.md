---
name: nxtlvl-m0-status
description: nxtlvl Phase-0 build state — M0 walking skeleton done + stdin spike resolved; next is M1.
metadata: 
  node_type: memory
  type: project
  originSessionId: e2fb7e79-dfb8-4c48-9ed6-ef08259d720e
---

Building `nxtlvl` Phase 0 per [[nxtlvl-harness]], plan at `docs/plan/nxtlvl-phase-0-plan.md`,
spec at `docs/spec/nxtlvl-phase-0-mvh.md` (16 tasks, M0–M7 + promotion).

**M0 walking skeleton — DONE & installed (2026-06-17).** Files created in repo:
`.claude-plugin/marketplace.json` (name `nxtlvl-dev`), `plugins/nxtlvl/.claude-plugin/plugin.json`
(name `nxtlvl` v0.0.1), `plugins/nxtlvl/skills/review/SKILL.md` (composes `agent-skills:review`),
`plugins/nxtlvl/hooks/hooks.json` (PreToolUse `Skill|Task` only) + `hooks/fallback-log.sh`
(fail-open; spike-capture via env `NXTLVL_SPIKE=1` OR sentinel `~/.claude/nxtlvl/.spike-on`).
Installed via `/plugin install nxtlvl@nxtlvl-dev`; `nxtlvl:review` is registered. Manifests + hook
all verified (parse, exit-0 fail-open, capture).

**Stdin spike (Task 5) — RESOLVED, the gate is closed.** Real captured PreToolUse payloads:
- `Skill` tool → invoked name at **`tool_input.skill`** (e.g. `"ecc:aside"`).
- subagent tool is **`Agent`** (NOT `Task` as the spec assumed) → name at **`tool_input.subagent_type`**
  (e.g. `"ecc:code-explorer"`). `ecc:` prefix present in both.
- T12 fallback-log extraction: branch on which field is present (not on `tool_name`); append iff value
  starts with `ecc:`. **Set the matcher to `Skill|Task|Agent`** when thickening at T12.
- Evidence kept at `~/.claude/nxtlvl/spike-stdin.json`. Spec platform-facts rows flipped to "verified".

**ecc dormancy:** persisted `~/.claude/settings.json` has `enabledPlugins."ecc@ecc": false` (dormant,
desired). ecc is still LOADED in the current runtime (~270 skills) because the setting takes effect on
the next CC restart — a restart gives a clean dormant session. No settings edit needed. See [[disable-ecc-active-hooks-dev]].

**Next: M1 (Task 6)** — global `~/.claude/CLAUDE.md` + project `Developer/.claude/CLAUDE.md`, each with
a probe value, prove both observable in one session. Working collaboratively per [[terse-confirms-momentum]];
show each file before/as written. Checkpoint A (M0) is complete.
