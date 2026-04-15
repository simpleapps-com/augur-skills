---
name: submit
description: Submit work for review — commit and create a PR as defined in the project wiki Deployment page
allowed-tools: Bash(git:*), Bash(gh:*), Bash(rm:*), Bash(wc:*), Skill(deployment), Skill(git-safety), Skill(conventional-commits), Skill(github), Skill(bash-simplicity), Skill(work-habits), Read, Write, Glob, Grep, Edit
---

First, load these skills:
1. Skill("deployment") — reads wiki Deployment page and loads git-safety
2. Skill("conventional-commits") — commit message format
3. Skill("github") — PR conventions and gh CLI
4. Skill("bash-simplicity") — Bash conventions
5. Skill("work-habits") — autonomous execution rules and RFC 2119 compliance

## What This Command Does

Submit the current work for review by following the **Submit** section of the project's `wiki/Deployment.md` page.

## Hard Requirement: Deployment Page

Before doing ANYTHING else, read `wiki/Deployment.md` and find the **Submit** section.

**If `wiki/Deployment.md` does not exist or has no Submit section, YOU MUST STOP IMMEDIATELY.** Do not guess, do not improvise, do not use defaults. Tell the user:

> "Cannot run /submit — no Deployment page found at wiki/Deployment.md. Run /curate-wiki to generate it from the codebase."

Then stop. Do nothing else. MUST NOT attempt to commit, create PRs, or figure out the steps on your own.

## Process (only if Deployment page exists)

This command IS the user's approval to commit and push. Execute all steps without stopping to ask for confirmation.

1. Follow the steps defined in the **Submit** section of `wiki/Deployment.md`
2. Check the current branch — warn if on main/master
3. Use conventional-commits format for commit messages
4. Use github skill conventions for PR title and body
5. Execute all git operations (stage, commit, push, PR creation) — do not pause between them
6. MUST NOT use `$()` in gh commands — use `--body-file` with a tmp file
7. Update linked issues (see below)
8. Report what was done at the end

## Update Linked Issues

After committing/pushing, check if the work is linked to a GitHub issue:

1. Check the branch name for issue references (e.g., `fix/42-description`)
2. Check recent commit messages for `#N` references
3. If a linked issue is found, add a comment summarizing what was done and linking to the commit or PR. Write the comment to `tmp/issue-comment.txt` first, then use `gh issue comment <number> --repo <repo> --body-file tmp/issue-comment.txt`.

Comment format:
```
Fixed in <commit-sha or PR link>.

Summary of changes:
- <brief list of what changed>
```

If the commit message includes `Closes #N` or `Fixes #N`, the issue will auto-close — no need to close it manually. If the work partially addresses the issue, say so in the comment and leave it open.
