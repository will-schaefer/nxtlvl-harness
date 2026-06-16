#!/usr/bin/env python3

import sys
import time
import math
import subprocess

def get_color(t):
    """Calculate rainbow colors based on time."""
    r = int(math.sin(t) * 127 + 128)
    g = int(math.sin(t + 2 * math.pi / 3) * 127 + 128)
    b = int(math.sin(t + 4 * math.pi / 3) * 127 + 128)
    return f"\x1b[38;2;{r};{g};{b}m"

def update_status():
    """Update terminal title or tmux status line."""
    reset = "\x1b[0m"
    while True:
        t = time.time() * 2
        color = get_color(t)
        
        # Format the status message
        status = f"{color}♊ Gemini{reset}: Active"
        
        # Option 1: Set Kitty Window Title (via escape sequence)
        sys.stdout.write(f"\x1b]2;{status}\x07")
        sys.stdout.flush()
        
        # Option 2: If inside tmux, we could update a tmux variable or status
        # subprocess.run(["tmux", "set-option", "-g", "status-right", status])
        
        time.sleep(0.1)

if __name__ == "__main__":
    try:
        update_status()
    except KeyboardInterrupt:
        pass
