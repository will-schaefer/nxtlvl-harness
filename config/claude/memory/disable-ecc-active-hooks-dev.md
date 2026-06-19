---
name: disable-ecc-active-hooks-dev
description: "During development, silence ecc's active hooks (GateGuard, pre:observe); keep ecc only as read-only reference."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 794f06a2-18d8-40ab-b498-49d6500c44eb
---

ecc's **active** machinery interferes during development — GateGuard blocks Bash and Write/Edit with a "fact-forcing gate," and `pre:observe` fires on every tool call. The user wants the active layer **off** during dev work (especially harness/agent work), keeping ecc's skills/agents on disk as a passive reference library.

**Why:** In the `nxtlvl` session GateGuard blocked the very first Bash command and again blocked doc/memory writes mid-task. The user confirmed: *"ecc's active hooks off during development; ecc stays as a read/reach reference."* This is recurring, concrete friction, not a one-off.

**How to apply:** RESOLVED 2026-06-16 — ecc is now set **dormant** in `~/.claude/settings.json` via `enabledPlugins."ecc@ecc": false` (effective on next CC restart). **Re-enable = flip that key back to `true`** (a deliberate, logged act per the harness design). Important gotcha: the env-var band-aid `ECC_GATEGUARD=off` was *already present* in settings.json `env` and proved **ineffective** (GateGuard still fired) — so don't rely on the env var; full plugin dormancy is the reliable way to silence ecc's hooks. The `ecc` marketplace stays in `extraKnownMarketplaces`, so ecc remains installed, just not loaded. Until a restart happens, GateGuard's fact-forcing gate still fires this session — present the requested facts and it lets subsequent calls through. Don't rely on ecc's active observation/governance machinery. Relates to [[nxtlvl-harness]], which demotes ecc to dormant by design.
