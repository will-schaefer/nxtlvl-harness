# Testing Strategy

## Overview
Currently, the project focuses on visual terminal components and documentation. Testing is primarily manual and visual.

## Manual Testing
- **iTerm2 Status Components**: 
  - Install as a script in iTerm2.
  - Verify rendering in the status bar.
  - Check for dynamic updates (e.g., color cycling in `iterm2_gemini_status.py`).
- **CLI Animations**:
  - Run scripts directly in iTerm2 (`python3 rainbow_anim.py`).
  - Verify color accuracy and animation smoothness.
  - Test interrupt handling (Ctrl+C).

## Future Automation Goals
- **Unit Testing**:
  - Implement `pytest` for non-visual logic (e.g., color calculation math).
  - Use `unittest.mock` to simulate `iterm2` API connections.
- **Linting**:
  - Use `ruff` or `flake8` to enforce PEP 8 compliance.
- **CI/CD**:
  - GitHub Actions for linting and basic script validation on push.

## Validation Steps
1. Run script in a 24-bit color compatible terminal.
2. Confirm no runtime exceptions occur during long-running loops.
3. Verify resource usage (CPU/Memory) is minimal for background components.
