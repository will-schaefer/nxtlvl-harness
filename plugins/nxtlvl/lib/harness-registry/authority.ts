// Authority gates: import, parity, cutover, activate, bench, reconcile.
// Provider files are written only when phase is authoritative and only through
// structured projectors. Partial apply is always Drift — never false Active.

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { harnessLayout } from '../paths.ts';
import { runParity, type ParityOptions } from './parity.ts';
import {
  applyClaudeProjection,
  applyCodexProjection,
  fileSha256,
  isExternalOrReadOnlyId,
  isFamilyManagedComponentId,
  managedFromDesired,
} from './projectors.ts';
import {
  defaultClaudeProviderPaths,
  defaultCodexProviderPaths,
  FAMILY_PLUGIN_COMPONENTS,
  readClaudeProvider,
  readCodexProvider,
  type ClaudeProviderPaths,
  type CodexProviderPaths,
} from './providers.ts';
import { readRegistry, writeRegistry, type StoreOptions } from './store.ts';
import type {
  DesiredDeploymentState,
  OperationResult,
  RegistryFinding,
  RegistryPhase,
  RegistryState,
} from './types.ts';

export interface AuthorityOptions {
  env?: NodeJS.ProcessEnv;
  home?: string;
  claude?: ClaudeProviderPaths;
  codex?: CodexProviderPaths;
  parityDir?: string;
  generatedAt?: string;
}

function storeOptions(options: AuthorityOptions): StoreOptions {
  return { env: options.env, home: options.home };
}

function defaultRegistry(): RegistryState {
  return {
    schemaVersion: 1,
    phase: 'catalog-only',
    desired: {},
    appliedFingerprints: {},
  };
}

export function loadRegistry(options: AuthorityOptions = {}): RegistryState {
  try {
    return readRegistry(storeOptions(options));
  } catch {
    return defaultRegistry();
  }
}

function saveRegistry(state: RegistryState, options: AuthorityOptions): void {
  writeRegistry(state, storeOptions(options));
}

function result(
  partial: Omit<OperationResult, 'ok'> & { ok?: boolean },
): OperationResult {
  const ok = partial.ok ?? (partial.outcome === 'passed');
  return { ...partial, ok };
}

function providerPaths(options: AuthorityOptions): {
  claude: ClaudeProviderPaths;
  codex: CodexProviderPaths;
} {
  const home = options.home ?? os.homedir();
  return {
    claude: options.claude ?? defaultClaudeProviderPaths(home),
    codex: options.codex ?? defaultCodexProviderPaths(home),
  };
}

function parityOptionsFrom(options: AuthorityOptions, desired: Record<string, DesiredDeploymentState>): ParityOptions {
  const paths = providerPaths(options);
  return {
    env: options.env,
    home: options.home,
    claude: paths.claude,
    codex: paths.codex,
    parityDir: options.parityDir,
    desired,
    generatedAt: options.generatedAt,
  };
}

/**
 * Seed desired managed state from observed provider installation.
 * Never writes provider files. Advances phase to `imported`.
 */
export function importObserved(options: AuthorityOptions = {}): OperationResult {
  const paths = providerPaths(options);
  const beforeClaude = fileSha256(paths.claude.settingsPath);
  const beforeCodex = fileSha256(paths.codex.configPath);

  const findings: RegistryFinding[] = [];
  const claude = readClaudeProvider(paths.claude);
  const codex = readCodexProvider(paths.codex);
  findings.push(
    ...claude.findings.map((finding) => ({ ...finding, source: 'claude' })),
    ...codex.findings.map((finding) => ({ ...finding, source: 'codex' })),
  );

  const desired: Record<string, DesiredDeploymentState> = {};
  for (const observation of [claude, codex]) {
    for (const plugin of observation.plugins) {
      if (plugin.familyComponentId === undefined) continue;
      if (FAMILY_PLUGIN_COMPONENTS[plugin.key] === undefined) continue;
      if (plugin.enabled) {
        desired[plugin.familyComponentId] = 'active';
      } else if (desired[plugin.familyComponentId] === undefined) {
        desired[plugin.familyComponentId] = 'benched';
      }
    }
  }

  const previous = loadRegistry(options);
  // Re-import allowed from catalog-only or imported. Authority phases keep
  // their phase but may refresh desired only if still pre-authoritative.
  if (previous.phase === 'authoritative') {
    return result({
      ok: false,
      operation: 'import',
      phase: previous.phase,
      outcome: 'blocked',
      message: 'Import is blocked after cutover; use reconcile to reapply desired state.',
      findings,
    });
  }

  const next: RegistryState = {
    schemaVersion: 1,
    phase: 'imported',
    desired,
    appliedFingerprints: previous.appliedFingerprints,
  };
  saveRegistry(next, options);

  const afterClaude = fileSha256(paths.claude.settingsPath);
  const afterCodex = fileSha256(paths.codex.configPath);
  if (beforeClaude !== afterClaude || beforeCodex !== afterCodex) {
    findings.push({
      code: 'authority.import.provider_mutated',
      severity: 'error',
      message: 'Import mutated provider files; this is a bug.',
    });
    return result({
      ok: false,
      operation: 'import',
      phase: next.phase,
      outcome: 'error',
      message: 'Import mutated provider files.',
      findings,
    });
  }

  return result({
    ok: true,
    operation: 'import',
    phase: next.phase,
    outcome: 'passed',
    message: `Imported ${Object.keys(desired).length} managed component(s) into desired state.`,
    findings,
  });
}

/**
 * Run parity. Allowed from imported+. Does not write provider files.
 * On full pass while phase is imported, advances to parity-ready.
 */
export function checkParity(options: AuthorityOptions = {}): OperationResult {
  const state = loadRegistry(options);
  if (state.phase === 'catalog-only') {
    return result({
      ok: false,
      operation: 'parity',
      phase: state.phase,
      outcome: 'blocked',
      message: 'Parity requires import first (phase is catalog-only).',
    });
  }

  const parity = runParity(parityOptionsFrom(options, state.desired));
  let phase: RegistryPhase = state.phase;

  if (parity.allPassed && state.phase === 'imported') {
    phase = 'parity-ready';
    saveRegistry({ ...state, phase }, options);
  }

  return result({
    ok: parity.allPassed,
    operation: 'parity',
    phase,
    outcome: parity.allPassed ? 'passed' : 'drift',
    message: parity.allPassed
      ? 'All managed adapters passed parity.'
      : 'Parity found mismatches or errors; see parity reports.',
    findings: parity.findings,
    parity: {
      claude: parity.reports.claude.passed,
      codex: parity.reports.codex.passed,
    },
  });
}

/**
 * Explicit cutover: parity-ready → authoritative, only when all managed
 * adapters currently pass parity.
 */
export function cutover(options: AuthorityOptions = {}): OperationResult {
  const state = loadRegistry(options);
  if (state.phase === 'authoritative') {
    return result({
      ok: true,
      operation: 'cutover',
      phase: state.phase,
      outcome: 'passed',
      message: 'Already authoritative.',
    });
  }
  if (state.phase !== 'parity-ready' && state.phase !== 'imported') {
    return result({
      ok: false,
      operation: 'cutover',
      phase: state.phase,
      outcome: 'blocked',
      message: `Cutover requires phase imported or parity-ready (current: ${state.phase}).`,
    });
  }

  const parity = runParity(parityOptionsFrom(options, state.desired));
  if (!parity.allPassed) {
    // Stay/move to imported if not ready.
    if (state.phase === 'parity-ready') {
      // Demote? Spec says cutover blocked until parity passes — keep phase.
    } else if (state.phase === 'imported') {
      // no change
    }
    return result({
      ok: false,
      operation: 'cutover',
      phase: state.phase,
      outcome: 'blocked',
      message: 'Cutover blocked: not all managed adapters pass parity.',
      findings: parity.findings,
      parity: {
        claude: parity.reports.claude.passed,
        codex: parity.reports.codex.passed,
      },
    });
  }

  // Ensure parity-ready then authoritative.
  const next: RegistryState = {
    ...state,
    phase: 'authoritative',
  };
  saveRegistry(next, options);

  return result({
    ok: true,
    operation: 'cutover',
    phase: next.phase,
    outcome: 'passed',
    message: 'Cutover complete; registry is authoritative for managed provider fields.',
    findings: parity.findings,
    parity: {
      claude: parity.reports.claude.passed,
      codex: parity.reports.codex.passed,
    },
  });
}

function requireAuthoritative(
  operation: string,
  state: RegistryState,
): OperationResult | null {
  if (state.phase !== 'authoritative') {
    return result({
      ok: false,
      operation,
      phase: state.phase,
      outcome: 'blocked',
      message: `${operation} requires phase authoritative (current: ${state.phase}).`,
    });
  }
  return null;
}

function validateActivatableId(
  operation: string,
  id: string,
  state: RegistryState,
): OperationResult | null {
  if (id.trim().length === 0) {
    return result({
      ok: false,
      operation,
      phase: state.phase,
      outcome: 'usage-error',
      message: `${operation} requires a component id.`,
      id,
    });
  }
  if (isExternalOrReadOnlyId(id) || !isFamilyManagedComponentId(id)) {
    return result({
      ok: false,
      operation,
      phase: state.phase,
      outcome: 'blocked',
      message: `Cannot ${operation} external, parent-controlled, or non-family id: ${id}.`,
      id,
      deployment: 'drift',
    });
  }
  return null;
}

/**
 * Apply desired managed state to both providers and re-scan.
 * Returns drift if either apply fails or post-scan mismatches desired.
 */
function applyDesired(
  operation: string,
  state: RegistryState,
  options: AuthorityOptions,
  id?: string,
  deploymentIntent?: 'active' | 'benched',
): OperationResult {
  const paths = providerPaths(options);
  const managed = managedFromDesired(state.desired);
  const findings: RegistryFinding[] = [];

  const claudeApply = applyClaudeProjection(paths.claude.settingsPath, managed);
  const codexApply = applyCodexProjection(paths.codex.configPath, managed);
  findings.push(
    ...claudeApply.findings.map((finding) => ({ ...finding, source: 'claude' })),
    ...codexApply.findings.map((finding) => ({ ...finding, source: 'codex' })),
  );

  const applyOk = claudeApply.ok && codexApply.ok;
  const appliedFingerprints = { ...state.appliedFingerprints };
  if (claudeApply.ok && claudeApply.fingerprint !== undefined) {
    appliedFingerprints.claude = claudeApply.fingerprint;
  }
  if (codexApply.ok && codexApply.fingerprint !== undefined) {
    appliedFingerprints.codex = codexApply.fingerprint;
  }

  // Desired is already written by caller; refresh fingerprints.
  saveRegistry({ ...state, appliedFingerprints }, options);

  // Re-scan and compare.
  const parity = runParity(parityOptionsFrom(options, state.desired));
  findings.push(...parity.findings.filter((finding) =>
    finding.code.startsWith('parity.mismatch')
    || finding.severity === 'error',
  ));

  if (!applyOk || !parity.allPassed) {
    return result({
      ok: false,
      operation,
      phase: state.phase,
      outcome: 'drift',
      message: applyOk
        ? 'Apply completed but re-scan shows drift.'
        : 'Partial apply failure; desired may be updated but deployment is drift.',
      findings,
      parity: {
        claude: parity.reports.claude.passed,
        codex: parity.reports.codex.passed,
      },
      deployment: 'drift',
      id,
    });
  }

  return result({
    ok: true,
    operation,
    phase: state.phase,
    outcome: 'passed',
    message: deploymentIntent === undefined
      ? 'Reconcile applied desired managed state.'
      : `Set ${id} to ${deploymentIntent} and applied managed providers.`,
    findings,
    parity: {
      claude: true,
      codex: true,
    },
    deployment: deploymentIntent,
    id,
  });
}

/**
 * Set desired Active for a family-managed component and apply projectors.
 * Requires authoritative phase. External/parent/read-only ids are blocked.
 */
export function activate(id: string, options: AuthorityOptions = {}): OperationResult {
  const state = loadRegistry(options);
  const blocked = requireAuthoritative('activate', state);
  if (blocked !== null) return blocked;
  const invalid = validateActivatableId('activate', id, state);
  if (invalid !== null) return invalid;

  const next: RegistryState = {
    ...state,
    desired: { ...state.desired, [id]: 'active' },
  };
  // Atomic desired write before provider projection.
  saveRegistry(next, options);
  return applyDesired('activate', next, options, id, 'active');
}

/**
 * Set desired Benched for a family-managed component and apply projectors.
 */
export function bench(id: string, options: AuthorityOptions = {}): OperationResult {
  const state = loadRegistry(options);
  const blocked = requireAuthoritative('bench', state);
  if (blocked !== null) return blocked;
  const invalid = validateActivatableId('bench', id, state);
  if (invalid !== null) return invalid;

  const next: RegistryState = {
    ...state,
    desired: { ...state.desired, [id]: 'benched' },
  };
  saveRegistry(next, options);
  return applyDesired('bench', next, options, id, 'benched');
}

/**
 * Reapply current desired managed state and re-scan. Requires authoritative.
 */
export function reconcile(options: AuthorityOptions = {}): OperationResult {
  const state = loadRegistry(options);
  const blocked = requireAuthoritative('reconcile', state);
  if (blocked !== null) return blocked;
  return applyDesired('reconcile', state, options);
}

/** Resolve harness parity dir for callers that need the default path. */
export function defaultParityDir(options: AuthorityOptions = {}): string {
  return harnessLayout(options.env ?? process.env, options.home ?? os.homedir()).parityDir;
}

/** Exit code for an OperationResult (CLI contract). */
export function exitCodeFor(resultValue: OperationResult): number {
  if (resultValue.ok && resultValue.outcome === 'passed') return 0;
  if (resultValue.outcome === 'blocked') return 2;
  if (resultValue.outcome === 'drift') return 3;
  if (resultValue.outcome === 'usage-error') return 1;
  if (resultValue.outcome === 'error') return 1;
  if (resultValue.ok) return 0;
  return 1;
}

/** Whether a path is under the harness parity dir or an obvious temp root (safety check). */
export function isSafeParityOutputPath(parityDir: string, stateRootHint?: string): boolean {
  const resolved = path.resolve(parityDir);
  if (stateRootHint !== undefined) {
    const root = path.resolve(stateRootHint);
    if (resolved === root || resolved.startsWith(root + path.sep)) return true;
  }
  // Allow any path under system temp for tests.
  const tmp = path.resolve(os.tmpdir());
  if (resolved === tmp || resolved.startsWith(tmp + path.sep)) return true;
  // Allow default harness parity layout fragment.
  if (resolved.includes(`${path.sep}nxtlvl${path.sep}harness${path.sep}parity`)) return true;
  return false;
}

export function registryExists(options: AuthorityOptions = {}): boolean {
  const layout = harnessLayout(options.env ?? process.env, options.home ?? os.homedir());
  return fs.existsSync(layout.registryFile);
}
