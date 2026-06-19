---
description: Launch the nxtlvl doc-keeper agent to record an ADR, document a shipped feature, or reconcile docs that have drifted from the code. Pass what you want documented as the argument.
argument-hint: [what to document — e.g. "ADR for the context-budgeted injection decision" or "reconcile README with the new hook surface"]
---

# Doc-Keeper

Dispatch the **`nxtlvl:doc-keeper`** agent to handle a documentation task. The agent runs in its own context, loads the `documentation-and-adrs` skill as its source of truth for format/threshold/conventions, and returns a structured report (status / summary / changed / verification / next_actions).

## What This Command Does

1. **Forward the request** — Launch the `nxtlvl:doc-keeper` agent (Agent tool) with `$ARGUMENTS` as the documentation task. If no argument was given, ask the user what to document before launching — don't guess the intent.
2. **Let the agent classify** — doc-keeper applies the ADR-worthy test and routes to the right artifact (ADR vs `docs/spec/` vs `docs/plan/` vs changelog/README, or amends an existing ADR).
3. **Relay the report** — The agent's final message is the deliverable. Surface its `status`, the `changed` files, and any `next_actions` (e.g. an ADR supersession that needs follow-up) to the user.

## When to Use

Use `/doc-keeper` when:

- An architectural decision was just made and needs an ADR.
- A feature shipped and the changelog / README / public-API docs need updating.
- Docs have drifted from reality and need reconciling.
- An open question resolved and should fold into an existing ADR.

## Stop Conditions

doc-keeper will stop and return `needs-input` rather than guess when ADR-worthiness is ambiguous, the decision isn't sharp enough to document, a new decision contradicts an existing ADR, or the canonical source of truth is unclear. When that happens, relay its question — it may point you to `/interview-me`, `/grill-me`, `/spec`, or `/plan` to sharpen the decision first.
