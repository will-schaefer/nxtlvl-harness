---
name: user-1m-context-degradation
description: "Runs a 1M-context model (Opus 4.8, 1M beta); observes output quality degrading around 150–200K tokens — far below the cap."
metadata: 
  node_type: memory
  type: user
  originSessionId: 57d6561b-69b1-4b87-8c8d-0fb277386c53
---

The user works on a **1M-token context window**, but observes the model's output quality starting to **degrade around 150–200K tokens** of context (sloppier work, dropped earlier decisions) — well before the cap. Stated during the context-management idea-refine session (2026-06-17).

**How to apply:** the practical working ceiling is ~150–200K, *not* the 1M cap. Native auto-compaction (~900K) fires far too late to protect quality, so a self-imposed compaction signal in the 150–200K band is where the value is. When sizing tasks or deciding when to `/compact`, treat ~200K as "top of comfort," not "lots of room left." Treat the exact onset as an observation to re-check (possible confirmation bias), not a hard constant. Drives [[nxtlvl-context-alert-hook]].
