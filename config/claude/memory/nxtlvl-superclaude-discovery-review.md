---
name: nxtlvl-superclaude-discovery-review
description: Mode-C ideation/discovery review of SuperClaude (brainstorm + deep-research); 6th harness review, 3rd feature-spanning; verdict ≈2/5 strong-in-parts/broken-as-a-whole.
metadata:
  type: reference
---

Mode C feature-spanning domain review of SuperClaude v4.3.0's **brainstorm + deep-research**
capability at docs/reference/superclaude-discovery-review.md. Spine=skills (the two wired SKILL.md
playbooks); supporting slices = ideation commands/agents/modes+core. Verdict ≈2/5, the same
"strong-in-parts / broken-as-a-whole" shape as [[nxtlvl-ruflo-discovery-review]] and
[[nxtlvl-superclaude-planning-review]] (companion: same harness).

Two ideation-specific twists make it WORSE than the planning domain: (1) the **depth lives in dead
files** — deep-research's 445-line core/RESEARCH_CONFIG.md + both MODE_*.md sit under core/+modes/,
which plugin.json never declares → 500+ lines of unreachable spec, the richest artifact is the
deadest; (2) the **only loaded ideation files — the brainstorm + research commands — are the stale
truncations**, shipped missing their `## CRITICAL BOUNDARIES`/STOP-guards (which survive only in the
un-shipped src/ pip package), so the live capability is also the degraded one. Plus: the nominal
wired spine (the brainstorm/deep-research skills) is the SHALLOWEST encoding and composes nothing
(skills D4=1); two colliding deep-research agents (deep-research-agent.md 184L vs deep-research.md
31L); 0/20 agents declare tools: → max-privilege; freshness rot (names Tavily/Serena/Playwright,
.mcp.json ships only context7+sequential). Capability encoded 4–7× per capability with no router.
All findings CONFIRM locked nxtlvl positions (single-source-of-truth, load-bearing-wiring-over-
manifest, thin-wrapper commands, least-privilege grants); NO ADR. Reader-tested: substantively
accurate, stands alone.
