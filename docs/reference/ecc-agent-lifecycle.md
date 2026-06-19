# ECC's Agent-Development Lifecycle — distilled, phase by phase

> Built incrementally through a gated review of ecc's agent-development lifecycle. Each phase
> distills what ecc *actually* does, then links to the `nxtlvl` decision (ADR) it produced.
> Companion to [`ecc-agent-vs-skill-scoping.md`](ecc-agent-vs-skill-scoping.md). The decisions
> live in [`../decisions/`](../decisions/); this doc is the *source distillation* behind them.
> This review covers ecc; the same adopt/adapt/reject method is the template for reviewing other
> harnesses later (see the build method in [`../intent/personal-harness.md`](../intent/personal-harness.md)).

The six phases: **Design → Author → Evaluate → Debug → Orchestrate → Operate.**

| # | Phase | Status | Decision |
|---|-------|--------|----------|
| 1 | Design | ✅ reviewed | [ADR-012](../decisions/ADR-012-agent-design-contract.md) |
| 2 | Author | ✅ reviewed | [ADR-013](../decisions/ADR-013-agent-authoring-method.md) |
| 3 | Evaluate | ⏳ pending | — |
| 4 | Debug | ⏳ pending | — |
| 5 | Orchestrate | ⏳ pending | — |
| 6 | Operate | ⏳ pending | — |

---

## Phase 1 — Design

**What "design" means in ecc:** the shape of an agent *before* it is authored — its definition
contract, its action/observation surface, and how the install is scoped to a repo.

**Sources read:**
- `reference/ECC-main/skills/agent-harness-construction/SKILL.md:12-74`
- `reference/ECC-main/skills/agent-sort/SKILL.md:22-49`
- `reference/ECC-main/skills/ecc-guide/SKILL.md:90-95` (surface ordering)
- Agent anatomy across `reference/ECC-main/agents/*.md` (frontmatter + body)

### ecc's doctrine
1. **The agent contract.** Frontmatter `name` / `description` / `tools` / `model` (+ optional
   `color`). Body = prompt-defense baseline → role / "when invoked" loop → rubric / output
   format → a `see skill:` **pointer**, not embedded knowledge. The `tools:` allowlist *is* the
   design: read-only reviewer vs. write-capable resolver is the sandbox.
2. **Harness-construction discipline.** Agent output quality is constrained by action-space,
   observation, recovery, and context-budget quality. Use narrow schema-first tool inputs;
   return a deterministic shape (`status` / `summary` / `next_actions` / `artifacts`); give every
   error path a root-cause hint + safe retry + **stop condition**; budget context by moving
   guidance into on-demand skills and compacting at phase boundaries (not arbitrary token counts).
3. **Evidence-based scoping (`agent-sort`).** Classify every surface as DAILY (load every session,
   matched to the repo's real stack with cited evidence) or LIBRARY (keep reachable, don't load by
   default). LIBRARY ≠ delete. Don't install what the repo can't use.
4. **Surface ordering (`ecc-guide`).** "Prefer skills as the primary workflow surface"; commands
   only as compatibility shims; "mention agents when delegation is useful." Note: ecc is still
   **agent-heavy** (67 agents) — this ordering is skills-over-*commands*, not a discouragement of
   agents.

### Composition of ecc's 67 agents
~35-40 are per-language or per-domain specialists (cpp, csharp, dart, django, fastapi, flutter,
fsharp, go, harmonyos, java, kotlin, php, python, pytorch, react, rust, swift, typescript, vue +
healthcare, marketing, seo, network ×3, homelab, a11y, mle, database). The genuinely cross-cutting
set is smaller (planner, architect, code-reviewer, code-simplifier, security-reviewer,
silent-failure-hunter, tdd-guide, refactor-cleaner, doc-updater, performance-optimizer, …).

### nxtlvl decision → [ADR-012](../decisions/ADR-012-agent-design-contract.md)
- **Operating model:** main session = lean orchestrator delegating to specialist subagents by
  task; specialists are first-class (not a last resort). Dispatch stays native; composition is
  ours.
- **Scope:** roster bounded to the operator's stacks (Next.js/TS, Python, Rust) + cross-cutting
  generals + agent-building; grown reactively via the intake gate; dormant ecc as the fallback
  library. This is `agent-sort`'s evidence logic applied at the *operator* level — but ecc's
  install machinery is **not** adopted (already covered by ADR-002 + ADR-008).
- **Realization test:** native agent + injected skill by default; custom agent only when isolated
  context / restricted tools / a distinct model tier forces it.
- **Adopted wholesale:** the lean agent contract and the harness-construction authoring checklist.

---

## Phase 2 — Author

**What "author" means in ecc:** the method for writing an executor (command/agent) and the skill
it leans on — eval-first, model-routed, with knowledge injected from a caller-agnostic skill.

**Sources read:**
- `reference/ECC-main/skills/agentic-engineering/SKILL.md:12-64`
- `reference/ECC-main/commands/code-review.md`, `reference/ECC-main/commands/build-fix.md`
- `reference/ECC-main/CLAUDE.md` (the skill-injection convention)

### ecc's doctrine
1. **Injection contract.** Knowledge lives in the skill; the executor is lean and receives the
   skill's conventions at spawn ("pass conventions from the skill into the agent's prompt").
   One-way: skill → executor.
2. **agentic-engineering disciplines.** Done-condition first (eval-first); independently-
   verifiable units (the 15-min rule); model routing (haiku=narrow, sonnet=implement,
   opus=architecture/root-cause); escalate a tier only on a clear reasoning-gap failure; compact
   at milestones, not mid-debug; review AI code for invariants/edges/security, not lint-enforced
   style.
3. **Command shape.** Explicit phases → severity table → binary decision rule → deterministic
   output schema, plus stop-and-ask guardrails.

### nxtlvl decision → [ADR-013](../decisions/ADR-013-agent-authoring-method.md)
- **Adopt:** one-way skill→lean-executor injection (the orchestrator injects the skill at
  delegation); done-condition-first; explicit stop-and-ask guardrails; phased structure +
  deterministic output + a binary decision rule.
- **Adapt:** model-routing heuristic (tiers per ADR-012, escalate only on a reasoning-gap); the
  "15-min unit" → agent-sized / independently-verifiable / one-dominant-risk / clear-done-
  condition; compact at phase boundaries + delegate to isolate context.
- **Reject:** ecc's per-task cost ledger (our metric is fallback × quality, ADR-005);
  re-deriving review/dev substance + gh-coupled command internals.
- Formal eval suites deferred to Phase 3.
