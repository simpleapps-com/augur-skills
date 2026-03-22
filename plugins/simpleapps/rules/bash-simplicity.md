# Bash Simplicity

MUST run each Bash command as a separate, simple call. MUST NOT chain commands with `&&`, `||`, pipes, or sub-shells — complex commands trigger permission prompts and break automation.

Wrong: `git -C repo status && pnpm typecheck && pnpm test`
Right: Three separate Bash calls.

Use dedicated tools instead of Bash equivalents — they are faster, require no permission, and produce better output:

| Instead of | Use |
|------------|-----|
| `grep`, `rg` | Grep tool |
| `find`, `ls` | Glob tool |
| `cat`, `head`, `tail` | Read tool |
| `sed`, `awk` | Edit tool |

Before running a command that requires permission, check the wiki for approved commands and patterns. The wiki documents which commands are pre-approved and how to invoke them correctly.
