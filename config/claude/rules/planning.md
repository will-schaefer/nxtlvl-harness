# Planning rule

**Scope:** how any plan is shaped before work starts — plan mode, written plans under
`docs/plan/`, and any ordinary reply that lays out more than a couple of steps. Independent
tasks are dispatched to **parallel subagents** by default; running them one after another is
the exception and must be justified out loud.

A *subagent* is a separate agent instance with its own fresh context that does one task and
reports back. Several can run at the same time.

## The rule

- **Partition first.** Before writing the steps, split the work into tasks and mark which ones
  do not depend on each other.
- **Fan the independent ones out.** Dispatch them to subagents running concurrently — **up to 6
  at a time**. With more than 6, run the first 6 and queue the rest.
- **Dispatch in one message.** Concurrent subagents must be requested as multiple tool calls in
  a *single* message. Spread across separate messages they run one after another, which defeats
  the point.
- **Show the partition.** The plan states which tasks run in parallel, which must wait, and why.
  The shape of the work is visible before any of it starts.
- **Justify every sequential step.** Choosing to run something on the main thread instead of
  fanning it out is a decision the reader can disagree with, so state the reason.

## When sequential is correct (the exceptions)

- **Real dependency** — the second task consumes the first task's output. Chain them.
- **Same-file writes** — two tasks editing one file will collide. Either serialize them, or give
  each agent its own git worktree so they cannot overwrite each other.
- **Too small to brief** — a subagent starts with none of the session's context. When explaining
  the task would cost more than doing it, do it inline.
- **Needs human judgment** — anything requiring a decision from the person stays on the main
  thread. Subagents do work; they do not choose direction.
- **Explicitly declined** — the person asked for it to be done directly.

## Triggers

- **About to enter plan mode or write a plan document?** Partition into parallel and sequential
  tracks *before* listing steps, and name the subagent for each parallel task.
- **Writing a numbered approach in an ordinary reply?** Same rule — informal plans are still
  plans.
- **Agents that will write files?** Give each one an isolated git worktree, or serialize them.
- **Work too large for one context** (broad audits, sweeps, migrations across many files)? That
  is the strongest case for fanning out — say so and do it.
- **Reporting results?** Relay what the subagents actually returned. Never state a pending
  agent's findings before it has reported.

## What not to do

- Don't fan out work that only *looks* independent — check for shared files first.
- Don't spawn an agent for a single file read or one search; that is slower than doing it.
- Don't bury the parallel structure in prose. It is the most useful part of the plan.
- Don't let "parallel by default" become "parallel regardless" — the exceptions above are part
  of the rule, not loopholes.
