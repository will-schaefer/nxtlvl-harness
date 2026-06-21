---
description: Ground a claim in official library/framework docs via Context7. Parses `/context7 <library> — <question>`, spawns the read-only context7-scout, and relays its cited brief (every claim CITE-stamped with a doc URL @ version). Degrades to a one-line "unavailable" caveat — never blocks.
argument-hint: "<library>[@version] — <question>"
---

# /context7

Ground a library/API fact in **official docs** via Context7 — instead of answering from the model's
training cutoff. This command is the discoverable nxtlvl-owned entry point to the
[`context7-scout`](../agents/context7-scout.md) agent; the same grounding also works by spawning the
scout directly from the main session.

## What to pass

`/context7 <library>[@version] — <question>` — for example:

- `/context7 next.js — how do I opt a route out of static rendering in the app router?`
- `/context7 prisma@5 — what's the syntax for a composite unique constraint?`

Parse the argument into:

- **`LIBRARY`** — everything before the `—` (em dash) or `-` separator; may carry an optional
  `@version`.
- **`QUESTION`** — everything after the separator. If no separator is present, treat the whole
  argument as `LIBRARY` and ask the user for the `QUESTION` (one line) before spawning.

## What it does

1. **Spawn `context7-scout`** (the Agent/Task tool) with the parsed `LIBRARY` (+ optional version)
   and `QUESTION`. The scout resolves the library, queries its docs (budget: 1 resolve + ≤3 query),
   and returns a cited brief.
2. **Relay the brief unmodified.** Every claim is stamped `CITE — /org/project@version + doc URL`
   (cite the doc URL, not "Context7"). Do **not** restate a doc fact on the main thread without its
   citation — no citation laundering; the scout is read-only-by-withheld-tools precisely so the
   citation can't be lost on the way back.
3. **On degradation** — if the scout reports Context7 unreachable or the library didn't resolve,
   relay its one-line "unavailable — fall back to model knowledge (may be stale)" caveat. Never
   block; the caller proceeds, warned.

## When to use

Whenever a current, citable fact from a library/framework's **official docs** matters more than a
recalled one — API syntax, config, version migration, library-specific behavior. The trust contract
is [`../references/context7-grounding.md`](../references/context7-grounding.md) (ADR-030: Context7
testifies — cite the doc URL, version-pinned).

$ARGUMENTS
