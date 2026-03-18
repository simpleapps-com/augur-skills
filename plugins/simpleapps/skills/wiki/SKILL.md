---
name: wiki
description: Wiki conventions for SimpleApps projects. Covers token budget, writing for three audiences, page conventions, maintenance rules, and git workflow. Use when reading, writing, or auditing wiki content.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Edit
  - Write
  - Bash
---

# Wiki

The wiki is the **single source of truth** for how a project works. The wiki is the spec; the repo is the implementation.

## Token Budget

A wiki MUST NOT exceed **20K tokens** (~15K words, ~60KB). This is 10% of the AI agent's 200K context window — enough for the agent to load the entire wiki at session start while leaving 90% for working context.

Check size: `wc -w wiki/*.md` (multiply by ~1.3 for token estimate)

## Core Principle

Repo files (`.claude/CLAUDE.md`, `.claude/rules/`, `README.md`) MUST be minimal — orient then point to wiki. AI agents read wiki pages as local files via `Read wiki/<page>.md`. No network requests needed.

```
Wiki defines → Code implements → Learnings update wiki → Repeat
```

When code reveals the wiki is wrong or incomplete, update immediately. The wiki MUST reflect reality, not aspirations.

## Learning Organization

Wikis are not just for the current project. They build institutional knowledge across the organization:

- **Site → Site**: Other projects using the same tools learn from this wiki. Document what worked, what didn't, and why — future sites benefit from your experience.
- **Site → Packages**: The packages team reads site wikis to understand real usage patterns, pain points, and gaps. Your wiki helps them build better shared tools.
- **Packages → Site**: Package docs and conventions flow back into site wikis as shared patterns.

Write as if someone on a different project will read this wiki to understand how you solved a similar problem. Tag sections **(platform pattern)** when the approach applies to all sites using the same stack, and **(site-specific)** when it's unique to this project.

## Three Audiences

Every page serves junior devs (explanations, examples), senior devs (quick reference, decisions), and AI agents (unambiguous specs, MUST/SHOULD/MAY). Write for all three:

- Lead with a summary — seniors and agents get it fast, juniors get orientation
- Explain *why* before *how*
- Use tables for reference, code blocks for copy-paste, RFC 2119 keywords for requirements
- Each page SHOULD be self-contained
- Follow `simpleapps:writing-style` — token-efficient, action verbs first, no filler

## Content Rules

- Wiki pages SHOULD NOT contain raw code. Describe patterns and principles instead.
- If implementation details are needed, link to the source file in `repo/` rather than duplicating code in the wiki.
- The wiki documents *what* and *why*. The repo is the source of truth for *how*.

## Conventions

- Page naming: **PascalCase** with hyphens (`Getting-Started.md`)
- Every wiki MUST have `_Sidebar.md` for navigation
- Links: `[[Page-Name]]` or `[[Display Text|Page-Name]]`
- Anchor links MUST target specific sections (`[[Versioning#version-bump-procedure]]`), not just pages
- Repo references: use relative paths (`../../../wiki/Versioning.md`)
- Default branch: `master` (not `main`)

## Keep It Lean

- Document patterns and principles, not exhaustive lists
- No hardcoded counts, no pinned versions, no full export inventories
- Describe the pattern, give 1-2 examples, point to source for current list
- Merge overlapping pages, archive obsolete ones

## Maintenance

Cross-check wiki against code before updating. Staleness-prone: versions, file counts, CI workflows, TODO markers, API surfaces. **Never echo what the wiki says — read the code, then write.**

When adding/removing pages, MUST update: `Home.md`, `_Sidebar.md`, `llms.txt` (if present).

## Git Workflow

The wiki is a separate git repo at `wiki/`. No branch protection, no PRs.

```bash
git -C wiki add -A
# Write commit message using Write tool → tmp/commit-msg.txt
git -C wiki commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
git -C wiki push
```
