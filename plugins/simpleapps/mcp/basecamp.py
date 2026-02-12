#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["mcp[cli]"]
# ///
"""
Basecamp 2 MCP Server — read access to Basecamp 2 (BCX API)
with write operations: reassigning todos, creating comments.

API reference: https://github.com/basecamp/bcx-api

Usage: uv run basecamp.py
Add to Claude Code: claude mcp add basecamp -- uv run /path/to/basecamp.py
"""

import json
import os
import re
import urllib.parse
import urllib.request

from mcp.server.fastmcp import FastMCP

CREDS_FILE = os.path.expanduser("~/.simpleapps/basecamp.json")

mcp = FastMCP("basecamp")


def _strip_html(text: str) -> str:
    """Remove HTML tags and normalize line breaks."""
    text = text.replace("<br>", "\n").replace("<br/>", "\n")
    return re.sub(r"<[^>]+>", "", text)


def load_creds() -> dict:
    if not os.path.exists(CREDS_FILE):
        raise RuntimeError(
            f"Credentials not found at {CREDS_FILE}. Run 'basecamp-auth' first."
        )
    with open(CREDS_FILE) as f:
        return json.load(f)


def _build_request(url: str, method: str = "GET", data: bytes | None = None) -> urllib.request.Request:
    creds = load_creds()
    token = creds["access_token"]
    req = urllib.request.Request(url, method=method, data=data)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("User-Agent", "SimpleApps Basecamp MCP (stuart@simpleapps.com)")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    return req


def _base_url() -> str:
    creds = load_creds()
    return f"https://basecamp.com/{creds['account_id']}/api/v1"


def api_get(path: str) -> dict | list:
    """Fetch a single page from the BCX API."""
    url = f"{_base_url()}{path}"
    req = _build_request(url)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise RuntimeError(
                "Unauthorized. Token may be expired. Run 'basecamp-auth' to refresh."
            )
        raise


def api_put(path: str, body: dict) -> dict:
    """Send a PUT request to the BCX API."""
    url = f"{_base_url()}{path}"
    data = json.dumps(body).encode()
    req = _build_request(url, method="PUT", data=data)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise RuntimeError(
                "Unauthorized. Token may be expired. Run 'basecamp-auth' to refresh."
            )
        raise


def api_post(path: str, body: dict) -> dict:
    """Send a POST request to the BCX API."""
    url = f"{_base_url()}{path}"
    data = json.dumps(body).encode()
    req = _build_request(url, method="POST", data=data)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise RuntimeError(
                "Unauthorized. Token may be expired. Run 'basecamp-auth' to refresh."
            )
        raise


def api_get_all(path: str) -> list:
    """Fetch all pages from a paginated BCX API endpoint. Returns combined list."""
    results = []
    page = 1
    while True:
        sep = "&" if "?" in path else "?"
        data = api_get(f"{path}{sep}page={page}")
        if not data:
            break
        results.extend(data)
        page += 1
    return results


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

@mcp.tool()
def list_projects(status: str = "active") -> str:
    """List Basecamp 2 projects. status: 'active' (default), 'drafts', or 'archived'."""
    if status == "drafts":
        projects = api_get("/projects/drafts.json")
    elif status == "archived":
        projects = api_get_all("/projects/archived.json")
    else:
        projects = api_get("/projects.json")
    lines = []
    for p in projects:
        lines.append(f"- **{p['name']}** (id: {p['id']}) — {p.get('description', '')}")
    return "\n".join(lines) if lines else f"No {status} projects found."


@mcp.tool()
def get_project(project_id: int) -> str:
    """Get details for a specific project."""
    p = api_get(f"/projects/{project_id}.json")
    return json.dumps(p, indent=2)


# ---------------------------------------------------------------------------
# People
# ---------------------------------------------------------------------------

@mcp.tool()
def list_people() -> str:
    """List all people on the Basecamp account."""
    people = api_get("/people.json")
    lines = []
    for p in people:
        email = p.get("email_address", "")
        lines.append(f"- **{p['name']}** (id: {p['id']}) — {email}")
    return "\n".join(lines) if lines else "No people found."


@mcp.tool()
def get_person(person_id: int) -> str:
    """Get details for a specific person. Use 'me' trick: call get_me instead."""
    p = api_get(f"/people/{person_id}.json")
    return json.dumps(p, indent=2)


@mcp.tool()
def get_me() -> str:
    """Get the authenticated user's profile and assignment counts."""
    me = api_get("/people/me.json")
    assigned = me.get("assigned_todos", {})
    return (
        f"**{me['name']}** (id: {me['id']})\n"
        f"- Email: {me.get('email_address', '')}\n"
        f"- Assigned todos: {assigned.get('count', 0)}\n"
        f"- Admin: {me.get('admin', False)}"
    )


# ---------------------------------------------------------------------------
# Todos
# ---------------------------------------------------------------------------

@mcp.tool()
def get_todo(project_id: int, todo_id: int) -> str:
    """Get a single todo with comments and attachments."""
    todo = api_get(f"/projects/{project_id}/todos/{todo_id}.json")

    lines = [
        f"# {todo['content']}",
        "",
        f"- **Status**: {'Completed' if todo['completed'] else 'Open'}",
        f"- **Assigned to**: {todo.get('assignee', {}).get('name', 'Unassigned')}",
        f"- **Created by**: {todo.get('creator', {}).get('name', 'Unknown')}",
        f"- **Created**: {todo['created_at']}",
        f"- **Due**: {todo.get('due_on') or 'No due date'}",
        f"- **Comments**: {todo['comments_count']}",
        "",
    ]

    if todo.get("comments"):
        lines.append("## Comments")
        for c in todo["comments"]:
            content = _strip_html(c.get("content", ""))
            lines.append(f"\n**{c['creator']['name']}** ({c['created_at'][:10]}):")
            lines.append(content)

    return "\n".join(lines)


@mcp.tool()
def list_todos(project_id: int, status: str = "remaining") -> str:
    """List todos in a project. status: 'remaining' (default), 'completed', or 'all'."""
    if status == "completed":
        todos = api_get(f"/projects/{project_id}/todos/completed.json")
    elif status == "all":
        todos = api_get(f"/projects/{project_id}/todos.json")
    else:
        todos = api_get(f"/projects/{project_id}/todos/remaining.json")
    lines = []
    for t in todos:
        assignee = t.get("assignee", {}).get("name", "Unassigned")
        due = f" (due: {t['due_on']})" if t.get("due_on") else ""
        check = "[x]" if t.get("completed") else "[ ]"
        lines.append(f"- {check} {t['content']} — {assignee}{due} (id: {t['id']})")
    return "\n".join(lines) if lines else f"No {status} todos found."


@mcp.tool()
def list_todos_due_since(project_id: int, due_since: str) -> str:
    """List todos due after a date. due_since format: YYYY-MM-DD."""
    todos = api_get(f"/projects/{project_id}/todos.json?due_since={due_since}")
    lines = []
    for t in todos:
        assignee = t.get("assignee", {}).get("name", "Unassigned")
        due = f" (due: {t['due_on']})" if t.get("due_on") else ""
        check = "[x]" if t.get("completed") else "[ ]"
        lines.append(f"- {check} {t['content']} — {assignee}{due} (id: {t['id']})")
    return "\n".join(lines) if lines else "No todos found."


@mcp.tool()
def assign_todo(project_id: int, todo_id: int, person_id: int) -> str:
    """Reassign a todo to a different person. Requires person_id (use list_people to find)."""
    result = api_put(
        f"/projects/{project_id}/todos/{todo_id}.json",
        {"assignee": {"id": person_id, "type": "Person"}},
    )
    assignee = result.get("assignee", {}).get("name", "Unknown")
    return f"Todo '{result['content']}' reassigned to **{assignee}**."


@mcp.tool()
def create_comment(project_id: int, todo_id: int, content: str) -> str:
    """Add a comment to a todo. Content supports simple HTML (links, bold, etc.)."""
    result = api_post(
        f"/projects/{project_id}/todos/{todo_id}/comments.json",
        {"content": content},
    )
    author = result.get("creator", {}).get("name", "Unknown")
    return f"Comment added by **{author}** on {result.get('created_at', '')[:10]}."


@mcp.tool()
def list_my_todos() -> str:
    """List all open todos assigned to the authenticated user across all projects."""
    me = api_get("/people/me.json")
    person_id = me["id"]

    assigned = me.get("assigned_todos", {})
    if assigned.get("count", 0) == 0:
        return "No open todos assigned to you."

    todos = api_get_all(f"/people/{person_id}/assigned_todos.json")

    if not todos:
        return "No open todos assigned to you."

    lines = []
    open_count = 0
    for group in todos:
        open_todos = [t for t in group.get("assigned_todos", []) if not t.get("completed")]
        if not open_todos:
            continue
        project_name = group.get("bucket", {}).get("name", "Unknown Project")
        todolist_name = group.get("name", "")
        lines.append(f"\n### {project_name} — {todolist_name}")
        for todo in open_todos:
            due = f" (due: {todo['due_on']})" if todo.get("due_on") else ""
            comments = f" [{todo['comments_count']} comments]" if todo.get("comments_count") else ""
            lines.append(f"- [ ] {todo['content']}{due}{comments} (id: {todo['id']})")
            open_count += 1

    if not lines:
        return "No open todos assigned to you."

    return f"**{open_count} open todos** for {me.get('name', 'you')}\n" + "\n".join(lines)


@mcp.tool()
def list_assigned_todos(person_id: int, due_since: str = "") -> str:
    """List todo lists with todos assigned to a specific person. Optional due_since (YYYY-MM-DD)."""
    path = f"/people/{person_id}/assigned_todos.json"
    if due_since:
        path += f"?due_since={due_since}"
    todos = api_get_all(path)
    if not todos:
        return "No assigned todos found."

    lines = []
    count = 0
    for group in todos:
        open_todos = [t for t in group.get("assigned_todos", []) if not t.get("completed")]
        if not open_todos:
            continue
        project_name = group.get("bucket", {}).get("name", "Unknown Project")
        todolist_name = group.get("name", "")
        lines.append(f"\n### {project_name} — {todolist_name}")
        for todo in open_todos:
            due = f" (due: {todo['due_on']})" if todo.get("due_on") else ""
            lines.append(f"- [ ] {todo['content']}{due} (id: {todo['id']})")
            count += 1

    return f"**{count} open todos**\n" + "\n".join(lines) if lines else "No open assigned todos."


# ---------------------------------------------------------------------------
# Todo Lists
# ---------------------------------------------------------------------------

@mcp.tool()
def list_todolists(project_id: int) -> str:
    """List active todo lists in a project."""
    todolists = api_get(f"/projects/{project_id}/todolists.json")
    lines = []
    for tl in todolists:
        remaining = tl.get("remaining_count", 0)
        completed = tl.get("completed_count", 0)
        lines.append(f"- **{tl['name']}** (id: {tl['id']}) — {remaining} remaining, {completed} completed")
    return "\n".join(lines) if lines else "No todo lists found."


@mcp.tool()
def list_all_todolists(status: str = "active") -> str:
    """List todo lists across all projects. status: 'active' (default), 'completed', or 'trashed'."""
    if status == "completed":
        todolists = api_get("/todolists/completed.json")
    elif status == "trashed":
        todolists = api_get("/todolists/trashed.json")
    else:
        todolists = api_get("/todolists.json")
    lines = []
    for tl in todolists:
        bucket = tl.get("bucket", {}).get("name", "Unknown Project")
        remaining = tl.get("remaining_count", 0)
        lines.append(f"- **{tl['name']}** ({bucket}) (id: {tl['id']}) — {remaining} remaining")
    return "\n".join(lines) if lines else f"No {status} todo lists found."


@mcp.tool()
def get_todolist(project_id: int, todolist_id: int) -> str:
    """Get all todos in a specific todo list."""
    tl = api_get(f"/projects/{project_id}/todolists/{todolist_id}.json")

    lines = [f"# {tl['name']}", ""]

    remaining = tl.get("todos", {}).get("remaining", [])
    if remaining:
        lines.append("## Open")
        for todo in remaining:
            assignee = todo.get("assignee", {}).get("name", "Unassigned")
            due = f" (due: {todo['due_on']})" if todo.get("due_on") else ""
            lines.append(f"- [ ] {todo['content']} — {assignee}{due} (id: {todo['id']})")

    completed = tl.get("todos", {}).get("completed", [])
    if completed:
        lines.append("\n## Completed")
        for todo in completed:
            lines.append(f"- [x] {todo['content']}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

@mcp.tool()
def list_messages(project_id: int) -> str:
    """List messages in a project."""
    messages = api_get(f"/projects/{project_id}/messages.json")
    lines = []
    for m in messages:
        author = m.get("creator", {}).get("name", "Unknown")
        lines.append(f"- **{m['subject']}** (id: {m['id']}) — by {author}, {m['created_at'][:10]}")
    return "\n".join(lines) if lines else "No messages found."


@mcp.tool()
def get_message(project_id: int, message_id: int) -> str:
    """Get a message with its comments."""
    m = api_get(f"/projects/{project_id}/messages/{message_id}.json")
    content = _strip_html(m.get("content", ""))
    lines = [
        f"# {m['subject']}",
        "",
        f"**{m.get('creator', {}).get('name', 'Unknown')}** ({m['created_at'][:10]})",
        "",
        content,
    ]

    if m.get("comments"):
        lines.append("\n## Comments")
        for c in m["comments"]:
            c_content = _strip_html(c.get("content", ""))
            lines.append(f"\n**{c['creator']['name']}** ({c['created_at'][:10]}):")
            lines.append(c_content)

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

@mcp.tool()
def list_documents(project_id: int = 0) -> str:
    """List text documents. If project_id=0, lists across all projects."""
    if project_id:
        docs = api_get(f"/projects/{project_id}/documents.json")
    else:
        docs = api_get("/documents.json")
    lines = []
    for d in docs:
        lines.append(f"- **{d['title']}** (id: {d['id']}) — updated {d['updated_at'][:10]}")
    return "\n".join(lines) if lines else "No documents found."


@mcp.tool()
def get_document(project_id: int, document_id: int) -> str:
    """Get a single text document (e.g., site-info)."""
    doc = api_get(f"/projects/{project_id}/documents/{document_id}.json")
    content = _strip_html(doc.get("content", ""))
    return f"# {doc['title']}\n\n{content}"


# ---------------------------------------------------------------------------
# Calendar Events
# ---------------------------------------------------------------------------

@mcp.tool()
def list_calendars() -> str:
    """List all calendars."""
    cals = api_get("/calendars.json")
    lines = []
    for c in cals:
        lines.append(f"- **{c['name']}** (id: {c['id']})")
    return "\n".join(lines) if lines else "No calendars found."


@mcp.tool()
def list_calendar_events(project_id: int = 0, start_date: str = "", end_date: str = "", past: bool = False) -> str:
    """List calendar events. project_id=0 for all projects. Dates: YYYY-MM-DD. past=True for past events."""
    if project_id:
        base = f"/projects/{project_id}/calendar_events"
    else:
        base = "/calendar_events"

    if past:
        path = f"{base}/past.json"
    else:
        path = f"{base}.json"

    params = []
    if start_date:
        params.append(f"start_date={start_date}")
    if end_date:
        params.append(f"end_date={end_date}")
    if params:
        path += "?" + "&".join(params)

    events = api_get(path)
    lines = []
    for e in events:
        starts = e.get("starts_at", "")[:10]
        lines.append(f"- **{e['summary']}** (id: {e['id']}) — {starts}")
    return "\n".join(lines) if lines else "No calendar events found."


@mcp.tool()
def get_calendar_event(project_id: int, event_id: int) -> str:
    """Get a specific calendar event."""
    e = api_get(f"/projects/{project_id}/calendar_events/{event_id}.json")
    return json.dumps(e, indent=2)


# ---------------------------------------------------------------------------
# Topics
# ---------------------------------------------------------------------------

@mcp.tool()
def list_topics(project_id: int = 0, archived: bool = False) -> str:
    """List topics. project_id=0 for all projects. archived=True for archived."""
    if project_id:
        base = f"/projects/{project_id}/topics"
    else:
        base = "/topics"
    path = f"{base}/archived.json" if archived else f"{base}.json"

    topics = api_get(path)
    lines = []
    for t in topics:
        title = t.get("title", t.get("excerpt", "Untitled"))
        lines.append(f"- **{title}** ({t.get('topicable', {}).get('type', '')}) — updated {t.get('updated_at', '')[:10]}")
    return "\n".join(lines) if lines else "No topics found."


# ---------------------------------------------------------------------------
# Attachments & Uploads
# ---------------------------------------------------------------------------

@mcp.tool()
def list_attachments(project_id: int = 0) -> str:
    """List attachments. project_id=0 for all projects. Paginated."""
    if project_id:
        attachments = api_get_all(f"/projects/{project_id}/attachments.json")
    else:
        attachments = api_get_all("/attachments.json")
    lines = []
    for a in attachments:
        name = a.get("name", "Untitled")
        size = a.get("byte_size", 0)
        lines.append(f"- **{name}** (id: {a['id']}) — {size} bytes, {a.get('created_at', '')[:10]}")
    return "\n".join(lines) if lines else "No attachments found."


@mcp.tool()
def get_upload(project_id: int, upload_id: int) -> str:
    """Get an upload with comments and attachments."""
    u = api_get(f"/projects/{project_id}/uploads/{upload_id}.json")
    content = _strip_html(u.get("content", ""))
    lines = [
        f"# {u.get('name', 'Upload')}",
        "",
        f"- **Size**: {u.get('byte_size', 0)} bytes",
        f"- **Created by**: {u.get('creator', {}).get('name', 'Unknown')}",
        f"- **Created**: {u.get('created_at', '')[:10]}",
    ]
    if content:
        lines.extend(["", content])
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Events (Activity Log)
# ---------------------------------------------------------------------------

@mcp.tool()
def list_events(since: str, project_id: int = 0, person_id: int = 0) -> str:
    """List activity events since a datetime. since format: YYYY-MM-DDTHH:MM:SS+00:00. Filter by project_id or person_id."""
    encoded_since = urllib.parse.quote(since)
    if person_id:
        path = f"/people/{person_id}/events.json?since={encoded_since}"
    elif project_id:
        path = f"/projects/{project_id}/events.json?since={encoded_since}"
    else:
        path = f"/events.json?since={encoded_since}"

    events = api_get(path)
    lines = []
    for e in events:
        actor = e.get("creator", {}).get("name", "Unknown")
        action = e.get("action", "")
        summary = e.get("summary", e.get("excerpt", ""))
        lines.append(f"- **{actor}** {action}: {summary} ({e.get('created_at', '')[:10]})")
    return "\n".join(lines) if lines else "No events found."


# ---------------------------------------------------------------------------
# Accesses
# ---------------------------------------------------------------------------

@mcp.tool()
def list_accesses(project_id: int) -> str:
    """List all people with access to a project."""
    people = api_get_all(f"/projects/{project_id}/accesses.json")
    lines = []
    for p in people:
        email = p.get("email_address", "")
        lines.append(f"- **{p['name']}** (id: {p['id']}) — {email}")
    return "\n".join(lines) if lines else "No accesses found."


# ---------------------------------------------------------------------------
# Stars
# ---------------------------------------------------------------------------

@mcp.tool()
def list_stars() -> str:
    """List all starred (favorite) projects."""
    stars = api_get("/stars.json")
    lines = []
    for s in stars:
        lines.append(f"- Project id: {s.get('id', '')} — starred {s.get('created_at', '')[:10]}")
    return "\n".join(lines) if lines else "No starred projects."


# ---------------------------------------------------------------------------
# Forwards
# ---------------------------------------------------------------------------

@mcp.tool()
def list_forwards(project_id: int = 0) -> str:
    """List email forwards. project_id=0 for all projects."""
    if project_id:
        forwards = api_get(f"/projects/{project_id}/forwards.json")
    else:
        forwards = api_get("/forwards.json")
    lines = []
    for f in forwards:
        subject = f.get("subject", "No subject")
        lines.append(f"- **{subject}** (id: {f['id']}) — from {f.get('from', '')}, {f.get('created_at', '')[:10]}")
    return "\n".join(lines) if lines else "No forwards found."


@mcp.tool()
def get_forward(project_id: int, forward_id: int) -> str:
    """Get a specific email forward with comments."""
    fw = api_get(f"/projects/{project_id}/forwards/{forward_id}.json")
    content = _strip_html(fw.get("content", ""))
    lines = [
        f"# {fw.get('subject', 'Forward')}",
        "",
        f"- **From**: {fw.get('from', '')}",
        f"- **Created**: {fw.get('created_at', '')[:10]}",
        "",
        content,
    ]
    if fw.get("comments"):
        lines.append("\n## Comments")
        for c in fw["comments"]:
            c_content = _strip_html(c.get("content", ""))
            lines.append(f"\n**{c['creator']['name']}** ({c['created_at'][:10]}):")
            lines.append(c_content)
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

@mcp.tool()
def search(query: str) -> str:
    """Search across all Basecamp 2 projects."""
    encoded_query = urllib.parse.quote(query)
    results = api_get(f"/search.json?query={encoded_query}")

    if not results:
        return f"No results for '{query}'."

    lines = []
    for r in results:
        lines.append(f"- **{r.get('title', r.get('content', 'Untitled'))}** ({r['type']}) — {r.get('url', '')}")

    return "\n".join(lines)


if __name__ == "__main__":
    mcp.run()
