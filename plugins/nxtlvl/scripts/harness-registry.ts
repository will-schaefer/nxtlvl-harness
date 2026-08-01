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
import type { ClaudeProviderPaths, CodexProviderPaths } from '../lib/harness-registry/providers.ts';
import { buildSnapshot } from '../lib/harness-registry/snapshot.ts';
import { readSnapshot } from '../lib/harness-registry/store.ts';
import type { OperationResult } from '../lib/harness-registry/types.ts';

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
].join('\n');

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
}

function parseFlags(argv: string[]): ParsedFlags {
  const flags: Record<string, string> = {};
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
      flags[key] = value;
      index += 1;
      continue;
    }
    rest.push(arg);
  }
  return { rest, flags };
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
