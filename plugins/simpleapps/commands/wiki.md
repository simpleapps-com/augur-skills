---
name: wiki
description: Load the project wiki into context for reference and assistance
allowed-tools: Read, Glob, Bash(gh api:*), Bash(gh repo:*)
---

Load a wiki into your context so you can answer questions and assist with the project.

## Determine mode

- **No arguments** → load the local wiki from the filesystem (`wiki/`)
- **Argument provided** → load a remote wiki via GitHub API

## Local wiki (no arguments)

1. Read `wiki/Home.md` first to orient on the project
2. Read `wiki/llms.txt` to get the wiki index and file summaries
3. Use Glob to find all `*.md` files in `wiki/`
4. Read every `.md` file using the Read tool — do NOT use a subagent, the content MUST be in your own context
5. After loading, confirm which files were loaded and ask the user how you can help

## Remote wiki (argument provided)

The argument is a repo name. If it contains `/`, use it as `org/repo`. Otherwise, default to `simpleapps-com/<name>`.

1. List wiki pages: `gh api repos/<org>/<repo>/wiki/pages --paginate 2>/dev/null` — if this fails, try cloning:
   - `gh api repos/<org>/<repo>/contents` and look for wiki indicators, OR
   - Inform the user the wiki is not accessible via API and suggest cloning it locally
2. For each page returned, fetch its content via the API
3. If the API approach fails, try: `gh repo clone <org>/<repo>.wiki /tmp/<repo>-wiki -- --depth 1` then read the files locally and clean up when done
4. After loading, confirm which pages were loaded and ask the user how you can help

## Important

- Use the Read tool, NOT `cat` or other Bash commands for local files
- Use Glob, NOT `find` or `ls` for local files
- Do NOT skip any wiki files — load them all
- If `wiki/llms.txt` does not exist, skip it and proceed with the glob
- Remote wikis: prefer the API, fall back to shallow clone if needed
