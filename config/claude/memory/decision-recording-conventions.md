---
name: decision-recording-conventions
description: "How the user records architectural decisions — now formalized as the global decision rule at ~/.claude/rules/decisions.md (ADRs in docs/decisions/, YAML frontmatter, curated)."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: fddd4a8f-5ec8-4d8e-9ed6-e0f2cd0a22dc
---

**Now formalized as the GLOBAL decision rule** at `~/.claude/rules/decisions.md` (triggered from
`~/.claude/CLAUDE.md`). **Defer to that file** — it is the source of truth for the ADR-worthy
threshold, the `/interview-me`→`/grill-me`→`/spec`→`/plan`→`/documentation-and-adrs` pipeline, the
YAML-frontmatter format override, lifecycle, global/project layering, and the audit earmark
(integrity may block / completeness warns only). Created 2026-06-17.

**Quick recall (full detail in the rule file):** ADRs live in `docs/decisions/` (`ADR-NNN-slug.md`
+ a `README.md` index), YAML frontmatter (`id`/`title`/`status`/`date`, `+implementation`/
`superseded-by`), body **Context · Decision · Alternatives Considered · Consequences**,
superseded-never-deleted. An ADR is *only* for a genuinely architectural, expensive-to-reverse
decision — exclude verified facts (→ spec), methodology/sequencing (→ plan), and resolved
open-questions that fold into an existing ADR. Don't dilute the set.

**Scope today** is ADR-worthy decisions only; the rule is consciously designed to grow into a full
decision-tier ladder (everyday ask-vs-proceed) later.

**Why:** the harness *is* its decisions; the *why* + rejected alternatives must outlive the code so
future humans/agents don't re-litigate settled choices.

**How to apply:** when a deserving decision is made, follow the rule file. Relates to
[[nxtlvl-harness]] and [[compose-on-native-quality-first]].
