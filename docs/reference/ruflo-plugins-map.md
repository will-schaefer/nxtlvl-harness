# ruflo plugins map

A within-repo structural map of the **35 plugins** shipped in the ruflo marketplace
(`reference/ruflo-main/plugins/`). Companion to the breadth [reference-repo-map.md](reference-repo-map.md)
and capability [reference-domain-map.md](reference-domain-map.md); zooms into one harness's plugin
surface. Source of truth is the marketplace manifest:
`reference/ruflo-main/.claude-plugin/marketplace.json`.

This is a **structural** map (what each plugin *contains* and *wraps*), not a quality review — for
the verdicts see [ruflo-distillation.md](ruflo-distillation.md), [ruflo-hooks-review.md](ruflo-hooks-review.md),
[ruflo-discovery-review.md](ruflo-discovery-review.md), [ruflo-adr-distillation.md](ruflo-adr-distillation.md).

## Headline findings

1. **Three plugin counts in one repo, none agreeing.** The manifest ships **35**; `CLAUDE.md`
   claims "**21** native plugins"; the `CLAUDE.md` "Optional Plugins" section says "**20** Available."
   Only the manifest matches disk (35 dirs). The prose docs are stale.
2. **A boilerplate cohort dominates.** **24 of 35** plugins share the exact `v0.2.0` stamp *and* the
   identical `1 command / 1 agent / 2 skills` shape — the signature of a batch-generated cohort, not
   35 independently-grown plugins.
3. **Capability lives elsewhere for most.** **33 of 35** are thin markdown wrappers that shell out to
   the shared `npx ruflo` / `claude-flow` CLI. The real engine is the monorepo's `v3/@claude-flow/*`,
   not the plugin dir. Only **2** (`graph-intelligence`, `arena`) bundle their own TypeScript engine.
4. **One plugin owns the plumbing.** `.mcp.json` ships in **`ruflo-core` only** — every advertised MCP
   tool funnels through it. `hooks.json` ships in just **`core` + `cost-tracker`**. The other 33
   register neither MCP servers nor hooks.
5. **Same "encoded N×, routed 0×" theme** as the prior reviews, now visible at *plugin* granularity:
   wide marketplace surface, mostly thin veneer over one shared backend.

## Archetype legend

- **wrapper** — thin CC surface (uniform `v0.2.0`, `1c·1a·2s`) over the shared CLI; engine is in `v3/`.
- **substantive** — meaningfully deeper than boilerplate (outlier component counts or iterated version).
- **code-runtime** — self-contained: own TS engine + MCP tools + tests in `src/`; **zero or near-zero**
  CC markdown surfaces (so a `commands/agents/skills` sweep reads them as "empty" — the capability is
  in `src/`).

## The 35 plugins by domain

Counts are `cmd` / `agent` / `skill` markdown files + `scripts` files; `ts` = `.ts` files under `src/`.

### Orchestration & execution (10)

| plugin | ver | cmd/ag/sk | scripts | ts | archetype | wraps / notes |
|---|---|---|---|---|---|---|
| ruflo-core | 0.2.2 | 2/4/4 | 15 | 0 | substantive | **only `.mcp.json`**; `hooks.json`; MCP + orchestration hub |
| ruflo-agent | 0.2.0 | 2/9/4 | 1 | 0 | substantive | local WASM (rvagent) + Anthropic cloud agents; 9 agents |
| ruflo-workflows | 0.4.0 | 8/3/5 | 2 | 0 | substantive | visual workflow automation; 8 commands |
| ruflo-goals | 0.2.0 | 1/4/5 | 1 | 0 | substantive | GOAP long-horizon planning; 4 agents |
| ruflo-metaharness | 0.1.0 | 1/1/8 | 24 | 0 | substantive | harness score/genome/mint/mcp-scan; 24 scripts |
| ruflo-arena | 0.1.0-α.1 | 1/0/0 | 0 | 13 | code-runtime | tournament/evolution engine; competitive ruliology |
| ruflo-swarm | 0.2.0 | 2/2/2 | 1 | 0 | wrapper | agent teams, Monitor streams, worktree isolation |
| ruflo-loop-workers | 0.2.0 | 2/1/2 | 1 | 0 | wrapper | cache-aware `/loop` + CronCreate background |
| ruflo-autopilot | 0.2.0 | 2/1/2 | 1 | 0 | wrapper | autonomous `/loop`-driven completion |
| ruflo-daa | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | dynamic agentic architecture |

### Memory & knowledge (6)

| plugin | ver | cmd/ag/sk | scripts | ts | archetype | wraps / notes |
|---|---|---|---|---|---|---|
| ruflo-graph-intelligence | 0.1.0-α.1 | 0/0/0 | 0 | 22 | code-runtime | personalized PageRank, streaming, 10 adapters, federation |
| ruflo-rag-memory | 0.2.0 | 2/1/2 | 1 | 0 | wrapper | RuVector HNSW + AgentDB retrieval |
| ruflo-agentdb | 0.3.0 | 2/1/2 | 1 | 0 | wrapper | memory controllers, HNSW, causal graphs |
| ruflo-ruvector | 0.2.1 | 1/1/4 | 1 | 0 | wrapper | self-learning vector DB |
| ruflo-rvf | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | portable agent-memory format |
| ruflo-knowledge-graph | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | entity extraction, relation mapping |

### Intelligence & neural (2)

| plugin | ver | cmd/ag/sk | scripts | ts | archetype | wraps / notes |
|---|---|---|---|---|---|---|
| ruflo-intelligence | 0.3.0 | 2/1/3 | 1 | 0 | wrapper | SONA patterns, trajectory learning, model routing |
| ruflo-ruvllm | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | local inference, MicroLoRA, SONA adaptation |

### Engineering / SDLC (10)

| plugin | ver | cmd/ag/sk | scripts | ts | archetype | wraps / notes |
|---|---|---|---|---|---|---|
| ruflo-cost-tracker | 0.26.0 | 1/1/20 | 22 | 0 | substantive | **most-iterated** (v0.26); `hooks.json`; 20 skills / 22 scripts |
| ruflo-testgen | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | test gap detection, coverage, gen |
| ruflo-docs | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | doc gen, drift detection, API docs |
| ruflo-jujutsu | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | git workflows, risk scoring, reviewer rec |
| ruflo-sparc | 0.2.0 | 1/1/3 | 1 | 0 | wrapper | SPARC methodology phases + gates |
| ruflo-ddd | 0.2.0 | 1/1/3 | 1 | 0 | wrapper | domain-driven design scaffolding |
| ruflo-adr | 0.3.0 | 1/1/4 | 3 | 0 | wrapper | ADR lifecycle (see ruflo-adr-distillation) |
| ruflo-migrations | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | schema migration gen/validate/rollback |
| ruflo-observability | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | structured logging, tracing, metrics |
| ruflo-plugin-creator | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | scaffold/validate/publish CC plugins |

### Safety & governance (3)

| plugin | ver | cmd/ag/sk | scripts | ts | archetype | wraps / notes |
|---|---|---|---|---|---|---|
| ruflo-security-audit | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | security review, dep scan, CVE monitor |
| ruflo-aidefence | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | PII detection, prompt-injection defense |
| ruflo-federation | 0.2.0 | 1/1/3 | 1 | 0 | wrapper | cross-install zero-trust federation, audit |

### Vertical / domain (4)

| plugin | ver | cmd/ag/sk | scripts | ts | archetype | wraps / notes |
|---|---|---|---|---|---|---|
| ruflo-neural-trader | 0.2.0 | 1/4/9 | 2 | 4 | substantive | LSTM/Transformer/N-BEATS; Rust/NAPI backtest; 4 agents |
| ruflo-browser | 0.2.0 | 1/1/9 | 3 | 0 | substantive | Playwright automation; 9 skills |
| ruflo-iot-cognitum | 0.2.0 | 1/4/5 | 1 | 0 | substantive | IoT lifecycle, telemetry, witness chain; 4 agents |
| ruflo-market-data | 0.2.0 | 1/1/2 | 1 | 0 | wrapper | feed normalization, OHLCV vectorization |

## Archetype tally

- **wrapper (24):** swarm, loop-workers, autopilot, daa, rag-memory, agentdb, ruvector, rvf,
  knowledge-graph, intelligence, ruvllm, testgen, docs, jujutsu, sparc, ddd, adr, migrations,
  observability, plugin-creator, security-audit, aidefence, federation, market-data.
- **substantive (9):** core, agent, workflows, goals, metaharness, cost-tracker, neural-trader,
  browser, iot-cognitum.
- **code-runtime (2):** graph-intelligence, arena (newest, `v0.1.0-alpha.1`; the only self-contained
  plugins).

## So what (for nxtlvl)

No ADR. This map confirms LOCKED positions by contrast, same as the prior ruflo reviews:

- The **35-vs-21-vs-20 count drift** + uniform-`v0.2.0` cohort is the marketplace-scale face of
  ruflo's "wide surface, thin wiring." nxtlvl's curated-depth + single-source posture is the inverse.
- The **wrapper-over-shared-CLI** pattern is *not inherently bad* — it's a legitimate way to expose one
  engine through many entry points. The failure is the **stale counts + no manifest-as-source-of-truth
  discipline**, which is exactly the drift nxtlvl's `/harness-review` keeps surfacing.
- Mining value is low and already captured elsewhere: the 2 code-runtime plugins are the only
  novel artifacts, and `graph-intelligence`'s adapter pattern (10 domain adapters → one graph) is the
  one structurally interesting idea — noted, not adopted.

Mine this instead of re-scanning the 35 dirs.
