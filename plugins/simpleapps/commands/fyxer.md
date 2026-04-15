---
name: fyxer
description: Process a Fyxer meeting recording. Extract, cache locally, and post to Basecamp.
argument-hint: "<fyxer-url> <basecamp-project-id>"
allowed-tools: Bash(pbpaste:*), Bash(wc:*), Bash(rm:*), Bash(mv:*), Bash(cp:*), Bash(ls:*), Bash(mkdir:*), Skill(fyxer), Skill(basecamp), Skill(bash-simplicity), Read, Write, Glob, mcp__plugin_simpleapps_basecamp__*, mcp__claude-in-chrome__*
---

First, use Skill("fyxer") to load Fyxer conventions, then Skill("basecamp") for MCP tools, then Skill("bash-simplicity") for Bash conventions.

Process a Fyxer meeting recording and post it to Basecamp as a searchable Discussion.

**Inputs**: `$ARGUMENTS` should contain a Fyxer recording URL and optionally a Basecamp project ID.

## 1. Parse the Fyxer URL

Recording page: `https://app.fyxer.com/call-recordings/<meeting-uuid>:<calendar-event-id>`

Extract the **meeting UUID** (before the colon). Use only the UUID for cache folders, duplicate checks, and frontmatter.

## 2. Check for duplicate

If a Basecamp project ID was provided:
1. Find the **Fyxer Index** document: `list_documents(project_id)` then scan for title `Fyxer Index`
2. If found, `get_document(project_id, document_id)` and search content for the meeting UUID
3. If found, the meeting has already been posted. Inform the user and stop.

If no Fyxer Index document exists, there are no tracked meetings. Proceed.

## 3. Check local cache

Cache location: `~/.simpleapps/fyxer/<meeting-uuid>/`

If both `summary.txt` and `transcript.txt` exist, skip to step 5. Otherwise, extract from Chrome.

## 4. Chrome extraction

### Extract transcript

Click the **Transcript** tab. Methods (in order of preference):

1. **"Download transcript" button** (BEST): Downloads a `.txt` file to `~/Downloads/`. Complete content, no truncation. Copy to cache dir, then delete the download.
2. **"Copy transcript" button** + `pbpaste`: Write to disk. Reliable but requires clipboard access.
3. **`get_page_text`**: UNRELIABLE. Only captures visible/partial content. DO NOT USE for transcripts.

Save to `~/.simpleapps/fyxer/<meeting-uuid>/transcript.txt`.

### Extract summary

The Summary tab is the default view. Methods:

1. **"Copy summary" button** + `pbpaste` (BEST): Summaries are short (~1,700 chars).
2. **`get_page_text`**: Works for short summaries but mixes in page chrome. Not recommended.

Save to `~/.simpleapps/fyxer/<meeting-uuid>/summary.txt`.

### Extract participants

Click the **participant count dropdown** in the page header to reveal attendee names and emails. Take a screenshot to read them.

### Clipboard verification

```javascript
(async () => {
  const text = await navigator.clipboard.readText();
  window.__temp = text;
  return JSON.stringify({
    length: text.length,
    first50: text.substring(0, 50),
    last100: text.substring(text.length - 100)
  });
})()
```

Then write and verify: `pbpaste > target.txt`

**Note**: Do NOT try to read full clipboard content via JS. Chrome MCP truncates JS output at ~1,000 characters. Always use `pbpaste` to write to disk.

MUST clean up `~/Downloads/` after copying downloaded files to the cache directory.

## 5. Build message.txt

Parse `summary.txt` for frontmatter fields, extract participants, and combine with the full transcript:

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

| Field | Source |
|-------|--------|
| meeting | Meeting title from the page header |
| date | Recording date |
| time | Recording time range |
| participants | Participant dropdown |
| topics | Section headings from the Summary |
| fyxer-id | Meeting UUID from the URL |

Save as `~/.simpleapps/fyxer/<meeting-uuid>/message.txt`.

## 6. Post to Basecamp

If no Basecamp project ID was provided, ask the user which project to post to.

Use `create_message(project_id, subject, content)`:
- **Subject**: `Fyxer: YYYY-MM-DD`
- **Content**: contents of `message.txt`

Capture the **message_id** from the response.

## 7. Update Fyxer Index

1. If no Fyxer Index document exists, create one: `create_document(project_id, "Fyxer Index", "")`
2. Read current content: `get_document(project_id, document_id)`
3. Prepend a new line (newest first): `<meeting-uuid> | <date> | <message-id> | <subject>`
4. Update: `update_document(project_id, document_id, title="Fyxer Index", content=updated_content)`

If the index update fails after a successful post, warn the user.

## 8. Report

Show:
- Meeting UUID and date
- Basecamp message created (project + message_id)
- Fyxer Index updated (or warning if update failed)
- Cache location
