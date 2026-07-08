---
id: ADR-026
title: "nxtlvl-wiki becomes a queryable MCP source — wiki-scout orients, never testifies"
status: Draft
date: 2026-07-01
---

# ADR-026: nxtlvl-wiki becomes a queryable MCP source — wiki-scout orients, never testifies

## Context

nxtlvl is adding `wiki-driven-development`, an nxtlvl-owned skill that turns two things that today
are only prose doctrine into an actual invokable capability: [ADR-003](ADR-003-build-from-scratch.md)'s
ruling that workflows are built "source-driven with `nxtlvl-wiki` as the source," and
`nxtlvl-labs`' `IDEAS.md` idea **A14** (ground new-capability discovery in `nxtlvl-wiki`'s catalogue
of production harness patterns). This mirrors how `deepwiki-scout` and `context7-scout` each turned
a secondary/primary knowledge source into a live tool rather than leaving it as intent no one
actually invokes.

`nxtlvl-wiki`'s trust posture is already settled — [ADR-002](ADR-002-reference-corpus-nxtlvl-wiki.md):
"orientation and leads, never evidence... secondary sources orient; primary sources testify." That
doctrine has so far only governed manual, prose-level surveying during harness reconstruction; it
has never been wired to a dedicated agent + skill the way DeepWiki
([ADR-024](ADR-024-deepwiki-orientation-not-evidence.md)) and Context7
([ADR-025](ADR-025-context7-testifies-primary-sources.md)) each were. The plugin's `.mcp.json` has
two entries today (`deepwiki`, `context7`), both remote HTTP; `nxtlvl-wiki`'s actual query interface
— a 4-tool local stdio server (`search`/`list`/`get_page`/`get_source`) — is registered only in
`nxtlvl-labs`' own `.mcp.json`, unreachable from any other session.

The load-bearing question is the same shape as ADR-024/025: what role does this new source play
once wired in, and what agent shape carries it. Because ADR-002 already ruled `nxtlvl-wiki`
leads-only (DeepWiki's tier, not Context7's testify tier), that part inherits rather than needs
fresh deliberation — but wiring an actual `.mcp.json` entry, a new isolated agent, and a new
consumer skill is itself a new architectural surface (the plugin's third MCP dependency), the same
"expensive to reverse" bar that earned 024/025 their own ADRs.

Recorded per the global decision rule (`~/.claude/rules/decisions.md`).

## Decision

**`nxtlvl-wiki` joins the plugin's own `.mcp.json` as a third server, queried through a new
read-only `wiki-scout` agent that inherits ADR-002's already-decided leads-only posture — never
Context7's citable-testify tier.**

1. `plugins/nxtlvl/.mcp.json` gains a third entry, `nxtlvl-wiki` — a local stdio server
   (`node <absolute path to nxtlvl-wiki-mcp/src/server.ts>`). Its corpus resolution is independent
   of launch cwd (it resolves via `import.meta.url` to the sibling `nxtlvl-wiki` repo), so it
   behaves identically whether invoked from `nxtlvl`, `nxtlvl-labs`, or any other session.

2. `wiki-scout` is read-only by withheld tools — only the four
   `mcp__plugin_nxtlvl_nxtlvl-wiki__*` tools (`search`/`list`/`get_page`/`get_source`), no
   Read/Write/Edit/Bash/Glob/Grep — reusing the isolated-agent pattern
   ([ADR-018](ADR-018-ideation-domain.md)) that `deepwiki-scout` and `context7-scout` already
   established.

3. **Leads, not evidence — inherited, not re-litigated.** Every claim `wiki-scout` returns is
   stamped `LEAD — verify at source`, exactly like `deepwiki-scout`'s discipline, because ADR-002
   already ruled `nxtlvl-wiki`'s trust tier. Two lookup modes, both leads-only:
   - **general** — concept/pattern pages, the wiki's synthesized cross-harness knowledge layer.
   - **repo** — the repo-reference layer specifically (entity pages + comparison overlays that
     `nxtlvl-wiki:repo-keeper` maintains) — grounds a claim against how a *specific ingested repo*
     actually does something, narrower and more concrete than a general pattern page.

4. **Graceful degradation, never a hard dependency.** Corpus unreachable or near-empty (today's
   actual state — the real corpus is still thin) → the scout returns a one-line "no results" or
   "corpus sparse" note and never blocks the caller. Most invocations legitimately returning little
   today is expected, not a defect; the capability activates further as the corpus grows, with zero
   further build work.

5. **Consumer skill: `wiki-driven-development`.** Composes `wiki-scout` to formalize ADR-003's
   workflow-construction doctrine and `IDEAS.md` A14 into an invokable check: before or while
   building a new capability, orient against what `nxtlvl-wiki` already knows.

Realized as: a `nxtlvl-wiki` entry in `plugins/nxtlvl/.mcp.json`, the `wiki-scout` agent, and the
`wiki-driven-development` skill.

## Alternatives Considered

### Give wiki-scout Context7's testify tier (citable claims)
- Pros: richer artifacts; claims could be cited directly.
- Cons: ADR-002 already settled this — `nxtlvl-wiki` is a synthesized layer over ingested secondary
  material, not a primary source; letting its claims testify would contradict a standing ruling for
  no new benefit.
- Rejected: ADR-002's boundary is deliberate; this ADR inherits it rather than reopening it.

### Skip the dedicated agent; call the MCP tools directly from the consumer skill
- Pros: one fewer file; simpler.
- Cons: breaks the established pattern (every third-party knowledge source gets an isolated
  read-only scout — ADR-018/024/025); loses the structural, not just prompted, guarantee that a
  leaked citation is impossible; loses the scout's reusability across future consumer skills.
- Rejected: consistency with the existing two scouts, and the structural guarantee, are worth the
  one extra file.

### Wait until the real corpus is populated before wiring this in
- Pros: avoids shipping a capability that mostly returns "no results" today.
- Cons: the wiring (server registration, agent, skill) is the harder, more durable work; the corpus
  growing is a separate, ongoing concern (`nxtlvl-wiki`'s own ingest pipeline) this ADR doesn't own
  or block on. Shipping now means the capability activates automatically as the corpus grows.
- Rejected: no reason to gate infrastructure on content that grows independently.

### Don't build this; keep nxtlvl-wiki as prose-only doctrine
- Pros: zero new surface.
- Cons: leaves ADR-003's "source-driven with `nxtlvl-wiki` as source" and `IDEAS.md` A14 as intent
  no one actually invokes — the same gap DeepWiki/Context7 each closed for their own sources.
- Rejected: the gap is real and the pattern for closing it is already proven twice.

## Consequences

- **Completes the three-source trust-tier framework** ADR-024/025 started: DeepWiki = orient,
  Context7 = testify-with-URL+version, `nxtlvl-wiki` = orient (DeepWiki's tier, formally wired for
  the first time).
- **The plugin gains its third `.mcp.json` server** — non-load-bearing; degrades to a one-line note
  if the corpus is unreachable or sparse.
- **`wiki-driven-development`, and any future consumer skill, can compose `wiki-scout` without
  re-litigating trust posture** — it is inherited from ADR-002 by construction.
- **Directly unblocks `nxtlvl-labs`' harness-lab intake design**
  (`docs/intent/harness-lab-intake-methodologies.md` in that repo), whose Stage 1
  "Overlap + Discovery" enrichment names this capability as a dependency.
- Cross-links: [ADR-002](ADR-002-reference-corpus-nxtlvl-wiki.md) (trust posture inherited, not
  re-decided), [ADR-018](ADR-018-ideation-domain.md) (isolated-agent pattern reused),
  [ADR-024](ADR-024-deepwiki-orientation-not-evidence.md) (sibling leads-only doctrine, direct
  format template), [ADR-025](ADR-025-context7-testifies-primary-sources.md) (contrasting testify
  tier).
