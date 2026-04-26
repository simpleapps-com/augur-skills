---
name: wip
description: Fetch a Basecamp URL or GitHub issue with full comments, scaffold a WIP file, and load the wiki
argument-hint: "<basecamp-url or github-issue>"
allowed-tools: Bash(gh issue:*), Bash(git -C:*), Bash(git remote:*), Bash(basename:*), Bash(date:*), Bash(gh label:*), Skill(basecamp), Skill(workflow), Skill(github), Skill(wip), Skill(bash-simplicity), Skill(work-habits), mcp__plugin_simpleapps_basecamp__*, Read, Write, Edit, Glob
---

First, use Skill("basecamp") to load the Basecamp MCP reference, then Skill("workflow") for the Basecamp-to-GitHub flow, then Skill("github") for GH CLI conventions, then Skill("wip") for the WIP frontmatter schema and lifecycle, then Skill("bash-simplicity") for Bash conventions, then Skill("work-habits") for autonomous execution rules and RFC 2119 compliance.

Fetch a Basecamp URL or GitHub issue and scaffold a WIP file.

Input: `$ARGUMENTS` is a Basecamp URL or GitHub issue reference.

## 0. Branch hygiene check

Apply the "Branch hygiene before starting work" rule from `simpleapps:work-habits`. This is a HARD STOP, not a warning.

1. Parse `$ARGUMENTS` to extract the issue number `N` (GitHub `#N` or Basecamp item id)
2. Run `git -C repo branch --show-current` → branch `B`
3. Run `git -C repo status --porcelain` → tree state `T`

Proceed ONLY if `B` is `main`/`master` with `T` clean, OR `B` contains `N` (you're updating an existing WIP for the same issue, dirty tree allowed).

Otherwise STOP and tell the user the exact mismatch and recovery path. Do NOT scaffold a WIP on a branch that belongs to a different issue — it is the entry point where this category of bug starts.

## 1. Detect source type

**Basecamp URL**: matches `basecamp.com/<account>/projects/<project_id>/<type>/<id>`:
- Extract `project_id` and item `id` from the URL path
- Determine item type from the URL: `todos`, `messages`, `uploads`, `forwards`

**GitHub issue**: matches any of:
- `#N` (use repo from `git -C repo remote -v`)
- `org/repo#N`
- Full GitHub URL containing `/issues/N`

If the input does not match either pattern, stop and ask the user to provide a Basecamp URL or GitHub issue reference.

## 2. Fetch full content

### Basecamp

Based on the item type extracted from the URL:

| URL type | MCP tool | Key fields |
|----------|----------|------------|
| `todos/<id>` | `get_todo(project_id, todo_id)` | content, comments, assignee, attachments |
| `messages/<id>` | `get_message(project_id, message_id)` | subject, content, comments, attachments |
| `uploads/<id>` | `get_upload(project_id, upload_id)` | content, comments |
| `forwards/<id>` | `get_forward(project_id, forward_id)` | subject, content |

The MCP response includes comments inline. Extract:
- **Title**: todo content, message subject, or upload name
- **Body**: full content/description
- **Comments**: all comments with author and date
- **Assignee**: if present (todos)
- **Attachments**: file names, types, and IDs from the item and its comments

### GitHub

Determine the repo:
1. If `org/repo` was provided in the reference, use it
2. Otherwise, run `git -C repo remote -v` and extract `org/repo`

Fetch the issue with comments:
```
gh issue view <N> --repo <org>/<repo> --json title,body,comments,labels,assignees,state
```

Extract:
- **Title**: issue title
- **Body**: issue body
- **Comments**: all comments with author and date

## 3. Label unlabeled GitHub issues

If the source is a GitHub issue and the fetched data shows an empty `labels` array, assign a label:

1. Read the issue title and body
2. Pick the best-fit label from the standard set: `bug`, `security`, `a11y`, `perf`, `SEO`, `enhancement`, `refactor`
3. Apply it: `gh issue edit <N> --repo <org>/<repo> --add-label <label>`

Use these heuristics:
- Broken/wrong behavior, errors, crashes: `bug`
- New feature or capability: `enhancement`
- Accessibility (screen reader, contrast, focus): `a11y`
- Performance, speed, Core Web Vitals: `perf`
- SEO, meta tags, structured data: `SEO`
- Code cleanup with no user-visible change: `refactor`
- Security vulnerability: `security`

If the issue could fit multiple labels, pick the single most relevant one. Do not add status labels (`blocked`, `production-blocker`) in this step. Those are applied by other commands when the situation warrants it.

Skip this step for Basecamp sources (labels are a GitHub concept).

## 4. Detect cross-references

Scan the body and all comments for links to the other system:
- In BC content, look for GitHub URLs (`github.com/*/issues/N`) → note as `GH #N`
- In GH content, look for Basecamp URLs (`basecamp.com/*/projects/*/todos/*`) → note as BC reference

Record all cross-references for the Source section.

## 5. Generate slug

From the title:
1. Lowercase
2. Replace non-alphanumeric characters with hyphens
3. Collapse multiple hyphens
4. Trim leading/trailing hyphens
5. Truncate to 50 characters (trim at last full word)

## 6. Check for existing WIP

List `wip/` with `ls wip/` and check for a file starting with the same prefix (`BC{#}` or `GH{#}`). If one exists, read it and go to step 7a (update). Otherwise, go to step 7b (create).

## 7a. Update existing WIP

Read the existing WIP file. Compare against freshly fetched content:

1. **Frontmatter**: if the GH issue is closed and frontmatter `status` is still `open`/`in-progress`, flip to `shipped` and set `shipped_at` to the issue's `closed_at`. Bump `last_reviewed` to today.
2. **Problem**: update if the issue body was edited
3. **Attachments**: add any new attachments not already listed
4. **Comments**: compare comment lists by author + date. Append any new comments after the existing ones. MUST NOT duplicate or remove existing comments.
5. **Cross-refs**: add any newly detected cross-references
6. **Preserve user work**: MUST NOT modify Research, Analysis, Files to modify, or any other sections the user has edited

If the existing file has no frontmatter (legacy format), add it per the schema in step 7b. Migrate the prose `## Status:` line into frontmatter `status` (`WIP` → `open`, `Implemented`/`Shipped` → `shipped`) and remove the prose line.

Tell the user what was updated (e.g., "Added 2 new comments, status unchanged").

## 7b. Create new WIP file

Write to `wip/{prefix}{#}-{slug}.md` where prefix is `GH` or `BC`.

Prepend YAML frontmatter per the `simpleapps:wip` schema. Get today's date with `date +%Y-%m-%d`. Leave `shipped_at`, `pr`, `disposition`, and `wiki_candidates` empty — later lifecycle commands fill them in.

Template:

```markdown
---
issue: {full URL to the issue or Basecamp item}
branch:
status: open
created: {today}
last_reviewed: {today}
shipped_at:
pr:
disposition:
wiki_candidates:
---

# {Source type} #{number}: {Title}

## Source

- {source_type}: {url}
- Cross-refs: {any detected cross-references, or "none"}

## Problem

{Body content. The full description from the issue or Basecamp item.}

## Attachments

{List each attachment with name, type, and ID. Include download instructions per the basecamp skill. Omit this section if no attachments.}

## Comments

{Each comment, formatted as:}

### {Author} ({Date})

{Comment body}

---

## Research

_Investigation notes go here._

## Files to modify

| File | Changes |
|------|---------|

## References

- {Source type}: {url}
- {Any cross-references found}
```

For freeform WIPs (no issue, user-provided scaffold), leave `issue` and `branch` empty in the frontmatter and use a descriptive filename with no `GH`/`BC` prefix.

## 8. Load the wiki

Load the project wiki into context so the user can chat about the scaffolded WIP before moving on to `/investigate`:

1. Read `wiki/Home.md` first to orient on the project
2. Read `wiki/llms.txt` if it exists to get the wiki index
3. List `wiki/` with `ls wiki/` to enumerate all `*.md` files
4. Read every `.md` file with the Read tool. Do NOT use a subagent; the content MUST be in your own context.
5. If `wiki/` does not exist, skip this step and note it in the report

## 9. Report

For new WIP files:
- WIP file created at `wip/{filename}`
- Brief summary of what was found (title, comment count, attachments, assignee if any)
- Cross-references detected (if any)
- If Basecamp source, remind that a GH issue can be created later to track the work

For updated WIP files:
- What changed (new comments, status update, new attachments, new cross-refs)
- Confirm user-authored sections were preserved

Confirm the wiki was loaded (which pages) so the user knows full project context is available for discussion.

Suggest next step: chat about the scaffolded WIP, then run `/investigate` to explore the codebase and populate the WIP with findings.
