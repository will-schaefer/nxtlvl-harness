# Technology Stack

**Analysis Date:** 2025-02-20

## Languages

**Primary:**
- **Python 3** - Used for all custom scripts including status bar components (`iterm2_gemini_status.py`) and terminal animations (`rainbow_anim.py`).

**Secondary:**
- **Markdown** - Used for documentation and workflow guides (`Claude Code CLI - iTerm2 + tmux + Helix Config Guide.md`).
- **Bash/Shell** - Used for tmux configuration and terminal automation.
- **TOML** - Used for Helix editor configuration.

## Runtime

**Environment:**
- **Python 3.x** - Execution runtime for automation scripts.
- **iTerm2 Python Runtime** - Managed environment for running scripts within the iTerm2 terminal.

**Package Manager:**
- **Homebrew** - Used for installing CLI tools like `tmux`, `hx`, `lazygit`, and `yazi`.
- Lockfile: None detected (tools are globally installed via brew).

## Frameworks

**Core:**
- **iTerm2 Python API** - Framework for creating status bar components and interacting with the terminal emulator.

**Build/Dev:**
- **tmux** - Terminal multiplexer for persistent sessions and pane management.
- **Helix (hx)** - Modal terminal editor.
- **Claude Code CLI** - AI-powered developer tool.

## Key Dependencies

**Critical:**
- `iterm2` - Core library for terminal script integration (`iterm2_gemini_status.py`).
- `asyncio` - Used for asynchronous updates in the status bar component.

**Infrastructure:**
- `git` - Version control and worktree management for parallel development.
- `git-delta` - Used for enhanced terminal diff visualization.

## Configuration

**Environment:**
- Configured via shell profile and application-specific config files.
- Key configs: iTerm2 Profiles, `~/.tmux.conf`, `~/.config/helix/config.toml`.

**Build:**
- No traditional build system; the repository contains configuration and scripts.
- `.claude/settings.local.json` - Configuration for the Claude Code CLI environment and tool permissions.

## Platform Requirements

**Development:**
- **macOS** - Required for iTerm2 terminal.
- **iTerm2 v3.3+** - Necessary for Python API support.

---

*Stack analysis: 2025-02-20*
