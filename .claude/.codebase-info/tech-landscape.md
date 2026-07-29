# Tech landscape

*Last Updated: 2026-07-28*

## Runtime and language

| Thing | Version | Notes |
|---|---|---|
| Node.js | `>=24.12` (`package.json` engines) | Confirmed local: v24.12.0 |
| TypeScript | `^6.0.3` (dev dependency) | **Type-check only** — `noEmit: true`, nothing is compiled |
| Test runner | `node --test` (built in) | No Jest, Vitest, or Mocha |
| Shell | zsh / POSIX shell | 12 tracked `.sh` files |
| Python | 3 | Only in the legacy `plugins/agent-dev/` tree |

There is **no build step and no bundler.** TypeScript files are executed directly by Node 24's
native type stripping — which is why `tsconfig.json` sets `erasableSyntaxOnly: true` and
`allowImportingTsExtensions: true`. Code must avoid TypeScript features that require emitting
(enums, parameter properties, namespaces).

## Dependency picture

Only two direct dependencies, both development-only:

```json
"devDependencies": {
  "typescript": "^6.0.3",
  "@types/node": "^24.0.0"
}
```

This is deliberate. The plugin runs inside a user's Claude Code process, so runtime dependencies
would have to be installed on every machine that loads it. Everything at runtime uses Node standard
library only — `lib/atomic.js` states this explicitly ("Pure Node stdlib, no external dependencies").

## File composition

| Extension | Count | Where |
|---|---|---|
| `.md` | 343 | `docs/` (196), `plugins/` skills and agents, `config/claude/` |
| `.json` | 45 | plugin manifests, hook registrations, configs |
| `.js` | 40 | hooks and libraries (plus their colocated tests) |
| `.ts` | 12 | `lib/paths.ts`, `lib/types.ts`, `scripts/` |
| `.sh` | 12 | linking, snapshots, legacy learning agents |
| other | ~25 | yaml, html, svg, toml, py |

Markdown is roughly seventy percent of the repo. This is expected: skills, agents, commands, rules,
and decision records are all Markdown, and they are the product, not documentation *about* the
product.

## Source-of-truth files

| File | Owns |
|---|---|
| `package.json` | The three npm scripts and the Node engine floor |
| `tsconfig.json` | Type-check settings and which paths are checked |
| `plugins/nxtlvl/plugin.json` | Plugin name and namespace behavior |
| `plugins/nxtlvl/hooks/hooks.json` | All nine hook registrations, matchers, timeouts, kill switches |
| `plugins/nxtlvl/mcp_config.json`, `.mcp.json` | The DeepWiki and Context7 server declarations |
| `plugins/nxtlvl/lib/paths.ts` | The on-disk state layout (locked) |
| `plugins/nxtlvl/lib/types.ts` | The typed contract at the Claude Code boundary |
| `CLAUDE.md` | Always-on project instructions (`GEMINI.md` is a symlink to it) |
| `config/claude/rules/*.md` | The seven machine-global rule files |
| `.gitignore` | The `*-workspace/` and `/reference/` throwaway conventions |

## Type-checking scope

`tsconfig.json` includes only `plugins/nxtlvl/**/*.ts` and `scripts/multi-cli-compiler/**/*.ts`. It
explicitly **excludes** `scripts/adr` (which carries its own `tsconfig.json`), plus `node_modules`,
`reference`, `**/vendor`, and `*-workspace`.

`strict: true` and `checkJs: false` — so the JavaScript files are not type-checked, only the
TypeScript ones. The migration to TypeScript is partial and ongoing; `package.json` describes itself
as "root dev tooling (typecheck + test) for the TypeScript migration."

## Commands

| Command | Does |
|---|---|
| `npm test` | `node --test` over plugin and compiler tests — 478 tests, ~13 seconds |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run compile-multi-cli` | Runs the multi-agent configuration compiler |

## External services

| Service | How reached | Declared in |
|---|---|---|
| DeepWiki | HTTP MCP server at `mcp.devin.ai`, bearer token from `DEVIN_API_KEY` | `plugins/nxtlvl/.mcp.json` |
| Context7 | HTTP MCP server at `mcp.context7.com` | `plugins/nxtlvl/.mcp.json` |
| GitHub | `gh` command-line tool and plain git | Workflow conventions, not code |

Credentials come from the environment (`.envrc` is gitignored). No secret values live in the repo.

## Continuous integration

One workflow, `.github/workflows/labels.yml` — it syncs the repository's issue labels from
`.github/labels.yml`. There is **no test or type-check workflow**; both run locally only.

## Related

- [architecture.md](./architecture.md) — how the pieces fit
- [onboarding.md](./onboarding.md) — getting set up and running things
