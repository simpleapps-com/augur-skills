---
name: claude-code-docs
description: Claude Code documentation reference and discovery. Use when looking up Claude Code features, configuration, plugins, skills, hooks, or troubleshooting.
allowed-tools:
  - Bash
  - Read
  - WebFetch
---

# Claude Code Documentation

## Entry Points

- **Doc index**: https://code.claude.com/docs/llms.txt. Fetch first, find relevant page URL, then fetch that page.
- **Full content**: https://code.claude.com/docs/llms-full.txt. Large, use when broad context is needed.

IMPORTANT: YOU MUST start from `llms.txt` for current URLs. Doc pages are renamed and reorganized with each release. Never rely on memorized URLs.

## Answer from the docs, not from memory

Claude Code ships several releases a week. Settings keys, frontmatter fields, tool names, and default behaviours all move. Training data lags the product, so recalled detail is stale by default.

MUST fetch the relevant page before asserting that a feature, setting, or field exists. This applies even when the answer feels certain. A confidently wrong config key costs the user a debugging session.

## Version-check before trusting a claim

Doc pages carry `min-version` markers ("Requires Claude Code v2.1.218 or later"), and behaviour frequently differs across releases. When a page gates something on a version, check what is actually installed:

```bash
claude --version
```

Report the gap rather than the feature when the installed build predates the requirement.

## Fetching is cheap, being wrong is not

Large pages blow out context. Two habits keep the cost down:

- Ask WebFetch a **specific question** ("list every SKILL.md frontmatter field and its exact name"), not "summarize this page". The answer comes back scoped.
- When a fetch persists to a file because it was too large, `rg` the file for the keys you need instead of reading it whole.
