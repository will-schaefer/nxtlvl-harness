// paths — single source of truth for the C&M subsystem's on-disk storage layout.
//
// Storage root is locked (decision D1): ${XDG_STATE_HOME:-~/.local/state}/nxtlvl
// — machine-local *state*, deliberately OUTSIDE ~/.claude (Claude Code's
// sensitive-path guard) and OUTSIDE any sync/backup root (Dropbox/iCloud/
// OneDrive/Google Drive): a syncing filesystem racing our atomic renames would
// corrupt the append-only JSONL logs.
//
// storageRoot/isSafeRoot are productionized from cm-phase0-workspace/identity.js
// (Spike 0.5). layout() composes the authoritative directory tree the other
// five modules depend on; it is PURE — it only computes paths, never touches disk.

'use strict';

const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

// --- Storage root -----------------------------------------------------------
// ${XDG_STATE_HOME:-~/.local/state}/nxtlvl  (D1, locked).
function storageRoot(env = process.env, home = os.homedir()) {
  const base = env.XDG_STATE_HOME && env.XDG_STATE_HOME.trim()
    ? env.XDG_STATE_HOME
    : path.join(home, '.local', 'state');
  return path.join(base, 'nxtlvl');
}

// Reject roots that would corrupt JSONL (synced FS) or collide with CC's guard.
const UNSAFE_FRAGMENTS = [
  `${path.sep}.claude${path.sep}`,
  `${path.sep}Dropbox${path.sep}`,
  `${path.sep}Library${path.sep}Mobile Documents${path.sep}`, // iCloud Drive
  `${path.sep}Library${path.sep}CloudStorage${path.sep}`,     // OneDrive/Drive/etc.
  `${path.sep}Google Drive${path.sep}`,
  `${path.sep}OneDrive${path.sep}`,
  `${path.sep}.Trash${path.sep}`,
];

function isSafeRoot(p) {
  const norm = path.resolve(p) + path.sep;
  for (const frag of UNSAFE_FRAGMENTS) {
    if (norm.includes(frag)) return false;
  }
  return true;
}

// storageRoot()'d path, guarded: throws rather than hand back an unsafe root.
function resolveStorageRoot(env = process.env, home = os.homedir()) {
  const root = storageRoot(env, home);
  if (!isSafeRoot(root)) {
    throw new Error(`unsafe storage root: ${root}`);
  }
  return root;
}

// --- Directory creation -----------------------------------------------------
// Idempotent recursive mkdir; returns the dir. Never throws on the happy path
// (recursive:true treats an existing dir as success).
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// --- Layout -----------------------------------------------------------------
// The authoritative on-disk tree the other five modules depend on. PURE:
// computes absolute paths only, creates nothing.
function layout(projectId, env = process.env, home = os.homedir()) {
  const root = storageRoot(env, home);
  const globalInstinctsDir = path.join(root, 'instincts');
  const projectDir = path.join(root, 'projects', projectId);
  return {
    root,
    globalInstinctsDir,                                              // scope=global instincts (one .md each)
    projectDir,                                                      // root/projects/<projectId>
    observationsLog: path.join(projectDir, 'observations.jsonl'),
    obsCursor: path.join(projectDir, 'obs-cursor.json'),
    obsArchiveDir: path.join(projectDir, 'archive'),
    projectInstinctsDir: path.join(projectDir, 'instincts'),        // scope=project instincts (one .md each)
    bookmarksDir: path.join(projectDir, 'bookmarks'),               // one <groupKey>.jsonl per branch/folder
    livenessLog: path.join(projectDir, 'liveness.jsonl'),
  };
}

module.exports = {
  storageRoot,
  isSafeRoot,
  resolveStorageRoot,
  ensureDir,
  layout,
};
