---
name: fyxer
description: Fyxer AI meeting recording integration. Covers extraction, local caching, posting to Basecamp, and Fyxer Index management. Use when processing Fyxer recordings or meeting transcripts.
---

# Fyxer

Fyxer AI records and summarizes meetings. Use the `/fyxer` command to process recordings end-to-end.

## Key Conventions

- **Recording URL**: `https://app.fyxer.com/call-recordings/<meeting-uuid>:<calendar-event-id>`
- **Cache location**: `~/.simpleapps/fyxer/<meeting-uuid>/` — contains `summary.txt`, `transcript.txt`, `message.txt`
- **Use only the meeting UUID** (before the colon) for cache folders, duplicate checks, and frontmatter
- **Fyxer Index**: a `Fyxer Index` document in each Basecamp project for duplicate detection. One line per posted meeting, newest first: `<meeting-uuid> | <date> | <message-id> | <subject>`
- **Post format**: plain text with YAML frontmatter (meeting, date, time, participants, topics, fyxer-id) followed by the full transcript
- **Subject format**: `Fyxer: YYYY-MM-DD`

## Dependencies

- `simpleapps:basecamp` skill — MCP tools for posting and index management
- Chrome browser automation — for extraction when cache is empty

## Finding Posted Transcripts

- Check the index: `list_documents(project_id)` then find `Fyxer Index` then `get_document`
- View a specific transcript: `get_message(project_id, message_id)` using the message_id from the index
- Browse all messages: `list_messages(project_id)` — Fyxer posts use the title format `Fyxer: YYYY-MM-DD`
