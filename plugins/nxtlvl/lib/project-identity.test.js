// Tests for project-identity.js — verification = `node --test` green.
//
// Real git fixtures in os.tmpdir() via fs.mkdtempSync, under a hermetic git env
// (GIT_CONFIG_GLOBAL/SYSTEM=/dev/null) so the suite never reads the user's global
// git config. Fixture setup is copied from the Phase-0 spike
// (cm-phase0-workspace/identity.test.js) and extended with a named-branch repo.
//
// Acceptance criteria (plan Task 1.2 / spec §5):
//  - worktrees of one repo SHARE projectIdentity().key (source 'git-common-dir' both)
//  - separate clones get DISTINCT keys (even same basename)
//  - off-git -> source 'folder', distinct from any repo key
//  - identity stable across repeated calls (irreversible key must be deterministic)
//  - branchOrFolderKey -> 'branch' + sanitized key on a branch; 'folder' when detached/off-git

'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { hashKey, projectIdentity, branchOrFolderKey } = require('./project-identity.js');

const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t',
  GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t',
};
const git = (args, cwd) =>
  execFileSync('git', args, { cwd, env: GIT_ENV, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

let sandbox, repoA, repoAWorktree, repoB, offGit, branchRepo;

before(() => {
  sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-identity-'));

  // repoA — a repo, committed, then a linked (detached) worktree of it.
  repoA = path.join(sandbox, 'proj', 'repo');         // note: basename "repo"
  fs.mkdirSync(repoA, { recursive: true });
  git(['init', '-q'], repoA);
  fs.writeFileSync(path.join(repoA, 'f.txt'), 'hi');
  git(['add', '.'], repoA);
  git(['commit', '-q', '-m', 'init'], repoA);
  repoAWorktree = path.join(sandbox, 'wt');
  git(['worktree', 'add', '--detach', '-q', repoAWorktree], repoA);

  // repoB — a SEPARATE repo with the SAME basename "repo" at a different path.
  repoB = path.join(sandbox, 'other', 'repo');        // same basename, distinct repo
  fs.mkdirSync(repoB, { recursive: true });
  git(['init', '-q'], repoB);
  fs.writeFileSync(path.join(repoB, 'g.txt'), 'yo');
  git(['add', '.'], repoB);
  git(['commit', '-q', '-m', 'init'], repoB);

  // off-git — a plain directory, no repo.
  offGit = path.join(sandbox, 'loose');
  fs.mkdirSync(offGit, { recursive: true });

  // branchRepo — a repo checked out to a slash-containing branch `feat/x`.
  branchRepo = path.join(sandbox, 'branchy');
  fs.mkdirSync(branchRepo, { recursive: true });
  git(['init', '-q'], branchRepo);
  fs.writeFileSync(path.join(branchRepo, 'h.txt'), 'ho');
  git(['add', '.'], branchRepo);
  git(['commit', '-q', '-m', 'init'], branchRepo);
  git(['checkout', '-q', '-b', 'feat/x'], branchRepo);
});

after(() => {
  try { git(['worktree', 'remove', '--force', repoAWorktree], repoA); } catch {}
  fs.rmSync(sandbox, { recursive: true, force: true });
});

// --- projectIdentity --------------------------------------------------------

test('worktree SHARES identity with its main repo (git-common-dir both)', () => {
  const main = projectIdentity(repoA);
  const wt = projectIdentity(repoAWorktree);
  assert.equal(main.source, 'git-common-dir');
  assert.equal(wt.source, 'git-common-dir');
  assert.equal(wt.key, main.key, 'worktree and main repo must share the identity key');
});

test('a separate repo gets a DISTINCT identity (same basename, different repo)', () => {
  const a = projectIdentity(repoA);
  const b = projectIdentity(repoB);
  assert.equal(b.source, 'git-common-dir');
  assert.notEqual(b.key, a.key, 'distinct repos must not collide even at the same basename');
});

test('off-git falls back to the working FOLDER identity', () => {
  const off = projectIdentity(offGit);
  assert.equal(off.source, 'folder');
  assert.notEqual(off.key, projectIdentity(repoA).key);
});

test('identity is stable across repeated calls (irreversible key must be deterministic)', () => {
  assert.equal(projectIdentity(repoA).key, projectIdentity(repoA).key);
  assert.equal(projectIdentity(offGit).key, projectIdentity(offGit).key);
});

// --- hashKey ----------------------------------------------------------------

test('hashKey is 16 lowercase hex chars and deterministic', () => {
  const k = hashKey('/some/abs/path');
  assert.match(k, /^[0-9a-f]{16}$/);
  assert.equal(hashKey('/some/abs/path'), k);
  assert.notEqual(hashKey('/some/other/path'), k);
});

// --- branchOrFolderKey ------------------------------------------------------

test('branchOrFolderKey on branch feat/x returns source branch, sanitized key feat-x', () => {
  const r = branchOrFolderKey(branchRepo);
  assert.equal(r.source, 'branch');
  assert.equal(r.key, 'feat-x', 'slash must be sanitized to a dash');
  assert.equal(r.raw, 'feat/x', 'raw preserves the real branch name');
});

test('branchOrFolderKey on a detached worktree falls back to folder', () => {
  const r = branchOrFolderKey(repoAWorktree); // worktree added with --detach
  assert.equal(r.source, 'folder');
  assert.match(r.key, /^[0-9a-f]{16}$/);
  assert.equal(r.raw, fs.realpathSync(repoAWorktree));
});

test('branchOrFolderKey off-git falls back to folder', () => {
  const r = branchOrFolderKey(offGit);
  assert.equal(r.source, 'folder');
  assert.equal(r.key, hashKey(fs.realpathSync(offGit)));
});

test('branchOrFolderKey is deterministic across repeated calls', () => {
  assert.equal(branchOrFolderKey(branchRepo).key, branchOrFolderKey(branchRepo).key);
  assert.equal(branchOrFolderKey(offGit).key, branchOrFolderKey(offGit).key);
});
