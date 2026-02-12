# GitHub Issues Reference

## Creating Issues from Basecamp Todos

Before creating an issue, gather context:
1. Use `get_todo` (MCP) to read the Basecamp todo and summarize the client request
2. Use `list_documents` + `get_document` (MCP) to find the project's **site-info** document for siteId and domain name. If no site-info document exists, ask the user to create one in Basecamp.

Use `gh issue create` to create issues linked to Basecamp todos:

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

## Conventions

- YOU MUST ALWAYS ask the user which GitHub repo to create the issue in — it could be the client site repo, the augur repo, or any other repo in the org
- Issue title SHOULD be a technical description, not the client's words
- Reference the Basecamp todo as the source of the request
- Use labels to categorize (bug, feature, enhancement)
- Assign to the appropriate developer

## Useful Commands

```bash
gh issue list --repo simpleapps-com/<repo>           # List open issues
gh issue view <number> --repo simpleapps-com/<repo>  # View issue details
gh issue create --repo simpleapps-com/<repo>         # Create new issue
```
