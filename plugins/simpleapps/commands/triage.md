---
name: triage
description: Show triage status for the current site repo. Open PRs, linked issues, and unlinked issues.
allowed-tools: Bash(gh pr list:*), Bash(gh issue list:*), Bash(gh pr view:*), Bash(git remote:*), Bash(git -C:*), Bash(git stash:*), Bash(basename:*), Bash(pwd:*), Skill(project-defaults), Skill(github), Skill(bash-simplicity)
---

First, use Skill("project-defaults") to load the project layout, Skill("github") to load GitHub conventions, and Skill("bash-simplicity") to load Bash conventions.

Show the triage status for the current site repo.

## Determine the repo

Per the github skill's project layout, the git repo is at `repo/`.

1. Run `git -C repo remote -v` to read the remote
2. If that fails, fall back to `git remote -v` in the current directory
3. Extract the `org/repo` from the remote URL (strip `.git` suffix)

## Gather data

MUST run each command as a separate, simple call. MUST NOT combine commands with `&&`, pipes, or sub-shells. Complex commands trigger permission prompts and break automation.

1. List all open PRs: `gh pr list --repo <org>/<repo> --state open --json number,title,body --limit 100`
2. List all open issues: `gh issue list --repo <org>/<repo> --state open --json number,title,labels --limit 100`
3. List stashes: `git -C repo stash list`

## Cross-reference

For each PR, scan the title and body for issue references (`#<number>`, `fixes #<number>`, `closes #<number>`, `resolves #<number>`). Build a map of which issues are linked to PRs.

Identify blocked issues: any issue with a `blocked` label or "Blocked by" text in its body is a cross-repo dependency. Extract the upstream reference (e.g., `simpleapps-com/augur-packages#42`).

## Output

Display exactly two tables and a summary:

### Open PRs

| PR | Title | Linked Issues |
|----|-------|---------------|

List every open PR. The "Linked Issues" column shows comma-separated `#<number>` references found in that PR.

### Open Issues without PRs

| Issue | Title | Labels | Category |
|-------|-------|--------|----------|

List only issues that are NOT linked to any PR. Show existing labels. Infer a category from the issue title and labels (e.g., accessibility, SEO, bug, security, feature, docs).

### Blocked Issues

If any issues have the `blocked` label or "Blocked by" references, show them separately:

| Issue | Title | Blocked By | Filed |
|-------|-------|------------|-------|

"Blocked By" shows the upstream issue reference (e.g., `simpleapps-com/augur-packages#42`). "Filed" shows when the blocking comment was added, if detectable. If no blocked issues exist, skip this section.

### Unlabeled Issues

Flag any open issues that have NO labels. Standard labels are: `bug`, `security`, `a11y`, `perf`, `SEO`, `enhancement`, `refactor`, `production-blocker`, `blocked`. Suggest which label(s) each unlabeled issue should have based on its title and content.

If many issues are unlabeled, suggest running `/project-init` to ensure the standard labels exist on the repo.

### Stashes

If `git stash list` returned any entries, show them:

| Stash | Branch | Description |
|-------|--------|-------------|

Stashes are orphaned work. They should be popped, dropped, or turned into commits. Flag each one. If no stashes exist, skip this section.

### Summary

One line: `X PRs, Y unlinked issues, Z unlabeled, B blocked, S stashes`

Suggest next step: `/wip <url>` to pick a task and scaffold a WIP file.
