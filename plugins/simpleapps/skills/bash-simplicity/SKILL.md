---
name: bash-simplicity
description: Bash command conventions. One command per call, use dedicated tools over shell equivalents, check wiki for approved commands. Load this skill before running Bash commands.
user-invocable: false
---

# Bash Simplicity

## Why This Matters

A complex command feels efficient: do more in one call. But the more complex the command, the higher the probability it triggers a permission prompt. A permission prompt blocks the agent until the user responds. If the user doesn't see it for an hour, that hour is lost.

**Simple commands are faster than complex ones because they never wait for a human.** Ten simple commands that execute instantly are faster than one complex command that waits an hour for approval. The agent's goal is to complete work; a blocked prompt completes nothing.

The entire plugin system exists to remove the user as the bottleneck. Every permission prompt puts them back in the critical path.

**Three tiers of execution speed. Always use the highest tier available:**

| Tier | Method | Speed | Example |
|------|--------|-------|---------|
| 1 | Dedicated tools (Read, Grep, Glob, Edit) | **WILL** run immediately, zero permission chance | `Grep(pattern: "...", path: "repo")` |
| 2 | Simple Bash (one command, no operators) | **MAY** run immediately if pre-approved | `pnpm typecheck` |
| 3 | Complex Bash (operators, plumbing) | **WILL** trigger a permission prompt | `pnpm typecheck 2>&1; echo $?` |

Prefer tier 1 over tier 2. Use tier 2 only when no dedicated tool exists. NEVER use tier 3.

## The Bash Tool Is Not a Terminal

The Bash tool is a managed environment, not a raw shell. It already captures stdout, stderr, and the exit code automatically. There is NEVER a reason to add shell plumbing. Every shell operator triggers a permission prompt that blocks the user for zero benefit.

**If the Bash tool already does it, do not do it yourself:**

| You want to... | The tool already does it | Do NOT add |
|----------------|------------------------|------------|
| Get the exit code | Returned automatically | `; echo $?`, `; echo "Exit code: $?"` |
| Capture stderr | Captured automatically | `2>&1`, `2>/dev/null` |
| Limit output | Returned in full | `\| head`, `\| tail`, `\| grep` |
| Run the next step | Make a separate tool call | `&&`, `;`, `\|\|` |
| Pass output to another command | Write to a tmp file | `$(...)`, backticks |
| Run inline code | Use Read/Grep/Edit tools | `node -e`, `python -c` |

**One command per Bash call. No operators. No plumbing. If the command has a `;`, `&&`, `|`, `$()`, `2>&1`, or `2>/dev/null` in it, it is wrong.**

## Use Dedicated Tools

Dedicated tools are faster, require no permission, and produce better output. MUST use them instead of Bash equivalents:

| Instead of | Use |
|------------|-----|
| `grep`, `rg` | Grep tool |
| `find`, `ls` (for search) | Glob tool |
| `cat`, `head`, `tail` | Read tool |
| `sed`, `awk` | Edit tool |
| `echo >`, `cat <<EOF` | Write tool |

Reserve Bash for commands that have no dedicated tool equivalent: build tools, test runners, git, package managers, and system commands.

These commands are **denied** in project settings and will always be rejected. Do not attempt them:
`cd`, `cat`, `grep`, `rg`, `find`, `sed`, `awk`, `head`, `tail`, `sleep`, `kill`, `pkill`

MUST NOT use `node -e` or `python -c` to run inline scripts. These trigger permission prompts. If you need to read a file, use the Read tool. If you need to process data, do it in your response, not in a shell script.

## When a Bash Command Is Denied

If a Bash call is denied, do NOT retry the same command and do NOT ask the user to approve it. Before anything else, check for a tool equivalent or shell plumbing that can be decomposed:

- `grep`/`rg` → Grep tool (for files on disk); for command output, the Bash tool already returned it — read what you have
- `find`/`ls` → Glob tool
- `cat`/`head`/`tail` → Read tool
- `sed`/`awk` → Edit tool
- `|`, `2>&1`, `&&`, `;`, `$()` → split into separate calls; the Bash tool already captures stdout, stderr, and exit code

Worked example: `pnpm --filter <package> typecheck 2>&1 | grep -c "error TS"` is denied because of the pipe to `grep`. The fix is to run `pnpm --filter <package> typecheck` alone — the Bash tool returns the full output and exit code — then count "error TS" occurrences in the returned output yourself. No grep, no redirection, no retry.

## Background Tasks

When you start a background task with `run_in_background`, you receive a task ID. That ID is how you manage the task later:

- **Stop it**: use `TaskStop` with the task ID
- **Check output**: use `TaskGet` or `Read` on the output file
- **List running tasks**: use `TaskList`

MUST NOT use `kill` or `pkill` to stop background tasks. These are denied and will fail. Use `TaskStop` instead. It cleanly shuts down the process and updates internal tracking.

If a process was started **outside your session** (by the user in a terminal), you cannot stop it with `TaskStop`. Ask the user to restart or stop it themselves.

### Port conflicts (EADDRINUSE)

When a dev server fails with EADDRINUSE, a process from a previous session is occupying the port. Follow this sequence:

1. Check `TaskList`. If the task is listed, use `TaskStop`.
2. If `TaskList` is empty, the process is from outside your session. Ask the user: "Port N is in use by a process from a previous session. Can you stop it?"
3. MUST NOT attempt `kill`, `pkill`, or ask for permission to kill. These are denied and waste turns.

Do not retry the server start until the user confirms the port is free.

## Cross-Project Searching

When looking at another project's code, use dedicated tools with the project path. MUST NOT use shell commands.

Wrong: `find {path}/repo -name "*.ts" -exec grep -l "pattern" {} \; 2>/dev/null | head -10`
Right: `Grep(pattern: "pattern", path: "{path}/repo", glob: "*.ts")`

Wrong: `ls {path}/repo/src/components/`
Right: `Glob(pattern: "{path}/repo/src/components/**/*")`

All project paths are known and predictable (see `simpleapps:wiki` Cross-Project Wiki Access). MUST NOT search the filesystem with `find` or download from the internet. Just use the dedicated tool with the known path.

## Subagent Responsibility

Subagents do NOT inherit this skill. They see only the prompt you give them. The primary agent MUST brief every subagent on bash-simplicity before delegating shell work, and owns the output that comes back.

Every subagent prompt that touches Bash MUST include a one-liner: "One command per Bash call. No operators. Use dedicated tools (Read, Grep, Glob, Edit, Write) over shell equivalents."

If a subagent returns a command containing any forbidden operator (see the table above), that is the primary agent's failure. Reject and ask for a re-plan, or translate into separate simple calls. Do not execute it. A subagent violating this is running on a stale prompt; fix the prompt.

Parallel subagents each need their own briefing.

## Check Before Prompting

Before running a command that will trigger a permission prompt, check the wiki and project settings for approved commands. The wiki documents which commands are pre-approved and how to invoke them. Unnecessary permission prompts interrupt the user's flow.

**`pnpm:*` is pre-approved**: any command in `package.json` scripts runs without permission via `pnpm <script>`. If a tool needs to run repeatedly (linters, formatters, test runners), it SHOULD be a `package.json` script so it can run via pnpm without prompting. Suggest adding missing scripts when you notice the gap.
