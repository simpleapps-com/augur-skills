# Basecamp → GitHub Cross-Linking

When a client request in Basecamp needs development work, create a GitHub issue and cross-link them.

## Creating Issues from Basecamp Todos

Before creating an issue, gather context from Basecamp (see `basecamp.md` for full MCP tool reference):
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
