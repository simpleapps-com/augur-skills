---
name: workflow
description: How we track and deliver work. Covers the Basecamp-to-GitHub flow for client requests, task tracking, and cross-linking. Use when working on client tasks, creating issues, or checking assignments.
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

The `basecamp` MCP server (bundled with this plugin) provides direct API access to Basecamp 2. Use MCP tools (`get_todo`, `list_my_todos`, `list_documents`, etc.) as the primary method. Chrome browser automation is the fallback if MCP is unavailable.

**First-time setup**: User MUST run `uv run basecamp-auth` once to authorize. Credentials are saved to `~/.simpleapps/basecamp.json`.

## References

- See `basecamp.md` for MCP tools, Chrome fallback, and Basecamp navigation
- See `github.md` for GitHub issue creation and cross-linking
- See `simpleapps:fyxer` skill for Fyxer meeting transcript processing and Basecamp posting
