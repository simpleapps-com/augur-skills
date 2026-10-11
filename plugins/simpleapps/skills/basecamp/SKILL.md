---
name: basecamp
description: Basecamp 2 integration via the hosted MCP. Covers sign-in and Basecamp linking, JSON output, paging, attachments, URL parsing, Chrome fallback, and site-info documents. Use when reading or writing Basecamp data.
allowed-tools:
  - Read
  - Bash
  - mcp__plugin_simpleapps_basecamp__*
  - mcp__claude-in-chrome__*
---

# Basecamp 2

IMPORTANT: MUST NOT create, edit, or delete anything in Basecamp without user permission.

**Content format**: All write tools MUST use plain text with line breaks, NOT HTML. Basecamp returns HTML in responses but prefers plain text for creation.

## Sign-in

The plugin's `basecamp` server is the hosted SimpleApps Basecamp 2 MCP at `https://basecamp2.simpleapps.work/mcp`, for augur_info (SimpleApps) staff. On first use Claude Code runs the sign-in: the augur_info Super User account, then a one-time link to the person's own Basecamp account through 37signals Launchpad. Every tool then runs as that person, so comments, assignments, and closes show in Basecamp as them. No local credentials, tokens, or `.simpleapps/` file are involved.

- `basecamp_status`: shows the signed-in person and whether Basecamp is linked
- `unlink_basecamp`: removes the Basecamp link; the next call asks to link again

## MCP Tools

All tools are `mcp__plugin_simpleapps_basecamp__*`. The tool names and parameters are self-documenting via the MCP schema. MUST NOT hardcode tool signatures. Key tool groups: projects, people, todos, comments, todo lists, messages, documents, calendar events, topics, attachments/uploads, activity, access management, stars, forwards. Delete and access-grant tools MAY be absent (the server turns them off by default). API reference: https://github.com/basecamp/bcx-api

**No search endpoint.** To find content, browse: `list_topics(project_id)`, or `list_messages(project_id)` for messages. `list_topics()` with no project_id lists recent topics across all projects.

## Output

Every tool returns Basecamp 2's own JSON, unchanged. Parse it; MUST NOT expect markdown.

- `app_url` is the web link (use it in WIPs and replies); `url` is the API address
- `bucket` names the project on account-wide lists; `topicable` / `eventable` say what a topic or event is (`type`, `id`, `app_url`)
- `content` and comments are HTML
- Lists are `{items}`. Writes return the saved record. Calls Basecamp answers with no body return `{"ok":true,"action":…}`
- Errors are `{"error":{"status"|"code","message"}}`
- Results over ~40,000 characters carry a second note block suggesting the JSON be saved and queried. Write it to `tmp/` and query with a plain `jq` filter, one command per call

## Paging

`list_my_todos`, `list_assigned_todos`, `list_messages`, `list_topics`, `list_events`, `list_attachments`, `list_accesses`, and `list_projects(status="archived")` take an optional `page` (default 1, 50 records) and return `{items, page, more}`. `more: true` means call again with `page + 1`. Anything that needs "all" MUST loop until `more` is false; one call is not everything.

`list_my_todos` / `list_assigned_todos` also take `project_id`: that reads up to 20 pages and returns `{items, complete, pages}`. `complete: false` means the cap was hit.

Hosted additions: `count_my_todos` returns `{open, complete, pages}` in one call; `list_my_todo_index` returns a compact open-todo index grouped by list.

**Dates**: the server does no date logic. "Overdue" or "due this week" means comparing each todo's `due_at` / `due_on` with the user's own current date (`date +%Y-%m-%d`). `update_todo` takes `clear_due_date` to remove a due date.

## URL Parsing

A URL like `https://basecamp.com/2805226/projects/18932786/todos/514631271` gives you project_id=`18932786` and todo_id=`514631271`.

**Base URL**: `https://basecamp.com/2805226`

## Attachments

Attachments can be on todos, comments, messages, or uploads.

1. **Discover**: `get_todo` or `get_message`. Attachments appear in the record and in each comment, with their ids
2. **Inspect** (optional): `get_attachment(project_id, attachment_id)` for metadata, size, and content type
3. **Read**: `download_attachment(project_id, attachment_id)` returns the attachment record followed by the content in the tool result: text inline, images as image content (viewed directly), other files such as PDFs as an embedded resource. Up to 10 MB. Nothing is saved to disk. A linked document (e.g. Google Docs) returns an error naming its link

To browse all attachments in a project, page through `list_attachments(project_id)`.

**Uploading**: `create_upload` takes the file in the call: `project_id`, `file_name` (with extension), `file_base64`, optional `content` and `content_type`. There is no `file_path`.

## Site Info Documents

Each Basecamp project SHOULD have a **site-info** text document in its Documents section. It contains site-specific details like siteId and domain name needed for GitHub issues and development work. Use `list_documents` + `get_document` to find it. If no site-info document exists, ask the user to create one.

## Chrome Fallback

If the MCP server is unavailable (sign-in failing, server unreachable), use Chrome:

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

**Me** page (`/people/<person_id>`): open to-dos. When the list is long (roughly 45+ items), Basecamp truncates it and shows a "See all X open to-dos" link. If that link is present, YOU MUST click it to load the full list. The complete list is also at `/people/<person_id>/outstanding_todos`.

**JSON API via Chrome**: Navigate to `/api/v1/projects/<project_id>/todos/<todo_id>.json` then use `get_page_text`. WebFetch will NOT work; Chrome carries session cookies.

## Tips

- Cache the user's `person_id` on first visit for the session
- Start from `list_my_todos` (paging on `more`) or `count_my_todos` for "what do I need to work on?"
- Use `list_people` to find person_id before calling `assign_todo`
- On an auth error: run `basecamp_status`. If Basecamp is unlinked, the user re-links on the next call; otherwise ask them to sign in again via `/mcp` → `basecamp` → authenticate
- If an endpoint returns 404, the feature may not be available on this Basecamp plan
