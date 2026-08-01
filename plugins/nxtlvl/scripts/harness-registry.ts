import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  activate,
  bench,
  checkParity,
  cutover,
  exitCodeFor,
  importObserved,
  reconcile,
  type AuthorityOptions,
} from '../lib/harness-registry/authority.ts';
import { appendEvent } from '../lib/harness-registry/journal.ts';
import type { ClaudeProviderPaths, CodexProviderPaths } from '../lib/harness-registry/providers.ts';
import { buildSnapshot } from '../lib/harness-registry/snapshot.ts';
import { readSnapshot } from '../lib/harness-registry/store.ts';
import type {
  JournalRunKind,
  JournalRunResult,
  JournalSourceRepository,
  JournalSourceSurface,
  OperationResult,
} from '../lib/harness-registry/types.ts';

interface CommandIo {
  stdout: Pick<NodeJS.WriteStream, 'write'>;
  stderr: Pick<NodeJS.WriteStream, 'write'>;
}

const USAGE = [
  'Usage:',
  '  harness-registry snapshot [--fixture <snapshot-input.json>]',
  '  harness-registry import [--claude-settings <p>] [--codex-config <p>] [--claude-marketplaces <p>]',
  '  harness-registry parity [--out <parityDir>] [--claude-settings <p>] [--codex-config <p>]',
  '  harness-registry cutover',
  '  harness-registry activate <id>',
  '  harness-registry bench <id>',
  '  harness-registry reconcile',
  '  harness-registry record-start --run-id <id> --kind <k> --source lab|core|wiki --surface cli|server|bridge|unknown [--capability <id>] [--pid N] [--summary "..."]',
  '  harness-registry record-finish --run-id <id> --result passed|failed|error|cancelled [--source lab|core|wiki] [--surface cli|server|bridge|unknown] [--duration-ms N] [--summary "..."] [--artifact <path>]...',
].join('\n');

const RUN_KINDS = new Set<JournalRunKind>([
  'evaluation',
  'test',
  'agentic-evaluation',
  'pressure-test',
  'graduation',
  'other',
]);

const RUN_RESULTS = new Set<JournalRunResult>([
  'passed',
  'failed',
  'error',
  'cancelled',
]);

const SOURCES = new Set<JournalSourceRepository>(['core', 'wiki', 'lab']);
const SURFACES = new Set<JournalSourceSurface>(['cli', 'server', 'bridge', 'unknown']);

function resolveFixtureRepositories(value: unknown, fixturePath: string): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value;
  const input = value as Record<string, unknown>;
  if (!Array.isArray(input.repositories)) return value;

  return {
    ...input,
    repositories: input.repositories.map((repository) => {
      if (typeof repository !== 'object' || repository === null || Array.isArray(repository)) {
        return repository;
      }
      const entry = repository as Record<string, unknown>;
      if (typeof entry.repositoryRoot !== 'string') return repository;
      return {
        ...entry,
        repositoryRoot: path.resolve(path.dirname(fixturePath), entry.repositoryRoot),
      };
    }),
  };
}

function printJson(value: unknown, io: CommandIo): void {
  io.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

interface ParsedFlags {
  rest: string[];
  flags: Record<string, string>;
  /** Multi-value flags (e.g. repeated --artifact). */
  multi: Record<string, string[]>;
}

function parseFlags(argv: string[]): ParsedFlags {
  const flags: Record<string, string> = {};
  const multi: Record<string, string[]> = {};
  const rest: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] as string;
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('--')) {
        flags[key] = 'true';
        continue;
      }
      if (key === 'artifact') {
        if (multi.artifact === undefined) multi.artifact = [];
        multi.artifact.push(value);
      } else {
        flags[key] = value;
      }
      index += 1;
      continue;
    }
    rest.push(arg);
  }
  return { rest, flags, multi };
}

function authorityFromFlags(flags: Record<string, string>): AuthorityOptions {
  const options: AuthorityOptions = {
    env: process.env,
  };
  const claude: Partial<ClaudeProviderPaths> = {};
  const codex: Partial<CodexProviderPaths> = {};
  if (flags['claude-settings'] !== undefined) {
    claude.settingsPath = path.resolve(flags['claude-settings']);
  }
  if (flags['claude-marketplaces'] !== undefined) {
    claude.marketplacesPath = path.resolve(flags['claude-marketplaces']);
  }
  if (flags['codex-config'] !== undefined) {
    codex.configPath = path.resolve(flags['codex-config']);
  }
  if (claude.settingsPath !== undefined) {
    options.claude = {
      settingsPath: claude.settingsPath,
      marketplacesPath: claude.marketplacesPath,
    };
  }
  if (codex.configPath !== undefined) {
    options.codex = { configPath: codex.configPath };
  }
  if (flags.out !== undefined) {
    options.parityDir = path.resolve(flags.out);
  }
  return options;
}

function emitOperation(opResult: OperationResult, io: CommandIo): number {
  printJson(opResult, io);
  return exitCodeFor(opResult);
}

function dispatchSnapshot(argv: string[], io: CommandIo): number {
  if (argv.length === 0) {
    try {
      printJson(readSnapshot(), io);
      return 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      io.stderr.write(`Could not read snapshot: ${message}\n`);
      return 1;
    }
  }

  const { rest, flags } = parseFlags(argv);
  if (rest.length > 0 || flags.fixture === undefined) {
    io.stderr.write(`${USAGE}\n`);
    return 1;
  }

  const fixturePath = path.resolve(flags.fixture);
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    printJson(buildSnapshot(resolveFixtureRepositories(parsed, fixturePath)), io);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr.write(`Could not read fixture: ${message}\n`);
    return 1;
  }
}

function usageError(io: CommandIo): number {
  io.stderr.write(`${USAGE}\n`);
  return 1;
}

function dispatchRecordStart(argv: string[], io: CommandIo): number {
  const { rest, flags } = parseFlags(argv);
  if (rest.length > 0) return usageError(io);

  const runId = flags['run-id'];
  const kind = flags.kind;
  const source = flags.source;
  const surface = flags.surface;

  if (
    runId === undefined
    || kind === undefined
    || source === undefined
    || surface === undefined
  ) {
    return usageError(io);
  }

  if (!RUN_KINDS.has(kind as JournalRunKind)) return usageError(io);
  if (!SOURCES.has(source as JournalSourceRepository)) return usageError(io);
  if (!SURFACES.has(surface as JournalSourceSurface)) return usageError(io);

  let processId: number | undefined;
  if (flags.pid !== undefined) {
    const parsed = Number(flags.pid);
    if (!Number.isInteger(parsed) || parsed <= 0) return usageError(io);
    processId = parsed;
  }

  const result = appendEvent({
    eventType: 'run-start',
    runId,
    runKind: kind as JournalRunKind,
    sourceRepository: source as JournalSourceRepository,
    sourceSurface: surface as JournalSourceSurface,
    capabilityId: flags.capability,
    processId,
    summary: flags.summary,
  });

  if (result.ok) {
    printJson({ ok: true }, io);
  } else {
    printJson({ ok: false, warning: result.warning }, io);
  }
  // Fail-open: soft append failure still exits 0. Only usage errors exit 1.
  return 0;
}

function dispatchRecordFinish(argv: string[], io: CommandIo): number {
  const { rest, flags, multi } = parseFlags(argv);
  if (rest.length > 0) return usageError(io);

  const runId = flags['run-id'];
  const resultFlag = flags.result;
  if (runId === undefined || resultFlag === undefined) return usageError(io);
  if (!RUN_RESULTS.has(resultFlag as JournalRunResult)) return usageError(io);

  const source = (flags.source ?? 'core') as JournalSourceRepository;
  const surface = (flags.surface ?? 'cli') as JournalSourceSurface;
  if (!SOURCES.has(source)) return usageError(io);
  if (!SURFACES.has(surface)) return usageError(io);

  let durationMs: number | undefined;
  if (flags['duration-ms'] !== undefined) {
    const parsed = Number(flags['duration-ms']);
    if (!Number.isFinite(parsed) || parsed < 0) return usageError(io);
    durationMs = Math.floor(parsed);
  }

  const result = appendEvent({
    eventType: 'run-finish',
    runId,
    result: resultFlag as JournalRunResult,
    sourceRepository: source,
    sourceSurface: surface,
    capabilityId: flags.capability,
    durationMs,
    summary: flags.summary,
    artifactRefs: multi.artifact,
  });

  if (result.ok) {
    printJson({ ok: true }, io);
  } else {
    printJson({ ok: false, warning: result.warning }, io);
  }
  return 0;
}

export function dispatch(
  argv: string[],
  io: CommandIo = { stdout: process.stdout, stderr: process.stderr },
): number {
  const command = argv[0];
  if (command === undefined) {
    io.stderr.write(`${USAGE}\n`);
    return 1;
  }

  try {
    if (command === 'snapshot') {
      return dispatchSnapshot(argv.slice(1), io);
    }

    if (command === 'record-start') {
      return dispatchRecordStart(argv.slice(1), io);
    }

    if (command === 'record-finish') {
      return dispatchRecordFinish(argv.slice(1), io);
    }

    const { rest, flags } = parseFlags(argv.slice(1));
    const options = authorityFromFlags(flags);

    if (command === 'import') {
      if (rest.length > 0) {
        io.stderr.write(`${USAGE}\n`);
        return 1;
      }
      return emitOperation(importObserved(options), io);
    }

    if (command === 'parity') {
      if (rest.length > 0) {
        io.stderr.write(`${USAGE}\n`);
        return 1;
      }
      return emitOperation(checkParity(options), io);
    }

    if (command === 'cutover') {
      if (rest.length > 0) {
        io.stderr.write(`${USAGE}\n`);
        return 1;
      }
      return emitOperation(cutover(options), io);
    }

    if (command === 'activate') {
      if (rest.length !== 1) {
        io.stderr.write(`${USAGE}\n`);
        return 1;
      }
      return emitOperation(activate(rest[0] as string, options), io);
    }

    if (command === 'bench') {
      if (rest.length !== 1) {
        io.stderr.write(`${USAGE}\n`);
        return 1;
      }
      return emitOperation(bench(rest[0] as string, options), io);
    }

    if (command === 'reconcile') {
      if (rest.length > 0) {
        io.stderr.write(`${USAGE}\n`);
        return 1;
      }
      return emitOperation(reconcile(options), io);
    }

    io.stderr.write(`${USAGE}\n`);
    return 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    printJson({
      ok: false,
      operation: command,
      phase: 'catalog-only',
      outcome: 'error',
      message,
    } satisfies OperationResult, io);
    return 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) {
  process.exitCode = dispatch(process.argv.slice(2));
}
