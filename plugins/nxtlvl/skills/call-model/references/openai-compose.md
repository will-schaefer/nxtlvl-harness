# Composing OpenAI `codex@openai-codex`

The official Claude Code plugin ([openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc)) is the **preferred Codex transport on Claude Code** when installed. nxtlvl does **not** vendor app-server, broker, or job control — it shells into their companion.

## When to compose

| Condition | Transport |
|---|---|
| Claude Code session + companion file found + `CODEX_COMPANION` not `0` | OpenAI companion |
| Any other host, or companion missing, or `CODEX_COMPANION=0` | Portable `codex exec` |

## Companion subcommands we use

| call-model mode | Companion invocation |
|---|---|
| `setup` | `node codex-companion.mjs setup` (plus local `codex` PATH check) |
| `review` | `node codex-companion.mjs review --wait [args]` |
| `adversarial` | Prefer portable prompt via `task` read-only **or** `adversarial-review --wait` when focus/base flags match; default consult/adversarial with a prompt file uses portable `codex exec` for a single controlled prompt |
| `consult` | Portable `codex exec --sandbox read-only` with prompt file (companion `task` without `--write` is alternative when no prompt-file contract is needed) |
| `task` | `node codex-companion.mjs task [--write] …` when compose available; else `codex exec` with sandbox matching write flag |

## Discovery

See [targets.md](targets.md). Set `CODEX_COMPANION_PATH` to pin a version.

Example (cache install):

```bash
COMPANION="$HOME/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs"
node "$COMPANION" setup
node "$COMPANION" review --wait --base main
```

## What we deliberately do not reimplement

- App-server JSON-RPC client / broker lifecycle
- `/codex:status` · `result` · `cancel` job UX (use the OpenAI plugin commands directly)
- `/codex:transfer` session import
- Stop-review-gate hooks

## Host discipline when using OpenAI commands

If the host invokes `/codex:review` or `/codex:adversarial-review` **directly** (instead of call-model):

- Return companion stdout **verbatim** when the OpenAI command says so
- Do not auto-fix findings
- Use `--wait` / `--background` per their command files

call-model’s job is the **portable multi-target** path; OpenAI slash commands remain valid Claude-only shortcuts for Codex-only workflows.
