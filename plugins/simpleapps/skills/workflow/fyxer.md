# Fyxer Meeting Transcripts to Basecamp

Post Fyxer meeting recordings as searchable Discussions in Basecamp projects.

## Inputs

- **Fyxer recording URL**: `https://app.fyxer.com/call-recordings/<fyxer-id>`
- **Basecamp project ID**: Target project for the Discussion

## Local Cache

Extracted data is cached at `~/.simpleapps/fyxer/<fyxer-id>/`:

```
summary.txt     - raw Fyxer summary (from Summary tab)
transcript.txt  - raw Fyxer transcript (from Transcript tab)
message.txt     - assembled frontmatter + transcript, ready to post
```

## Process

### 1. Check for duplicate

Extract the `<fyxer-id>` UUID from the Fyxer recording URL. Call `search("<fyxer-id>")` to check if this meeting has already been posted to Basecamp. The frontmatter in posted messages contains the fyxer-id, so search will find it. If found, inform the user and stop.

### 2. Check local cache

If `~/.simpleapps/fyxer/<fyxer-id>/summary.txt` and `transcript.txt` both exist, skip to step 5 (build message). Chrome is only needed when local files are missing.

### 3. Extract summary (Chrome — Fyxer Summary tab)

Only if `summary.txt` does not exist.

Navigate to the Fyxer recording URL. The Summary tab is the default view. Extract the full summary text using `get_page_text` and save to `summary.txt`.

### 4. Extract transcript (Chrome — Fyxer Transcript tab)

Only if `transcript.txt` does not exist.

Click the **Transcript** tab. The transcript is speaker-attributed and timestamped.

Extraction options (in order of preference):
1. **"Copy transcript" button** — copies to clipboard, then paste into `transcript.txt`
2. **"Download transcript" button** — saves a text file directly
3. **`get_page_text`** — scrape the Transcript tab as a fallback

Save the result to `transcript.txt`.

### 5. Build message.txt

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

Save as `message.txt`.

### 6. Post to Basecamp

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

- Basecamp MCP (`create_message`, `search` tools)
- Chrome browser automation (only needed when local cache is empty)
