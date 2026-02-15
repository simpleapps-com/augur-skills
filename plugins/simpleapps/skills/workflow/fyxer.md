# Fyxer Meeting Transcripts to Basecamp

Post Fyxer meeting recordings as searchable Discussions in Basecamp projects.

## Inputs

- **Fyxer recording URL**: `https://app.fyxer.com/call-recordings/<uuid>`
- **Basecamp project ID**: Target project for the Discussion

## Process

### 1. Extract meeting metadata (Chrome — Fyxer Summary tab)

Navigate to the Fyxer recording URL. The Summary tab is the default view. Extract:

| Field | Source |
|-------|--------|
| meeting | Meeting title from the page header |
| date | Recording date |
| time | Recording time range (HH:MM-HH:MM) |
| participants | Participant list |
| topics | Section headings from the Summary |
| fyxer-id | UUID from the URL |

### 2. Extract full transcript (Chrome — Fyxer Transcript tab)

Click the **Transcript** tab. The transcript is speaker-attributed and timestamped.

Extraction options (in order of preference):
1. **"Copy transcript" button** — click it, then read from clipboard via `get_page_text`
2. **"Download transcript" button** — downloads a text file
3. **Scrape the page** — use `get_page_text` on the Transcript tab as a fallback

### 3. Post to Basecamp

Use `create_message(project_id, subject, content)`:

**Subject**: `Fyxer: YYYY-MM-DD`

**Content** (plain text):
```
---
meeting: SA/ClientName
date: YYYY-MM-DD
time: HH:MM-HH:MM
participants: Person A, Person B, Person C
topics: Topic One, Topic Two, Topic Three
fyxer-id: <recording-uuid>
---

[full transcript from Fyxer Transcript tab]
```

## Format Rules

- **Plain text only** — Basecamp prefers plain text over HTML
- **YAML frontmatter** — machine-parseable so other Claude Code instances can search and parse meeting context
- **Transcript only in body** — summary and action items belong on relevant Basecamp todos, not in this message
- **Consistent title** — `Fyxer: YYYY-MM-DD` keeps messages uniform and sortable

## Finding Posted Transcripts

Use `search("Fyxer YYYY-MM-DD")` or `list_messages(project_id)` to find posted transcripts. The frontmatter topics and full transcript text make every meeting findable by keyword.

## Dependencies

- Basecamp MCP (`create_message` tool)
- Chrome browser automation (Fyxer has no API — must scrape via browser)
