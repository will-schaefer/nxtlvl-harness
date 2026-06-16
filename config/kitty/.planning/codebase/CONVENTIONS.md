# Coding Conventions

## Language Standards
- **Python**: Primary language for iTerm2 status components and utilities.
- **Version**: Python 3.x (target 3.10+ recommended for modern features).

## Naming Conventions
- **Files**: `snake_case.py` (e.g., `iterm2_gemini_status.py`, `rainbow_anim.py`).
- **Functions**: `snake_case` (e.g., `gemini_status_update`, `rainbow_text`).
- **Variables**: `snake_case`.
- **Classes**: `PascalCase` (if applicable).

## Code Style
- **Indentation**: 4 spaces.
- **Docstrings**: Encouraged for public functions and complex logic.
- **Async/Await**: Used for `iterm2` components to maintain responsiveness.
- **ANSI Styling**: Direct use of 24-bit True Color ANSI escape codes (`\x1b[38;2;R;G;Bm`) for visual effects.

## Project Structure
- **Root**: Scripts and core components.
- **.planning/codebase/**: Architectural and process documentation.
- **.claude/**: Environment-specific configurations.

## Documentation
- Detailed guides for workflow setup (e.g., `Claude Code CLI - iTerm2 + tmux + Helix Config Guide.md`).
- Focus on terminal productivity and multi-agent workflows.
