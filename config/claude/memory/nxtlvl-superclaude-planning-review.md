---
name: nxtlvl-superclaude-planning-review
description: Mode-C feature-spanning domain review of SuperClaude framework's planning capability; same broken-as-a-whole verdict as ruflo
metadata:
  type: reference
---

Mode-C (harness-review) domain review of the **SuperClaude Framework v4.3.0** planning capability at
`docs/reference/superclaude-planning-review.md`. Feature-spanning: **spine=commands** (design/estimate/
task/workflow/spawn/brainstorm, scored on full commands rubric), supporting=agents (requirements-analyst/
system-architect/pm-agent) + modes/core-rules (Task_Management/Orchestration/RULES/PRINCIPLES/FLAGS).

Verdict ≈ **2/5, strong-in-parts/broken-as-a-whole** — same shape as [[nxtlvl-ruflo-discovery-review]].
Three convergent seam-failures: (1) commands DON'T DELEGATE — grep for sibling agents/modes across all 6
planning commands = zero hits; personas:/mcp-servers: frontmatter is decorative. (2) modes & core rules
are DEAD TEXT — `plugin.json` omits `modes`/`core` keys, no `@import` in CLAUDE.md, no hook injection, no
flag parser → D6=1. (3) capability encoded 3–5× (brainstorm ×4, pm ×3, design ×2) with NO source of truth
+ NO router. Plus: **zero agents declare `tools:`** (0/20) → all inherit Write/Edit/Bash (missing grant =
max-privilege, not default-safe); pm "PDCA/reflexion/confidence" split across agent-prose + skill +
test-only Python (`pm_agent/*.py` imported only by `pytest_plugin.py`); **src/↔plugins/ divergence ships
the STALE copy** (all 6 commands truncated, dropped the `## CRITICAL BOUNDARIES`/STOP guards); freshness
rot (modes name Serena/Magic/Morphllm MCPs not in shipped `.mcp.json`). High-water = `RULES.md` tiered
priority + Safety>Scope>Quality>Context conflict hierarchy; clean requirements-analyst/system-architect
personas. NO ADR (all findings confirm LOCKED nxtlvl positions: router-as-loaded-floor-brief,
read-only-by-withheld-tools, pointers-over-content, single-source-of-truth, judge-wiring-not-README).
5th harness review; 2nd feature-spanning Mode-C. Mine the doc instead of re-scanning the 3.6M clone.
