---
name: github
description: GitHub conventions for SimpleApps. Covers org structure, git safety, issue creation, PR workflows, and gh CLI usage. Use when creating issues, PRs, or working with GitHub repos.
allowed-tools:
  - Skill(project-defaults)
  - Read
  - Glob
  - Grep
  - Bash
---

First, use Skill("project-defaults") to load the project layout.

# GitHub

## Organization

All SimpleApps repos live under **`simpleapps-com`**. Pattern: `simpleapps-com/<repo-name>`

## Authentication

```bash
gh auth status          # Check auth
gh auth setup-git       # Fix git credential helper (run if push fails 401/403)
```

## Project Layout

See `simpleapps:project-defaults` for the full directory layout, symlink setup, and permission defaults. Key point: the git repo is always at `repo/`. Use `git -C repo` for git operations from the project root.

## Wiki

See `simpleapps:wiki` for wiki conventions, token budget, and maintenance rules.

## Git Safety

MUST NOT commit, push, create PRs, or merge unless the user explicitly asks. After making changes, report what was done and stop. Do not offer or suggest the next git action — wait for instructions.

- **Commits**: Do not commit until the user says "commit" or equivalent
- **Pushes**: Do not push until the user explicitly asks
- **PRs**: Do not create or offer to create a PR — report the work, stop
- **Merges**: Do not merge unless the user explicitly asks

The pattern is always: **do the work → report results → wait**.

## Git Commands (no `cd`)

`cd` is denied. MUST use `git -C repo` for all git operations. For multi-line commit messages, write the message to a tmp file and use `git commit -F`:

```bash
# Stage files
git -C repo add path/to/file.md

# Write commit message to tmp file (use Write tool, not echo/cat)
# → /tmp/commit-msg.txt

# Commit using -F flag
git -C repo commit -F /tmp/commit-msg.txt

# Clean up
rm /tmp/commit-msg.txt
```

This avoids shell quoting issues with HEREDOCs and `cd` permission blocks. The Write tool creates the tmp file safely.

## Issues

MUST use `--repo simpleapps-com/<repo>` on every `gh` call. MUST ask the user which repo — never assume.

### Title

Conventional commit style: `fix: description`, `feat: description`, `chore: description`. Under 70 characters.

### Body

```markdown
## Problem
What is broken, missing, or needed?

## Expected Behavior
What SHOULD happen instead?

## Acceptance Criteria
- [ ] Concrete, testable criteria

## Context
Related issues, affected files, workarounds, reproduction steps.
```

Bug reports also include **Steps to Reproduce** and **Current Behavior** with error messages.

### Commands

```bash
gh issue create --repo simpleapps-com/<repo> --title "type: desc" --body "..."
gh issue list --repo simpleapps-com/<repo>
gh issue view <number> --repo simpleapps-com/<repo>
gh issue close <number> --repo simpleapps-com/<repo> --comment "message"
```

Include `Closes #N` in commit body to auto-close issues.

### Commenting on existing issues

Before adding a comment to a closed issue, check its state first with `gh issue view`. If the issue is closed but the problem still exists, reopen it with `gh issue reopen` before commenting — a comment on a closed issue is easily missed.

## Cross-Repo Issues

When a project hits a blocker that depends on another team's repo, create two issues and keep working:

1. **Local issue** (in the site/project repo) — describe the impact and what's blocked
2. **Upstream issue** (in the dependency repo) — describe the ask, include reproduction steps or specifics
3. **Cross-link** — reference the other issue using `simpleapps-com/repo#N` syntax in both issue bodies
4. **Don't block** — continue with other tasks while waiting for the upstream fix

Target repos:

| Dependency | Repo |
|------------|------|
| Backend microservices | `simpleapps-com/augur` |
| Shared frontend packages | `simpleapps-com/augur-packages` |
| TypeScript API SDK | `simpleapps-com/augur-api` |

Example cross-link in issue body: `Upstream: simpleapps-com/augur#44` or `Local impact: simpleapps-com/spotweldingsupplies#3`

## Pull Requests

```bash
gh pr create --repo simpleapps-com/<repo> --title "title" --body "..."
gh pr list --repo simpleapps-com/<repo>
gh pr view <number> --repo simpleapps-com/<repo>
gh pr merge <number> --repo simpleapps-com/<repo>
```

## Cross-Linking with Basecamp

For client tasks originating in Basecamp, see `simpleapps:workflow` for the full cross-linking process.
