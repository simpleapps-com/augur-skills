---
name: github
description: GitHub conventions for SimpleApps. Covers org structure, issue creation, PR workflows, and gh CLI usage. Use when creating issues, PRs, or working with GitHub repos.
---

# GitHub

## Organization

All SimpleApps repos live under the **`simpleapps-com`** GitHub org.

Repository pattern: `simpleapps-com/<repo-name>`

## Authentication

Use the `gh` CLI for all GitHub operations. It handles authentication automatically.

```bash
gh auth status          # Check auth status
gh auth setup-git       # Configure gh as git credential helper
```

If `git push` fails with 401/403, run `gh auth setup-git` to fix credentials.

## Issues

### Creating Issues

MUST always use `--repo simpleapps-com/<repo>` to target the correct org. MUST ask the user which repo to create the issue in — never assume.

#### Issue Title

- Use conventional commit style: `fix: description`, `feat: description`, `chore: description`
- SHOULD be a technical description, not the client's words
- Keep under 70 characters

#### Issue Body

Every issue MUST include these sections:

```markdown
## Problem
What is broken, missing, or needed? Include error messages, URLs, or screenshots if relevant.

## Expected Behavior
What SHOULD happen instead? Be specific.

## Acceptance Criteria
- [ ] Concrete, testable criteria
- [ ] Each item is independently verifiable

## Context
Any additional info: related issues, affected files, workarounds, reproduction steps.
```

For bug reports, also include:
- **Steps to Reproduce** — numbered steps to trigger the bug
- **Current Behavior** — what actually happens (with error messages)

#### Labels

Use labels to categorize: `bug`, `feature`, `enhancement`

#### Example

```bash
gh issue create --repo simpleapps-com/<repo> \
  --title "fix: search endpoint returns 404" \
  --body "$(cat <<'ISSUE'
## Problem
The `search` MCP tool returns HTTP 404 on every query. This prevents finding content across projects.

## Expected Behavior
Search SHOULD return matching results, consistent with the Basecamp web UI.

## Acceptance Criteria
- [ ] Search returns results for known content
- [ ] Error handling for empty results

## Context
BCX API may not expose a search endpoint. Web UI search at `/search?q=...` works.
ISSUE
)"
```

### Managing Issues

```bash
gh issue list --repo simpleapps-com/<repo>                    # List open issues
gh issue list --repo simpleapps-com/<repo> --state all        # Include closed
gh issue view <number> --repo simpleapps-com/<repo>           # View issue details
gh issue close <number> --repo simpleapps-com/<repo>          # Close issue
gh issue close <number> --repo simpleapps-com/<repo> --comment "message"  # Close with comment
```

### Closing via Commit

Include `Closes #N` in the commit message body to auto-close issues when pushed.

## Pull Requests

```bash
gh pr create --repo simpleapps-com/<repo> --title "title" --body "description"
gh pr list --repo simpleapps-com/<repo>
gh pr view <number> --repo simpleapps-com/<repo>
gh pr merge <number> --repo simpleapps-com/<repo>
```

## Pushing Code

Always use `gh auth setup-git` before pushing if HTTPS credentials may be expired:

```bash
gh auth setup-git && git push origin <branch>
```

For tags: `git push origin <tag>`

## Cross-Linking with Basecamp

When working on client tasks that originate in Basecamp, see the `simpleapps:workflow` skill for the full Basecamp-to-GitHub cross-linking process.
