# Bash Simplicity

The Bash tool already captures stdout, stderr, and exit codes. NEVER add shell plumbing: no `;`, `&&`, `|`, `$()`, `2>&1`, `echo $?`, `node -e`, or `python -c`. If the command contains any of these, it is wrong. One command per call.

Files: Read, Edit, and Write are the default. `cat`, `head`, `tail`, `sed`, `awk`, and heredocs MAY be used when simpler (a `sed -n` line range, a one-line `sed -i` substitution). SHOULD use Edit for exact or multi-line replacements, where `sed` flags differ between GNU and BSD/macOS. Still one command per call.

Search: if Grep and Glob are in your tool list (the Windows default), MUST use them. Claude Code leaves them out by default on macOS, Linux, and WSL; there, search via Bash:
- Search code → `grep -rn <pattern> <path>` (built into Claude's shell), or `rg <pattern> <path>` if installed
- Find files → `find <path> -name <pattern>` or `ls <path>`
Still one command per call (no pipes to `head`, no chained `find -exec grep`).

MUST NOT use `kill`, `pkill`, or `lsof` to stop processes. Use TaskStop with the task ID instead. TaskStop cleanly shuts down background tasks (dev servers, watchers) and updates internal tracking. If the process was started outside your session, ask the user to stop it.

Load Skill("bash-simplicity") for full conventions before running Bash commands.
