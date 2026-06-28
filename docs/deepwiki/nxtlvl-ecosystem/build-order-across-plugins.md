:# Build Order Across Plugins

> Foundational order: which plugin's atoms must exist before another plugin's atoms can stand.

## Layered dependency

```
LAYER 3 · nxtlvl-wiki         reference corpus / production bar
        │ feeds
LAYER 2 · nxtlvl-labs         creation plugin for core artifacts
        │ produces
LAYER 1 · nxtlvl (core)       daily-driver production plugin
        │ rides on
NATIVE   Claude Code          orchestration, dispatch, tool loop, context window
```

## Foundational atoms (must exist first)

### 1. Native Claude Code primitives

- Skill routing, agent dispatch, tool loop, context-window assembly, permission enforcement.
- These are the floor under all three plugins. Nothing is built without them.

### 2. `nxtlvl-wiki` foundational atoms

- Ingestion pipeline for at least one reviewed production harness.
- Query interface that returns synthesized orientation.
- Evidence-boundary policy documented and enforced.
- **Why first:** source-driven development in the labs plugin cannot proceed without a reference corpus.

### 3. `nxtlvl-labs` foundational atoms

- Packaging and plugin identity so the labs plugin can load.
- A minimal meta-builder skill/agent that can author a core artifact.
- A source-driven development workflow (research → compare → decide).
- **Why after wiki:** the labs workflow consumes the wiki as its source.

### 4. `nxtlvl` (core) foundational atoms

- Plugin manifest and local-marketplace install mechanism.
- Layered config and namespace isolation.
- A lean hook layer with fail-open contract.
- A minimal context-assembly policy (CLAUDE.md, memory, SessionStart hook).
- **Why after labs:** while the core plugin is the daily driver, the labs plugin builds its extensions. In practice, some core plumbing may be built before labs is mature, but new core capabilities should come through labs once the labs pipeline is running.

## Build order implications

1. **You cannot source-drive without the wiki.** The wiki should be the first supporting plugin to stand.
2. **You cannot build the core through labs without labs.** Once labs is ready, the core plugin grows primarily through lab promotion.
3. **The core plugin can start with a thin slice.** It does not need all atoms before daily work begins; it needs just enough to carry the first real workflow.
4. **The wiki itself can be thin initially.** It needs only enough reference material to inform the first source-driven decisions.

## Reactive growth order

After the foundational layers exist, growth is reactive by priority:

1. **Real work gap** → handled in native CC / hand-rolled.
2. **Recurring gap** → lab project opened in `nxtlvl-labs`.
3. **Lab project proves value** → promoted to core `nxtlvl` plugin.
4. **Wiki gap discovered** → new reference material ingested into `nxtlvl-wiki`.

## Open questions

- Can the core plugin be built before the labs plugin is mature, or should early core development also be considered "lab work"?
- How much of the wiki must exist before the first source-driven lab project is useful?
- Should the labs plugin's own foundational atoms be built through source-driven development (using the wiki), or are they bootstrapped by the AI collaborator?
