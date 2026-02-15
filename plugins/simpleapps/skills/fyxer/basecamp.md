# Fyxer → Basecamp

Post Fyxer meeting recordings as searchable Discussions in Basecamp projects.

## Inputs

- **Fyxer recording URL**: `https://app.fyxer.com/call-recordings/<meeting-uuid>:<calendar-event-id>`
- **Basecamp project ID**: Target project for the Discussion

## Process

### 1. Check for duplicate

Extract the meeting UUID from the Fyxer URL (the part before the colon). Call `list_messages(project_id)` and scan titles for a matching `Fyxer: YYYY-MM-DD` entry. If found, call `get_message` to check if its frontmatter contains the same `fyxer-id`. If it matches, inform the user and stop.

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

## Format Rules

- **Plain text only** — Basecamp prefers plain text over HTML
- **YAML frontmatter** — machine-parseable so other Claude Code instances can search and parse meeting context
- **Transcript only in body** — summary and action items belong on relevant Basecamp todos, not in this message
- **Consistent title** — `Fyxer: YYYY-MM-DD` keeps messages uniform and sortable

## Finding Posted Transcripts

Browse by project: `list_messages(project_id)` — Fyxer posts use the title format `Fyxer: YYYY-MM-DD`
View a specific transcript: `get_message(project_id, message_id)`

## Dependencies

- Basecamp MCP (`create_message`, `list_messages`, `get_message` tools) — see `simpleapps:workflow` skill (`basecamp.md`) for full MCP tool reference
