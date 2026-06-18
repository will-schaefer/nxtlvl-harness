---
name: python-patterns
description: nxtlvl Python conventions — idiomatic typing, error handling, module structure, and the anti-patterns to reject. Caller-agnostic knowledge consulted by the dev and review workflows (and the python-reviewer) when working on or reviewing Python. Use when writing, refactoring, or reviewing Python.
---

# Python conventions (nxtlvl)

Vendored from `agent-skills` Python guidance and refined for fit (see
`docs/decisions/ADR-003`); ecc's `python-patterns` is a dormant cross-reference, not copied.
**Caller-agnostic** — this is reusable knowledge; it names no agent or command, so the dev
loop, the review workflow, or a bare main thread can all consult it
(`docs/reference/ecc-agent-vs-skill-scoping.md` §3).

## Typing
- **Type public surfaces.** Annotate function signatures and module-level constants; let
  inference handle obvious locals. A typed signature is the first test of the design.
- Prefer precise types over `Any`: `Sequence`/`Mapping` for read-only params, `| None` over
  bare `Optional` import, `TypedDict`/`dataclass`/`pydantic` for structured data.
- Run `mypy` (or `pyright`) in strict-ish mode on changed files; a new `# type: ignore` needs a
  reason comment.

## Error handling
- Raise **specific** exceptions, never bare `except:` or `except Exception` that swallows.
  Catch narrowly, at the layer that can act.
- No control flow through exceptions for expected cases; return values or sentinels instead.
- Preserve context with `raise ... from err`; don't log-and-reraise the same error twice.

## Structure & idioms
- Modules organized **by domain**, not by type (`users/`, not `models/ services/`); private by
  default (`_name`), narrow `__all__` on public modules.
- Comprehensions over manual accumulation loops; generators for large/streamed sequences.
- `pathlib` over `os.path`; f-strings over `%`/`.format`; context managers for all resources.
- Dependency in, not imported deep: pass collaborators as params for testability.

## Testing (pointer)
- `pytest`; arrange-act-assert; one behavior per test; parametrize over copy-paste.
- Test the contract, not the implementation. (Detailed testing conventions grow reactively as a
  separate `python-testing` skill if the fallback log shows the need — ADR-008.)

## Anti-patterns to reject
- Mutable default arguments (`def f(x=[])`). — use `None` + assign inside.
- `except Exception: pass` / swallowed errors.
- `unwrap`-style `assert` for runtime validation in production paths.
- `import *`; circular imports from type-organized modules.
- Unpinned, un-grouped dependencies; logic that can't be tested without network/disk.

## nxtlvl conventions
- **Pointers over dumped content** — reference `file:line`; don't paste large blocks.
- **Surface assumptions** — state what you assumed about intent/runtime so a wrong assumption is
  visible rather than silent.
