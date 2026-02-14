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
import urllib.error
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


def api_delete(path: str) -> None:
    """Send a DELETE request to the BCX API. Returns None (204 No Content)."""
    url = f"{_base_url()}{path}"
    req = _build_request(url, method="DELETE")
    try:
        with urllib.request.urlopen(req) as resp:
            pass  # 204 No Content
    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise RuntimeError(
                "Unauthorized. Token may be expired. Run 'basecamp-auth' to refresh."
            )
        raise


def api_post_no_body(path: str, body: dict | None = None) -> None:
    """Send a POST request expecting 204 No Content (e.g., accesses, stars)."""
    url = f"{_base_url()}{path}"
    data = json.dumps(body).encode() if body else None
    req = _build_request(url, method="POST", data=data)
    try:
        with urllib.request.urlopen(req) as resp:
            pass
    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise RuntimeError(
                "Unauthorized. Token may be expired. Run 'basecamp-auth' to refresh."
            )
        raise


def api_upload(file_path: str) -> str:
    """Upload a file to Basecamp. Returns the attachment token for use in create_upload."""
    url = f"{_base_url()}/attachments.json"
    with open(file_path, "rb") as f:
        data = f.read()
    req = _build_request(url, method="POST", data=data)
    req.remove_header("Content-type")
    req.add_header("Content-Type", "application/octet-stream")
    req.add_header("Content-Length", str(len(data)))
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            return result["token"]
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


DOWNLOADS_DIR = os.path.expanduser("~/.simpleapps/downloads")


def _format_bytes(n: int) -> str:
    """Human-readable byte size."""
    if n < 1024:
        return f"{n} B"
    elif n < 1024 * 1024:
        return f"{n / 1024:.1f} KB"
    return f"{n / (1024 * 1024):.1f} MB"


def _format_attachment(a: dict, include_id: bool = False) -> str:
    """Format a single attachment as a markdown line item."""
    name = a.get("name", "Untitled")
    size = a.get("byte_size", 0)
    content_type = a.get("content_type", "unknown")
    url = a.get("url", a.get("link_url", ""))
    id_str = f" (id: {a['id']})" if include_id and "id" in a else ""
    linked = " [linked]" if a.get("link_url") and not a.get("url") else ""
    return f"- **{name}**{id_str} ({_format_bytes(size)}, {content_type}){linked} — {url}"


class _NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Suppress automatic redirects so we can strip auth on cross-domain hops."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _download_url(url: str, dest_path: str) -> int:
    """Download a file from a URL with auth headers. Returns bytes written.

    Basecamp asset URLs redirect (302) to a signed S3 URL that rejects
    the Bearer token, so we intercept the redirect and fetch without auth.
    """
    opener = urllib.request.build_opener(_NoRedirectHandler)
    req = _build_request(url)
    try:
        resp = opener.open(req)
    except urllib.error.HTTPError as e:
        if e.code in (301, 302, 303, 307, 308):
            location = e.headers.get("Location", "")
            if not location:
                raise
            # Follow redirect without auth headers
            req2 = urllib.request.Request(location)
            req2.add_header(
                "User-Agent",
                "SimpleApps Basecamp MCP (stuart@simpleapps.com)",
            )
            resp = urllib.request.urlopen(req2)
        else:
            raise

    with resp:
        with open(dest_path, "wb") as f:
            total = 0
            while True:
                chunk = resp.read(8192)
                if not chunk:
                    break
                f.write(chunk)
                total += len(chunk)
    return total


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


@mcp.tool()
def create_project(name: str, description: str = "") -> str:
    """Create a new project."""
    result = api_post("/projects.json", {"name": name, "description": description})
    return f"Project created: **{name}** (id: {result['id']})"


@mcp.tool()
def update_project(project_id: int, name: str = "", description: str = "") -> str:
    """Update a project's name and/or description."""
    body: dict = {}
    if name:
        body["name"] = name
    if description:
        body["description"] = description
    result = api_put(f"/projects/{project_id}.json", body)
    return f"Project updated: **{result.get('name', '')}** (id: {project_id})"


@mcp.tool()
def archive_project(project_id: int, archive: bool = True) -> str:
    """Archive or unarchive a project. archive=False to reactivate."""
    result = api_put(f"/projects/{project_id}.json", {"archived": archive})
    status = "archived" if archive else "activated"
    return f"Project **{result.get('name', '')}** {status}."


@mcp.tool()
def delete_project(project_id: int) -> str:
    """Delete a project permanently."""
    api_delete(f"/projects/{project_id}.json")
    return f"Project {project_id} deleted."


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


@mcp.tool()
def list_person_projects(person_id: int) -> str:
    """List projects accessible to a specific person."""
    projects = api_get(f"/people/{person_id}/projects.json")
    lines = []
    for p in projects:
        lines.append(f"- **{p['name']}** (id: {p['id']})")
    return "\n".join(lines) if lines else "No projects found."


@mcp.tool()
def delete_person(person_id: int) -> str:
    """Remove a person from the Basecamp account. Admin only."""
    api_delete(f"/people/{person_id}.json")
    return f"Person {person_id} removed from account."


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

    if todo.get("attachments"):
        lines.append("## Attachments")
        for a in todo["attachments"]:
            lines.append(_format_attachment(a, include_id=True))
        lines.append("")

    if todo.get("comments"):
        lines.append("## Comments")
        for c in todo["comments"]:
            content = _strip_html(c.get("content", ""))
            lines.append(f"\n**{c['creator']['name']}** ({c['created_at'][:10]}):")
            lines.append(content)
            if c.get("attachments"):
                lines.append("")
                lines.append("**Attachments:**")
                for a in c["attachments"]:
                    lines.append(_format_attachment(a, include_id=True))

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
def close_todo(project_id: int, todo_id: int) -> str:
    """Mark a todo as completed/closed."""
    result = api_put(
        f"/projects/{project_id}/todos/{todo_id}.json",
        {"completed": True},
    )
    return f"Todo '{result['content']}' marked as **completed**."


@mcp.tool()
def reopen_todo(project_id: int, todo_id: int) -> str:
    """Reopen a completed todo."""
    result = api_put(
        f"/projects/{project_id}/todos/{todo_id}.json",
        {"completed": False},
    )
    return f"Todo '{result['content']}' marked as **open**."


@mcp.tool()
def create_todo(
    project_id: int,
    todolist_id: int,
    content: str,
    assignee_id: int = 0,
    due_date: str = "",
) -> str:
    """Create a new todo in a todo list. Use plain text for content.

    assignee_id: Person to assign (use list_people to find). 0 = unassigned.
    due_date: Optional due date (YYYY-MM-DD).
    """
    body: dict = {"content": content}
    if assignee_id:
        body["assignee"] = {"id": assignee_id, "type": "Person"}
    if due_date:
        body["due_at"] = due_date
    result = api_post(
        f"/projects/{project_id}/todolists/{todolist_id}/todos.json",
        body,
    )
    todo_id = result.get("id", "")
    assignee = result.get("assignee", {}).get("name", "Unassigned")
    return f"Todo created: **{content}** (id: {todo_id}) — assigned to {assignee}"


@mcp.tool()
def create_comment(project_id: int, todo_id: int, content: str) -> str:
    """Add a comment to a todo. Use plain text with line breaks for content."""
    result = api_post(
        f"/projects/{project_id}/todos/{todo_id}/comments.json",
        {"content": content},
    )
    author = result.get("creator", {}).get("name", "Unknown")
    return f"Comment added by **{author}** on {result.get('created_at', '')[:10]}."


@mcp.tool()
def update_todo(
    project_id: int,
    todo_id: int,
    content: str = "",
    due_date: str = "",
    assignee_id: int = 0,
) -> str:
    """Update a todo's content, due date, or assignee. Only provided fields are changed."""
    body: dict = {}
    if content:
        body["content"] = content
    if due_date:
        body["due_at"] = due_date
    if assignee_id:
        body["assignee"] = {"id": assignee_id, "type": "Person"}
    result = api_put(f"/projects/{project_id}/todos/{todo_id}.json", body)
    return f"Todo updated: **{result['content']}** (id: {todo_id})"


@mcp.tool()
def delete_todo(project_id: int, todo_id: int) -> str:
    """Delete a todo permanently."""
    api_delete(f"/projects/{project_id}/todos/{todo_id}.json")
    return f"Todo {todo_id} deleted."


@mcp.tool()
def delete_comment(project_id: int, comment_id: int) -> str:
    """Delete a comment permanently."""
    api_delete(f"/projects/{project_id}/comments/{comment_id}.json")
    return f"Comment {comment_id} deleted."


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


@mcp.tool()
def create_todolist(project_id: int, name: str, description: str = "") -> str:
    """Create a new todo list in a project. Use plain text for description."""
    result = api_post(
        f"/projects/{project_id}/todolists.json",
        {"name": name, "description": description},
    )
    tl_id = result.get("id", "")
    return f"Todo list created: **{name}** (id: {tl_id})"


@mcp.tool()
def update_todolist(
    project_id: int, todolist_id: int, name: str = "", description: str = "", position: int = 0
) -> str:
    """Update a todo list's name, description, or position."""
    body: dict = {}
    if name:
        body["name"] = name
    if description:
        body["description"] = description
    if position:
        body["position"] = position
    result = api_put(f"/projects/{project_id}/todolists/{todolist_id}.json", body)
    return f"Todo list updated: **{result.get('name', '')}** (id: {todolist_id})"


@mcp.tool()
def delete_todolist(project_id: int, todolist_id: int) -> str:
    """Delete a todo list permanently."""
    api_delete(f"/projects/{project_id}/todolists/{todolist_id}.json")
    return f"Todo list {todolist_id} deleted."


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

@mcp.tool()
def list_messages(project_id: int) -> str:
    """List messages (discussions) in a project. Filters the topics endpoint for Message types."""
    topics = api_get_all(f"/projects/{project_id}/topics.json")
    lines = []
    for t in topics:
        topicable = t.get("topicable", {})
        if topicable.get("type") != "Message":
            continue
        author = t.get("creator", {}).get("name", "Unknown")
        lines.append(
            f"- **{t['title']}** (id: {topicable.get('id', '')}) — by {author}, {t.get('created_at', '')[:10]}"
        )
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

    if m.get("attachments"):
        lines.append("\n## Attachments")
        for a in m["attachments"]:
            lines.append(_format_attachment(a, include_id=True))

    if m.get("comments"):
        lines.append("\n## Comments")
        for c in m["comments"]:
            c_content = _strip_html(c.get("content", ""))
            lines.append(f"\n**{c['creator']['name']}** ({c['created_at'][:10]}):")
            lines.append(c_content)
            if c.get("attachments"):
                lines.append("")
                lines.append("**Attachments:**")
                for a in c["attachments"]:
                    lines.append(_format_attachment(a, include_id=True))

    return "\n".join(lines)


@mcp.tool()
def create_message(project_id: int, subject: str, content: str) -> str:
    """Create a new discussion (message) in a project. Use plain text with line breaks for content."""
    result = api_post(
        f"/projects/{project_id}/messages.json",
        {"subject": subject, "content": content},
    )
    msg_id = result.get("id", "")
    app_url = result.get("app_url", "")
    return f"Message created: **{subject}** (id: {msg_id})\n- URL: {app_url}"


@mcp.tool()
def update_message(project_id: int, message_id: int, subject: str = "", content: str = "") -> str:
    """Update a message's subject and/or content."""
    body: dict = {}
    if subject:
        body["subject"] = subject
    if content:
        body["content"] = content
    result = api_put(f"/projects/{project_id}/messages/{message_id}.json", body)
    return f"Message updated: **{result.get('subject', '')}** (id: {message_id})"


@mcp.tool()
def delete_message(project_id: int, message_id: int) -> str:
    """Delete a message permanently."""
    api_delete(f"/projects/{project_id}/messages/{message_id}.json")
    return f"Message {message_id} deleted."


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


@mcp.tool()
def create_document(project_id: int, title: str, content: str) -> str:
    """Create a new text document in a project. Use plain text for content."""
    result = api_post(
        f"/projects/{project_id}/documents.json",
        {"title": title, "content": content},
    )
    return f"Document created: **{title}** (id: {result['id']})"


@mcp.tool()
def update_document(project_id: int, document_id: int, title: str = "", content: str = "") -> str:
    """Update a document's title and/or content."""
    body: dict = {}
    if title:
        body["title"] = title
    if content:
        body["content"] = content
    result = api_put(f"/projects/{project_id}/documents/{document_id}.json", body)
    return f"Document updated: **{result.get('title', '')}** (id: {document_id})"


@mcp.tool()
def delete_document(project_id: int, document_id: int) -> str:
    """Delete a document permanently."""
    api_delete(f"/projects/{project_id}/documents/{document_id}.json")
    return f"Document {document_id} deleted."


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


@mcp.tool()
def create_calendar_event(
    project_id: int,
    summary: str,
    starts_at: str,
    description: str = "",
    all_day: bool = False,
    ends_at: str = "",
    remind_at: str = "",
) -> str:
    """Create a calendar event in a project.

    starts_at: ISO 8601 datetime or YYYY-MM-DD for all-day events.
    ends_at: Optional end date/time for multi-day or timed events.
    remind_at: Optional ISO 8601 datetime for email reminder.
    """
    body: dict = {"summary": summary, "starts_at": starts_at}
    if description:
        body["description"] = description
    if all_day:
        body["all_day"] = True
    if ends_at:
        body["ends_at"] = ends_at
    if remind_at:
        body["remind_at"] = remind_at
    result = api_post(f"/projects/{project_id}/calendar_events.json", body)
    return f"Event created: **{summary}** (id: {result['id']})"


@mcp.tool()
def update_calendar_event(
    project_id: int,
    event_id: int,
    summary: str = "",
    description: str = "",
    starts_at: str = "",
    ends_at: str = "",
    all_day: bool = False,
) -> str:
    """Update a calendar event. Only provided fields are changed."""
    body: dict = {}
    if summary:
        body["summary"] = summary
    if description:
        body["description"] = description
    if starts_at:
        body["starts_at"] = starts_at
    if ends_at:
        body["ends_at"] = ends_at
    if all_day:
        body["all_day"] = True
    result = api_put(f"/projects/{project_id}/calendar_events/{event_id}.json", body)
    return f"Event updated: **{result.get('summary', '')}** (id: {event_id})"


@mcp.tool()
def delete_calendar_event(project_id: int, event_id: int) -> str:
    """Delete a calendar event."""
    api_delete(f"/projects/{project_id}/calendar_events/{event_id}.json")
    return f"Calendar event {event_id} deleted."


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


@mcp.tool()
def archive_topic(project_id: int, topic_id: int) -> str:
    """Archive a topic."""
    api_put(f"/projects/{project_id}/topics/{topic_id}/archive.json", {})
    return f"Topic {topic_id} archived."


@mcp.tool()
def activate_topic(project_id: int, topic_id: int) -> str:
    """Reactivate an archived topic."""
    api_put(f"/projects/{project_id}/topics/{topic_id}/activate.json", {})
    return f"Topic {topic_id} activated."


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
        lines.append(_format_attachment(a, include_id=True))
    return "\n".join(lines) if lines else "No attachments found."


@mcp.tool()
def get_attachment(project_id: int, attachment_id: int) -> str:
    """Get attachment metadata including download URL. Use download_attachment to save to disk."""
    a = api_get(f"/projects/{project_id}/attachments/{attachment_id}.json")
    name = a.get("name", "Untitled")
    content_type = a.get("content_type", "unknown")
    creator = a.get("creator", {}).get("name", "Unknown")

    lines = [
        f"# {name}",
        "",
        f"- **ID**: {a['id']}",
        f"- **Size**: {_format_bytes(a.get('byte_size', 0))}",
        f"- **Content-Type**: {content_type}",
        f"- **Created by**: {creator}",
        f"- **Created**: {a.get('created_at', '')[:10]}",
    ]

    url = a.get("url", "")
    link_url = a.get("link_url", "")
    if url:
        lines.append(f"- **Download URL**: {url}")
    if link_url:
        lines.append(f"- **Link URL**: {link_url} (linked document, not downloadable)")

    attachable = a.get("attachable", {})
    if attachable:
        lines.append(f"- **Attached to**: {attachable.get('type', 'Unknown')} (id: {attachable.get('id', '')})")

    return "\n".join(lines)


@mcp.tool()
def download_attachment(
    project_id: int,
    attachment_id: int,
    dest_dir: str = "",
    filename: str = "",
) -> str:
    """Download an attachment to a local file. Returns the file path.

    dest_dir: Directory to save to (default: ~/.simpleapps/downloads).
    filename: Override the filename (default: use original name from Basecamp).
    """
    a = api_get(f"/projects/{project_id}/attachments/{attachment_id}.json")

    url = a.get("url", "")
    if not url:
        link_url = a.get("link_url", "")
        if link_url:
            return f"Cannot download linked attachment '{a.get('name', '')}'. It links to: {link_url}"
        return f"No download URL found for attachment {attachment_id}."

    save_dir = dest_dir or os.path.join(DOWNLOADS_DIR, str(project_id))
    os.makedirs(save_dir, mode=0o755, exist_ok=True)

    save_name = filename or a.get("name", f"attachment_{attachment_id}")
    dest_path = os.path.join(save_dir, save_name)

    if os.path.exists(dest_path):
        base, ext = os.path.splitext(save_name)
        counter = 1
        while os.path.exists(dest_path):
            dest_path = os.path.join(save_dir, f"{base}_{counter}{ext}")
            counter += 1

    try:
        bytes_written = _download_url(url, dest_path)
    except urllib.error.HTTPError as e:
        if e.code == 401:
            return "Unauthorized. Token may be expired. Run 'basecamp-auth' to refresh."
        return f"Download failed: HTTP {e.code} — {e.reason}"

    return (
        f"Downloaded **{a.get('name', save_name)}** to `{dest_path}`\n"
        f"- Size: {_format_bytes(bytes_written)}\n"
        f"- Content-Type: {a.get('content_type', 'unknown')}"
    )


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


@mcp.tool()
def create_upload(project_id: int, file_path: str, content: str = "") -> str:
    """Upload a file to a project's Files section.

    file_path: Local path to the file to upload.
    content: Optional description text (plain text).
    """
    if not os.path.exists(file_path):
        return f"File not found: {file_path}"
    filename = os.path.basename(file_path)
    token = api_upload(file_path)
    body: dict = {"attachments": [{"token": token, "name": filename}]}
    if content:
        body["content"] = content
    result = api_post(f"/projects/{project_id}/uploads.json", body)
    return f"Uploaded **{filename}** (id: {result.get('id', '')})"


@mcp.tool()
def delete_upload(project_id: int, upload_id: int) -> str:
    """Delete an upload (move to trash)."""
    api_delete(f"/projects/{project_id}/uploads/{upload_id}.json")
    return f"Upload {upload_id} deleted."


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


@mcp.tool()
def grant_access(project_id: int, ids: str = "", email_addresses: str = "") -> str:
    """Grant team access to a project.

    ids: Comma-separated person IDs (e.g., "5,6,10").
    email_addresses: Comma-separated emails for new invitations.
    """
    body: dict = {}
    if ids:
        body["ids"] = [int(i.strip()) for i in ids.split(",")]
    if email_addresses:
        body["email_addresses"] = [e.strip() for e in email_addresses.split(",")]
    api_post_no_body(f"/projects/{project_id}/accesses.json", body)
    return f"Access granted to project {project_id}."


@mcp.tool()
def grant_client_access(project_id: int, ids: str = "", email_addresses: str = "") -> str:
    """Grant client-level access to a project.

    ids: Comma-separated person IDs.
    email_addresses: Comma-separated emails for new invitations.
    """
    body: dict = {}
    if ids:
        body["ids"] = [int(i.strip()) for i in ids.split(",")]
    if email_addresses:
        body["email_addresses"] = [e.strip() for e in email_addresses.split(",")]
    api_post_no_body(f"/projects/{project_id}/accesses/clients.json", body)
    return f"Client access granted to project {project_id}."


@mcp.tool()
def revoke_access(project_id: int, person_id: int) -> str:
    """Revoke a person's access to a project."""
    api_delete(f"/projects/{project_id}/accesses/{person_id}.json")
    return f"Access revoked for person {person_id} on project {project_id}."


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


@mcp.tool()
def star_project(project_id: int) -> str:
    """Star (bookmark) a project."""
    api_post_no_body(f"/projects/{project_id}/star.json")
    return f"Project {project_id} starred."


@mcp.tool()
def unstar_project(project_id: int) -> str:
    """Remove star from a project."""
    api_delete(f"/projects/{project_id}/star.json")
    return f"Project {project_id} unstarred."


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
            if c.get("attachments"):
                lines.append("")
                lines.append("**Attachments:**")
                for a in c["attachments"]:
                    lines.append(_format_attachment(a, include_id=True))
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
