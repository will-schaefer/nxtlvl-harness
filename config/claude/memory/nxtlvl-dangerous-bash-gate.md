---
name: nxtlvl-dangerous-bash-gate
description: "dangerous-bash gate BUILT & LIVE (confirmed firing in prod 2026-06-18); blocks force-on-main — incl. false-positive `git branch -f main`; use `git fetch origin main:main` for local ff ref updates."
metadata: 
  node_type: memory
  type: project
  originSessionId: f01862cc-005f-4a53-9577-f8f3179c3f8f
---

The harness's **first blocking gate** is built: `plugins/nxtlvl/hooks/dangerous-bash.js` +
a new `Bash`-matcher block in `hooks.json` (id `pre:dangerous-bash`). Blocks (`exit 2`) a
narrow high-confidence catastrophic set (root-ish `rm -rf`, force-push to main/master,
`curl|sh`, `dd`/`mkfs`/`>` to a block device, `chmod -R 777` broad, fork bomb); **warns**
(exit 0 + stderr) on `git reset --hard` / `git clean -f…`. Kill switch `NXTLVL_DANGEROUS_BASH=off`.

Locked build decisions (the gate-backlog's 3 open questions): **Node** parse (not bash+jq —
robust on quoted/escaped commands, reuses [[nxtlvl-context-alert-hook]]'s node precedent, no jq
dep); **warn** on reset/clean; raw-string matching (a known, deliberate trade-off — `echo
'rm -rf /'` also trips it, accepted because stripping quotes would let `bash -c 'rm -rf /'` slip).

**Why:** proves the `exit 2` gate mechanism end-to-end (the precedent for config-protection next)
under [[nxtlvl-harness]]'s ADR-006 fail-open-on-error-absolute contract.
**How to apply:** smoke matrix + fault-injection both PASS (agent-scriptable). Full record in `docs/plan/nxtlvl-hook-gate-backlog.md`.

**LIVE & confirmed firing (2026-06-18):** installed and blocked a real command in a working
session — a `git branch -f main origin/main` (a harmless **local fast-forward ref update**) was
rejected as "force-push to a protected branch (main/master)." The raw-string match keys on
`-f`/`force` near `main`, so it cannot tell a local `branch -f` from a remote `push --force`.
**Workaround for local ff ref updates: `git fetch origin <branch>:<branch>`** (no `-f`, ff-only)
instead of `git branch -f`. This both confirms the gate works on real force-on-main and shows the
false-positive is the accepted cost of raw-string matching (same trade-off as `echo 'rm -rf /'` above).
