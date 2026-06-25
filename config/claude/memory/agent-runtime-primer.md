---
name: agent-runtime-primer
description: "First-principles explainer of the agent-runtime layer (10 components, native-vs-DIY ledger, MVR) grounding the nxtlvl build-vs-compose decision."
metadata: 
  node_type: memory
  type: reference
  originSessionId: ecd3b843-e039-45a3-b140-af6beb102068
---

Reference doc at `docs/reference/agent-runtime-primer.md` — teaches what an agent runtime is from
first principles: the core loop (assemble → infer → decide → execute → observe → repeat), the 10
components (inference client, context mgmt, tool system, instruction assembly, orchestration/
subagents, skill routing, memory/persistence, hooks, interface, config/packaging), an ASCII data-flow
diagram, the **native-vs-DIY ledger**, and the **minimum viable runtime** tiers.

**Headline for the decision:** instruction assembly is the ONLY component where owning the loop
changes almost nothing — nxtlvl's substance (skills, router, memory, ADRs, doubt/idea-critic) is
prose+config that lives ABOVE the loop, so composing keeps it hardened-by-platform. The build-vs-
compose question reduces to: *is there a capability BELOW Claude Code's extension points worth taking
on the ten maintained components?* Grounded in `reference/` (deepagents rents the loop from LangGraph;
CodeWhale owns a Rust loop + pays with a 320K TUI crate; ruflo's owned memory lies).

Relates to [[nxtlvl-harness]], [[compose-on-native-quality-first]], [[harness-quality-over-simplicity]],
[[user-1m-context-degradation]].
