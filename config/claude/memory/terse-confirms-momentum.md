---
name: terse-confirms-momentum
description: "The user answers with one-word locks (\"confirm\"/\"yes\"); acknowledge crisply and advance, don't re-litigate."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 794f06a2-18d8-40ab-b498-49d6500c44eb
---

The user replies to questions with terse decisions — "confirm", "yes", "promotion only, as an invoked skill", "confirm session as unit". Treat these as a **decision lock**, not an invitation to re-explain.

**Why:** Across the `nxtlvl` session they confirmed ~10 times tersely while carrying full context in their head. Verbose acknowledgments in response to a one-word lock are friction; they expect the assistant to hold the thread and keep momentum.

**How to apply:** On a terse confirm, give a one-line "Recorded: …" restatement that captures the decision precisely, then immediately move to the next branch. Reserve long prose for the *questions and recommendations*, not the acknowledgments. Pairs with [[grill-branch-by-branch]].
