# Codebase Map — nxtlvl-core

*Last Updated: 2026-07-28*

Builds **nxtlvl**, a personal Claude Code harness: a plugin of skills, agents, commands, and hooks,
plus the machine-global agent configuration that is symlinked into `~/.claude`. One repo in the
`nxtlvl` workbench family; anchor document is `docs/intent/personal-harness.md`.

**Stack:** Node.js 24 · TypeScript 6 (type-check only, no build) · `node --test` · Markdown-dominant
**Shape:** Delivery-channel split — plugin artifacts, symlinked global config, and inert documentation

## Documents

| Document | What's inside |
|----------|---------------|
| [architecture.md](./architecture.md) | The three delivery channels, the hook pipeline, component boundaries |
| [context-and-memory.md](./context-and-memory.md) | The Context and Memory subsystem — the largest piece of machinery here |
| [tech-landscape.md](./tech-landscape.md) | Runtime, language, tooling, and the source-of-truth files |
| [directory-structure.md](./directory-structure.md) | Annotated folder tree |
| [structure.md](./structure.md) | Rules of the road — where new things go and why |
| [entry-points.md](./entry-points.md) | Hooks, skills, commands, agents, npm scripts |
| [modules.md](./modules.md) | The `plugins/nxtlvl/lib/` modules: purpose and dependencies |
| [patterns.md](./patterns.md) | Fail-open hooks, atomic writes, kill switches, decision-record lifecycle |
| [coding-style.md](./coding-style.md) | Conventions from `tsconfig.json` and from the code itself |
| [onboarding.md](./onboarding.md) | Quick start and common tasks |

## The one thing to know first

Editing a file under `plugins/` does **not** change the running harness. Plugin installs clone from
the GitHub remote, never the local working tree. To make a plugin edit take effect:
commit → `git push origin main` → `claude plugin update <plugin>@nxtlvl-dev` → restart sessions.
By contrast `config/claude/` is symlinked live into `~/.claude` and needs no deploy step.

## How to use this map

- New here? Read `onboarding.md`, then `architecture.md`.
- Before touching code, skim the doc for the area you're changing.
- These docs hold concrete file paths — navigate straight to the relevant code.

## Keeping this map current

After a change that affects architecture, directory structure, dependencies, entry points, or
conventions, refresh the affected docs with `/codebase-mapper:update-codebase-map`. Small internal
changes don't need an update.
