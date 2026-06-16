# Claude Code CLI Workflow: Kitty + tmux + Helix Configuration Guide

**Inspired by:** Daniel San (William Schaefer)

This guide outlines a high-productivity CLI workflow optimized for **Kitty**, **tmux**, and **Helix**, specifically designed for running multiple **Claude Code** agents in parallel.

## Core Stack
- **Kitty** — Fast, GPU-accelerated terminal emulator for macOS/Linux.
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

# True color support (Crucial for Kitty)
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",xterm-kitty:RGB"

# Vim-style navigation
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R
```

---

## 6. Kitty Configuration

Kitty is configured via `~/.config/kitty/kitty.conf`. It provides the high-speed rendering engine for this stack.

### Essential kitty.conf Settings
```conf
# Font
font_family      Fira Code
font_size        12.0

# Window Appearance
background_opacity 0.95
transparent_background_colors #CDD4DF@0.88 #E1E5EC@0.88
hide_window_decorations yes
window_padding_width 4

# Scrollback
scrollback_lines 100000

# Features
shell_integration enabled
allow_remote_control yes

# Layouts
enabled_layouts splits,stack
```

### Why Kitty?
- **GPU Accelerated**: Zero-latency input, even with multiple panes.
- **Kittens**: Use the `icat` kitten for image previews in `yazi`.
- **Remote Control**: Script your terminal state via `kitty @` commands.
- **Per-color transparency**: You can make Helix backgrounds translucent without making every terminal surface translucent.

---

## 7. Bonus Tools

- **yazi**: Terminal file browser with image support.
- **lazygit**: Essential TUI for monitoring Claude's git operations.
- **delta**: Side-by-side syntax-highlighted diffs in the terminal.

---

## 8. Quick-Start Cheat Sheet

| Action | tmux Shortcut |
|--------|---------------|
| Split right | `Prefix + |` |
| Split down | `Prefix + -` |
| Navigate | `Prefix + h/j/k/l` |
| Zoom Pane | `Prefix + z` |
| New Tab | `Prefix + c` |
| Reload | `Prefix + r` |

**Prefix = Ctrl-a**
