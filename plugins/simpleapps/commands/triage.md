---
name: triage
description: Show triage status for the current site repo — open PRs, linked issues, and unlinked issues
allowed-tools: Bash(gh pr list:*), Bash(gh issue list:*), Bash(gh pr view:*), Bash(git remote:*), Bash(git -C:*), Bash(basename:*), Bash(pwd:*), Skill(project-defaults), Skill(github)
---

First, use Skill("project-defaults") to load the project layout, then Skill("github") to load GitHub conventions.

Show the triage status for the current site repo.

## Determine the repo

Per the github skill's project layout, the git repo is at `repo/`.

1. Run `git -C repo remote -v` to read the remote
2. If that fails, fall back to `git remote -v` in the current directory
3. Extract the `org/repo` from the remote URL (strip `.git` suffix)

## Gather data

MUST run each command as a separate, simple call. MUST NOT combine commands with `&&`, pipes, or sub-shells — complex commands trigger permission prompts and break automation.

1. List all open PRs: `gh pr list --repo <org>/<repo> --state open --json number,title,body --limit 100`
2. List all open issues: `gh issue list --repo <org>/<repo> --state open --json number,title,labels --limit 100`

## Cross-reference

For each PR, scan the title and body for issue references (`#<number>`, `fixes #<number>`, `closes #<number>`, `resolves #<number>`). Build a map of which issues are linked to PRs.

## Output

Display exactly two tables and a summary:

### Open PRs

| PR | Title | Linked Issues |
|----|-------|---------------|

List every open PR. The "Linked Issues" column shows comma-separated `#<number>` references found in that PR.

### Open Issues without PRs

| Issue | Title | Category |
|-------|-------|----------|

List only issues that are NOT linked to any PR. Infer a category from the issue title and labels (e.g., accessibility, SEO, bug, security, feature, docs).

### Summary

One line: `X PRs, Y unlinked issues`
