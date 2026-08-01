import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  appendEvent,
  deriveRuns,
  readEvents,
  recordingBoundary,
  type JournalOptions,
} from './journal.ts';
import type { JournalEvent } from './types.ts';

const temporaryDirectories: string[] = [];
const here = path.dirname(fileURLToPath(import.meta.url));

after(() => {
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function makeDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nxtlvl-journal-'));
  temporaryDirectories.push(directory);
  return directory;
}

function optionsFor(root: string, extra: Partial<JournalOptions> = {}): JournalOptions {
  return {
    env: { XDG_STATE_HOME: root },
    home: '/home/u',
    ...extra,
  };
}

function baseStart(
  overrides: Partial<JournalEvent> = {},
): Partial<JournalEvent> & Record<string, unknown> {
  return {
    eventType: 'run-start',
    sourceRepository: 'lab',
    sourceSurface: 'cli',
    runId: 'run-1',
    runKind: 'evaluation',
    processId: 4242,
    summary: 'start',
    ...overrides,
  };
}

function baseFinish(
  overrides: Partial<JournalEvent> = {},
): Partial<JournalEvent> & Record<string, unknown> {
  return {
    eventType: 'run-finish',
    sourceRepository: 'lab',
    sourceSurface: 'cli',
    runId: 'run-1',
    result: 'passed',
    durationMs: 12,
    summary: 'done',
    ...overrides,
  };
}

test('appendEvent writes one JSON line under harness/events.jsonl', () => {
  const root = makeDirectory();
  const options = optionsFor(root, {
    createEventId: () => 'evt-1',
    now: () => '2026-08-01T00:00:00.000Z',
  });

  const result = appendEvent(baseStart(), options);
  assert.equal(result.ok, true);

  const { events, findings } = readEvents(options);
  assert.equal(findings.length, 0);
  assert.equal(events.length, 1);
  assert.equal(events[0]?.eventId, 'evt-1');
  assert.equal(events[0]?.eventType, 'run-start');
  assert.equal(events[0]?.runId, 'run-1');
  assert.equal(events[0]?.schemaVersion, 1);

  const file = path.join(root, 'nxtlvl', 'harness', 'events.jsonl');
  assert.equal(fs.existsSync(file), true);
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  const raw = fs.readFileSync(file, 'utf8');
  assert.equal(raw.endsWith('\n'), true);
  assert.equal(raw.trimEnd().split('\n').length, 1);
});

test('appendEvent omits secrets, env dumps, full stdout, and absolute artifact paths', () => {
  const root = makeDirectory();
  const options = optionsFor(root, {
    createEventId: () => 'evt-secret',
    now: () => '2026-08-01T00:00:01.000Z',
  });

  const result = appendEvent({
    ...baseFinish(),
    summary: 'ok',
    artifactRefs: ['relative/scorecard.json', '/etc/passwd', '../escape.json'],
    stdout: 'FULL OUTPUT SHOULD NOT PERSIST',
    env: { SECRET: 'x' },
    prompts: ['system'],
    secrets: { token: 'abc' },
  } as Partial<JournalEvent> & Record<string, unknown>, options);

  assert.equal(result.ok, true);
  const { events } = readEvents(options);
  assert.equal(events.length, 1);
  const event = events[0] as JournalEvent & Record<string, unknown>;
  assert.equal(event.stdout, undefined);
  assert.equal(event.env, undefined);
  assert.equal(event.prompts, undefined);
  assert.equal(event.secrets, undefined);
  assert.deepEqual(event.artifactRefs, ['relative/scorecard.json']);
});

test('appendEvent bounds summary length and never throws on write failure', () => {
  const root = makeDirectory();
  const soft = appendEvent(baseStart(), optionsFor(root, {
    forceWriteError: 'disk full',
  }));
  assert.equal(soft.ok, false);
  if (soft.ok === false) {
    assert.match(soft.warning, /disk full/);
  }

  const long = 'x'.repeat(2000);
  const ok = appendEvent(baseStart({ summary: long }), optionsFor(root, {
    createEventId: () => 'evt-long',
    now: () => '2026-08-01T00:00:02.000Z',
  }));
  assert.equal(ok.ok, true);
  const { events } = readEvents(optionsFor(root));
  assert.equal(events[0]?.summary?.length, 500);
});

test('appendEvent soft-fails on missing required fields without throwing', () => {
  const root = makeDirectory();
  const result = appendEvent({ eventType: 'run-start' }, optionsFor(root));
  assert.equal(result.ok, false);
  if (result.ok === false) {
    assert.match(result.warning, /rejected/i);
  }
  assert.deepEqual(readEvents(optionsFor(root)).events, []);
});

test('readEvents skips torn and malformed lines and counts them as findings', () => {
  const root = makeDirectory();
  const file = path.join(root, 'nxtlvl', 'harness', 'events.jsonl');
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const goodStart = {
    schemaVersion: 1,
    eventId: 'good-1',
    timestamp: '2026-08-01T01:00:00.000Z',
    eventType: 'run-start',
    sourceRepository: 'core',
    sourceSurface: 'cli',
    runId: 'r-good',
  };
  const goodFinish = {
    schemaVersion: 1,
    eventId: 'good-2',
    timestamp: '2026-08-01T01:00:01.000Z',
    eventType: 'run-finish',
    sourceRepository: 'core',
    sourceSurface: 'cli',
    runId: 'r-good',
    result: 'failed',
  };

  fs.writeFileSync(
    file,
    [
      JSON.stringify(goodStart),
      '{not-json',
      '{"schemaVersion":1,"eventId":"partial"', // incomplete object
      'torn line without closing brace {"eventId":',
      JSON.stringify(goodFinish),
      '',
    ].join('\n') + '\n',
    'utf8',
  );

  const { events, findings } = readEvents(optionsFor(root));
  assert.equal(events.length, 2);
  assert.equal(events[0]?.eventId, 'good-1');
  assert.equal(events[1]?.eventId, 'good-2');
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.code, 'journal.malformed_line');
  assert.match(findings[0]?.message ?? '', /3/);
});

test('deriveRuns pairs start/finish and never invents a finish', () => {
  const events: JournalEvent[] = [
    {
      schemaVersion: 1,
      eventId: 's1',
      timestamp: '2026-08-01T02:00:00.000Z',
      eventType: 'run-start',
      sourceRepository: 'lab',
      sourceSurface: 'server',
      runId: 'pair-1',
      runKind: 'test',
      processId: 99,
      summary: 'start',
    },
    {
      schemaVersion: 1,
      eventId: 'f1',
      timestamp: '2026-08-01T02:00:05.000Z',
      eventType: 'run-finish',
      sourceRepository: 'lab',
      sourceSurface: 'server',
      runId: 'pair-1',
      result: 'passed',
      durationMs: 5000,
      summary: 'finish',
      artifactRefs: ['out/scorecard.json'],
    },
    {
      schemaVersion: 1,
      eventId: 's2',
      timestamp: '2026-08-01T02:01:00.000Z',
      eventType: 'run-start',
      sourceRepository: 'wiki',
      sourceSurface: 'cli',
      runId: 'open-1',
      runKind: 'evaluation',
      processId: 100,
    },
  ];

  const runs = deriveRuns(events, () => true);
  assert.equal(runs.length, 2);

  assert.equal(runs[0]?.runId, 'pair-1');
  assert.equal(runs[0]?.status, 'passed');
  assert.equal(runs[0]?.finishedAt, '2026-08-01T02:00:05.000Z');
  assert.equal(runs[0]?.finishEventId, 'f1');
  assert.equal(runs[0]?.durationMs, 5000);
  assert.deepEqual(runs[0]?.artifactRefs, ['out/scorecard.json']);

  assert.equal(runs[1]?.runId, 'open-1');
  assert.equal(runs[1]?.status, 'in-progress');
  assert.equal(runs[1]?.finishedAt, undefined);
  assert.equal(runs[1]?.finishEventId, undefined);
});

test('deriveRuns uses liveness for unmatched starts: in-progress / interrupted / unknown', () => {
  const makeStart = (runId: string, processId?: number): JournalEvent => ({
    schemaVersion: 1,
    eventId: `s-${runId}`,
    timestamp: '2026-08-01T03:00:00.000Z',
    eventType: 'run-start',
    sourceRepository: 'core',
    sourceSurface: 'cli',
    runId,
    processId,
  });

  const events = [
    makeStart('alive', 1),
    makeStart('dead', 2),
    makeStart('opaque', 3),
    makeStart('no-pid'),
  ];

  const runs = deriveRuns(events, (pid) => {
    if (pid === 1) return true;
    if (pid === 2) return false;
    return null;
  });

  const byId = Object.fromEntries(runs.map((run) => [run.runId, run.status]));
  assert.equal(byId.alive, 'in-progress');
  assert.equal(byId.dead, 'interrupted');
  assert.equal(byId.opaque, 'unknown');
  assert.equal(byId['no-pid'], 'unknown');
});

test('deriveRuns marks unmatched start unknown when no liveness probe is provided', () => {
  const events: JournalEvent[] = [{
    schemaVersion: 1,
    eventId: 's',
    timestamp: '2026-08-01T03:30:00.000Z',
    eventType: 'run-start',
    sourceRepository: 'lab',
    sourceSurface: 'bridge',
    runId: 'solo',
    processId: 777,
  }];
  const runs = deriveRuns(events);
  assert.equal(runs[0]?.status, 'unknown');
});

test('recordingBoundary is the earliest valid event timestamp', () => {
  assert.equal(recordingBoundary([]), null);
  const events: JournalEvent[] = [
    {
      schemaVersion: 1,
      eventId: 'b',
      timestamp: '2026-08-01T05:00:00.000Z',
      eventType: 'registry-op',
      sourceRepository: 'core',
      sourceSurface: 'cli',
    },
    {
      schemaVersion: 1,
      eventId: 'a',
      timestamp: '2026-08-01T04:00:00.000Z',
      eventType: 'run-start',
      sourceRepository: 'lab',
      sourceSurface: 'cli',
      runId: 'early',
    },
  ];
  assert.equal(recordingBoundary(events), '2026-08-01T04:00:00.000Z');
});

test('concurrent child writers do not interleave mid-line', () => {
  const root = makeDirectory();
  const file = path.join(root, 'nxtlvl', 'harness', 'events.jsonl');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '', 'utf8');

  const journalModuleUrl = pathToFileURL(path.join(here, 'journal.ts')).href;
  const workers = 12;
  const perWorker = 8;
  const script = `
    import { appendEvent } from ${JSON.stringify(journalModuleUrl)};
    const root = process.argv[1];
    const worker = process.argv[2];
    const count = Number(process.argv[3]);
    for (let i = 0; i < count; i += 1) {
      const result = appendEvent({
        eventType: 'run-start',
        sourceRepository: 'lab',
        sourceSurface: 'cli',
        runId: 'w-' + worker + '-' + i,
        eventId: 'evt-' + worker + '-' + i,
        timestamp: '2026-08-01T06:00:00.000Z',
        summary: 'payload-' + worker + '-' + i + '-' + 'x'.repeat(200),
      }, { env: { XDG_STATE_HOME: root }, home: '/home/u' });
      if (!result.ok) {
        console.error(JSON.stringify(result));
        process.exit(2);
      }
    }
  `;

  const children = Array.from({ length: workers }, (_, worker) =>
    spawnSync(process.execPath, ['--input-type=module', '-e', script, root, String(worker), String(perWorker)], {
      encoding: 'utf8',
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    }));

  for (const child of children) {
    assert.equal(child.status, 0, child.stderr + child.stdout);
  }

  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split('\n').filter((line) => line.length > 0);
  assert.equal(lines.length, workers * perWorker);

  const runIds = new Set<string>();
  for (const line of lines) {
    // Every physical line must be standalone valid JSON (no mid-line interleave).
    const parsed = JSON.parse(line) as JournalEvent;
    assert.equal(parsed.schemaVersion, 1);
    assert.ok(typeof parsed.runId === 'string');
    runIds.add(parsed.runId as string);
  }
  assert.equal(runIds.size, workers * perWorker);
});

test('start then finish appends pair into a passed RunRecord', () => {
  const root = makeDirectory();
  const options = optionsFor(root, {
    now: () => '2026-08-01T07:00:00.000Z',
  });

  assert.equal(appendEvent(baseStart({
    eventId: 'start-a',
    runId: 'lifecycle',
    timestamp: '2026-08-01T07:00:00.000Z',
  }), options).ok, true);

  assert.equal(appendEvent(baseFinish({
    eventId: 'finish-a',
    runId: 'lifecycle',
    timestamp: '2026-08-01T07:00:10.000Z',
    result: 'cancelled',
    durationMs: 10_000,
  }), options).ok, true);

  const { events } = readEvents(options);
  const runs = deriveRuns(events);
  assert.equal(runs.length, 1);
  assert.equal(runs[0]?.status, 'cancelled');
  assert.equal(runs[0]?.result, 'cancelled');
  assert.equal(recordingBoundary(events), '2026-08-01T07:00:00.000Z');
});
