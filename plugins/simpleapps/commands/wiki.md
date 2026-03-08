---
name: wiki
description: Load the project wiki into context for reference and assistance
allowed-tools: Read, Glob
---

Load the entire project wiki into your context so you can answer questions and assist with the current project.

## Steps

1. Read `wiki/Home.md` first to orient on the project
2. Read `wiki/llms.txt` to get the wiki index and file summaries
3. Use Glob to find all `*.md` files in `wiki/`
4. Read every `.md` file using the Read tool — do NOT use a subagent, the content MUST be in your own context
5. After loading, confirm which files were loaded and ask the user how you can help

## Important

- Use the Read tool, NOT `cat` or other Bash commands
- Use Glob, NOT `find` or `ls`
- Do NOT skip any wiki files — load them all
- If `wiki/llms.txt` does not exist, skip it and proceed with the glob
