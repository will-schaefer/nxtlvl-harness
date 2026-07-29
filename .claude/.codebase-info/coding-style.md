# Coding style

*Last Updated: 2026-07-28*

There is no linter or formatter configured — no ESLint, Prettier, or editorconfig in the repo. Style
comes from `tsconfig.json` and from what the code consistently does.

## Enforced by the type checker

`tsconfig.json`, applied to `plugins/nxtlvl/**/*.ts` and `scripts/multi-cli-compiler/**/*.ts`:

| Setting | Value | Consequence |
|---|---|---|
| `strict` | `true` | Full strict-mode type checking |
| `noEmit` | `true` | Type-check only; nothing is compiled |
| `erasableSyntaxOnly` | `true` | **No enums, parameter properties, or namespaces** — Node strips types, it does not transform |
| `verbatimModuleSyntax` | `true` | Type-only imports must be written `import type` |
| `allowImportingTsExtensions` | `true` | Import with the `.ts` extension included |
| `checkJs` | `false` | The `.js` files are not type-checked |
| `target` / `lib` | `es2024` | Modern syntax available |

The `erasableSyntaxOnly` constraint is the one that bites: writing a TypeScript `enum` will fail
type-checking, because Node 24 runs these files by stripping types rather than compiling them.

## File-header comments

Every library module opens with a block comment giving the module name, an em dash, and a one-line
purpose — then the design constraints that matter. This is the single most consistent convention in
the codebase:

```
// atomic — path-AGNOSTIC write primitives shared by the whole C&M subsystem.
//
// The obs-log, instinct store, and bookmark trail all build on these. This module
// knows NOTHING about the storage layout (that is paths.js's job): every function
```

Two things to imitate: **capitalized emphasis** for a constraint that must not be violated
(`path-AGNOSTIC`, `NOTHING`), and a pointer to the module that *does* own the thing this one
deliberately avoids.

## Inline comments

Sparse, and reserved for a *why* the code cannot express — a locked decision, a threshold's
rationale, a cross-reference to the spec or decision record that fixed it:

```js
// Strict ceiling: confidence may approach but never reach 1.0.
const MAX_CONFIDENCE = 0.999999;
```

Comments frequently cite their authority: `(decision D1)`, `(spec §5, locked, ADR-025)`,
`(ADR-005, amended 2026-06-19)`. When a value was decided rather than chosen casually, the comment
says where.

Note: the codebase abbreviates the Context and Memory subsystem in comments. New *persisted prose*
(documentation, commits, decision records) must spell it out — see the plain-language rule. Existing
comments get fixed opportunistically when the file is being edited anyway, not in a sweep.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `obs-log.js`, `project-identity.js`, `observer-runner.js` |
| Tests | source name plus `.test` | `instincts.test.js` |
| Constants | `SCREAMING_SNAKE_CASE` | `DAY_MS`, `MAX_CONFIDENCE`, `DEFAULT_CADENCE` |
| Functions | camelCase | `halfLifeDays()`, `nowISO()`, `forProject()` |
| Environment variables | `NXTLVL_` prefix, screaming snake | `NXTLVL_CM_RECALL_BAR` |
| Hook ids | `event:name` | `pre:dangerous-bash`, `post:cm-observe` |
| Decision records | `ADR-NNN-kebab-slug.md` | `ADR-029-atomic-adrs-one-decision-each.md` |

## Module format

Mixed and deliberate: `lib/*.js` uses CommonJS (`require`), `lib/*.ts` uses ES modules. The
`.mjs` extension appears once, at `skills/call-model/scripts/call-model.mjs`. Match whatever the
file you are editing already uses.

## Defaults pattern

A tunable reads its environment variable, coerces, and falls back to a literal — with the literal
named as a constant when it is used more than once:

```js
function halfLifeDays() {
  return Number(process.env.NXTLVL_INSTINCT_HALFLIFE_DAYS) || 30;
}
```

## Markdown

- Frontmatter on skills, agents, commands, and decision records; field order fixed where determinism
  matters.
- Tables for structured comparisons, mermaid for structure.
- Concrete paths, never vague description — `plugins/nxtlvl/lib/paths.ts`, not "the paths module".

## Related

- [patterns.md](./patterns.md) — the architectural conventions
- [tech-landscape.md](./tech-landscape.md) — why there is no build step
