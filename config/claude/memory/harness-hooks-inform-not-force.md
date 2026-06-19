---
name: harness-hooks-inform-not-force
description: "nxtlvl hooks should INFORM the user, not force agent behavior; never interrupt the agent mid-task — push behavior-shaping (e.g. task-sizing) into workflow rules instead."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 57d6561b-69b1-4b87-8c8d-0fb277386c53
---

When designing nxtlvl hooks, the user's strong preference is **awareness over coercion**: a hook should surface a signal to the user and let them decide, not steer or interrupt the agent mid-task.

**Why:** mid-task interruption and behavior-steering degrade the work and feel intrusive. In the context-alert session (2026-06-17) the user explicitly redirected the design away from "agent winds down → checkpoints → commits → compacts" toward "agent just appends a one-line FYI at its next report, keeps working." Behavior-shaping that *bounds* the problem (e.g. scoping task size to stay under a token budget) belongs in **workflow rules**, not in a hook that forces the agent's hand. Consistent with the harness's "a book on the shelf, not a coworker" restraint ([[nxtlvl-harness]]) and quality-first composition ([[compose-on-native-quality-first]]).

**How to apply:** default hooks to *inform* (notification, one-line surface, pointer) rather than *force* (stop, block, mutate). Reserve blocking/steering for explicit, named gates that earned a slot via the intake test. Prefer pointers over dumped content. See [[nxtlvl-context-alert-hook]] for the worked example.
