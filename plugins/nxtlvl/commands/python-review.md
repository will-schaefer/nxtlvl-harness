---
description: nxtlvl Python review — spawns the read-only python-reviewer agent on the current diff (or named files) and returns a PASS/WARNING/BLOCK verdict. Use for a Python-specific review pass.
argument-hint: "[files or scope, optional]"
---

# /nxtlvl:python-review

Thin entry point — this command **delegates**, it holds no review logic of its own.

1. Spawn the **`python-reviewer`** subagent (read-only: it cannot modify files).
2. Pass it the review scope: `$ARGUMENTS` if given, otherwise the current Python diff
   (`git diff -- '*.py'`).
3. Inject the conventions it should apply: **`skill: nxtlvl:python-patterns`** — subagents do
   not auto-load skills, so pass the conventions into the agent's prompt.
4. Surface its returned verdict and findings.

**What it checks (human-facing summary; the operative rubric lives in the agent):** silent error
swallowing, mutable default args, secrets/injection, broken type contracts (CRITICAL); bare
excepts, missing types, untested behavior, resource leaks (HIGH); idiom/structure nits (MEDIUM).
Framework-specific concerns (Django/FastAPI) and cross-language architecture are deferred to
their own reviewers — this pass is Python-language-only.

$ARGUMENTS
