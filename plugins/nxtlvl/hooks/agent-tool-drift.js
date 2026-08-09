#!/usr/bin/env node
/**
 * nxtlvl agent-tool-drift hook  —  SessionStart
 *
 * Guards one family-wide invariant: an agent definition's `tools:` frontmatter
 * names Claude Code tools, never another coding agent's vocabulary.
 *
 * Agent source files are authored once, in Claude Code names, and *translated*
 * into other agents' vocabularies by the compilers — scripts/multi-cli-compiler
 * (this repo) and scripts/compile_agents.py (nxtlvl-wiki). Both write their
 * output to separate destination trees. When a foreign tool name turns up in a
 * SOURCE file, something translated the original instead of a copy, and the
 * agent's permission boundary silently stops meaning what it says.
 *
 * This has happened twice: recorded in nxtlvl-wiki's
 * docs/reviews/2026-07-12-full-wiki-review/02-agents.md, and again in
 * nxtlvl-wiki commit f29f743 (2026-08-07), reverted by 07fa264.
 *
 * Detection is a deny-list, not an allow-list, so legitimate model context
 * protocol tools (mcp__*) and any tool Claude Code adds later pass untouched.
 * Only names that are *output* of a translation table are flagged.
 *
 * Injection channel: SessionStart additionalContext (same as multi-cli-sync.js).
 *
 * FAIL-OPEN IS ABSOLUTE: every path that could throw is wrapped; the hook always
 * exits 0 and never sets a blocking decision. An unreadable repo, a malformed
 * frontmatter block, or a missing directory degrades to a no-op.
 *
 * Kill switch: NXTLVL_AGENT_TOOL_DRIFT=off/0/false/no/disabled → silent no-op.
 * Repos:       NXTLVL_AGENT_DRIFT_REPOS=path:path (optional; default family
 *              siblings of the resolved nxtlvl-core root when those dirs exist).
 * Override:    NXTLVL_CORE_ROOT=/path/to/nxtlvl-core
 *
 * Skip guards: NXTLVL_CM_OBSERVER set (truthy, non-off); isSidechain=true.
 *
 * Also runnable by hand:  node agent-tool-drift.js --check [repoRoot ...]
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const MAX_STDIN = 4 * 1024 * 1024;
const OFF_VALUES = ['0', 'false', 'no', 'off', 'disabled'];
const DEFAULT_FAMILY_REPO_NAMES = ['nxtlvl-core', 'nxtlvl-lab', 'nxtlvl-wiki', 'nxtlvl-monitor'];

/**
 * Tool names that only ever exist as translation OUTPUT.
 *
 * Kept in sync by hand with the two translation tables that produce them:
 *   - scripts/multi-cli-compiler/emitters.ts  → mapClaudeToolToAntigravity()
 *   - nxtlvl-wiki/scripts/compile_agents.py   → TOOL_MAP_ANTIGRAVITY
 * Adding a row to either table means adding its output names here.
 */
const FOREIGN_TOOL_NAMES = new Set([
  'view_file',
  'list_dir',
  'grep_search',
  'run_command',
  'search_web',
  'read_url_content',
  'write_to_file',
  'replace_file_content',
  'multi_replace_file_content',
  'invoke_subagent',
  'manage_task',
  'call_mcp_tool',
  'ask_permission',
  'define_subagent',
]);

/**
 * Path segments that mark a tree as compiler OUTPUT, vendored code, or a
 * snapshot — foreign tool names are correct there and must never be flagged.
 */
const EXCLUDED_SEGMENTS = [
  '.agents', '.codex', '.devin', '.gemini',
  'archive', 'build', 'cache', 'node_modules',
  'staging', 'vendor', 'compiler-backup-workspace',
];

/** Directories under a repo root that hold authored agent sources. */
const SOURCE_GLOBS = [
  ['plugins', '*', 'agents'],
  ['plugins', '*', 'skills', '*', 'agents'],
  ['.claude', 'agents'],
];

function isOffLike(value) {
  if (value === undefined || value === null) return false;
  return OFF_VALUES.includes(String(value).trim().toLowerCase());
}

function isDisabled(env = process.env) {
  return isOffLike(env.NXTLVL_AGENT_TOOL_DRIFT);
}

function isObserverRun(env = process.env) {
  const v = env.NXTLVL_CM_OBSERVER;
  return v !== undefined && v !== '' && !isOffLike(v);
}

function isExcluded(filePath) {
  return filePath.split(path.sep).some((seg) => EXCLUDED_SEGMENTS.includes(seg));
}

/** Expand one SOURCE_GLOBS pattern (single-level `*` only) under a root. */
function expandPattern(root, segments) {
  let dirs = [root];
  for (const seg of segments) {
    const next = [];
    for (const dir of dirs) {
      if (seg === '*') {
        let entries = [];
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch { continue; }
        for (const e of entries) if (e.isDirectory()) next.push(path.join(dir, e.name));
      } else {
        const candidate = path.join(dir, seg);
        try {
          if (fs.statSync(candidate).isDirectory()) next.push(candidate);
        } catch { /* missing dir — skip */ }
      }
    }
    dirs = next;
    if (dirs.length === 0) return [];
  }
  return dirs;
}

/** Every authored agent markdown file under a repo root. */
function findAgentFiles(repoRoot) {
  const files = [];
  for (const segments of SOURCE_GLOBS) {
    for (const dir of expandPattern(repoRoot, segments)) {
      if (isExcluded(dir)) continue;
      let entries = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch { continue; }
      for (const e of entries) {
        if (e.isFile() && e.name.endsWith('.md')) files.push(path.join(dir, e.name));
      }
    }
  }
  return files.sort();
}

/**
 * Pull the tool names out of a `tools:` frontmatter line.
 * Accepts both family formats:
 *   tools: ["Read", "Grep"]        (nxtlvl-wiki, agent-dev)
 *   tools: Read, Grep              (nxtlvl plugin)
 */
function parseToolsLine(content) {
  const match = /^tools:[ \t]*(.*)$/m.exec(content);
  if (!match) return null;
  let raw = match[1].trim();
  if (raw.startsWith('[')) raw = raw.replace(/^\[/, '').replace(/\]\s*$/, '');
  return raw
    .split(',')
    .map((t) => t.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

/** Scan repo roots; return one finding per offending file. */
function scan(repoRoots) {
  const findings = [];
  for (const root of repoRoots) {
    for (const file of findAgentFiles(root)) {
      let content;
      try {
        content = fs.readFileSync(file, 'utf8');
      } catch { continue; }
      const tools = parseToolsLine(content);
      if (!tools || tools.length === 0) continue;
      const foreign = tools.filter((t) => FOREIGN_TOOL_NAMES.has(t.toLowerCase()));
      if (foreign.length > 0) findings.push({ file, foreign, tools });
    }
  }
  return findings;
}

/** Family repo checkouts directly under a candidate workbench directory. */
function familyReposUnder(workbench) {
  return DEFAULT_FAMILY_REPO_NAMES
    .map((name) => path.join(workbench, name))
    .filter((p) => {
      try { return fs.existsSync(path.join(p, '.git')); } catch { return false; }
    });
}

/**
 * Workbench directories to try, in order.
 *
 * The relative walk only works when this file is run from its place in the
 * nxtlvl-core checkout. Installed as a plugin it lives under
 * ~/.claude/plugins/cache/, where the walk lands nowhere near the repos — hence
 * the explicit home-directory fallback, matching multi-cli-sync.js.
 */
function candidateWorkbenches(env = process.env) {
  const out = [];
  const core = env.NXTLVL_CORE_ROOT && String(env.NXTLVL_CORE_ROOT).trim();
  if (core) out.push(path.dirname(path.resolve(core)));
  // hooks/ -> nxtlvl/ -> plugins/ -> nxtlvl-core/ -> workbench
  out.push(path.resolve(__dirname, '..', '..', '..', '..'));
  out.push(path.join(os.homedir(), 'Developer', 'nxtlvl'));
  return out;
}

function resolveRepoRoots(env = process.env) {
  if (env.NXTLVL_AGENT_DRIFT_REPOS) {
    return env.NXTLVL_AGENT_DRIFT_REPOS.split(':').filter(Boolean);
  }
  for (const workbench of candidateWorkbenches(env)) {
    const repos = familyReposUnder(workbench);
    if (repos.length > 0) return repos;
  }
  return [];
}

function renderContext(findings) {
  const lines = [
    '=== AGENT TOOL-NAME DRIFT (nxtlvl family) ===',
    '',
    `${findings.length} agent source file(s) carry another agent's tool vocabulary.`,
    "These files are authored in Claude Code names; the compilers translate copies.",
    'A foreign name here means the permission boundary no longer means what it says.',
    '',
  ];
  for (const f of findings) {
    lines.push(`  ${f.file}`);
    lines.push(`      foreign: ${f.foreign.join(', ')}`);
  }
  lines.push('');
  lines.push('Fix: restore each `tools:` line to Claude Code names (Read, Grep, Glob,');
  lines.push('Bash, Write, Edit, WebFetch, WebSearch, Skill, Task, mcp__*).');
  lines.push('Kill switch: NXTLVL_AGENT_TOOL_DRIFT=off');
  return lines.join('\n');
}

function run(stdinData, env = process.env) {
  try {
    if (isDisabled(env) || isObserverRun(env)) return '';
    try {
      const payload = JSON.parse(stdinData || '{}');
      if (payload && payload.isSidechain === true) return '';
    } catch { /* unparseable stdin — carry on with defaults */ }

    const findings = scan(resolveRepoRoots(env));
    if (findings.length === 0) return '';

    return JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: renderContext(findings),
      },
    });
  } catch {
    return ''; // fail-open: never block the session
  }
}

// --- entrypoints -------------------------------------------------------------

if (require.main === module) {
  const argv = process.argv.slice(2);
  if (argv.includes('--check')) {
    const roots = argv.filter((a) => !a.startsWith('--'));
    const findings = scan(roots.length > 0 ? roots : resolveRepoRoots());
    if (findings.length === 0) {
      const scanned = (roots.length > 0 ? roots : resolveRepoRoots());
      let count = 0;
      for (const r of scanned) count += findAgentFiles(r).length;
      console.log(`OK — ${count} agent file(s) scanned, no foreign tool names`);
      process.exit(0);
    }
    console.log(renderContext(findings));
    process.exit(1);
  }

  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('error', () => process.exit(0));
  process.stdin.on('data', (chunk) => {
    if (data.length < MAX_STDIN) data += chunk.substring(0, MAX_STDIN - data.length);
  });
  process.stdin.on('end', () => {
    try {
      const out = run(data);
      if (out) process.stdout.write(out);
    } catch { /* never surface */ }
    process.exit(0);
  });
}

// --- Exports (for testing) ---------------------------------------------------

module.exports = {
  run,
  scan,
  isOffLike,
  isDisabled,
  isObserverRun,
  isExcluded,
  parseToolsLine,
  findAgentFiles,
  familyReposUnder,
  candidateWorkbenches,
  resolveRepoRoots,
  renderContext,
  FOREIGN_TOOL_NAMES,
  DEFAULT_FAMILY_REPO_NAMES,
};
