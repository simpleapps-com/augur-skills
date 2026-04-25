---
name: submit
description: Submit work for review. Commit and create a PR as defined in the project wiki Deployment page.
allowed-tools: Bash(git -C:*), Bash(gh:*), Bash(rm:*), Bash(wc:*), Bash(date:*), Skill(deployment), Skill(git-safety), Skill(conventional-commits), Skill(github), Skill(bash-simplicity), Skill(wip), Skill(work-habits), Read, Write, Glob, Grep, Edit
---

First, load these skills:
1. Skill("deployment"): reads wiki Deployment page and loads git-safety
2. Skill("conventional-commits"): commit message format
3. Skill("github"): PR conventions and gh CLI
4. Skill("bash-simplicity"): Bash conventions
5. Skill("wip"): WIP frontmatter schema, for updating the WIP after push
6. Skill("work-habits"): autonomous execution rules and RFC 2119 compliance

## What This Command Does

Submit the current work for review by following the **Submit** section of the project's `wiki/Deployment.md` page.

## Hard Requirement: Deployment Page

Before doing ANYTHING else, read `wiki/Deployment.md` and find the **Submit** section.

**If `wiki/Deployment.md` does not exist or has no Submit section, YOU MUST STOP IMMEDIATELY.** Do not guess, do not improvise, do not use defaults. Tell the user:

> "Cannot run /submit: no Deployment page found at wiki/Deployment.md. Run /curate-wiki to generate it from the codebase."

Then stop. Do nothing else. MUST NOT attempt to commit, create PRs, or figure out the steps on your own.

## Process (only if Deployment page exists)

This command IS the user's approval to commit and push. Execute all steps without stopping to ask for confirmation.

1. Follow the steps defined in the **Submit** section of `wiki/Deployment.md`. When the wiki uses shell operators (`&&`, `;`, `|`, `$()`), you MUST split them into separate, single-command Bash calls per `bash-simplicity`. One command per call, no exceptions. If the first command in a sequence fails, stop and report. Do not run the next.
2. Check the current branch. Warn if on main/master.
3. Use conventional-commits format for commit messages
4. Use github skill conventions for PR title and body
5. Execute all git operations (stage, commit, push, PR creation). Do not pause between them.
6. MUST NOT use `$()` in gh commands. Use `--body-file` with a tmp file.
7. Update linked issues (see below)
8. Update the WIP frontmatter (see below)
9. Report what was done at the end
10. If the current branch is not the default branch (`main` / `master`), ask the user whether to switch to it before the next task. Do not switch without approval.

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

If the commit message includes `Closes #N` or `Fixes #N`, the issue will auto-close. No need to close it manually. If the work partially addresses the issue, say so in the comment and leave it open.

## Update the WIP frontmatter

After the push succeeds and CI is green (or the PR is open if the project uses PRs), find the WIP for this work and mark it shipped per `simpleapps:wip`:

1. Derive the issue number from the branch name (e.g., `fix/42-description` → `N=42`) or from `Closes #N`/`Fixes #N` in the commit message.
2. Use Glob to find `wip/GH{N}-*.md` or `wip/BC{N}-*.md`. If no match, skip this step — the work was not tracked through the WIP flow.
3. Edit the frontmatter: set `status: shipped`, `shipped_at: <today>` (`date +%Y-%m-%d`), and `pr` to the PR URL if one exists, otherwise the commit SHA. Bump `last_reviewed` to today.
4. Leave `disposition` empty. The user or `/process-wips` decides later whether to promote or delete.

If the WIP has no frontmatter (legacy), add the full block per the `simpleapps:wip` schema before setting the fields above.

If CI fails after the push, do NOT update `status` or `shipped_at`. Leave the WIP at `in-progress` so the user can fix and re-run /submit.
