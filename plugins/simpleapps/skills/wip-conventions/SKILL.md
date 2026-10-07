---
name: wip-conventions
description: WIP file conventions. Frontmatter schema, status lifecycle, retention, promotion to wiki, and daily processing rules. Use when creating, updating, or retiring files in wip/.
---

# WIP

WIP files (`wip/*.md`) hold active task context: the issue or request, investigation notes, the plan, implementation decisions, and post-ship notes. They are gitignored and local to each project. This skill defines the format and lifecycle so tools and agents treat them consistently.

## Frontmatter schema

Every WIP file MUST start with YAML frontmatter. The `/wip` command writes it on scaffold; other commands update it as the work progresses.

```yaml
---
issue: https://github.com/simpleapps-com/<repo>/issues/<N>
branch: <type>/<N>-<slug>
status: open
created: 2026-04-22
last_reviewed: 2026-04-22
shipped_at:
pr:
disposition:
wiki_candidates:
---
```

Fields:

| Field | Values | Written by | Notes |
|-------|--------|------------|-------|
| `issue` | URL or empty | `/wip` | GitHub URL, Basecamp URL, or empty for freeform WIPs |
| `branch` | string | `/wip`, `/implement` | Feature branch the work lands on |
| `status` | `open` \| `in-progress` \| `shipped` \| `abandoned` | lifecycle commands | See state machine below |
| `created` | ISO date | `/wip` | Never changes |
| `last_reviewed` | ISO date | every lifecycle command | Used to detect stale WIPs |
| `shipped_at` | ISO date or empty | `/submit` (after CI green) | Set exactly once, when status flips to `shipped` |
| `pr` | URL or SHA | `/submit` | PR URL if one exists, otherwise the commit SHA |
| `disposition` | `keep` \| `promote` \| `delete` or empty | `/process-wips` or user | Empty means "not yet decided" |
| `wiki_candidates` | comma-separated wiki page names | `/process-wips` (draft) or user | Optional; only meaningful when `disposition: promote` |

At scaffold time `/wip` writes `issue`, `branch`, `status: open`, `created`, and `last_reviewed`; it leaves `shipped_at`, `pr`, `disposition`, and `wiki_candidates` empty for later lifecycle commands to fill. Do not invent values for those at scaffold.

Freeform WIPs (no issue) leave `issue`, `branch`, and `pr` empty. Everything else still applies.

## Index (`wip/README.md`)

`wip/README.md` is the folder index: a summary of every WIP file plus the repo's open issues. It is NOT a WIP. Every command that enumerates `wip/*.md` (`/investigate`, `/implement`, `/discuss`, `/process-wips`, `/research`, `/sanity-check`, `/submit`) MUST skip it.

Format (regenerated in full on each write; no hand edits survive):

```markdown
# WIP

_Updated {today} by /{command}_

## Open issues without a WIP

_From /triage on {date}_

| Issue | Title | Labels | PR |
|-------|-------|--------|----|
| [#43](https://github.com/<org>/<repo>/issues/43) | Add sitemap | SEO | |

## WIP files

| File | Status | Issue | PR | Summary |
|------|--------|-------|----|---------|
| [GH42-fix-cart.md](GH42-fix-cart.md) | in-progress | [#42](https://github.com/<org>/<repo>/issues/42) | #57 | Cart total ignores tax on edit |
```

Rules:

- **Open issues without a WIP** comes first: every open issue with no WIP. An issue has a WIP when a `GH{N}-*.md` file exists, or any WIP's frontmatter `issue` or Source cross-refs point to GitHub #N (e.g., a `BC…` WIP tracking that issue). Issues that have a WIP MUST NOT appear here; they appear in the WIP files table instead.
- **WIP files** table: one row per `wip/*.md` (excluding README.md), sorted by status (`in-progress`, `open`, `shipped`, `abandoned`) then filename. Status comes from frontmatter. PR comes from frontmatter `pr` or, during `/triage`, the PR cross-reference map. Summary is one line from the Problem section, not just the title.
- Only `/triage` adds rows to the Open issues section and sets its date. Other commands MUST copy it forward unchanged, except that they MUST remove the row for an issue that now has a WIP. A stale list keeps its old date so it shows its age. If `/triage` has never run, the section reads `_Run /triage to populate._`
- Who writes: `/triage` (both sections), `/wip` (WIP files table after create/update), `/process-wips` (WIP files table after deletes and status flips).
- If `wip/` does not exist, `/triage` creates it. `wip/` is gitignored, so the README is local too.

## Status lifecycle

```
open ──┬─▶ in-progress ──▶ shipped ──▶ (retained 7d) ──▶ retired
       └─▶ abandoned ──▶ (retained 7d) ──▶ retired
```

| Status | Set when | Set by |
|--------|----------|--------|
| `open` | Scaffold: issue exists, no work started | `/wip` |
| `in-progress` | Research or code work is underway | `/investigate`, `/implement` |
| `shipped` | Work is on main and CI is green | `/submit` (after push + CI pass) |
| `abandoned` | User decides not to pursue | User edits manually, or `/process-wips` on request |

`/implement` marks `in-progress` on entry (it's starting work). `/submit` marks `shipped` only after confirming the push landed and CI went green; if either fails it leaves status unchanged so the user can re-run after fixing.

## Retention rule

A shipped or abandoned WIP is retained for **7 days** after `shipped_at` (or the date abandoned) to give the user time to lift content into the wiki. After 7 days:

- `disposition: delete` → auto-deleted by `/process-wips`
- `disposition: promote` → flagged for interactive review; deleted once promotion completes
- `disposition:` empty → flagged for interactive review; the user chooses between promote and delete in the review table

`open` and `in-progress` WIPs are never auto-deleted. `last_reviewed` is advisory: if it has not moved in 30 days, `/process-wips` surfaces the file with a "stale, likely abandoned" note for the user to confirm.

## Daily processing (`/process-wips`)

`/process-wips` walks `wip/*.md` and classifies each file into one of three buckets based on frontmatter plus ground truth (gh issue state, branch merge, `shipped_at` age):

1. **Auto-delete** (silent, reported in summary): `status: shipped` or `abandoned`, `shipped_at` > 7 days ago, `disposition: delete`. Deleted without prompting.
2. **Confirm promotion** (interactive, per-row): `disposition: promote` and older than 7 days. The command drafts the proposed wiki edit (which page, what content), shows it to the user, and writes on `y`. Delete the WIP after the wiki commits.
3. **Leave alone** (no action): anything with `status` in `open`/`in-progress`, or shipped/abandoned within the 7-day window, or with `disposition` empty and recently shipped.

### Reconciliation

Before classifying, the command reconciles frontmatter against ground truth and overwrites stale fields:

- If `issue` is set and `gh issue view` shows `state: CLOSED` but the WIP still reads `status: open`/`in-progress`, flip to `shipped` and set `shipped_at` to the issue's `closed_at`.
- If `branch` is set and `git log origin/main` shows it merged, the work shipped even if the frontmatter claims otherwise.
- If no frontmatter exists at all (legacy file), the command treats the whole file as the migration case: read the file, infer initial values, write frontmatter, set `last_reviewed` to today, report as migrated.

Reconciliation runs on every invocation so users can edit source of truth (GitHub) and let the daily run propagate.

## Promotion to wiki

A WIP is worth promoting when it contains **evergreen content**: new conventions, gotchas, architectural decisions, patterns other agents will encounter again. Task-specific details (the exact PR, the exact bug, the specific file paths) are NOT evergreen and should be left to delete.

When the user marks `disposition: promote`, the agent's job at `/process-wips` time is to:

1. Scan the WIP for sections that generalize (Analysis > Suggested approach, Research > "gotcha" notes, Implementation > Deviations with reasoning).
2. Match those against existing wiki pages (`wiki/*.md`). If a page exists on the topic, propose an append or inline edit. If no page fits, propose a new page and note it in the draft.
3. Draft the exact wiki edit (full new content, not a summary) and present it for user confirmation before writing.
4. After the user approves and the wiki edit commits, delete the WIP.

Do NOT promote the whole WIP. A WIP is scaffolding; only the load-bearing bits belong in the wiki. If no section generalizes, change `disposition` to `delete` and let the next run clean it up.

## Freeform WIPs

Not every WIP has an issue. Investigation notes, spike results, meeting takeaways, and one-off plans are legitimate. Freeform WIPs:

- Leave `issue`, `branch`, and `pr` empty
- Use a descriptive filename (no `GH`/`BC` prefix) like `wip/bin-scripts-and-tmux.md`
- Still have `status`, `created`, `last_reviewed`, `disposition`
- Transition to `shipped` manually when the user is done, or `abandoned` when the user walks away

They follow the same retention rule once `status` is terminal. `/process-wips` leaves them alone while `status` is `open` or `in-progress`.

## Acceptance criteria

Every WIP scaffolded from an issue or Basecamp item MUST have an Acceptance criteria section, written as `- [ ]` checkboxes, directly after Problem. Freeform WIPs SHOULD have one, derived from the user's stated goal.

Ownership splits by what evidence each command actually has:

| Written by | What it adds | Marking |
|------------|--------------|---------|
| `/wip` | Explicit asks extracted from the title, body, and comments | `_(source: …)_` |
| `/investigate` | Implied requirements, once the wiki and codebase are loaded | `_(inferred)_` |
| `/implement` | Ticks boxes as they are satisfied; leaves the rest unticked | |
| `/sanity-check` | Audits the list against the diff; never edits it | |

Rules:

- Each criterion MUST be an observable outcome someone can check, not a task. "Contact page phone reads 555-1234", not "update the phone number".
- Each MUST cite its source or be marked `_(inferred)_`. Inferred means what the request clearly entails, not gold-plating.
- Proportional. A one-line todo gets one criterion.
- MUST NOT delete, reword, or untick a criterion once written. If it turns out to be wrong, impossible, or out of scope, leave it and note why under Analysis > Risks.
- An unticked box at `/submit` time is not a blocker, it is a disclosure. Say so in the report rather than ticking it.

**Why checkboxes.** An omission is invisible: nothing appears where the missing work should be, so there is no artifact to notice and nobody is blamed for what did not happen. An unticked box is a visible representation of absence. It converts an error nobody catches into one anybody can see. Ticking a box you did not earn is a false statement in a file the user reads, which is also catchable. That conversion is the entire point of the section, and it is why the criteria MUST be written before the work rather than reconstructed after it: an agent looking at a finished diff will reverse-engineer criteria the diff already satisfies.

## Attachments

When a WIP is scaffolded from a Basecamp todo, message, or upload, every attachment on the source item AND on every comment MUST be downloaded via `download_attachment` and summarized inline in the WIP's Attachments section. Images are read multimodally with the `Read` tool and described: UI state, error text, highlighted regions, before/after framing. PDFs, spreadsheets, and docs are read and their key facts captured. The bar is that a future agent reading only the WIP has enough context to act without re-downloading.

MUST NOT list attachments by filename alone. MUST NOT skip an attachment because it "looks unimportant". The user posted it for a reason. If a download fails, note the failure with the attachment ID so the user can intervene; do not silently drop it.

The same rule applies on `/wip` updates: new attachments added to the source since last fetch get downloaded and summarized, not just appended as filenames.

## What NOT to put in a WIP

- Secrets, tokens, credentials
- Final user-facing documentation (that's the wiki)
- Production code (that's the repo)
- The raw binary contents of attachments (the file lives under `~/.simpleapps/downloads/`; the WIP holds the summary and the local path)

## Related

- `/wip`: scaffold a WIP from an issue or URL; writes frontmatter
- `/investigate`: research; bumps `last_reviewed`, sets `status: in-progress`
- `/implement`: build; bumps `last_reviewed`, keeps `status: in-progress`
- `/submit`: commit and push; after CI green, flips `status: shipped` and fills `shipped_at` / `pr`
- `/process-wips`: daily reconciliation and retention pass; refreshes `wip/README.md`
- `/triage`: refreshes `wip/README.md`, including the Open issues section
