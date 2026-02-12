# Basecamp 2 Reference

IMPORTANT: YOU MUST NOT create, edit, or delete anything in Basecamp — except reassigning todos via `assign_todo`.

## Setup

Credentials stored at `~/.simpleapps/basecamp.json`. If missing, ask the user to run:

```bash
uv run basecamp-auth
```

This opens the browser for OAuth, user clicks "Allow", credentials are saved automatically.

## MCP Tools (Preferred)

The `basecamp` MCP server is bundled with this plugin and starts automatically. API reference: https://github.com/basecamp/bcx-api

### Projects
| Tool | Description |
|------|-------------|
| `list_projects` | List projects. status: 'active', 'drafts', or 'archived' |
| `get_project` | Get project details by project_id |

### People
| Tool | Description |
|------|-------------|
| `list_people` | List all people on the account |
| `get_person` | Get person details by person_id |
| `get_me` | Get the authenticated user's profile |

### Todos
| Tool | Description |
|------|-------------|
| `get_todo` | Get a single todo with comments (project_id, todo_id) |
| `list_todos` | List todos in a project. status: 'remaining', 'completed', or 'all' |
| `list_todos_due_since` | List todos due after a date (YYYY-MM-DD) |
| `list_my_todos` | List all open todos assigned to the current user (paginated) |
| `list_assigned_todos` | List open todos assigned to any person_id |
| `assign_todo` | Reassign a todo to a different person_id |

### Todo Lists
| Tool | Description |
|------|-------------|
| `list_todolists` | List active todo lists in a project |
| `list_all_todolists` | List todo lists across all projects. status: 'active', 'completed', or 'trashed' |
| `get_todolist` | Get all todos in a specific todo list |

### Messages
| Tool | Description |
|------|-------------|
| `list_messages` | List messages in a project |
| `get_message` | Get a message with comments |

Note: Messages may not be available on all Basecamp plans.

### Documents
| Tool | Description |
|------|-------------|
| `list_documents` | List documents. project_id=0 for all projects |
| `get_document` | Get a single document (e.g., site-info) |

### Calendar Events
| Tool | Description |
|------|-------------|
| `list_calendars` | List all calendars |
| `list_calendar_events` | List events. Filter by project_id, start_date, end_date, past |
| `get_calendar_event` | Get a specific calendar event |

### Topics, Events, Attachments
| Tool | Description |
|------|-------------|
| `list_topics` | List topics. project_id=0 for all. archived=True for archived |
| `list_events` | Activity log since a datetime. Filter by project_id or person_id |
| `list_attachments` | List attachments. project_id=0 for all (paginated) |
| `get_upload` | Get an upload with comments |

### Other
| Tool | Description |
|------|-------------|
| `list_accesses` | List people with access to a project |
| `list_stars` | List starred/favorite projects |
| `list_forwards` | List email forwards. project_id=0 for all |
| `get_forward` | Get a specific email forward with comments |
| `search` | Search across all projects |

**Extracting IDs from Basecamp URLs**: A URL like `https://basecamp.com/2805226/projects/18932786/todos/514631271` gives you project_id=`18932786` and todo_id=`514631271`.

## Chrome Fallback

If the MCP server is unavailable (credentials expired, server not running), use Chrome:

1. Use `tabs_context_mcp` to get current tabs
2. Create a new tab or use an existing Basecamp tab
3. Navigate to the Basecamp page
4. Use `get_page_text` to extract content

**Base URL**: `https://basecamp.com/2805226`

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

## Site Info Documents

Each Basecamp project SHOULD have a **site-info** text document in its Documents section. It contains site-specific details like siteId and domain name needed for GitHub issues and development work. Use `list_documents` + `get_document` to find it. If no site-info document exists, ask the user to create one.

## Tips

- Cache the user's `person_id` on first visit for the session
- Start from `list_my_todos` for "what do I need to work on?"
- Use `list_people` to find person_id before calling `assign_todo`
- If you get a 401 or auth error, ask the user to re-run `basecamp-auth`
- If an endpoint returns 404, the feature may not be available on this Basecamp plan
