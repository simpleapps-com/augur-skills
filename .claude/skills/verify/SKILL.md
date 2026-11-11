---
name: verify
description: How to verify a change to this repo at runtime. Covers the simpleapps-statusline mod (live status lines in an isolated tmux pane). Use with /verify.
---

# Verify

## simpleapps-statusline mod

The surface is the status lines under the prompt. Drive a real Claude Code session in an isolated tmux server, from the project root (not `repo/`). One command per call.

1. Start at the width under test (70 columns is the width GH76 was reported at):
   `tmux -L verify-sl new-session -d -s v -x 70 -y 30 -c <project root> "claude --plugin-dir repo/plugins/simpleapps-statusline"`
2. Capture with `tmux -L verify-sl capture-pane -p -t v` (add `-S -60` for scrollback). Re-capture until the trust prompt or the status lines draw.
3. Trust prompt: `tmux -L verify-sl send-keys -t v Enter` takes the default ("continue without these permissions"). The mod still loads.
4. Before the first response, capture the lines. `/plan-usage` (`send-keys -t v "/plan-usage" Enter`) prints the raw reading without a model call: check which `rateLimits` Claude Code reports before blaming the mod for a missing meter.
5. Trigger the first response with a minimal prompt: `send-keys -t v "Reply with the single word ok. Use no tools." Enter`. Capture again.
6. Probe widths: `tmux -L verify-sl resize-window -t v -x 30`, then `-x 160`, capturing each.
7. Clean up: `tmux -L verify-sl kill-server`.

Gotchas:

- `5h` shows only while Claude Code reports a `five_hour` limit; with no active 5-hour window the raw reading holds only `seven_day`, so the 5h/week pairing cannot be seen live then.
- The installed copy of the plugin is not drawn twice: `--plugin-dir` takes over the same-named plugin.
- The step-5 prompt costs one small model call.
