---
name: bash-simplicity
description: Bash command conventions — one command per call, use dedicated tools over shell equivalents, check wiki for approved commands. Load this skill before running Bash commands.
user-invocable: false
---

# Bash Simplicity

## One Command Per Call

MUST run each Bash command as a separate, simple call. MUST NOT chain commands with `&&`, `||`, pipes, or sub-shells. Complex commands trigger permission prompts and break automation.

Wrong: `git -C repo status && pnpm typecheck && pnpm test`
Right: Three separate Bash calls, one per command.

Wrong: `pnpm --filter ampro-online run typecheck 2>&1; echo "EXIT: $?"`
Right: `pnpm --filter ampro-online run typecheck` — the Bash tool already captures stderr and exit codes. Never add `2>&1`, `; echo $?`, or other shell plumbing — it triggers permission prompts for no benefit.

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

## Check Before Prompting

Before running a command that will trigger a permission prompt, check the wiki and project settings for approved commands. The wiki documents which commands are pre-approved and how to invoke them. Unnecessary permission prompts interrupt the user's flow.
