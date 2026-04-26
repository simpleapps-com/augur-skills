# Bash Simplicity

The Bash tool already captures stdout, stderr, and exit codes. NEVER add shell plumbing: no `;`, `&&`, `|`, `$()`, `2>&1`, `echo $?`, `node -e`, or `python -c`. If the command contains any of these, it is wrong. One command per call.

MUST use dedicated tools instead of shell commands when one exists:
- Read files → Read tool (not `cat`, `head`, `tail`)
- Edit files → Edit tool (not `sed`, `awk`)
- Write files → Write tool (not `echo >`, `cat <<EOF`)

Claude Code 2.1.117 removed the Grep and Glob tools. Search files via Bash:
- Search code → `grep -r <pattern> <path>` or `rg <pattern> <path>`
- Find files → `find <path> -name <pattern>` or `ls <path>`
Still one command per call (no pipes to `head`, no chained `find -exec grep`).

MUST NOT use `kill`, `pkill`, or `lsof` to stop processes. Use TaskStop with the task ID instead. TaskStop cleanly shuts down background tasks (dev servers, watchers) and updates internal tracking. If the process was started outside your session, ask the user to stop it.

Load Skill("bash-simplicity") for full conventions before running Bash commands.
