---
name: context
description: Report current context window usage. Rules, skills loaded, wiki pages, and working context.
allowed-tools: Bash(wc:*), Bash(ls:*), Bash(find:*), Bash(grep:*), Read
---

Report what is currently consuming context window tokens.

## 1. Always-loaded content

### CLAUDE.md files

Count lines and estimate tokens for each CLAUDE.md in the load chain:
- `repo/.claude/CLAUDE.md` (project)
- Global CLAUDE.md (if accessible)

Platform limit: CLAUDE.md MUST be under 200 lines.

### Rules

List `repo/.claude/rules/` with `ls repo/.claude/rules/` to enumerate the `*.md` rule files. Read each and count words. Rules without a `globs` frontmatter field load on every prompt. Rules with `globs` load only for matching files.

Estimate tokens: words * 1.3

### Skill descriptions

Find all `SKILL.md` files in the plugin with `find repo/plugins -name SKILL.md`. Count the total characters of all `description` fields in frontmatter. Platform budget: 2% of context window for ALL skill descriptions combined.

## 2. On-demand content loaded this session

List any skills that have been explicitly loaded via `Skill()` calls in this session. For each, count words and estimate tokens.

## 3. Wiki

Run `wc -w wiki/*.md`. Budget: 20K tokens (~15K words).

## 4. Report

```
## Context Usage

### Always loaded (every prompt)
| Source | Lines | Est. tokens |
|--------|-------|-------------|
| CLAUDE.md (project) | X | Y |
| CLAUDE.md (global) | X | Y |
| Rules (always) | X files, Y lines | Z |
| Skill descriptions | X skills | Y chars / 16K budget |
| **Subtotal** | | **Z** |

### On-demand (this session)
| Source | Words | Est. tokens |
|--------|-------|-------------|
| Skill: work-habits | X | Y |
| wiki/*.md | X | Y |
| **Subtotal** | | **Z** |

### Budget health
- CLAUDE.md: X / 200 lines
- Skill descriptions: X / 16K chars
- Wiki: X / 20K tokens
- System overhead: X tokens (varies by model and loaded MCP servers)
```

Flag any budget violations or items approaching limits.
