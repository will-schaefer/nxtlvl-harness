import { randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { harnessLayout } from '../paths.ts';
import type { HarnessSnapshot, RegistryState } from './types.ts';

export interface StoreOptions {
  env?: NodeJS.ProcessEnv;
  home?: string;
}

function pathsFor(options: StoreOptions) {
  return harnessLayout(options.env ?? process.env, options.home ?? os.homedir());
}

function atomicJsonWrite(target: string, value: unknown, harnessRoot: string): string {
  fs.mkdirSync(harnessRoot, { recursive: true, mode: 0o700 });
  fs.chmodSync(harnessRoot, 0o700);

  const temporary = path.join(
    harnessRoot,
    `.${path.basename(target)}.tmp.${process.pid}.${randomBytes(6).toString('hex')}`,
  );
  let descriptor: number | undefined;

  try {
    descriptor = fs.openSync(temporary, 'wx', 0o600);
    fs.writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.fchmodSync(descriptor, 0o600);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporary, target);
    return target;
  } catch (error) {
    if (descriptor !== undefined) {
      try {
        fs.closeSync(descriptor);
      } catch {
        // The original write error is the useful failure.
      }
    }
    try {
      fs.unlinkSync(temporary);
    } catch {
      // The temporary file may not have been created.
    }
    throw error;
  }
}

function readJson<T>(target: string): T {
  return JSON.parse(fs.readFileSync(target, 'utf8')) as T;
}

export function writeRegistry(state: RegistryState, options: StoreOptions = {}): string {
  const paths = pathsFor(options);
  return atomicJsonWrite(paths.registryFile, state, paths.root);
}

export function readRegistry(options: StoreOptions = {}): RegistryState {
  return readJson<RegistryState>(pathsFor(options).registryFile);
}

export function writeSnapshot(snapshot: HarnessSnapshot, options: StoreOptions = {}): string {
  const paths = pathsFor(options);
  return atomicJsonWrite(paths.snapshotFile, snapshot, paths.root);
}

export function readSnapshot(options: StoreOptions = {}): HarnessSnapshot {
  return readJson<HarnessSnapshot>(pathsFor(options).snapshotFile);
}
