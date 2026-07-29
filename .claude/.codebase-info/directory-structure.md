# Directory structure

*Last Updated: 2026-07-28*

Organizing principle: **by delivery channel** — see [architecture.md](./architecture.md). For the
"where do I put a new thing" rules, see [structure.md](./structure.md).

## Annotated tree

```
nxtlvl-core/
├── CLAUDE.md                    Always-on project instructions (portable across agent tools)
├── GEMINI.md                    → symlink to CLAUDE.md
├── package.json                 3 scripts; Node >=24.12; 2 dev dependencies
├── tsconfig.json                Type-check only (noEmit), strict, erasableSyntaxOnly
│
├── plugins/                     ── CHANNEL 1: needs commit → push → plugin update ──
│   ├── nxtlvl/                  The main plugin
│   │   ├── plugin.json          name: nxtlvl, namespace: false
│   │   ├── .mcp.json            DeepWiki + Context7 HTTP servers
│   │   ├── mcp_config.json      Server config
│   │   ├── skills/              14 skills — brainstorming, review, call-model, router, …
│   │   ├── agents/              9 agent definitions — mostly read-only scouts
│   │   ├── commands/            13 slash-command front doors
│   │   ├── hooks/               9 registrations + hooks.json; tests colocated
│   │   ├── lib/                 13 modules behind the hooks; tests colocated
│   │   ├── scripts/             install-nxtlvl.sh, project-snapshot.sh
│   │   └── references/          context7-grounding.md
│   └── agent-dev/               Older plugin; continuous-learning-v2 is the shell/Python
│                                predecessor of the Context and Memory subsystem. Legacy.
│
├── config/                      ── CHANNEL 2: symlinked live into ~/.claude ──
│   ├── claude/
│   │   ├── CLAUDE.md            Global instructions
│   │   ├── link.sh              Creates the symlinks into ~/.claude
│   │   ├── settings.json        Global settings
│   │   ├── statusline-command.sh
│   │   ├── rules/               7 pointer-style rule files (see below)
│   │   ├── skills/              browser-use, learned, no-ai-slop, project-graveyard
│   │   ├── memory/              Memory notes + MEMORY.md index
│   │   └── output-styles/
│   └── helix/                   Editor config
│
├── docs/                        ── CHANNEL 3: inert until read ──
│   ├── decisions/    (66 files) 39 architecture decision records + README index
│   ├── reference/    (51 files) Distillations of reviewed external harnesses — the durable record
│   ├── deepwiki/     (32 files) DeepWiki-sourced material
│   ├── plan/         (24 files) Execution breakdowns
│   ├── spec/         (12 files) Written contracts
│   ├── superpowers/   (4 files) Specs in the superpowers format
│   ├── diagrams/      (4 files) Standalone linkable diagram artifacts
│   ├── intent/        (2 files) personal-harness.md — the anchor document
│   └── ideas/         (1 file)
│
├── scripts/                     Build and analysis tooling
│   ├── multi-cli-compiler/      Compiles Claude config into what other agent tools need
│   └── adr/                     Decision-record dependency graph (own tsconfig.json)
│
├── sandbox/                     Staging tree, deliberately OFF the discovery path
│   ├── README.md                skills/ · agents/ · commands/ — mirrors the plugin shape
│
├── tasks/                       plan.md, todo.md
├── .github/                     labels.yml + the label-sync workflow
├── .claude/                     This workspace (live-rules.md, .codebase-info/, settings)
├── .codex/ .devin/ .grok/       Per-agent-tool configuration emitted by the compiler
│
└── (gitignored)
    ├── reference/               Temporary clones of harnesses under review — deleted after
    │                            distilling into docs/reference/
    ├── *-workspace/             Throwaway experiments (compiler-backup, nxtlvl-router, review)
    └── node_modules/
```

## The seven rule files

`config/claude/rules/` — each is a **pointer** file: it states a trigger and names where the real
knowledge lives, rather than inlining it. This is the token-budget policy in practice.

| File | Governs |
|---|---|
| `decisions.md` | When a decision earns a record, and the record format |
| `memory.md` | What belongs in always-on context versus on-demand |
| `hooks.md` | The fail-open safety contract for hooks |
| `git-workflow.md` | Commit format, pull-request flow, the plugin deploy step |
| `plain-language.md` | No invented shorthand; spell terms out |
| `approved-acronyms.md` | The exhaustive allow-list for the rule above |
| `visual-docs.md` | Design documents carry structural diagrams |

## Directories that are not what they look like

- **`sandbox/`** mirrors the plugin's shape but is invisible to the harness. Promotion is a
  `git mv` into `plugins/nxtlvl/`.
- **`reference/`** (gitignored) holds temporary clones. The durable record is `docs/reference/`.
- **`.codex/`, `.devin/`, `.grok/`** are *outputs* of `scripts/multi-cli-compiler/`, not
  hand-maintained configuration.
- **`docs/decisions/.understand-anything/.trash-*/`** contains discarded scratch files from a
  third-party tool. Ignore it; it is not project code.

## Related

- [structure.md](./structure.md) — where new things go
- [entry-points.md](./entry-points.md) — what actually executes
