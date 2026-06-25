# Agent runtime primer — what a runtime is, what's inside one, and the build-vs-compose ledger

*Captured 2026-06-24. A from-first-principles explainer of the agent-runtime layer, written to
ground the nxtlvl build-vs-compose decision: nxtlvl is today a Claude Code **plugin** (it composes
on the platform's runtime); this doc explains what **owning a runtime** would actually mean.
Self-contained; grounded in the vendored `reference/` harnesses where useful. Not a plan — a map.*

---

## 1. What an agent runtime actually is

A large language model, by itself, can't *do* anything — it's a function that takes text in and
produces text out, and it has amnesia: it remembers nothing between calls. An **agent runtime is
the program wrapped around that model that turns "text in, text out" into "goal in, work done."**
It holds the conversation, owns the connection to the model's API, lets the model *request actions*
(tool calls), actually *executes* those actions, feeds the results back to the model, and repeats —
until the goal is met or a stop condition fires. If the model is the brain, the runtime is the body
and nervous system: hands to act, eyes to observe, a spinal cord (the loop) connecting perception to
action, and a skull (permissions/sandboxing) that keeps it from hurting itself.

**Using a runtime vs. owning one** is the crux:

- **Using one (composing on top — what nxtlvl is today).** A host runtime (Claude Code) owns the
  loop. It calls the model, dispatches tools, manages context, renders the terminal. You write
  *skills, agents, commands, hooks, config* that the host loads and runs at well-defined extension
  points. You shape behavior without owning execution. You are a passenger directing a driver who
  built the car.
- **Owning one (running your own loop).** You write the `while` loop yourself. You hold the API key,
  build the message array, parse the model's tool-call requests, execute them, and decide when to
  stop. You're the driver *and* you built the car.

> **Analogy.** Composing on Claude Code is **writing a browser extension** — the browser hands you
> deep hooks but owns the render engine, network stack, JS runtime, and security sandbox. Owning a
> runtime is **writing the browser itself.** Both are legitimate; they differ by one to two orders
> of magnitude in scope, and — crucially — by how much *control below the extension points* you get.

---

## 2. The core loop

Every runtime, from a 200-line toy to Claude Code, has the same beating heart — the **agent loop**
(a.k.a. the ReAct loop: Reason + Act):

```
assemble context → call model → model responds
                                    ├── final answer (no tool calls) → emit, STOP
                                    └── tool call(s) → execute → observe → append → repeat
```

The single least-intuitive fact: **the model is stateless between every call.** It does not "stay
running" while tools execute. Each iteration is a fresh, independent API call where you re-send the
entire accumulated transcript. The loop is what manufactures the *illusion* of one continuous agent
out of N separate, amnesiac model calls.

**One full turn** — user types *"find what's failing in the tests and fix it":*

1. **Assemble.** Build one request payload: system prompt + tool definitions (each with a schema) +
   conversation history + the new user message.
2. **Infer.** Send it to the model API; get back a response. This time it's not prose — it's a
   structured request: *"call `run_bash` with `{cmd:"npm test"}`."*
3. **Decide.** The runtime sees a tool call (not a final answer), so it acts.
4. **Execute + observe.** It runs `npm test`, captures stdout/stderr (*"3 failing — TypeError at
   foo.js:42"*). That captured output is the **observation**.
5. **Append.** It adds two messages to history: the assistant's tool-call request, and a tool-result
   message carrying the observation.
6. **Repeat.** Back to step 2 — now the payload includes the failure. The model responds
   `read_file("foo.js")` → observe → append → `edit_file(...)` → `run_bash("npm test")` →
   *"all passing"* → a **final text answer**. No tool call → the loop exits.

The model never "saw" the test suite run. It only ever saw *text describing* what happened, fed back
on the next iteration. That's the entire trick.

---

## 3. The components, one at a time

The loop is the skeleton. These are the muscle and organs. For each: what it is, what it does, an
analogy, and why it's easy to start but hard to finish.

### a) Inference / model client
The code that talks to the LLM API. Builds the request (model id, messages, tool schemas,
`max_tokens`, temperature), sends it, reads the **streamed** response token-by-token, reassembles
streamed *tool calls* from partial fragments, and handles every failure mode (429 rate limits, 529
overloaded, timeouts, dropped connections, auth expiry) with retries/backoff. *Analogy:* a phone
line to a brilliant consultant with total amnesia — restate the whole context every call, and the
line can drop mid-sentence. *Easy/hard:* a basic non-streaming call is ~20 lines; the hard 90% is
streaming (especially tool-call deltas), robust retry/backoff, partial-response recovery, token
accounting, prompt-cache management, and the long tail of provider error modes. Pure reliability
engineering — where production hours disappear.

### b) Context & conversation management
Keeper of the message history and assembler of the **context window** (the model's fixed maximum
visible token budget, e.g. 200K). Every turn it must fit *system prompt + tools + full history + new
input* inside that ceiling; as the conversation grows it must **compact** (summarize older turns)
or evict, while *budgeting* what's worth keeping. *Analogy:* a fixed-size whiteboard — to keep
writing at the bottom you summarize and erase the top. *Easy/hard:* appending to a list is trivial;
deciding *what* to compact and *when*, summarizing without losing the thread, accurate per-provider
token counting, never orphaning a tool-result from its tool-call (breaks the API contract), and
keeping the prefix byte-stable for caching is one of the deepest, most quality-sensitive problems.

> **nxtlvl note.** This is the component that most affects *quality*. A 1M-token model still
> degrades around 150–200K. Good context management isn't merely "fit under the cap," it's "keep
> the working set *small enough to stay sharp*" — strictly harder, and one of the few genuinely
> loop-level levers a plugin can't fully reach.

### c) The tool system
The agent's hands. Three sub-jobs: **(1) Definition** — declare each tool's name, description, and
input schema (JSON Schema) so the model knows it exists and how to call it; these descriptions are
*part of the prompt*, so tool design *is* prompt design. **(2) Dispatch + execution** — route a tool
call to its handler, validate args, run it, capture the result. **(3) Result formatting** — turn raw
output into something the model can read, truncating huge dumps, encoding *errors as observations the
model can react to* rather than crashes. Plus **permissions/sandboxing** — gating dangerous actions
(allowed commands, writable paths, network allow-lists), confirmation prompts, kill switches.
*Analogy:* the difference between a brain in a jar and a brain with hands, eyes, and a workshop —
but you must childproof the workshop. *Easy/hard:* one tool ("read a file") is trivial; a *safe,
general* tool system is among the hardest parts of a runtime. (nxtlvl's `dangerous-bash` gate is
exactly this surface — and it still throws false-positives and matches raw command strings rather
than intent. "Just block dangerous commands" is deceptively deep — and that's *one tool's* guardrail.)

### d) Instruction assembly
How the system prompt + skills + memory + rules get composed into the payload *each turn.* The
system prompt is standing identity/conventions; **skills** are modular capability instructions loaded
on demand; **memory** is recalled facts injected as context. *Analogy:* a chef's *mise en place* —
before each dish you lay out exactly the right ingredients within arm's reach; too much clutters the
counter (context bloat), too little and you're missing something. *Easy/hard:* concatenating a static
prompt is easy; *dynamic, selective* assembly — injecting the right skill, recalling the relevant
memory, keeping the prefix cache-stable, staying within budget — is subtle.

> **nxtlvl note.** This is where nxtlvl actually lives. Its skills, router, and MEMORY.md pointer
> system are instruction-assembly craft layered on someone else's loop. Most of the harness's
> identity is *here* — and almost none of it requires owning the loop.

### e) Orchestration & subagents
Delegating part of the job to a fresh **subagent** — a separate loop with its own context window,
its own (often narrower) toolset and prompt — then folding its result back into the parent. *Why:*
isolate noisy exploration (the child burns *its own* context, returns a tight brief), parallelize
independent work, enforce least-privilege (read-only scouts). *Analogy:* a manager delegating to
specialists who work in their own office (context) and hand back a one-page memo, not their whole
desk. *Easy/hard:* spawning one child and awaiting a string is easy; parallel coordination, result
merging, knowing *when* delegation beats inline work, passing *just enough* context, and preventing
runaway recursion (Trellis ships an explicit anti-recursion guard) are hard. nxtlvl already leans on
this (context-scout, idea-critic, doubt-reviewer, harness-review fan-outs) — all on Claude Code's
subagent machinery.

### f) Skill / capability discovery & routing
Given a task, decide *which* capability applies, and load it. Two families: **model-driven** (put
short descriptions of every capability in context, let the model pick — "description-triggered") and
**explicit routing** (a router/meta-skill maps task → capability deterministically). *Analogy:* a
library — routing is the catalog plus the librarian; without it the books exist but nobody finds
them. *Easy/hard:* a handful of always-loaded skills is easy; scaling to *many* without stuffing
every description into context, and routing *accurately*, is hard. The recurring failure mode (seen
across `reference/` in ruflo, SuperClaude): capabilities **"encoded N× but routed 0×"** — present on
disk, unreachable in practice. A capability the model never *sees* effectively does not exist.

### g) Memory & persistence
State across three timescales: **session state** (the live transcript), **checkpoints** (resumable
snapshots for crash recovery / "continue where you left off"), and **long-term memory** (facts that
survive across sessions — nxtlvl's `memory/*.md` + MEMORY.md index *is* this). *Analogy:* RAM (the
transcript) vs. a notebook kept between meetings (long-term) vs. a save-game file (checkpoint).
*Easy/hard:* an append-only log is easy; *recall* is the whole ballgame — which memories are relevant
*now*? A real design fork: vector-DB similarity vs. curated files (ruflo's vector memory degrades
into *lying* with fabricated similarity scores; curated files can't). Plus the recurring "non-atomic
write corrupts state on crash" flaw seen across the scripts-review sweep.

### h) Hooks / lifecycle extensibility
Interception points *around* the loop where custom logic runs — before a tool (block/modify/approve),
after (observe/learn), on session start/end, before compaction, on prompt submit, on stop. *Analogy:*
middleware in a web server, or tripwires around the loop. *Easy/hard:* firing an event and running a
script is easy; doing it *safely* is hard — a buggy *blocking* hook can lock you out of your own agent
(nxtlvl rule: gates are advisory, never a session hook that could brick the daily driver; the
dangerous-bash gate has a kill switch and fails open). Passing untrusted tool input to a shell hook
is a real injection vector (several vendored harnesses interpolate `$TOOL_INPUT` raw). nxtlvl's
context-awareness alerts and C&M learning subsystem are hook-driven, on Claude Code's hook events.

### i) The interface
How input arrives and output streams back — CLI/TUI, an API/server, an IDE extension, a web app.
Streams tokens as they generate, renders tool calls/results legibly, handles interrupts (Ctrl-C must
stop the loop cleanly without corrupting state). *Analogy:* the cockpit — dials and controls over the
engine; the same engine can wear different cockpits. *Easy/hard:* printing a final answer is easy;
live streaming UI, partial-output rendering, and clean interrupt handling are hard. (CodeWhale's real
loop lived *inside* its TUI crate — interface and loop entangled, a structural smell.)

### j) Config, packaging & distribution
How the runtime is configured (settings files, env vars, model selection, permissions), packaged
(a binary, an npm package, a plugin), and shipped/updated (install, version-pin, hot-reload).
*Analogy:* the car's settings panel, the dealership, and the recall/update system. *Easy/hard:*
reading a JSON config is easy; a coherent *layered* config model (global vs. project vs. local, with
precedence), safe hot-reload, versioning, and distribution are real work. (Even *as a plugin*,
installed nxtlvl is a SHA-pinned cache snapshot needing a manual promote — distribution is nontrivial
already; owning a runtime means owning *all* of it.)

---

## 4. How they fit together

```
                          ┌──────────────────────────────┐
                          │  interface (CLI / TUI / API)  │   ← i/o & infra
                          │  prompt in · tokens out       │
                          └───────────────┬──────────────┘
                                          │
  SUPPORTING (subsystems)                 ▼                 CORE LOOP (the engine)
  ┌──────────────────────┐    ┌────────────────────────┐
  │ instruction assembly ├───▶│ 1. assemble context     │◀──────────────┐
  │ memory & persistence ├───▶│    compose window·route │               │
  │ context manager      ├───▶│    skill                │               │
  └──────────────────────┘    └───────────┬────────────┘               │
                                          ▼                             │
                              ┌────────────────────────┐                │
                              │ 2. model client         │                │
                              │    send · stream · retry│                │ repeat
                              └───────────┬────────────┘                │
                                          ▼                  spawn       │
                              ┌────────────────────────┐  ┌──────────────┴──┐
                              │ 3. decide ──────────────┼─▶│ subagents       │
                              │    tool call or final?  ├─▶ final answer → user (stop)
                              └───────────┬────────────┘                │
  ┌─────────────────┐                     ▼                             │
  │ pre-tool hook   ├────────────▶┌────────────────────────┐           │
  │ gate · block    │             │ 4. execute tool         │           │
  └─────────────────┘             │    dispatch · sandbox   │           │
                                  └───────────┬────────────┘           │
  ┌─────────────────┐                         ▼                         │
  │ post-tool hook  ├────────────▶┌────────────────────────┐           │
  │ observe · learn │             │ 5. observe + append     ├───────────┘
  └─────────────────┘             │    result → history     │
                                  └────────────────────────┘
  ──────────────────────────────────────────────────────────────────────────
  config · packaging · distribution — underpins every component above
```

The blue spine (steps 1–5) is the loop you'd *own* if you went DIY. Everything else hangs off it.
Notice how little of the picture is the actual loop — that asymmetry is the whole decision.

---

## 5. The native-vs-DIY ledger

What Claude Code gives you free today vs. what you'd build and *maintain forever* by owning the loop.

| Component | Free from the platform | What you take on by building it |
|---|---|---|
| **Inference client** | Hardened API calls, streaming, tool-call parsing, retries/backoff, caching, model selection | Reimplement all of it; own every API error mode; track provider changes |
| **Context management** | Auto context tracking, compaction near the cap, token accounting | Your own compaction, token counting, tool-call/result integrity, cache-stable prefixes |
| **Tool system** | A mature toolset (files, bash, search, web, MCP), dispatch, formatting, **sandbox + permissions** | Build + sandbox every tool; design the whole permission/approval/kill-switch model |
| **Instruction assembly** | Skill loading, CLAUDE.md layering, memory injection, assembly order | *Mostly kept as-is* — it's prose + config; you already own the substance |
| **Orchestration / subagents** | Agent spawning, parallel fan-out, result collection, isolation, registry | Your own spawn/await/merge, recursion guards, context-passing protocol |
| **Skill discovery / routing** | Description-triggered loading, the registry, `/`-command wiring | Build the registry + routing; solve discoverability yourself |
| **Memory & persistence** | Transcripts, checkpoints, resume, the memory + recall plumbing | Durable, atomic, non-corrupting state; recall that actually retrieves relevantly |
| **Hooks / lifecycle** | 8+ documented events with a safe, sanitized invocation contract | Define + fire every event; get fail-open/closed and injection-safety right |
| **Interface** | The whole TUI, streaming render, interrupts, IDE/desktop/web surfaces | Build + maintain a streaming TUI (and lose IDE/desktop/web entirely) |
| **Config / packaging / dist** | Plugin packaging, marketplace, SHA-pinned installs, hot-reload, updates | Your own install/update/versioning; no marketplace; no upstream improvements |

> **The quiet headline.** Read top-to-bottom and **instruction assembly is the only row where owning
> the loop changes almost nothing** — because nxtlvl's substance (skills, router, memory discipline,
> ADRs, doubt/idea-critic patterns) is *prose and config*, not loop code. The part of the harness you
> actually care about already lives *above* the line a runtime owns. Building a runtime would buy
> control over the rows you've barely had to think about, while leaving the rows you've invested in
> exactly where they are.

**Grounding from `reference/`:** the harnesses that *do* own their loops show the real burden.
**deepagents** (~4.4/5) stays sane only by *not* owning inference — it composes over LangGraph
(renting the loop from a framework). **CodeWhale** owns a genuine Rust loop and pays for it: the real
loop is entangled in a 320K-line TUI crate, two runtimes, plus a 363-line CI drift-checker just to
keep it from rotting. **ruflo** owns memory and it *lies* (fabricated similarity scores in degraded
mode). Owning the loop made none of them better than nxtlvl — it made them carry more.

---

## 6. The minimum viable runtime

**The irreducible core (a working agent — roughly a weekend):**
1. An **inference client** that sends messages + tool schemas and gets back tool-call requests (non-streaming is fine).
2. A **message list** you append to — naïve context management.
3. A **tool system** with ≥1 real tool, plus dispatch and result-formatting.
4. **The loop** — the `while` that calls the model, runs tools, appends results.
5. A **stop condition** — "no tool call" plus a max-iteration cap.
6. A **trivial interface** — read stdin, print stdout.

Six pieces, a few hundred lines, and you have a real agent. This is why "build my own runtime" *feels*
approachable — the core genuinely is.

**Becomes mandatory almost immediately (not optional for real use):** compaction (you overflow fast),
error handling + retries (the API *will* 429/529), permissions (a shell *will* eventually run
something you don't want).

**Polish / advanced (what makes it trustworthy and pleasant):** streaming UI, subagents/orchestration,
skill routing, long-term memory + recall, hooks, checkpoints/resume, layered config, packaging/
distribution, prompt caching, multi-provider support.

**The honest shape:** the loop is the tip of the iceberg; trustworthiness is the mass below the water.
A weekend buys a demo; a year buys something you'd actually rely on.

---

## The trade-off, and the deciding question

**What you gain by owning the loop** is *control below the extension points.* Anything a plugin
fundamentally cannot reach becomes possible: a custom stop condition or loop topology; compaction
tuned for your *quality band* (the 150–200K degradation point) rather than the model's hard cap; a
multi-agent topology the platform doesn't offer; true model-agnosticism across providers; novel
control flow with no hook.

**What you lose** is everything the platform silently maintains: a hardened inference client,
streaming, compaction, the tool sandbox + permission model, the TUI, IDE/desktop/web surfaces,
distribution and updates, prompt caching — and the steady stream of upstream improvements you get
free as a guest. You also trade *building your harness* for *maintaining a runtime*.

And: **almost none of nxtlvl's identity actually requires owning the loop.** Its skills, router,
memory discipline, ADRs, and doubt/idea-critic patterns are instruction-assembly and orchestration
*craft* — they compose fine on top. Building a runtime to keep them would be rebuilding the entire
body to keep the same brain and the same skills.

So the decision reduces to one sharp question:

> **Is there a specific capability I want that lives *below* the extension points Claude Code gives
> me — something I genuinely cannot reach as a plugin — and is it worth permanently taking on the ten
> maintained components to get it?**

If you can name that capability concretely, owning the loop (or owning just *part* of it, the way
deepagents rents the rest from a framework) may be justified. If the honest answer is "more control
in general," the quality-first lens points the other way: composing keeps all ten components hardened
by someone else while you spend effort on the prose-and-pattern layer that *is* nxtlvl.
