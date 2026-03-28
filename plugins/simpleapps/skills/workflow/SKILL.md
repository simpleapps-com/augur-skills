---
name: workflow
description: How we track and deliver work. Covers the Basecamp-to-GitHub flow for client requests, task tracking, cross-linking, and issue templates. Use when working on client tasks, creating issues, or checking assignments.
allowed-tools:
  - Read
  - Glob
  - Grep
---

# Workflow

## How Work Flows

1. **Client request** arrives in Basecamp (todo, message, or comment)
2. **Read and summarize** the Basecamp todo to understand the request
3. **Create a GitHub issue** with technical details for implementation
4. **Cross-link** — Basecamp todo URL in the GitHub issue body, GitHub issue URL in Basecamp todo comments
5. **Do the work** in code, referencing the GitHub issue
6. **Report back** through Basecamp for the client; keep implementation details in GitHub

## Tool Boundaries

| Tool | Audience | Purpose |
|------|----------|---------|
| **Basecamp** | Client-facing | Task requests, status updates, client communication |
| **GitHub Issues** | Developer-facing | Technical details, implementation, internal findings |

Basecamp todos and GitHub issues SHOULD cross-link (many-to-many — one todo MAY relate to multiple issues and vice versa).

**Note**: GitHub access is granted on request. If the user does not have repo access, skip steps 3-5 above and use Basecamp only. Do not assume access — check with `gh` or ask the user.

## Tooling

Load `simpleapps:basecamp` for Basecamp MCP tools and Chrome fallback. Load `simpleapps:github` for `gh` CLI usage and org conventions.

## Creating Issues from Basecamp Todos

Before creating an issue, gather context from Basecamp (see `simpleapps:basecamp` skill for full MCP tool reference):
1. Use `get_todo` to read the Basecamp todo and summarize the client request
2. Use `list_documents` + `get_document` to find the project's **site-info** document for siteId and domain name. If no site-info document exists, ask the user to create one in Basecamp.

See the `simpleapps:github` skill for `gh` CLI usage and org conventions.

Issue template for Basecamp-linked issues:

```bash
gh issue create --repo simpleapps-com/<repo> \
  --title "<brief technical title>" \
  --body "## Basecamp
<basecamp_todo_url>

## Client
<client/project name> — <domain> (siteId: <siteId>)

## Summary
<technical summary of what needs to be done>

## Acceptance Criteria
- [ ] <criteria from the Basecamp request>"
```

## Cross-Linking

- Include the Basecamp todo URL in the GitHub issue body (under a `## Basecamp` heading)
- After creating the issue, provide the GitHub issue URL to the user so they can add it to the Basecamp todo comments

## Development Lifecycle

The full workflow from task to delivery, each step feeding the next:

```
/triage → /wip → /investigate → /discuss → /implement → /quality → /sanity-check → /verify → /submit → /deploy → /publish
```

| Phase | Command | What happens |
|-------|---------|-------------|
| Pick work | `/triage` | See open PRs and unlinked issues |
| Scaffold | `/wip` | Create a WIP file from Basecamp or GitHub issue |
| Research | `/investigate` | Explore codebase, update WIP with findings |
| Align | `/discuss` | Conversational alignment before acting |
| Build | `/implement` | Execute the plan — code changes only, no commits |
| Code checks | `/quality` | Lint, typecheck, test, package freshness |
| Solution audit | `/sanity-check` | Did we solve the right problem without commission/omission errors? |
| Browser checks | `/verify` | Walk through wiki's Testing.md checklist in Chrome |
| Submit | `/submit` | Commit and create a PR for review |
| Stage | `/deploy` | Deploy to staging (merge PRs, trigger staging build) |
| Release | `/publish` | Version bump, tag, release to production (with verification) |

Not every task uses all steps. Most daily work ends at `/submit`. `/deploy` and `/publish` are used less frequently — `/publish` is intentionally rare and requires explicit verification of the exact version going to production.

The three shipping commands (`/submit`, `/deploy`, `/publish`) read project-specific steps from `wiki/Deployment.md`. They refuse to operate if the Deployment page is missing — run `/curate-wiki` to generate it from the codebase.

Commands like `/research` and `/discuss` can be used at any stage. `/quality`, `/verify`, `/curate-wiki`, and `/wiki-audit` can run independently.

## References

- See `simpleapps:basecamp` skill for MCP tools, Chrome fallback, and Basecamp navigation
- See `simpleapps:github` skill for GitHub org conventions and `gh` CLI usage
- See `simpleapps:fyxer` skill for Fyxer meeting transcript processing and Basecamp posting
