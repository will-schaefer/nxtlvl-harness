import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.resolve(here, '../../scripts/harness-registry.ts');
const fixture = path.join(here, 'fixtures', 'snapshot-input.json');

test('snapshot command emits normalized JSON from a fixture without writing state', () => {
  const stateRoot = path.join(os.tmpdir(), `nxtlvl-registry-cli-${process.pid}-${Date.now()}`);
  const result = spawnSync(process.execPath, [script, 'snapshot', '--fixture', fixture], {
    encoding: 'utf8',
    env: { ...process.env, NODE_NO_WARNINGS: '1', XDG_STATE_HOME: stateRoot },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  const snapshot = JSON.parse(result.stdout) as Record<string, unknown>;
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.generatedAt, '2026-07-28T12:00:00.000Z');
  assert.deepEqual(
    (snapshot.components as Array<{ id: string }>).map((component) => component.id),
    ['core/component/nxtlvl-plugin'],
  );
  assert.deepEqual(
    (snapshot.findings as Array<{ code: string; source: string }>).map((finding) => [finding.code, finding.source]),
    [
      ['component.source_missing', 'core-fixture'],
      ['catalog.invalid_type', 'wiki-fixture'],
    ],
  );
  assert.equal(fs.existsSync(stateRoot), false);
});

test('unknown command reports usage on stderr and exits 2', () => {
  const result = spawnSync(process.execPath, [script, 'unknown'], {
    encoding: 'utf8',
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage: harness-registry snapshot/);
  assert.equal(result.stdout, '');
});
