> **ruflo — hooks review.** A maximalist Claude Code hook system (advertised "17 hooks + 12
> workers + self-learning neural engine") whose shipped wiring collapses to a much smaller, much
> simpler reality, registered ~6× across mutually-incompatible files with no source of truth.
> Analyzed 2026-06-20 · 80M clone · source: https://github.com/ruvnet/ruflo. Scope: `hooks` (whole
> subsystem). Method: vendor → parallel read-only fan-out (3 slices — live `.claude/` wiring +
> dispatcher · packaged plugin manifests + shims · `@claude-flow/hooks` backing engine) →
> hooks-specialist synthesis.

# ruflo hooks — Mode C domain review

## 1. Spine — the headline judgment

**The hook system is strong-in-parts, broken-as-a-whole (≈2.5/5).** Two pieces are real craft: the
*production* failure posture is genuinely fail-open (a throwing hook degrades to silence and
force-exits 0, never blocks the agent), and the canonical packaged manifest's
`cat | jq -r '…' | tr '\n' '\0' | xargs -0` pattern is a correct, **empirically-verified**
injection-safe way to hand untrusted tool input to a CLI. But the subsystem as a whole is capped by
four systemic faults, three of them on the dimensions that dominate a hook audit:

1. **No source of truth.** The same hook capability is registered in **six files across four
   incompatible dialects** (`.claude/settings.json`, `plugin/hooks/hooks.json`,
   `.claude-plugin/hooks/hooks.json`, `plugins/ruflo-core/hooks/hooks.json`, and two
   `v3/@claude-flow/*/.claude/settings.json`), hand-copied and **drifted** — they disagree on which
   events fire, which subcommand runs, and whether matchers are anchored. One
   (`v3/@claude-flow/cli/.claude/settings.json`) is **invalid JSON**. (D1/D8)

2. **The advertised security strength is self-contradicted by a shipped sibling.** The injection-safe
   `jq`/`xargs -0` pattern (introduced in #1747, carrying a confident `_security_note`) holds — but
   `v3/@claude-flow/mcp/.claude/settings.json` interpolates `$TOOL_INPUT_command`, `$TOOL_INPUT_file_path`,
   and `$PROMPT` **directly into double-quoted shell strings**, the precise vector the note forbids.
   The guarantee is true for one file and false for another in the same package. (D6 ⭐)

3. **The engine advertises capability it doesn't ship.** README's "17 hooks" live in a *different*
   package; the "12 specialized workers" don't exist (a different set of ~11 generic workers ships
   via `createXWorker` factories); the `official-hooks-bridge` + `executor` are dead exports with no
   production caller; and the engine injects its repo's own **debunked** performance numbers (HNSW "150x–12,500x", Flash Attention
   "2.49x–7.47x") into the model's context as fact. ReasoningBank silently degrades to a
   meaning­less hash-embedding while presenting fake `(89% match)` scores. (D4/D7)

4. **Hooks steer, not just inform, in several places** — the `route` hook injects an unseen
   agent-routing banner plus Jaccard-matched memory on *every* prompt; prompt-type `Stop`/`SubagentStop`
   can return `{"decision":"continue"}` to force more work; `PermissionRequest` blanket auto-allows
   all `mcp__claude-flow__*` tools. (D7 ⭐)

The defining tension: **failure posture (D2) is right on the production path almost by accident of
what happens to be wired** — the in-process executor that *isn't* wired defaults fail-**closed**
(`continueOnError:false`, abort→block) with no kill switch. The system is safe because the dangerous
component is dormant, not because the design is uniform.

This is the **third consecutive ruflo/SuperClaude review to land on the same shape** — capability
encoded N× with no source of truth and no routing between the copies, a confident philosophy layer
the shipped wiring doesn't honor (cf. [`ruflo-discovery-review.md`](ruflo-discovery-review.md) ≈3/5,
[`superclaude-planning-review.md`](superclaude-planning-review.md) ≈2/5). For a hooks domain that
pattern expresses as *registration drift*. The harness's own one-gate, fail-open, inform-don't-force
instincts ([`ruflo-distillation.md`](ruflo-distillation.md)) are visible in the *best* file and
absent from the rest.

## 2. What's there & how it works

Three loosely-coupled layers, each a different mechanism. A Claude Code lifecycle event enters at the
**registration** layer (one of six JSON files), which shells out to an **invocation** layer (a Node
dispatcher *or* a bash shim), which calls the **engine** layer (`ruflo hooks <subcommand>`).

### Layer A — the live wiring (`.claude/settings.json` + `.claude/helpers/`)

What actually runs in *this* repo. Nine events wired to **two** Node entry-points (plus a statusline):

| Event | Matcher | Command (subcommand) | Timeout |
|---|---|---|---|
| PreToolUse | `Bash` | `hook-handler.cjs pre-bash` | 5000 |
| PostToolUse | `Write\|Edit\|MultiEdit` | `hook-handler.cjs post-edit` | 10000 |
| UserPromptSubmit | *(none — every prompt)* | `hook-handler.cjs route` | 10000 |
| SessionStart | — | `hook-handler.cjs session-restore` + `auto-memory-hook.mjs import` | 15000 / 8000 |
| SessionEnd | — | `hook-handler.cjs session-end` | 10000 |
| Stop | — | `auto-memory-hook.mjs sync` | 10000 |
| PreCompact | `manual` / `auto` | `compact-manual`/`compact-auto` + `session-end` | — / 5000–6000 |
| SubagentStop | — | `hook-handler.cjs post-task` | 5000 |

`hook-handler.cjs` (291 lines) is a **mega-dispatcher**: reads stdin JSON
([`hook-handler.cjs:78-93`](../../reference/ruflo-main/.claude/helpers/hook-handler.cjs)), normalizes
snake/camel fields (`:115-122`), and switches on the subcommand into a handler table (`:124-264`). It
`safeRequire`s four siblings (`router.cjs`, `session.cjs`, `memory.cjs`, `intelligence.cjs`, `:33-36`)
and never shells out. **Only 3 of the ~40 files in `.claude/helpers/` are reachable from any event**
(`hook-handler.cjs`, `auto-memory-hook.mjs`, `statusline.cjs`); the rest — incl. a 73KB
`context-persistence-hook.mjs` and a 35KB `learning-service.mjs` — are out-of-band CLI/daemon
plumbing, and `memory.cjs` is a dead `require` inside the dispatcher.

### Layer B — the packaged manifests (`plugin/hooks/hooks.json` + shims)

The version shipped to users. The canonical `plugin/hooks/hooks.json` (227 lines, 11 events) routes
every event as:

```
event → stdin JSON → cat | jq -r '<field>' | tr '\n' '\0' | xargs -0 -I {} \
        "${CLAUDE_PLUGIN_ROOT}/scripts/ruflo-hook.sh" <subcommand> --flag '{}' || true
```

The shim `ruflo-hook.sh` resolves a binary local-`ruflo` → local-`claude-flow` →
`npx --prefer-offline ruflo@alpha hooks` (`ruflo-hook.sh:25-31`), swallows stderr (`exec 2>/dev/null`,
`:21`), and `exit 0` unconditionally (`:33`). The `.sh` and its Windows `.cjs` port are byte-identical
across all three plugin copies — the *shim* has a clean single source; the *manifests* do not.

### Layer C — the `@claude-flow/hooks` engine

Three subsystems in one npm package: an in-process **registry+executor** (ships **empty** — nothing
self-registers, so `execute` returns `{success:true, hooksExecuted:0}`,
[`executor/index.ts:68-77`](../../reference/ruflo-main/v3/@claude-flow/hooks/src/executor/index.ts)),
a **guidance CLI** (`guidance-cli.ts` — the only real entry point: `session-context`, `user-prompt`,
`pre/post-edit`, `route`, `stop-check`, + 18 `swarm-*`), and **interval workers/daemons**. The README's
17 hook subcommands are dispatched by a *separate* 5,361-line `v3/@claude-flow/cli/src/commands/hooks.ts`
that imports none of this engine — so the "backing engine" is largely a parallel, mostly-unwired
implementation.

## 3. Specialist scorecard

System-level scores synthesize the three slices; per-slice scores differ (the live wiring's D2 is 5,
the engine's is 2 — the system score reflects what is *actually wired and run*). **Dominant
dimensions: D2 (failure posture) and D7 (intervention discipline).**

| # | Dimension | Score | One-line justification (cited) |
|---|-----------|:---:|--------------------------------|
| D1 | Event coverage & wiring | **2** | Each live wiring fires, but 6 manifests disagree on events/matchers/subcommands, one is invalid JSON (`v3/@claude-flow/cli/.claude/settings.json`), the bridge/executor are dead code, ~35 helpers are orphaned, and 12 advertised workers don't exist (`workers/index.ts:338-419`). |
| D2 ⭐ | Failure posture | **4** | Production path is deliberately fail-open: global 5s force-exit-0 (`hook-handler.cjs:97-101`), per-handler try/catch (`:266-271`), `finally(exit 0)`; shim `exit 0` always (`ruflo-hook.sh:33`). Docked: the in-process executor defaults fail-**closed** (`executor:22,144-148`) with no kill switch — saved only by being unwired. |
| D3 | Exit-code & output contract | **3** | Engine CLI is clean (stdout/JSON `hookSpecificOutput`, `exit 2` for stop-check, `guidance-cli:492-495`); but live `pre-bash` blocks via `exit 1` not the documented `exit 2` (`hook-handler.cjs:157`) and `route` emits plain stdout not structured `hookSpecificOutput` (`:129/142`). |
| D4 | Idempotence & state safety | **2** | No atomic writes anywhere — direct `writeFileSync`/`appendFileSync` (`auto-memory-hook.mjs:145`, `session.cjs:51-107`, `intelligence.cjs:224`); double-registered `session-end` (SessionEnd + PreCompact) races `unlinkSync` (`session.cjs:79`); ReasoningBank silently substitutes hash embeddings and reports fake similarity (`reasoningbank:961-1023`). |
| D5 | Performance budget | **3** | `route` runs on **every** prompt (no matcher, `settings.json:70`) doing a MEMORY.md tokenize+Jaccard scan; cold-`npx`-per-fire tax when no local binary (`ruflo-hook.sh:30`). Bounded by file-size caps + timeouts; engine workers are correctly off-hot-path (`workers/index.ts:1021`). |
| D6 ⭐ | Script security | **3** | Canonical `jq`/`xargs -0` pattern is **verified** injection-safe (empirical: `a; rm -rf X && echo PWNED` → single argv, no side effect; `plugin/hooks/hooks.json:16-64`) and engine boundary hygiene is strong (realpath traversal guard, proto-pollution-safe parse). Capped hard: `v3/@claude-flow/mcp/.claude/settings.json:9-119` interpolates `$TOOL_INPUT_*`/`$PROMPT` directly — the vector the package's own note forbids. |
| D7 ⭐ | Intervention discipline | **2** | Several force/steer paths: `route` injects an unseen agent banner + Jaccard memory every prompt (`hook-handler.cjs:135-142` + `intelligence.cjs:194-218`); prompt-type `Stop`/`SubagentStop` can `{"decision":"continue"}` to force more work and `PermissionRequest` blanket-allows MCP tools (`plugin/hooks/hooks.json:164,175,201`); engine hard-`deny`s on regex + injects debunked perf claims into context (`guidance-provider:84-86,151-159`). |
| D8 | Clarity & maintainability | **2** | Mega-dispatcher switching 12 subcommands, ~35 orphaned helpers, six drifted registration files in four dialects, a sprawling multi-subsystem engine whose headline capability lives in a *different* package. A newcomer cannot trace event → script → effect without discovering most of the surface is inert. |

**Overall: ≈2.5/5 — strong-in-parts, broken-as-a-whole.**

### Strengths (real craft, with evidence)

- **Production fail-open is layered and deliberate** — force-exit timer + per-handler try/catch +
  `finally(exit 0)` + `safeRequire` null-guards mean a throwing dispatcher *cannot* block the agent
  (`hook-handler.cjs:12-31, 97-101, 266-288`). The shim mirrors this with `exit 0` + `run(){ "$@" || true; }`.
- **The injection-safe invocation pattern is correct and battle-tested** — the `jq | tr | xargs -0`
  design passes untrusted tool input as a single argv element with no shell re-parse; verified
  empirically, not just claimed (`plugin/hooks/hooks.json:4` note + `:16-64` wiring).
- **Honest, scar-tissue engineering on the live path** — explicit refusal to fall back to `argv`
  because brace-glob expansion created junk files (`hook-handler.cjs:111-122`, cites #1342); size/node
  caps as the *real* guard behind `Promise.race` timeouts that can't interrupt sync work
  (`intelligence.cjs:21-22`); SIGTERM/SIGINT flush before exit (`auto-memory-hook.mjs:43-53`).
- **Engine security hygiene** — TOCTOU-safe `realpath` traversal blocking, `__proto__`-stripping JSON
  parse, injection-safe `execFileSync(shell:false)` for the embedding shell-out (`workers/index.ts:38-87`,
  `reasoningbank:981-984`); the one genuinely-shipped, genuinely-tested behavior is regex secret/dangerous-command blocking (48 tests).

### Weaknesses & risks (what caps the verdict)

- **Registration drift with no source of truth (D1/D8)** — six manifests, four dialects, disagreeing
  on events/matchers/subcommands; `_security_note` byte-stripped on copy (`.claude-plugin/hooks/hooks.json:2`);
  one invalid-JSON file. The live daily-driver (Node dispatcher, **PostToolUse** `post-edit`) and the
  shipped plugin (`jq`/`xargs`, **PreToolUse** `pre-edit`) are two non-equivalent stacks with different
  security postures *and* different edit-event timing.
- **Self-contradicted security guarantee (D6 ⭐)** — the advertised injection safety is violated by a
  shipped sibling (`v3/@claude-flow/mcp/.claude/settings.json`).
- **Latent fail-closed engine (D2 ⭐)** — `executor` defaults `continueOnError:false`, abort→`block`,
  no `CLAUDE_FLOW_HOOKS_ENABLED` honored in `src/`. Dormant today; a hazard the moment it's wired.
- **Non-atomic, sometimes-lying state (D4)** — last-writer-wins writes, a racing double-`session-end`,
  and a degraded ReasoningBank mode that presents meaningless hash-similarity as real `% match`.
- **Unseen steering + false context (D7 ⭐)** — routing banner + Jaccard memory injected every prompt;
  debunked HNSW/Flash-Attention numbers injected into the model's context as fact.
- **Claim-vs-ship sprawl (D1)** — "12 workers" → ~11 different ones; "17 hooks" in another package;
  dead bridge/executor exports; stub headline test (`expect(true).toBe(true)`).

### Headline verdict

Ruflo's hook system contains two pieces a careful harness-builder would respect — a production
fail-open posture that genuinely can't brick a session, and a verified injection-safe invocation
pattern — embedded in a subsystem that has **no single source of truth, ships capability it doesn't
have, and steers the model in ways the user never sees.** The dominant dimensions split: D2 is the
bright spot but only because the fail-closed component is dormant; D7 is a uniform weakness. What caps
the subsystem to the strong-in-parts/broken-as-a-whole band is not one fatal flaw but a *distributed*
one — the same "encoded N×, routed 0×, philosophy-over-wiring" pattern this harness exhibits in its
discovery and planning domains, here expressed as registration drift. The lesson to carry, not the
code: a hook system is only as trustworthy as its single authoritative registration, its fail-open
default, and its discipline to inform rather than inject.
