import * as fs from 'node:fs';
import * as path from 'node:path';

export type ProviderName = 'claude' | 'codex';

export interface ProviderPluginObservation {
  key: string;
  name: string;
  marketplace: string;
  enabled: boolean;
  familyComponentId?: string;
  source?: string;
  controllable: boolean;
}

export interface ProviderCapabilityObservation {
  id: string;
  componentId: string;
  name: string;
  kind: 'hook';
  enabled: boolean;
  controlMode: 'self';
  controlId: string;
}

export interface ProviderObservation {
  provider: ProviderName;
  plugins: ProviderPluginObservation[];
  capabilities: ProviderCapabilityObservation[];
  findings: Array<{
    code: string;
    severity: 'error' | 'warning';
    message: string;
    path?: string;
  }>;
}

export interface ClaudeProviderPaths {
  settingsPath: string;
  marketplacesPath?: string;
}

export interface CodexProviderPaths {
  configPath: string;
}

const FAMILY_PLUGIN_COMPONENTS: Record<string, string> = {
  'nxtlvl@nxtlvl-dev': 'core/component/nxtlvl-plugin',
  'nxtlvl@nxtlvl-marketplace': 'core/component/nxtlvl-plugin',
  'nxtlvl-wiki@nxtlvl-dev': 'wiki/component/nxtlvl-wiki-plugin',
  'nxtlvl-wiki@nxtlvl-marketplace': 'wiki/component/nxtlvl-wiki-plugin',
  'nxtlvl-labs@nxtlvl-dev': 'lab/component/nxtlvl-labs-plugin',
  'nxtlvl-labs@nxtlvl-marketplace': 'lab/component/nxtlvl-labs-plugin',
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function splitPluginKey(key: string): { name: string; marketplace: string } | null {
  const at = key.lastIndexOf('@');
  if (at <= 0 || at === key.length - 1) return null;
  return { name: key.slice(0, at), marketplace: key.slice(at + 1) };
}

function normalizeSource(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  const source = value.source;
  if (!isRecord(source)) return undefined;
  if (typeof source.repo === 'string') return `github:${source.repo}`;
  if (typeof source.url === 'string') return `git:${source.url}`;
  if (typeof source.path === 'string') return 'local';
  return undefined;
}

function observationForPlugin(
  key: string,
  enabled: boolean,
  marketplaceSources: Record<string, unknown> = {},
): ProviderPluginObservation | null {
  const parsed = splitPluginKey(key);
  if (parsed === null) return null;
  return {
    key,
    name: parsed.name,
    marketplace: parsed.marketplace,
    enabled,
    ...(FAMILY_PLUGIN_COMPONENTS[key] === undefined ? {} : { familyComponentId: FAMILY_PLUGIN_COMPONENTS[key] }),
    source: normalizeSource(marketplaceSources[parsed.marketplace]),
    controllable: true,
  };
}

function safeReadJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function readClaudeProvider(paths: ClaudeProviderPaths): ProviderObservation {
  const findings: ProviderObservation['findings'] = [];
  const plugins: ProviderPluginObservation[] = [];
  let marketplaces: Record<string, unknown> = {};

  try {
    if (paths.marketplacesPath !== undefined && fs.existsSync(paths.marketplacesPath)) {
      const parsed = safeReadJson(paths.marketplacesPath);
      if (isRecord(parsed)) marketplaces = parsed;
    }

    const settings = safeReadJson(paths.settingsPath);
    if (!isRecord(settings) || !isRecord(settings.enabledPlugins)) {
      return {
        provider: 'claude',
        plugins,
        capabilities: [],
        findings: [{
          code: 'provider.claude.invalid_settings',
          severity: 'error',
          message: 'Claude settings must contain an enabledPlugins object.',
          path: paths.settingsPath,
        }],
      };
    }

    for (const [key, rawEnabled] of Object.entries(settings.enabledPlugins)) {
      if (typeof rawEnabled !== 'boolean') {
        findings.push({
          code: 'provider.claude.invalid_plugin_state',
          severity: 'warning',
          message: `Claude plugin state is not boolean: ${key}.`,
          path: paths.settingsPath,
        });
        continue;
      }
      const observation = observationForPlugin(key, rawEnabled, marketplaces);
      if (observation !== null) plugins.push(observation);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    findings.push({
      code: 'provider.claude.read_failed',
      severity: 'error',
      message: `Claude provider import failed safely: ${message}`,
      path: paths.settingsPath,
    });
  }

  return { provider: 'claude', plugins: plugins.sort((left, right) => left.key.localeCompare(right.key)), capabilities: [], findings };
}

function stripInlineComment(line: string): string {
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') quoted = !quoted;
    if (char === '#' && !quoted) return line.slice(0, index).trimEnd();
  }
  return line.trimEnd();
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/gu, '"').replace(/\\\\/gu, '\\');
  }
  return trimmed;
}

function parseTomlTables(text: string): Map<string, Record<string, string | boolean>> {
  const tables = new Map<string, Record<string, string | boolean>>();
  let current: string | null = null;

  for (const rawLine of text.split(/\r?\n/u)) {
    const line = stripInlineComment(rawLine).trim();
    if (line.length === 0) continue;
    const table = line.match(/^\[([^\]]+)\]$/u);
    if (table !== null) {
      current = table[1] ?? null;
      if (current !== null && !tables.has(current)) tables.set(current, {});
      continue;
    }
    if (current === null) continue;
    const assignment = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/u);
    if (assignment === null) continue;
    const key = assignment[1] as string;
    const rawValue = assignment[2] as string;
    tables.get(current)![key] = rawValue === 'true'
      ? true
      : rawValue === 'false'
        ? false
        : unquote(rawValue);
  }

  return tables;
}

function parseQuotedTableKey(prefix: string, tableName: string): string | null {
  const marker = `${prefix}."`;
  if (!tableName.startsWith(marker) || !tableName.endsWith('"')) return null;
  return tableName.slice(marker.length, -1).replace(/\\"/gu, '"').replace(/\\\\/gu, '\\');
}

export function readCodexProvider(paths: CodexProviderPaths): ProviderObservation {
  const findings: ProviderObservation['findings'] = [];
  const plugins: ProviderPluginObservation[] = [];

  try {
    const tables = parseTomlTables(fs.readFileSync(paths.configPath, 'utf8'));
    const marketplaceSources: Record<string, unknown> = {};
    for (const [tableName, values] of tables) {
      const marketplace = tableName.startsWith('marketplaces.') ? tableName.slice('marketplaces.'.length) : null;
      if (marketplace === null) continue;
      marketplaceSources[marketplace] = {
        source: {
          source: values.source_type,
          path: values.source_type === 'local' ? values.source : undefined,
          url: values.source_type === 'git' ? values.source : undefined,
        },
      };
    }

    for (const [tableName, values] of tables) {
      const key = parseQuotedTableKey('plugins', tableName);
      if (key === null) continue;
      const enabled = values.enabled;
      if (typeof enabled !== 'boolean') {
        findings.push({
          code: 'provider.codex.invalid_plugin_state',
          severity: 'warning',
          message: `Codex plugin state is not boolean: ${key}.`,
          path: paths.configPath,
        });
        continue;
      }
      const observation = observationForPlugin(key, enabled, marketplaceSources);
      if (observation !== null) plugins.push(observation);
    }

    const capabilities: ProviderCapabilityObservation[] = [];
    for (const [tableName, values] of tables) {
      const key = parseQuotedTableKey('hooks.state', tableName);
      if (key === null || values.enabled !== true) continue;
      const plugin = key.split(':')[0] ?? '';
      const familyComponentId = FAMILY_PLUGIN_COMPONENTS[plugin];
      if (familyComponentId === undefined) continue;
      const id = `${familyComponentId.replace('/component/', '/hook/')}-${key.replace(/[^a-z0-9]+/giu, '-')}`;
      capabilities.push({
        id,
        componentId: familyComponentId,
        name: key,
        kind: 'hook',
        enabled: true,
        controlMode: 'self',
        controlId: id,
      });
    }

    return {
      provider: 'codex',
      plugins: plugins.sort((left, right) => left.key.localeCompare(right.key)),
      capabilities: capabilities.sort((left, right) => left.id.localeCompare(right.id)),
      findings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    findings.push({
      code: 'provider.codex.read_failed',
      severity: 'error',
      message: `Codex provider import failed safely: ${message}`,
      path: paths.configPath,
    });
  }

  return { provider: 'codex', plugins, capabilities: [], findings };
}

export function defaultClaudeProviderPaths(home = process.env.HOME ?? ''): ClaudeProviderPaths {
  return {
    settingsPath: path.join(home, '.claude/settings.json'),
    marketplacesPath: path.join(home, '.claude/plugins/known_marketplaces.json'),
  };
}

export function defaultCodexProviderPaths(home = process.env.HOME ?? ''): CodexProviderPaths {
  return { configPath: path.join(home, '.codex/config.toml') };
}
