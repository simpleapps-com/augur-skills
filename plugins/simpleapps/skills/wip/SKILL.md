---
name: wip
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

Freeform WIPs (no issue) leave `issue`, `branch`, and `pr` empty. Everything else still applies.

## Status lifecycle

```
open ──┬─▶ in-progress ──▶ shipped ──▶ (retained 7d) ──▶ retired
       └─▶ abandoned ──▶ (retained 7d) ──▶ retired
```

| Status | Set when | Set by |
|--------|----------|--------|
| `open` | Scaffold — issue exists, no work started | `/wip` |
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

## What NOT to put in a WIP

- Secrets, tokens, credentials
- Final user-facing documentation (that's the wiki)
- Production code (that's the repo)
- Large binary attachments (link to them instead)

## Related

- `/wip` — scaffold a WIP from an issue or URL; writes frontmatter
- `/investigate` — research; bumps `last_reviewed`, sets `status: in-progress`
- `/implement` — build; bumps `last_reviewed`, keeps `status: in-progress`
- `/submit` — commit and push; after CI green, flips `status: shipped` and fills `shipped_at` / `pr`
- `/process-wips` — daily reconciliation and retention pass
