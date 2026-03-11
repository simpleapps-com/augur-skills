---
name: project-init
description: Check and fix the project directory structure — create missing folders, set up symlinks, clone repos, verify layout
argument-hint: "[repo-name]"
allowed-tools: Bash(ls:*), Bash(mkdir:*), Bash(ln:*), Bash(readlink:*), Bash(gh repo clone:*), Read, Write, Skill(project-defaults)
---

First, use Skill("project-defaults") to load project conventions.

Check the current project directory against the expected layout and fix any issues found. If a repo name is provided as an argument, use it to clone missing repos.

## Steps

Run each command as a separate, simple call. MUST NOT combine commands.

1. Check which directories exist: `ls -la` in the current directory
2. For each missing directory, create it:
   - `mkdir -p wip` (if missing)
   - `mkdir -p tmp` (if missing)
   - `mkdir -p .simpleapps` (if missing)
   - `mkdir -p .claude` (if missing)
3. Check current symlink state: `readlink .claude/rules` and `readlink .claude/commands`
4. Create or fix symlinks if needed:
   - `ln -sf ../repo/.claude/rules .claude/rules` (if repo has rules)
   - `ln -sf ../repo/.claude/commands .claude/commands` (if repo has commands)
5. Check if `.claude/settings.local.json` exists using Read. If missing or missing deny rules, create/update it with the standard deny list from the `project-defaults` skill.
6. Final verification: `ls -la .claude/`

## Output

Report what was checked, what was created, and what was already correct. Use a simple checklist format:

- [x] `repo/` exists
- [x] `wiki/` exists
- [ ] `wip/` created
- [x] `.claude/rules` → `repo/.claude/rules`

MUST NOT create `repo/` or `wiki/` with `mkdir` — these are git clones.

If `repo/` or `wiki/` is missing, MUST ask the user for the correct repo name before cloning — do not guess or infer from the current directory or plugin. Once confirmed:
- `gh repo clone simpleapps-com/<name> repo`
- `gh repo clone simpleapps-com/<name>.wiki wiki`
