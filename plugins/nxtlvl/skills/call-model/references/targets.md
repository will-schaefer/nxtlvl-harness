# Target adapters

Verified against common installs (Codex 0.144.x, Grok 0.2.x, Gemini 0.49.x, Devin 3000.x). Flags drift — prefer the companion script; treat this table as the portable fallback contract.

## Matrix

| Target | Detect | Setup / version | Read-only consult | Write task |
|---|---|---|---|---|
| **codex** | `which codex` | `codex --version`; optional `codex doctor` | Compose: `node codex-companion.mjs task …` without write; Portable: `codex exec --sandbox read-only -C <cwd> - < prompt` | `codex exec --sandbox workspace-write` or companion `task --write` |
| **grok** | `which grok` | `grok --version` | `grok --prompt-file <f> --cwd <cwd> --sandbox read-only --no-subagents --disable-web-search` | Drop `--sandbox read-only` only with user auth; prefer still denying network via `--disable-web-search` unless needed |
| **gemini** | `which gemini` | `gemini --version` is **not** enough (free tier can still error on real prompts) | `gemini --approval-mode plan -p "" < prompt` | Avoid for task unless user insists; `--approval-mode auto_edit` / yolo is write-capable |
| **devin** | `which devin` | `devin version` | `devin -p --prompt-file <f> --permission-mode auto` (auto ≈ auto-approve read-only tools) | `--permission-mode accept-edits` or higher only with auth |
| **claude** | `which claude` | `claude --version` | `claude -p "" --disallowedTools Write Edit NotebookEdit Bash < prompt` (cwd via `cd`) | Not default; use normal Claude session |

## Codex transport order

1. If `CODEX_COMPANION=0` → portable exec only.
2. Else if `CODEX_COMPANION_PATH` or discovered companion exists → OpenAI companion (see [openai-compose.md](openai-compose.md)).
3. Else → portable `codex exec`.

Companion discovery (in order):

- `$CODEX_COMPANION_PATH`
- `$CLAUDE_PLUGIN_ROOT/../` is wrong — do **not** assume layout
- Common installs:
  - `~/.claude/plugins/cache/openai-codex/codex/*/scripts/codex-companion.mjs` (newest version dir)
  - `~/.claude/plugins/marketplaces/openai-codex/plugins/codex/scripts/codex-companion.mjs`

## Caveats

### Gemini free tier

`gemini --version` can pass while real prompts fail with `IneligibleTierError`. The companion’s `setup --target gemini` should note this; a real smoke is the only proof.

### Grok typed JSON

For doubt-driven handoff, **inline** the reviewer-output schema in the prompt and demand raw JSON. Prefer that over `--json-schema` (historically unreliable on some Grok models).

### Devin permission modes

| Mode | Rough meaning |
|---|---|
| `auto` | Auto-approve read-only tools — default for consult |
| `accept-edits` | Also workspace edits |
| `smart` / `dangerous` | Broader auto-approve — task only, explicit auth |

### Codex non-git cwd

Portable exec may need `--skip-git-repo-check` when `-C` points outside a git root (machine-dependent; pass through if the companion adds `--skip-git-repo-check` for that case).

### Host sandbox vs callee CLI

Parent agent sandboxes (Claude Code network allowlists) may block child CLI API calls. If the child fails with network errors, re-run with parent sandbox disabled for that Bash call — do not weaken the **callee’s** read-only sandbox to “fix” network.
