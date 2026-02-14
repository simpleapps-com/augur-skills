# Basecamp 2 Reference

IMPORTANT: YOU MUST NOT create, edit, or delete anything in Basecamp without user permission.

**Content format**: All write tools SHOULD use plain text with line breaks, NOT HTML. Basecamp returns HTML in responses but prefers plain text for creation.

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
| `create_project` | Create a new project (name, description) |
| `update_project` | Update project name/description |
| `archive_project` | Archive or unarchive a project (archive=False to reactivate) |
| `delete_project` | Delete a project permanently |

### People
| Tool | Description |
|------|-------------|
| `list_people` | List all people on the account |
| `get_person` | Get person details by person_id |
| `get_me` | Get the authenticated user's profile |
| `list_person_projects` | List projects accessible to a person |
| `delete_person` | Remove a person from the account (admin only) |

### Todos
| Tool | Description |
|------|-------------|
| `get_todo` | Get a single todo with comments and attachments (project_id, todo_id) |
| `list_todos` | List todos in a project. status: 'remaining', 'completed', or 'all' |
| `list_todos_due_since` | List todos due after a date (YYYY-MM-DD) |
| `list_my_todos` | List all open todos assigned to the current user (paginated) |
| `list_assigned_todos` | List open todos assigned to any person_id |
| `create_todo` | Create a todo in a todo list (project_id, todolist_id, content, assignee_id, due_date) |
| `update_todo` | Update a todo's content, due date, or assignee |
| `assign_todo` | Reassign a todo to a different person_id |
| `close_todo` | Mark a todo as completed/closed |
| `reopen_todo` | Reopen a completed todo |
| `delete_todo` | Delete a todo permanently |

### Comments
| Tool | Description |
|------|-------------|
| `create_comment` | Add a comment to a todo (plain text) |
| `delete_comment` | Delete a comment permanently |

### Todo Lists
| Tool | Description |
|------|-------------|
| `list_todolists` | List active todo lists in a project |
| `list_all_todolists` | List todo lists across all projects. status: 'active', 'completed', or 'trashed' |
| `get_todolist` | Get all todos in a specific todo list |
| `create_todolist` | Create a new todo list (project_id, name, description) |
| `update_todolist` | Update a todo list's name, description, or position |
| `delete_todolist` | Delete a todo list permanently |

### Messages
| Tool | Description |
|------|-------------|
| `list_messages` | List messages/discussions in a project (via topics) |
| `get_message` | Get a message with comments and attachments |
| `create_message` | Create a new discussion (project_id, subject, content) |
| `update_message` | Update a message's subject/content |
| `delete_message` | Delete a message permanently |

Note: Messages may not be available on all Basecamp plans.

### Documents
| Tool | Description |
|------|-------------|
| `list_documents` | List documents. project_id=0 for all projects |
| `get_document` | Get a single document (e.g., site-info) |
| `create_document` | Create a new document (title, content) |
| `update_document` | Update a document's title/content |
| `delete_document` | Delete a document permanently |

### Calendar Events
| Tool | Description |
|------|-------------|
| `list_calendars` | List all calendars |
| `list_calendar_events` | List events. Filter by project_id, start_date, end_date, past |
| `get_calendar_event` | Get a specific calendar event |
| `create_calendar_event` | Create an event (summary, starts_at, description, all_day, ends_at, remind_at) |
| `update_calendar_event` | Update an event's fields |
| `delete_calendar_event` | Delete a calendar event |

### Topics
| Tool | Description |
|------|-------------|
| `list_topics` | List topics. project_id=0 for all. archived=True for archived |
| `archive_topic` | Archive a topic |
| `activate_topic` | Reactivate an archived topic |

### Attachments & Uploads
| Tool | Description |
|------|-------------|
| `list_attachments` | List attachments. project_id=0 for all (paginated) |
| `get_attachment` | Get attachment metadata and download URL (project_id, attachment_id) |
| `download_attachment` | Download attachment to local file (project_id, attachment_id) |
| `get_upload` | Get an upload with comments |
| `create_upload` | Upload a local file to a project's Files section |
| `delete_upload` | Delete an upload (move to trash) |

### Activity
| Tool | Description |
|------|-------------|
| `list_events` | Activity log since a datetime. Filter by project_id or person_id |

### Access Management
| Tool | Description |
|------|-------------|
| `list_accesses` | List people with access to a project |
| `grant_access` | Grant team access (comma-separated ids and/or email_addresses) |
| `grant_client_access` | Grant client-level access (comma-separated ids and/or email_addresses) |
| `revoke_access` | Revoke a person's project access |

### Stars
| Tool | Description |
|------|-------------|
| `list_stars` | List starred/favorite projects |
| `star_project` | Star (bookmark) a project |
| `unstar_project` | Remove star from a project |

### Forwards
| Tool | Description |
|------|-------------|
| `list_forwards` | List email forwards. project_id=0 for all |
| `get_forward` | Get a specific email forward with comments |

### Search
| Tool | Description |
|------|-------------|
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
