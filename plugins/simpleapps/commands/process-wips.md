---
name: process-wips
description: Daily WIP reconciliation. Walks wip/*.md, reconciles frontmatter vs ground truth, auto-deletes shipped WIPs older than 7 days, and confirms wiki promotions interactively.
allowed-tools: Bash(gh issue:*), Bash(gh pr:*), Bash(git -C:*), Bash(rm:*), Bash(ls:*), Skill(wip), Skill(wiki), Skill(github), Skill(bash-simplicity), Skill(work-habits), Read, Write, Edit
---

First, use Skill("wip") to load the frontmatter schema and retention rules, then Skill("wiki") for the project wiki, then Skill("github") for gh CLI conventions, then Skill("bash-simplicity") for Bash conventions, then Skill("work-habits") for autonomous execution rules.

Reconcile and retire WIP files. Runs daily. Most of the work is silent; the only interactive step is confirming wiki promotions.

## 1. Enumerate WIPs

List `wip/` with `ls wip/`. If `wip/` does not exist or contains no `*.md` files, report nothing to do and stop.

## 2. Parse each file

For each WIP:

1. Read the file
2. Parse YAML frontmatter (if present). If absent, this is a legacy file — handle in step 3 (migrate).
3. Extract `issue`, `branch`, `status`, `created`, `last_reviewed`, `shipped_at`, `pr`, `disposition`, `wiki_candidates`.

## 3. Migrate legacy files (frontmatter-less)

If the file has no frontmatter, infer initial values:

- `issue`: from filename prefix (`GH<N>-…` → GitHub issue URL; `BC<N>-…` → Basecamp URL if identifiable) or from the `## Source` section body; leave empty if freeform
- `status`: read the prose `## Status:` line. Map: `WIP` → `in-progress`, `Implemented`/`Shipped` → `shipped`, `Closed` → `abandoned`
- `created`: file mtime (`wip/` is gitignored, so git history is not available for it). Today if mtime is unreadable.
- `last_reviewed`: file mtime. Imperfect — mtime can be touched by unrelated operations — but it is the only signal available for legacy files since `wip/` is gitignored. Lifecycle commands write accurate dates from their invocation forward, so post-migration data is reliable.
- `shipped_at`: if `status: shipped`, try issue `closed_at` via `gh issue view --json closedAt`; otherwise leave empty
- `branch`, `pr`, `disposition`, `wiki_candidates`: empty

Write the frontmatter block at the top of the file. Preserve all existing content below. Record the file as migrated in the report.

## 4. Reconcile against ground truth

For each WIP with a GitHub `issue`:

1. Run `gh issue view <N> --repo <org>/<repo> --json state,closedAt`
2. If issue `state: CLOSED` and WIP `status` is `open` or `in-progress`, flip `status: shipped` and set `shipped_at` to the issue's `closedAt` date (YYYY-MM-DD).
3. If issue `state: OPEN` and WIP `status: shipped`, the ship got reverted or the status is wrong. Report as a conflict and do not auto-change.

For each WIP with a `branch`:

1. Check if merged: `git -C repo log origin/main --oneline --grep "<branch>"` or `git -C repo branch --merged origin/main`
2. If the branch is merged but `status` is not `shipped`, flip to `shipped` and set `shipped_at` from the merge commit date.

Skip reconciliation for freeform WIPs (no issue, no branch).

## 5. Classify

For each WIP, compute a bucket:

**auto-delete** — all of:
- `status` in (`shipped`, `abandoned`)
- `shipped_at` (or date abandoned) > 7 days ago
- `disposition: delete`

**confirm-promote** — all of:
- `status` in (`shipped`, `abandoned`)
- `shipped_at` > 7 days ago
- `disposition: promote`

**needs-decision** — all of:
- `status` in (`shipped`, `abandoned`)
- `shipped_at` > 7 days ago
- `disposition` empty

**stale-active** — all of:
- `status` in (`open`, `in-progress`)
- `last_reviewed` > 30 days ago

**leave-alone** — everything else

## 6. Present the table

Print a compact table grouped by bucket. Example:

```
auto-delete (3):
  wip/GH34-project-init.md          shipped 2026-03-10  delete
  wip/GH35-cross-repo-tracking.md   shipped 2026-03-12  delete
  wip/GH36-knip-suggestion.md       shipped 2026-03-15  delete

confirm-promote (1):
  wip/GH41-taskstop-vs-kill.md      shipped 2026-04-01  promote -> bash-simplicity skill

needs-decision (2):
  wip/GH38-descriptive-names.md     shipped 2026-04-05  [promote | delete]?
  wip/GH39-github-labels.md         shipped 2026-04-05  [promote | delete]?

stale-active (1):
  wip/bin-scripts-and-tmux.md       in-progress, last touched 2026-02-14

migrated (N):
  <files that got frontmatter this run>

leave-alone (X):
  <count only; full list only if user asks>
```

## 7. Execute auto-deletes

Without further prompting, delete each file in the `auto-delete` bucket:

```bash
rm wip/<filename>
```

Report the count in the summary.

## 8. Handle confirm-promote interactively

For each file in `confirm-promote`:

1. Read the WIP
2. Identify the evergreen section(s) based on `wiki_candidates` frontmatter hint (or, if empty, scan for Analysis/Research findings that generalize)
3. Read the target wiki page(s) referenced in `wiki_candidates`
4. Draft the exact wiki edit (full proposed content with surrounding context so the user can see where it lands)
5. Present to the user: "Promote this WIP? [show diff]. y = apply and delete WIP; n = skip; e = edit content first"
6. On `y`: apply the wiki edit using Edit tool, then delete the WIP
7. On `n`: leave the WIP untouched, report as deferred
8. On `e`: ask the user what to change, redraft, re-present

Do NOT commit wiki changes. The wiki is a git repo and the user commits wiki changes under their own flow (`wiki/` is separate from `repo/`).

## 9. Handle needs-decision interactively

For each file in `needs-decision`, show a compact summary (issue title, 1-line problem, shipped date) and ask: "promote, delete, or keep?"

- `promote` → set `disposition: promote` in frontmatter and re-run the promote flow for this file
- `delete` → set `disposition: delete` and delete immediately
- `keep` → leave the frontmatter empty so the next daily run asks again

Do NOT treat `needs-decision` as a silent default-delete. These are files the user never marked; make them visible.

## 10. Handle stale-active

For each file in `stale-active`, ask: "still active? [y / abandon / delete]?"

- `y` → bump `last_reviewed` to today
- `abandon` → set `status: abandoned`, `shipped_at` to today; next run will retain 7 days
- `delete` → delete immediately

## 11. Update last_reviewed

For every WIP that remains after the run (not deleted, not promoted away), bump `last_reviewed` to today. This keeps the "30-day stale" check honest.

## 12. Report

```
## WIP processing report

Processed: <count> files

- Migrated (added frontmatter): <count>
- Auto-deleted: <count>
- Promoted to wiki: <count>  (pages touched: <list>)
- Deferred (skipped or user chose keep): <count>
- Still active: <count>
- Conflicts (status disagrees with ground truth): <count, list each>

Next run: tomorrow. Use /process-wips again to continue.
```

Stop. Do NOT commit or push. The user reviews the diff in `wiki/` (if any promotions happened) and commits on their own schedule.
