# Onboarding

*Last Updated: 2026-07-28*

## What you're looking at

A personal Claude Code harness — the machinery that shapes how a coding agent behaves. No server, no
database, no user interface. What it produces is a plugin (skills, agents, commands, hooks) plus the
machine-global agent configuration.

Start with `docs/intent/personal-harness.md` for the *why*, then [architecture.md](./architecture.md)
for the *how*.

## Quick start

```sh
npm install          # only 2 dev dependencies: typescript, @types/node
npm test             # 478 tests via node --test, ~13 seconds
npm run typecheck    # tsc --noEmit
```

There is no build step and nothing to start. Node 24.12 or later is required.

## The one thing that trips everyone up

**Editing a file under `plugins/` does not change the running harness.** Plugin installs clone from
the GitHub remote, never your local working tree — and the local `nxtlvl-dev` marketplace does not
bypass this.

To make a plugin edit take effect:

```sh
git commit -m "feat(scope): what changed"
git push origin main
claude plugin update nxtlvl@nxtlvl-dev
# then restart affected sessions
```

By contrast, `config/claude/` is **symlinked live** into `~/.claude` — those edits apply the moment
you save. Same repo, opposite mechanics.

A live rule fires automatically whenever you touch `plugins/**` to remind you of this.

## Common tasks

| Task | How |
|---|---|
| Run tests | `npm test` |
| Type-check | `npm run typecheck` |
| Build a new skill | Scaffold in `sandbox/skills/<name>/`, then `git mv` it into `plugins/nxtlvl/skills/<name>` — the move is the activation |
| Record a decision | `/nxtlvl:doc-keeper` or the `documentation-and-adrs` skill; take the next number from committed **and** working-tree files |
| See the decision graph | `node scripts/adr/graph.ts` (add `--html --open` for the interactive viewer) |
| Sync configuration to other agent tools | `npm run compile-multi-cli` (dry run), `-- --write` to apply, `-- --check` as a drift gate |
| Re-link global config | `config/claude/link.sh` |
| Inspect what the harness has learned | `/nxtlvl:instinct-status` |
| Find the right skill for a task | `/nxtlvl:brainstorm`, or the `nxtlvl-router` meta-skill |

## Verifying the multi-agent compiler

Three steps, all of them — tests alone miss drift, and a drift check alone misses physical
corruption:

```sh
npm test                                    # 1. unit coverage
npm run compile-multi-cli -- --check        # 2. drift report, no writes
ls -la ~/.codex/AGENTS.md ~/.gemini/GEMINI.md ~/.agents/skills/   # 3. real symlinks on disk
```

## Where things live

| Looking for | Go to |
|---|---|
| How the harness observes and learns | [context-and-memory.md](./context-and-memory.md) |
| What runs and when | [entry-points.md](./entry-points.md) |
| The library modules | [modules.md](./modules.md) |
| Where to put a new thing | [structure.md](./structure.md) |
| Conventions | [patterns.md](./patterns.md), [coding-style.md](./coding-style.md) |
| Past decisions | `docs/decisions/` (39 records, `README.md` is the index) |
| Reviewed external harnesses | `docs/reference/` |

## Sibling repositories

This is one repo in the `nxtlvl` workbench family. The siblings are **peers, not submodules** —
each independently versioned, each with its own remote:

| Directory | What it is |
|---|---|
| `nxtlvl-core/` | This repo — the harness |
| `nxtlvl-lab/` | Capability incubation and measurement |
| `nxtlvl-wiki/` | The reference corpus of reviewed production harnesses |
| `nxtlvl-monitor/` | Cross-tool session monitoring and log digestion |

`../CLAUDE.md` at the workbench root carries the family-wide conventions. Commit work in its own
subrepo, staged **explicitly** — parallel sessions are common and bulk-staging absorbs another
session's in-flight work.

## Gotchas

- **`sandbox/` is invisible to the harness** — that is the point. Nothing there is loaded or routed
  to until it is moved into `plugins/`.
- **`reference/` is gitignored and temporary.** The durable record of any reviewed harness is its
  distillation in `docs/reference/`.
- **`.codex/`, `.devin/`, `.grok/` are generated**, not hand-maintained. They come from
  `scripts/multi-cli-compiler/`.
- **No continuous integration for tests.** The one workflow syncs issue labels. Run `npm test`
  yourself before pushing.
- **TypeScript enums will fail type-checking** — `erasableSyntaxOnly` is on because Node strips
  types rather than compiling them.
- **The sandbox blocks some writes** under `.claude/`. If a command fails with "operation not
  permitted" on a dotfile path, that is the environment sandbox, not a code bug.

## Related

- [INDEX.md](./INDEX.md) — the map hub
- [architecture.md](./architecture.md) — the full picture
