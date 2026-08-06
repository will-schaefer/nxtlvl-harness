# Live rules — nxtlvl-core
# Injected automatically by the live-rules plugin. Global rules fire every prompt;
# scoped rules fire when their files/keywords match. Keep each body tight — all rules
# matching one event share a ~10k-char budget. Anything above the first `---` fence is ignored.
# Edit freely, then rebuild the atomic rule set (the plugin reads `.claude/live-rules/`,
# not this file, once it has migrated). Commit this file so future sessions share it.

---
description: House git discipline (nxtlvl conventions, not the generic defaults)
priority: 95
---
- Conventional Commits (`type(scope): subject`); no AI attribution lines in commits or PRs.
- Commit finished, verified work immediately in this repo — parallel sessions are common here,
  and uncommitted work can be absorbed by another session's checkpoint.
- Stage files explicitly, per path — never bulk-stage (`git add -A` is banned).
- Per-path staging does not protect against same-file collisions: a parallel session may have
  edited a file you also touched. Before committing, run `git diff --cached` and confirm every
  hunk is yours; if a foreign hunk rode in, split it out before the commit lands.
- Two hats: a commit either *adds behavior* (ships with its test) or *refactors*
  (behavior-preserving) — never both in one commit.
- Solo repos commit directly to main; don't push unless asked.
- Full conventions: `~/.claude/rules/git-workflow.md`.

---
description: Surgical, simple, honest
priority: 90
---
- Think before coding: state assumptions, push back on overcomplication; ask instead of silently
  picking a reading.
- Minimum code that solves it — no speculative abstractions. Every changed line traces to the
  request; don't "improve" adjacent code.
- Plain language in everything persisted: no invented shorthand, acronyms spelled out on first
  use per document (`~/.claude/rules/plain-language.md`).

---
description: Verify behavior deterministically
priority: 85
---
- Prove changes by exercising them — a test, an asserting script, a real run whose output you
  show — never by eyeballing. A change isn't done until a deterministic check passes.
- In this repo that means `npm test` (node --test over the plugin and compiler sources) plus
  `npm run typecheck`. Show the output; "looks right" is not done.
- Every technical claim in a commit message must be something you actually observed.

---
description: Harness source — deploy boundary and hook safety
globs: ["**/plugins/**", "**/hooks/**", "**/config/claude/**", "**/sandbox/**"]
priority: 65
---
- Plugin edits are **not live until deployed**: commit → push origin main →
  `claude plugin update <plugin>@nxtlvl-dev` → restart sessions. Installs clone from the GitHub
  remote, never the local working tree.
- Rule files under `config/claude/rules/` are the opposite: symlinked into `~/.claude` and live
  immediately, with no deploy step. Know which side of that line you are editing.
- `sandbox/` is off the harness discovery path on purpose. Promote with
  `git mv sandbox/<kind>/<name> plugins/nxtlvl/<kind>/<name>` — the move is the activation.
- Hooks **inform, they don't force**: fail-open is the default failure mode; blocking gates are
  rare whitelisted exceptions with a kill switch (`~/.claude/rules/hooks.md`).

---
description: TypeScript — Node-native type-stripping, no build step
globs: ["**/*.ts", "**/tsconfig.json", "**/package.json"]
priority: 60
---
- Node ≥24 runs `.ts` directly: keep `.ts` extensions on imports; erasable syntax only — no
  `enum`, `namespace`, or parameter properties. `tsc --noEmit` is a type gate, never a build.
- `node --test` is the only test runner; tests colocate next to source.
- Adding a new `scripts/<dir>/`: extend **both** the package.json test glob **and** the tsconfig
  `include` array — they are maintained separately, and updating one leaves the other blind.
- No new JavaScript — TypeScript for all new code.

---
description: House code conventions
globs: ["**/*.ts", "**/*.js"]
priority: 55
---
- No inline comments unless they capture a real hidden constraint (a *why* the code can't
  express). Lean on naming and structure. Delete commented-out code.
- Replace magic numbers with named constants. Match the surrounding code's idiom.

---
description: Refactoring discipline (Fowler)
prompt: ["refactor", "refactoring", "clean up", "cleanup", "tidy", "restructure"]
priority: 45
---
Refactoring changes structure, never behavior — and only starts from green (add a
characterization test first if needed). Name the smell, apply the matching small named move, run
tests after each. No behavior changes folded in — separate commits.

---
description: Self-improvement — turn friction into a fix that sticks
priority: 40
---
After finishing a chunk of work, take a beat: did you hit friction? Signs — you fumbled the stack
or its tooling, re-derived something that should've been written down, tripped over a missing or
unclear convention, guessed wrong about where code lives, or repeated a workaround. If so, make
that friction cheaper or impossible next time by improving the workspace itself.
- Wrong/missing convention → add or refine a **live rule** (scope it tightly).
- Stale or missing project knowledge → update the **codebase map** (`.claude/.codebase-info/`).
- A repeatable multi-step task you did by hand → propose a **skill** (via skill-creator).
- A durable project fact → CLAUDE.md or a map doc; an architectural decision → an ADR
  (architecture decision record) per `~/.claude/rules/decisions.md`.
Keep it small — one improvement, not a rewrite, as its own commit. If nothing was off, skip it
silently; don't manufacture busywork. For a deeper periodic pass, run `retro`.

---
description: Decision-record status changes are two edits, never one
globs: ["docs/decisions/**"]
priority: 60
---
Changing an architecture decision record's status is **two edits, not one**: update the record's
frontmatter `status:` field, then immediately update its row in `docs/decisions/README.md` so the
index stays in sync. Verify with `grep -n 'ADR-NNN' docs/decisions/README.md` before you commit —
an index that disagrees with the records is worse than no index, because it is still trusted.
Format, the record-worthy threshold, superseded-record lifecycle, and domain grain all live in
`~/.claude/rules/decisions.md` — read it rather than reconstructing them here.

---
description: Planning — partition and fan out before listing steps
priority: 88
---
Before writing any plan — plan mode, a plan document, or a reply listing more than a couple of
steps — partition the work and mark which tasks are independent, then dispatch the independent
ones to **parallel subagents**, up to 6, as multiple tool calls in a **single** message (spread
across messages they run one after another, defeating the point). Show the partition in the plan
and state a reason for every sequential step.
The order: **would splitting make the result worse?** — one coherent voice, context-heavy work,
underspecified work, tight debugging, output you can't verify, same-file writes. If yes, don't,
and say which case applies. **Otherwise, would it finish sooner?** If yes, fan out — speed alone
is reason enough. Neither? Do it inline.
Full rule, plus the pointer to the workflow-pattern catalogue that names *which shape* to fan out
into: `~/.claude/rules/planning.md`.
