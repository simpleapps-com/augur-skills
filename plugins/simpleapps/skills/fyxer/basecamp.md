# Fyxer → Basecamp

Post Fyxer meeting recordings as searchable Discussions in Basecamp projects.

## Inputs

- **Fyxer recording URL**: `https://app.fyxer.com/call-recordings/<fyxer-id>`
- **Basecamp project ID**: Target project for the Discussion

## Process

### 1. Check for duplicate

Extract the `<fyxer-id>` UUID from the Fyxer recording URL. Call `search("<fyxer-id>")` to check if this meeting has already been posted to Basecamp. The frontmatter in posted messages contains the fyxer-id, so search will find it. If found, inform the user and stop.

### 2. Check local cache

If `~/.simpleapps/fyxer/<fyxer-id>/summary.txt` and `transcript.txt` both exist, skip to step 3 (build message). Otherwise, follow the Chrome extraction steps in `SKILL.md`.

### 3. Build message.txt

Parse `summary.txt` for frontmatter fields and combine with the full transcript from `transcript.txt`:

```
---
meeting: SA/ClientName
date: YYYY-MM-DD
time: HH:MM-HH:MM
participants: Person A, Person B, Person C
topics: Topic One, Topic Two, Topic Three
fyxer-id: <recording-uuid>
---

[contents of transcript.txt]
```

Frontmatter field sources:

| Field | Source |
|-------|--------|
| meeting | Meeting title from the page header |
| date | Recording date |
| time | Recording time range |
| participants | Participant list |
| topics | Section headings from the Summary |
| fyxer-id | UUID from the URL |

Save as `~/.simpleapps/fyxer/<fyxer-id>/message.txt`.

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

Search by date: `search("Fyxer YYYY-MM-DD")`
Search by keyword: `search("topic or participant name")`
Browse by project: `list_messages(project_id)`

## Dependencies

- Basecamp MCP (`create_message`, `search` tools) — see `simpleapps:workflow` skill (`basecamp.md`) for full MCP tool reference
