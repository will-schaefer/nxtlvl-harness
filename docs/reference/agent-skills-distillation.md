# agent-skills — Plugin Distillation

> Distilled 2026-06-19 from a full read of **agent-skills** v1.0.0
> (`~/.claude/plugins/cache/addy-agent-skills/agent-skills/a5f0b176381e/skills/`, 24 skills).
> Every `SKILL.md` was read in full plus support files (references/, scripts/, examples). **Purpose:**
> a standalone adopt/adapt/reject reference for the nxtlvl build, so harness-component decisions cite
> this instead of re-reading the plugin. Companion to the per-plugin
> [superpowers-distillation.md](superpowers-distillation.md), the head-to-head
> [agent-skills-vs-superpowers-domain-map.md](agent-skills-vs-superpowers-domain-map.md), and the
> **ecc** distillations ([ecc-main-map.md](ecc-main-map.md),
> [ecc-agent-vs-skill-scoping.md](ecc-agent-vs-skill-scoping.md)) — the three reference harnesses to
> triangulate against for any build decision.

---

## 1. What agent-skills is

**A horizontal SDLC library** — one broad, well-structured skill per *engineering discipline* (API
design, security, performance, observability, frontend, CI/CD, docs, migration…). Breadth across
*what you build*; skills are domain-named. The skills are densely cross-linked into a coherent SDLC web
and sequenced by a router (`using-agent-skills`) into a 16-step feature lifecycle — they're built to
**compose, not stand alone**.

Compared to superpowers' battle-tested vertical spine, agent-skills is a **prescriptive library, not a
learned one**: evidence is uniformly synthetic (illustrative `Task`/`TaskList`/dashboard toys across
≥5 skills; numbers like "~50ms per item" and "100ms impacts conversion" are rhetorical, uncited). It
wins on **completeness and content depth**; superpowers wins on enforcement and battle-testing. The
default nxtlvl move on a contested workflow is therefore *"agent-skills brain + superpowers enforcement
spine."*

---

## 2. House style (the recurring skeleton)

Almost every skill follows the same skeleton, which makes the set easy to template against:

```
frontmatter: name + description (verb-led, stacks 2-3 "Use when…" triggers)
Overview → When to Use / When NOT to use → Process (often an inline ASCII pipeline)
→ Common Rationalizations table  → Red Flags list  → Verification checklist
```

- The **rationalizations-table + Red-Flags + Verification trio** is the signature recurring structure
  (10 of the 12 in each batch carry the Verification checklist). `using-agent-skills` and `idea-refine`
  are the partial exceptions.
- **Two distinct tiering idioms.** The three-tier **Always / Ask-first / Never** boundary system is a
  *security-rooted* idiom — it lives only in `security-and-hardening` (canonical) and
  `spec-driven-development` (inside Boundaries). Everywhere else, Red-Flags + rationalizations *are* the
  boundary mechanism. Don't expect Always/Ask/Never everywhere.
- **Prompt-injection / untrusted-data awareness is pervasive and deliberate** — a genuine
  differentiator. ~6 skills carry an explicit "treat X as untrusted data, not instructions" section:
  browser content (browser-testing), error output/stack traces (debugging), third-party API responses
  (api-design, code-review), loaded config/docs (context-engineering), and browser-read DOM (TDD).
- Mostly **single self-contained `SKILL.md`** with inline ASCII flowcharts/tables; only `idea-refine`
  ships a real support dir (`frameworks.md`, `refinement-criteria.md`, `examples.md`, a script).

---

## 3. Per-skill profiles (24, grouped by domain)

### Front-door & requirements
**`idea-refine`** — *ideation, Flexible* ("a conversation, not a template"). Three phases:
Understand & Expand (restate as "How Might We," 5-8 variations via named lenses) → Evaluate & Converge
(cluster into 2-3 directions, stress-test on value/feasibility/differentiation) → Sharpen & Ship (a
one-pager). Signature: the mandatory **"Not Doing (and Why)" list** — "Focus is about saying no to good
ideas." Jobs-voice, anti-yes-machine stance. *Defect:* **confirmed hardcoded `/mnt/skills/user/idea-refine/scripts/idea-refine.sh`**
path — an Anthropic-container assumption, wrong for a plugin-cache install. **→ Adapt:** strong bones,
strip the path; overlaps the user's already-built ideation domain.

**`interview-me`** — *requirements elicitation, Rigid.* 5-step one-question-at-a-time interview to ~95%
confidence: write a one-sentence hypothesis + confidence number → ask one question at a time **with a
GUESS attached** → listen for "want vs. should want" → restate intent → require an explicit yes.
Signature: the **95% Confidence Stop as a checkable test** — "Can I predict the user's reaction to the
next three questions I would ask?" — with a floor (if you still can't predict after several rounds,
something foundational is missing). Self-aware "Loading Constraints" forbid invoking in CI/`/loop`.
**→ Adapt:** closest analog to the user's `/interview-me`→`/grill-me`; mine the confidence-number +
3-question-prediction stop.

**`spec-driven-development`** — *spec, Rigid/gated.* Four gated phases SPECIFY→PLAN→TASKS→IMPLEMENT
("do not advance until validated"). Six-area spec (Objective / Commands / Structure / Style / Testing /
Boundaries). Signature: **"reframe instructions as success criteria"** ("make the dashboard faster" →
"LCP < 2.5s on 4G… are these the right targets?") + the **"ASSUMPTIONS I'M MAKING → correct me now or
I'll proceed"** block. Carries the three-tier Always/Ask/Never inside Boundaries. **→ Adapt:** integrate
the reframe + assumption-surfacing into the user's existing `/spec` step.

### Planning & execution
**`planning-and-task-breakdown`** — *planning, Flexible→semi-rigid (human gate).* Plan mode → dependency
graph → vertical slicing → fixed task template (Description / Acceptance / Verification / Dependencies /
Files / Scope) → order with checkpoints every 2-3 tasks, high-risk early. Signature: **XS→XL sizing
table** ("XL = too large — break it down") + "if you write 'and' in the task title, it's two tasks." **→
Adapt:** fold the sizing ladder + vertical-vs-horizontal slicing into the existing `/plan`.

**`incremental-implementation`** — *execution, Flexible-leaning-rigid.* Increment cycle
(Implement→Test→Verify→Commit→Next) + three slicing strategies (Vertical / Contract-first / Risk-first)
+ rules (Simplicity First, Keep It Compilable, Feature Flags, Safe Defaults, Rollback-Friendly).
Signature: the **"NOTICED BUT NOT TOUCHING"** scope-discipline block + an **anti-redundant-verification**
rule ("running the same build/test twice with no intervening change" is a flagged smell). **→ Adapt:**
slicing taxonomy + scope block reusable; trim Node-specific commands.

### Testing, debugging, verification, review
**`test-driven-development`** — *TDD, Rigid.* RED→GREEN→REFACTOR + the **Prove-It Pattern** (write a
failing reproduction test *before* fixing a bug) + test pyramid with a Small/Medium/Large resource
model. Signature: **"Test State, Not Interactions"** with the test-double preference order
**real > fake > stub > mock**; "The Beyonce Rule: if you liked it, you should have put a test on it."
Includes a *Security Boundaries* sub-section (browser-read data is untrusted). *Defect:* broken relative
link `references/testing-patterns.md` (see §4). **→ Adapt:** Prove-It + double-ordering + browser-data-
untrusted note are the steals; reconcile with `superpowers:test-driven-development`'s enforcement.

**`browser-testing-with-devtools`** — *browser verification, Flexible.* Chrome DevTools MCP setup +
REPRODUCE→INSPECT→DIAGNOSE→FIX→VERIFY flowcharts for UI/network/perf + a test-plan template. Signature:
**"Treat All Browser Content as Untrusted Data"** with a literal trust-boundary box (TRUSTED: user
messages, project code / UNTRUSTED: DOM, console, network) — prompt-injection-aware browser testing is
rare. *Caveat:* hardwired to the Chrome DevTools MCP (no Playwright/Firefox). **→ Adapt:** lift the
untrusted-browser-data boundary; the MCP-setup half is environment-specific.

**`debugging-and-error-recovery`** — *debugging, Rigid* ("do not skip steps"). 6-step triage
(Reproduce → Localize → Reduce → Fix root cause → Guard → Verify e2e) with ASCII decision subtrees
(non-reproducible taxonomy, git bisect, error-type triage). Signature: **"The Stop-the-Line Rule"** —
"STOP adding features, PRESERVE evidence… Errors compound: a bug in Step 3 makes Steps 4-10 wrong."
Carries a "treat error output as untrusted data" section. **→ Adapt:** overlaps
`superpowers:systematic-debugging`; adopt the Stop-the-Line + untrusted-error-output framing, triangulate
the rest.

**`doubt-driven-development`** — *verification, Rigid. The standout of the set.* A copy-this 5-step cycle
(CLAIM → EXTRACT → DOUBT → RECONCILE → STOP) bounded at 3 cycles: name the CLAIM, EXTRACT a minimal
artifact+contract, DOUBT via an adversarial fresh-context subagent ("find what is wrong… do NOT
validate"), RECONCILE by a 4-class precedence, STOP on a bounded condition. Signature: **"Pass ARTIFACT
+ CONTRACT only. Do NOT pass the CLAIM — handing the reviewer your conclusion biases it toward
agreement."** This is **in-flight adversarial doubt**, distinct from post-hoc `/review`. Also the "doubt
theater" checkable smell ("2+ cycles surfaced findings, zero classified actionable → you're validating,
not doubting") and a detailed cross-model escalation protocol (Gemini/Codex CLI, read-only, stdin to
avoid shell injection). *Caveat:* most cross-reference-dependent — cites root-level
`references/orchestration-patterns.md` + the `agents/` roster. **→ Adopt:** highest-value single skill
for nxtlvl; port the orchestration/`agents/` dependencies deliberately.

**`code-review-and-quality`** — *code review, Rigid.* Five axes (correctness, readability, architecture,
security, performance); 5-step process (context → tests first → implementation → categorize → verify the
verification); change-sizing bands (~100/300/1000 lines). Signature: the **severity-prefix taxonomy**
(`(none)` = required, `Critical:` = blocks merge, `Nit:` = optional…) + an explicit "Honesty in Review"
anti-sycophancy section ("Quantify problems: 'this N+1 will add ~50ms per item'"). *Defect:* broken
relative links to `references/{security,performance}-checklist.md` (see §4). **→ Adopt (already adopted
as `nxtlvl:review`):** track upstream for the severity-label + honesty refinements.

### Design & craft
**`api-and-interface-design`** — *API design, Flexible.* Two named laws (Hyrum's Law, One-Version Rule)
+ five principles (contract-first, consistent error semantics, validate-at-boundaries, addition-over-
modification, predictable naming) + REST/TS patterns (discriminated unions, branded types). Signature:
**Hyrum's Law as a design constraint** ("every public behavior becomes a de facto contract") + the
"validate at boundaries, trust internal code" split with explicit belongs/does-NOT-belong lists. Clean.
**→ Adopt:** harness-agnostic, high-value, no rework needed.

**`frontend-ui-engineering`** — *frontend, Flexible.* Component architecture, a state-management decision
ladder (local→lifted→context→URL→server→global), WCAG 2.1 AA, mobile-first, loading/optimistic patterns.
Signature: the **"Avoid the AI Aesthetic" table** — names the AI-generated tell (purple/indigo
everything, excessive gradients, rounded-2xl, generic heroes, oversized padding) with *why each is a
problem* + the production alternative. *Defect:* broken relative link `references/accessibility-checklist.md`;
React+Tailwind monoculture. **→ Adapt:** lift the AI-aesthetic table verbatim; triangulate the rest
against ecc's frontend skills.

**`code-simplification`** — *refactoring, Flexible (invariant: preserve behavior, test after each
change).* Chesterton's-Fence entry gate ("answer *why* the code exists — incl. `git blame` — before
touching it"), pattern-spotting tables, per-language before/after. Signature: **the Rule of 500**
("refactors >500 lines → use codemods/AST transforms, not hand edits") + over-simplification traps.
**→ Adapt:** overlaps native `/simplify` + ecc `code-simplifier`; mine Chesterton's Fence + Rule-of-500
as additions.

### Cross-cutting production concerns
**`security-and-hardening`** — *security, Rigid boundaries / Flexible patterns. The strongest single
skill to mine.* Threat-model first (map trust boundaries **including LLM output**, STRIDE, abuse cases)
→ the canonical **three-tier Always/Ask-first/Never** system → OWASP Top 10 recipes → Zod validation →
npm-audit triage → secrets → an LLM-security section. **SSRF coverage is standout** — allowlist
scheme+host, reject any resolved private/reserved IP via `ipaddr.js` (covers `169.254.169.254` cloud
metadata), `redirect: 'error'`, *and* a candid TOCTOU/DNS-rebinding caveat with a pinned-IP mitigation.
**OWASP LLM Top 10 (2025) mapped explicitly** (LLM01 prompt injection, LLM02/07 secret leakage, LLM05
output handling, LLM06 excessive agency, LLM08 vector/embedding, LLM10 unbounded consumption) — "the
system prompt is not a security boundary." *Defect:* broken relative links to root-level
`references/security-checklist.md`. **→ Adopt:** exactly the agent-relevant security content nxtlvl
wants; only fix the checklist path.

**`observability-and-instrumentation`** — *observability, Flexible.* Define "working" as 2-4 on-call
questions *before* instrumenting → signal-per-question (log/metric/trace) → structured logging with
correlation IDs → RED metrics + cardinality limits → OpenTelemetry tracing → symptom-based alerting →
verify the telemetry by inducing failures in staging. Signature: **"telemetry without a question is
noise"** + the division of labor ("metrics tell you *that*, traces *where*, logs *why*"). Clean,
vendor-neutral. **→ Adopt:** the "on-call questions first" discipline + cardinality rules port directly
to nxtlvl's own hook/telemetry work.

**`performance-optimization`** — *performance, Flexible (measure-first).* CWV targets → measure (synthetic
vs RUM) → a symptom→cause decision tree → bottleneck tables → fix recipes (N+1, unbounded fetch, images,
React re-renders, bundle splitting, caching) → a CI perf budget. Signature: the **"What is slow?" ASCII
decision tree** + "if you didn't measure, you don't know"; nuance: *over*-using `React.memo`/`useMemo`
is also a Red Flag. *Defect:* broken relative link `references/performance-checklist.md`; web/JS-centric.
**→ Adapt:** lift the symptom→measurement tree; fix the link, broaden beyond web.

**`ci-cd-and-automation`** — *CI/CD, Rigid gates / Flexible templates.* Fixed quality-gate pipeline
(lint→type→unit→build→integration→e2e→audit→bundle) + copy-paste GitHub Actions YAML + a "feed CI
failures back to the agent" loop + deployment patterns. Signature: the **agent-feedback loop** ("copy the
failure output → feed it to the agent: 'fix and verify locally before pushing again'") + the cultural
rules Shift-Left, Faster-is-Safer, **Build Cop**. *Caveat:* entirely GitHub Actions + npm/Node. **→
Adapt:** the feed-failures-back loop + Build Cop are reusable; the YAML is too ecosystem-specific.

**`shipping-and-launch`** — *release, Rigid-leaning.* Six-section pre-launch checklist + feature-flag
lifecycle + staged rollout (staging→prod-off→team→5%→25/50/100%). Signature: the **Rollout Decision
Thresholds table** — quantified advance/hold/rollback gates (error rate >2× baseline = roll back) +
"every deployment needs a rollback plan *before* it happens." *Defects:* three broken relative
`references/*` links; a factual nit (`npx prisma migrate rollback` isn't a real command). **→ Adapt:**
threshold table + rollback-before-deploy reusable; much of the checklist is out of scope for a personal
harness.

**`deprecation-and-migration`** — *migration, Flexible.* "Code is a liability, not an asset" → 5-question
deprecation checklist → Advisory vs Compulsory (default advisory) → 4-step migration → Strangler /
Adapter / Feature-Flag patterns → a "Zombie Code" diagnosis. Signature: **the Churn Rule** ("if you own
the infrastructure being deprecated, you are responsible for migrating your users") + the zombie-code
concept ("cannot stay in limbo"). Clean. **→ Adapt:** no current nxtlvl equivalent; lift the principles,
drop the toy TS.

### Knowledge, context & docs
**`source-driven-development`** — *anti-hallucination, Rigid.* DETECT→FETCH→IMPLEMENT→CITE: detect exact
versions → fetch the *specific* doc page → implement documented signatures → cite every framework-
specific decision with full deep-linked URLs. Signature: the **source-authority hierarchy** (official
docs > official blog > web standards > compat data; Stack Overflow / blogs / *your own training data*
"never cite as primary") + the mandated **`UNVERIFIED:` flag** ("honesty about what you couldn't verify
is more valuable than false confidence"). Platform-clean. **→ Adopt:** exactly the anti-hallucination
guardrails an agent harness benefits from.

**`context-engineering`** — *context/token mgmt, Flexible.* A 5-level context hierarchy (rules → spec/arch
→ source → error output → history) + CLAUDE.md template + cross-tool equivalents + packing strategies +
a "Confusion Management" section. Signature: the named anti-patterns **"context starvation" vs "context
flooding"** with a quantified threshold ("aim for <2,000 lines of focused context per task";
"context window size ≠ attention budget") + a three-tier trust model for loaded files. **→ Adapt:**
directly relevant to nxtlvl's C&M subsystem; fold the attention-budget rule + trust model in (nxtlvl
already has deeper machinery).

**`documentation-and-adrs`** — *docs/ADRs, Flexible.* When-to-write + ADR template + lifecycle
(PROPOSED→ACCEPTED→SUPERSEDED, "don't delete old ADRs") + inline/why-not-what + API/README/changelog +
a "Documentation for Agents" section. Signature: the why-vs-what doctrine + keep-superseded-ADRs.
*Divergence:* uses `## Status`/`## Date` headings + `docs/decisions/` — which the user's global decision
rule **overrides** with YAML frontmatter. **→ Adapt (already adapted as `nxtlvl:documentation-and-adrs`):**
useful only as the upstream baseline to diff against.

**`git-workflow-and-versioning`** — *git, Flexible (commit discipline is the rigid core).* Trunk-based
default + five commit principles + branch naming + worktrees-for-parallel-agents + Save-Point pattern +
pre-commit hygiene (secret-grep). Signature: the **"Change Summaries" template** (CHANGES MADE / THINGS
I DIDN'T TOUCH (intentionally) / POTENTIAL CONCERNS) — "the DIDN'T-TOUCH section shows you exercised
scope discipline" + the Save-Point pattern (`git reset --hard HEAD` as the agent's undo). **→ Adapt:**
Change-Summaries + Save-Point are agent-grade steals; ⚠️ reconcile the trunk-based/commit-often dogma
with the Developer-repo's epitaxy + commit-to-main workflow.

### Meta / router
**`using-agent-skills`** — *meta/router, Rigid governance.* A skill-discovery decision tree
(task→skill), six always-on **Core Operating Behaviors** (Surface Assumptions, Manage Confusion, Push
Back, Enforce Simplicity, Maintain Scope Discipline, Verify Don't Assume), a failure-modes list, and a
16-step feature lifecycle. Signature: the lifecycle + discovery tree turn ~24 standalone skills into one
ordered SDLC spine; the six behaviors are the reusable doctrine ("Sycophancy is a failure mode"; "if you
build 1000 lines and 100 would suffice, you have failed"). *Caveat:* the router presumes the **whole**
library, and (per the user's known finding) won't auto-fire from frontmatter. **→ Adapt:** lift the six
Core Operating Behaviors + the lifecycle *idea*, not the literal routing tree.

---

## 4. Defects to fix on adoption

- **The `references/` path bug is systemic** (corrects the domain map's "files do not exist"): the
  referenced checklists **do exist — at the plugin root** (`<root>/references/{security,performance,
  accessibility}-checklist.md`, `orchestration-patterns.md`) and the `agents/` roster — but the SKILL.md
  links use bare relative paths (`references/foo.md`) that resolve to `skills/<name>/references/foo.md`,
  where they **don't** exist. So they're *broken-on-resolution*, not missing. Affected:
  `code-review-and-quality`, `frontend-ui-engineering`, `performance-optimization`, `security-and-hardening`,
  `shipping-and-launch`, `test-driven-development`, `doubt-driven-development`. **Any skill lifted out of
  the tree orphans its support content** — re-path on adopt.
- **`idea-refine` hardcodes** `/mnt/skills/user/idea-refine/scripts/idea-refine.sh` (Anthropic-container
  path; wrong for a plugin-cache install).
- **`shipping-and-launch`** cites `npx prisma migrate rollback` — not a real Prisma command.
- **Evidence is uniformly synthetic** — no dated real sessions or measured outcomes; treat numbers as
  rhetorical.
- **Web/Node/TypeScript monoculture** — Express, React, Prisma, Zod, npm, Lighthouse throughout. The
  *principles* generalize; a Python/Rust target must translate. `source-driven-development` is the most
  stack-agnostic; `performance`/`shipping`/`security` the most web-bound.

---

## 5. Adopt / adapt / reject for nxtlvl

- **Adopt wholesale** (no superpowers equivalent; the SDLC discipline layer): `security-and-hardening`
  (SSRF + OWASP-LLM-Top-10 — top pick), `source-driven-development` (anti-hallucination),
  `observability-and-instrumentation`, `api-and-interface-design`, `doubt-driven-development` (in-flight
  adversarial doubt — port its `agents/` deps deliberately). (`code-review-and-quality` already vendored
  as `nxtlvl:review`.)
- **Adapt / harvest the signature device:** the "Avoid the AI Aesthetic" table (frontend), the symptom→
  measurement tree (performance), Chesterton's Fence + Rule-of-500 (simplification), the Churn Rule
  (deprecation), Change-Summaries + Save-Point (git), the <2,000-line attention budget + trust model
  (context-engineering), the XS→XL sizing ladder (planning), the Prove-It pattern + double-ordering (TDD),
  the six Core Operating Behaviors (router).
- **Already adapted (diff upstream only):** `documentation-and-adrs` → `nxtlvl:documentation-and-adrs`;
  `code-review-and-quality` → `nxtlvl:review`.
- **Reconcile before adopting:** git commit-cadence dogma vs the epitaxy automation; the router's
  whole-library assumption + frontmatter-doesn't-fire reality.
- **Reject / fix-on-adopt:** the systemic `references/` path bug; `idea-refine`'s `/mnt/...` path; the
  web/Node monoculture where nxtlvl targets other stacks.

**Each contested overlap with superpowers is an ADR-worthy boundary decision** — see the
[domain map](agent-skills-vs-superpowers-domain-map.md) §3 for the 9 head-to-head verdicts.

---

## 6. Method note

Scanned via `superpowers:dispatching-parallel-agents` — two read-only scanners profiled the 24 skills
(12 each) to a uniform schema (purpose / type / mechanism / signature technique / structure / evidence /
defects / nxtlvl call), keeping the heavy reading in subagent context. The standing rule: **triangulate
harness-build decisions across superpowers, agent-skills, and ecc** before deciding.
