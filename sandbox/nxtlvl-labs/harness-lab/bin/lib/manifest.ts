/**
 * manifest.ts — the shared cell-manifest contract.
 *
 * One module, two pure & total functions, depended on by every script in bin/:
 *
 *   parse(text)        -> { manifest, error }   never throws; malformed YAML -> error string, manifest null
 *   validate(manifest) -> { errors, warnings }  never throws; structured findings, never a crash
 *
 * Convenience:
 *   validateText(text) -> { manifest, errors, warnings }  parse + validate, with parse failure surfaced
 *                                                          as an E_PARSE error (so callers need one call).
 *
 * Contract shape:
 *   - errors   : array of { code, message }  — a stable `code` per finding so tests/gate can FILTER
 *                (e.g. the T6 scaffold test asserts "only author-owed codes remain"; the T8 gate's
 *                "intake present" criterion reuses the E_INTAKE_* codes directly).
 *   - warnings : array of strings (taste/soft observations) — never a blocker.
 *
 * Required fields (spec §"Cell manifest"): name · type · stage · intent · intake ·
 * graduation_criteria · target.  `deps` is optional (defaults []).
 *
 * AUTHOR-OWED codes — a fresh `new-cell` scaffold legitimately carries these until the author
 * fills them in (declared eval-first):  E_INTAKE_INCOMPLETE, E_CRITERIA_EMPTY.
 */

import * as yaml from 'js-yaml';

/** A structured validation finding: a stable `code` callers can FILTER on, plus a human message. */
export interface Finding {
  code: string;
  message: string;
}

/** parse() result — `manifest` is whatever YAML produced (untrusted), `error` set only on failure. */
export interface ParseResult {
  manifest: unknown;
  error: string | null;
}

/** validate() result — structured findings; `warnings` are taste/soft, never blockers. */
export interface ValidateResult {
  errors: Finding[];
  warnings: string[];
}

/** validateText() result — parse + validate folded into one total call. */
export interface ValidateTextResult {
  manifest: unknown;
  errors: Finding[];
  warnings: string[];
}

export const TYPES: string[] = ['skill', 'agent', 'command', 'hook'];
export const STAGES: string[] = ['develop', 'review', 'pressure-test', 'refine', 'graduation-ready', 'graduated'];
// Where each cell type lands under plugins/nxtlvl/ on graduation.
export const TYPE_DIR: Record<string, string> = { skill: 'skills', agent: 'agents', command: 'commands', hook: 'hooks' };
export const TARGET_ROOT = 'plugins/nxtlvl/';

// Codes a fresh scaffold may carry until the author completes the eval-first contract.
export const AUTHOR_OWED_CODES: string[] = ['E_INTAKE_INCOMPLETE', 'E_CRITERIA_EMPTY'];

function nonEmptyStr(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isMapping(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function err(code: string, message: string): Finding {
  return { code, message };
}

/**
 * parse(text) — total. Returns { manifest, error }.
 *   manifest: the parsed JS object, or null on YAML failure / empty document.
 *   error:    a YAML error message string, or null on success.
 */
export function parse(text: string): ParseResult {
  try {
    const data = yaml.load(text);
    return { manifest: data === undefined ? null : data, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { manifest: null, error: message };
  }
}

/**
 * validate(manifest) — total. Returns { errors, warnings }.
 * Accepts whatever parse() produced (including null); never throws.
 */
export function validate(manifest: unknown): ValidateResult {
  const errors: Finding[] = [];
  const warnings: string[] = [];

  if (!isMapping(manifest)) {
    errors.push(err('E_NOT_MAPPING', 'manifest is empty or not a YAML mapping'));
    return { errors, warnings };
  }

  // name
  if (!nonEmptyStr(manifest.name)) {
    errors.push(err('E_NAME', 'missing or empty: name'));
  }

  // type
  if (manifest.type === undefined || manifest.type === null || manifest.type === '') {
    errors.push(err('E_TYPE_MISSING', 'missing: type'));
  } else if (!TYPES.includes(manifest.type as string)) {
    errors.push(err('E_TYPE', `unknown type ${JSON.stringify(manifest.type)} (expected one of ${TYPES.join('|')})`));
  }

  // stage
  if (manifest.stage === undefined || manifest.stage === null || manifest.stage === '') {
    errors.push(err('E_STAGE_MISSING', 'missing: stage'));
  } else if (!STAGES.includes(manifest.stage as string)) {
    errors.push(err('E_STAGE', `unknown stage ${JSON.stringify(manifest.stage)} (expected one of ${STAGES.join('|')})`));
  }

  // intent
  if (!nonEmptyStr(manifest.intent)) {
    errors.push(err('E_INTENT', 'missing or empty: intent'));
  }

  // intake — ADR-008 membership record (presence checked, quality not judged)
  const intake = manifest.intake;
  if (intake === undefined || intake === null) {
    errors.push(err('E_INTAKE_MISSING', 'missing: intake (ADR-008 membership record)'));
  } else if (!isMapping(intake)) {
    errors.push(err('E_INTAKE_SHAPE', 'intake must be a mapping with task + failed'));
  } else if (!nonEmptyStr(intake.task) || !nonEmptyStr(intake.failed)) {
    errors.push(err('E_INTAKE_INCOMPLETE', 'intake.task and intake.failed must both be non-empty (author-owed)'));
  }

  // graduation_criteria — declared eval-first
  const gc = manifest.graduation_criteria;
  if (gc === undefined || gc === null) {
    errors.push(err('E_CRITERIA_MISSING', 'missing: graduation_criteria'));
  } else if (!Array.isArray(gc)) {
    errors.push(err('E_CRITERIA_SHAPE', 'graduation_criteria must be a list'));
  } else if (gc.length === 0) {
    errors.push(err('E_CRITERIA_EMPTY', 'graduation_criteria is empty (declare eval-first, author-owed)'));
  } else {
    gc.forEach((c: unknown, i: number) => {
      if (!isMapping(c) || !nonEmptyStr(c.id) || !nonEmptyStr(c.bar)) {
        errors.push(err('E_CRITERIA_ITEM', `graduation_criteria[${i}] needs a non-empty id + bar`));
      }
    });
  }

  // target — where the cell lands on graduation
  if (!nonEmptyStr(manifest.target)) {
    errors.push(err('E_TARGET', 'missing or empty: target'));
  } else if (!manifest.target.startsWith(TARGET_ROOT)) {
    errors.push(err('E_TARGET_PATH', `target must be under ${TARGET_ROOT}`));
  } else if (
    nonEmptyStr(manifest.type) &&
    TYPE_DIR[manifest.type] &&
    !manifest.target.startsWith(`${TARGET_ROOT}${TYPE_DIR[manifest.type]}/`)
  ) {
    // Soft: target subdir doesn't match the declared type — suspicious, not fatal.
    warnings.push(
      `target ${JSON.stringify(manifest.target)} is not under ${TARGET_ROOT}${TYPE_DIR[manifest.type]}/ for type '${manifest.type}'`
    );
  }

  // deps — optional, but if present must be a list
  if (manifest.deps !== undefined && manifest.deps !== null && !Array.isArray(manifest.deps)) {
    errors.push(err('E_DEPS', 'deps must be a list'));
  }

  return { errors, warnings };
}

/**
 * validateText(text) — parse + validate in one total call.
 * A YAML parse failure surfaces as a single E_PARSE error (and skips field validation).
 */
export function validateText(text: string): ValidateTextResult {
  const { manifest, error } = parse(text);
  if (error) {
    return { manifest: null, errors: [err('E_PARSE', `YAML parse error: ${error}`)], warnings: [] };
  }
  const { errors, warnings } = validate(manifest);
  return { manifest, errors, warnings };
}

/** True when every error is an author-owed code (i.e. a fresh scaffold that just needs filling in). */
export function onlyAuthorOwed(errors: Finding[]): boolean {
  return errors.length > 0 && errors.every((e) => AUTHOR_OWED_CODES.includes(e.code));
}
