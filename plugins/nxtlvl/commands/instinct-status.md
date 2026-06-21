---
description: Show what the C&M floor has learned — list this project's instincts and all global instincts, grouped and ranked by effective (decayed) confidence.
---

# /instinct-status

Show the **C&M instinct store** for this project: all project-scoped instincts (habits observed only here) and all global instincts (habits promoted across projects), grouped and sorted best-first by **effective confidence** — the raw confidence with time-decay applied at read time.

No LLM judgment is needed. Run the `node -e` snippet below; print its output verbatim to the user.

```bash
CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}" node -e 'const r=process.env.CLAUDE_PLUGIN_ROOT;
const I=require(r+"/lib/instincts");
const {projectIdentity}=require(r+"/lib/project-identity");
const pid=projectIdentity(process.cwd()).key;
const now=Date.now();
const items=I.list({projectId:pid},undefined,undefined).map(x=>({...x,eff:I.effectiveConfidence(x,now)}));
const proj=items.filter(x=>x.scope!=="global").sort((a,b)=>b.eff-a.eff);
const glob=items.filter(x=>x.scope==="global").sort((a,b)=>b.eff-a.eff);
const bar=v=>{const n=Math.max(0,Math.min(10,Math.round(v*10)));return "#".repeat(n)+".".repeat(10-n);};
const fmt=x=>"  "+bar(x.eff)+" "+(x.eff*100).toFixed(0).padStart(3)+"%  "+x.id+"  ["+(x.domain||"-")+"]  (raw "+(x.confidence*100).toFixed(0)+"%, x"+(x.reinforcements||0)+")\n        trigger: "+(x.trigger||"-");
console.log("INSTINCT STATUS — project "+pid);
console.log("(confidence shown is DECAYED/effective; raw + reinforcement count in parens)");
console.log("\nPROJECT-SCOPED ("+proj.length+")");
console.log(proj.length?proj.map(fmt).join("\n"):"  (none yet)");
console.log("\nGLOBAL ("+glob.length+")");
console.log(glob.length?glob.map(fmt).join("\n"):"  (none yet)");'
```

Present the output as a code block (it is pre-formatted; do not reformat or summarise it).

## What this shows

Each line displays:

- **Confidence bar** — a 10-char `#`/`.` bar of the **effective** (time-decayed) confidence.
- **Effective %** — the decayed value the system is currently acting on.
- **Instinct id** and **domain** — what habit this is and which area it belongs to.
- **Raw % and reinforcement count** `(raw N%, xN)` — the stored frequency-based confidence before decay, plus how many times this habit has been explicitly reinforced.
- **Trigger** — the cue that activates this habit.

The two groups are:

- **PROJECT-SCOPED** — habits the observer inferred specifically for this project; visible only here.
- **GLOBAL** — habits promoted across all projects; applied everywhere.

Both groups are sorted best-first by effective confidence. A high effective % means the habit is both strong and fresh; a decayed effective % below the `~0.7` bar signals the habit is going stale and may benefit from pruning or reinforcement.

To manage the store: use `/prune` to drop low-confidence or stale instincts, `/promote` to lift a strong project instinct to global scope, and `/evolve` to cluster related instincts into a reusable skill, command, or agent.

## Metrics (§8)

The two fully-automatic readouts below require no hand-entry. The **confidence distribution** shows learning quality — the effective (time-decayed) confidence of this project's and global instincts, bucketed into five bands so you can see at a glance whether the store is healthy or going stale. The **fallback rate** shows reliability — how often you still reach for `ecc` in a session; the raw invocations are logged automatically to `~/.claude/nxtlvl/fallback-log.jsonl` by the `pre:fallback-log` hook. A falling fallback rate while confidence stays healthy means real progress; a falling rate with confidence decaying signals white-knuckling a genuine gap.

```bash
CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}" node -e 'const r=process.env.CLAUDE_PLUGIN_ROOT;
const M=require(r+"/lib/metrics");
const {projectIdentity}=require(r+"/lib/project-identity");
const pid=projectIdentity(process.cwd()).key;
const now=Date.now();
const fr=M.fallbackRate(undefined,undefined);
const d=M.confidenceDistribution({projectId:pid,now},undefined,undefined);
const bar=n=>"#".repeat(Math.max(0,Math.min(20,n)));
console.log("METRICS (§8)");
console.log("\nInstinct confidence distribution (effective, n="+d.n+(d.mean!=null?(", mean "+(d.mean*100).toFixed(0)+"%"):"")+")");
d.bins.forEach(b=>console.log("  "+b.label+"  "+bar(b.count)+" "+b.count));
console.log("\nFallback rate (north star — share of sessions reaching for ecc):");
if(fr.totalSessions>0){console.log("  "+fr.sessionsWithFallback+" / "+fr.totalSessions+" sessions ("+(fr.rate*100).toFixed(0)+"%); "+fr.fallbackEvents+" ecc invocation(s) total");}
else{console.log("  no sessions recorded yet");}
console.log("  lower is better — target a low plateau (ecc still earns its shelf space).");'
```

Run this snippet and present its output verbatim alongside the instinct listing above. Both readouts update automatically every session — no action required.

## Usage

```
/instinct-status
```

No arguments. Run from any working directory inside the project — `projectIdentity` resolves the project key from the git common directory automatically.
