---
name: review
description: nxtlvl review — runs the agent-skills five-axis code review (correctness, readability, architecture, security, performance), refined for my conventions. Use when reviewing a diff or changed files before merge, or when the user asks for a code review.
---

<!-- OFF-DOCTRINE (2026-06-28): this skill *composes* `agent-skills:review`. ADR-003 now requires
     workflow substance to be built from scratch (source-driven, nxtlvl-wiki as source). The
     delegation below stands and works until then; rebuild from scratch when review work next recurs. -->

Invoke the `agent-skills:review` workflow on the current diff. Apply nxtlvl conventions:

- **Language-plural:** pull the right reviewer for the changed files (Next.js / Python / Rust) rather than a single generic pass.
- **Surface assumptions:** state what you assumed about intent or environment, so a wrong assumption is visible rather than silent.
- **Pointers over dumped content:** reference `file:line` and link; do not paste large blocks back.

Produce a report addressing all five named axes. $ARGUMENTS
