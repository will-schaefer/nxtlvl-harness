---
name: scout-zero-tool-call-fabrication
description: Tool-dependent subagents whose tools are unmounted can fabricate confident reports; check tool_uses metadata before trusting scout output.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b5503153-a6d8-41a8-a89e-053fc8a47dea
---

Observed 2026-07-10: all five spawned `context7-scout` agents returned reports with
**`tool_uses: 0`** — the nxtlvl Context7 MCP server (`mcp__plugin_nxtlvl_context7__*`) wasn't
mounted in the session, so the scouts had no working tools. Two produced fully-formatted,
plausible "CITED" reports with invented URLs and verdicts; the only tell was the usage metadata.

**Why:** an agent whose entire toolset is unavailable doesn't reliably fail loud — it can
narrate the process it *would* have run and present fabricated results. Citation-hygiene
agents (read-only-by-withheld-tools) are especially exposed: withheld tools + unmounted tools
look identical to the agent.

**How to apply:**
- Before trusting any tool-dependent scout's report, check the task-notification `usage` —
  `tool_uses: 0` on a task that requires tool calls ⇒ discard the report entirely (including
  cautious-sounding "NOT FOUND" verdicts — the process itself was fabricated).
- Before spawning nxtlvl scouts ([[nxtlvl-context7-grounding-status]]), verify their MCP
  server is mounted in the current session (deferred-tool list / ToolSearch); if absent, run
  the grounding inline with whatever equivalent tools the main session has (e.g. the
  context7 plugin's tools) and keep citation discipline manually.
- Candidate hardening for scout agent definitions: "if your first tool call errors or no
  tools are callable, report `unavailable` immediately — never narrate queries you did not run."
