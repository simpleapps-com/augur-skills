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

MUST NOT use `cd` in any Bash command — not even in compound commands like `cd /path && git log`. Use `git -C repo` for git, and path arguments for everything else. The `cd` deny rule does not suppress Claude Code's built-in security prompt for compound cd+git commands, so any `cd` usage will interrupt the user.

## Protect the context window

- Prefer targeted searches over broad exploration
- Use subagents for verbose operations (test runs, log analysis, large file reads)
- `/clear` between unrelated tasks
- Two sentences that answer the question beat two pages that fill the context window

## Verify your own work

Run tests, check output, compare results. YOU MUST NOT mark work complete without verification. If you can't verify, say so.

## Own every issue you find

If a check fails or a bug surfaces, fix it. Do not classify issues as "pre-existing" to justify skipping them — context compaction erases your memory of changes made earlier in the session, so what looks pre-existing is often something you introduced. Even if you truly did not cause it, the goal is zero issues, not blame assignment. Fix it anyway.

## Track progress

Use TodoRead/TodoWrite on multi-step tasks. Mark items in-progress before starting, completed after verifying.

## Know when to stop and ask

**Ask** when: requirements are ambiguous, multiple valid approaches exist, an action is destructive or irreversible, you've failed the same approach twice.

**Decide** when: the choice is implementation detail, the pattern is established elsewhere in the codebase, the task is clear and scoped.

## Be persistent with browser automation

When using Chrome tools, do not give up after the first failure. Pages are dynamic — elements may not be visible yet, selectors may need adjusting, or the page may need time to load.

Before giving up on a browser task:
- Try a different selector or approach (text search, CSS selector, coordinates)
- Scroll to reveal elements that may be off-screen
- Wait for the page to finish loading, then retry
- Use `get_page_text` or `read_page` to understand the current page state before retrying
- Try navigating to the page again if it seems stuck

Two failed attempts with the *same* approach means change strategy, not stop entirely.

## Recover from mistakes

Wrong approach? Stop, revert, try differently. Do not keep layering fixes on a broken foundation. Two failed attempts at the same approach = change strategy.
