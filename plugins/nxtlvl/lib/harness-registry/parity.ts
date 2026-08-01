// Parity: generate managed candidates, compare to observed, write reports only
// under the harness parity directory (or an injectable temp root). Never writes
// provider configuration files.

import { createHash, randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { harnessLayout } from '../paths.ts';
import {
  defaultClaudeProviderPaths,
  defaultCodexProviderPaths,
  FAMILY_PLUGIN_COMPONENTS,
  readClaudeProvider,
  readCodexProvider,
  type ClaudeProviderPaths,
  type CodexProviderPaths,
  type ProviderObservation,
} from './providers.ts';
import {
  fingerprintManaged,
  managedFromDesired,
  projectClaudeCandidate,
  projectCodexCandidate,
} from './projectors.ts';
import type { DesiredDeploymentState, ParityReport, RegistryFinding } from './types.ts';

export interface ParityOptions {
  env?: NodeJS.ProcessEnv;
  home?: string;
  claude?: ClaudeProviderPaths;
  codex?: CodexProviderPaths;
  parityDir?: string;
  desired?: Record<string, DesiredDeploymentState>;
  generatedAt?: string;
  /** When true, also write candidate provider payloads next to the reports. */
  writeCandidates?: boolean;
}

export interface ParityRunResult {
  ok: boolean;
  reports: { claude: ParityReport; codex: ParityReport };
  allPassed: boolean;
  findings: RegistryFinding[];
  parityDir: string;
  /** Provider file hashes before/after — must be identical (no provider writes). */
  providerHashes: {
    claude: { path: string; before: string; after: string };
    codex: { path: string; before: string; after: string };
  };
}

function sha256File(filePath: string): string {
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return '';
    return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  } catch {
    return '';
  }
}

function atomicJsonWrite(target: string, value: unknown): void {
  const directory = path.dirname(target);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const temporary = path.join(
    directory,
    `.${path.basename(target)}.tmp.${process.pid}.${randomBytes(6).toString('hex')}`,
  );
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    fs.renameSync(temporary, target);
  } catch (error) {
    try {
      fs.unlinkSync(temporary);
    } catch {
      // ignore
    }
    throw error;
  }
}

function observedManaged(observation: ProviderObservation): Record<string, boolean> {
  const observed: Record<string, boolean> = {};
  for (const plugin of observation.plugins) {
    if (plugin.familyComponentId === undefined) continue;
    if (FAMILY_PLUGIN_COMPONENTS[plugin.key] === undefined) continue;
    observed[plugin.key] = plugin.enabled;
  }
  return observed;
}

function buildMismatches(
  managed: Record<string, boolean>,
  observed: Record<string, boolean>,
): Array<{ key: string; managed: boolean; observed: boolean }> {
  const mismatches: Array<{ key: string; managed: boolean; observed: boolean }> = [];
  const keys = new Set([...Object.keys(managed), ...Object.keys(observed)]);
  for (const key of [...keys].sort()) {
    // Only compare keys present in both maps (installed family plugins).
    if (managed[key] === undefined || observed[key] === undefined) continue;
    if (managed[key] !== observed[key]) {
      mismatches.push({ key, managed: managed[key]!, observed: observed[key]! });
    }
  }
  return mismatches;
}

function reportForProvider(
  provider: 'claude' | 'codex',
  generatedAt: string,
  managed: Record<string, boolean>,
  observed: Record<string, boolean>,
  findings: ParityReport['findings'],
  pathHint?: string,
): ParityReport {
  const mismatches = buildMismatches(managed, observed);
  const errorFindings = findings.filter((finding) => finding.severity === 'error');
  const passed = mismatches.length === 0 && errorFindings.length === 0;
  // Managed map in the report is the desired projection for keys that are
  // comparable (present in observed), plus desired-only keys for transparency.
  const reportManaged: Record<string, boolean> = {};
  for (const key of Object.keys(managed).sort()) {
    if (observed[key] !== undefined || managed[key] !== undefined) {
      reportManaged[key] = managed[key]!;
    }
  }
  return {
    schemaVersion: 1,
    provider,
    generatedAt,
    passed,
    managed: reportManaged,
    observed,
    mismatches,
    findings: [
      ...findings,
      ...mismatches.map((mismatch) => ({
        code: 'parity.mismatch',
        severity: 'error' as const,
        message: `Managed ${mismatch.key} wants ${mismatch.managed}, observed ${mismatch.observed}.`,
        path: pathHint,
      })),
    ],
    fingerprint: fingerprintManaged(reportManaged),
  };
}

/**
 * Run parity for Claude and Codex. Writes reports under parityDir only.
 * Provider configuration files are never modified.
 */
export function runParity(options: ParityOptions = {}): ParityRunResult {
  const env = options.env ?? process.env;
  const home = options.home ?? os.homedir();
  const layout = harnessLayout(env, home);
  const parityDir = options.parityDir ?? layout.parityDir;
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const desired = options.desired ?? {};
  const managed = managedFromDesired(desired);

  const claudePaths = options.claude ?? defaultClaudeProviderPaths(home);
  const codexPaths = options.codex ?? defaultCodexProviderPaths(home);

  const claudeBefore = sha256File(claudePaths.settingsPath);
  const codexBefore = sha256File(codexPaths.configPath);

  const findings: RegistryFinding[] = [];

  // --- Claude ---
  let claudeObservation: ProviderObservation;
  let claudeProjectionFindings: ParityReport['findings'] = [];
  let claudeProjectedManaged = managed;
  let claudeCandidateContent: string | undefined;

  try {
    claudeObservation = readClaudeProvider(claudePaths);
    claudeProjectionFindings.push(...claudeObservation.findings);
    if (fs.existsSync(claudePaths.settingsPath) && fs.statSync(claudePaths.settingsPath).isFile()) {
      const text = fs.readFileSync(claudePaths.settingsPath, 'utf8');
      const projection = projectClaudeCandidate(text, managed);
      claudeProjectionFindings.push(...projection.findings);
      claudeProjectedManaged = projection.managed;
      // Prefer full managed map for comparison keys that exist in the file.
      const observedKeys = new Set(
        Object.keys(observedManaged(claudeObservation)),
      );
      const comparable: Record<string, boolean> = {};
      for (const key of Object.keys(managed)) {
        if (observedKeys.has(key)) comparable[key] = managed[key]!;
      }
      claudeProjectedManaged = comparable;
      claudeCandidateContent = projection.content;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    claudeObservation = {
      provider: 'claude',
      plugins: [],
      capabilities: [],
      findings: [{
        code: 'parity.claude.read_failed',
        severity: 'error',
        message,
        path: claudePaths.settingsPath,
      }],
    };
    claudeProjectionFindings = claudeObservation.findings;
  }

  const claudeObserved = observedManaged(claudeObservation);
  const claudeReport = reportForProvider(
    'claude',
    generatedAt,
    claudeProjectedManaged,
    claudeObserved,
    claudeProjectionFindings,
    claudePaths.settingsPath,
  );

  // --- Codex ---
  let codexObservation: ProviderObservation;
  let codexProjectionFindings: ParityReport['findings'] = [];
  let codexProjectedManaged = managed;
  let codexCandidateContent: string | undefined;

  try {
    codexObservation = readCodexProvider(codexPaths);
    codexProjectionFindings.push(...codexObservation.findings);
    if (fs.existsSync(codexPaths.configPath) && fs.statSync(codexPaths.configPath).isFile()) {
      const text = fs.readFileSync(codexPaths.configPath, 'utf8');
      const projection = projectCodexCandidate(text, managed);
      codexProjectionFindings.push(...projection.findings);
      const observedKeys = new Set(Object.keys(observedManaged(codexObservation)));
      const comparable: Record<string, boolean> = {};
      for (const key of Object.keys(managed)) {
        if (observedKeys.has(key)) comparable[key] = managed[key]!;
      }
      codexProjectedManaged = comparable;
      codexCandidateContent = projection.content;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    codexObservation = {
      provider: 'codex',
      plugins: [],
      capabilities: [],
      findings: [{
        code: 'parity.codex.read_failed',
        severity: 'error',
        message,
        path: codexPaths.configPath,
      }],
    };
    codexProjectionFindings = codexObservation.findings;
  }

  const codexObserved = observedManaged(codexObservation);
  const codexReport = reportForProvider(
    'codex',
    generatedAt,
    codexProjectedManaged,
    codexObserved,
    codexProjectionFindings,
    codexPaths.configPath,
  );

  // Write reports (and optional candidates) only under parityDir.
  fs.mkdirSync(parityDir, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(parityDir, 0o700);
  } catch {
    // Best effort on platforms that ignore mode.
  }

  atomicJsonWrite(path.join(parityDir, 'claude.json'), claudeReport);
  atomicJsonWrite(path.join(parityDir, 'codex.json'), codexReport);

  if (options.writeCandidates !== false) {
    if (claudeCandidateContent !== undefined) {
      const candidatePath = path.join(parityDir, 'claude.candidate.json');
      fs.writeFileSync(candidatePath, claudeCandidateContent, { mode: 0o600 });
    }
    if (codexCandidateContent !== undefined) {
      const candidatePath = path.join(parityDir, 'codex.candidate.toml');
      fs.writeFileSync(candidatePath, codexCandidateContent, { mode: 0o600 });
    }
  }

  const claudeAfter = sha256File(claudePaths.settingsPath);
  const codexAfter = sha256File(codexPaths.configPath);

  if (claudeBefore !== claudeAfter) {
    findings.push({
      code: 'parity.claude.provider_mutated',
      severity: 'error',
      message: 'Parity run mutated Claude settings; this is a bug.',
      path: claudePaths.settingsPath,
    });
  }
  if (codexBefore !== codexAfter) {
    findings.push({
      code: 'parity.codex.provider_mutated',
      severity: 'error',
      message: 'Parity run mutated Codex config; this is a bug.',
      path: codexPaths.configPath,
    });
  }

  for (const finding of claudeReport.findings) {
    findings.push({ ...finding, source: 'claude' });
  }
  for (const finding of codexReport.findings) {
    findings.push({ ...finding, source: 'codex' });
  }

  const allPassed = claudeReport.passed && codexReport.passed
    && claudeBefore === claudeAfter
    && codexBefore === codexAfter;

  return {
    ok: allPassed,
    reports: { claude: claudeReport, codex: codexReport },
    allPassed,
    findings,
    parityDir,
    providerHashes: {
      claude: {
        path: claudePaths.settingsPath,
        before: claudeBefore,
        after: claudeAfter,
      },
      codex: {
        path: codexPaths.configPath,
        before: codexBefore,
        after: codexAfter,
      },
    },
  };
}
