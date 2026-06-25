/**
 * Unit tests for the ADR parse core — the pure `string -> typed model` layer the
 * `adr` CLI and `adr audit` are built on.
 *   Run: node --test scripts/adr/lib/parse.test.ts   (Node >= 24.12, native type-stripping)
 * Zero-dependency — Node's built-in test runner (node:test).
 *
 * ESM + explicit `.ts` import specifiers are mandatory under native type-stripping:
 * bare `./parse` does NOT resolve, and only ESM `import` preserves cross-module
 * types (CJS `require('./parse.ts')` widens to `any`). See
 * docs/plan/nxtlvl-typescript-migration-grill-state.md.
 *
 * Tests drive the pure parsers — never file I/O — matching the dangerous-bash gate's
 * "test the testable seam the author exposed" altitude (ADR-019). Fixtures are real
 * ADR frontmatter so the happy path mirrors the live docs/decisions/ set.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseFrontmatter, numberFromFilename, extractCrossLinks } from './parse.ts';

// Real ADR-009 head (objective-invoked-audit-gate) — the canonical happy path.
const ADR_009 = `---
id: ADR-009
title: "Promotion gated by an objective, binary, invoked audit (not a self-tunable score, not a session hook)"
status: Accepted
date: 2026-06-16
implementation: "Deferred to Phase >=1 — the audit is built last."
---

# ADR-009: Promotion gated by an objective, binary, invoked audit

## Context
Promotion ... ([ADR-001](ADR-001-plugin-local-marketplace-packaging.md)) ...
... ([ADR-008](ADR-008-reactive-growth-intake-gate.md)), and again ADR-001.
`;

// Real ADR-034 head — carries the optional `amended:` key.
const ADR_034 = `---
id: ADR-034
title: "TypeScript is the default harness language (no new JavaScript), run via native Node type-stripping"
status: Accepted
date: 2026-06-24
amended: 2026-06-24
implementation: "Migration in progress."
---

# ADR-034
`;

// ---------------------------------------------------------------------------
// Group 1 — parseFrontmatter: the happy path over real ADR heads.
// ---------------------------------------------------------------------------
test('parseFrontmatter: extracts the required keys from a real ADR head', () => {
  const r = parseFrontmatter(ADR_009);
  assert.equal(r.ok, true);
  assert.equal(r.fields.id, 'ADR-009');
  assert.equal(r.fields.status, 'Accepted');
  assert.equal(r.fields.date, '2026-06-16');
  assert.match(r.fields.title, /Promotion gated by an objective/);
});

test('parseFrontmatter: strips the surrounding quotes from a value', () => {
  const r = parseFrontmatter(ADR_009);
  assert.ok(!r.fields.title.startsWith('"'), 'leading quote must be stripped');
  assert.ok(!r.fields.title.endsWith('"'), 'trailing quote must be stripped');
});

test('parseFrontmatter: splits on the first colon, preserving colons inside a value', () => {
  const r = parseFrontmatter(ADR_009);
  // The title ends with a parenthical — proves the whole value (not just up to a
  // later delimiter) is retained.
  assert.match(r.fields.title, /session hook\)$/);
});

test('parseFrontmatter: captures optional keys (amended)', () => {
  const r = parseFrontmatter(ADR_034);
  assert.equal(r.fields.amended, '2026-06-24');
});

// ---------------------------------------------------------------------------
// Group 2 — parseFrontmatter failure modes. A malformed block is a structured
// failure (ok:false + reason), never a throw — this is what feeds audit check B1.
// ---------------------------------------------------------------------------
const MALFORMED: Array<[string, string]> = [
  ['no leading delimiter', '# Just a heading\nno frontmatter here'],
  ['unterminated frontmatter', '---\nid: ADR-099\nstatus: Accepted\n'],
  ['a frontmatter line with no colon', '---\nid: ADR-099\nthis line has no colon\n---\n']
];

for (const [label, raw] of MALFORMED) {
  test(`parseFrontmatter: rejects ${label}`, () => {
    const r = parseFrontmatter(raw);
    assert.equal(r.ok, false, 'malformed frontmatter must be flagged (feeds audit B1)');
    assert.ok(r.reason && r.reason.length > 0, 'a rejection must carry a reason');
  });
}

// ---------------------------------------------------------------------------
// Group 3 — numberFromFilename: the ADR sequence number (feeds audit B5 numbering).
// ---------------------------------------------------------------------------
const FILENAME_CASES: Array<[string, number]> = [
  ['ADR-001-plugin-local-marketplace-packaging.md', 1],
  ['ADR-009-objective-invoked-audit-gate.md', 9],
  ['ADR-035-compose-substance-defer-own-orchestration.md', 35]
];

for (const [filename, expected] of FILENAME_CASES) {
  test(`numberFromFilename: ${filename} -> ${expected}`, () => {
    assert.equal(numberFromFilename(filename), expected);
  });
}

test('numberFromFilename: a non-ADR filename -> null', () => {
  assert.equal(numberFromFilename('README.md'), null);
});

// ---------------------------------------------------------------------------
// Group 4 — extractCrossLinks: the ADR-NNN ids referenced in a body (feeds B2).
// ---------------------------------------------------------------------------
test('extractCrossLinks: finds every referenced ADR id (incl. self), deduped and sorted', () => {
  // The real ADR-009 head references ADR-001 and ADR-008 in its Context, and its
  // own id appears in the H1. extractCrossLinks is deliberately self-unaware — it
  // returns ALL ids; excluding the self-id is the audit/model layer's job (B2).
  const r = extractCrossLinks(ADR_009);
  assert.deepEqual(r, ['ADR-001', 'ADR-008', 'ADR-009']);
});

test('extractCrossLinks: no references -> empty array', () => {
  assert.deepEqual(extractCrossLinks('a body with no decision references'), []);
});
