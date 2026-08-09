#!/usr/bin/env node
/**
 * nxtlvl multi-cli-sync hook  —  SessionStart
 *
 * Layer A+B automation for the multi-CLI config compiler
 * (scripts/multi-cli-compiler/compile.ts):
 *
 *   A — always run `--check` at session start; on drift inject a short warning
 *       plus the exact write command.
 *   B — when NXTLVL_COMPILER_AUTOWRITE is on, run `--write` after drift, then
 *       re-check; report applied / remaining conflicts.
 *
 * Injection channel: SessionStart additionalContext (same as briefing.js).
 *
 * FAIL-OPEN IS ABSOLUTE: every path that could throw is wrapped; the hook always
 * exits 0 and never sets a blocking decision. A missing compiler, hung child, or
 * parse error degrades to a no-op (or a one-line "could not run" note when the
 * miss is clear).
 *
 * Kill switch: NXTLVL_MULTI_CLI_SYNC=off/0/false/no/disabled → silent no-op.
 * Auto-write:  NXTLVL_COMPILER_AUTOWRITE=1/true/yes/on → apply on drift.
 * Repos:       NXTLVL_COMPILER_REPOS=path:path (optional; default family siblings
 *              of the resolved nxtlvl-core root when those dirs exist).
 * Override:    NXTLVL_CORE_ROOT=/path/to/nxtlvl-core
 *              NXTLVL_COMPILER_SCRIPT=/path/to/compile.ts
 *
 * Skip guards: NXTLVL_CM_OBSERVER set (truthy, non-off); isSidechain=true.
 */

'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const MAX_STDIN = 4 * 1024 * 1024;
const OFF_VALUES = ['0', 'false', 'no', 'off', 'disabled'];
const ON_VALUES = ['1', 'true', 'yes', 'on', 'enabled'];

/** Child budget for --check / --write (must finish under hooks.json timeout). */
const CHILD_TIMEOUT_MS = 20_000;

const DEFAULT_FAMILY_REPO_NAMES = ['nxtlvl-lab', 'nxtlvl-wiki'];

// --- env helpers -------------------------------------------------------------

function isOffLike(raw) {
  return OFF_VALUES.includes(String(raw || '').trim().toLowerCase());
}

function isOnLike(raw) {
  return ON_VALUES.includes(String(raw || '').trim().toLowerCase());
}

function isSyncDisabled(env) {
  return isOffLike(env.NXTLVL_MULTI_CLI_SYNC);
}

function isAutoWriteEnabled(env) {
  return isOnLike(env.NXTLVL_COMPILER_AUTOWRITE);
}

function isObserverRun(env) {
  const v = env.NXTLVL_CM_OBSERVER;
  return !!(v && !isOffLike(v));
}

// --- path resolution ---------------------------------------------------------

/**
 * Resolve the compile.ts entry. Order:
 * 1. NXTLVL_COMPILER_SCRIPT
 * 2. NXTLVL_CORE_ROOT/scripts/multi-cli-compiler/compile.ts
 * 3. CLAUDE_PLUGIN_ROOT/../../scripts/... (monorepo layout: plugins/nxtlvl)
 * 4. ~/Developer/nxtlvl/nxtlvl-core/scripts/multi-cli-compiler/compile.ts
 *
 * @param {NodeJS.ProcessEnv} env
 * @param {string} [pluginRoot]
 * @returns {string | null}
 */
function resolveCompileScript(env, pluginRoot) {
  const explicit = env.NXTLVL_COMPILER_SCRIPT && String(env.NXTLVL_COMPILER_SCRIPT).trim();
  if (explicit && fs.existsSync(explicit)) return path.resolve(explicit);

  const coreFromEnv = env.NXTLVL_CORE_ROOT && String(env.NXTLVL_CORE_ROOT).trim();
  if (coreFromEnv) {
    const candidate = path.join(coreFromEnv, 'scripts', 'multi-cli-compiler', 'compile.ts');
    if (fs.existsSync(candidate)) return candidate;
  }

  const root = pluginRoot || env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
  const fromPlugin = path.resolve(root, '..', '..', 'scripts', 'multi-cli-compiler', 'compile.ts');
  if (fs.existsSync(fromPlugin)) return fromPlugin;

  const homeDefault = path.join(
    os.homedir(),
    'Developer',
    'nxtlvl',
    'nxtlvl-core',
    'scripts',
    'multi-cli-compiler',
    'compile.ts',
  );
  if (fs.existsSync(homeDefault)) return homeDefault;

  return null;
}

/**
 * Resolve the nxtlvl-core root that owns the compiler script.
 * @param {string} compileScript
 * @returns {string}
 */
function coreRootFromCompileScript(compileScript) {
  // .../nxtlvl-core/scripts/multi-cli-compiler/compile.ts → nxtlvl-core
  return path.resolve(path.dirname(compileScript), '..', '..');
}

/**
 * Repo roots to pass as repeated `--repo` flags.
 * - NXTLVL_COMPILER_REPOS set → split on `:` or `,` (empty string → global only)
 * - otherwise → default family siblings of core root that exist on disk
 *
 * @param {NodeJS.ProcessEnv} env
 * @param {string} coreRoot
 * @returns {string[]}
 */
function resolveRepoRoots(env, coreRoot) {
  if (Object.prototype.hasOwnProperty.call(env, 'NXTLVL_COMPILER_REPOS')) {
    const raw = String(env.NXTLVL_COMPILER_REPOS || '').trim();
    if (!raw) return [];
    return raw
      .split(/[:|,]/u)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => path.resolve(part))
      .filter((dir) => {
        try {
          return fs.statSync(dir).isDirectory();
        } catch {
          return false;
        }
      });
  }

  const familyRoot = path.dirname(coreRoot);
  const repos = [];
  for (const name of DEFAULT_FAMILY_REPO_NAMES) {
    const candidate = path.join(familyRoot, name);
    try {
      if (fs.statSync(candidate).isDirectory()) repos.push(candidate);
    } catch {
      // skip missing sibling
    }
  }
  return repos;
}

// --- compiler runner ---------------------------------------------------------

/**
 * @typedef {{ code: number, stdout: string, stderr: string }} CompilerResult
 */

/**
 * @param {string} compileScript
 * @param {string[]} modeArgs  e.g. ['--check'] or ['--write']
 * @param {string[]} repoRoots
 * @param {(file: string, args: string[], opts: object) => Buffer|string} execFile
 * @returns {CompilerResult}
 */
function runCompiler(compileScript, modeArgs, repoRoots, execFile = execFileSync) {
  const args = [compileScript, ...modeArgs];
  for (const repo of repoRoots) {
    args.push('--repo', repo);
  }
  try {
    const stdout = execFile(process.execPath, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: CHILD_TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
    });
    return { code: 0, stdout: String(stdout || ''), stderr: '' };
  } catch (err) {
    // execFileSync throws on non-zero exit; capture stdout/stderr/status.
    const e = /** @type {any} */ (err);
    return {
      code: typeof e.status === 'number' ? e.status : 1,
      stdout: String(e.stdout || ''),
      stderr: String(e.stderr || e.message || ''),
    };
  }
}

/**
 * Pull a short drift / apply summary from compiler output.
 * @param {string} combined
 * @returns {{ pending: number | null, applied: number | null, conflicts: number | null, line: string | null }}
 */
function parseCompilerSummary(combined) {
  const text = combined || '';
  const drift = text.match(/Drift:\s+(\d+)\s+target/i);
  const applied = text.match(/Applied\s+(\d+)\s+change/i);
  const conflicts = text.match(/(\d+)\s+conflict\(s\)/i);
  const pendingCount = drift ? Number(drift[1]) : null;
  const appliedCount = applied ? Number(applied[1]) : null;
  const conflictCount = conflicts ? Number(conflicts[1]) : null;

  // Prefer the last meaningful summary line for the agent.
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let line = null;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (/^Drift:|^Applied |^All targets in sync|^Nothing to apply|^Dry run|conflict/i.test(lines[i])) {
      line = lines[i];
      break;
    }
  }
  return { pending: pendingCount, applied: appliedCount, conflicts: conflictCount, line };
}

function writeCommand(repoRoots) {
  const repoFlags = repoRoots.map((r) => `--repo ${shellQuote(r)}`).join(' ');
  const base = 'npm run compile-multi-cli -- --write';
  return repoFlags ? `${base} ${repoFlags}` : base;
}

function shellQuote(value) {
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) return value;
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

/**
 * Build the additionalContext body for a sync outcome.
 * @param {object} outcome
 * @returns {string}
 */
function renderContext(outcome) {
  const lines = ['## nxtlvl — multi-CLI config sync', ''];
  for (const part of outcome.lines) {
    lines.push(part);
  }
  return lines.join('\n');
}

// --- Core --------------------------------------------------------------------

/**
 * @param {string} rawInput - SessionStart event JSON from stdin
 * @param {object} env      - process.env (or test substitute)
 * @param {object} deps     - injectable dependencies (for testing)
 * @returns {string} JSON hook output to emit, or '' for a no-op
 */
function run(rawInput, env = process.env, deps = {}) {
  try {
    if (isSyncDisabled(env)) return '';
    if (isObserverRun(env)) return '';

    const input = rawInput && String(rawInput).trim() ? JSON.parse(rawInput) : {};
    if (input.isSidechain === true) return '';

    const resolveScript = deps.resolveCompileScript || resolveCompileScript;
    const resolveRepos = deps.resolveRepoRoots || resolveRepoRoots;
    const runChild = deps.runCompiler || runCompiler;
    const pluginRoot = deps.pluginRoot || env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');

    const compileScript = resolveScript(env, pluginRoot);
    if (!compileScript) {
      return JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: renderContext({
            lines: [
              'Multi-CLI compiler not found — skipped sync.',
              'Set `NXTLVL_CORE_ROOT` or `NXTLVL_COMPILER_SCRIPT`, or keep nxtlvl-core at `~/Developer/nxtlvl/nxtlvl-core`.',
            ],
          }),
        },
      });
    }

    const coreRoot = coreRootFromCompileScript(compileScript);
    const repoRoots = resolveRepos(env, coreRoot);
    const autoWrite = isAutoWriteEnabled(env);

    const check = runChild(compileScript, ['--check'], repoRoots, deps.execFile);
    if (check.code === 0) {
      // In sync — stay silent so SessionStart isn't noisy every time.
      return '';
    }

    const checkSummary = parseCompilerSummary(`${check.stdout}\n${check.stderr}`);
    const pending = checkSummary.pending;
    const driftLabel =
      pending !== null
        ? `${pending} target(s) out of sync`
        : (checkSummary.line || 'compiler reported drift or failure');

    if (!autoWrite) {
      return JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: renderContext({
            lines: [
              `**Drift detected** (${driftLabel}).`,
              '',
              'Auto-write is off. To apply:',
              '',
              '```bash',
              writeCommand(repoRoots),
              '```',
              '',
              'Or set `NXTLVL_COMPILER_AUTOWRITE=1` so SessionStart applies automatically next time.',
              'Kill switch: `NXTLVL_MULTI_CLI_SYNC=off`.',
            ],
          }),
        },
      });
    }

    const write = runChild(compileScript, ['--write'], repoRoots, deps.execFile);
    const writeSummary = parseCompilerSummary(`${write.stdout}\n${write.stderr}`);
    const recheck = runChild(compileScript, ['--check'], repoRoots, deps.execFile);

    if (recheck.code === 0) {
      const applied =
        writeSummary.applied !== null
          ? `Applied ${writeSummary.applied} change(s).`
          : 'Applied pending compiler changes.';
      return JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: renderContext({
            lines: [
              `**Synced** after detecting drift (${driftLabel}).`,
              applied,
              'All multi-CLI compiler targets are now in sync.',
            ],
          }),
        },
      });
    }

    // Write ran but drift remains (conflicts, portability gate, partial failure).
    const conflictNote =
      writeSummary.conflicts !== null
        ? `${writeSummary.conflicts} conflict(s) the compiler cannot fix.`
        : (writeSummary.line || recheck.stderr.trim().split('\n').slice(-1)[0] || 're-check still failing');

    return JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: renderContext({
          lines: [
            `**Tried to sync** after drift (${driftLabel}) but targets are still not clean.`,
            conflictNote,
            '',
            'Inspect with:',
            '',
            '```bash',
            `npm run compile-multi-cli -- --check${repoRoots.length ? ' ' + repoRoots.map((r) => `--repo ${shellQuote(r)}`).join(' ') : ''}`,
            '```',
            '',
            'Conflicts need a hand fix (foreign/seed-owned files). Portability-gate failures need source edits first.',
          ],
        }),
      },
    });
  } catch {
    return ''; // fail-open: never block the session
  }
}

// --- stdin entrypoint --------------------------------------------------------

if (require.main === module) {
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
    } catch {
      // never surface
    }
    process.exit(0);
  });
}

// --- Exports (for testing) ---------------------------------------------------

module.exports = {
  run,
  isOffLike,
  isOnLike,
  isSyncDisabled,
  isAutoWriteEnabled,
  isObserverRun,
  resolveCompileScript,
  resolveRepoRoots,
  coreRootFromCompileScript,
  runCompiler,
  parseCompilerSummary,
  writeCommand,
  renderContext,
  CHILD_TIMEOUT_MS,
  DEFAULT_FAMILY_REPO_NAMES,
};
