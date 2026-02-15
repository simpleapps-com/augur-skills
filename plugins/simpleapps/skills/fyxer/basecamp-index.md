# Fyxer Index — Basecamp Document

Each Basecamp project that receives Fyxer meeting transcripts MUST have a **Fyxer Index** document. This document serves as a fast lookup for duplicate detection and meeting history, accessible to all team members.

## Document Format

- **Title**: `Fyxer Index`
- **Location**: Documents section of each Basecamp project
- **Content**: One line per posted meeting, newest first

Each line follows this format:

```
<meeting-uuid> | <date> | <message-id> | <subject>
```

Example:

```
52f0cf2b-fdb8-4e95-8b01-2afb6d367c69 | 2026-01-19 | 514789012 | Fyxer: 2026-01-19
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | 2026-02-10 | 514801234 | Fyxer: 2026-02-10
d9e8f7a6-b5c4-3210-fedc-ba0987654321 | 2026-02-15 | 514823456 | Fyxer: 2026-02-15
```

Fields:

| Field | Source |
|-------|--------|
| meeting-uuid | UUID from Fyxer URL (before the colon) |
| date | Meeting date (YYYY-MM-DD) |
| message-id | Basecamp message ID returned by `create_message` |
| subject | Message subject as posted (e.g., `Fyxer: 2026-02-15`) |

## Finding the Index

```
list_documents(project_id)
```

Scan for a document titled `Fyxer Index`. Use `get_document(project_id, document_id)` to read its contents.

## Creating the Index

If no `Fyxer Index` document exists in the project, create one before posting the first meeting:

```
create_document(project_id, "Fyxer Index", "")
```

This creates an empty document. The first meeting entry will be appended after posting.

## Updating the Index

After successfully posting a meeting transcript via `create_message`, append a new line to the index:

1. Read the current index: `get_document(project_id, document_id)`
2. Append the new entry to the content (newest first — add to the top)
3. Update: `update_document(project_id, document_id, title="Fyxer Index", content=updated_content)`

The `create_message` response includes the message ID needed for the index entry.

## Duplicate Check

Before posting a meeting transcript, check the index:

1. Find the Fyxer Index document: `list_documents(project_id)` → scan for `Fyxer Index`
2. Read it: `get_document(project_id, document_id)`
3. Search the content for the meeting UUID
4. If found → the meeting has already been posted. Inform the user and stop.
5. If not found → safe to proceed with posting.

If no Fyxer Index document exists, there are no posted meetings in this project. Proceed with posting and create the index.

## Reconciliation — Missing Entries

The index MAY fall out of sync if a meeting was posted without updating the index (e.g., manual posting, index creation after existing meetings). To reconcile:

1. List all messages: `list_messages(project_id)`
2. Filter for messages with `Fyxer:` in the title
3. For each Fyxer message, call `get_message(project_id, message_id)` and extract the `fyxer-id` from the YAML frontmatter
4. Compare against the index — add any missing entries
5. Update the index document with the complete list

Run reconciliation when:
- The Fyxer Index document is first created in a project that already has Fyxer messages
- The user suspects the index is incomplete
- A duplicate check finds nothing but the user believes a meeting was already posted

## Reconciliation — Orphaned Entries

If an index entry references a message that no longer exists (deleted in Basecamp):

1. Attempt `get_message(project_id, message_id)` for the entry
2. If 404 → the message was deleted. Remove the entry from the index.
3. Update the index document

Only run orphan cleanup when explicitly requested by the user. Do not automatically delete index entries.

## Updated Posting Process

The full Fyxer → Basecamp posting process (see `basecamp.md`) now includes index management:

1. **Check index** — find Fyxer Index doc, read it, search for meeting UUID
2. **Check local cache** — if summary.txt and transcript.txt exist, skip extraction
3. **Extract from Chrome** — if cache is missing (see `SKILL.md`)
4. **Build message.txt** — frontmatter + transcript
5. **Post to Basecamp** — `create_message` → capture message_id from response
6. **Update index** — append new entry to Fyxer Index document (create doc if needed)

Step 6 is new. If the index update fails after a successful post, warn the user — the message is posted but the index is stale. The user can run reconciliation later to fix it.
