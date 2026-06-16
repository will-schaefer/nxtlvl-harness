# Codebase Structure

**Analysis Date:** 2026-02-20

## Directory Map

```text
/Users/willschaefer/dev/iTerm2/
├── .claude/                # Claude Code CLI configuration
│   └── settings.local.json  # Local tool permissions and environment settings
├── .planning/              # Project planning and analysis documentation
│   └── codebase/           # Detailed codebase analysis reports
│       ├── ARCHITECTURE.md # System design and high-level architecture
│       ├── STACK.md        # Technology stack and dependencies
│       ├── INTEGRATIONS.md # External APIs and service integrations
│       └── STRUCTURE.md    # Codebase structure and file organization
├── Claude Code CLI... .md  # Comprehensive workflow and configuration guide
├── iterm2_gemini_status.py # iTerm2 Python API status bar component
└── rainbow_anim.py         # Terminal animation utility using ANSI True Color
```

## Component Breakdown

### 1. Configuration & Workflow
- **`Claude Code CLI - iTerm2 + tmux + Helix Config Guide.md`**: The central documentation for the development environment. It defines the "SAND" mnemonic for navigation, tmux layouts for multi-agent workflows, and configuration snippets for Helix and tmux.
- **`.claude/settings.local.json`**: Controls the behavior of the Claude Code CLI within this workspace, including auto-approval for shell commands and environment variable configurations (like `HELIX_RUNTIME`).

### 2. iTerm2 Enhancements
- **`iterm2_gemini_status.py`**: A Python script that integrates with the iTerm2 Status Bar. It detects the current iTerm2 profile (e.g., "Claude", "Codex", "Gemini") and displays a color-cycled status message.
- **`rainbow_anim.py`**: A utility script demonstrating terminal text effects using sine-wave based RGB color cycling. It serves as a visual enhancement tool for terminal output.

### 3. Planning & Metadata
- **`.planning/codebase/`**: This directory acts as the "living documentation" for the project's technical state. It contains auto-generated and manually curated reports on the project's architecture, stack, and integrations.

## File Categorization

| Category | Files |
| :--- | :--- |
| **Logic/Scripts** | `iterm2_gemini_status.py`, `rainbow_anim.py` |
| **Documentation** | `Claude Code CLI - iTerm2 + tmux + Helix Config Guide.md`, `.planning/codebase/*.md` |
| **Configuration** | `.claude/settings.local.json` |

---
*Structure analysis: 2026-02-20*
