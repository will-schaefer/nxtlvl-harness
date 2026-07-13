# Modes and prompt shapes

## consult

**Goal:** second opinion from another model on a prepared prompt.

Prompt file should contain everything the callee needs (no shared chat context). For doubt handoff:

```text
Adversarial review. Find what is wrong with this artifact.
… (full framing from doubt-driven-development Step 3) …

ARTIFACT:
…

CONTRACT:
…
```

Optional: demand JSON matching `reviewer-output.schema.json` (inline fields; raw JSON, no fence).

## adversarial

Same transport as consult (read-only). Prefer a stronger “break confidence / challenge design” framing when not using doubt’s schema — e.g. OpenAI-style attack surface (auth, data loss, races, rollback) without copying their plugin wholesale.

When the user wants **git-scoped** adversarial review on Codex with compose available, prefer OpenAI `adversarial-review` (see [openai-compose.md](openai-compose.md)).

## review

Git-scoped code review of working tree or branch.

- **Codex + compose:** `codex-companion.mjs review --wait` (optional `--base <ref>`).
- **Portable / other targets:** host or companion builds a prompt that includes `git diff` / status summary + “review this change; findings first by severity; no edits.”

## task

Implementation or deep debug handoff.

- Requires explicit user authorization.
- Companion requires `--write` to drop read-only sandbox.
- Prefer one clear task per run; state done-when and verification expectations in the prompt.

## setup

No model task — report:

- binary path / version
- chosen transport (compose vs portable)
- known caveats (e.g. Gemini free tier)
- exit 0 if binary present; non-zero if missing

## Prompt assembly checklist

1. One clear job per call.
2. Output contract (prose sections or JSON schema fields).
3. Read-only / no-edit constraint in the **prompt text** as well as CLI flags.
4. Strip host reasoning and CLAIM when the caller is doubt-driven.
5. Never put secrets in the prompt file if logs are retained.
