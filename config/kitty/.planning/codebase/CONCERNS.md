# Codebase Concerns

**Analysis Date:** 2025-02-21

## Tech Debt

**Hardcoded Profile Names:**
- Issue: Profile names for determining tags are hardcoded in the script.
- Files: `iterm2_gemini_status.py`
- Impact: Requires manual script modification to support new or different iTerm2 profiles.
- Fix approach: Use iTerm2 status bar "knobs" to allow user configuration of profile mappings directly from the iTerm2 UI.

**High Update Cadence:**
- Issue: `update_cadence=0.1` causes the status bar to redraw 10 times per second.
- Files: `iterm2_gemini_status.py`
- Impact: Potential unnecessary CPU usage for a simple status message, especially if multiple windows/tabs are open.
- Fix approach: Increase `update_cadence` to a higher value (e.g., 0.5 or 1.0) unless the animation smoothness is critical.

## Performance Bottlenecks

**Infinite Loop Animation:**
- Problem: The `while True` loop in `rainbow_text` runs with a very short sleep (0.05s) and performs math operations and string concatenations.
- Files: `rainbow_anim.py`
- Cause: Designed for continuous terminal animation.
- Improvement path: Ensure the script is only run when needed and consider using more efficient terminal writing techniques if performance becomes an issue.

## Test Coverage Gaps

**Missing Unit/Integration Tests:**
- What's not tested: Logic for color cycling, profile tagging, and iTerm2 component registration.
- Files: `iterm2_gemini_status.py`, `rainbow_anim.py`
- Risk: Changes to logic might break the status bar or animation without immediate notice.
- Priority: Low (given the small scope of the project).

## Fragile Areas

**iTerm2 Python API Dependency:**
- Files: `iterm2_gemini_status.py`
- Why fragile: The script relies on the `iterm2` Python library and the iTerm2 application's Python API support.
- Safe modification: Check for library existence and API version compatibility if the script is shared.

---

*Concerns audit: 2025-02-21*
