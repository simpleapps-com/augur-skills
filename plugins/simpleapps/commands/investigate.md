---
name: investigate
description: Load a WIP file, read the wiki, explore the codebase, and update the WIP with research findings and suggestions. No code changes.
argument-hint: "[wip/GH14-slug.md]"
allowed-tools: Bash(gh issue:*), Bash(git -C:*), Bash(git remote:*), Bash(git log:*), Bash(git blame:*), Bash(date:*), Skill(wiki), Skill(basecamp), Skill(github), Skill(project-defaults), Skill(augur-packages), Skill(writing-style), Skill(wip), Skill(work-habits), mcp__plugin_simpleapps_basecamp__*, Read, Glob, Grep, Edit, Agent
---

First, use Skill("wiki") to load the project wiki for codebase context, then Skill("project-defaults") for directory layout, then Skill("github") for GH conventions, then Skill("writing-style") for naming and documentation standards, then Skill("wip") for the WIP frontmatter schema, then Skill("work-habits") for autonomous execution rules and RFC 2119 compliance.

Investigate a WIP file. Explore the codebase, analyze the problem, and update the WIP with findings. MUST NOT make code changes.

## 0. Branch hygiene check

Apply the "Branch hygiene before starting work" rule from `simpleapps:work-habits`. This is a HARD STOP, not a warning.

1. Resolve the issue number `N` from `$ARGUMENTS` if provided, or from the WIP filename (e.g., `wip/GH367-…md` → `N=367`)
2. Run `git -C repo branch --show-current` → branch `B`
3. Run `git -C repo status --porcelain` → tree state `T`

Proceed ONLY if `B` is `main`/`master` with `T` clean, OR `B` contains `N`.

Otherwise STOP. Investigating on a branch that belongs to a different issue means the user is about to start a second line of work on top of an unfinished first one. Tell the user to `/submit` the in-flight work first, then `git -C repo switch main` and re-run.

## 1. Find the WIP file

If `$ARGUMENTS` is provided, read it directly as a relative path (e.g., `wip/GH14-fix-oauth.md`).

If no argument, use Glob to find all `wip/*.md` files. If none exist, inform the user and suggest running `/wip` first. If only one exists, use it. If multiple exist, list them and ask the user which to investigate.

## 2. Read the WIP

Read the WIP file. Extract:
- **Problem**: what needs to be solved
- **Source**: BC/GH reference URLs
- **Comments**: any additional context from discussion
- **Attachments**: any referenced files to download and review

## 3. Explore the codebase

Based on the problem statement, systematically investigate:

1. **Check augur-\* packages first**: if this is a NextJS site using `@simpleapps-com/augur-*` packages, use Skill("augur-packages") to check if any package already provides the needed functionality. Sites MUST use augur package features before building custom solutions.
2. **Check for subsystem docs**: once you identify the relevant code path, use Glob to look for a colocated `README.md` or similar at the subsystem level (e.g., `repo/src/helpers/README.md`), and any per-item detail doc next to the specific thing you are investigating. Read them before going deeper into code. They were written to short-circuit exactly this kind of discovery. See `simpleapps:wiki` "Progressive Disclosure via Colocated Markdown" for the pattern.
3. **Search for relevant code**: use Grep and Glob to find files related to the problem. Use Agent with subagent_type=Explore for broader searches.
4. **Read key files**: understand the current implementation
5. **Trace the flow**: follow the code path affected by the problem
6. **Check for existing packages**: search `repo/package.json` for dependencies that may already solve the problem. Check if the project is duplicating functionality that a dependency provides.
7. **Check git history**: `git -C repo log --oneline -10 -- <file>` for recent changes to relevant files
8. **Download and review attachments**: if the WIP lists BC attachments, use Basecamp MCP tools to download and read them

**Stopping condition**: Stop when you can describe the root cause, identify the files to modify, and propose an approach. You do not need to understand the entire system, just enough to act. Investigate until you can inform implementation decisions, then write up findings and stop. Prefer using existing package functionality over custom code.

## 4. Update the WIP

Use Edit to update the WIP file with findings.

### Frontmatter

Per `simpleapps:wip`, bump `last_reviewed` to today (`date +%Y-%m-%d`) and, if `status` is `open`, flip to `in-progress`. If the file has no frontmatter (legacy), add the full block per the schema before editing sections. Keep `shipped_at`, `pr`, and `disposition` untouched unless the ground truth has changed (e.g., issue is already closed — then reconcile per the wip skill).

### Research section

Replace `_Investigation notes go here._` with structured findings:
- What the current code does
- Where the problem originates
- Related code and dependencies
- Edge cases and risks

### Files to modify section

Populate the table with specific files and what changes each needs:

```markdown
| File | Changes |
|------|---------|
| `path/to/file.ts` | Description of what needs to change |
```

### Add an Analysis section (after Research, before Files to modify)

```markdown
## Analysis

### Root cause
{What is actually causing the problem}

### Suggested approach
{Recommended implementation strategy}

### Alternatives considered
{Other approaches and why they're less suitable}

### Risks
{What could go wrong, edge cases, breaking changes}
```

## 5. Report

Tell the user:
- Summary of findings
- Suggested approach
- Key files involved
- Any questions or decisions that need user input before implementation
- Remind that the WIP file has been updated with full details
- Suggest next step: `/discuss` to align on approach, or `/implement` if the plan is clear
