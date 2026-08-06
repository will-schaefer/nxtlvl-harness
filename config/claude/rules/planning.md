# Planning rule

**Scope:** how any plan is shaped before work starts — plan mode, written plans under
`docs/plan/`, and any ordinary reply that lays out more than a couple of steps. Independent
tasks are dispatched to **parallel subagents** by default; running them one after another is
the exception and must be justified out loud.

A *subagent* is a separate agent instance with its own fresh context that does one task and
reports back. Several can run at the same time.

## Pointers

- **Which shape to fan out into** — the workflow-pattern catalogue at
  `~/Developer/nxtlvl/nxtlvl-wiki/master-workflow-pattern-list.md`. This rule decides *whether*
  to parallelize; the catalogue names the *shape*. Without it a plan splits work six ways and
  gives every agent the same generic brief.
- Straight to the fan-out question: **B6 parallel dispatch, isolation and merge**, **B3
  delegation — teams versus subagents**, **B4 worker and judge architectures**, **B1
  coordination shapes**. Where the answer is *don't split*, Part A carries the single-agent
  shapes and Part C the human-in-the-loop gates.
- Every row links the wiki page holding the full treatment plus the raw source note it cites —
  follow those rather than planning off a one-line summary.

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
- **Quality outranks parallelism.** Fanning out is the default because it is usually both faster
  and better. Where it would be faster but *worse*, it is the wrong call — the point is a good
  result, not a busy one. Say which case applies and work sequentially.
- **Where quality is equal, speed wins.** Being faster is a sufficient reason to fan out on its
  own — it needs no further justification. Two independent tasks that each take real time go to
  two agents, even though doing them one after the other would also have worked.

**The decision, in order:**

1. **Would splitting make the result worse?** If yes, stay sequential and say which case applies.
2. **Otherwise, would splitting finish sooner?** If yes, fan out. That is the whole test.
3. If neither — no quality cost, no time saved — it does not matter. Do it inline.

## When not to fan out

Two different reasons to stay sequential, matching the two tests above. The second group is
damage — it fails test 1 and is a genuine veto. The first group is simply where there is no
time to save, so test 2 comes back negative; it is **not** a licence to work sequentially
whenever splitting feels like effort.

### There is no time to save

- **Real dependency** — the second task consumes the first task's output. Chain them.
- **Nothing to split** — one file, one function, one question. Partitioning it invents seams
  that are not there.
- **Too small to brief** — a subagent starts with none of the session's context. When explaining
  the task would cost more than doing it, do it inline.
- **Reassembly costs more than the split saves** — if reconciling several partial answers into
  one coherent result is the bulk of the work, doing it once in one pass is cheaper.
- **Explicitly declined** — the person asked for it to be done directly.

### Fanning out would hurt the result

- **Coherence work** — anything that must speak with one voice or one design sensibility: an
  interface being designed, a document being written, a schema, a naming scheme, a refactor
  applying a single idiom. Split six ways it comes back in six dialects, and stitching them
  together loses more than the parallelism gained. One head, one pass.
- **Context-heavy work** — the task depends on nuance accumulated over this conversation.
  A subagent starts blank, the re-brief is lossy, and it will fill the gaps confidently rather
  than ask. Where the context *is* the work, keep it where the context lives.
- **Underspecified work** — while real questions are open, an agent guesses instead of asking,
  and returns something plausible and wrong. Resolve the ambiguity first; then fan out.
- **Tight iteration** — debugging and diagnosis, where each result reframes the next question.
  Parallel guesses are not a substitute for a feedback loop.
- **Output you cannot cheaply verify** — more agents then means more unchecked claims, not more
  progress. Fan out where you can tell good work from bad on return.
- **Same-file writes** — two tasks editing one file will collide and corrupt each other. Either
  serialize them, or give each agent its own git worktree.
- **Needs human judgment** — anything requiring a decision from the person stays on the main
  thread. Subagents do work; they do not choose direction.

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
- Don't let "parallel by default" become "parallel regardless" — the cases above are part of the
  rule, not loopholes in it. A plan that fans out work needing one coherent pass has not
  followed this rule; it has broken it.
- Don't fan out to look thorough. Six agents on a job that wanted one careful pass is worse
  output dressed up as more effort.
- Equally, don't reach for these exceptions to avoid the work of partitioning. If tasks are
  genuinely independent, split them — "it felt easier to do it myself" is not one of the cases
  above. Where quality is untouched, the only remaining question is whether it finishes sooner;
  if it does, fan out.
- Don't stay sequential merely because the tasks are each doable inline. Doable is not the test —
  faster is.
