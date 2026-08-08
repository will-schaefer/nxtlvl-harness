#!/usr/bin/env python3
"""Regenerate the personal i-have-adhd skill from the installed plugin.

The upstream plugin (github.com/ayghri/i-have-adhd) sets
``disable-model-invocation: true``, which hides the skill from the model and
leaves only the ``/i-have-adhd`` slash command. The global CLAUDE.md requires
the skill on every reply, which that version cannot satisfy.

So the personal copy at ``config/claude/skills/i-have-adhd/SKILL.md`` (symlinked
to ``~/.claude/skills``) takes upstream's body verbatim and replaces the
frontmatter: the flag is dropped and the description is pinned to one that
triggers on every message. Run this after ``claude plugin update`` to pick up
upstream body changes without losing either edit.

Fails open: any problem is reported on stderr and the exit code stays 0, so this
is safe to wire into a SessionStart hook.
"""

import json
import os
import sys

PLUGIN_KEY = "i-have-adhd@i-have-adhd"
INSTALLED = os.path.expanduser("~/.claude/plugins/installed_plugins.json")

# Pinned deliberately rather than inherited: the description is the only part
# Claude reads when deciding whether to apply a skill, and upstream's now reads
# as a manual switch ("Invoke with /i-have-adhd"). This is the policy choice the
# personal copy exists to make; the body below it stays upstream's.
DESCRIPTION = (
    "Shape output for a reader with ADHD. Use this skill whenever responding to "
    "ANY user message including coding tasks, debugging, explanations, planning, "
    "and casual conversation. Output should lead with concrete next actions, "
    "number multi-step work, externalize state across turns, suppress tangents, "
    "give specific time estimates, and make wins visible. Trigger even on casual "
    "messages and even when the user did not explicitly ask for brevity."
)

FRONTMATTER = "---\nname: i-have-adhd\ndescription: %s\nlicense: MIT\n---\n" % DESCRIPTION


def give_up(message):
    print("sync-adhd-skill: %s" % message, file=sys.stderr)
    sys.exit(0)


def main():
    try:
        with open(INSTALLED) as handle:
            entries = json.load(handle)["plugins"].get(PLUGIN_KEY)
    except (OSError, ValueError, KeyError) as error:
        give_up("cannot read %s (%s)" % (INSTALLED, error))

    if not entries:
        give_up("plugin %s is not installed; leaving the personal copy alone" % PLUGIN_KEY)

    # Prefer the user-scope install; any entry will do if there is no user one.
    entry = next((e for e in entries if e.get("scope") == "user"), entries[0])
    source = os.path.join(entry["installPath"], "skills", "i-have-adhd", "SKILL.md")

    try:
        with open(source) as handle:
            upstream = handle.read()
    except OSError as error:
        give_up("cannot read %s (%s)" % (source, error))

    # Everything after the closing frontmatter delimiter is the body we keep.
    parts = upstream.split("---\n", 2)
    if len(parts) < 3:
        give_up("%s has no frontmatter block; refusing to guess where the body starts" % source)

    rendered = FRONTMATTER + parts[2]

    destination = os.path.join(
        os.path.dirname(os.path.realpath(__file__)), "skills", "i-have-adhd", "SKILL.md"
    )

    if os.path.exists(destination):
        with open(destination) as handle:
            if handle.read() == rendered:
                sys.exit(0)  # already current; stay silent

    os.makedirs(os.path.dirname(destination), exist_ok=True)
    with open(destination, "w") as handle:
        handle.write(rendered)

    print(
        "sync-adhd-skill: refreshed %s from plugin version %s "
        "(the nxtlvl-core working tree now has an uncommitted change)"
        % (destination, entry.get("version", "unknown"))
    )


if __name__ == "__main__":
    main()
