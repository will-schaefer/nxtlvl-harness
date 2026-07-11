import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MANAGED_BEGIN,
  MANAGED_END,
  compileAntigravityRule,
  findClaudeOnlyTokens,
  looksLikeHandConvertedRule,
  upsertManagedTomlBlock,
} from './emitters.ts';

const BODY = ['project_doc_fallback_filenames = ["CLAUDE.md"]'];

test('managed block lands before the first TOML table', () => {
  const existing = 'model = "gpt-5.4"\napprovals_reviewer = "auto"\n[projects."/x"]\ntrust_level = "trusted"\n';
  const result = upsertManagedTomlBlock(existing, BODY);
  const managedAt = result.indexOf(MANAGED_BEGIN);
  const tableAt = result.indexOf('[projects."/x"]');
  assert.ok(managedAt !== -1 && tableAt !== -1);
  assert.ok(managedAt < tableAt, 'managed keys must stay top-level (before any table)');
  assert.ok(result.includes('model = "gpt-5.4"'), 'existing top-level keys preserved');
  assert.ok(result.includes('trust_level = "trusted"'), 'existing tables preserved');
});

test('managed block upsert is idempotent', () => {
  const existing = 'model = "gpt-5.4"\n[projects."/x"]\ntrust_level = "trusted"\n';
  const once = upsertManagedTomlBlock(existing, BODY);
  const twice = upsertManagedTomlBlock(once, BODY);
  assert.equal(twice, once);
});

test('managed block body is replaced in place on re-run', () => {
  const once = upsertManagedTomlBlock('[projects."/x"]\n', BODY);
  const updated = upsertManagedTomlBlock(once, ['project_doc_fallback_filenames = ["CLAUDE.md", "AGENTS.override.md"]']);
  assert.ok(updated.includes('"AGENTS.override.md"'));
  assert.ok(!updated.includes('= ["CLAUDE.md"]\n'), 'old body line removed');
  assert.equal(updated.split(MANAGED_BEGIN).length, 2, 'exactly one managed block');
  assert.equal(updated.split(MANAGED_END).length, 2);
});

test('managed block appends when the file has no tables', () => {
  const result = upsertManagedTomlBlock('model = "gpt-5.4"\n', BODY);
  assert.ok(result.startsWith('model = "gpt-5.4"'));
  assert.ok(result.trimEnd().endsWith(MANAGED_END));
});

test('managed block works on an empty file', () => {
  const result = upsertManagedTomlBlock('', BODY);
  assert.ok(result.startsWith(MANAGED_BEGIN));
  assert.ok(result.endsWith('\n'));
});

test('antigravity rule carries frontmatter, notice, and the body verbatim', () => {
  const rule = compileAntigravityRule({
    trigger: 'always_on',
    description: 'Global conventions "quoted" safely.',
    sourceLabel: '~/.claude/CLAUDE.md',
    body: '# Global conventions\n\nSome portable guidance.\n',
  });
  assert.ok(rule.startsWith('---\ntrigger: always_on\n'));
  assert.ok(rule.includes('description: "Global conventions \\"quoted\\" safely."'));
  assert.ok(rule.includes('Generated from ~/.claude/CLAUDE.md'));
  assert.ok(rule.includes('# Global conventions\n\nSome portable guidance.\n'));
});

test('antigravity rule strips pre-existing source frontmatter instead of nesting it', () => {
  const rule = compileAntigravityRule({
    trigger: 'model_decision',
    description: 'x',
    sourceLabel: 'src.md',
    body: '---\ntitle: old\n---\n# Heading\n',
  });
  assert.ok(!rule.includes('title: old'));
  assert.ok(rule.includes('# Heading'));
});

test('portability sweep catches Claude-only tokens and dedups them', () => {
  const tokens = findClaudeOnlyTokens(
    'pass dangerouslyDisableSandbox: true, see claude.ai/code, run /nxtlvl:audit, again dangerouslyDisableSandbox',
  );
  assert.deepEqual(tokens.sort(), ['/nxtlvl:', 'claude.ai/code', 'dangerouslyDisableSandbox'].sort());
});

test('portability sweep passes portable content', () => {
  assert.deepEqual(
    findClaudeOnlyTokens('Run the nxtlvl brainstorming skill, then the show-me spec → plan format.'),
    [],
  );
});

test('retire guard accepts hand-converted rules and rejects everything else', () => {
  assert.ok(looksLikeHandConvertedRule('---\ntrigger: always_on\ndescription: x\n---\n# Rule\n'));
  assert.ok(!looksLikeHandConvertedRule('# Just a markdown file\n\ntrigger: mentioned in prose\n'));
  assert.ok(!looksLikeHandConvertedRule(''));
});
