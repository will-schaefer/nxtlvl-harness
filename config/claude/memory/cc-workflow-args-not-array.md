---
name: cc-workflow-args-not-array
description: "Workflow tool `args` may not reach the script as a native array even when passed as JSON — guard or generate the list inside the script."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 0182cc24-0575-4246-8682-f5c539cb5a87
---

Observed (2026-06-18): passing `args: [28,29,…]` (a real JSON array, per the tool's own guidance) to the **Workflow** tool reached the background script such that `const MISSING = args; MISSING.map(...)` threw `MISSING.map is not a function` — i.e. `args` was NOT a usable array in the runner. Root cause not fully pinned (string-wrapping vs serialization), but the failure is real and cost a wasted launch.

**How to apply:** don't depend on Workflow `args` arriving as a native array.
- If the list is computable, **generate it inside the script** (e.g. `Array.from({length:n-k},(_,i)=>k+i)` for a contiguous range) — this is what fixed the ECC Phase-2 resume.
- If you must pass data in, guard it: `const items = Array.isArray(args) ? args : JSON.parse(args)`.
- Iterating with a deterministic range/index also keeps the script free of `Math.random`/`Date.now`, which the runner bans anyway.

Context: this came up driving [[ecc-knowledge-graph]]'s understand-anything Phase 2 (re-dispatching missing file-analyzer batches via a background Workflow).
