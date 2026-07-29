# Patterns and conventions

*Last Updated: 2026-07-28*

## Fail-open is the default failure mode

Every hook degrades to a no-op rather than blocking the session. This is the repo's highest-priority
safety property, written down at `config/claude/rules/hooks.md`: a buggy blocking hook could lock the
author out of their own daily driver.

In practice: each hook entry script wraps its body in try/catch and exits zero. `lib/atomic.js`
states it as a module-level rule — "every function is written to fail soft: a malformed rule file
degrades to 'skip that rule', never to a thrown error."

**Two deliberate exceptions**, both explicit:

| Exception | Where | Why |
|---|---|---|
| Blocking gate | `hooks/dangerous-bash.js` | A whitelisted gate for catastrophic shell commands, with kill switch `NXTLVL_DANGEROUS_BASH=off` |
| Fail-closed | `lib/scrub.js` | If secrets cannot be scrubbed, the record is not written. Failing open here would leak. |

## Every hook has a kill switch

An environment variable that disables it entirely: `NXTLVL_CM_CAPTURE`, `NXTLVL_CM_OBSERVE`,
`NXTLVL_DANGEROUS_BASH`, `NXTLVL_SESSION_TITLE`, `NXTLVL_CONTEXT_ALERT`, and others. Each is
documented in the hook's `description` field in `hooks/hooks.json`, which is the place to look
first.

## Atomic writes everywhere

No module writes a file in place. Everything goes through `lib/atomic.js` — write a temporary
sibling, then rename. A crash mid-write leaves either the old file or the new one, never a
half-written one.

## One module owns each cross-cutting concern

| Concern | Sole owner | Rule |
|---|---|---|
| Storage layout | `lib/paths.ts` | No other module hardcodes a path |
| Hook input/output types | `lib/types.ts` | The typed boundary with Claude Code |
| Write primitives | `lib/atomic.js` | Path-agnostic by design |
| Secret handling | `lib/scrub.js` | Everything on the write path passes through |

## Configuration through environment variables with documented defaults

Tunable values read an environment variable and fall back to a literal default, with the default
stated in a comment. Examples: recall bar 0.7, strong bar 0.8, half-life 30 days, observer cadence
20, model timeout 120,000 milliseconds.

## Testing

- Colocated: `foo.js` sits next to `foo.test.js`.
- Node's built-in runner (`node --test`) — no Jest, Vitest, or Mocha.
- 478 tests, about 13 seconds, all passing as of this map.
- Tests run **locally only**. The single continuous-integration workflow syncs issue labels; there
  is no test or type-check job.

## Decision records

`docs/decisions/` — 39 records, format governed by `~/.claude/rules/decisions.md`.

- **Numbering:** take the next number from the union of committed *and* working-tree files. Two
  parallel sessions otherwise mint the same number.
- **Status changes are two edits:** the record's frontmatter `status:`, then its row in
  `docs/decisions/README.md`. The index must not drift.
- **Superseded records are kept, never deleted** — `status: Superseded` plus a `superseded-by:`
  pointer.
- **Domain grain** (ADR-029): one record per major capability domain. Sub-questions fold in as
  sections rather than spawning new records.

A live rule in `.claude/live-rules.md` re-states these and fires whenever `docs/decisions/**` is
edited.

## Documentation conventions

- **Plain language, enforced.** No invented shorthand or nicknames. Only universal industry
  acronyms, listed exhaustively in `config/claude/rules/approved-acronyms.md`, and spelled out on
  first use per document. Write *source of truth*, never a coined abbreviation.
- **Pointers over content.** Rule files name where knowledge lives rather than inlining it, because
  always-on context costs tokens every session (`config/claude/rules/memory.md`).
- **Design documents carry structural visuals** — mermaid preferred, since it renders on GitHub
  (`config/claude/rules/visual-docs.md`). Heavy or interactive assets go to `docs/diagrams/` and get
  linked, not inlined.
- **Portable authoring.** Every `CLAUDE.md` in this family is written to be valid for any consuming
  agent tool, not just Claude Code (ADR-028). `GEMINI.md` is a symlink to `CLAUDE.md`.

## Git conventions

- **Conventional Commits** (`type(scope): subject`).
- **No agent attribution lines** in commits or pull requests.
- **Commit finished work immediately**, staged **explicitly** — never `git add -A`. Parallel sessions
  are common across the sibling repos and bulk-staging absorbs another session's in-flight work.
- **Draft pull requests first**; bodies are pointers, not dumps.
- **Checkpoint before pausing:** `chore(wip): <slug> — <state>`.

## The scaffolding pattern

New skills, agents, and commands are built in `sandbox/`, which mirrors the plugin's shape but sits
off the harness discovery path — so work in progress is never loaded or routed to. Promotion is
`git mv sandbox/skills/<name> plugins/nxtlvl/skills/<name>`; **the move is the activation.**

## Read-only-by-construction agents

Most agents in `plugins/nxtlvl/agents/` are restricted by *withheld tools* rather than by
instruction — a scout with only Read, Grep, and Glob physically cannot write. The agent definitions
say so explicitly ("read-only by withheld tools; it physically cannot write the tree").

A related distinction runs through the scout agents: **leads versus evidence.** `deepwiki-scout` and
`wiki-scout` return claims stamped as leads that may never be cited in an artifact; `context7-scout`
returns citations that may, because they point at version-pinned official documentation.

## Related

- [context-and-memory.md](./context-and-memory.md) — where most of these patterns are exercised
- [coding-style.md](./coding-style.md) — naming and formatting
