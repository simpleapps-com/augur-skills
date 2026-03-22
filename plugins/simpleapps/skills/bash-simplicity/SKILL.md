---
name: bash-simplicity
description: Bash command conventions — one command per call, use dedicated tools over shell equivalents, check wiki for approved commands. Load this skill before running Bash commands.
user-invocable: false
---

# Bash Simplicity

## Why This Matters

Every permission prompt makes the user the bottleneck. If the user doesn't see the prompt for an hour, that hour is lost — the agent is blocked, the task stalls, and the system designed for autonomous work stops working. The entire plugin system exists to remove the user as the bottleneck. A permission prompt works directly against that goal. Use dedicated tools and simple commands to avoid ever triggering one.

## One Command Per Call

MUST run each Bash command as a separate, simple call. MUST NOT chain commands with `&&`, `||`, pipes, or sub-shells. Complex commands trigger permission prompts and break automation.

Wrong: `git -C repo status && pnpm typecheck && pnpm test`
Right: Three separate Bash calls, one per command.

Wrong: `pnpm --filter <site> run typecheck 2>&1; echo "EXIT: $?"`
Right: `pnpm --filter <site> run typecheck` — the Bash tool already captures stderr and exit codes. Never add `2>&1`, `; echo $?`, or other shell plumbing — it triggers permission prompts for no benefit.

Wrong: `gh issue close 367 --repo org/repo --comment "$(< tmp/file.txt)" 2>&1`
Right: Write the comment to a tmp file, then use two separate calls:
1. `gh issue comment 367 --repo org/repo --body-file tmp/file.txt`
2. `gh issue close 367 --repo org/repo`

MUST NOT use `$()` command substitution in Bash commands — it triggers a permission prompt every time. Write content to a tmp file first, then pass it with a `-F`, `--body-file`, or similar flag.

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

These commands are **denied** in project settings and will always be rejected — do not attempt them:
`cd`, `cat`, `grep`, `rg`, `find`, `sed`, `awk`, `head`, `tail`, `sleep`, `kill`, `pkill`

MUST NOT use `node -e` or `python -c` to run inline scripts — these trigger permission prompts. If you need to read a file, use the Read tool. If you need to process data, do it in your response, not in a shell script.

## Cross-Project Searching

When looking at another project's code, use dedicated tools with the project path — MUST NOT use shell commands:

Wrong: `find {path}/repo -name "*.ts" -exec grep -l "pattern" {} \; 2>/dev/null | head -10`
Right: `Grep(pattern: "pattern", path: "{path}/repo", glob: "*.ts")`

Wrong: `ls {path}/repo/src/components/`
Right: `Glob(pattern: "{path}/repo/src/components/**/*")`

All project paths are known and predictable (see `simpleapps:wiki` Cross-Project Wiki Access). MUST NOT search the filesystem with `find` or download from the internet — just use the dedicated tool with the known path.

## Check Before Prompting

Before running a command that will trigger a permission prompt, check the wiki and project settings for approved commands. The wiki documents which commands are pre-approved and how to invoke them. Unnecessary permission prompts interrupt the user's flow.

**`pnpm:*` is pre-approved** — any command in `package.json` scripts runs without permission via `pnpm <script>`. If a tool needs to run repeatedly (linters, formatters, test runners), it SHOULD be a `package.json` script so it can run via pnpm without prompting. Suggest adding missing scripts when you notice the gap.
