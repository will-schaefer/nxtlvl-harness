/**
 * multi-CLI config compiler — global scope (increment 1).
 * Makes Codex and Antigravity consume the Claude Code config as their source of truth,
 * emitting only ADR-028's mechanical residue. Devin and Grok read it natively (no emits).
 *
 * Modes: default = dry-run plan · --write = apply with backups · --check = drift gate.
 * Spec: docs/spec/nxtlvl-multi-cli-compiler.md · Plan: docs/plan/nxtlvl-multi-cli-compiler-plan.md
 */

import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import {
  findClaudeOnlyTokens,
  looksLikeHandConvertedRule,
  upsertManagedTomlBlock,
} from './emitters.ts';

const HOME = homedir();
const SOURCE_GLOBAL_CLAUDE_MD = join(HOME, '.claude', 'CLAUDE.md');
const CODEX_CONFIG_TOML = join(HOME, '.codex', 'config.toml');
const CODEX_GLOBAL_AGENTS_MD = join(HOME, '.codex', 'AGENTS.md');
const ANTIGRAVITY_AGENTS_DIR = join(HOME, '.gemini', 'config', 'agents');
const ANTIGRAVITY_GLOBAL_GEMINI_MD = join(HOME, '.gemini', 'GEMINI.md');

// Retired from ~/.gemini/config/agents/ — a directory nothing reads (sentinel probe,
// 2026-07-11): the five 2026-07-04 hand conversions never loaded, and the compiled
// global-conventions rule (first --write, same day) landed dead too. The GEMINI.md
// symlink now delivers the global source; rules stay on-demand via its pointer lines.
const RETIRED_ANTIGRAVITY_RULES = [
  'decisions.md',
  'git-workflow.md',
  'global-conventions.md',
  'hooks.md',
  'memory.md',
  'visual-docs.md',
];

// Backups land in the gitignored *-workspace tree of this repo, outside every CLI's
// discovery path, so no CLI can load a stale backup as live config.
const REPO_ROOT = resolve(dirname(process.argv[1] ?? '.'), '..', '..');
const BACKUP_ROOT = join(
  REPO_ROOT,
  'compiler-backup-workspace',
  new Date().toISOString().replace(/[:.]/g, '-'),
);

interface WriteAction {
  kind: 'write';
  path: string;
  desired: string;
  /** Instruction content gets the portability gate; mechanical config does not. */
  sweep: boolean;
  reason: string;
}

interface SymlinkAction {
  kind: 'symlink';
  path: string;
  target: string;
  reason: string;
}

interface RetireAction {
  kind: 'retire';
  path: string;
  reason: string;
}

type Action = WriteAction | SymlinkAction | RetireAction;
type Status = 'ok' | 'create' | 'update' | 'retire' | 'skip';

main();

function main(): void {
  const write = process.argv.includes('--write');
  const check = process.argv.includes('--check');
  if (write && check) {
    console.error('--write and --check are mutually exclusive.');
    process.exit(1);
  }
  if (!existsSync(SOURCE_GLOBAL_CLAUDE_MD)) {
    console.error(`Source missing: ${SOURCE_GLOBAL_CLAUDE_MD}`);
    process.exit(1);
  }

  const actions = buildGlobalPlan();

  // Symlinks expose the source verbatim, so the gate sweeps the source itself,
  // plus any emitted instruction content (sweep-flagged writes).
  const violations: string[] = [];
  for (const token of findClaudeOnlyTokens(readFileSync(SOURCE_GLOBAL_CLAUDE_MD, 'utf8'))) {
    violations.push(`${display(SOURCE_GLOBAL_CLAUDE_MD)}: ${token}`);
  }
  for (const action of actions) {
    if (action.kind === 'write' && action.sweep) {
      for (const token of findClaudeOnlyTokens(action.desired)) {
        violations.push(`${display(action.path)}: ${token}`);
      }
    }
  }
  if (violations.length > 0) {
    console.error('Portability gate FAILED — the source is not portable; nothing written:');
    for (const violation of violations) {
      console.error(`  ${violation}`);
    }
    process.exit(1);
  }

  const planned = actions.map((action) => ({ action, status: statusOf(action) }));
  const pending = planned.filter(({ status }) => status !== 'ok' && status !== 'skip');

  for (const { action, status } of planned) {
    console.log(`${status.toUpperCase().padEnd(7)} ${display(action.path)} — ${action.reason}`);
  }

  if (check) {
    if (pending.length > 0) {
      console.error(`\nDrift: ${pending.length} target(s) out of sync.`);
      process.exit(1);
    }
    console.log('\nAll targets in sync.');
    return;
  }

  if (!write) {
    console.log(
      pending.length > 0
        ? `\nDry run — ${pending.length} change(s) planned. Re-run with --write to apply.`
        : '\nDry run — everything already in sync.',
    );
    return;
  }

  if (pending.length === 0) {
    console.log('\nNothing to apply.');
    return;
  }
  for (const { action, status } of pending) {
    apply(action, status);
  }
  console.log(`\nApplied ${pending.length} change(s). Backups: ${display(BACKUP_ROOT)}`);
}

function buildGlobalPlan(): Action[] {
  const actions: Action[] = [];

  const codexExisting = readTextIfExists(CODEX_CONFIG_TOML) ?? '';
  actions.push({
    kind: 'write',
    path: CODEX_CONFIG_TOML,
    desired: upsertManagedTomlBlock(codexExisting, [
      'project_doc_fallback_filenames = ["CLAUDE.md"]',
    ]),
    sweep: false,
    reason: 'Codex reads nothing in repos without AGENTS.md until this fallback exists',
  });

  actions.push({
    kind: 'symlink',
    path: CODEX_GLOBAL_AGENTS_MD,
    target: SOURCE_GLOBAL_CLAUDE_MD,
    reason: 'Codex has no native global-CLAUDE.md read; symlink delivers the portable source verbatim',
  });

  actions.push({
    kind: 'symlink',
    path: ANTIGRAVITY_GLOBAL_GEMINI_MD,
    target: SOURCE_GLOBAL_CLAUDE_MD,
    reason: 'Antigravity loads ~/.gemini/GEMINI.md always-on (sentinel probe 2026-07-11); symlink delivers the portable source verbatim',
  });

  for (const name of RETIRED_ANTIGRAVITY_RULES) {
    actions.push({
      kind: 'retire',
      path: join(ANTIGRAVITY_AGENTS_DIR, name),
      reason: 'config/agents/ is dead (nothing reads it — sentinel probe 2026-07-11); GEMINI.md symlink carries the source, rules stay on-demand',
    });
  }

  return actions;
}

function statusOf(action: Action): Status {
  if (action.kind === 'write') {
    const current = readTextIfExists(action.path);
    if (current === action.desired) return 'ok';
    return current === null ? 'create' : 'update';
  }
  if (action.kind === 'symlink') {
    if (!pathExists(action.path)) return 'create';
    const stats = lstatSync(action.path);
    if (stats.isSymbolicLink() && readlinkSync(action.path) === action.target) return 'ok';
    return 'update';
  }
  if (!pathExists(action.path)) return 'ok';
  const current = readTextIfExists(action.path);
  return current !== null && looksLikeHandConvertedRule(current) ? 'retire' : 'skip';
}

function apply(action: Action, status: Status): void {
  if (action.kind === 'write') {
    if (status === 'update') backup(action.path);
    mkdirSync(dirname(action.path), { recursive: true });
    writeFileSync(action.path, action.desired);
    return;
  }
  if (action.kind === 'symlink') {
    if (pathExists(action.path)) {
      if (lstatSync(action.path).isFile()) backup(action.path);
      unlinkSync(action.path);
    }
    mkdirSync(dirname(action.path), { recursive: true });
    symlinkSync(action.target, action.path);
    return;
  }
  backup(action.path);
  unlinkSync(action.path);
}

function backup(path: string): void {
  if (!pathExists(path) || !lstatSync(path).isFile()) {
    return;
  }
  const destination = join(BACKUP_ROOT, path.replace(/^\//, ''));
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(path, destination);
}

function readTextIfExists(path: string): string | null {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

/** existsSync follows symlinks; lstat-based check sees dangling symlinks too. */
function pathExists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

function display(path: string): string {
  return path.startsWith(HOME) ? `~${path.slice(HOME.length)}` : path;
}
