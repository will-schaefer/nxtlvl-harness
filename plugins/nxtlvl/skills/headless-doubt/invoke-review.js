#!/usr/bin/env node
/**
 * headless-doubt invoke-review — minimal runner for the headless-doubt skill.
 *
 * Builds the adversarial prompt from ARTIFACT + CONTRACT files, shells out to
 * `claude -p` with read-only tool constraints, unwraps the JSON envelope, and
 * prints the reviewer-output object to stdout.
 *
 * Usage:
 *   node invoke-review.js --artifact path/to/artifact.md --contract path/to/contract.md \
 *     [--cwd /repo] [--plugin-dir /path/to/plugins/nxtlvl] [--timeout-ms 300000]
 *
 * Exit 0 on schema-shaped JSON stdout; exit 1 on transport/parse failure.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const DEFAULT_PLUGIN_DIR = path.resolve(__dirname, '../..');
const MODEL = 'sonnet';
const DEFAULT_TIMEOUT_MS = 300000;

function usage() {
  process.stderr.write(
    'Usage: invoke-review.js --artifact <file> --contract <file> [--cwd <dir>] [--plugin-dir <dir>] [--timeout-ms <n>]\n',
  );
  process.exit(1);
}

function parseArgs(argv) {
  const out = {
    artifact: null,
    contract: null,
    cwd: process.cwd(),
    pluginDir: DEFAULT_PLUGIN_DIR,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--artifact') out.artifact = argv[++i];
    else if (a === '--contract') out.contract = argv[++i];
    else if (a === '--cwd') out.cwd = argv[++i];
    else if (a === '--plugin-dir') out.pluginDir = argv[++i];
    else if (a === '--timeout-ms') out.timeoutMs = parseInt(argv[++i], 10);
    else usage();
  }
  if (!out.artifact || !out.contract) usage();
  return out;
}

function buildPrompt(artifact, contract) {
  return [
    'Adversarial review. Find what is wrong with this artifact.',
    'Assume the author is overconfident. Look for:',
    '- Unstated assumptions',
    '- Edge cases not handled',
    '- Hidden coupling or shared state',
    '- Ways the contract could be violated',
    '- Existing conventions this might break',
    '- Failure modes under unexpected input',
    '',
    'Do NOT validate. Do NOT summarize. Find issues, or set status "clean"',
    'ONLY after thorough examination.',
    '',
    'Return ONLY a JSON object conforming to reviewer-output.schema.json:',
    '- status: "clean" | "issues_found" | "cannot_assess"',
    '- summary: one line',
    '- findings[]: { id, title, class_hint, severity, location?, evidence, suggested_probe? }',
    '- next_actions[]',
    '- cannot_assess_reason (required iff status == "cannot_assess")',
    '',
    'class_hint is YOUR guess and is non-binding — the orchestrator assigns the',
    'final class. severity ∈ {blocker, major, minor}. Put your full argument in',
    '`evidence`; that field is free-text.',
    '',
    'ARTIFACT:',
    artifact.trim(),
    '',
    'CONTRACT:',
    contract.trim(),
    '',
  ].join('\n');
}

function unwrapResult(stdout) {
  try {
    const env = JSON.parse(stdout);
    if (env && typeof env.result === 'string') {
      return env.result;
    }
  } catch {
    /* fall through */
  }
  return stdout;
}

function salvageJson(text) {
  const t = text.trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(t.slice(start, end + 1));
    }
    throw new Error('could not parse reviewer JSON');
  }
}

function main() {
  const args = parseArgs(process.argv);
  const artifact = fs.readFileSync(args.artifact, 'utf8');
  const contract = fs.readFileSync(args.contract, 'utf8');
  const prompt = buildPrompt(artifact, contract);

  const claudeArgs = [
    '-p',
    '',
    '--agent',
    'doubt-reviewer',
    '--plugin-dir',
    args.pluginDir,
    '--disallowedTools',
    'Write',
    'Edit',
    'NotebookEdit',
    'Bash',
    '--model',
    MODEL,
    '--output-format',
    'json',
    '--setting-sources',
    'project',
  ];

  let stdout;
  try {
    stdout = cp.execFileSync('claude', claudeArgs, {
      input: prompt,
      encoding: 'utf8',
      cwd: args.cwd,
      env: { ...process.env, NXTLVL_CM_OBSERVER: '1' },
      maxBuffer: 8 * 1024 * 1024,
      timeout: args.timeoutMs,
    });
  } catch (err) {
    process.stderr.write(`headless-doubt: claude invocation failed: ${err.message}\n`);
    process.exit(1);
  }

  try {
    const raw = unwrapResult(stdout);
    const obj = salvageJson(raw);
    process.stdout.write(`${JSON.stringify(obj, null, 2)}\n`);
  } catch (err) {
    process.stderr.write(`headless-doubt: parse failed: ${err.message}\n`);
    process.stderr.write(`${stdout.slice(0, 2000)}\n`);
    process.exit(1);
  }
}

main();