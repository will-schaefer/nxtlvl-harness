---
name: call-model
description: nxtlvl multi-callee cross-model transport — invoke another coding-agent CLI (Codex, Grok, Gemini, Devin, or Claude headless) for consult, adversarial second opinion, review, or optional task handoff. Use when the host agent needs a different-architecture model, doubt-driven-development offers cross-model escalation, the user asks for a Codex/Grok/Gemini/Devin second opinion, or you must delegate a read-only consult without inventing per-CLI flag recipes.
---

# Call Model (nxtlvl)

Canonical transport for **calling another coding-agent model** from any host (Claude Code, Grok, Devin, Gemini, Antigravity, …). House-owned companion + portable recipes — **inspired by** OpenAI’s `codex@openai-codex` product shape (thin entry, modes, forwarder discipline, read-only default), **not** a port of its app-server.

**Compose, don't reconstruct.** This skill owns *how* to invoke a callee safely. Callers own *when* and *what* (doubt cycle, PR review, user request). Do not restate CLAIM → EXTRACT → RECONCILE → STOP here — that lives in `doubt-driven-development`.

## When to Use

- Cross-model second opinion after single-model review (especially doubt-driven Step 3 escalation)
- User asks to “have Codex / Grok / … look at this”
- Host is stuck or wants a different architecture’s blind spots
- Read-only consult on an ARTIFACT + CONTRACT (or free-form prompt file)

**When NOT to use**

- Same-model in-session Task spawn is enough (`nxtlvl:doubt-reviewer`) — cheaper, prefer it first for single-model doubt
- Mechanical changes with obvious correctness
- Non-interactive / CI unless the user pre-authorized a specific target and command (otherwise **skip and announce**)
- Full multi-phase multi-model feature pipelines (out of scope — not ECC multi-\*)

## Loading Constraints

- **Main-session / orchestrator skill.** Do not put this on a read-only reviewer’s `skills:` frontmatter so it re-invokes itself.
- **Each invocation is its own authorization** in interactive sessions — re-confirm the exact command every run.
- Prefer the **companion script** when Node is available; fall back to portable shell recipes in [references/targets.md](references/targets.md).

## Modes

| Mode | Intent | Write? |
|---|---|---|
| `setup` | Preflight PATH / version / transport detect (no real model spend beyond optional smoke) | — |
| `consult` | Free prompt or ARTIFACT+CONTRACT second opinion | **no** |
| `adversarial` | Challenge design / doubt (same safety as consult; adversarial framing in prompt) | **no** |
| `review` | Git-scoped code review (Codex: compose OpenAI companion when present) | **no** |
| `task` | Implement/debug handoff | **only** with explicit `--write` + user auth |

Details: [references/modes-and-prompts.md](references/modes-and-prompts.md).

## Targets

| Target | Binary | Notes |
|---|---|---|
| `codex` | `codex` | Compose OpenAI `codex-companion.mjs` when found; else `codex exec` |
| `grok` | `grok` | `--prompt-file` + read-only sandbox flags |
| `gemini` | `gemini` | `--approval-mode plan`; free-tier may be auth-dead — fail loud |
| `devin` | `devin` | `-p` / `--prompt-file` + permission mode |
| `claude` | `claude` | Headless `claude -p`; prefer `headless-doubt` for typed doubt |

Full flag matrix and caveats: [references/targets.md](references/targets.md).  
Codex compose path: [references/openai-compose.md](references/openai-compose.md).

## Process

```
call-model:
- [ ] Step 1: CHOOSE — mode + target (user pick, or default policy below)
- [ ] Step 2: PREPARE — write full prompt to a temp file (never shell-interpolate artifact)
- [ ] Step 3: PREFLIGHT — which + setup; interactive: confirm exact command
- [ ] Step 4: INVOKE — companion or portable recipe; read-only unless task --write
- [ ] Step 5: RETURN — stdout to caller; host does not auto-fix review findings
```

### Default target policy (when user does not pin a target)

1. Prefer a callee **≠ host family** (Claude host → codex or grok first).
2. Prefer targets that pass `setup` / PATH check.
3. Deprioritize `gemini` until a real smoke succeeds (version alone is insufficient).
4. Always honor an explicit `--target`.

### Companion (preferred)

From the nxtlvl plugin root (or any host that can run Node):

```bash
# Setup / detect
node "${CLAUDE_PLUGIN_ROOT:-.}/skills/call-model/scripts/call-model.mjs" setup --target codex

# Consult / adversarial (read-only) — prompt file required
node …/call-model.mjs consult --target grok --cwd /path/to/repo --prompt-file /tmp/call-model-prompt.md
node …/call-model.mjs adversarial --target codex --cwd /path/to/repo --prompt-file /tmp/call-model-prompt.md

# Review (Codex prefers OpenAI companion)
node …/call-model.mjs review --target codex --cwd /path/to/repo

# Task (write requires --write)
node …/call-model.mjs task --target codex --cwd /path/to/repo --prompt-file /tmp/task.md --write
```

Env overrides:

| Env | Effect |
|---|---|
| `CODEX_COMPANION=0` | Force Codex portable `exec` (skip OpenAI companion) |
| `CODEX_COMPANION_PATH` | Absolute path to `codex-companion.mjs` |
| `CALL_MODEL_TIMEOUT_MS` | Kill child after N ms (default 600000) |

When the skill is loaded from the installed plugin, resolve the script relative to this skill directory:

```bash
node "$(dirname "$0")/scripts/call-model.mjs" …
# or, from skill path:
node "…/plugins/nxtlvl/skills/call-model/scripts/call-model.mjs" …
```

### House safety rules (all targets)

1. **Temp file / stdin** for prompt bodies — never `cli -p "$(cat artifact)"` with untrusted content.
2. **Read-only default** for consult / adversarial / review.
3. **`--write` only** for `task`, and only after explicit user authorization.
4. **Per-call auth** in interactive sessions.
5. **Non-interactive:** skip unless pre-authorized; announce *"Cross-model skipped: non-interactive context."* (or equivalent).
6. **No silent fallback** to single-model when a chosen CLI fails — surface the error and offer alternatives.
7. **Forwarder discipline** after review/consult: present findings; **do not** auto-apply fixes. See [references/result-handling.md](references/result-handling.md).

### Doubt-driven integration

After single-model DOUBT, before RECONCILE:

1. Offer cross-model (list available targets from `setup` or PATH).
2. On pick: write ARTIFACT + CONTRACT + adversarial framing (+ schema ask) to a temp prompt file.
3. Run `call-model adversarial --target <pick> --cwd <repo> --prompt-file <temp>`.
4. Fold stdout into RECONCILE (typed JSON when present; else prose findings).

Do **not** pass the CLAIM. Prefer inlining `reviewer-output.schema.json` fields in the prompt for deterministic ledger merge (especially Grok).

## Recovery

| Failure | Action |
|---|---|
| Binary missing / setup fails | Surface; offer another target or skip — never silent single-model |
| Companion missing for Codex | Portable `codex exec` (unless user required compose-only) |
| Non-zero exit / timeout | Surface stderr; one retry with smaller prompt if truncation likely; else escalate |
| Gemini auth / free-tier error | Report dead auth; suggest codex or grok |
| Malformed “JSON only” response | Treat as prose findings; do not invent schema fields |

## Relationship to other skills

| Skill | Relationship |
|---|---|
| `doubt-driven-development` | **Caller** — cross-model escalation uses this skill |
| `headless-doubt` | **Sibling** — same-model Claude headless doubt; use that for typed `claude -p` doubt, or `--target claude` here for generic headless |
| `review` | Complementary five-axis PR gate; may offer dual-pass via this skill later |
| OpenAI `codex@openai-codex` | **Composed** for Codex on Claude Code when companion is found — not vendored |

## Verification

- [ ] Mode + target chosen; write modes require explicit `--write` + user auth
- [ ] Prompt delivered via temp file / stdin, not shell-interpolated
- [ ] Interactive: exact command confirmed; non-interactive: skip announced or pre-authorized
- [ ] Read-only sandbox / permission flags used for consult/adversarial/review
- [ ] Host presented results without auto-fixing review findings
- [ ] Failures surfaced; no silent fallthrough to single-model

$ARGUMENTS
