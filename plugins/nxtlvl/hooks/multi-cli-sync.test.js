// Tests for hooks/multi-cli-sync.js — SessionStart multi-CLI compiler automation (A+B).
//
// Strategy: pure unit tests via the run() injectable-deps seam. No real compiler
// spawn and no filesystem writes unless a test builds a tmp tree for path resolution.
//
// Run with: node --test "plugins/nxtlvl/hooks/multi-cli-sync.test.js"

'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  run,
  isOffLike,
  isOnLike,
  isSyncDisabled,
  isAutoWriteEnabled,
  isObserverRun,
  resolveCompileScript,
  resolveRepoRoots,
  parseCompilerSummary,
  writeCommand,
} = require('./multi-cli-sync.js');

let sharedTmp;
let counter = 0;

before(() => {
  sharedTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nxtlvl-multi-cli-sync-test-'));
});

after(() => {
  fs.rmSync(sharedTmp, { recursive: true, force: true });
});

function freshTmp() {
  counter += 1;
  const dir = path.join(sharedTmp, `t${counter}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sessionEvent(extras = {}) {
  return JSON.stringify({
    hook_event_name: 'SessionStart',
    cwd: process.cwd(),
    session_id: 'test-session-multi-cli-sync',
    ...extras,
  });
}

function parseContext(out) {
  assert.ok(out && out.trim(), 'output must be non-empty');
  const parsed = JSON.parse(out);
  assert.ok(parsed.hookSpecificOutput, 'must have hookSpecificOutput');
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
  return parsed.hookSpecificOutput.additionalContext;
}

// ---------------------------------------------------------------------------
// Small pure helpers
// ---------------------------------------------------------------------------

test('isOffLike / isOnLike recognize common toggles', () => {
  assert.equal(isOffLike('off'), true);
  assert.equal(isOffLike('0'), true);
  assert.equal(isOffLike('FALSE'), true);
  assert.equal(isOffLike('1'), false);
  assert.equal(isOnLike('1'), true);
  assert.equal(isOnLike('yes'), true);
  assert.equal(isOnLike('ON'), true);
  assert.equal(isOnLike('off'), false);
});

test('kill switch and auto-write env flags', () => {
  assert.equal(isSyncDisabled({ NXTLVL_MULTI_CLI_SYNC: 'off' }), true);
  assert.equal(isSyncDisabled({}), false);
  assert.equal(isAutoWriteEnabled({ NXTLVL_COMPILER_AUTOWRITE: '1' }), true);
  assert.equal(isAutoWriteEnabled({ NXTLVL_COMPILER_AUTOWRITE: 'true' }), true);
  assert.equal(isAutoWriteEnabled({}), false);
  assert.equal(isObserverRun({ NXTLVL_CM_OBSERVER: '1' }), true);
  assert.equal(isObserverRun({ NXTLVL_CM_OBSERVER: 'off' }), false);
});

test('parseCompilerSummary extracts drift and apply lines', () => {
  const summary = parseCompilerSummary('UPDATE x\n\nDrift: 2 target(s) out of sync.\n');
  assert.equal(summary.pending, 2);
  assert.match(summary.line || '', /Drift: 2/);

  const applied = parseCompilerSummary('Applied 3 change(s). Backups: /tmp/x\n');
  assert.equal(applied.applied, 3);

  const conflicts = parseCompilerSummary('2 conflict(s) the compiler cannot fix — owned elsewhere.\n');
  assert.equal(conflicts.conflicts, 2);
});

test('writeCommand includes repo flags', () => {
  assert.equal(writeCommand([]), 'npm run compile-multi-cli -- --write');
  assert.match(writeCommand(['/tmp/lab']), /--repo \/tmp\/lab/);
});

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

test('resolveCompileScript prefers NXTLVL_COMPILER_SCRIPT', () => {
  const dir = freshTmp();
  const script = path.join(dir, 'compile.ts');
  fs.writeFileSync(script, '// stub\n');
  const resolved = resolveCompileScript({ NXTLVL_COMPILER_SCRIPT: script }, dir);
  assert.equal(resolved, path.resolve(script));
});

test('resolveCompileScript finds monorepo layout under pluginRoot', () => {
  const root = freshTmp();
  const pluginRoot = path.join(root, 'plugins', 'nxtlvl');
  const script = path.join(root, 'scripts', 'multi-cli-compiler', 'compile.ts');
  fs.mkdirSync(path.dirname(script), { recursive: true });
  fs.mkdirSync(pluginRoot, { recursive: true });
  fs.writeFileSync(script, '// stub\n');
  const resolved = resolveCompileScript({}, pluginRoot);
  assert.equal(resolved, script);
});

test('resolveRepoRoots defaults to family siblings that exist', () => {
  const family = freshTmp();
  const core = path.join(family, 'nxtlvl-core');
  const lab = path.join(family, 'nxtlvl-lab');
  const wiki = path.join(family, 'nxtlvl-wiki');
  fs.mkdirSync(core, { recursive: true });
  fs.mkdirSync(lab, { recursive: true });
  fs.mkdirSync(wiki, { recursive: true });
  const repos = resolveRepoRoots({}, core);
  assert.deepEqual(repos.sort(), [lab, wiki].sort());
});

test('resolveRepoRoots respects empty NXTLVL_COMPILER_REPOS (global only)', () => {
  const family = freshTmp();
  const core = path.join(family, 'nxtlvl-core');
  fs.mkdirSync(path.join(family, 'nxtlvl-lab'), { recursive: true });
  fs.mkdirSync(core, { recursive: true });
  assert.deepEqual(resolveRepoRoots({ NXTLVL_COMPILER_REPOS: '' }, core), []);
});

// ---------------------------------------------------------------------------
// run() behaviors
// ---------------------------------------------------------------------------

test('kill switch returns empty output', () => {
  const out = run(sessionEvent(), { NXTLVL_MULTI_CLI_SYNC: 'off' }, {
    resolveCompileScript: () => '/tmp/compile.ts',
    runCompiler: () => {
      throw new Error('should not run');
    },
  });
  assert.equal(out, '');
});

test('observer / sidechain guards return empty output', () => {
  const deps = {
    resolveCompileScript: () => '/tmp/compile.ts',
    runCompiler: () => {
      throw new Error('should not run');
    },
  };
  assert.equal(run(sessionEvent(), { NXTLVL_CM_OBSERVER: '1' }, deps), '');
  assert.equal(run(sessionEvent({ isSidechain: true }), {}, deps), '');
});

test('missing compiler injects a recovery note', () => {
  const out = run(sessionEvent(), {}, {
    resolveCompileScript: () => null,
  });
  const ctx = parseContext(out);
  assert.match(ctx, /compiler not found/i);
  assert.match(ctx, /NXTLVL_CORE_ROOT|NXTLVL_COMPILER_SCRIPT/);
});

test('in-sync check stays silent', () => {
  let calls = 0;
  const out = run(sessionEvent(), {}, {
    resolveCompileScript: () => '/tmp/compile.ts',
    resolveRepoRoots: () => [],
    runCompiler: () => {
      calls += 1;
      return { code: 0, stdout: 'All targets in sync.\n', stderr: '' };
    },
  });
  assert.equal(out, '');
  assert.equal(calls, 1);
});

test('drift without auto-write warns and shows write command', () => {
  const out = run(sessionEvent(), {}, {
    resolveCompileScript: () => '/tmp/compile.ts',
    resolveRepoRoots: () => ['/tmp/lab'],
    runCompiler: (_script, modeArgs) => {
      assert.deepEqual(modeArgs, ['--check']);
      return {
        code: 1,
        stdout: 'UPDATE ~/.agents/skills/browser-use — migrate\n',
        stderr: '\nDrift: 1 target(s) out of sync.\n',
      };
    },
  });
  const ctx = parseContext(out);
  assert.match(ctx, /Drift detected/i);
  assert.match(ctx, /1 target/);
  assert.match(ctx, /compile-multi-cli -- --write/);
  assert.match(ctx, /--repo \/tmp\/lab/);
  assert.match(ctx, /NXTLVL_COMPILER_AUTOWRITE=1/);
});

test('drift with auto-write applies and reports sync success', () => {
  const modes = [];
  const out = run(
    sessionEvent(),
    { NXTLVL_COMPILER_AUTOWRITE: '1' },
    {
      resolveCompileScript: () => '/tmp/compile.ts',
      resolveRepoRoots: () => [],
      runCompiler: (_script, modeArgs) => {
        modes.push(modeArgs[0]);
        if (modeArgs[0] === '--check' && modes.filter((m) => m === '--check').length === 1) {
          return {
            code: 1,
            stdout: '',
            stderr: 'Drift: 1 target(s) out of sync.\n',
          };
        }
        if (modeArgs[0] === '--write') {
          return {
            code: 0,
            stdout: 'Applied 1 change(s). Backups: /tmp/backups\n',
            stderr: '',
          };
        }
        // re-check
        return { code: 0, stdout: 'All targets in sync.\n', stderr: '' };
      },
    },
  );
  const ctx = parseContext(out);
  assert.deepEqual(modes, ['--check', '--write', '--check']);
  assert.match(ctx, /Synced/i);
  assert.match(ctx, /Applied 1/);
  assert.match(ctx, /in sync/i);
});

test('auto-write that leaves conflicts reports remaining dirty state', () => {
  let checkCount = 0;
  const out = run(
    sessionEvent(),
    { NXTLVL_COMPILER_AUTOWRITE: '1' },
    {
      resolveCompileScript: () => '/tmp/compile.ts',
      resolveRepoRoots: () => [],
      runCompiler: (_script, modeArgs) => {
        if (modeArgs[0] === '--check') {
          checkCount += 1;
          return {
            code: 1,
            stdout: '',
            stderr: 'Drift: 1 target(s) out of sync.\n',
          };
        }
        return {
          code: 1,
          stdout: '',
          stderr: '1 conflict(s) the compiler cannot fix — the flagged file is owned by another flow.\n',
        };
      },
    },
  );
  const ctx = parseContext(out);
  assert.equal(checkCount, 2); // initial + recheck
  assert.match(ctx, /Tried to sync/i);
  assert.match(ctx, /conflict/i);
  assert.match(ctx, /--check/);
});

test('run() is fail-open on unexpected throws from deps', () => {
  const out = run(sessionEvent(), {}, {
    resolveCompileScript: () => {
      throw new Error('boom');
    },
  });
  assert.equal(out, '');
});

test('malformed stdin is fail-open', () => {
  const out = run('{not-json', {}, {
    resolveCompileScript: () => '/tmp/compile.ts',
    runCompiler: () => ({ code: 0, stdout: '', stderr: '' }),
  });
  assert.equal(out, '');
});
