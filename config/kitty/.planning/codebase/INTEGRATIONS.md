# External Integrations

**Analysis Date:** 2025-02-20

## APIs & External Services

**Terminal Integration:**
- **iTerm2 Python API** - Custom status bar component integration via `iterm2.StatusBarComponent`.
  - SDK/Client: `iterm2` (Python package)
  - Auth: None (uses local session)

**AI Services:**
- **Claude Code CLI** - Integrated into the development workflow for code generation and task management.
- **MCP (Model Context Protocol)** - Configured with multiple servers for enhanced capabilities:
  - `tavily`: Web search tool
  - `playwright`: Browser automation
  - `serena`: Project management tool

## Data Storage

**Databases:**
- **None** - The project is purely configuration and script-based.

**File Storage:**
- **Local Filesystem** - Used for configuration files (`.claude/settings.local.json`, `.serena/project.yml`) and Python scripts.

**Caching:**
- **None** - No caching mechanism detected.

## Authentication & Identity

**Auth Provider:**
- **Custom** - Integration via iTerm2 profile names. The script `iterm2_gemini_status.py` uses `iterm2.StatusBarComponent.VariableBinding("profileName")` to identify the current session context.

## Monitoring & Observability

**Error Tracking:**
- **None** - Errors are reported directly via Python tracebacks or terminal stderr.

**Logs:**
- **Standard Output** - Scripts such as `rainbow_anim.py` use `sys.stdout.write` for terminal output.

## CI/CD & Deployment

**Hosting:**
- **Local macOS Development Environment** - Optimized for iTerm2 terminal users.

**CI Pipeline:**
- **None** - Manual local development and testing workflow.

## Environment Configuration

**Required env vars:**
- `HELIX_RUNTIME` - Configured in `.claude/settings.local.json` for the Helix editor.
- `PATH` - Must include the bin directory for tools installed via Homebrew.

**Secrets location:**
- No sensitive credentials detected in the codebase. Relies on external authentication for tools like `gh` and `git`.

## Webhooks & Callbacks

**Incoming:**
- **iTerm2 Component Updates** - Triggered by the terminal's refresh cycle via the `@component.update` decorator in `iterm2_gemini_status.py`.

**Outgoing:**
- **None** - No outgoing webhooks detected in current scripts.

---

*Integration audit: 2025-02-20*
