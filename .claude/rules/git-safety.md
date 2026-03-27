# Git Safety

MUST NOT run any git write operation (commit, push, tag, merge, rebase, PR creation) unless the user explicitly approves.

After making changes: report what was done, then stop. Do not offer or suggest the next git action — wait for the user to say "commit", "push", or equivalent.

## Commands as approval

Invoking a command IS the approval to execute all steps in that command, including git writes. Do not stop to ask "should I commit?" or "should I push?" when the user already invoked the command.

- `/submit` — approval to commit and push. Execute all steps, report at the end.
- `/deploy` — approval to deploy. Execute all steps, report at the end.
- `/file-issue` — approval to file the issue. Execute immediately.
- `/quality` — approval to run and fix. Execute all checks.
- `/publish` — **EXCEPTION**: requires a secondary confirmation. Show the verification summary (version, changes, test status) and wait for the user to confirm before executing. This is the only command that stops for approval mid-execution.
