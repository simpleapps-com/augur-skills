---
name: basecamp
description: Basecamp 2 integration via MCP. Covers MCP tool reference, URL parsing, authentication, Chrome fallback, attachments, and site-info documents. Use when reading or writing Basecamp data.
allowed-tools:
  - Read
  - Glob
  - Grep
  - mcp__plugin_simpleapps_basecamp__*
  - mcp__claude-in-chrome__*
---

# Basecamp 2

IMPORTANT: MUST NOT create, edit, or delete anything in Basecamp without user permission.

**Content format**: All write tools MUST use plain text with line breaks, NOT HTML. Basecamp returns HTML in responses but prefers plain text for creation.

## Setup

Credentials stored at `~/.simpleapps/basecamp.json`. If missing, ask the user to run:

```bash
uv run basecamp-auth
```

This opens the browser for OAuth, user clicks "Allow", credentials are saved automatically.

## MCP Tools

The `basecamp` MCP server is bundled with this plugin and starts automatically. API reference: https://github.com/basecamp/bcx-api

All tools are available as `mcp__plugin_simpleapps_basecamp__*`. The tool names and parameters are self-documenting via the MCP schema — do not hardcode tool signatures. Key tool groups: projects, people, todos, comments, todo lists, messages, documents, calendar events, topics, attachments/uploads, activity, access management, stars, forwards.

**Note**: The BCX API does not have a search endpoint. To find content, use `list_topics(project_id)` to browse, or `list_messages(project_id)` for messages. For cross-project browsing, use `list_topics()` (no project_id) to get recent topics across all projects.

## URL Parsing

A URL like `https://basecamp.com/2805226/projects/18932786/todos/514631271` gives you project_id=`18932786` and todo_id=`514631271`.

**Base URL**: `https://basecamp.com/2805226`

## Downloading Attachments

Attachments can be on todos, comments, messages, or uploads. To retrieve them:

1. **Discover**: Call `get_todo` or `get_message` — attachments appear with IDs in both the top-level section and within individual comments
2. **Inspect** (optional): Call `get_attachment(project_id, attachment_id)` to see metadata, size, content type, and download URL
3. **Download**: Call `download_attachment(project_id, attachment_id)` — saves to `~/.simpleapps/downloads/{project_id}/`
4. **Read**: Use the `Read` tool on the local file path to view content (works for images, PDFs, Excel, text)

To browse all attachments in a project, use `list_attachments(project_id)`.

## Site Info Documents

Each Basecamp project SHOULD have a **site-info** text document in its Documents section. It contains site-specific details like siteId and domain name needed for GitHub issues and development work. Use `list_documents` + `get_document` to find it. If no site-info document exists, ask the user to create one.

## Chrome Fallback

If the MCP server is unavailable (credentials expired, server not running), use Chrome:

1. Use `tabs_context_mcp` to get current tabs
2. Create a new tab or use an existing Basecamp tab
3. Navigate to the Basecamp page
4. Use `get_page_text` to extract content

**Top nav**: Projects | Calendar | Everything | Progress | Everyone | **Me**

| Page | Path |
|------|------|
| Dashboard | `/` |
| All projects | `/projects` |
| My assignments | click "Me" in top nav |
| Project overview | `/projects/<project_id>` |
| Todo lists | `/projects/<project_id>/todolists` |
| Documents | `/projects/<project_id>/documents` |

**Me** page (`/people/<person_id>`) — open to-dos (~45+ shows a "See all X open to-dos" link, YOU MUST click it). The full list is at `/people/<person_id>/outstanding_todos`.

**JSON API via Chrome**: Navigate to `/api/v1/projects/<project_id>/todos/<todo_id>.json` then use `get_page_text`. WebFetch will NOT work — Chrome carries session cookies.

## Tips

- Cache the user's `person_id` on first visit for the session
- Start from `list_my_todos` for "what do I need to work on?"
- Use `list_people` to find person_id before calling `assign_todo`
- If you get a 401 or auth error, ask the user to re-run `basecamp-auth`
- If an endpoint returns 404, the feature may not be available on this Basecamp plan
