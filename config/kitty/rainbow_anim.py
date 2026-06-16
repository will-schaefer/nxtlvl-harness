import time
import sys
import math

def rainbow_text(text, speed=0.1):
    """
    Creates an animated rainbow text effect in the terminal.
    Uses True Color (24-bit) ANSI escape codes.
    """
    try:
        t = 0
        while True:
            colored_chars = []
            for i, char in enumerate(text):
                # Using sine waves to cycle through RGB values smoothly
                # Each channel is offset to create the rainbow effect
                r = int(math.sin(0.1 * t + i * 0.5) * 127 + 128)
                g = int(math.sin(0.1 * t + i * 0.5 + 2 * math.pi / 3) * 127 + 128)
                b = int(math.sin(0.1 * t + i * 0.5 + 4 * math.pi / 3) * 127 + 128)
                
                # ANSI code: \x1b[38;2;R;G;Bm for 24-bit foreground color
                colored_chars.append(f"\x1b[38;2;{r};{g};{b}m{char}")
            
            # Write to stdout, reset color (\x1b[0m), and return to start of line ()
            sys.stdout.write("".join(colored_chars) + "\x1b[0m")
            sys.stdout.flush()
            
            t += 1
            time.sleep(speed)
    except KeyboardInterrupt:
        # Gracefully handle Ctrl+C
        sys.stdout.write("\x1b[0m
")
        print("Animation stopped.")

if __name__ == "__main__":
    message = "Gemini Animated Text Effect (Ctrl+C to stop)"
    rainbow_text(message, speed=0.05)
