import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, test } from 'node:test';

import { assembleFamilySnapshot, type FamilyRoots } from './family.ts';
import { writeRegistry } from './store.ts';

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function makeDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nxtlvl-family-'));
  temporaryDirectories.push(directory);
  return directory;
}

function write(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function catalogFor(owner: string): string {
  return `schema_version: 1\nowner: ${owner}\ncomponents: []\n`;
}

interface Fixture {
  roots: FamilyRoots;
  home: string;
  env: NodeJS.ProcessEnv;
}

function familyFixture(): Fixture {
  const root = makeDirectory();
  const roots: FamilyRoots = {
    core: path.join(root, 'core'),
    wiki: path.join(root, 'wiki'),
    lab: path.join(root, 'lab'),
  };
  write(path.join(roots.core, 'nxtlvl.catalog.yaml'), catalogFor('core'));
  write(path.join(roots.wiki, 'nxtlvl.catalog.yaml'), catalogFor('wiki'));
  write(path.join(roots.lab, 'nxtlvl.catalog.yaml'), catalogFor('lab'));
  const home = path.join(root, 'home');
  write(path.join(home, '.claude', 'settings.json'), JSON.stringify({ enabledPlugins: {} }));
  write(path.join(home, '.codex', 'config.toml'), '');
  return { roots, home, env: { XDG_STATE_HOME: path.join(root, 'state') } };
}

test('phase stays catalog-only until registry state exists, even with providers observed', () => {
  const fixture = familyFixture();
  const snapshot = assembleFamilySnapshot({
    env: fixture.env,
    home: fixture.home,
    roots: fixture.roots,
    generatedAt: '2026-08-01T12:00:00.000Z',
  });

  assert.equal(snapshot.phase, 'catalog-only');
  assert.equal(snapshot.generatedAt, '2026-08-01T12:00:00.000Z');
  assert.deepEqual(snapshot.findings, []);
  assert.equal(snapshot.parityEligible, true);
});

test('phase mirrors registry.json once authority state exists', () => {
  const fixture = familyFixture();
  writeRegistry({
    schemaVersion: 1,
    phase: 'authoritative',
    desired: {},
    appliedFingerprints: {},
  }, { env: fixture.env });

  const snapshot = assembleFamilySnapshot({
    env: fixture.env,
    home: fixture.home,
    roots: fixture.roots,
    generatedAt: '2026-08-01T12:00:00.000Z',
  });

  assert.equal(snapshot.phase, 'authoritative');
});

test('a missing catalog degrades to a read finding, never a throw', () => {
  const fixture = familyFixture();
  fs.rmSync(path.join(fixture.roots.lab, 'nxtlvl.catalog.yaml'));

  const snapshot = assembleFamilySnapshot({
    env: fixture.env,
    home: fixture.home,
    roots: fixture.roots,
    generatedAt: '2026-08-01T12:00:00.000Z',
  });

  assert.equal(snapshot.phase, 'catalog-only');
  assert.deepEqual(
    snapshot.findings.map((finding) => [finding.code, finding.source]),
    [['catalog.read_failed', 'lab']],
  );
  assert.equal(snapshot.parityEligible, false);
});
