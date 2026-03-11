---
name: wiki-audit
description: Check wiki health — token budget, cross-links, llms.txt sync, and orphan pages
allowed-tools: Bash(wc:*), Glob, Grep, Read, Skill(wiki)
---

First, use Skill("wiki") to load wiki conventions.

Audit the project wiki at `wiki/` and report any issues.

## Steps

Run each command as a separate, simple call. MUST NOT combine commands.

### 1. Token budget

Run `wc -w wiki/*.md` to get the word count. Multiply total by 1.3 for token estimate. Budget is 20K tokens. Report current usage and percentage.

### 2. Cross-link integrity

Use Grep to find all `[[Page-Name]]` and `[[Page-Name#anchor]]` links across `wiki/*.md`. For each link:
- Verify the target page exists as a file in `wiki/`
- If the link has an `#anchor`, Read the target page and verify the heading exists

Report any broken links.

### 3. llms.txt sync

If `wiki/llms.txt` exists, Read it and compare against the actual `.md` files found by Glob. Report:
- Files in `llms.txt` that don't exist on disk
- Files on disk that aren't listed in `llms.txt`

### 4. Orphan detection

Build a list of all pages referenced from any other page (via `[[links]]` or markdown links). Report pages not referenced from any other page. Exclude `Home.md`, `_Sidebar.md`, and `llms.txt` — these are entry points, not orphans.

## Output

```
## Wiki Audit: {project}

**Token budget**: X / 20,000 (Y%)

**Broken links**: N found
- Page.md:L42 → [[Missing-Page]]

**llms.txt**: in sync / N issues
- missing from llms.txt: Page.md
- missing from disk: Old-Page.md

**Orphan pages**: N found
- Orphan-Page.md
```
