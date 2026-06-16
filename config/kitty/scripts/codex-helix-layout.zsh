#!/bin/zsh

set -euo pipefail

if [[ -z "${KITTY_LISTEN_ON:-}" ]]; then
  print -u2 -- "codex-helix-layout: KITTY_LISTEN_ON is not set"
  exit 1
fi

cwd="${PWD:A}"
hx_bin="/usr/local/bin/hx"
codex_bin="${HOME}/.npm-global/bin/codex"

[[ -x "$hx_bin" ]] || hx_bin="$(command -v hx)"
[[ -x "$codex_bin" ]] || codex_bin="$(command -v codex)"

if [[ -z "${hx_bin:-}" || -z "${codex_bin:-}" ]]; then
  print -u2 -- "codex-helix-layout: missing hx or codex on PATH"
  exit 1
fi

review_banner=$'printf "\\033[1;36mCodex + Helix flow\\033[0m\\n\\n"\n'
review_banner+=$'printf "Left: Helix\\nTop-right: Codex\\nBottom-right: review shell\\n\\n"\n'
review_banner+=$'printf "Useful loop:\\n  git diff --stat\\n  git diff --name-only\\n  git diff -- path/to/file\\n\\n"\n'
review_banner+=$'printf "Navigation: ctrl+arrow moves between Kitty panes and Helix splits.\\n\\n"\n'
review_banner+=$'exec zsh -l'

editor_win="$(
  kitty @ launch \
    --type=tab \
    --tab-title "Codex Flow" \
    --title "Helix" \
    --cwd "$cwd" \
    "$hx_bin"
)"

tab_match="window_id:${editor_win}"
kitty @ goto-layout --match "$tab_match" splits

codex_win="$(
  kitty @ launch \
    --match "$tab_match" \
    --location=vsplit \
    --next-to "id:${editor_win}" \
    --bias 35 \
    --title "Codex" \
    --cwd "$cwd" \
    "$codex_bin"
)"

kitty @ launch \
  --match "$tab_match" \
  --location=hsplit \
  --next-to "id:${codex_win}" \
  --bias 50 \
  --title "Review" \
  --cwd "$cwd" \
  /bin/zsh -lc "$review_banner" >/dev/null

kitty @ focus-window --match "id:${editor_win}" >/dev/null
