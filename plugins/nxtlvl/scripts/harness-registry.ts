import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { buildSnapshot } from '../lib/harness-registry/snapshot.ts';
import { readSnapshot } from '../lib/harness-registry/store.ts';

interface CommandIo {
  stdout: Pick<NodeJS.WriteStream, 'write'>;
  stderr: Pick<NodeJS.WriteStream, 'write'>;
}

const USAGE = 'Usage: harness-registry snapshot [--fixture <snapshot-input.json>]';

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

export function dispatch(
  argv: string[],
  io: CommandIo = { stdout: process.stdout, stderr: process.stderr },
): number {
  if (argv[0] !== 'snapshot') {
    io.stderr.write(`${USAGE}\n`);
    return 2;
  }

  if (argv.length === 1) {
    try {
      printJson(readSnapshot(), io);
      return 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      io.stderr.write(`Could not read snapshot: ${message}\n`);
      return 1;
    }
  }

  if (argv.length !== 3 || argv[1] !== '--fixture') {
    io.stderr.write(`${USAGE}\n`);
    return 2;
  }

  const fixturePath = path.resolve(argv[2]);
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

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) {
  process.exitCode = dispatch(process.argv.slice(2));
}
