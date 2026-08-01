// Append-only family run journal under the machine-local harness state root
// (events.jsonl). Fail-open relative to any wrapped command: journal errors
// never throw and never change the exit code of the command being recorded.

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { harnessLayout } from '../paths.ts';
import type { StoreOptions } from './store.ts';
import type {
  JournalEvent,
  JournalEventType,
  JournalFinding,
  JournalRunKind,
  JournalRunResult,
  JournalSourceRepository,
  JournalSourceSurface,
  RegistryFinding,
  RunRecord,
  RunStatus,
} from './types.ts';

export interface JournalOptions extends StoreOptions {
  /** Override events file path (tests). */
  eventsFile?: string;
  now?: () => string;
  createEventId?: () => string;
  /** Force the write path to fail (tests). */
  forceWriteError?: string | Error;
}

export type AppendEventResult =
  | { ok: true }
  | { ok: false; warning: string };

export interface ReadEventsResult {
  events: JournalEvent[];
  findings: RegistryFinding[];
}

const EVENT_TYPES = new Set<JournalEventType>([
  'run-start',
  'run-finish',
  'registry-op',
]);

const SOURCE_REPOSITORIES = new Set<JournalSourceRepository>([
  'core',
  'wiki',
  'lab',
]);

const SOURCE_SURFACES = new Set<JournalSourceSurface>([
  'cli',
  'server',
  'bridge',
  'unknown',
]);

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

/** Rejected / never persisted payload keys (secrets, full output, env dumps). */
const REJECTED_KEYS = new Set([
  'stdout',
  'stderr',
  'env',
  'environment',
  'prompt',
  'prompts',
  'secrets',
  'secret',
  'transcript',
  'transcripts',
  'modelTranscript',
  'fullOutput',
  'output',
  'commandOutput',
]);

const MAX_SUMMARY_CHARS = 500;
const MAX_ARTIFACT_REFS = 32;
const MAX_FINDINGS = 32;

function pathsFor(options: JournalOptions) {
  return harnessLayout(options.env ?? process.env, options.home ?? os.homedir());
}

function eventsPath(options: JournalOptions): string {
  if (options.eventsFile !== undefined) return options.eventsFile;
  return pathsFor(options).eventsFile;
}

function isRelativePath(value: string): boolean {
  if (value.length === 0) return false;
  if (path.isAbsolute(value)) return false;
  if (value.includes('\0')) return false;
  // Reject Windows drive paths and path escape attempts that leave the journal root.
  if (/^[a-zA-Z]:[\\/]/u.test(value)) return false;
  const normalized = path.posix.normalize(value.replace(/\\/gu, '/'));
  if (normalized.startsWith('../') || normalized === '..') return false;
  return true;
}

function boundSummary(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.replace(/\r?\n/gu, ' ').trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.length <= MAX_SUMMARY_CHARS) return trimmed;
  return trimmed.slice(0, MAX_SUMMARY_CHARS);
}

function normalizeFindings(value: unknown): JournalFinding[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: JournalFinding[] = [];
  for (const item of value.slice(0, MAX_FINDINGS)) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    if (typeof row.code !== 'string' || typeof row.message !== 'string') continue;
    if (row.severity !== 'error' && row.severity !== 'warning') continue;
    out.push({
      code: row.code,
      severity: row.severity,
      message: boundSummary(row.message) ?? row.message.slice(0, MAX_SUMMARY_CHARS),
    });
  }
  return out.length > 0 ? out : undefined;
}

function normalizeArtifactRefs(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    if (!isRelativePath(item)) continue;
    out.push(item.replace(/\\/gu, '/'));
    if (out.length >= MAX_ARTIFACT_REFS) break;
  }
  return out.length > 0 ? out : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Build a persistable journal event: fill identity fields, drop rejected keys,
 * bound summary, keep only relative artifact paths. Returns null when required
 * identity fields are unusable (caller turns that into a soft warning).
 */
export function normalizeEvent(
  input: Partial<JournalEvent> & Record<string, unknown>,
  options: JournalOptions = {},
): JournalEvent | null {
  if (!isPlainObject(input)) return null;

  const eventType = input.eventType;
  if (typeof eventType !== 'string' || !EVENT_TYPES.has(eventType as JournalEventType)) {
    return null;
  }

  const sourceRepository = input.sourceRepository;
  if (
    typeof sourceRepository !== 'string'
    || !SOURCE_REPOSITORIES.has(sourceRepository as JournalSourceRepository)
  ) {
    return null;
  }

  const sourceSurface = input.sourceSurface;
  if (
    typeof sourceSurface !== 'string'
    || !SOURCE_SURFACES.has(sourceSurface as JournalSourceSurface)
  ) {
    return null;
  }

  const eventId =
    typeof input.eventId === 'string' && input.eventId.length > 0
      ? input.eventId
      : (options.createEventId?.() ?? randomUUID());
  const timestamp =
    typeof input.timestamp === 'string' && input.timestamp.length > 0
      ? input.timestamp
      : (options.now?.() ?? new Date().toISOString());

  const event: JournalEvent = {
    schemaVersion: 1,
    eventId,
    timestamp,
    eventType: eventType as JournalEventType,
    sourceRepository: sourceRepository as JournalSourceRepository,
    sourceSurface: sourceSurface as JournalSourceSurface,
  };

  if (typeof input.capabilityId === 'string' && input.capabilityId.length > 0) {
    event.capabilityId = input.capabilityId;
  }
  if (typeof input.runId === 'string' && input.runId.length > 0) {
    event.runId = input.runId;
  }
  if (typeof input.runKind === 'string' && RUN_KINDS.has(input.runKind as JournalRunKind)) {
    event.runKind = input.runKind as JournalRunKind;
  }
  if (typeof input.processId === 'number' && Number.isInteger(input.processId) && input.processId > 0) {
    event.processId = input.processId;
  }
  const summary = boundSummary(input.summary);
  if (summary !== undefined) event.summary = summary;
  if (typeof input.result === 'string' && RUN_RESULTS.has(input.result as JournalRunResult)) {
    event.result = input.result as JournalRunResult;
  }
  if (typeof input.durationMs === 'number' && Number.isFinite(input.durationMs) && input.durationMs >= 0) {
    event.durationMs = Math.floor(input.durationMs);
  }
  const artifacts = normalizeArtifactRefs(input.artifactRefs);
  if (artifacts !== undefined) event.artifactRefs = artifacts;
  const findings = normalizeFindings(input.findings);
  if (findings !== undefined) event.findings = findings;

  // Explicitly ignore REJECTED_KEYS (stdout/env/prompts/secrets/…) — never copy them.
  for (const key of REJECTED_KEYS) {
    void key;
  }

  return event;
}

function appendLineAtomic(filePath: string, line: string): void {
  const harnessRoot = path.dirname(filePath);
  fs.mkdirSync(harnessRoot, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(harnessRoot, 0o700);
  } catch {
    // Best-effort directory mode; append still proceeds.
  }

  // One physical line: strip embedded newlines so concurrent O_APPEND writers
  // never interleave mid-record even if a caller passes a multi-line string.
  const oneLine = line.replace(/\r?\n/gu, ' ');
  const buffer = Buffer.from(`${oneLine}\n`, 'utf8');

  // O_APPEND + single write of the full buffer — atomic for small lines on a
  // local filesystem. fsync so a crash after return still has durable bytes.
  const descriptor = fs.openSync(filePath, 'a', 0o600);
  try {
    fs.writeSync(descriptor, buffer, 0, buffer.length, null);
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // Best-effort file mode.
  }
}

/**
 * Append one journal event. Never throws. Failures return `{ ok: false, warning }`.
 */
export function appendEvent(
  event: Partial<JournalEvent> & Record<string, unknown>,
  options: JournalOptions = {},
): AppendEventResult {
  try {
    if (options.forceWriteError !== undefined) {
      const message =
        options.forceWriteError instanceof Error
          ? options.forceWriteError.message
          : String(options.forceWriteError);
      return { ok: false, warning: `journal append failed: ${message}` };
    }

    const normalized = normalizeEvent(event, options);
    if (normalized === null) {
      return {
        ok: false,
        warning:
          'journal append rejected: event requires eventType, sourceRepository, and sourceSurface',
      };
    }

    const target = eventsPath(options);
    appendLineAtomic(target, JSON.stringify(normalized));
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, warning: `journal append failed: ${message}` };
  }
}

function parseEventLine(line: string): JournalEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;
  if (parsed.schemaVersion !== 1) return null;
  if (typeof parsed.eventId !== 'string' || parsed.eventId.length === 0) return null;
  if (typeof parsed.timestamp !== 'string' || parsed.timestamp.length === 0) return null;
  if (typeof parsed.eventType !== 'string' || !EVENT_TYPES.has(parsed.eventType as JournalEventType)) {
    return null;
  }
  if (
    typeof parsed.sourceRepository !== 'string'
    || !SOURCE_REPOSITORIES.has(parsed.sourceRepository as JournalSourceRepository)
  ) {
    return null;
  }
  if (
    typeof parsed.sourceSurface !== 'string'
    || !SOURCE_SURFACES.has(parsed.sourceSurface as JournalSourceSurface)
  ) {
    return null;
  }

  // Re-normalize to strip any leaked rejected fields and re-bound summaries.
  return normalizeEvent(parsed as Partial<JournalEvent> & Record<string, unknown>, {
    createEventId: () => parsed.eventId as string,
    now: () => parsed.timestamp as string,
  });
}

/**
 * Read the journal. Missing file → empty. Torn/malformed lines are skipped and
 * counted as findings; valid lines still return.
 */
export function readEvents(options: JournalOptions = {}): ReadEventsResult {
  const findings: RegistryFinding[] = [];
  const events: JournalEvent[] = [];
  const target = eventsPath(options);

  let raw: string;
  try {
    raw = fs.readFileSync(target, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return { events: [], findings: [] };
    }
    findings.push({
      code: 'journal.read_failed',
      severity: 'warning',
      message: `Could not read journal: ${err.message}`,
      path: target,
    });
    return { events: [], findings };
  }

  const lines = raw.split('\n');
  let malformed = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] as string;
    if (line.length === 0) continue;
    // Final empty segment after trailing newline is already skipped; a non-empty
    // unparseable line (including a torn last line) is a finding.
    const event = parseEventLine(line);
    if (event === null) {
      malformed += 1;
      continue;
    }
    events.push(event);
  }

  if (malformed > 0) {
    findings.push({
      code: 'journal.malformed_line',
      severity: 'warning',
      message: `Skipped ${malformed} malformed or torn journal line(s).`,
      path: target,
    });
  }

  return { events, findings };
}

/**
 * Pair run-start / run-finish by runId. Unmatched starts use the liveness probe:
 * true → in-progress, false → interrupted, null / missing pid → unknown.
 * Never invents a finish event.
 */
export function deriveRuns(
  events: JournalEvent[],
  liveness?: (pid: number) => boolean | null,
): RunRecord[] {
  type OpenRun = {
    start: JournalEvent;
    finish?: JournalEvent;
  };

  const byRunId = new Map<string, OpenRun>();
  const order: string[] = [];

  for (const event of events) {
    if (event.runId === undefined || event.runId.length === 0) continue;

    if (event.eventType === 'run-start') {
      if (!byRunId.has(event.runId)) {
        byRunId.set(event.runId, { start: event });
        order.push(event.runId);
      } else {
        // Keep the earliest start; later starts for the same id are ignored for pairing.
        const existing = byRunId.get(event.runId) as OpenRun;
        if (event.timestamp < existing.start.timestamp) {
          existing.start = event;
        }
      }
      continue;
    }

    if (event.eventType === 'run-finish') {
      const existing = byRunId.get(event.runId);
      if (existing === undefined) {
        // Finish without a start: still surface as a finished run with unknown start fields.
        byRunId.set(event.runId, {
          start: {
            schemaVersion: 1,
            eventId: event.eventId,
            timestamp: event.timestamp,
            eventType: 'run-start',
            sourceRepository: event.sourceRepository,
            sourceSurface: event.sourceSurface,
            runId: event.runId,
            runKind: event.runKind,
            capabilityId: event.capabilityId,
            processId: event.processId,
            summary: event.summary,
          },
          finish: event,
        });
        order.push(event.runId);
      } else if (existing.finish === undefined) {
        existing.finish = event;
      } else if (event.timestamp >= existing.finish.timestamp) {
        // Prefer the latest finish if multiple.
        existing.finish = event;
      }
    }
  }

  const runs: RunRecord[] = [];
  for (const runId of order) {
    const pair = byRunId.get(runId);
    if (pair === undefined) continue;
    const { start, finish } = pair;

    if (finish !== undefined) {
      const status: RunStatus = finish.result ?? 'error';
      runs.push({
        runId,
        status,
        startedAt: start.timestamp,
        finishedAt: finish.timestamp,
        sourceRepository: start.sourceRepository,
        sourceSurface: start.sourceSurface,
        capabilityId: finish.capabilityId ?? start.capabilityId,
        runKind: finish.runKind ?? start.runKind,
        processId: start.processId,
        summary: finish.summary ?? start.summary,
        result: finish.result,
        durationMs: finish.durationMs,
        artifactRefs: finish.artifactRefs ?? start.artifactRefs,
        findings: finish.findings ?? start.findings,
        startEventId: start.eventId,
        finishEventId: finish.eventId,
      });
      continue;
    }

    // Unmatched start — never invent a finish.
    let status: RunStatus = 'unknown';
    if (start.processId !== undefined && liveness !== undefined) {
      const alive = liveness(start.processId);
      if (alive === true) status = 'in-progress';
      else if (alive === false) status = 'interrupted';
      else status = 'unknown';
    } else if (start.processId === undefined) {
      status = 'unknown';
    } else {
      // pid present but no probe — cannot check honestly.
      status = 'unknown';
    }

    runs.push({
      runId,
      status,
      startedAt: start.timestamp,
      sourceRepository: start.sourceRepository,
      sourceSurface: start.sourceSurface,
      capabilityId: start.capabilityId,
      runKind: start.runKind,
      processId: start.processId,
      summary: start.summary,
      artifactRefs: start.artifactRefs,
      findings: start.findings,
      startEventId: start.eventId,
    });
  }

  return runs;
}

/**
 * Earliest valid event timestamp, or null when the journal is empty / unreadable.
 */
export function recordingBoundary(events: JournalEvent[]): string | null {
  let earliest: string | null = null;
  for (const event of events) {
    if (typeof event.timestamp !== 'string' || event.timestamp.length === 0) continue;
    if (earliest === null || event.timestamp < earliest) {
      earliest = event.timestamp;
    }
  }
  return earliest;
}
