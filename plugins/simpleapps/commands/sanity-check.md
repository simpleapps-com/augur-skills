---
name: sanity-check
description: Check that we solved the right problem without errors of commission or omission. Goldratt's two types of mistakes.
argument-hint: "[wip-file]"
allowed-tools: Bash(git -C:*), Bash(gh issue:*), Bash(git remote:*), Skill(wiki), Skill(basecamp), mcp__plugin_simpleapps_basecamp__*, Read, Glob, Grep
---

First, use Skill("wiki") for project conventions, then Skill("basecamp") for MCP tools.

## Why this exists

Eliyahu Goldratt identified two types of mistakes that undermine any process:

1. **Errors of commission**: doing something that should not have been done
2. **Errors of omission**: not doing something that should have been done

His key insight: organizations over-police commission errors because they are visible and blameable. Omission errors are invisible. No one gets blamed for what did not happen. So omissions slip through repeatedly while commissions get caught in normal review. This command exists to catch both, but its real value is on the omission side.

Most review tools (linters, tests, /quality) catch implementation errors. But they cannot catch the harder mistakes: misunderstanding the request, solving the wrong problem, over-engineering the solution, missing an implied requirement, or ignoring a simpler approach.

This command compares what was asked (the WIP and original request) against what was done (the diff) and flags where the two diverge in either direction.

**Bias warning**: You are reviewing your own work. You will be inclined to validate it. Counteract this. Adopt the stance of a skeptical reviewer who did not write the code. A clean verdict should be the exception, not the default. If you find nothing, look harder.

## 1. Find the WIP

If `$ARGUMENTS` contains a file path, use it. Otherwise, check `wip/` for `.md` files. If there is exactly one, use it. If there are multiple, pick the most recently modified, but tell the user which one you chose so they can correct you. If no WIP file exists, stop and tell the user this command needs a WIP file.

From the WIP file, extract:
- **Source**: the original issue or Basecamp URL
- **Problem statement**: what was requested
- **Acceptance criteria**: if present
- **Research/Analysis**: any decisions, approach notes, or trade-offs documented

## 2. Re-fetch the original request

Fetch the original source fresh (GitHub issue or Basecamp item) to catch updates, new comments, or clarifications added since the WIP was created. Compare against the WIP's Problem section. Flag if the request changed but the WIP was not updated.

## 3. Gather what was actually done

Determine what changed. Try these in order:
1. If on a feature branch: `git -C repo log main..HEAD --oneline` to find the base, then `git -C repo diff main...HEAD` for the full diff
2. If that shows nothing: `git -C repo diff HEAD` for uncommitted changes
3. If still nothing: `git -C repo diff --staged`

Read the actual diffs to understand the substance of the changes, not just the file list.

## 4. Did we understand the problem?

Before checking what we did or missed, check the foundation: did we correctly interpret what was being asked?

- Re-read the original request and every comment
- Compare our interpretation (reflected in the diff) against what the client/issue actually said
- Look for assumptions we made that are not stated in the request
- If the request is ambiguous, flag the ambiguity. Did we pick a reasonable interpretation or guess?

A misunderstanding at this level makes everything downstream wrong. This is the highest-value check.

## 5. Check for errors of commission

Did we do something we should NOT have done?

- **Scope creep**: files changed that are unrelated to the request
- **Over-engineering**: abstractions, configurability, or generalization beyond what was asked
- **Unnecessary refactoring**: code cleanup or restructuring not part of the request
- **Convention violations**: patterns that contradict the wiki or existing codebase conventions
- **Unasked features**: behavior added that the client/issue did not request
- **Side effects**: changes that could break unrelated functionality

For each finding, cite the specific file/change and explain why it qualifies.

## 6. Check for errors of omission

Did we miss something we SHOULD have done? Lean into this section. Omission errors are what slip through normal review.

- **Acceptance criteria gaps**: criteria listed in the issue that are not addressed in the diff
- **Implied requirements**: things the request clearly implies but does not spell out (e.g., "add a field" implies it should be visible, saveable, and validated). "Implied" means what a reasonable developer would expect, not gold-plating or speculative features.
- **Edge cases**: obvious failure modes not handled (empty states, error states, missing data)
- **Cross-repo work**: does this change require a corresponding change in another repo (augur, augur-packages, augur-api) that was not filed as an issue?
- **Wiki updates**: new behavior that should be documented in Testing.md or other wiki pages
- **Missing tests**: new behavior without corresponding test coverage (if the project has tests)
- **Basecamp follow-up**: client-facing changes that need a Basecamp update
- **WIP research gaps**: if the WIP Research section identified risks, trade-offs, or "need to check X" items, were they addressed?

For each finding, cite what was expected (from the request) and what is missing (from the diff).

## 7. Challenge the solution

Step back from the details. This is strategic, not tactical. Do not repeat findings from steps 5/6.

**Simplicity**: Is there a simpler, more elegant solution? Look for signs of unnecessary complexity: multiple files changed when one would do, custom code where a library/package method exists, manual wiring where a convention or framework feature handles it. If a simpler approach exists, describe it concretely.

**Root cause**: Did we solve the root cause or patch a symptom? If the fix is localized but the same problem could recur elsewhere, flag it.

**Proportionality**: Is the size of the change proportional to the size of the problem? A one-line config issue should not produce a 200-line diff.

**Approach consistency**: Does the implementation match the approach documented in the WIP Research/Analysis section? If we deviated, why, and did we update the WIP?

## 8. Report

```
## Sanity Check

**WIP**: wip/{filename}
**Source**: {issue or Basecamp URL}
**Files changed**: {count}

### Understanding
{Did we interpret the request correctly? Flag any assumptions or ambiguities.}

### Commission (should NOT have done)
- [{severity}] {finding}: {file}: {explanation}
(or: None found)

### Omission (should HAVE done)
- [{severity}] {finding}: {what was expected vs what is missing}
(or: None found)

### Solution
- Simplicity: {simpler approach? describe it, or "no simpler alternative"}
- Root cause: {symptom patch or real fix?}
- Proportionality: {change size vs problem size}
- Approach: {matches WIP research or deviated?}

### Verdict
{One line: "Clean, N concerns" or "X issues found, top priority: {most severe}"}
```

Severity levels: `critical` (wrong problem, missed acceptance criteria), `warning` (scope creep, missing edge case), `note` (wiki update, minor omission).

**Then stop.** This command audits whether we solved the right problem. Fixing belongs in `/quality` and `/verify`. Report findings and let the user decide which to action.
