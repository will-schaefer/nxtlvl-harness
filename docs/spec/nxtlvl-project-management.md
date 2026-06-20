# Spec: `nxtlvl` Project Management domain — Phase 1

> SDD Phase: **Specify**. Implements the decision recorded in
> [`ADR-028`](../decisions/ADR-028-project-management-domain-manage-and-see.md).
> **Scope: Phase 1 only** — the shared **state library**, the plan-file **status schema** (the
> load-bearing contract), and the read-side **Status** capability. Phase 2 (standalone dashboard)
> and Phase 3 (Backlog grooming) appear here as forward pointers, **not** contract.
> **Status: DRAFT — awaiting human review before implementation.**

## Objective

Give `nxtlvl` a read-side window into plan state. Parse a plan's tasks out of its markdown and
report **where a project stands** — counts by status, % done, the next task, and what's blocked —
without hand-counting checkboxes.

Per [ADR-028](../decisions/ADR-028-project-management-domain-manage-and-see.md) the PM suite
*manages and sees*; it does **not** execute. So Phase 1 **only reads**. It is the foundation the
Phase-2 dashboard and Phase-3 backlog grooming build on: all three consume the same state library
and the same status schema.

**Users:** the harness operator running a multi-month build across many `docs/plan/*.md` files;
and (later) the `pm-reporter` agent and the dashboard server, which consume the same library.

**Success looks like:** from any plan/todo markdown, get an accurate status brief in one command;
every existing plan parses unchanged.

---

## The status schema (load-bearing contract)

The schema **extends** the existing house convention (`- [ ]` / `- [x]` checkboxes, **bold stable
IDs**, `## Phase N — …` headings, glyph annotations 🤖/🧑/◇) — it does not replace it. The status
glyphs are **purely additive**: files using only `[ ]`/`[x]` parse correctly with no edits.

### Task line grammar

```
- [<box>] [<status-glyph>]? **<ID>** [<annotation-glyph>]* <description>
```

| Token | Values | Meaning |
|-------|--------|---------|
| `<box>` | ` ` (space) / `x` or `X` | open vs. done |
| `<status-glyph>` (optional, refines an **open** task) | `⏳` / `⛔` | in-progress / blocked; absent on an open task ⇒ todo |
| `<ID>` | bold token, e.g. `**T5**`, `**Checkpoint A**`, `**D-event**` | the **stable key** |
| `<annotation-glyph>` (existing, 0+) | `🤖` / `🧑` / `◇` | agent-verifiable / manual gate / decision-to-lock |
| phase | nearest preceding `## Phase N — <name>` heading | grouping |

### Resolved status (precedence — tolerant, contains-based)

1. box is `[x]` → **done** (status glyphs ignored).
2. else line contains `⛔` → **blocked**.
3. else line contains `⏳` → **in-progress**.
4. else → **todo**.

Contains-based matching makes the parser tolerant of glyph position, because existing files vary
(`**T1** 🧑 …` vs. `◇ **D-event** …`). A line that is both `[x]` and `⛔` resolves to **done** and
is recorded as a **lint warning** (contradictory markers), never a hard failure.

### Examples

```markdown
## Phase 1 — Hook 1 rebuild
- [x] **T2** 🤖 Default → 200K at both sites …          ← done
- [ ] ⏳ **T3** 🤖 Two-stage state machine …            ← in-progress
- [ ] ⛔ **T5** 🤖 PreCompact pointer (waits on D-docsel) ← blocked
- [ ] **Checkpoint A** 🧑 Install; real crossing …      ← todo
```

### Backward-compatibility guarantee

Every current plan/todo (only `[ ]`/`[x]`) parses correctly: `[ ]` ⇒ todo, `[x]` ⇒ done. The new
glyphs are additive; **no existing file is edited** to adopt the schema. A fixture built from a
real current file proves this (see Testing Strategy).

### Parsed shapes (the library's read contract)

```js
// one task
{ id, status, description, phase, annotations: { agentVerifiable, manualGate, decision }, line, raw }

// one plan
{
  planPath, title,
  phases: [ { name, tasks: [ /* task */ ] } ],
  tasks:  [ /* flat, in document order */ ],
  counts: { todo, doing, blocked, done },
  pctDone,            // round(done / total * 100), 0 when no tasks
  next,               // first in-progress, else first todo, in document order; null if none
  blocked: [ /* tasks */ ],
  warnings: [ /* lint strings: contradictory markers, duplicate IDs, … */ ]
}
```

---

## Tech Stack

- **Node** (matches the existing hook tooling; `node --test` for tests). **Zero new dependencies** —
  the parser is plain string/line work, no markdown-AST library.
- **Input:** markdown under `docs/plan/*.md` (plans and their `*-todo.md` checklist companions).
- **native Task tool** = the live in-session surface. Phase 1's durable truth is the **file**; any
  Task-tool surfacing is a thin convenience, not a second source of truth (see Open Questions).

## Commands

```
Test:        node --test plugins/nxtlvl/skills/project-management/lib/*.test.js
Run Status:  /pm-status [plan-file]        # provisional name; default target = most-recently-
                                           # modified docs/plan/*.md (reuses the Hook-2 D-docsel rule)
```

## Project Structure

Built **sandbox-first** per `CLAUDE.md` (staging tree off the discovery path; promote with
`git mv`). Proposed layout — exact `lib/` home to be confirmed against the plugin (Open Question 1):

```
sandbox/skills/project-management/
  SKILL.md                     → methodology: the status schema (this contract) + status-brief format
  lib/plan-parser.js           → markdown → parsed-plan shape (the read contract above)
  lib/plan-parser.test.js      → node --test fixtures (existing-format, new-glyphs, edge cases)
sandbox/commands/pm-status.md  → the Status entry point (loads the library, prints the brief)
# pm-reporter agent deferred — Status runs inline in Phase 1; the isolated read-only agent earns
# its keep at Portfolio / cross-plan scope (Phase 2).
```

On promotion: `git mv sandbox/skills/project-management plugins/nxtlvl/skills/` (and the command).

## Code Style

Match the existing Node hook style (small, dependency-free, fail-soft). One real shape — the
status brief the Status command prints:

```
context-awareness-hooks-todo  ·  Phase 2 — Hook 2 (PreCompact)  ·  64% done
  done 7  ·  in-progress 1  ·  blocked 1  ·  todo 2   (11 tasks)
  next:     ⏳ T5  PreCompact pointer
  blocked:  ⛔ D-docsel  lock active-doc rule before T5
```

Conventions: stable IDs are never synthesized — if a task has no bold ID, it is parsed with
`id: null` and surfaced in `warnings`. Parsing is total (never throws on malformed lines; it
collects warnings and returns what it can) — read-side reporting must degrade, not crash.

## Testing Strategy

- **Framework:** `node --test` (as `context-alert.test.js` already does).
- **Fixtures** in `lib/__fixtures__/`:
  1. a copy of a **real current todo** (only `[ ]`/`[x]`) — proves the backward-compat guarantee;
  2. a **new-glyph** plan (⏳/⛔ across phases) — proves status resolution + precedence;
  3. **edge cases:** contradictory `[x]`+`⛔` (→ done + warning), missing ID (→ warning), no tasks
     (→ empty set, `pctDone: 0`), duplicate IDs (→ warning), glyph before vs. after the ID.
- **Coverage expectation:** every branch of the status-resolution precedence + every `warnings`
  emitter has a test. Summary math (`pctDone`, `counts`, `next`) tested on a known fixture.

## Boundaries

- **Always:** keep parsing **total** (collect warnings, never throw); preserve the
  backward-compat guarantee (a real-file fixture enforces it); `node --test` green before promote.
- **Ask first:** any change to the **status schema** itself (it is a contract three Phase-2/3
  consumers depend on); adding a runtime dependency; the final `lib/` location and command name.
- **Never:** **write** to plan files in Phase 1 (read-only — writes are Phase 2 via the atomic,
  versioned path); synthesize stable IDs; couple to GitHub issues (rejected in ADR-028).

## Success Criteria

1. `node --test` green, including the real-current-file fixture (backward-compat proven).
2. From `context-awareness-hooks-todo.md`, the brief reports the correct counts, `pctDone`,
   `next`, and `blocked` set — verified by hand against the file.
3. The four status states resolve per the precedence table, tolerant of glyph position.
4. Malformed input yields a brief + warnings, never a crash.
5. Built in `sandbox/`, off the discovery path, until explicitly promoted.

## Open Questions

1. **`lib/` home** — under the skill (proposed, travels with the skill) vs. a shared
   `plugins/nxtlvl/lib/` (if the dashboard server in Phase 2 should share it without depending on a
   skill dir). Confirm against the plugin's existing layout.
2. **native Task-tool integration depth in Phase 1** — surface live session tasks in the brief, or
   keep Phase 1 strictly file-derived and add the Task-tool overlay in Phase 2 with the dashboard?
   (Lean: file-only in Phase 1.)
3. **Command name** — `/pm-status` vs. a verb (`/status` risks collision). Pin at Tasks time.
4. **Deferred to Phase 2 (write side):** the atomic, **versioned** write path + optimistic
   concurrency — this is where the [ADR-025](../decisions/ADR-025-project-identity-observer-concurrency.md)
   atomic-write cross-link the doc-keeper flagged becomes load-bearing. If the write contract
   diverges from ADR-025's model, amend ADR-025 or open a new ADR (per the doc-keeper's note).
