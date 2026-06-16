#!/usr/bin/env python3

import iterm2
import asyncio
import math
import time

async def main(connection):
    # Register the component
    component = iterm2.StatusBarComponent(
        short_description="Gemini AI Status",
        detailed_description="Displays a custom Gemini status message with a rainbow logo and profile tag.",
        exemplar="♊ Gemini (Claude): Ready",
        update_cadence=0.1,
        identifier="com.google.gemini.rainbow",
        knobs=[],
    )

    @component.update
    async def gemini_status_update(knobs, profile_name=iterm2.StatusBarComponent.VariableBinding("profileName")):
        # Color cycle for the Gemini logo
        t = time.time() * 2
        r = int(math.sin(t) * 127 + 128)
        g = int(math.sin(t + 2 * math.pi / 3) * 127 + 128)
        b = int(math.sin(t + 4 * math.pi / 3) * 127 + 128)
        
        color_code = f"\x1b[38;2;{r};{g};{b}m"
        reset_code = "\x1b[0m"
        
        # Determine the tag based on the profile name
        tag = ""
        if profile_name:
            if "Claude" in profile_name:
                tag = f" ({profile_name})"
            elif "Codex" in profile_name:
                tag = f" ({profile_name})"
            elif "Gemini" in profile_name:
                tag = "" # Already covered by the logo
            else:
                tag = f" [{profile_name}]"
        
        return f"{color_code}♊ Gemini{reset_code}{tag}: Active"

    await component.async_register(connection)

if __name__ == "__main__":
    iterm2.run_forever(main)
