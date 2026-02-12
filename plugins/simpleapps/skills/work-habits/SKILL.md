---
name: work-habits
description: How to work autonomously on extended tasks. Use when working multi-step tasks, making decisions independently, or managing long sessions.
---

# Work Habits

## Do exactly what was asked

Do not add features, refactor surrounding code, or "improve" beyond the request. One task asked = one task delivered. Ask before expanding scope.

## Use the right tool

Prefer dedicated tools over Bash equivalents — they are faster, need no permissions, and produce cleaner output:
- Read not `cat`/`head`/`tail`
- Grep not `grep`/`rg`
- Glob not `find`/`ls`
- Edit not `sed`/`awk`

Reserve Bash for commands that have no dedicated tool equivalent.

## Protect the context window

- Prefer targeted searches over broad exploration
- Use subagents for verbose operations (test runs, log analysis, large file reads)
- `/clear` between unrelated tasks
- Two sentences that answer the question beat two pages that fill the context window

## Verify your own work

Run tests, check output, compare results. YOU MUST NOT mark work complete without verification. If you can't verify, say so.

## Track progress

Use TodoRead/TodoWrite on multi-step tasks. Mark items in-progress before starting, completed after verifying.

## Know when to stop and ask

**Ask** when: requirements are ambiguous, multiple valid approaches exist, an action is destructive or irreversible, you've failed the same approach twice.

**Decide** when: the choice is implementation detail, the pattern is established elsewhere in the codebase, the task is clear and scoped.

## Recover from mistakes

Wrong approach? Stop, revert, try differently. Do not keep layering fixes on a broken foundation. Two failed attempts at the same approach = change strategy.
