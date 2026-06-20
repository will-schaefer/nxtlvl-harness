// Project identity + branch/folder grouping keys for the Context & Memory subsystem.
//
// Spec §5 (locked, ADR-025): project identity = the git common directory
// (`git rev-parse --git-common-dir`). Worktrees of one repo SHARE identity;
// separate clones get DISTINCT keys (even at the same basename / relative path);
// off-git falls back to the working folder. The identity key is IRREVERSIBLE
// (sha256, truncated) so it MUST be deterministic.
//
// `projectIdentity` + `hashKey` are productionized from the Phase-0 spike
// (cm-phase0-workspace/identity.js); `branchOrFolderKey` is new here for the
// bookmarks module, which is branch-keyed with a folder fallback.
//
// Pure / deterministic: this module performs NO writes.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

// Run git with stderr suppressed; throws on non-zero exit (used as the off-git signal).
function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

// Irreversible, deterministic key: first 16 hex chars of sha256(absPath).
function hashKey(absPath) {
  return crypto.createHash('sha256').update(absPath).digest('hex').slice(0, 16);
}

// Returns { key, source: 'git-common-dir' | 'folder', raw }.
function projectIdentity(cwd = process.cwd()) {
  try {
    const out = git(['rev-parse', '--git-common-dir'], cwd);
    // git-common-dir may be relative (".git") or absolute; resolve against cwd.
    const abs = fs.realpathSync(path.resolve(cwd, out));
    return { key: hashKey(abs), source: 'git-common-dir', raw: abs };
  } catch {
    // Off-git: fall back to the working folder.
    const abs = fs.realpathSync(cwd);
    return { key: hashKey(abs), source: 'folder', raw: abs };
  }
}

// Sanitize a branch name into a safe filename component:
// replace any char not in [A-Za-z0-9._-] with '-' (so `feat/foo` -> `feat-foo`).
function sanitizeBranch(branch) {
  return branch.replace(/[^A-Za-z0-9._-]/g, '-');
}

// Returns { key, source: 'branch' | 'folder', raw }.
// On a real branch: key = sanitized branch, raw = the branch name.
// Detached HEAD or off-git: folder fallback (key = hashKey(realpath(cwd))).
function branchOrFolderKey(cwd = process.cwd()) {
  try {
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
    // `HEAD` means detached — not a usable branch name; fall through to folder.
    if (branch && branch !== 'HEAD') {
      return { key: sanitizeBranch(branch), source: 'branch', raw: branch };
    }
  } catch {
    // Off-git: fall through to the folder fallback below.
  }
  const abs = fs.realpathSync(cwd);
  return { key: hashKey(abs), source: 'folder', raw: abs };
}

module.exports = {
  hashKey,
  projectIdentity,
  branchOrFolderKey,
};
