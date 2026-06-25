#!/usr/bin/env node
/**
 * eval.ts — the evals-lab seam (stub engine).
 *
 *   npm run eval -- <cell>
 *
 * Reads the cell's declared evals (manifest.graduation_criteria + evals/cases.yaml), hands them to
 * a DETERMINISTIC STUB engine, and writes a scorecard in the shape fixed by docs/seam-contract.md.
 * graduate.ts reads that scorecard without knowing a stub produced it. When the real evals-lab
 * engine lands, only score() is replaced — the spec/scorecard shapes stay put.
 *
 * The stub does not *compute* outcomes; it echoes each case's declared `stub_result`. A criterion
 * with no eval case scores as a FAILURE (a missing eval is never a silent pass).
 *
 * Split for testability:
 *   buildSpec(cellDir)  -> { cell, criteria, cases }   touches the filesystem
 *   score(spec)         -> scorecard                    pure & deterministic (no timestamps)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import * as m from './lib/manifest.ts';

/** A declared graduation criterion (the eval-first bar). */
export interface Criterion {
  id: string;
  bar?: string;
}

/** A single declared eval case (keyed by criterion id) in evals/cases.yaml. */
export interface EvalCase {
  stub_result?: string;
  score?: number;
  detail?: string;
}

/** The eval spec for a cell — what buildSpec() produces and score() consumes. */
export interface EvalSpec {
  cell: string;
  criteria: Criterion[];
  cases: Record<string, EvalCase>;
}

/** One per-criterion result in the scorecard. */
export interface EvalResult {
  id: string;
  passed: boolean;
  score: number | null;
  detail: string;
}

/** The scorecard shape fixed by docs/seam-contract.md — graduate.ts reads this. */
export interface Scorecard {
  cell: string;
  engine: string;
  results: EvalResult[];
  summary: { total: number; passed: number; failed: number; allPassed: boolean };
}

const LAB_ROOT = path.join(import.meta.dirname, '..');
export const CELLS_DIR = path.join(LAB_ROOT, 'cells');
export const SCORECARD_NAME = 'scorecard.json';
export const ENGINE = 'stub';

/** Build the eval spec for a cell. Never throws on missing/partial cases. */
export function buildSpec(cellDir: string): EvalSpec {
  const manifestPath = path.join(cellDir, 'manifest.yaml');
  const { manifest } = m.validateText(fs.readFileSync(manifestPath, 'utf8'));
  const mf = (manifest && typeof manifest === 'object' ? manifest : null) as Record<string, unknown> | null;
  const name = (mf && typeof mf.name === 'string' && mf.name) || path.basename(cellDir);
  const rawCriteria = mf && Array.isArray(mf.graduation_criteria) ? (mf.graduation_criteria as unknown[]) : [];
  const criteria: Criterion[] = rawCriteria.filter(
    (c): c is Criterion => !!c && typeof (c as { id?: unknown }).id === 'string'
  );

  let cases: Record<string, EvalCase> = {};
  const casesPath = path.join(cellDir, 'evals', 'cases.yaml');
  try {
    const loaded = yaml.load(fs.readFileSync(casesPath, 'utf8'));
    if (loaded && typeof loaded === 'object' && !Array.isArray(loaded)) cases = loaded as Record<string, EvalCase>;
  } catch (_e) {
    cases = {}; // no cases file -> every criterion will score as a failure
  }
  return { cell: name, criteria, cases };
}

/** Pure, deterministic stub engine: spec -> scorecard (docs/seam-contract.md shape). */
export function score(spec: EvalSpec): Scorecard {
  const results: EvalResult[] = (spec.criteria || []).map((crit) => {
    const c = spec.cases && spec.cases[crit.id];
    if (!c || typeof c !== 'object') {
      return { id: crit.id, passed: false, score: null, detail: 'no eval case declared' };
    }
    const passed = c.stub_result === 'pass';
    return {
      id: crit.id,
      passed,
      score: typeof c.score === 'number' ? c.score : null,
      detail: typeof c.detail === 'string' ? c.detail : (passed ? 'passed' : 'failed'),
    };
  });
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  return {
    cell: spec.cell,
    engine: ENGINE,
    results,
    summary: { total, passed, failed: total - passed, allPassed: total > 0 && passed === total },
  };
}

export function scorecardPath(cellDir: string): string {
  return path.join(cellDir, SCORECARD_NAME);
}

export function writeScorecard(cellDir: string, scorecard: Scorecard): void {
  fs.writeFileSync(scorecardPath(cellDir), JSON.stringify(scorecard, null, 2) + '\n');
}

function main(argv: string[]): void {
  const cell = argv.find((a) => !a.startsWith('-'));
  if (!cell) {
    process.stderr.write('usage: npm run eval -- <cell>\n');
    process.exit(1);
  }
  const cellDir = path.join(CELLS_DIR, cell);
  if (!fs.existsSync(path.join(cellDir, 'manifest.yaml'))) {
    process.stderr.write(`error: no such cell (missing manifest): cells/${cell}\n`);
    process.exit(1);
  }
  const spec = buildSpec(cellDir);
  const scorecard = score(spec);
  writeScorecard(cellDir, scorecard);
  const s = scorecard.summary;
  process.stdout.write(
    `scorecard written to cells/${cell}/${SCORECARD_NAME} — ${s.passed}/${s.total} criteria passed (engine: ${scorecard.engine}).\n`
  );
  process.exit(0);
}

if (import.meta.main) {
  main(process.argv.slice(2));
}
