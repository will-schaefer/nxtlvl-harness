# Idea seed — "TS labs" + the `agents-wiki` MCP server

> **STATUS: rough idea seed for an ideation pass — NOT an approved spec, NOT a plan.**
> Scope is **unconfirmed on purpose.** Feed this to a fresh nxtlvl ideation session
> (`nxtlvl:brainstorming` → `interview-me` / `grill-me` / `idea-refine`) to **stress-test
> the scope**, then proceed to `spec-driven-development`. Every "provisionally locked"
> decision below is open to re-litigation.
>
> **Origin:** a brainstorming session on 2026-06-22 produced this as its handoff artifact.
> The owner paused *before* the spec handoff to run the scope through more ideation in a
> separate session. This file is self-contained so that session needs no prior context.

---

## 1. The idea, in one paragraph

Build an **`agents-wiki` MCP server** that the **nxtlvl-labs** consume while building agent
capabilities — a read-only, queryable interface over an existing **Karpathy-style LLM-wiki**
of agent-harness / agentic-engineering knowledge. As part of the same effort, take all of
**nxtlvl-labs to TypeScript** — the new MCP server is greenfield TS, and the two existing
labs (`harness-lab`, `evals-lab`, currently plain Node JS) get **ported to TS**. The MCP is
the design-heavy piece; the ports are behavior-preserving. **The central thing to
stress-test is whether "all three in one build" is the right scope** (§5).

## 2. What "agents-wiki" actually points at (a resolved ambiguity — keep it resolved)

The colloquial name "agents-wiki" resolves to the **live corpus of a separate repo**, not to
the dir literally named `agents-wiki/`:

- **Corpus = `llm-wiki/wiki/` + `llm-wiki/raw/`** — the live, maintained knowledge base.
  `llm-wiki/` is its **own git repo** at `/Users/willschaefer/Developer/llm-wiki`, a
  Claude-maintained Karpathy-style wiki for *agent harnesses & agentic engineering*.
  - `wiki/` — Layer-2 synthesized pages (~69 md, 4 clusters: `harness-internals`,
    `harness-engineering`, `frameworks-platforms`, `research-foundations`). Each page has a
    strict **frontmatter floor** (`title`, `type` ∈ concept|entity|comparison|moc|source-note,
    `tags[]`, `sources[]`, `related[]`, dates), `[[wikilinks]]`, footnote citations `[^n]`,
    and a `## Sources` block. `index.md` is the top MOC; each cluster has its own `moc` page.
  - `raw/` — **Layer-1 immutable** source notes, cited by `wiki/` pages.
  - Schema/constitution: `llm-wiki/CLAUDE.md`. It maintains itself via `/ingest`, `/lint`,
    `/process-inbox` commands.
- **NOT** `llm-wiki/archive/agents-wiki/` — that's an older, **superseded** wiki the
  constitution explicitly marks dormant and lists under non-goals. Do not index it.

**Implication that drives the design:** the corpus is a graph-shaped, strictly-schema'd
knowledge base. That schema *is* the query surface (search by tag/type, get-by-slug, traverse
`related`/`[[wikilinks]]`/backlinks, resolve a citation to its `raw/` source).

## 3. Provisionally locked decisions (from the brainstorm — challengeable in ideation)

| # | Decision | Rationale | How firm |
|---|----------|-----------|----------|
| D1 | Wiki = **knowledge corpus about building agents** (not an index *of* our cells) | Net-new value; the cell inventory is already covered by `ledger.md` + the domain-catalog | strong |
| D2 | Corpus = **live `llm-wiki/wiki/` + `raw/`** (not the archived `agents-wiki/`) | The archive is superseded per the wiki constitution | strong |
| D3 | Server is **strictly read-only** | The wiki self-maintains via `/ingest` + a `/lint` gate; writing would corrupt the schema | strong (treat as forced, not chosen) |
| D4 | **Transport = stdio** (local process, launched via `.mcp.json`) | It reads local files; no remote surface needed | medium |
| D5 | **Placement = `sandbox/nxtlvl-labs/agents-wiki/`** | Lives with its consumer, off the discovery path (ADR-031); clear git-mv promotion later | medium |
| D6 | **Language = TypeScript for all of nxtlvl-labs** | The labs are contracts-as-code (seam/manifest/scorecard); types enforce the seams; Node 24 type-stripping kills the "no build step" objection | strong on TS, see §5 on scope |
| D7 | **Search = keyword + structured** over files read live (no embeddings) | 69 curated, tagged, wikilinked pages; semantic is over-engineering for v1 | medium |
| D8 | Wiki path via **`AGENTS_WIKI_ROOT` env** (cross-repo), default to resolved sibling path | The corpus is a separate repo | medium |

**Platform fact that underpins D6:** runtime is **Node v24.12.0**, which has *stable native TS
type-stripping* — `node x.ts` and `node --test x.ts` run `.ts` directly, no `tsc` build, no
`tsx`. So TS keeps the labs' zero-build ergonomics. Type-check separately with `tsc --noEmit`.
(Constraint: erasable syntax only — no `enum`/`namespace`/param-properties.)

## 4. Design sketch (the MCP)

**Data model** — one record per `wiki/` page, parsed live: `slug`, `cluster`, `path`,
parsed `frontmatter`, `body`, derived `outboundLinks` (every `[[…]]`), `backlinks` (computed
across corpus), `citations` (`[^n]` → resolved `raw/` source).

**Five read-only tools** (prefix `wiki_`):

| Tool | Input | Returns |
|------|-------|---------|
| `wiki_search` | `query`, opt `tags[]`/`type`/`cluster`/`limit` | ranked `{slug,title,type,cluster,tags,snippet,score}` |
| `wiki_get_page` | `slug` | `{frontmatter, body, related, sources, outboundLinks, backlinks}` |
| `wiki_list` | `by: cluster\|type\|tag\|moc` (+ `value`) | `{slug,title,type,tags}[]` |
| `wiki_related` | `slug` | resolved `{related, outboundLinks, backlinks}` |
| `wiki_get_source` | `path` (a `raw/` note) | `{path,title,body}` — claim → primary source |

Zod input/output schemas + `structuredContent`/`outputSchema`; annotations
`readOnlyHint:true, openWorldHint:false, idempotentHint:true`. Actionable errors (missing
`AGENTS_WIKI_ROOT`, unknown slug → suggest `wiki_search`/`wiki_list`). Freshness is free —
read live (mtime-keyed cache), no precomputed index to go stale as `/ingest` adds pages.

**Proposed layout:**
```
sandbox/nxtlvl-labs/agents-wiki/
  package.json · tsconfig.json · README.md · .mcp.json
  src/ server.ts · corpus.ts · schema.ts · tools/{search,get-page,list,related,get-source}.ts
  test/ *.test.ts  (fixture = a tiny sample wiki carrying the real schema)
  evals/ agents-wiki.eval.xml  (mcp-builder Phase 4: 10 realistic Q&A)
```

**The TS port (both labs):** rename `.js`→`.ts`, add annotations, run directly on Node 24
type-stripping, `node --test` on `.ts`, `tsc --noEmit` as the type gate. **Acceptance =
existing test suites pass unchanged, zero behavior change.** Same `bin/` surface, same gate
semantics (ADR-033), same seam contract.

## 5. Open questions to stress-test (this is why we're ideating, not spec'ing)

1. **BUILD SCOPE (the big one).** All three in one build (MCP + both ports) vs **phased**
   (MCP first on greenfield TS, prove the pattern, then port the labs) vs ports-first? The
   owner is explicitly unsure. Weigh: focus/risk vs one-coherent-TS-sweep. *(Owner leaned
   "do it all now" because the labs were quick to build originally — pressure-test that.)*
2. **Is the labs migration warranted at all,** or only the greenfield MCP in TS while the
   working+tested JS labs stay as-is until there's a reason to touch them?
3. **Tool surface** — are 5 tools right? Is `wiki_related` worth a separate tool or fold into
   `wiki_get_page`? Any missing query shape (e.g. "what links here", MOC-walk, tag cloud)?
4. **Search mechanism** — keyword+structured (D7) vs semantic/embeddings. Re-judge against
   real lab queries, not page count.
5. **Cross-repo coupling** — `llm-wiki` is a *separate repo*. Is `AGENTS_WIKI_ROOT` config
   robust? What if the wiki moves / is absent? Should the server instead live *inside*
   `llm-wiki/` (rejected in the brainstorm for ownership reasons — revisit)?
6. **Read-only forever?** Confirm there is never a write path (e.g. cells recording eval
   links back into the wiki). If ever yes, it's a different, ADR-heavy beast.
7. **Eval strategy** — mcp-builder's 10-Q XML vs converging onto `evals-lab` (the lab whose
   whole job is measuring). Noted as future, not coupled — decide if that changes now.
8. **Promotion path** — when/whether to graduate `sandbox/nxtlvl-labs/agents-wiki/` to
   `plugins/nxtlvl/` and register in the existing `plugins/nxtlvl/.mcp.json`.
9. **Naming** — `agents-wiki` vs `llm-wiki-mcp`; tool prefix `wiki_`.

## 6. Candidate ADRs (validate during ideation; record via the decision rule, don't pre-write)

- **ADR-034 (next free #): nxtlvl's first authored MCP server** — read-only, stdio, cross-repo
  over a sibling corpus; sets the MCP authoring + consumption pattern.
- **ADR-035: TypeScript as the nxtlvl-labs language standard** — supersedes the implicit JS
  choice; records the Node-24 type-stripping rationale.

Both are *candidates* — they only get written if ideation confirms them as architectural +
expensive-to-reverse (per `~/.claude/rules/decisions.md`). Curate hard; don't dilute the set.

## 7. Out of scope (holding the line unless ideation overturns)

Semantic/embedding search · any write tools · indexing the archived `agents-wiki/` · migrating
the native `plugins/` tree to TS · graduating to `plugins/nxtlvl/` now (stays sandbox-first
until proven).

## 8. Context pointers for the new session (orient fast, don't re-derive)

- **The labs:** `sandbox/nxtlvl-labs/harness-lab/` (cells incubation: `bin/{new-cell,eval,graduate,ledger}.js` + tests, `cells/pointer-summary/`, `ledger.md`, `inbox.md`, `docs/{process,seam-contract,plugin-manifest-reference}.md`) and `sandbox/nxtlvl-labs/evals-lab/` (`bin/run-eval.js` + `lib/` + `__fixtures__`).
- **The corpus + its rules:** `llm-wiki/CLAUDE.md` (schema constitution), `llm-wiki/index.md` (top MOC), a representative page `llm-wiki/wiki/harness-internals/context-anxiety.md`.
- **Governing ADRs:** `docs/decisions/` — ADR-031 (labs in sandbox), ADR-032 (cells stage-as-data; dogfood as project skills), ADR-033 (three-part objective graduation gate), ADR-014 (quality first over leanness), ADR-012 (agents execute / skills hold knowledge).
- **Existing specs:** `docs/spec/nxtlvl-harness-lab.md`; `sandbox/nxtlvl-labs/evals-lab/nxtlvl-evals-lab.md` (+ `-plan.md`).
- **MCP precedent (consumed, not authored):** `plugins/nxtlvl/.mcp.json` registers deepwiki + context7.
- **Authoring references:** the `document-skills:mcp-builder` skill (server design, Phase-4 evals); the vendored `plugin-dev` `mcp-integration` skill at `sandbox/nxtlvl-labs/harness-lab/vendor/plugin-dev/skills/mcp-integration/SKILL.md` (stdio/SSE/HTTP transports).

## 9. Recommended route for the new session

1. Open in the **Developer** repo. Read this file + the §8 pointers it needs.
2. Run **`nxtlvl:brainstorming`** (it routes); for the §5 scope question specifically, go to
   **`grill-me`** (relentless branch-by-branch) — that's the decision the owner wants tested.
3. Use **`idea-refine`** if you want divergent scope variants (all-at-once / phased /
   MCP-only) before converging.
4. Once scope is confirmed: **`spec-driven-development`** writes the contract to `docs/spec/`,
   recording any confirmed ADR via the decision rule; then **`planning-and-task-breakdown`**.
5. Implement the MCP with **`document-skills:mcp-builder`** (TypeScript path), labs port per §4.
