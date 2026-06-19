---
name: cc-hook-env-propagation
description: "How env vars reach Claude Code command hooks — inline launch prefixes don't, settings `env` field does (and hot-reloads)."
metadata: 
  node_type: memory
  type: reference
  originSessionId: b04ad596-a323-440e-ad6a-29151e58e8fc
---

Platform facts on environment-variable propagation to Claude Code **command** hooks
(verified empirically 2026-06-17 against CC 2.1.179, debugging the nxtlvl
[[nxtlvl-context-alert-hook]] at a forced-low `NXTLVL_CONTEXT_ALERT_TOKENS`):

- **Inline launch prefix may NOT reach the process.** `NXTLVL_CONTEXT_ALERT_TOKENS=1000 claude`
  left the var **UNSET** in the running claude process (proven via the Bash tool, which
  inherits claude's full env via `cN()`). `claude` is a real binary, not a shell function, so
  the prefix *should* export — yet it didn't for the launched session. Treat inline prefixes as
  unreliable for this; this was the true root cause of the alert never firing, NOT hook curation.
- **Command hooks get a denylist-sanitized copy of the process env** (~44 vars). Withheld:
  proxies (`*_PROXY`), git helpers (`GIT_EDITOR`/`GIT_SSH_COMMAND`), and secrets
  (`TAVILY_API_KEY`). Injected: `CLAUDE_PROJECT_DIR`. Custom vars that are genuinely in claude's
  env **do pass through** — `ECC_GATEGUARD=off` reached the hook. So it's a denylist, not an
  allowlist; the agent-skills claim that `allowedEnvVars` governs command hooks is wrong —
  `allowedEnvVars` is **HTTP-hook-only** (distinct `BashCommandHookSchema` vs `HttpHookSchema`).
- **The reliable knob is the settings `env` field.** `settings.local.json` `"env": {VAR: "..."}`
  reaches command hooks AND **hot-reloads mid-session** (verified: set it to 1234, the
  context-alert hook fired at ~120K and wrote `{"alerted":true}`). CC also hot-reloads
  `settings.local.json` **hooks** mid-session.
- **`CLAUDE_CODE_DONT_INHERIT_ENV`** gates subprocess inheritance: when set, spawns get `{}`
  instead of `cN()`.

How to verify a live firing: the context-alert state file lands in the **real** macOS temp
(`$DARWIN_USER_TEMP_DIR/nxtlvl-ctx-alert-<session>.json`), NOT the sandboxed `/tmp/claude-502`
the Bash tool sees. `{"alerted":true}` there = it fired.
