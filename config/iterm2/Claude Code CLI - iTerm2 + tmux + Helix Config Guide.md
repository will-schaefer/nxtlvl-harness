# Claude Code CLI Workflow: iTerm2 + tmux + Helix Configuration Guide

**Inspired by:** Daniel San (William Schaefer)

This guide outlines a high-productivity CLI workflow optimized for **iTerm2**, **tmux**, and **Helix**, specifically designed for running multiple **Claude Code** agents in parallel.

## Core Stack
- **iTerm2** — The most feature-rich terminal for macOS.
- **tmux** — Terminal multiplexer for persistent sessions and complex layouts.
- **Helix** — Modern, modal terminal editor with built-in LSP and tree-sitter.
- **Claude Code** — Agentic CLI for AI-assisted development.

---

## 1. Pane Setup — The SAND Mnemonic (tmux)

The **SAND** mnemonic helps categorize panel operations:

### S — Split: Create New Panes
```bash
# Vertical split (side-by-side)
Ctrl-b %

# Horizontal split (top/bottom)
Ctrl-b "

# Recommended tmux.conf remaps:
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
```

### A — Across: Move Between Windows/Tabs
```bash
# New window (tab)
Ctrl-b c

# Next/previous window
Ctrl-b n
Ctrl-b p

# Jump to window
Ctrl-b 0-9
```

### N — Navigate: Jump Between Panes
```bash
# Arrow key navigation
Ctrl-b <arrow>

# Recommended: vim-style navigation
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R

# Resize panes
Ctrl-b Ctrl-<arrow>

# Zoom/unzoom a pane
Ctrl-b z
```

### D — Destroy: Close Panes and Windows
```bash
# Close current pane
Ctrl-b x

# Close current window
Ctrl-b &
```

---

## 2. Multiple Claude Code Instances

Run 2-3 Claude Code instances in parallel to handle separate tasks or git worktrees.

### Basic Layout: Claude + Lazygit
```
+-------------------+-------------------+
|                   |     lazygit       |
|   Claude Code     |                   |
|                   +-------------------+
|                   |      yazi         |
+-------------------+-------------------+
```

### Automation Script (~/claude-multi.sh)
```bash
#!/bin/bash
SESSION="claude-multi"
tmux new-session -d -s $SESSION -n main
tmux send-keys -t $SESSION "claude" Enter
tmux split-window -h -t $SESSION
tmux send-keys -t $SESSION "claude" Enter
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "claude" Enter
tmux attach -t $SESSION
```

---

## 3. Git Worktrees + Diffs

Use worktrees to allow each Claude instance to work on a separate branch without conflicts.

```bash
# Create worktrees
git worktree add ../feature-auth feature/auth
git worktree add ../bugfix-api bugfix/api-error

# Assign Claude instances to different worktrees in tmux panes
cd ~/projects/feature-auth && claude
cd ~/projects/bugfix-api && claude
```

---

## 4. Helix Editor Configuration

Helix is the perfect companion for reviewing Claude's changes.

**Location:** `~/.config/helix/config.toml`

```toml
theme = "catppuccin_mocha"

[editor]
line-number = "relative"
mouse = true
bufferline = "multiple"
color-modes = true
true-color = true

[editor.cursor-shape]
insert = "bar"
normal = "block"
select = "underline"

[editor.statusline]
left = ["mode", "spinner", "file-name", "file-modification-indicator"]
right = ["diagnostics", "selections", "register", "position", "file-encoding"]

[keys.normal]
C-s = ":write"
H = ":buffer-previous"
L = ":buffer-next"
C-w = { v = ":vsplit", s = ":hsplit" }
```

---

## 5. Tmux Configuration (~/.tmux.conf)

```bash
# Remap prefix to Ctrl-a
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# Mouse support
set -g mouse on

# Start windows and panes at 1
set -g base-index 1
setw -g pane-base-index 1

# True color support
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",xterm-256color:RGB"

# Vim-style navigation
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R
```

---

## 6. iTerm2 Configuration

### Profile Settings
- **Terminal > Scrollback lines:** Set to unlimited.
- **Terminal > Shell Integration:** Enable for better navigation.
- **Appearance > Theme:** Minimal (reduces chrome).
- **Keys > Hotkey Window:** Set a system-wide hotkey (e.g., Ctrl+`) for instant access.

### iTerm2 + tmux Integration
iTerm2 has native tmux integration mode. Launch with:
```bash
tmux -CC
```
This lets iTerm2 manage tmux panes as native tabs/splits.

---

## 7. Bonus Tools

- **yazi**: Terminal file browser.
- **lazygit**: Essential TUI for monitoring Claude's git operations.
- **delta**: Better Git diffs.

---

## 8. Quick-Start Cheat Sheet

| Action | tmux Shortcut |
|--------|---------------|
| Split right | `Prefix + |` |
| Split down | `Prefix + -` |
| Navigate | `Prefix + h/j/k/l` |
| Zoom Pane | `Prefix + z` |
| New Tab | `Prefix + c` |

**Prefix = Ctrl-a**
