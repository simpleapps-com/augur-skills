---
name: bash-simplicity
description: Bash command conventions. One command per call, no shell plumbing, Read/Edit/Write by default with cat/sed allowed, check wiki for approved commands. Load this skill before running Bash commands.
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
| 1 | Dedicated tools (Read, Edit, Write) | **WILL** run immediately, zero permission chance | `Read(file_path: "repo/src/foo.ts")` |
| 2 | Simple Bash (one command, no operators) | **MAY** run immediately if pre-approved | `pnpm typecheck`, `grep -rn pattern repo` |
| 3 | Complex Bash (operators, plumbing) | **WILL** trigger a permission prompt | `pnpm typecheck 2>&1; echo $?` |

Tiers 1 and 2 are both fine; pick whichever is simpler for the job. NEVER use tier 3.

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
| Run inline code | Use Read/Edit tools | `node -e`, `python -c` |

**One command per Bash call. No operators. No plumbing. If the command has a `;`, `&&`, `|`, `$()`, `2>&1`, or `2>/dev/null` in it, it is wrong.**

## Files: Tools or Shell

Read, Edit, and Write are the default: they need no permission and their output is tracked. `cat`, `head`, `tail`, `sed`, `awk`, and heredocs are allowed too, and MAY be used when simpler:

| Job | Default | Shell is fine for |
|-----|---------|-------------------|
| Read | Read tool | `sed -n '40,60p' file`, `tail -n 50 log` |
| Edit | Edit tool | A one-line `sed -i` substitution in one file |
| Write | Write tool | A short heredoc |

SHOULD use Edit for exact or multi-line replacements: `sed` escaping is fragile and its flags differ between GNU and BSD/macOS (`sed -i ''`). MUST NOT batch a multi-file rewrite into one clever `sed`/`rg` command; do one file per call, or ask. Still one command per call, no plumbing.

**Search depends on your tool list.** If Grep and Glob are in it (the Windows default), MUST use them. Claude Code leaves them out by default on macOS, Linux, and WSL; there, `grep` and `find` in Claude's shell run embedded `ugrep` and `bfs`, so they always work. `rg` is faster and respects `.gitignore`, but it is not embedded and MAY be missing. Search files with one of:

| Use case | Bash command |
|----------|--------------|
| Search file contents | `grep -rn <pattern> <path>`, or `rg <pattern> <path>` if installed |
| Find files by name | `find <path> -name <pattern>`, or `rg --files <path>` if installed |
| List directory entries | `ls <path>` |

MUST NOT state tool availability as a version fact ("removed in 2.1.N") in rules or skills: it depends on platform and launch flags, and a pinned claim goes stale silently.

Bash is also the place for build tools, test runners, git, package managers, and system commands.

**JSON: prefer `jq`.** For JSON files, default to `jq` for field extraction rather than Read or `grep`. Reading a large JSON file with the Read tool dumps the whole structure (base64 blobs, embedding vectors, inlined doc strings) into context for the rest of the session; `grep` can't navigate JSON structure.

| Use case | Bash command |
|----------|--------------|
| Extract a field | `jq '.field' file.json` |
| Strip a noisy field | `jq 'del(.bigField)' file.json` |
| Pull values from an array | `jq '.[].itemId' file.json` |

Each is one command with no operators. The one-command-per-call rule still holds. `Read` and `grep` remain right for small JSON where the structure is unknown, malformed JSON, and cross-file string search.

These commands are **denied** in project settings and will always be rejected. Do not attempt them:
`cd` (keeps the session inside the project folder; use `git -C` and path arguments), `kill`, `pkill` (protect the user's processes; use `TaskStop`)

`sleep` is not denied, but foreground sleeping burns a turn to accomplish nothing. To wait on a condition, use the `Monitor` tool; to collect a background task's output, use `TaskOutput`/`TaskGet`. MUST NOT build a poll-and-sleep loop.

`lsof` is **allowed** and useful for reading state (finding what holds a port). It MUST NOT be used as a step toward stopping a process: the answer to "something is on the port" is `TaskStop`, or asking the user, never `kill`.

MUST NOT use `node -e` or `python -c` to run inline scripts. These trigger permission prompts. If you need to read a file, use the Read tool. If you need to process data, do it in your response, not in a shell script.

## When a Bash Command Is Denied

If a Bash call is denied, do NOT retry the same command and do NOT ask the user to approve it. Before anything else, check for a tool equivalent or shell plumbing that can be decomposed:

- `cat`/`head`/`tail` → Read tool
- `sed`/`awk` → Edit tool
- `|`, `2>&1`, `&&`, `;`, `$()` → split into separate calls; the Bash tool already captures stdout, stderr, and exit code

Worked example: `pnpm --filter <package> typecheck 2>&1 | grep -c "error TS"` is denied because of the pipe and redirection. The fix is to run `pnpm --filter <package> typecheck` alone (the Bash tool returns the full output and exit code), then count "error TS" occurrences in the returned output yourself. No pipe, no redirection, no retry. (`grep` itself is allowed; the deny is on the shell plumbing around it.)

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
2. If `TaskList` is empty, the process is from outside your session. `lsof -i :<port>` MAY be used to name it for the user. Then ask: "Port N is in use by `<process>` from a previous session. Can you stop it?"
3. MUST NOT attempt `kill`, `pkill`, or ask for permission to kill. These are denied and waste turns.

Do not retry the server start until the user confirms the port is free.

## Searching Other Repos

Other repos are read through `clones/<name>` inside the current project, NEVER by a path into another project folder (see `simpleapps:project-defaults` "clones/"). MUST keep it to one simple command per call: no pipes, no `-exec`, no `2>&1 | head`.

Wrong: `find clones/<name> -name "*.ts" -exec grep -l "pattern" {} \; 2>/dev/null | head -10`
Right: `grep -rln --include="*.ts" "pattern" clones/<name>`

Wrong: `ls ~/projects/simpleapps/<name>/repo/src/components/`
Right: `ls clones/<name>/src/components/`

MUST NOT search the entire filesystem. If the clone is missing, ask the user before cloning.

## Subagent Responsibility

Subagents do NOT inherit this skill. They see only the prompt you give them. The primary agent MUST brief every subagent on bash-simplicity before delegating shell work, and owns the output that comes back.

Every subagent prompt that touches Bash MUST include a one-liner: "One command per Bash call. No operators. Read, Edit, and Write by default; `cat` and `sed` are allowed when simpler. Search with the Grep/Glob tools if you have them; otherwise Bash `grep -rn`, `find`, `ls` (or `rg` if installed)."

If a subagent returns a command containing any forbidden operator (see the table above), that is the primary agent's failure. Reject and ask for a re-plan, or translate into separate simple calls. Do not execute it. A subagent violating this is running on a stale prompt; fix the prompt.

Parallel subagents each need their own briefing.

## Check Before Prompting

Before running a command that will trigger a permission prompt, check the wiki and project settings for approved commands. The wiki documents which commands are pre-approved and how to invoke them. Unnecessary permission prompts interrupt the user's flow.

**`pnpm:*` is pre-approved**: any command in `package.json` scripts runs without permission via `pnpm <script>`. If a tool needs to run repeatedly (linters, formatters, test runners), it SHOULD be a `package.json` script so it can run via pnpm without prompting. Suggest adding missing scripts when you notice the gap.
