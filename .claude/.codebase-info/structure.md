# Project structure

*Last Updated: 2026-07-28*

## What this project is

`nxtlvl-core` builds **nxtlvl**, a personal Claude Code harness — skills, agents, commands, hooks,
and the machine-global agent configuration. It is one repo inside the `nxtlvl` workbench family
(see `../CLAUDE.md` for the family map). Anchor document: `docs/intent/personal-harness.md`.

## Organizing principle

**Source-versus-deployment split.** The repo is organized by *how an artifact reaches the running
agent*, not by language or feature. Three delivery channels, each with different mechanics:

| Channel | Source lives in | How it goes live |
|---|---|---|
| Plugin artifacts | `plugins/nxtlvl/`, `plugins/agent-dev/` | commit → push → `claude plugin update` → restart |
| Machine-global config | `config/claude/` | symlinked into `~/.claude` — live immediately, no deploy |
| Documentation | `docs/` | inert; read by humans and agents on demand |

Getting these confused is the single most common mistake in this repo — a plugin edit that looks
applied is not, until it is pushed and the plugin updated.

## Where things go

| Kind of thing | Lives in | Notes |
|---|---|---|
| Live plugin skills/agents/commands/hooks | `plugins/nxtlvl/{skills,agents,commands,hooks}/` | on the harness discovery path |
| Work-in-progress harness items | `sandbox/{skills,agents,commands}/` | mirrors the plugin shape, deliberately **off** the discovery path |
| Machine-global rules | `config/claude/rules/` | symlinked live into `~/.claude/rules/` |
| Machine-global skills, memory, output styles | `config/claude/{skills,memory,output-styles}/` | same symlink mechanism (`config/claude/link.sh`) |
| Architecture decision records | `docs/decisions/` | sequential `ADR-NNN-slug.md` plus a `README.md` index table |
| Specs, plans, intent, ideas | `docs/{spec,plan,intent,ideas}/` | design documentation; require at least one structural visual |
| Standalone diagrams | `docs/diagrams/` | durable linkable artifacts; parent docs link rather than inline |
| Reviewed-harness distillations | `docs/reference/` | the durable record; the raw clone in `reference/` is temporary |
| Build tooling | `scripts/{multi-cli-compiler,adr}/` | TypeScript/Node, run via `package.json` scripts |
| Tests | colocated beside source | `*.test.ts` / `*.test.js`, run by `npm test` (`node --test`) |
| Throwaway experiments | `*-workspace/` at any level | gitignored |
| Harness study clones | `reference/` | gitignored; deleted after distilling into `docs/reference/` |

## Conventions that aren't obvious from the tree

- **`sandbox/` is a staging tree, and the `git mv` *is* the activation.** Build a new skill or agent
  in `sandbox/`, then promote with
  `git mv sandbox/skills/<name> plugins/nxtlvl/skills/<name>`. Nothing in `sandbox/` is loaded,
  routed to, or warned about by the live plugin. See `sandbox/README.md`.
- **`config/claude/` is the source of truth for the machine-global agent configuration**, not
  `~/.claude`. The home directory holds symlinks pointing back here. Edit the repo copy.
- **`GEMINI.md` is a symlink to `CLAUDE.md`.** Every `CLAUDE.md` in this family is authored
  *portable* — valid for any consuming coding agent, not just Claude Code
  (`docs/decisions/ADR-028-portable-source-of-truth-per-cli-supplements.md`). Agent-specific
  mechanics belong in channels other agents don't ingest as always-on rules.
- **Documentation is a first-class deliverable, not a byproduct.** Markdown is roughly seventy
  percent of tracked files. Design documents carry structural diagrams by convention
  (`config/claude/rules/visual-docs.md`).
- **Always-on context is a budgeted injection policy.** `CLAUDE.md` and the files in
  `config/claude/rules/` are deliberately pointer-heavy — they name where knowledge lives rather
  than inlining it. Prefer adding a pointer over adding content
  (`config/claude/rules/memory.md`).
- **Sibling repos are peers, not submodules.** `nxtlvl-lab/`, `nxtlvl-wiki/`, and `nxtlvl-monitor/`
  live beside this repo under the workbench root and are versioned independently. Commit work in
  its own subrepo, staged explicitly — parallel sessions are common and bulk-staging absorbs
  another session's in-flight work.
