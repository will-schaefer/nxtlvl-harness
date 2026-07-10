# Plain-language rule

**Scope:** every word that persists anywhere in the nxtlvl ecosystem — design docs, ADRs,
READMEs, rule files, skill text, commit messages, PR titles/bodies, code comments, memory
entries, and UI copy. If a future reader (human or agent) will see it, this rule applies.

## The rule

- **Invented shorthand and nicknames are banned outright.** No coined abbreviations
  ("SoT" for source of truth, "WDD" for wiki-driven development), no pet names or
  codenames for components, no compressed jargon a newcomer couldn't decode. Write the
  words: *source of truth*, *wiki-driven development*.
- **Universal industry acronyms are the only exception** — terms any working developer
  reads without pausing: ADR, PR, CI, API, URL, JSON, MCP, CLI, HTML, CSS. Even these:
  **spell out on first use per document** when the doc's audience might not know them
  (e.g. "ADR (architecture decision record)").
- **The test:** would someone opening this file cold, with no session context, read the
  term without stopping? If there's any doubt, write it out. Characters are cheap;
  a reader decoding "SoT" is not.

## Triggers

- **Authoring or editing any persisted text?** Sweep your draft for coined abbreviations
  before saving — expand every one.
- **Tempted to coin a shorthand because a phrase repeats?** Repetition of a clear phrase
  is fine; a nickname that saves keystrokes but costs every future reader a lookup is not.
- **Quoting or referencing an existing doc that uses banned shorthand?** Expand it in
  your own prose ("the source-of-truth layout (called 'SoT' in ADR-028)"); fix the source
  doc when you're already editing it for other reasons.

## What not to do

- Don't retroactively rewrite the whole corpus in one sweep — fix offenders opportunistically,
  as files get touched.
- Don't expand acronyms inside code identifiers, established file names, or third-party
  terms you don't own (a library's own "SDK" stays "SDK").
