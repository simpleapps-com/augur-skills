# Fyxer → Basecamp

Post Fyxer meeting recordings as searchable Discussions in Basecamp projects.

## Inputs

- **Fyxer recording URL**: `https://app.fyxer.com/call-recordings/<meeting-uuid>:<calendar-event-id>`
- **Basecamp project ID**: Target project for the Discussion

## Process

### 1. Check for duplicate

Extract the meeting UUID from the Fyxer URL (the part before the colon).

Find the **Fyxer Index** document in the project: `list_documents(project_id)` → scan for title `Fyxer Index`. If found, `get_document(project_id, document_id)` and search the content for the meeting UUID. If the UUID appears, the meeting has already been posted — inform the user and stop.

If no Fyxer Index document exists, there are no tracked meetings in this project. Proceed with posting.

See `basecamp-index.md` for full index format and reconciliation.

### 2. Check local cache

If `~/.simpleapps/fyxer/<meeting-uuid>/summary.txt` and `transcript.txt` both exist, skip to step 3. Otherwise, follow the Chrome extraction steps in `SKILL.md`.

### 3. Build message.txt

Parse `summary.txt` for frontmatter fields, extract participants (see `SKILL.md` participant extraction), and combine with the full transcript from `transcript.txt`:

```
---
meeting: SA/ClientName
date: YYYY-MM-DD
time: HH:MM-HH:MM
participants: Person A, Person B, Person C
topics: Topic One, Topic Two, Topic Three
fyxer-id: <meeting-uuid>
---

[contents of transcript.txt]
```

Frontmatter field sources:

| Field | Source |
|-------|--------|
| meeting | Meeting title from the page header |
| date | Recording date |
| time | Recording time range |
| participants | Participant dropdown (click to reveal names) |
| topics | Section headings from the Summary |
| fyxer-id | Meeting UUID from the URL (before the colon) |

Save as `~/.simpleapps/fyxer/<meeting-uuid>/message.txt`.

### 4. Post to Basecamp

Use `create_message(project_id, subject, content)`:

- **Subject**: `Fyxer: YYYY-MM-DD`
- **Content**: contents of `message.txt`

Capture the **message_id** from the response.

### 5. Update Fyxer Index

After a successful post, update the Fyxer Index document:

1. If no Fyxer Index document exists, create one: `create_document(project_id, "Fyxer Index", "")`
2. Read current content: `get_document(project_id, document_id)`
3. Prepend a new line (newest first): `<meeting-uuid> | <date> | <message-id> | <subject>`
4. Update: `update_document(project_id, document_id, title="Fyxer Index", content=updated_content)`

If the index update fails after a successful post, warn the user. The message is posted but the index is stale. Run reconciliation later (see `basecamp-index.md`).

## Format Rules

- **Plain text only** — Basecamp prefers plain text over HTML
- **YAML frontmatter** — machine-parseable so other Claude Code instances can search and parse meeting context
- **Transcript only in body** — summary and action items belong on relevant Basecamp todos, not in this message
- **Consistent title** — `Fyxer: YYYY-MM-DD` keeps messages uniform and sortable

## Finding Posted Transcripts

Check the index: `list_documents(project_id)` → find `Fyxer Index` → `get_document`
View a specific transcript: `get_message(project_id, message_id)` using the message_id from the index
Browse all messages: `list_messages(project_id)` — Fyxer posts use the title format `Fyxer: YYYY-MM-DD`

## Dependencies

- Basecamp MCP (`create_message`, `create_document`, `update_document`, `list_documents`, `get_document` tools) — see `simpleapps:workflow` skill (`basecamp.md`) for full MCP tool reference
