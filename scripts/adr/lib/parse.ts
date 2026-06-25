/**
 * ADR parse core — pure `string -> typed model` functions for nxtlvl's own ADRs.
 *
 * No file I/O here (a separate loader reads docs/decisions/); these are the
 * testable seam the `adr` CLI and `adr audit` build on, so the gate logic can be
 * unit-tested with string fixtures and later imported by `nxtlvl:audit`.
 * Zero-dependency.
 */

export interface FrontmatterParse {
  ok: boolean;
  fields: Record<string, string>;
  reason?: string;
}

const DELIM = '---';

/**
 * Parse the leading `---`…`---` block into a flat key→value map. The house ADR
 * frontmatter is flat (`key: value`, value optionally "quoted"); we split on the
 * first colon so colons inside a value are preserved. A missing or unterminated
 * block is a structured failure (feeds audit check B1), never a throw.
 */
export function parseFrontmatter(raw: string): FrontmatterParse {
  const lines = raw.replace(/^﻿/, '').split(/\r?\n/);
  if (lines[0]?.trim() !== DELIM) {
    return { ok: false, fields: {}, reason: 'no frontmatter: file does not start with `---`' };
  }
  const fields: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === DELIM) return { ok: true, fields };
    if (line.trim() === '') continue;
    const colon = line.indexOf(':');
    if (colon === -1) {
      return { ok: false, fields, reason: `malformed frontmatter line: ${JSON.stringify(line)}` };
    }
    const key = line.slice(0, colon).trim();
    fields[key] = stripQuotes(line.slice(colon + 1).trim());
  }
  return { ok: false, fields, reason: 'unterminated frontmatter: missing closing `---`' };
}

function stripQuotes(value: string): string {
  const first = value[0];
  const last = value.at(-1);
  if (value.length >= 2 && (first === '"' || first === "'") && last === first) {
    return value.slice(1, -1);
  }
  return value;
}

/** ADR sequence number from an `ADR-NNN-slug.md` filename, or null if it isn't one. */
export function numberFromFilename(filename: string): number | null {
  const m = /^ADR-(\d{3})-.+\.md$/.exec(filename);
  return m ? Number(m[1]) : null;
}

/** Every distinct `ADR-NNN` id referenced in a chunk of text, sorted ascending. */
export function extractCrossLinks(text: string): string[] {
  const ids = new Set<string>();
  for (const m of text.matchAll(/ADR-(\d{3})/g)) {
    ids.add(`ADR-${m[1]}`);
  }
  return [...ids].sort();
}
