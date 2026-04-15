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

Code that compiles is not code that works. After making changes, verify they actually work:

1. Run tests (`pnpm test` or equivalent)
2. If the project has a Testing page in the wiki, suggest `/verify` to walk through the E2E checklist in the browser
3. If you changed UI, check it visually — load the page in Chrome and confirm it looks right

YOU MUST NOT mark work complete without verification. Suggesting `/submit` or `/quality` before verifying the code works is backwards — broken code that passes lint is still broken code. Verify first, then let the user decide next steps.

## Leave it better than you found it

Every agent interaction should leave the codebase in a better state. If you encounter a broken test, a console error, an error overlay, a lint warning, or any other issue while working — fix it. This applies whether or not you caused it and whether or not it is related to your current task.

Do not classify issues as "pre-existing" to justify skipping them — context compaction erases your memory of changes made earlier in the session, so what looks pre-existing is often something you introduced. Even if you truly did not cause it, the goal is zero issues, not blame assignment. Fix it anyway. Do not argue with the user about whether an issue is yours to fix. It is.

## RFC 2119 keywords are binding

When a wiki page, skill, rule, spec, or issue uses MUST, MUST NOT, SHALL, or SHALL NOT, you MUST comply literally. YOU MUST NOT downgrade a MUST to a SHOULD because:

- it would take longer
- an example in the current session shows otherwise
- the codebase appears inconsistent
- you judge the requirement unnecessary
- it is inconvenient

If a MUST seems wrong, impossible, or in conflict with another MUST — STOP and ask the user. Do not silently relax it and proceed. The writer chose the keyword deliberately; overriding it is the agent substituting its judgment for the writer's. SHOULD allows deviation only with a factual justification about the current situation — convenience and time pressure are never valid justifications.

Session examples do not override written directives. If code in the session contradicts a MUST from the wiki or a skill, the session code is the problem — flag it, do not use it as permission to violate the MUST.

See `simpleapps:writing-style` for the full reading-compliance rules.

## Resolve, never hide

When a check fails, the solution is ALWAYS to fix the underlying code. NEVER:

- Disable or weaken a lint rule (`eslint-disable`, rule removal, config changes)
- Skip or delete a failing test (`.skip`, `.only`, deleting the test)
- Silence type errors (`@ts-ignore`, `@ts-expect-error`, `type: any`)
- Suppress warnings, lower coverage thresholds, or modify quality configs
- Add `--no-verify`, `--force`, or flags that bypass checks

These actions hide problems — they do not fix them. If a rule or test seems wrong, investigate why it exists before concluding it should change. Rules exist for reasons. If after investigation it genuinely does not apply, explain the reasoning to the user and let them decide — do not unilaterally disable it.

## Track progress

Use TodoRead/TodoWrite on multi-step tasks. Mark items in-progress before starting, completed after verifying.

## Never prompt for git actions

MUST NOT ask "want me to commit?", "should I submit?", "ready for a PR?", "want me to push?", or ANY variation after completing work. Do not hint at it either — "if you're happy with this, you can run /submit" is the same thing with extra words. The user knows their own workflow. They will say "commit", `/submit`, or equivalent when they are ready.

After completing work: report what changed, suggest `/verify` if untested, then stop. That is the entire post-work protocol. No git prompts. No shipping suggestions.

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
