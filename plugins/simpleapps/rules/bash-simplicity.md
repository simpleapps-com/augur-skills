# Bash Simplicity

The Bash tool already captures stdout, stderr, and exit codes. NEVER add shell plumbing — no `;`, `&&`, `|`, `$()`, `2>&1`, `echo $?`, `node -e`, or `python -c`. If the command contains any of these, it is wrong. One command per call.

MUST use dedicated tools instead of shell commands — including when searching other projects:
- Search code → Grep tool (not `grep`, `find -exec grep`)
- Find files → Glob tool (not `find`, `ls`)
- Read files → Read tool (not `cat`, `head`, `tail`)
- Edit files → Edit tool (not `sed`, `awk`)

Load Skill("bash-simplicity") for full conventions before running Bash commands.
