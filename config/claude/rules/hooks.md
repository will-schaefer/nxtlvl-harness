# Hook safety rule

**Scope:** the safety contract for any Claude Code hook I write or modify, in any repo.
Hooks are the highest-severity failure surface — a buggy blocking hook can lock me out of
my own daily driver.

## Pointers

- Full contract & rationale: `~/Developer/nxtlvl/docs/intent/personal-harness.md`
  §"Hook safety (highest-severity failure mode)" — the current source. ADR-010 (hook layer
  contract, `~/Developer/nxtlvl/docs/decisions/`) is `Draft`/`Pending` and supersedes this
  pointer once decided.

## Triggers

- Writing a hook that can throw or exit non-zero? Its failure mode must be **fail-open** —
  degrade to a no-op; never block the session by accident.
- Tempted to make a hook block or steer mid-task? Blocking gates are rare, explicitly
  whitelisted exceptions with a kill switch — **hooks inform, they don't force**.
