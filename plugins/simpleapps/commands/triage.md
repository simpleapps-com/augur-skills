---
name: triage
description: Show triage status for the current site repo. Open PRs, linked issues, and unlinked issues.
allowed-tools: Bash(gh pr list:*), Bash(gh issue list:*), Bash(gh pr view:*), Bash(git remote:*), Bash(git -C:*), Bash(git stash:*), Bash(basename:*), Bash(pwd:*), Bash(ls:*), Bash(mkdir:*), Bash(date:*), Read, Write, Skill(project-defaults), Skill(github), Skill(bash-simplicity), Skill(wip-conventions)
---

First, use Skill("project-defaults") to load the project layout, Skill("github") to load GitHub conventions, Skill("bash-simplicity") to load Bash conventions, and Skill("wip-conventions") for the `wip/README.md` index format.

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
4. List WIP files: `ls wip/` (skip if `wip/` does not exist). Read each `*.md` except `README.md` for its frontmatter, H1, Source cross-refs, and Problem section (for the one-line summary).

## Cross-reference

For each PR, scan the title and body for issue references (`#<number>`, `fixes #<number>`, `closes #<number>`, `resolves #<number>`). Build a map of which issues are linked to PRs.

Identify blocked issues: any issue with a `blocked` label or "Blocked by" text in its body is a cross-repo dependency. Extract the upstream reference (e.g., `simpleapps-com/augur-packages#42`).

## Update wip/README.md

Rewrite `wip/README.md` per the Index format in `simpleapps:wip-conventions` (create `wip/` with `mkdir wip` if missing; get today with `date +%Y-%m-%d`):

- **Open issues without a WIP** (top of the file): every open issue, linked to a PR or not, that has no WIP (per the matching rule in `simpleapps:wip-conventions`), with its PR from the cross-reference map.
- **WIP files** (below it): one row per WIP file from step 4 of Gather data, with its PR and a one-line summary.

Write the whole file with the Write tool. Do not ask first: the file is a generated, gitignored index.

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

One line: `X PRs, Y unlinked issues, Z unlabeled, B blocked, S stashes, W WIPs`. Then note `wip/README.md updated`.

Suggest next step: `/wip <url>` to pick a task and scaffold a WIP file.
