# nxtlvl-core

The harness itself: the `nxtlvl` plugin's executable code, the machine-global agent
configuration it deploys, and the tooling that keeps both honest. This glossary names the
domain concepts that code is about — it is not a specification and holds no implementation
detail.

Architecture terms (**module**, **interface**, **depth**, **seam**, **adapter**, **leverage**,
**locality**) are defined once for the whole family in
[ADR-038](docs/decisions/ADR-038-code-architecture-vocabulary-and-review.md) and are not
repeated here.

## Harness registry

**Component**:
A deployable unit the harness knows about — a plugin, a server, an external tool. Owns
capabilities.
_Avoid_: package, extension

**Capability**:
A single thing a component offers an agent: a skill, a command, an agent definition, a hook, a
server. The grain the registry tracks and deploys.
_Avoid_: feature, tool, function

**Catalog**:
The declared, hand-authored description of what components and capabilities exist. Intent, not
observation.
_Avoid_: manifest, config

**Registry state**:
The durable record of what is *meant* to be deployed and what fingerprint was last applied.
Distinct from the catalog (declaration) and the snapshot (observation).

**Snapshot**:
A point-in-time observation of what is actually present and running, assembled from providers.
The answer to "what is real right now", never to "what should be".
_Avoid_: status, state

**Provider**:
A source of observed truth about one host agent's installed capabilities — what Claude Code sees,
what Codex sees. Providers are read; they are never written to directly.

**Projector**:
Turns desired state into a candidate deployment for one host agent, and decides what counts as
family-managed versus external. The write-side counterpart to a provider.

**Journal**:
The append-only event record of what the registry did. Runs are derived from it; it is never
edited in place.

**Parity**:
Agreement between what the registry believes is deployed and what the providers observe. Its
absence is **drift**.

**Authority**:
The phase in which the registry, rather than hand-editing, is the source of truth for
deployment. Reached by **cutover**; before it, the registry only observes and compares.

**Bench**:
To mark a capability as deliberately not deployed, without removing it from the catalog. The
opposite of **active**.
_Avoid_: disable, archive

## Context and memory

The subsystem that watches a session, learns from it, and hands the next session what it needs.
Written out in full — never abbreviated in persisted text.

**Observation**:
One recorded tool call, with its input and output, appended to the session's log. The raw
material everything downstream is distilled from.
_Avoid_: event, trace, log line

**Observer**:
The detached process that reads accumulated observations and distils them into instincts. Runs
outside the session it learns from.

**Instinct**:
A learned habit inferred from observations — a durable statement about how work in this project
tends to go, carrying a confidence that decays with age. Scoped to one project, or global once
promoted.
_Avoid_: memory, lesson, rule, preference

**Effective confidence**:
An instinct's stored confidence after time decay. The number every gate and readout uses;
the raw stored value is an implementation concern.

**Recall**:
Selecting which instincts are strong enough to inject at session start. A quality gate, not a
lookup.

**Bookmark**:
The dated "where I left off" note written when a session ends and read when the next one starts,
grouped by branch. May be **stale** — contradicted by activity recorded since it was written.
_Avoid_: checkpoint, save state

**Scrubbing**:
Removing secrets from an observation before it is ever persisted. A precondition of the write
path, not a cleanup pass over stored data.
_Avoid_: sanitizing, redacting

**Project identity**:
The irreversible key that decides which observations, instincts, and bookmarks belong together.
Worktrees of one repository share it; separate clones do not.
_Avoid_: project id, workspace key

**Cluster**:
A group of strong instincts sharing a domain topic, classified as exactly one of agent, skill,
or command — the raw material for graduating learned habits into authored capabilities.

**Graduation**:
Promoting something proven out of its incubating state into the real thing it was becoming —
an instinct cluster into an authored capability, or a lab cell into a shipped one.
_Avoid_: promotion (reserved for lifting a project instinct to global scope)

**Fallback**:
A session reaching past the harness for an external tool it should not have needed. Counted,
because its rate falling is the harness's north-star reliability signal.

## Hook layer

**Hook**:
Code the host agent runs at a lifecycle moment — session start, session end, before or after a
tool call. Hooks **inform**; they do not force.

**Briefing**:
What a session is handed at start: recalled instincts, the freshest bookmark, and whatever else
earned its place in the budget.

**Gate**:
A hook that can refuse an action. Rare, explicitly whitelisted, and always killable — every
other hook fails open to a no-op.
_Avoid_: guard, blocker, validator

**Drift** (agent-tool):
An agent's declared tool list disagreeing with what it actually reaches for. Distinct from
registry drift, which is about deployment.

## Multi-agent configuration

**Surface**:
One coding-agent command-line interface the family targets — Claude Code, Codex, Devin, Grok,
Antigravity. Named this way because each presents a different face onto the same guidance.
_Avoid_: platform, client, target

**Portable source of truth**:
Guidance authored to be valid for every surface, with no surface-specific mechanics in it.
The thing that is written; supplements are what is generated.

**Residue**:
The mechanical remainder a surface cannot read natively, emitted so that surface behaves like
the others. Only ever the difference — never a filtered copy of the portable source.
_Avoid_: shim, polyfill, output

**Supplement**:
A per-surface instruction file carrying that surface's residue. Additive to the portable source,
never a replacement for it.
