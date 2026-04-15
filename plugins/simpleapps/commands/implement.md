---
name: implement
description: Execute an implementation plan — from a WIP file or session context. Work autonomously, document what was done.
argument-hint: "[wip/GH30-slug.md]"
allowed-tools: Bash(git -C:*), Bash(pnpm:*), Bash(npm:*), Bash(npx:*), Bash(python:*), Bash(pip:*), Bash(composer:*), Bash(php:*), Bash(rm:*), Skill(wiki), Skill(project-defaults), Skill(github), Skill(git-safety), Skill(bash-simplicity), Skill(writing-style), Skill(work-habits), Read, Write, Glob, Grep, Edit, Agent
---

First, use Skill("wiki") to load project context, then Skill("project-defaults") for layout, then Skill("git-safety") for git guardrails, then Skill("bash-simplicity") for Bash conventions, then Skill("writing-style") for variable naming and code style standards, then Skill("work-habits") for autonomous execution rules and RFC 2119 compliance.

Execute an implementation plan. Work autonomously — only stop for user input when stuck or when a decision has no clear answer.

**Scope: implementation means code changes only.** Write code, edit files, run build/test commands. Do NOT commit, create branches, or open PRs — those are separate actions the user will request when ready. When done, report what changed and stop.

## 0. Check branch

Run `git -C repo branch --show-current`. If not on `main` or `master`, warn the user — implementing on the wrong branch means the work may conflict or be based on stale code. Suggest switching before continuing.

## 1. Determine the plan

### With a WIP file

If `$ARGUMENTS` is provided, read it directly as a relative path.

If no argument, use Glob to check `wip/*.md` for WIP files. If one exists, use it. If multiple exist, list them and ask which to implement.

If a WIP is found, check that Research, Analysis, and Files to modify are populated. If they're empty, tell the user the WIP isn't ready and suggest `/investigate` and `/discuss` first.

### Without a WIP file

If no WIP files exist, use the current session context as the plan — what was discussed, agreed, and decided in conversation. Summarize your understanding of what needs to be built and confirm with the user before proceeding.

## 2. Load context

1. Read the wiki for project conventions and patterns
2. If using a WIP, read every file listed in the "Files to modify" table
3. If using session context, explore the relevant codebase areas to understand current state
4. Review the approach, alternatives, and risks (from WIP Analysis or session discussion)

## 3. Execute the plan

Work through the implementation. For each change:

1. Read the file (if not already in context)
2. Make the changes described in the WIP
3. Verify the change makes sense in the context of surrounding code

### Autonomy rules

- **Keep going** — do not stop after each file to ask for confirmation
- **Make decisions** — if the implementation requires minor decisions not covered in the WIP (variable names, exact placement, etc.), make them and document in the WIP
- **Discover additional changes** — if a change requires modifying files not in the plan, make the change and add the file to the "Files to modify" table
- **Stop when stuck** — if you hit a problem with no clear solution, stop and ask the user. Explain what you tried and what's blocking you
- **Stop for scope questions** — if the implementation reveals the scope is larger than expected, stop and discuss with the user before continuing

## 5. Document the implementation

If a WIP file was used, update it. If no WIP exists, create an implementation record at `wip/impl-{slug}.md` with the same structure — this ensures every implementation has an audit trail.

Add an **Implementation** section (after Analysis, before Files to modify):

```markdown
## Implementation

### Changes made
- `path/to/file.ts` — description of what was actually changed and why
- `path/to/other.ts` — description of changes

### Assumptions
- List any assumptions made during implementation
- Include reasoning for decisions not covered in the original plan

### Deviations from plan
- Any changes that differed from the original "Files to modify" plan
- Additional files that needed modification
- Approaches that changed during implementation and why

### Open questions
- Anything that needs follow-up or user review
```

Update the "Files to modify" table to reflect what was actually changed (add new rows for files discovered during implementation).

Change the WIP status to `## Status: Implemented`.

## 6. Report and stop

Tell the user:
- What was implemented (brief summary)
- Files changed (count and list)
- Any assumptions or deviations from the plan
- Any open questions
- Suggest next step: `/quality` to run checks, then `/verify` to confirm in the browser
- Remind that the WIP has full implementation details for review

**Then stop.** Do not commit, push, create PRs, or suggest doing so. The user decides when and how to package the changes.
