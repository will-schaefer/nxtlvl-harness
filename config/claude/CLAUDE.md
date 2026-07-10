# Global conventions

## Decisions

When you are about to make a **genuinely architectural, expensive-to-reverse decision** — one
that shapes structure/boundaries or would cost real work to undo — **follow the decision rule
before proceeding: read `~/.claude/rules/decisions.md`.** It covers when an ADR is warranted,
the `/interview-me`→`/grill-me`→`/spec`→`/plan`→`/nxtlvl:documentation-and-adrs` pipeline, and
the ADR format. Everyday, easily-reversible choices: just proceed — that tier isn't covered yet.

## Context assembly

When you are about to add **always-on context** — growing a `CLAUDE.md`, saving memory, or
injecting via hooks — **follow the context rule: read `~/.claude/rules/memory.md`.** It covers
the `CLAUDE.md` / memory / hook-injection split and the token-budget test (pointers over
content). One-off, in-session context: just proceed.

## Hooks

When you are about to **write or modify a Claude Code hook** — any event, any repo — **follow
the hook safety contract: read `~/.claude/rules/hooks.md`.** It covers fail-open as the default
failure mode and the whitelisted-gate + kill-switch exception. Merely *running* under existing
hooks: just proceed.

## Git workflow

When work will **land on GitHub** — committing, opening a PR, driving a change to merge —
**follow the git conventions: read `~/.claude/rules/git-workflow.md`.** It covers commit
format, PR flow, and attribution. Local throwaway work: just proceed.

## Visual design docs

When you are **authoring or revising design documentation** — specs, plans, intents, ADRs,
architecture, proposals, or equivalent — **follow the visual-docs rule: read
`~/.claude/rules/visual-docs.md`.** It covers diagrams (mermaid, ASCII), when to use in-session
interactive visuals, and where standalone diagram artifacts live. Pure implementation code or
throwaway notes: just proceed.
