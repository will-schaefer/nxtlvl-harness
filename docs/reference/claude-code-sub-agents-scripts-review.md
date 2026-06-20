# claude-code-sub-agents — scripts review

> **claude-code-sub-agents — scripts review.** No script layer exists to audit — this is a pure markdown subagent library (33 agent `.md` files), not a tooled harness. Analyzed 2026-06-20 · 8.0M · source: local vendored. Scope: scripts (POOR TARGET — see note). Method: inventory confirmation → honest characterization.

## 1. Spine — the headline judgment

**There is no script layer to audit.** An exhaustive inventory for every executable form turned up nothing:

- `*.sh *.py *.mjs *.cjs *.js *.ts *.rb *.go *.rs *.pl` → **0 files**
- `package.json` (npm `scripts` block) → **none**
- `Makefile` / `Dockerfile` / `*.toml` / `*.yml` / `*.yaml` → **none**
- files with the executable bit (`find -perm +111`) → **none**
- shebangs (`#!/…`) inside any markdown code fence → **0 matches**

The repo is **40 files total, all markdown or images**: 33 agent definitions under `agents/`, plus `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `LICENSE`, `.gitignore`, and an `_images/` screenshot folder. This is the explicit poor-target case for a scripts audit — the 7-dimension scripts rubric (input contract, deterministic output, observation quality, error/exit-code contract, side-effect safety, portability, cohesion) **has nothing to bind to**, so no scorecard is emitted.

## 2. What's there & how it works

The repo is a **flat, prose-only Claude Code subagent collection** — "33 specialized AI subagents … designed to enhance development workflows" (`README.md:3`). Mechanically it relies entirely on Claude Code's **native agent auto-discovery**: each `agents/<category>/<name>.md` is a system-prompt definition Claude Code loads and routes to by context; there is no installer, no build step, no runtime, and no glue code. "Intelligent Auto-Delegation: Claude Code automatically selects optimal agents based on task context" (`README.md`) — the orchestration the README advertises is the *platform's*, not code shipped here.

Structure (cited from disk):

- `agents/` is bucketed into 8 category dirs — `business/ data-ai/ development/ infrastructure/ quality-testing/ security/ specialization/` plus a top-level `agent-organizer.md` (`ls -R agents`).
- The largest bucket is `development/` (14 agents: `python-pro.md`, `golang-pro.md`, `typescript-pro.md`, `react-pro.md`, `nextjs-pro.md`, `backend-architect.md`, etc.); `data-ai/` carries 8 (`ai-engineer`, `ml-engineer`, `postgres-pro`, `prompt-engineer`, …).
- The README itself notes "33 specialized AI subagents" while the tree holds 33 agent `.md`s under `agents/` — count is internally consistent; one filename is misspelled on disk (`development/electorn-pro.md`), a content/hygiene nit that belongs to an **agents** review, not scripts.

All "logic" is natural-language instruction inside these prompt files. There is no executable surface — no hook scripts, no validation harness, no CI workflow, no helper CLI — so nothing here exercises an input contract, emits structured output, sets exit codes, or has side effects to make idempotent.

## 3. Verdict

**No scripts → no score.** A scripts audit measures how a repo's *executable code* behaves: how it parses input, what it emits, how it signals failure, whether it's safe to re-run. claude-code-sub-agents ships **none of that machinery** — it is a markdown library whose entire value lives in **agent prompt design**: the wording, scoping, tool grants, and routing descriptions inside 33 `.md` files. That quality is real but is **out of scope for a scripts review** — it is exactly what a Mode-C *agents* review would score (frontmatter/tools discipline, prompt depth, routing-description quality, the flat-no-router structure, the `electorn-pro` typo). For the scripts domain specifically, the honest finding is a clean negative: **there is no script layer, so there is nothing to adopt, adapt, or reject.** No ADR; no backlog rows; the contrast it offers ("a useful CC contribution can be 100% prompt-markdown with zero code") merely re-confirms that scripts are optional scaffolding, not the substance of a subagent collection.
