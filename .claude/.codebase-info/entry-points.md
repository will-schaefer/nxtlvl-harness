# Entry points

*Last Updated: 2026-07-28*

Nothing here is a server or a `main()`. Execution starts when Claude Code fires a hook, a user
invokes a skill or command, or someone runs an npm script.

## 1. Hooks — the involuntary entry points

Registered in `plugins/nxtlvl/hooks/hooks.json`. These run without being asked.

| Event | Id | Runs | Timeout | Kill switch |
|---|---|---|---|---|
| `PreToolUse` (`Skill\|Task\|Agent`) | `pre:fallback-log` | `hooks/fallback-log.sh` | — | — |
| `PreToolUse` (`Bash`) | `pre:dangerous-bash` | `hooks/dangerous-bash.js` | 10s | `NXTLVL_DANGEROUS_BASH=off` |
| `PreToolUse` (`*`) | `pre:cm-capture` | `hooks/capture.js` | 10s | `NXTLVL_CM_CAPTURE=off` |
| `PostToolUse` (`*`) | `post:context-alert` | `hooks/context-alert.js` | 10s | `NXTLVL_CONTEXT_ALERT=off` |
| `PostToolUse` (`*`) | `post:cm-capture` | `hooks/capture.js` | 10s | `NXTLVL_CM_CAPTURE=off` |
| `PostToolUse` (`*`) | `post:cm-observe` | `hooks/observe.js` | 10s | `NXTLVL_CM_OBSERVE=off` |
| `UserPromptSubmit` | `session:title` | `hooks/session-title.js` | 10s | `NXTLVL_SESSION_TITLE=off` |
| `SessionStart` | `session:cm-briefing` | `hooks/briefing.js` | — | — |
| `SessionEnd` | `session:cm-close` | `hooks/close.js` | — | — |

What each does:

- **`dangerous-bash.js`** — the only hook that can **block**. Refuses high-confidence catastrophic
  shell commands (`rm -rf /`, force-push to main, `curl | sh`, `dd` to a disk, `mkfs`,
  `chmod -R 777`, fork bombs) and warns on `git reset --hard` / `git clean -f`.
- **`capture.js`** — writes the start and completion of every tool call to the observation log.
- **`observe.js`** — spawns the detached distillation process once 20 observations accrue.
- **`context-alert.js`** — two-stage context-size warning: a notice at 200,000 tokens
  (`NXTLVL_CONTEXT_ALERT_TOKENS`), a backstop at 325,000 (`NXTLVL_CONTEXT_ALERT_BACKSTOP_TOKENS`).
- **`session-title.js`** — retitles the session `"<folder> · <branch>"` on every prompt.
- **`briefing.js`** — injects the branch bookmark and recalled instincts at session start.
- **`close.js`** — writes the bookmark at session end.
- **`fallback-log.sh`** — logs prefixed Skill/Task/Agent invocations for the fallback-rate metric.

Every hook is fail-open: an error exits zero and the session continues. See
[patterns.md](./patterns.md).

## 2. Skills — `plugins/nxtlvl/skills/` (14)

Addressed as `nxtlvl:<name>` (the plugin sets `"namespace": false`).

| Skill | Purpose |
|---|---|
| `nxtlvl-router` | **The meta-skill** — decides which other skill applies. The intended discovery path. |
| `brainstorming` | Front door for creative or build work; runs before implementation |
| `documentation-and-adrs` | Records decisions in the house format |
| `doubt-driven-development` | Fresh-context adversarial review with a typed reviewer contract |
| `headless-doubt` | The same review via an isolated `claude -p` process |
| `review` | Five-axis code review |
| `github-workflow` | Branch → commit → pull request → review → continuous integration → merge |
| `call-model` | Cross-model transport to Codex, Grok, Gemini, Devin, or headless Claude |
| `source-driven-development` | Grounds framework decisions in official docs via Context7 |
| `wiki-driven-development` | Orients against the nxtlvl-wiki corpus before building |
| `harness-review` | Vendors and analyzes an external agent harness |
| `show-me` | Specs and plans with mandatory structural visuals |
| `pointer-summary` | Emit path:line pointers instead of pasting file content |
| `project-artifact` | Publishes a tabbed project status page |

There is also an empty, untracked `skills/crop/` directory on disk — a leftover, not a skill.

## 3. Commands — `plugins/nxtlvl/commands/` (13)

Slash-command front doors, mostly thin wrappers that invoke a skill or dispatch an agent:

`/brainstorm` · `/context7` · `/doc-keeper` · `/evolve` · `/git-workflow` · `/grill-me` ·
`/harness-review` · `/idea-refine` · `/instinct-status` · `/interview-me` · `/promote` · `/prune` ·
`/show-me`

Four of these are the Context and Memory subsystem's control surface: `/instinct-status` (read the
metrics), `/evolve` (cluster instincts into artifacts), `/promote` (lift to global scope), `/prune`
(delete stale ones).

## 4. Agents — `plugins/nxtlvl/agents/` (9)

Spawned by skills, not usually invoked directly. Most are read-only by withheld tools — they
physically cannot write.

| Agent | Role |
|---|---|
| `context-scout` | Sweeps written project context for a brainstorm |
| `context7-scout` | Official library docs; its claims may be cited |
| `deepwiki-scout` | Repository orientation; its claims are leads only, never citations |
| `wiki-scout` | Queries the nxtlvl-wiki corpus; leads only |
| `doubt-reviewer` | Adversarial reviewer, biased to disprove |
| `idea-critic` | Pre-decision sibling of `doubt-reviewer` |
| `doc-keeper` | Writes and supersedes decision records |
| `git-workflow-runner` | Drives the git loop; has Bash but no Write or Edit |
| `evolver` | Authors an artifact from an instinct cluster into staging |

## 5. Scripts

| Invocation | Entry file | Does |
|---|---|---|
| `npm test` | — | `node --test` over plugin and compiler tests (478 tests) |
| `npm run typecheck` | — | `tsc --noEmit` |
| `npm run compile-multi-cli` | `scripts/multi-cli-compiler/compile.ts` | Dry-run plan by default; `--write` applies with backups; `--check` is a drift gate |
| `node scripts/adr/graph.ts` | `scripts/adr/graph.ts` | Decision-record dependency graph as JSON; `--html` writes a viewer; `--open` prints the URL |
| `config/claude/link.sh` | — | Creates the `~/.claude` symlinks |
| `plugins/nxtlvl/scripts/install-nxtlvl.sh` | — | Plugin installation |
| `plugins/nxtlvl/scripts/project-snapshot.sh` | — | Project state snapshot |

## 6. Model context protocol servers

Declared in `plugins/nxtlvl/.mcp.json`; both are HTTP, not spawned processes:

- **DeepWiki** — `https://mcp.devin.ai/mcp`, bearer token from `DEVIN_API_KEY`
- **Context7** — `https://mcp.context7.com/mcp`

## Related

- [context-and-memory.md](./context-and-memory.md) — what the hooks are building toward
- [modules.md](./modules.md) — the code the hooks call
