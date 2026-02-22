---
name: github
description: GitHub conventions for SimpleApps. Covers org structure, local project layout, wiki-as-docs workflow, issue creation, PR workflows, and gh CLI usage. Use when creating issues, PRs, setting up repos, or working with GitHub wikis.
---

# GitHub

## Organization

All SimpleApps repos live under the **`simpleapps-com`** GitHub org.

Repository pattern: `simpleapps-com/<repo-name>`

## Authentication

Use the `gh` CLI for all GitHub operations:

```bash
gh auth status          # Check auth status
gh auth setup-git       # Configure gh as git credential helper
```

If `git push` fails with 401/403, run `gh auth setup-git` to fix credentials.

## Key Topics

- **Wiki as context** — See `wiki-as-context.md` for why the wiki is the source of truth and how to write for both humans and AI agents.
- **Project structure** — See `project-structure.md` for the `{project}/[repo|wiki]` layout, what goes where, and wiki conventions.
- **Issues & pull requests** — See `issues-prs.md` for issue templates, PR commands, and cross-linking with Basecamp.

## Quick Reference

```bash
# Pushing
gh auth setup-git && git push origin <branch>
git push origin <tag>

# Issues
gh issue create --repo simpleapps-com/<repo> --title "type: desc" --body "..."
gh issue list --repo simpleapps-com/<repo>

# PRs
gh pr create --repo simpleapps-com/<repo> --title "title" --body "..."
gh pr list --repo simpleapps-com/<repo>
```
