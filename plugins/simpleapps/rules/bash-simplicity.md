# Bash Simplicity

MUST run each Bash command as a separate, simple call. MUST NOT chain with `&&`, `||`, pipes, or sub-shells. MUST NOT use `$()` command substitution or `2>&1` — write content to a tmp file and use file-based flags (`-F`, `--body-file`).

MUST NOT use `node -e`, `python -c`, or inline scripts — use Read/Grep tools instead.

MUST use dedicated tools instead of shell commands — including when searching other projects:
- Search code → Grep tool (not `grep`, `find -exec grep`)
- Find files → Glob tool (not `find`, `ls`)
- Read files → Read tool (not `cat`, `head`, `tail`)
- Edit files → Edit tool (not `sed`, `awk`)

Load Skill("bash-simplicity") for full conventions before running Bash commands.
