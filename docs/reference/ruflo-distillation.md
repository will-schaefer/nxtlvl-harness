# ruflo (claude-flow) — Distillation (Adopt / Adapt / Reject)

> Distilled 2026-06-19 from a vendored clone of `ruvnet/ruflo` (formerly **claude-flow**), at
> `reference/ruflo-main/` (80M; gitignored, not tracked). Analyzed read-only via a three-agent
> parallel fan-out, one per review lens the user pinned: **multi-agent orchestration**,
> **self-learning memory**, and **hooks & task routing**. Ruflo is a **maximalist multi-agent
> harness**: `npx ruflo init` installs ~98 agents, 60+ commands, 30 skills, an MCP server, hooks,
> and a daemon; 34 marketplace plugins add swarms, federation, autopilot, RAG/vector memory, a
> knowledge graph, and a vendored Rust/TS engine (`@claude-flow/cli` v3.6, the ~2900-file `v3/`
> tree). It markets "agents that self-organize into swarms, learn from every task, remember across
> sessions, and securely talk to agents on other machines." Every finding cited to `file:line`
> (paths relative to the clone root). **Purpose:** record an adopt/adapt/reject judgment per the
> nxtlvl build method (review harnesses to shape ours). Fourth breadth/maximalist harness reviewed —
> companion to [claude-code-templates-distillation.md](claude-code-templates-distillation.md),
> [awesome-claude-code-toolkit-distillation.md](awesome-claude-code-toolkit-distillation.md),
> [agentic-os-distillation.md](agentic-os-distillation.md), and the curated-depth pair
> [agent-skills-distillation.md](agent-skills-distillation.md) /
> [superpowers-distillation.md](superpowers-distillation.md).

---

## 1. The spine — the maximalist counterfactual that confirms nxtlvl, because its own shipped code collapses back onto our positions

Ruflo is the loudest possible argument *against* nxtlvl's curated-depth thesis: 34 plugins, ~98
agents, 5 consensus protocols, 300+ MCP tools, federation across machines, a self-learning vector
memory. So the striking result of the fan-out is that **all three lenses, analyzed blind to each
other, converged on the same finding — ruflo's *shipped, installed* code collapses back onto the
exact positions nxtlvl already locked.** The rhetoric–wiring gap *is* the validation.

- **Orchestration.** A "swarm" via `swarm_init` is only a *coordination record* — "→ coordination
  record (instant)" (`AGENTS.md:23`) — and the doctrine is explicit: "Never use MCP tools alone for
  execution — Task tool agents do the actual work… call MCP first, then IMMEDIATELY call Task tool
  to spawn agents" (`CLAUDE.md:64-72`). The real executor is Claude Code's **native**
  `Task`/`SendMessage`/`Monitor`. And the recommended default is *small*: cap at **6–8 agents**,
  hierarchical, specialized, frequent verification gates, because big swarms drift
  (`CLAUDE.md:86-104`), plus "Never continuously check status after spawning a swarm — wait for
  results" (`CLAUDE.md:14`). Strip the marketing and ruflo's *effective* core is "a coordinator
  orchestrating a few specialized subagents on native primitives, with gates" — nxtlvl's model.

- **Memory.** Stripped of its npm/WASM engine (as a fresh clone is), the "self-learning" DB
  degrades to: keyword **Jaccard token-overlap** recall, not vectors (`.claude/helpers/intelligence.cjs:170-218`,
  threshold `0.05`); a hand-rolled HNSW fed **deterministic char-hash "embeddings"** when ONNX is
  absent (`.claude/helpers/learning-service.mjs:537-563`) while still reporting `hnswActive: true`;
  and "SONA neural distillation" that is literally `UPDATE short_term_patterns SET quality =
  quality * 1.05` plus a **hardcoded** `"adaptationTime": "0.05ms"` (`.claude/helpers/learning-optimizer.sh:48-98`).
  The on-disk `agentdb.rvf` is a **162-byte empty stub**; `data/` is not memory at all but a
  **download-count ledger** (`clone-data.ledger.json`). nxtlvl's `MEMORY.md` + instincts has **no
  degraded mode that lies** — a file pointer resolves or it doesn't; confidence moves only on
  evidence.

- **Hooks & routing.** The README headline — "the hooks system automatically routes tasks, learns
  from successful patterns, and coordinates agents in the background" (`README.md:44`) — is false as
  written. The live router is a **40-line regex lookup table**, 8 hardcoded `pattern→agent` pairs,
  `0.8` confidence on any match (`.claude/helpers/router.cjs:18-48`), whose output is *printed into
  context* via `UserPromptSubmit` stdout for the model to read or ignore — it never dispatches,
  spawns, or blocks. The "intelligence" learner is self-labeled `Intelligence Layer Stub` with a
  no-op `feedback()` (`.claude/helpers/intelligence.cjs:1-8,227-229`). The **only** hook that blocks
  is an objective 4-entry dangerous-command denylist (`.claude/helpers/hook-handler.cjs:148-161`);
  everything else is fail-open by construction. The one hook that *would* steer the agent —
  `Stop→{"decision":"continue"}` to force more work — exists only in an un-wired plugin manifest
  variant (`plugin/hooks/hooks.json:159-180`), **not** in the live `.claude/settings.json`.

**The decisive sentence:** even the maximalist auto-routing evangelist, when it actually ships,
builds **inform-don't-force routing, a single objective dangerous-bash gate, native execution, and
small coordinated teams** — and *quarantines* its one steering hook out of the active config.
nxtlvl's curated stance isn't a smaller, more timid ruflo; **it is where ruflo's code already lives,
minus the marketing.** That makes ruflo the most valuable breadth-harness review yet: unlike cct (a
distribution *catalog*) or awesome-claude-code-toolkit (breadth-as-product), ruflo is a *functional*
maximalist system, so the confirmation comes from its real engineering choices degrading toward ours
— not merely from its packaging.

A second, sharper-than-usual thread: **ruflo also supplies a real harvest of adopts** — more than
the prior thin breadth ledgers — and they are almost all *cultural / hygiene* patterns, not
features: honest "Measured vs Unverified" benchmark annotation, fail-soft degradation, a
shell-injection-safe hook payload idiom, and self-labeled stubs. Mine those; reject the architecture.

---

## 2. Multi-agent orchestration — scale that recommends its own ceiling

Ruflo's orchestration is three layers: (a) **swarm topology + roles** — topology
(`hierarchical`/`mesh`/`ring`/`star`/`adaptive`), `maxAgents`, `strategy`, `consensus`; the
"anti-drift" default is hierarchical / 6–8 / specialized / raft (`CLAUDE.md:86-104`), with a "Queen"
coordinator decomposing work to workers (`.claude/agents/swarm/hierarchical-coordinator.md:1-60`).
(b) **The execution seam is native, not MCP** — `swarm_init` is bookkeeping; "After init, spawn
agents via Claude Code's Task tool with `run_in_background: true`"
(`plugins/ruflo-swarm/commands/swarm.md:14`); the 12 MCP `swarm_*`/`agent_*` tools are a parallel
state plane. (c) **Coordination plumbing** — file-backed priority message queues
(`.claude/helpers/swarm-comms.sh`), a hooks context-injection channel (`swarm-hooks.sh:11-13`), a
7-agent consensus family (Byzantine/PBFT/Raft/Gossip/CRDT under `.claude/agents/consensus/`),
an autopilot loop with a cache-aware `ScheduleWakeup(270s)` heartbeat and self-termination
(`autopilot-loop/SKILL.md`), a 5-phase gated SPARC pipeline (one agent per phase), and federation
with mTLS/trust-tiers and a `maxHops`/`maxTokens`/`maxUsd` circuit breaker (ADR-097,
`plugins/ruflo-federation/README.md:289-310`).

**Signal vs demo.** Genuine craft: the MCP-record-vs-native-executor split; the anti-drift
self-correction; the federation budget circuit-breaker; the 270s cache-TTL heartbeat fact; SPARC's
hard inter-phase gates. Demo/filler: `ruflo-arena` (game-theory FSMs / Wolfram "ruliology"),
`ruflo-neural-trader`, `ruflo-iot-cognitum`, `ruflo-market-data` are toy domains padding the plugin
count; the consensus agents apply distributed-systems vocabulary (Byzantine fault tolerance) to
single-machine LLM prompts where it is meaningless; the ~98–108-agent library is mostly re-skinned
role prompts (`core/coder.md`, `core/tester.md` re-clothed across 27 categories).

**The contrast:** a 34-plugin / ~98-agent / 5-consensus-protocol system, when it wants reliable
results, caps the swarm at 6–8, tells the agent to stop babysitting, keeps a coordinator to catch
drift, and delegates real work to native primitives. That *is* nxtlvl's "main thread orchestrates +
a few targeted subagents + Workflow tool." Ruflo's scale is the part it built and then wrote rules
to avoid using.

---

## 3. Self-learning memory — a memory that can silently become noise while claiming to learn

The **marketed** architecture: an AgentDB SQLite+vector substrate, ~29 init controllers
(`reasoningBank`, `hierarchicalMemory`, `hybridSearch`, `nightlyLearner`, `causalGraph`…), 300+ MCP
tools, a 4-step intelligence loop (RETRIEVE→JUDGE→DISTILL→CONSOLIDATE) with SONA/MicroLoRA adaptation
and EWC++ to prevent catastrophic forgetting, `working|episodic|semantic` tiers, and a "memory
bridge" importing Claude Code's own `~/.claude/.../memory/*.md` into AgentDB with 384-dim ONNX
embeddings + Reciprocal Rank Fusion (ADR-090). **Almost all of it lives behind an opaque npm/WASM
runtime the plugins only wrap.**

What **actually ships as readable code** is a smaller, honest fallback layer — and it is where the
truth lives:

- `intelligence.cjs:170-218` — the real local retriever is **Jaccard set-overlap**, threshold
  `0.05`, surfaced as a stderr advisory. No embeddings.
- `learning-service.mjs` — a genuinely-designed lifecycle (`better-sqlite3`, short/long-term tables,
  promotion on `usage ≥ 3 AND quality ≥ 0.6` at `:733-782`, cosine-dedup > 0.95, decay, pruning) —
  but its embedder is `_fallbackEmbed` deterministic char-hash vectors when ONNX is absent
  (`:537-563`).
- `learning-optimizer.sh:48-98` — "SONA micro-LoRA optimization" = `quality = quality * 1.05` +
  hardcoded `"adaptationTime": "0.05ms", "microLoraEnabled": true`; "intelligence score" = arithmetic
  on row counts.
- `context-persistence-hook.mjs` — **real and useful**: PreCompact/SessionStart archiving of
  transcript turns into SQLite (4-tier fallback to JSON) for context across compaction.
- `auto-memory-hook.mjs:367-440` — SessionEnd `doSync` re-curates `MEMORY.md` with PageRank-style
  graph ordering, **only if** the bundled package is present; else clean no-op.

**Honesty, where it appears, is the best engineering in the repo:** `CLAUDE.md` itself *retracts* the
downstream "150x–12,500x faster" claim ("NOT reproduced — was brute-force fallback," measured HNSW
~1.9x–4.7x) and tags Flash Attention "Unverified (no benchmark exists)." The headline survives in
plugin READMEs and skills after being disproven upstream. `data/clone-data.proof.json` is
**download-count theater** ingested into the same `.rvf` format as memory, blurring "we have traffic"
into "we have memory tech."

**The contrast:** the question isn't "DB vs files" as a performance tradeoff — it's "**a memory that
can silently become noise while claiming to learn**" vs "**a memory that is legible and honest by
construction.**" ruflo's degraded clone reports `intelligence score: 72% (proficient)` while serving
worse-than-grep results; nxtlvl's `MEMORY.md` + instincts cannot lie about its own state. Ruflo's
documented "catastrophic forgetting" hazard (EWC++ exists because "fresh trajectories overwrite older
patterns… the system 'forgets'") is a problem nxtlvl's append-only one-fact-per-file design **never
has**. No finding here challenges a LOCKED nxtlvl C&M decision (D1 XDG store, D2 bookmark gate,
D3 /evolve, D5 cheap observer); every contrast reinforces them.

---

## 4. Hooks & task routing — even the auto-routing evangelist ships inform-don't-force

Ruflo runs **two parallel, non-agreeing hook stacks**: a live Node stack dispatched through one
handler (`.claude/settings.json:45-160` → `hook-handler.cjs`: `PreToolUse(Bash)→pre-bash`,
`PostToolUse→post-edit`, `UserPromptSubmit→route`, `SessionStart/End`, `PreCompact`,
`SubagentStop`), and a plugin bash stack (`.claude-plugin/hooks/hooks.json`, `plugin/hooks/hooks.json`,
`plugins/ruflo-core/hooks/hooks.json`) shelling telemetry into a CLI.

**Blocking vs advisory — from the code, not the copy:**

- **One hook blocks, and it's objective.** `pre-bash` substring-matches a 4-entry literal denylist
  (`rm -rf /`, `format c:`, `del /s /q c:\`, the `:(){...}` forkbomb) → `process.exit(1)`
  (`.claude/helpers/hook-handler.cjs:148-161`). (Weakly — trivially bypassed by `rm  -rf /`
  double-space or `$HOME`.)
- **Everything else is fail-open by construction:** plugin pipelines end in `|| true` +
  `|| true` (`.claude-plugin/hooks/hooks.json:12,21`); the shim does
  `exec 2>/dev/null; exit 0` (`plugins/ruflo-core/scripts/ruflo-hook.sh:21,33`); the Node handler
  wraps every handler in try/catch and installs a **5s global safety timer that force-`exit(0)`s**
  (`hook-handler.cjs:97-101`).
- **Routing injects, never dispatches.** `router.cjs:18-48` is a regex table; its output is printed
  into context via `UserPromptSubmit` stdout (`hook-handler.cjs:124-146`) — advisory text the model
  may ignore.
- **The one steering hook is quarantined.** A `Stop`/`SubagentStop` *prompt-hook* emitting
  `{"decision":"continue"}` to keep the agent working exists in `plugin/hooks/hooks.json:159-180` but
  is **not wired** into the live `.claude/settings.json` (zero `"type":"prompt"`/`"decision"`/`exit 2`
  in live settings). They wrote it, then didn't ship it.
- **One genuine anti-pattern to name:** a `PermissionRequest` hook auto-echoing
  `{"decision":"allow"}` for the entire `mcp__claude-flow__.*` namespace
  (`plugin/hooks/hooks.json:194-205`) silently defeats the permission prompt — a forcing
  convenience nxtlvl must not adopt.

**The contrast:** ruflo markets "automatically routes tasks and coordinates agents," and its
*installed* config implements inform-only routing + one fail-open denylist. The gap between its
rhetoric and its wiring **is** the corroboration of nxtlvl's two LOCKED hook positions — "hooks
inform, never force" and "the single blocking gate is objective, never taste." Two independent
harnesses converged on the same shape; ruflo even left its one steering hook on the cutting-room floor.

---

## 5. Consolidated Adopt / Adapt / Reject ledger

Mapped to the nxtlvl surface each finding informs. Verdicts merge the three per-domain ledgers;
"Confirm" = a contrast that ratifies an existing decision (not a feature transplant).

| # | ruflo pattern | nxtlvl surface | Verdict | Why |
|---|---|---|---|---|
| 1 | "Measured / Target / Unverified" benchmark annotation + cited benchmark script; self-retracted unreproduced claims | C&M perf claims; any harness doc | **Adopt** | Pure discipline, zero architecture cost — tag every quality/perf claim measured-vs-aspirational and cite the script. |
| 2 | Fail-soft degradation everywhere (`\|\| true`, `continueOnError`, `exec 2>/dev/null; exit 0`, 5s force-exit safety timer) | settings / all hooks; observer & /evolve | **Adopt** | Validates fail-toward-silence; the force-exit safety-timer is a concrete idiom for any Node hook. |
| 3 | stdin→`jq`→`xargs -0` shell-injection-safe payload extraction (`_security_note`) | dangerous-bash gate / any command hook | **Adopt** | Correct security pattern; use it (not `$VAR`) if any nxtlvl hook ever interpolates tool_input into a shell. |
| 4 | Self-labeled "stub" + visible truncation `[WARN]` lines | general doctrine (learning seams) | **Adopt (doctrine)** | Honest "this is a stub, full version elsewhere" + visible truncation is good harness hygiene. |
| 5 | MCP `swarm_init` = state record; native `Task` = executor | Workflow tool + main-thread orchestration | **Confirm** | Validates "compose on native"; nxtlvl already does this *without* ruflo's redundant MCP bookkeeping plane. |
| 6 | Anti-drift default: cap 6–8 agents, hierarchical, specialized, verify gates; "wait for results, don't babysit" | subagent fan-out sizing (Workflow rules); inform-don't-steer doctrine | **Confirm / Adopt as rule** | A maximalist system's own ceiling — a useful empirical bound + an explicit anti-babysitting rule. |
| 7 | `parallel` (barrier) vs `pipeline` (no barrier) + `resumeFromRunId` caching | Workflow tool JS primitives | **Adapt** | nxtlvl's Workflow tool already has these; sharpen its docs with the explicit barrier/no-barrier + resumable-run framing. |
| 8 | Federation budget circuit-breaker: per-call hop/token/usd caps, oracle-safe constant errors (ADR-097) | recursive Workflow nesting guardrail (future) | **Adapt** | Right design *if* nxtlvl ever allows agents-spawning-agents; not needed today. |
| 9 | 270s-under-cache-TTL autonomous-loop heartbeat | (timing fact only) | **Adapt (fact)** | Keep the cache-TTL fact; reject the autonomous-loop stance behind it. |
| 10 | Short→long promotion on `usage ≥ N AND quality ≥ T` | /evolve instinct promotion | **Adapt** | Usage-count is a cheap promotion signal worth pairing with clustering — but keep nxtlvl's human/evolver-agent gate, not auto-promote. |
| 11 | PageRank/graph-aware re-ordering of `MEMORY.md` index | MEMORY.md index curation | **Adapt** | Borrow only as a *read-time* ranking hint; never an automatic rewrite of human-curated content. |
| 12 | Proactive transcript archiving before compaction (`context-persistence-hook`) | context lifecycle (PreCompact / Hook 2) | **Adapt** | Fold "archive-before-fill" into nxtlvl's PreCompact seam — the concept, not the SQLite machinery. |
| 13 | Static PreCompact reminder banner on every compact | context-alert / future PreCompact | **Adapt** | The shape-the-summary seam is legit; make nxtlvl's conditional + substantive, not a fixed boilerplate wall. |
| 14 | Single blocking hook = objective dangerous-command denylist | dangerous-bash gate | **Confirm + harden** | Same shape as ours; ruflo's 4 literal substrings miss `rm  -rf`/`$HOME`/quoting — keep nxtlvl's gate normalized/regex, not literal-substring. |
| 15 | `UserPromptSubmit` stdout injects an advisory routing hint the model may ignore | router meta-skill | **Confirm (principle), Reject (mechanism)** | Inform-only delivery confirms "hooks inform"; the regex-into-context dispatch is the keyword router nxtlvl deliberately rejected (mis-routes "plan the *test* strategy"). |
| 16 | "Self-learning" AgentDB/SONA/LoRA/EWC++ branding (local reality: Jaccard + hash-HNSW + `quality *= 1.05`) | instinct confidence + observer | **Reject** | Degrades to noise while reporting "active"; nxtlvl's evidence-driven confidence is the honest version of exactly this. |
| 17 | RVF portable-memory container + proof/ledger sidecar (conflated with download-count theater) | instinct-export/import | **Reject** | Heavy binary format; nxtlvl's file-based export is already portable and legible. |
| 18 | Namespace routing (`pattern` vs `patterns`, silently-dropped args) | memory note categories | **Reject** | An ADR's worth of footguns from DB indirection; a flat file index needs none. |
| 19 | `Stop`→`{"decision":"continue"}` prompt-hook forcing more work | context-alert / Stop | **Reject** | Steers the agent mid-task — LOCKED-out; ruflo itself didn't wire it into live settings. |
| 20 | `PermissionRequest`→`{"decision":"allow"}` auto-approving an MCP namespace; auto-`git commit`/`reset --hard` checkpoint hooks | settings / gates | **Reject** | Forcing side-effects that erase a safety surface; against the inform-only line. |
| 21 | Consensus agent family (Byzantine/Raft/CRDT/Gossip/Quorum) over single-machine prompts | doubt-reviewer / idea-critic | **Reject** | Distributed-consensus ceremony; fresh-context adversary is the right-sized "independent agreement." |
| 22 | ~98–108-agent re-skinned role library; file-backed swarm comms bus; arena/neural-trader/iot demo plugins; 3–4 overlapping hook configs | curated subagents; native `SendMessage`; single hook config | **Reject** | Breadth-as-product — redundancy, a routing problem, comms plumbing native primitives obviate, and no single source of truth for what fires. |

---

## 6. Applying to nxtlvl — what changes, what's reinforced, ADR candidates

**Reinforced (no action, cite as external evidence):** the spine and the three contrasts are
*corroboration from a functional maximalist system* for decisions nxtlvl already made — "compose on
native," "main-thread orchestrates + few subagents," "hooks inform, never force," "single objective
gate," and the entire curated-file C&M stance (D1/D2/D3/D5). Any future ADR or rule that leans on
these can cite ruflo as the maximalist that, in shipped code, lands on the same positions. That is
ruflo's primary value: **contrast that confirms, not source that supplies.**

**Actionable adopts (small, cultural/hygiene — notes, not ADRs):**
- Add a **"Measured / Target / Unverified" annotation convention** for any perf/quality claim nxtlvl
  makes about C&M or workflows, with a cited benchmark script (ledger §1).
- Carry the **fail-soft idioms** into nxtlvl's Node hooks/observer: try/catch + a force-exit safety
  timer + clean no-op when a dependency is absent (§2).
- Bank the **`jq`/`xargs -0` injection-safe payload pattern** for any future hook that shells out (§3).

**Actionable adapts (scoped, when the surface is built):**
- **Harden the dangerous-bash gate** against ruflo's literal-substring weakness — keep it
  normalized/regex (collapse whitespace, expand `$HOME`) so `rm  -rf /` and `$HOME` don't slip
  through (§14). *This is a refinement of an existing gate, not a new decision.*
- Fold **archive-before-compaction** and **conditional (not boilerplate) PreCompact injection** into
  the Hook 2 design when it's built (§12–13).
- Consider a **usage-count promotion signal** alongside /evolve clustering — human/evolver-gated,
  never auto-promote (§10); and a **read-time graph-ranking hint** over the curated `MEMORY.md` index,
  never an automatic rewrite (§11).

**ADR candidates:** **none.** Per the decision rule's ADR-worthy test (architectural *and* expensive
to reverse), every ruflo finding is either (a) a confirmation of an already-LOCKED decision — which
at most *amends/cites* an existing ADR, never warrants a new one — or (b) a small mechanism/hygiene
note. Curate hard: ruflo is a rich review but a thin ADR yield, exactly as a "contrast that confirms"
should be.
