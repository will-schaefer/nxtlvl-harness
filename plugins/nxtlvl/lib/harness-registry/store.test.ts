import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, test } from 'node:test';

import { harnessLayout } from '../paths.ts';
import {
  readRegistry,
  readSnapshot,
  writeRegistry,
  writeSnapshot,
} from './store.ts';

const temporaryRoots: string[] = [];

function temporaryStateRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nxtlvl-registry-store-'));
  temporaryRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('registry and snapshot writes are owner-only and leave no temporary files', () => {
  const stateRoot = temporaryStateRoot();
  const options = { env: { XDG_STATE_HOME: stateRoot }, home: '/home/u' };
  const paths = harnessLayout(options.env, options.home);
  fs.mkdirSync(paths.root, { recursive: true, mode: 0o777 });
  fs.chmodSync(paths.root, 0o777);
  const registry = {
    schemaVersion: 1 as const,
    phase: 'catalog-only' as const,
    desired: {},
    appliedFingerprints: {},
  };
  const snapshot = {
    schemaVersion: 1 as const,
    generatedAt: '2026-07-28T12:00:00.000Z',
    phase: 'catalog-only' as const,
    components: [],
    capabilities: [],
    resources: [],
    findings: [],
  };

  writeRegistry(registry, options);
  writeSnapshot(snapshot, options);

  assert.equal(fs.statSync(paths.root).mode & 0o777, 0o700);
  assert.equal(fs.statSync(paths.registryFile).mode & 0o777, 0o600);
  assert.equal(fs.statSync(paths.snapshotFile).mode & 0o777, 0o600);
  assert.deepEqual(readRegistry(options), registry);
  assert.deepEqual(readSnapshot(options), snapshot);
  assert.deepEqual(fs.readdirSync(paths.root).sort(), ['registry.json', 'snapshot.json']);
});

test('registry replacement is atomic for readers with the old file open', () => {
  const stateRoot = temporaryStateRoot();
  const options = { env: { XDG_STATE_HOME: stateRoot }, home: '/home/u' };
  const first = {
    schemaVersion: 1 as const,
    phase: 'catalog-only' as const,
    desired: { 'core/component/nxtlvl-plugin': 'active' as const },
    appliedFingerprints: {},
  };
  const second = {
    ...first,
    desired: { 'core/component/nxtlvl-plugin': 'benched' as const },
  };

  writeRegistry(first, options);
  const file = harnessLayout(options.env, options.home).registryFile;
  const oldReader = fs.openSync(file, 'r');
  writeRegistry(second, options);

  try {
    assert.deepEqual(JSON.parse(fs.readFileSync(oldReader, 'utf8')), first);
    assert.deepEqual(readRegistry(options), second);
  } finally {
    fs.closeSync(oldReader);
  }
});

test('snapshot replacement is atomic for readers with the old file open', () => {
  const stateRoot = temporaryStateRoot();
  const options = { env: { XDG_STATE_HOME: stateRoot }, home: '/home/u' };
  const first = {
    schemaVersion: 1 as const,
    generatedAt: '2026-07-28T12:00:00.000Z',
    phase: 'catalog-only' as const,
    components: [],
    capabilities: [],
    resources: [],
    findings: [],
  };
  const second = {
    ...first,
    generatedAt: '2026-07-28T12:01:00.000Z',
  };

  writeSnapshot(first, options);
  const file = harnessLayout(options.env, options.home).snapshotFile;
  const oldReader = fs.openSync(file, 'r');
  writeSnapshot(second, options);

  try {
    assert.deepEqual(JSON.parse(fs.readFileSync(oldReader, 'utf8')), first);
    assert.deepEqual(readSnapshot(options), second);
  } finally {
    fs.closeSync(oldReader);
  }
});
