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

## Check site.json first

Before asking the user for credentials, tokens, siteId, domain, or any site-specific configuration, read `.simpleapps/site.json`. It is the single source of truth for site-level data — credentials, auth tokens, defaults, and identifiers. If what you need is not there, ask the user to add it to `site.json` rather than providing it in chat (chat data is ephemeral; `site.json` persists across sessions).

## Read the error first

When debugging in the browser, MUST check for error overlays (red error pill/badge at the bottom of the page) before guessing at the problem. Click it, read the full error, stack trace, and source location. The answer is almost always right there.

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

## Never prompt for git actions

MUST NOT ask "want me to commit?", "should I submit?", or any variation after completing work. The user will say "commit", `/submit`, or equivalent when ready. During multi-step implementation, asking to commit between steps interrupts the flow and adds noise. Report what was done and stop.

## Know when to stop and ask

**Ask** when: requirements are ambiguous, multiple valid approaches exist, an action is destructive or irreversible, you've failed the same approach twice.

**Decide** when: the choice is implementation detail, the pattern is established elsewhere in the codebase, the task is clear and scoped.

## Be persistent with browser automation

When using Chrome tools, do not give up after the first failure. Pages are dynamic — elements may not be visible yet, selectors may need adjusting, or the page may need time to load.

Accessibility features make sites machine-readable — the same semantic HTML, ARIA labels, landmark roles, and alt text that help screen reader users also help you navigate pages during Chrome automation. When looking for elements, prefer ARIA roles and labels over brittle CSS selectors. When reviewing or writing frontend code, strong accessibility is not just a user concern — it directly improves your ability to automate and verify the site, and search engines benefit from the same semantic signals.

Before giving up on a browser task:
- Look for ARIA labels, roles, and semantic elements first — they are the most reliable selectors
- Try a different selector or approach (text search, CSS selector, coordinates)
- Scroll to reveal elements that may be off-screen
- Wait for the page to finish loading, then retry
- Use `get_page_text` or `read_page` to understand the current page state before retrying
- Try navigating to the page again if it seems stuck

Two failed attempts with the *same* approach means change strategy, not stop entirely.

## Good enough is done

Working code that meets the requirements is good enough — ship it. Do not chase diminishing returns by over-polishing, refactoring working code, or improving what already works. The cost of continued refinement exceeds its value. Stop when the task is done, not when you run out of improvements to make.

The distinction: polishing task-specific code is local optimization — it makes one site marginally better but does not move the system forward. Extracting custom code into shared packages removes a system constraint — every site that would have reimplemented the same thing benefits. Local optimization is waste. Removing system constraints compounds. Flag extraction opportunities per "Improve the system" below, but do not polish the task code itself.

## Recover from mistakes

Wrong approach? Stop, revert, try differently. Do not keep layering fixes on a broken foundation. Two failed attempts at the same approach = change strategy.

## Improve the system, not just the output

Removing daily work is more important than doing daily work. While completing a task, notice friction: unnecessary manual steps, repeated patterns that could be shared, error-prone processes that could be automated, custom code that duplicates a package export. When you spot these, flag them — suggest a package addition, a script, a skill improvement, or a workflow change. The value of eliminating a step that runs every day far exceeds the value of completing it one more time.

This is not scope creep on the code. "Do exactly what was asked" still applies to the task. But improving the system the task runs in — making skills clearer, workflows smoother, shared code more complete — is always in scope. File an issue, update a skill, or mention it in your report.
