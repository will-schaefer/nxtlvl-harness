/**
 * multi-CLI config compiler — global scope (increment 1) + repo-scope MCP (increment 2)
 * + skills relocation (increment 3).
 * Makes Codex and Antigravity consume the Claude Code config as their source of truth,
 * emitting only ADR-028's mechanical residue. Devin and Grok read it natively (no emits),
 * except Devin's global-skills gap — closed by the ~/.agents/skills relocation.
 *
 * Modes: default = dry-run plan · --write = apply with backups · --check = drift gate.
 * Repo scope: `--repo <path>` (repeatable) compiles that repo's `.mcp.json` and
 * `.claude/skills/` on top of the global plan.
 * Spec: docs/spec/nxtlvl-multi-cli-compiler.md · Plan: docs/plan/nxtlvl-multi-cli-compiler-plan.md
 */

import {
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import {
  classifyAgentsSkillEntry,
  compileAntigravityMcpServers,
  compileCodexMcpServerLines,
  findClaudeOnlyTokens,
  isLabSeedOwnedToml,
  looksLikeHandConvertedRule,
  mergeMcpConfigJson,
  tomlDeliversMcpServer,
  upsertManagedTomlBlock,
} from './emitters.ts';
import type { AgentsSkillEntry, ClaudeMcpServer } from './emitters.ts';

const HOME = homedir();
const SOURCE_GLOBAL_CLAUDE_MD = join(HOME, '.claude', 'CLAUDE.md');
const CODEX_CONFIG_TOML = join(HOME, '.codex', 'config.toml');
const CODEX_GLOBAL_AGENTS_MD = join(HOME, '.codex', 'AGENTS.md');
const ANTIGRAVITY_AGENTS_DIR = join(HOME, '.gemini', 'config', 'agents');
const ANTIGRAVITY_GLOBAL_GEMINI_MD = join(HOME, '.gemini', 'GEMINI.md');
const CLAUDE_GLOBAL_SKILLS_DIR = join(HOME, '.claude', 'skills');
// The agentskills.io standard's machine-level home — Devin reads it (closing its
// global-skills gap: ~/.claude/skills is never natively imported) and Codex reads
// $HOME/.agents/skills. The dir is shared with the skills installer (.skill-lock.json
// lives there); the compiler only adds per-skill symlinks, never touches foreign entries.
const AGENTS_GLOBAL_SKILLS_DIR = join(HOME, '.agents', 'skills');

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

/** A delivery assertion on a file another flow owns — never written, only checked. */
interface VerifyAction {
  kind: 'verify';
  path: string;
  ok: boolean;
  reason: string;
}

type Action = WriteAction | SymlinkAction | RetireAction | VerifyAction;
type Status = 'ok' | 'create' | 'update' | 'retire' | 'skip' | 'conflict';

/** Actions plus the skill source dirs they expose — the latter feed the portability gate. */
interface Plan {
  actions: Action[];
  skillSourceDirs: string[];
}

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

  const repoRoots: string[] = [];
  for (let i = 2; i < process.argv.length; i += 1) {
    if (process.argv[i] === '--repo') {
      const value = process.argv[i + 1];
      if (value === undefined || value.startsWith('--')) {
        console.error('--repo requires a path.');
        process.exit(1);
      }
      repoRoots.push(resolve(value));
      i += 1;
    }
  }

  const plans = [buildGlobalPlan(), ...repoRoots.map(buildRepoPlan)];
  const actions = plans.flatMap((plan) => plan.actions);
  const skillSourceDirs = plans.flatMap((plan) => plan.skillSourceDirs);

  // Symlinks expose the source verbatim, so the gate sweeps the source itself
  // (global CLAUDE.md and every relocated skill's markdown), plus any emitted
  // instruction content (sweep-flagged writes).
  const violations: string[] = [];
  for (const token of findClaudeOnlyTokens(readFileSync(SOURCE_GLOBAL_CLAUDE_MD, 'utf8'))) {
    violations.push(`${display(SOURCE_GLOBAL_CLAUDE_MD)}: ${token}`);
  }
  for (const dir of skillSourceDirs) {
    for (const file of listMarkdownFiles(dir)) {
      for (const token of findClaudeOnlyTokens(readFileSync(file, 'utf8'))) {
        violations.push(`${display(file)}: ${token}`);
      }
    }
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

  const conflicts = pending.filter(({ status }) => status === 'conflict');
  const applicable = pending.filter(({ status }) => status !== 'conflict');
  if (pending.length === 0) {
    console.log('\nNothing to apply.');
    return;
  }
  for (const { action, status } of applicable) {
    apply(action, status);
  }
  if (applicable.length > 0) {
    console.log(`\nApplied ${applicable.length} change(s). Backups: ${display(BACKUP_ROOT)}`);
  }
  if (conflicts.length > 0) {
    console.error(
      `\n${conflicts.length} conflict(s) the compiler cannot fix — the flagged file is owned by another flow; fix its own source and re-run.`,
    );
    process.exit(1);
  }
}

function buildGlobalPlan(): Plan {
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

  warnUncompiledCommands(join(HOME, '.claude', 'commands'));
  const skills = buildSkillRelocationActions(
    CLAUDE_GLOBAL_SKILLS_DIR,
    AGENTS_GLOBAL_SKILLS_DIR,
    (name) => join(CLAUDE_GLOBAL_SKILLS_DIR, name),
    'Devin (global-skills gap) + Codex read ~/.agents/skills',
  );

  return { actions: [...actions, ...skills.actions], skillSourceDirs: skills.skillSourceDirs };
}

/**
 * Repo scope: compile `<repo>/.mcp.json` (+ settings `mcpServers`) into the
 * Codex and Antigravity workspace MCP surfaces (Devin and Grok read `.mcp.json`
 * natively — no emits, compat doc item 2), and relocate `<repo>/.claude/skills/`
 * into `<repo>/.agents/skills/` (the pinned neutral location, compat doc item 5).
 */
function buildRepoPlan(repoRoot: string): Plan {
  warnUncompiledCommands(join(repoRoot, '.claude', 'commands'));
  const skills = buildSkillRelocationActions(
    join(repoRoot, '.claude', 'skills'),
    join(repoRoot, '.agents', 'skills'),
    // Relative target: the link and its skill live in the same repo, so the pair
    // survives cloning the repo to another path.
    (name) => join('..', '..', '.claude', 'skills', name),
    'Codex + Antigravity read the workspace .agents/skills',
  );
  const mcpActions = buildRepoMcpActions(repoRoot);
  if (mcpActions.length === 0 && skills.actions.length === 0) {
    console.log(`NOTE    ${display(repoRoot)} — no MCP servers or skills found; nothing to compile for this repo`);
  }
  return { actions: [...mcpActions, ...skills.actions], skillSourceDirs: skills.skillSourceDirs };
}

function buildRepoMcpActions(repoRoot: string): Action[] {
  const servers = readClaudeMcpServers(repoRoot);
  if (servers === null || Object.keys(servers).length === 0) {
    return [];
  }
  const actions: Action[] = [];
  const names = Object.keys(servers).sort();

  const codexPath = join(repoRoot, '.codex', 'config.toml');
  const codexExisting = readTextIfExists(codexPath);
  if (codexExisting !== null && isLabSeedOwnedToml(codexExisting)) {
    // The repo's own stack.toml flow regenerates this file whole — a foreign managed
    // block would be silently erased, so assert delivery instead of writing.
    for (const name of names) {
      const url = servers[name].url;
      const delivered = url !== undefined && tomlDeliversMcpServer(codexExisting, name, url);
      actions.push({
        kind: 'verify',
        path: codexPath,
        ok: delivered,
        reason: delivered
          ? `mcp server '${name}' delivered by this repo's stack.toml flow (seed-owned file, not rewritten)`
          : `mcp server '${name}' missing from the seed-owned file — add it to .agents/stack.toml and re-run that repo's sync`,
      });
    }
  } else {
    const body = names.flatMap((name, index) => {
      const lines = compileCodexMcpServerLines(name, servers[name]);
      return index === 0 ? lines : ['', ...lines];
    });
    actions.push({
      kind: 'write',
      path: codexPath,
      desired: upsertManagedTomlBlock(codexExisting ?? '', body),
      sweep: false,
      reason: 'Codex reads repo MCP only from .codex/config.toml — compiled from .mcp.json',
    });
  }

  const antigravity = compileAntigravityMcpServers(servers);
  if (antigravity.skippedStdio.length > 0) {
    console.warn(
      `WARN    ${display(repoRoot)} — stdio server(s) not compiled for Antigravity (key shape unverified): ${antigravity.skippedStdio.join(', ')}`,
    );
  }
  if (Object.keys(antigravity.servers).length > 0) {
    const antigravityPath = join(repoRoot, '.agents', 'mcp_config.json');
    actions.push({
      kind: 'write',
      path: antigravityPath,
      desired: mergeMcpConfigJson(readTextIfExists(antigravityPath), antigravity.servers),
      sweep: false,
      reason: 'Antigravity workspace MCP — compiled from .mcp.json (merge preserves foreign keys)',
    });
  }

  return actions;
}

/** Union of `.mcp.json` and settings-file `mcpServers`, later sources winning per name. */
function readClaudeMcpServers(repoRoot: string): Record<string, ClaudeMcpServer> | null {
  const sources = ['.mcp.json', '.claude/settings.json', '.claude/settings.local.json'];
  const merged: Record<string, ClaudeMcpServer> = {};
  let found = false;
  for (const relative of sources) {
    const path = join(repoRoot, relative);
    const text = readTextIfExists(path);
    if (text === null) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error(`Invalid JSON in ${display(path)} — refusing to compile this repo.`);
      process.exit(1);
    }
    const mcpServers = (parsed as { mcpServers?: Record<string, ClaudeMcpServer> }).mcpServers;
    if (mcpServers !== undefined && typeof mcpServers === 'object') {
      found = true;
      Object.assign(merged, mcpServers);
    }
  }
  return found ? merged : null;
}

/**
 * Relocate every Claude skill (a directory with a SKILL.md) as a per-skill symlink in
 * `.agents/skills/` — the deliberately-pinned neutral agentskills.io location. Symlinks
 * keep the relocation at zero drift; the classifier guards against same-name collisions
 * (undefined behavior in Devin — a foreign entry is reported, never replaced).
 */
function buildSkillRelocationActions(
  sourceSkillsDir: string,
  targetSkillsDir: string,
  linkTargetFor: (name: string) => string,
  audience: string,
): Plan {
  if (!existsSync(sourceSkillsDir)) {
    return { actions: [], skillSourceDirs: [] };
  }
  const actions: Action[] = [];
  const skillSourceDirs: string[] = [];
  for (const name of readdirSync(sourceSkillsDir).sort()) {
    const sourceDir = join(sourceSkillsDir, name);
    const sourceStats = lstatSync(sourceDir);
    if (sourceStats.isSymbolicLink()) {
      // The reverse-direction arrangement (agentskills.io installer convention): the
      // real skill lives in .agents/skills/ and the Claude dir symlinks into it. The
      // skill is already at the neutral location — assert delivery, don't restructure.
      const linkPath = join(targetSkillsDir, name);
      const resolvedSource = resolve(sourceSkillsDir, readlinkSync(sourceDir));
      if (resolvedSource === resolve(linkPath)) {
        const delivered = readTextIfExists(join(linkPath, 'SKILL.md')) !== null;
        actions.push({
          kind: 'verify',
          path: linkPath,
          ok: delivered,
          reason: delivered
            ? `skill '${name}' already relocated — .agents/skills holds the canonical copy (reverse-direction symlink)`
            : `skill '${name}': the Claude dir symlinks here but no SKILL.md exists — broken relocation, reconcile by hand`,
        });
      } else {
        console.log(
          `NOTE    ${display(sourceDir)} — symlink to outside the neutral skills location (${display(resolvedSource)}); not relocated`,
        );
      }
      continue;
    }
    if (!sourceStats.isDirectory()) continue;
    const sourceSkillMd = readTextIfExists(join(sourceDir, 'SKILL.md'));
    if (sourceSkillMd === null) {
      console.log(`NOTE    ${display(sourceDir)} — no SKILL.md, not a skill; nothing relocated`);
      continue;
    }
    const linkPath = join(targetSkillsDir, name);
    const desiredTarget = linkTargetFor(name);
    const verdict = classifyAgentsSkillEntry(readAgentsSkillEntry(linkPath), desiredTarget, sourceSkillMd);
    if (verdict === 'conflict') {
      actions.push({
        kind: 'verify',
        path: linkPath,
        ok: false,
        reason: `skill '${name}' collides with a foreign entry — same-name collisions are undefined behavior (compat doc); reconcile by hand`,
      });
      continue;
    }
    skillSourceDirs.push(sourceDir);
    actions.push({
      kind: 'symlink',
      path: linkPath,
      target: desiredTarget,
      reason:
        verdict === 'migrate'
          ? `skill '${name}': replace the byte-identical relocation copy with a symlink (zero drift; copy backed up)`
          : `skill '${name}' → symlink into the neutral skills location (${audience})`,
    });
  }
  return { actions, skillSourceDirs };
}

/** Snapshot of what already occupies a `.agents/skills/<name>` slot, for the pure classifier. */
function readAgentsSkillEntry(path: string): AgentsSkillEntry {
  if (!pathExists(path)) return { kind: 'missing' };
  const stats = lstatSync(path);
  if (stats.isSymbolicLink()) return { kind: 'symlink', linkTarget: readlinkSync(path) };
  if (stats.isDirectory()) return { kind: 'directory', skillMd: readTextIfExists(join(path, 'SKILL.md')) };
  return { kind: 'file' };
}

/**
 * Claude commands converge on skills in every target CLI, but no `.claude/commands/`
 * source exists on this machine — the transform stays unbuilt until one does. Surface
 * the gap loudly rather than skipping silently.
 */
function warnUncompiledCommands(commandsDir: string): void {
  if (!existsSync(commandsDir)) return;
  const commandFiles = readdirSync(commandsDir, { recursive: true }).filter((entry) =>
    String(entry).endsWith('.md'),
  );
  if (commandFiles.length > 0) {
    console.warn(
      `WARN    ${display(commandsDir)} — ${commandFiles.length} command file(s) present but the command → skill transform is not built; commands are NOT compiled`,
    );
  }
}

function listMarkdownFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true })
    .map((entry) => String(entry))
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => join(dir, entry));
}

function statusOf(action: Action): Status {
  if (action.kind === 'verify') {
    return action.ok ? 'ok' : 'conflict';
  }
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
  if (action.kind === 'verify') {
    return;
  }
  if (action.kind === 'write') {
    if (status === 'update') backup(action.path);
    mkdirSync(dirname(action.path), { recursive: true });
    writeFileSync(action.path, action.desired);
    return;
  }
  if (action.kind === 'symlink') {
    if (pathExists(action.path)) {
      const stats = lstatSync(action.path);
      if (stats.isDirectory()) {
        // The migrate case: a relocation copy gives way to the symlink.
        backup(action.path);
        rmSync(action.path, { recursive: true });
      } else {
        if (stats.isFile()) backup(action.path);
        unlinkSync(action.path);
      }
    }
    mkdirSync(dirname(action.path), { recursive: true });
    symlinkSync(action.target, action.path);
    return;
  }
  backup(action.path);
  unlinkSync(action.path);
}

function backup(path: string): void {
  if (!pathExists(path)) return;
  const stats = lstatSync(path);
  const destination = join(BACKUP_ROOT, path.replace(/^\//, ''));
  mkdirSync(dirname(destination), { recursive: true });
  if (stats.isDirectory()) {
    cpSync(path, destination, { recursive: true });
  } else if (stats.isFile()) {
    copyFileSync(path, destination);
  }
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
