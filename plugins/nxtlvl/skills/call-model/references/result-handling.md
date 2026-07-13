# Result handling

Borrowed discipline from OpenAI’s `codex-result-handling` skill and nxtlvl doubt RECONCILE — adapted for multi-target use.

## After consult / adversarial / review

1. **Present** the callee’s output (structured if JSON, else as returned).
2. **Do not** start fixing code automatically — even for “obvious” issues.
3. Ask which findings to act on (or fold into doubt RECONCILE when the caller is doubt-driven).
4. Preserve severity ordering and file:line pointers when present.
5. If the callee marked uncertainty / inference, keep that distinction.

## After task

1. State whether the callee claimed to edit files; list paths if provided.
2. Verify with host-side checks (tests, diff) — do not trust “done” alone.
3. If the run failed or never invoked the CLI, **do not** invent a substitute implementation and pretend it came from the callee.

## Failures

- Include the most actionable stderr lines.
- Point at `setup` / auth (`codex login`, `/codex:setup`, `devin auth`, etc.) when setup is the issue.
- Never silently replace a failed cross-model call with single-model “I reviewed it myself.”

## Doubt-driven RECONCILE

When the caller is `doubt-driven-development`:

- Typed JSON → classify findings with the usual precedence (contract-misread / actionable / trade-off / noise).
- Free-text → extract material issues into the ledger manually; mark provenance as `cross-model:<target>`.
