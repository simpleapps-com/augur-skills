---
name: investigate
description: Load a WIP file, read the wiki, explore the codebase, and update the WIP with research findings and suggestions. No code changes.
argument-hint: "[wip/GH14-slug.md]"
allowed-tools: Bash(gh issue:*), Bash(git -C:*), Bash(git remote:*), Bash(git log:*), Bash(git blame:*), Skill(wiki), Skill(basecamp), Skill(github), Skill(project-defaults), mcp__plugin_simpleapps_basecamp__*, Read, Glob, Grep, Edit, Agent
---

First, use Skill("wiki") to load the project wiki for codebase context, then Skill("project-defaults") for directory layout, then Skill("github") for GH conventions.

Investigate a WIP file — explore the codebase, analyze the problem, and update the WIP with findings. MUST NOT make code changes.

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

1. **Search for relevant code** — use Grep and Glob to find files related to the problem. Use Agent with subagent_type=Explore for broader searches.
2. **Read key files** — understand the current implementation
3. **Trace the flow** — follow the code path affected by the problem
4. **Check git history** — `git -C repo log --oneline -10 -- <file>` for recent changes to relevant files
5. **Download and review attachments** — if the WIP lists BC attachments, use Basecamp MCP tools to download and read them

Focus on understanding the problem deeply. Identify root causes, not just symptoms.

## 4. Update the WIP

Use Edit to update the WIP file with findings:

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
