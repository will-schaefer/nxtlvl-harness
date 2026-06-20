---
name: nxtlvl-ruflo-hooks-review
description: "Mode-C harness-review of ruflo's hook system — verdict, the registration-drift pattern, and the one verified-safe idiom worth mining."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 1d475fc2-1650-44b2-ad3d-0967d7f5936c
---

Mode C (`DOMAIN=hooks`) [[harness-review]] of ruvnet/ruflo's hook subsystem, written to
`docs/reference/ruflo-hooks-review.md`. Neutral audit (no TARGET/LENS), 3-slice parallel fan-out:
live `.claude/` wiring + `hook-handler.cjs` dispatcher · packaged `plugin/hooks/hooks.json` manifests
+ shims · `v3/@claude-flow/hooks` engine.

**Verdict ≈2.5/5 — strong-in-parts, broken-as-a-whole** (rubric D1=2,D2=4,D3=3,D4=2,D5=3,D6=3,D7=2,D8=2;
dominant dims D2 failure-posture / D7 intervention-discipline). Same shape as the two prior
feature-spanning reviews ([[nxtlvl-ruflo-discovery-review]] ≈3/5, [[nxtlvl-superclaude-planning-review]]
≈2/5): **capability encoded N×, routed 0×** — here as *registration drift* (6 hook-registration files
in 4 incompatible dialects, no source of truth, one invalid-JSON file). This is the hooks-domain
expression of [[nxtlvl-ruflo-distillation]]'s rhetoric–wiring gap.

**The two genuinely good pieces (real craft, cite-backed):** (1) production fail-open is layered &
deliberate — force-exit-0 timer + per-handler try/catch + `finally(exit 0)`, a throwing hook can't
brick the session; (2) the canonical `cat | jq -r '…' | tr '\n' '\0' | xargs -0` invocation pattern
is **empirically** injection-safe (sub-agent fired `a; rm -rf X && echo PWNED` → single argv, no side
effect). **But** the same repo ships `v3/@claude-flow/mcp/.claude/settings.json` interpolating
`$TOOL_INPUT_*`/`$PROMPT` straight into a shell string — the advertised security guarantee is true in
one file, false in another (caps D6).

**What caps it (distributed, not one fatal flaw):** the in-process `executor` defaults
fail-**closed** (`continueOnError:false`, abort→block) with no kill switch — safe only because dormant
(D2's hidden hazard); non-atomic last-writer-wins state + a ReasoningBank degraded mode that presents
meaningless hash-similarity as real `% match` (D4); `route` injects an unseen agent banner + Jaccard
memory every prompt and the engine injects its own *debunked* HNSW/Flash-Attention numbers into
context as fact (D7); "17 hooks/12 workers" → 17 live in a different package, ~11 unrelated workers
ship, bridge/executor are dead exports (D1/D8).

**No ADR** (all findings confirm nxtlvl's already-LOCKED positions: single authoritative registration,
fail-open default, inform-don't-force). The 1st *true* single-component Mode-C (discovery + planning
were feature-spanning); 3rd review to land on the strong-in-parts/broken-as-a-whole pattern. Mine the
jq/xargs-0 idiom + the layered fail-open posture; reject the multi-manifest drift. Cross-check stale: ruflo CLAUDE.md hook tables overstate the shipped
surface — trust the review's wiring cites over the README.
