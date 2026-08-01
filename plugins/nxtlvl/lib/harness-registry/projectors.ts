// Structured projectors for Claude settings.json and Codex config.toml.
// Candidate generation never writes provider files. Apply rewrites only owned
// managed plugin fields and preserves unrelated content.

import { createHash, randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { FAMILY_PLUGIN_COMPONENTS } from './providers.ts';
import type { DesiredDeploymentState } from './types.ts';

export type ProviderProjectorName = 'claude' | 'codex';

export interface ProjectorFinding {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  path?: string;
}

export interface ClaudeProjection {
  provider: 'claude';
  content: string;
  managed: Record<string, boolean>;
  settings: Record<string, unknown>;
  findings: ProjectorFinding[];
}

export interface CodexProjection {
  provider: 'codex';
  content: string;
  managed: Record<string, boolean>;
  findings: ProjectorFinding[];
}

export interface ApplyResult {
  ok: boolean;
  provider: ProviderProjectorName;
  path: string;
  findings: ProjectorFinding[];
  fingerprint?: string;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Build managed pluginKey → enabled from registry desired component state. */
export function managedFromDesired(
  desired: Record<string, DesiredDeploymentState>,
): Record<string, boolean> {
  const managed: Record<string, boolean> = {};
  for (const [pluginKey, componentId] of Object.entries(FAMILY_PLUGIN_COMPONENTS)) {
    const state = desired[componentId];
    if (state === undefined) continue;
    managed[pluginKey] = state === 'active';
  }
  return managed;
}

/** Stable fingerprint of a managed enabled map (order-independent). */
export function fingerprintManaged(managed: Record<string, boolean>): string {
  const entries = Object.keys(managed)
    .sort()
    .map((key) => [key, managed[key]] as const);
  return createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

export function fileSha256(filePath: string): string {
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return '';
    return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  } catch {
    return '';
  }
}

function atomicWriteFile(target: string, content: string): void {
  const directory = path.dirname(target);
  fs.mkdirSync(directory, { recursive: true });
  const temporary = path.join(
    directory,
    `.${path.basename(target)}.tmp.${process.pid}.${randomBytes(6).toString('hex')}`,
  );
  try {
    fs.writeFileSync(temporary, content, { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temporary, target);
  } catch (error) {
    try {
      fs.unlinkSync(temporary);
    } catch {
      // Temporary may never have been created.
    }
    throw error;
  }
}

/**
 * Project Claude settings: only managed keys under enabledPlugins for family
 * plugins. Never touch env or unrelated top-level keys.
 */
export function projectClaudeCandidate(
  settingsText: string,
  managed: Record<string, boolean>,
): ClaudeProjection {
  const findings: ProjectorFinding[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(settingsText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      provider: 'claude',
      content: settingsText,
      managed: {},
      settings: {},
      findings: [{
        code: 'projector.claude.invalid_json',
        severity: 'error',
        message: `Claude settings are not valid JSON: ${message}`,
      }],
    };
  }

  if (!isRecord(parsed)) {
    return {
      provider: 'claude',
      content: settingsText,
      managed: {},
      settings: {},
      findings: [{
        code: 'projector.claude.invalid_settings',
        severity: 'error',
        message: 'Claude settings root must be a JSON object.',
      }],
    };
  }

  const next: UnknownRecord = { ...parsed };
  const enabledPlugins = isRecord(parsed.enabledPlugins)
    ? { ...parsed.enabledPlugins }
    : {};

  // Only rewrite family-owned keys that already exist in enabledPlugins, or that
  // the registry explicitly manages and the key is present in managed.
  for (const [key, enabled] of Object.entries(managed)) {
    if (FAMILY_PLUGIN_COMPONENTS[key] === undefined) continue;
    if (Object.prototype.hasOwnProperty.call(enabledPlugins, key)
      || Object.prototype.hasOwnProperty.call(managed, key)) {
      // Only add a key when it already existed — avoid inventing marketplace
      // variants that were never installed.
      if (Object.prototype.hasOwnProperty.call(enabledPlugins, key)) {
        enabledPlugins[key] = enabled;
      }
    }
  }

  next.enabledPlugins = enabledPlugins;
  const content = `${JSON.stringify(next, null, 2)}\n`;
  // Report only keys that exist in the projected file and are family-managed.
  const projectedManaged: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(enabledPlugins)) {
    if (FAMILY_PLUGIN_COMPONENTS[key] === undefined) continue;
    if (typeof value !== 'boolean') {
      findings.push({
        code: 'projector.claude.invalid_plugin_state',
        severity: 'warning',
        message: `Claude plugin state is not boolean after projection: ${key}.`,
      });
      continue;
    }
    if (managed[key] !== undefined) projectedManaged[key] = value;
  }

  return {
    provider: 'claude',
    content,
    managed: projectedManaged,
    settings: next,
    findings,
  };
}

/**
 * Project Codex config.toml: only rewrite `enabled` inside owned
 * `[plugins."<key>"]` tables. Preserve all other content byte-stable where
 * possible via section-aware line rewrite (no full TOML re-serialize).
 */
export function projectCodexCandidate(
  configText: string,
  managed: Record<string, boolean>,
): CodexProjection {
  const findings: ProjectorFinding[] = [];
  const lines = configText.split(/\r?\n/u);
  const endsWithNewline = configText.endsWith('\n') || configText.endsWith('\r\n');
  const projectedManaged: Record<string, boolean> = {};
  const seenManaged = new Set<string>();

  let currentPluginKey: string | null = null;
  const output: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    const table = trimmed.match(/^\[([^\]]+)\]$/u);
    if (table !== null) {
      const tableName = table[1] ?? '';
      currentPluginKey = parsePluginsTableKey(tableName);
      output.push(rawLine);
      continue;
    }

    if (currentPluginKey !== null
      && managed[currentPluginKey] !== undefined
      && FAMILY_PLUGIN_COMPONENTS[currentPluginKey] !== undefined) {
      const assignment = trimmed.match(/^enabled\s*=\s*(true|false)\s*(#.*)?$/iu);
      if (assignment !== null) {
        const enabled = managed[currentPluginKey] === true;
        const comment = assignment[2] ? ` ${assignment[2]}` : '';
        // Preserve leading indentation from the original line.
        const indent = rawLine.match(/^\s*/u)?.[0] ?? '';
        output.push(`${indent}enabled = ${enabled ? 'true' : 'false'}${comment}`);
        projectedManaged[currentPluginKey] = enabled;
        seenManaged.add(currentPluginKey);
        continue;
      }
    }

    output.push(rawLine);
  }

  // Record managed keys present as tables but missing an enabled line as findings.
  for (const key of Object.keys(managed)) {
    if (FAMILY_PLUGIN_COMPONENTS[key] === undefined) continue;
    if (seenManaged.has(key)) continue;
    // Key not present in file — do not invent tables for v1.
    if (configText.includes(`[plugins."${key}"]`) || configText.includes(`[plugins.${key}]`)) {
      findings.push({
        code: 'projector.codex.missing_enabled',
        severity: 'warning',
        message: `Codex plugin table exists without a boolean enabled field: ${key}.`,
      });
    }
  }

  let content = output.join('\n');
  if (endsWithNewline && !content.endsWith('\n')) content += '\n';

  return {
    provider: 'codex',
    content,
    managed: projectedManaged,
    findings,
  };
}

function parsePluginsTableKey(tableName: string): string | null {
  const marker = 'plugins."';
  if (tableName.startsWith(marker) && tableName.endsWith('"')) {
    return tableName.slice(marker.length, -1).replace(/\\"/gu, '"').replace(/\\\\/gu, '\\');
  }
  return null;
}

/** Apply a Claude projection to a live settings path (caller enforces authority). */
export function applyClaudeProjection(
  settingsPath: string,
  managed: Record<string, boolean>,
): ApplyResult {
  try {
    if (fs.existsSync(settingsPath) && !fs.statSync(settingsPath).isFile()) {
      return {
        ok: false,
        provider: 'claude',
        path: settingsPath,
        findings: [{
          code: 'projector.claude.apply_failed',
          severity: 'error',
          message: `Claude apply failed: path is not a file: ${settingsPath}`,
          path: settingsPath,
        }],
      };
    }
    const existing = fs.existsSync(settingsPath)
      ? fs.readFileSync(settingsPath, 'utf8')
      : '{\n}\n';
    const projection = projectClaudeCandidate(existing, managed);
    if (projection.findings.some((finding) => finding.severity === 'error')) {
      return {
        ok: false,
        provider: 'claude',
        path: settingsPath,
        findings: projection.findings,
      };
    }
    atomicWriteFile(settingsPath, projection.content);
    return {
      ok: true,
      provider: 'claude',
      path: settingsPath,
      findings: projection.findings,
      fingerprint: fingerprintManaged(projection.managed),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      provider: 'claude',
      path: settingsPath,
      findings: [{
        code: 'projector.claude.apply_failed',
        severity: 'error',
        message: `Claude apply failed: ${message}`,
        path: settingsPath,
      }],
    };
  }
}

/** Apply a Codex projection to a live config path (caller enforces authority). */
export function applyCodexProjection(
  configPath: string,
  managed: Record<string, boolean>,
): ApplyResult {
  try {
    if (fs.existsSync(configPath) && !fs.statSync(configPath).isFile()) {
      return {
        ok: false,
        provider: 'codex',
        path: configPath,
        findings: [{
          code: 'projector.codex.apply_failed',
          severity: 'error',
          message: `Codex apply failed: path is not a file: ${configPath}`,
          path: configPath,
        }],
      };
    }
    const existing = fs.existsSync(configPath)
      ? fs.readFileSync(configPath, 'utf8')
      : '';
    const projection = projectCodexCandidate(existing, managed);
    if (projection.findings.some((finding) => finding.severity === 'error')) {
      return {
        ok: false,
        provider: 'codex',
        path: configPath,
        findings: projection.findings,
      };
    }
    atomicWriteFile(configPath, projection.content);
    return {
      ok: true,
      provider: 'codex',
      path: configPath,
      findings: projection.findings,
      fingerprint: fingerprintManaged(projection.managed),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      provider: 'codex',
      path: configPath,
      findings: [{
        code: 'projector.codex.apply_failed',
        severity: 'error',
        message: `Codex apply failed: ${message}`,
        path: configPath,
      }],
    };
  }
}

/** Whether an id is a family-managed component the projectors can control. */
export function isFamilyManagedComponentId(id: string): boolean {
  return Object.values(FAMILY_PLUGIN_COMPONENTS).includes(id);
}

export function isExternalOrReadOnlyId(id: string): boolean {
  return id.startsWith('external/') || !isFamilyManagedComponentId(id);
}
