# nxtlvl Core Plugin — Open Gaps

> What is still undefined or exploratory in the core plugin architecture.

## 1. Source-driven copy-or-create criteria

The anchor now says "source-driven, copy-or-create as justified," but the concrete decision criteria are not yet recorded.

- What dimensions are compared when choosing copy vs. create?
- What is the default bias, if any?
- Is the decision documented per component, or is it a global policy?
- Governing decision: `ADR-003` is being revised.

## 2. Audit concrete rubric

The audit is described at a high level but the concrete rubric items are not yet finalized.

- Which checks are objective blockers vs. warnings?
- How is the rubric versioned?
- Does the audit verify the source-driven decision trail for promoted components?
- Governing decision: `ADR-014` is currently a draft.

## 3. Hook safety and context assembly details

The policies are directional but not fully explored.

- Are there any deliberate session-level gates beyond `dangerous-bash.js`?
- How is the context budget enforced in practice?
- What is the token ceiling for each auto-injected block?

## 4. Promotion mechanism from labs

The exact path from a lab artifact to a core artifact is still being explored.

- File move within the repo? Package publish? Spec-driven reimplementation?
- Who approves the promotion?
- What gates must the artifact pass?

## 5. Workflow domains beyond phase 0

The phase-0 workflows (review, dev, research) are scaffolded. The agent-building workflow is reactive.

- What is the full set of workflow domains the harness will eventually cover?
- Which workflows are in scope for the company foundation vs. deferred?

## 6. Capability domains beyond confident core

The confident-core domains (Python, TS/JS, Rust, Frontend & UI, Backend/Architecture) are pre-built. Other domains remain reactive.

- Which domains are required for the first income-generating work?
- How do domains get admitted through the scope gate?

## 7. Custom tools

Custom tools (C6) are currently OPEN.

- Are they needed, or do MCP tools cover the action surface?
- If needed, what is the first use case?

## 8. Stop / SubagentStop / Notification hooks

These hooks are currently OPEN.

- Is a stop-slop gate needed?
- Should subagent lifecycle events be observable?
- Are notification hooks useful for the daily driver?
