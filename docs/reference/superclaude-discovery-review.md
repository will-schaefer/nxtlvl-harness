> **SuperClaude Framework — discovery/ideation-domain review.** A deep specialist audit of the
> *brainstorm + deep-research* capability across the skills, commands, agents, and modes/core-config
> that encode it. Analyzed 2026-06-20 · 3.6M · v4.3.0 ·
> source: https://github.com/SuperClaude-Org/SuperClaude_Framework.
> Scope: **DOMAIN=skills (spine) · FOCUS=ideation/discovery** (feature-spanning: the two ideation
> *skills* are the scored spine; supporting slices = ideation commands via `commands.md`, ideation
> agents via `agents.md`, ideation modes + `core/` config via `rules.md`). Method: vendor → parallel
> read-only fan-out (3 specialist agents: brainstorm slice · deep-research slice · wiring/composition)
> → skills-spine synthesis. Companion to the [planning-domain review](superclaude-planning-review.md)
> of the same harness.

---

## 1. Spine — the headline judgment

**SuperClaude's ideation domain is the same *strong-in-parts, broken-as-a-whole* pathology its
planning domain has (≈ 2/5) — and two ideation-specific twists make it sharper here.** The
individual artifacts carry real craft: `requirements-analyst.md` is a textbook-clean discovery
persona, `RESEARCH_CONFIG.md` holds a genuine source-credibility taxonomy and multi-hop research
method, the deep-research examples file ships ten differentiated worked scenarios, and the two
ideation skills are honest, lean, executable playbooks. But the connective tissue that would make
them a *discovery system* is absent at every seam, and the two twists are what distinguish this
review from the planning one:

1. **The depth lives in dead files.** Deep-research's entire mechanism — the **445-line
   `core/RESEARCH_CONFIG.md`** (depth profiles, credibility matrix, hop-depth caps, replanning
   thresholds) plus `modes/MODE_DeepResearch.md` and `modes/MODE_Brainstorming.md` — sits under
   `core/` and `modes/`, and `plugins/superclaude/.claude-plugin/plugin.json` **declares neither key**
   (it lists only `commands`, `agents`, `skills`, `hooks`, `mcpServers` — `plugin.json:24-28`). No
   `@import`, no hook injection (`scripts/session-init.sh` only prints a git/token banner). That is
   **500+ lines of unreachable specification** — and it is precisely where the *actual* research
   mechanics live. The capability's most sophisticated component is also its deadest.

2. **The only loaded ideation files are the truncated ones.** The two files the runtime actually
   loads — `commands/brainstorm.md` and `commands/research.md` — are the **stale truncations**. Both
   ship missing their entire `## CRITICAL BOUNDARIES` block: brainstorm drops "STOP AFTER REQUIREMENTS
   DISCOVERY … Will NOT generate code" (`src/.../brainstorm.md:102-122`), research drops "STOP AFTER
   RESEARCH REPORT … Will NOT implement" (`src/.../research.md:105-123`). The complete versions exist
   only in `src/superclaude/`, the **un-shipped pip package** (`pyproject.toml:70`). So the surviving
   live capability is also the degraded one: the scope discipline that keeps brainstorm from sliding
   into design and research from sliding into implementation exists only where Claude Code never reads it.

3. **The capability is encoded 4–7× with no source of truth and no router.** *Brainstorm* = command +
   skill + (dead) mode + (dead) `--brainstorm` flag + `requirements-analyst` agent. *Deep-research* is
   worse: command + skill + (dead) mode + (dead) `RESEARCH_CONFIG` + **two overlapping agents**
   (`deep-research-agent.md` 184 lines and `deep-research.md` 31 lines, colliding on intent). Nothing
   routes between the copies — a grep for cross-references returns only the command's inert
   `personas: [deep-research-agent]` frontmatter (`research.md:7`), a field Claude Code commands have
   no mechanism for. The advertised `--brainstorm`/`--deep-research` flags are prose in unloaded files;
   there is no parser, dispatcher, or router anywhere.

The twist worth naming: the **nominal wired spine — the `skills/brainstorm` and `skills/deep-research`
playbooks — is the *shallowest* encoding of the capability** and composes nothing (skills D4 = 1 on
both). SuperClaude got the one thing right that its planning domain didn't (these skills *are*
declared in the manifest and *do* load), and then made them islands: they reimplement the procedure
the agents and config own, rather than routing to it. The cross-wiring absence **is** the central
finding — the failure feature-spanning Mode C is built to surface, and the third harness in a row
([ruflo discovery](ruflo-discovery-review.md), [SuperClaude planning](superclaude-planning-review.md))
to reach the identical verdict: *a capability is only as good as the routing between its copies, and
here there is none.*

---

## 2. What's there & how it works

The ideation domain spans **two capabilities × up to seven component types each.** Load-status is the
decisive axis — three component types load, three are dead:

| Capability | Skill (WIRED) | Command (WIRED, stale) | Agent(s) (WIRED) | Mode (DEAD) | Core config (DEAD) |
|---|---|---|---|---|---|
| **Brainstorm** | `skills/brainstorm/SKILL.md` (44L) | `commands/brainstorm.md` (99L, truncated) | `agents/requirements-analyst.md` (49L) | `modes/MODE_Brainstorming.md` (44L) | `core/FLAGS.md` `--brainstorm` def |
| **Deep-research** | `skills/deep-research/SKILL.md` (47L) | `commands/research.md` (102L, truncated) | `deep-research-agent.md` (184L) **+** `deep-research.md` (31L) | `modes/MODE_DeepResearch.md` (58L) | `core/RESEARCH_CONFIG.md` (445L) |

**The manifest truth (the load-path).** `plugin.json:24-28` declares exactly `commands`, `agents`,
`skills`, `hooks`, `mcpServers`. The `modes/` and `core/` directories ship real files but **no
manifest key points at them**, no `CLAUDE.md` `@import`s them (root `CLAUDE.md:48,52` names them only
in a descriptive directory-tree comment), and the lone SessionStart mechanism
(`scripts/session-init.sh`) injects nothing — it runs `git status`, echoes a token-budget reminder,
and exits. **Therefore `MODE_Brainstorming.md`, `MODE_DeepResearch.md`, and `RESEARCH_CONFIG.md` are
dead text** — loaded by nothing. The contrast with the planning review is exact: there, the spine
*commands* were stale and the *modes* dead; here the **skills load** (a genuine improvement) but the
richest depth still rots in undeclared directories.

**The two-tree / stale-copy pipeline.** `src/superclaude/` is the pip package (`pyproject.toml:70`
`packages = ["src/superclaude"]`); `plugins/superclaude/` holds the `.claude-plugin/plugin.json`
manifest and is what the Claude Code runtime loads. The two ideation **commands diverge** and
`plugins/` ships the truncation; the modes, agents, and config are byte-identical across trees (and
the two skills exist *only* in `plugins/` — `src/` has just `skills/confidence-check`). So the only
diverged ideation files are the two loadable commands, and the loaded copies are the worse ones.

**How a capability actually fires (and doesn't).** A user types `/sc:brainstorm` or `/sc:research`,
or the model judges the `skills/*/SKILL.md` `description` relevant. Either path inlines its own
restatement of the procedure. **No path delegates:** the command never spawns `requirements-analyst`
or `deep-research-agent` (only the abstract `Task`-for-coordination mention, `brainstorm.md:50`); the
skill composes neither the agent nor the config; the mode that claims to "Activate deep-research-agent
automatically" (`MODE_DeepResearch.md:43`) is never loaded to make the claim true. The model "chooses
to behave" per whichever description happens to match, and the four-to-seven copies drift
independently — the command promises six MCP servers and multi-persona orchestration, the skill
delivers a five-question template, the agent promises PRDs, the dead config holds the real numbers.

**Freshness rot underneath.** Every research artifact names **Tavily** (primary search), **Serena**
(memory), and **Playwright** (extraction) as its engine (`RESEARCH_CONFIG.md:95,98`,
`MODE_DeepResearch.md:44`, `research.md:82-86`, both agents), but the shipped `.mcp.json:2-11`
provides only **context7 + sequential-thinking**. The research domain's named primary search engine
and memory backend resolve to nothing installed — so even if the config loaded, its tool-coordination
tables point at absent servers.

---

## 3. Specialist scorecard

Scored on four rubrics: the spine (**skills**) on the full `skills.md` rubric; supporting slices
(**commands**, **agents**, **modes/core**) on their own rubrics' dominant dimensions. Dominant
dimensions carry ⭐; a fatal flaw there caps the slice rather than being flat-averaged away.

### 3a. Ideation skills (spine) — `skills.md` rubric

| # | Dimension | brainstorm | deep-research | Justification (`file:line`) |
|---|-----------|:----:|:----:|-----------------------------|
| D1 | Description-as-trigger ⭐ | **4** | **4** | Both name concrete phrasings (`skills/brainstorm/SKILL.md:3` "vague requests, want to explore ideas"; `skills/deep-research/SKILL.md:3` "research, investigate, explore … with citations") — fire cleanly; mild collision with the agents' overlapping intent. |
| D2 | Frontmatter correctness | **5** | **5** | `name`/`description` present, well-formed, `name` matches dir (each `SKILL.md:1-4`). |
| D3 | Body-vs-references factoring | **4** | **3** | Both lean (45/48L), no always-on tax — but deep-research is thin *because* the real detail sits unreachable in `core/`, not because it was pushed to `references/`. |
| D4 | **Composition** ⭐ | **1** | **1** | **Cap.** Each reimplements the discovery/research procedure that the agents and config also own; composes no sibling skill, agent, or command (zero cross-references in either body). |
| D5 | Process clarity | **4** | **4** | Executable: numbered steps + a concrete output template a model can follow end-to-end (`brainstorm SKILL.md:10-42`; `deep-research SKILL.md:10-45`). |
| D6 | Single-purpose scope ⭐ | **5** | **5** | One coherent, sharply-bounded job each. |
| D7 | Clarity & maintainability | **4** | **4** | Readable, consistent; body matches description; drift risk only via the un-routed siblings. |

**Spine verdict: ≈ 3/5.** The skills are the *honest* artifacts — they do exactly what they claim and
they actually load. But they are the **shallowest** encoding of each capability and **compose nothing**
(D4 = 1), so the wired delivery vehicle is an island reimplementing depth that exists (dead) elsewhere.

### 3b. Ideation commands (supporting) — `commands.md` dominant dimensions

| # | Dimension | brainstorm | research | Justification (`file:line`) |
|---|-----------|:----:|:----:|-----------------------------|
| D1 | Naming & namespacing ⭐ | **5** | **4** | `/sc:brainstorm` / `/sc:research` — namespaced, self-describing (`brainstorm.md:10`, `research.md:10`). |
| D3 | Thin-wrapper / delegation | **1** | **1** | **Cap.** Both re-inline the full procedure (`brainstorm.md:26-31,54-58`; `research.md:26-63`); neither delegates. The only "link" is inert `personas:` frontmatter (`research.md:7`) for a non-existent command mechanism. |
| D4 | Discoverability & usage ⭐ | **4** | **4** | Clean one-line `description`; flag grammar present — docked because the flags are unparsed prose implying capabilities nothing executes. |
| D5 | Idempotence / safety | **2** | **3** | **The shipped copies dropped their STOP-guards** (`## CRITICAL BOUNDARIES` present only in `src/`), so the boundary that bounded a re-run to spec-only / report-only output is gone from the loaded command. |

**Commands verdict: ≈ 2/5.** Good names, undercut by zero delegation (D3 = 1) and the stale-copy
safety regression.

### 3c. Ideation agents (supporting) — `agents.md` dimensions

| # | Dimension | req-analyst | dr-agent (184L) | dr (31L) | Justification (`file:line`) |
|---|-----------|:----:|:----:|:----:|-----------------------------|
| D1 | Single clear job ⭐ | **5** | **4** | **4** | `requirements-analyst` crisp & fenced (`:39-49`); both research agents coherent, dr-agent sprawling. |
| D2 | Prompt effectiveness ⭐ | **5** | **3** | **3** | req-analyst is output-shaped with success criteria (`:25-37`) — best-written in the domain; dr-agent's method (`:39-58`) leans on numbers (max-hop=5, conf<60%) that live only in the **dead** `RESEARCH_CONFIG`, so they have no backing. |
| D3 | Tool least-privilege | **1** | **2** | **2** | **No agent declares `tools:`** (`:1-5` each) → all inherit Write/Edit/Bash. Discovery/research roles with mutation + shell. Systemic: 0/20 agents in the plugin declare a grant. |
| D4 | Return shape | — | **3** | **4** | dr's explicit `🔗 Sources` table with credibility scores (`deep-research.md:23-29`) is the cleanest return contract in the slice. |
| D6 | Description & triggering | **2** | **2** | **2** | `deep-research-agent.md:3` and `deep-research.md:3` **collide on the same intent** with different output contracts → ambiguous routing; req-analyst overlaps the brainstorm skill + mode. |

**Agents verdict: ≈ 2.5/5.** `requirements-analyst` would score ~4.5 in isolation; the universal
over-grant (D3) and the two colliding research agents (D6) pull the slice down.

### 3d. Ideation modes + core config (supporting) — `rules.md` dominant/decisive dimensions

| # | Dimension | Score | Justification (`file:line`) |
|---|-----------|:----:|-----------------------------|
| D1 | Behavior-shaping effectiveness | **3** | *If loaded*, genuinely substantive — `RESEARCH_CONFIG.md:169-202` credibility matrix, `:206-239` depth profiles, `MODE_DeepResearch.md:25,39` concrete directives. |
| D4 | Pointers-over-content | **2** | `RESEARCH_CONFIG.md` is **445 lines fully inlined** as one YAML wall — the antithesis of pointers-over-content (a heavy always-on tax *if* it were even wired). |
| D6 | **Discoverability / wiring** ⭐ | **1** | **Decisive cap.** `plugin.json` omits `modes`/`core`; nothing `@import`s them; `session-init.sh` injects none. Three behavior-shaping specs (MODE_Brainstorming, MODE_DeepResearch, RESEARCH_CONFIG) + the `--brainstorm` flag = **dead text**. |
| D5 | Freshness | **2** | Names Tavily/Serena/Playwright (`RESEARCH_CONFIG.md:95,98`, `MODE_DeepResearch.md:44`) the shipped `.mcp.json` (context7 + sequential only) doesn't provide. |

**Modes/core verdict: ≈ 1.5/5.** The richest research doctrine in the repo, **capped by D6 = 1** — as
shipped it shapes nothing, and D5 breaks even the hypothetical.

### Strengths (with evidence)

- **`requirements-analyst.md` is the strongest artifact in the domain** — one crisp job, output-shaped
  (5 named Outputs `:32-37`), explicit `Will Not` boundary fencing role bleed (`:39-49`). In isolation
  a ~4.5/5 discovery persona.
- **The two ideation skills are honest and lean** — they do exactly what their descriptions claim, with
  executable templates (`brainstorm SKILL.md:10-42`), and — unlike the planning domain's spine — they
  *actually load*. SuperClaude fixed the manifest-wiring for skills.
- **`RESEARCH_CONFIG.md` is a real research taxonomy** — source-credibility tiers (`:169-202`), depth
  profiles (`:206-239`), multi-hop patterns. Genuine craft; its only failure is that nothing loads it.
- **`deep-research.md`'s sources-table return** (`:23-29`) is the pointers-over-content contract a
  research agent should return — the cleanest return shape in the slice.
- **The `src/` tree shows the authors know what good looks like** — the complete commands carry the
  `## CRITICAL BOUNDARIES` / STOP-after-discovery guards (`src/.../brainstorm.md:102-122`). The intent
  is sound; the build pipeline ships the truncation.

### Weaknesses & risks (the caps)

- **No routing between 4–7 copies per capability (the headline).** Skills, commands, modes, configs,
  and agents each restate the same procedure with no source of truth and no delegation; the only
  cross-reference is the inert `personas:` field.
- **The richest specs are dead (D6 modes/core = 1).** 500+ lines (`RESEARCH_CONFIG` 445 + the two
  modes) loaded by no manifest key — the depth is indistinguishable from absence.
- **The loaded commands are the truncated copies (D5 commands).** The two files the runtime reads
  dropped their STOP-guards; scope discipline survives only in the un-shipped `src/` package.
- **Two colliding research agents (D6 agents = 2).** `deep-research-agent.md` vs `deep-research.md`
  overlap on intent with divergent output contracts → ambiguous routing.
- **Universal tool over-grant (D3 = 1).** 0/20 agents declare `tools:`; discovery/research roles carry
  Write/Edit/Bash.
- **Freshness rot (D5 = 2).** Named MCP engines (Tavily/Serena/Playwright) aren't in the shipped
  `.mcp.json`; token-reduction figures asserted, not measured.

### Headline verdict

**The ideation domain caps at roughly 2/5 — honest skills, broken system.** SuperClaude has the raw
materials of a strong discovery capability: a clean requirements-analyst persona, a thoughtful research
taxonomy, executable lean skills, and (unlike its planning domain) a skills layer that genuinely loads.
But none of it is *wired into a system*: the skills compose nothing and reimplement the depth that
exists elsewhere; the commands don't delegate to the agents built to own the work and ship missing
their safety guards; the modes and the 445-line research config that hold the actual mechanism are
loaded by no manifest key; the agents carry no tool grants and two of them collide on intent; and the
whole capability is duplicated four-to-seven times across component types with nothing routing between
the copies. The dominant cap is the cross-wiring absence (feature-spanning composition), sharpened by
the two ideation-specific facts that make this domain worse than the planning one: **the depth lives in
dead directories, and the only files the runtime loads are the truncated copies.** What's advertised
as a multi-mode "brainstorm + deep-research" framework is, as shipped, a richly-structured
documentation *taxonomy* of discovery behaviors rather than an executable, delegating,
single-source-of-truth system.

---

## 4. Lessons for nxtlvl (negative-space, no ADR)

A neutral domain review, not an adopt/adapt/reject ledger — but the failure modes corroborate
already-locked nxtlvl positions, and this is now the **third** ideation/discovery review
([ruflo](ruflo-discovery-review.md), [SuperClaude planning](superclaude-planning-review.md)) to land
the same structural verdict:

- **A capability encoded N times with no router is N maintenance liabilities** — validated yet again.
  nxtlvl's router-as-loaded-floor-brief and single-source-of-truth discipline are confirmed by contrast.
- **A "feature" is only real if something *loads* it.** The manifest is the receipt: SuperClaude's
  modes and `core/` config are dead text because `plugin.json` omits their keys. Judge the wiring (the
  manifest key, the `@import`, the hook), never the README — the same claims-vs-wiring lens that
  surfaced ruflo's lying memory.
- **Depth in an undeclared directory is indistinguishable from dead text.** The 445-line
  `RESEARCH_CONFIG.md` is the most sophisticated ideation artifact in the repo and it shapes zero
  behavior. Pointers-over-content only helps if the pointer is *loaded*.
- **A `src/`↔`plugins/` two-tree layout silently ships the stale copy** unless the build guarantees
  byte-equality — and here it ships the copy missing the safety guards. Relevant to nxtlvl's
  `sandbox/` → `plugins/` promotion discipline (the move *is* the activation; one tree, no drift).
- **A missing `tools:` grant is not default-safe — it's max-privilege.** nxtlvl's
  read-only-by-withheld-tools (context-scout, idea-critic) is enforced by the grant; SuperClaude's
  zero-grant discovery agents are the anti-pattern.

No finding here is architectural-and-expensive-to-reverse for nxtlvl; all are confirmations, so no ADR.
