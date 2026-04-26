---
name: wiki
description: Load the project wiki into context for reference and assistance
allowed-tools: Read, Glob, Bash(gh repo clone:*), Bash(rm -rf tmp/:*), Skill(wiki), Skill(bash-simplicity)
---

First, use Skill("wiki") to load wiki conventions.

Load a wiki into your context so you can answer questions and assist with the project.

## Determine mode

- **No arguments** → load the local wiki from the filesystem (`wiki/`)
- **Argument provided** → shallow-clone the remote wiki to `/tmp/`, read it, then clean up

## Local wiki (no arguments)

1. Read `wiki/Home.md` first to orient on the project
2. Read `wiki/llms.txt` to get the wiki index and file summaries
3. List `wiki/` with `ls wiki/` to enumerate all `*.md` files
4. Read every `.md` file using the Read tool. Do NOT use a subagent; the content MUST be in your own context.
5. After loading, confirm which files were loaded and ask the user how you can help

## Remote wiki (argument provided)

The argument is a repo name. If it contains `/`, use it as `org/repo`. Otherwise, default to `simpleapps-com/<name>`.

1. Shallow-clone the wiki repo: `gh repo clone <org>/<repo>.wiki tmp/<repo>-wiki -- --depth 1`
2. Read `tmp/<repo>-wiki/Home.md` first to orient
3. List `tmp/<repo>-wiki/` with `ls tmp/<repo>-wiki/` to enumerate all `*.md` files
4. Read every `.md` file using the Read tool. Do NOT use a subagent; the content MUST be in your own context.
5. Delete the temp clone: `rm -rf tmp/<repo>-wiki`
6. After loading, confirm which pages were loaded and ask the user how you can help

## Important

- Use the Read tool, NOT `cat`, to load file contents
- Use `ls` (Bash) to enumerate files. Claude Code 2.1.117 removed the dedicated Glob tool; `ls` is the replacement.
- Do NOT skip any wiki files. Load them all.
- If `llms.txt` does not exist, skip it and proceed with the listing
- Remote wikis are read-only. All content lives in agent context after loading, nothing persists on disk.
