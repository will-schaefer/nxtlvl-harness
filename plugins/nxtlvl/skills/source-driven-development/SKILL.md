---
name: source-driven-development
description: nxtlvl source-driven development — grounds every framework/library-specific implementation decision in official documentation via the context7-scout agent, rather than from training data or memory. Use when writing code that depends on a specific framework, library, or API where version and correctness matter — building boilerplate, following a documented pattern, or implementing a feature the library has a recommended approach for. Realizes ADR-025's deferred wiring of Context7 docs-grounding into a consumer skill.
---

# Source-Driven Development (nxtlvl)

Vendored from `agent-skills:source-driven-development` and refined for fit (see
[ADR-003](../../../../docs/decisions/ADR-003-build-from-scratch.md)). **Self-contained** — it does
*not* call the upstream skill. The nxtlvl refinement replaces the upstream's generic "fetch the
docs yourself" step with the already-built `context7-scout` agent
([ADR-025](../../../../docs/decisions/ADR-025-context7-testifies-primary-sources.md)) as the concrete
grounding mechanism — that ADR explicitly deferred wiring Context7 into `source-driven-development`
"until vendored"; this skill is that vendoring.

## Overview

Every framework-specific code decision should be backed by official documentation, not training
data. Training data goes stale, APIs get deprecated, best practices evolve — a confident-looking
pattern from memory can be quietly wrong against the version actually in use. This skill makes the
grounding step concrete: resolve the stack, ground the pattern via `context7-scout`, implement what
the docs actually show, and carry the citation forward.

## When to Use

- Building with any framework or library where the *current, version-correct* pattern matters —
  forms, routing, data fetching, state management, auth, and similar library-recommended-approach
  territory.
- Writing boilerplate, starter code, or a pattern that will get copied across a project — a wrong
  pattern here compounds every time it's copied.
- The user explicitly asks for documented, verified, or "correct" implementation.
- About to write framework-specific code from memory and the version in use isn't already known.

**When NOT to use:**

- Correctness doesn't depend on a specific version (renaming variables, fixing typos, moving
  files).
- Pure logic that behaves identically across versions (loops, conditionals, plain data
  structures).
- The user explicitly wants speed over verification ("just do it quickly").

## The Process

```
DETECT ──→ GROUND (via context7-scout) ──→ IMPLEMENT ──→ CARRY THE CITATION
  │              │                             │                │
  ▼              ▼                             ▼                ▼
 What stack,   Resolve the library +        Follow the      Keep the CITE
 what          query docs scoped to         documented      stamp attached
 version?      the specific question        pattern         to the pattern
```

### Step 1: DETECT — identify stack and version

Read the project's dependency file to identify exact versions — this step has no Context7
dependency and is unchanged from the general practice:

```
package.json    → Node/React/Vue/Angular/Svelte
composer.json   → PHP/Symfony/Laravel
requirements.txt / pyproject.toml → Python/Django/Flask
go.mod          → Go
Cargo.toml      → Rust
Gemfile         → Ruby/Rails
```

State what you found explicitly:

```
STACK DETECTED:
- React 19.1.0 (from package.json)
- Vite 6.2.0
→ Grounding the relevant pattern via context7-scout.
```

If versions are missing or ambiguous, **ask the user** rather than guess — the version determines
which pattern is actually correct.

### Step 2: GROUND — spawn `context7-scout`

Spawn `context7-scout` with the library (+ resolved version, if known) and the **specific
question** — not a vague "tell me about React." A scout call is bounded (1 `resolve-library-id` +
up to 3 `query-docs` per session per ADR-025), so aim it precisely:

```
BAD:  "React 19 forms"
GOOD: "React 19 form submission with pending state — is useActionState the
       current recommended pattern, and how does it replace manual useState?"
```

The scout returns a brief where **every claim is stamped `CITE — /org/project@version + doc URL`**
— that stamp is what makes the claim citable (per ADR-025, a primary source may testify; the
citation names the doc URL it delivered, never "Context7" itself).

**If `context7-scout` reports the library unavailable or unresolvable** (it degrades to a one-line
caveat per ADR-025, never blocks): fall back to a direct fetch of the official doc page for
anything Context7 doesn't index — web-standards references (MDN, web.dev) and
browser/runtime-compatibility tables (caniuse.com, node.green) are common cases outside a
per-library docs index. Anything fetched this way is still cited by full URL, just without the
`/org/project@version` stamp the scout provides.

When official sources conflict with each other (a migration guide contradicts the API reference),
surface the discrepancy to the user rather than silently picking one.

### Step 3: IMPLEMENT — follow the documented pattern

Write code that matches what the grounding brief shows:

- Use the API signatures from the brief, not from memory.
- If the brief shows a newer way to do something, use the newer way.
- If the brief flags a pattern as deprecated, don't use the deprecated version.
- If the scout couldn't ground something, flag it as unverified — don't silently fall back to
  memory without saying so.

**When the brief conflicts with existing project code**, surface the conflict rather than silently
picking one:

```
CONFLICT DETECTED:
The existing codebase uses useState for form loading state, but the
context7-scout brief shows React 19 recommending useActionState for this.
(CITE — facebook/react@19.1.0 — https://react.dev/reference/react/useActionState)

Options:
A) Use the modern pattern (useActionState) — consistent with the current docs
B) Match existing code (useState) — consistent with the codebase
→ Which approach do you prefer?
```

### Step 4: CARRY THE CITATION — keep the stamp attached to the pattern

Every framework-specific pattern keeps its citation, so the user (or a future reader) can verify
the decision without re-grounding it.

**In code comments:**

```typescript
// React 19 form handling with useActionState
// CITE — facebook/react@19.1.0 — https://react.dev/reference/react/useActionState#usage
const [state, formAction, isPending] = useActionState(submitOrder, initialState);
```

**In conversation**, quote the relevant passage when it supports a non-obvious decision, and keep
the full stamp — `/org/project@version` + doc URL — not a shortened link.

If a pattern couldn't be grounded (scout unavailable, and no reasonable direct-fetch fallback),
say so explicitly rather than hedging:

```
UNVERIFIED: could not ground this pattern via context7-scout or a direct fetch.
This is based on training data and may be outdated. Verify before using in production.
```

Honesty about what couldn't be verified is more valuable than false confidence.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'm confident about this API" | Confidence isn't evidence — training data contains outdated patterns that look correct but break against the current version. Ground it. |
| "Spawning the scout wastes tokens" | The scout call is bounded (1 resolve + ≤3 queries); a hallucinated API costs an hour of debugging downstream. |
| "Context7 won't have what I need" | If it genuinely doesn't, that's real information — either the pattern isn't officially documented, or it's outside a per-library docs index (fall back to a direct fetch, per Step 2). |
| "I'll just mention it might be outdated" | A disclaimer isn't grounding. Either ground and cite, or explicitly flag as unverified — hedging is the worst of both. |
| "This is simple, no need to check" | A simple pattern with a wrong version becomes a template the user copies ten times before discovering the current approach. |

## Red Flags

- Writing framework-specific code without grounding it for the detected version.
- Using "I believe" / "I think" about an API instead of a `CITE` stamp.
- Citing "Context7" as the source instead of the doc URL it delivered — the citation names the
  witness (the doc), never the courier (per ADR-025).
- Implementing a pattern without knowing which version it applies to.
- Using a deprecated API because it appears in training data.
- Not reading the dependency file before implementing.
- Delivering code without a citation for a framework-specific decision.

## Interaction with Other Skills

- **`context7-scout` (agent):** the grounding mechanism this skill composes. This skill owns *when*
  to ground and *what to do* with the result; the scout owns *how* to query Context7 and stamp the
  citation.
- **`wiki-driven-development`:** complementary, not overlapping. This skill grounds a specific
  *technical claim about a library or framework*; `wiki-driven-development` orients a *design or
  build decision* against prior harness patterns. One verifies facts; the other surveys precedent.
- **`doubt-driven-development`:** orthogonal layers — this skill verifies *facts about frameworks*
  against docs; doubt-driven verifies *your reasoning about the artifact*.

## nxtlvl conventions

- **Pointers over dumped content** — carry the `CITE` stamp forward, not the full fetched page.
- **Surface assumptions** — if a version is ambiguous and you proceed anyway, say so explicitly.

## Verification

- [ ] Framework and library versions were identified from the dependency file (or the user was
      asked when ambiguous).
- [ ] `context7-scout` was spawned with a specific, scoped question — not a vague topic.
- [ ] Every framework-specific pattern carries a `CITE — /org/project@version + doc URL` stamp (or
      a direct-fetch citation, for content outside Context7's index).
- [ ] No deprecated APIs were used (checked against the grounding brief).
- [ ] Conflicts between the brief and existing code were surfaced to the user, not silently
      resolved.
- [ ] Anything that couldn't be grounded was explicitly flagged as unverified.
