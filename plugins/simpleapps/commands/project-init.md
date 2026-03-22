---
name: project-init
description: Check and fix the project directory structure — create missing folders, set up symlinks, clone repos, verify layout
argument-hint: "[repo-name]"
allowed-tools: Bash(ls:*), Bash(mkdir:*), Bash(ln:*), Bash(readlink:*), Bash(gh repo clone:*), Bash(grep:*), Bash(cp:*), Bash(md5sum:*), Bash(md5:*), Read, Write, Edit, Skill(project-defaults)
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
4. If `repo/` exists, ensure symlink targets exist:
   - `mkdir -p repo/.claude/rules` (if missing)
   - `mkdir -p repo/.claude/commands` (if missing)
5. Create or fix symlinks:
   - `ln -sf ../repo/.claude/rules .claude/rules`
   - `ln -sf ../repo/.claude/commands .claude/commands`
6. Sync plugin rules into the project. The plugin ships rule templates in `rules/` that MUST exist in every project's `repo/.claude/rules/`. The plugin rules directory is at:
   `~/.claude/plugins/marketplaces/augur-skills/plugins/simpleapps/rules/`
   For each `.md` file in that directory:
   - If `repo/.claude/rules/<filename>` does not exist, copy it: `cp <plugin-rules-path>/<file> repo/.claude/rules/<file>`
   - If it exists, md5 hash both files (`md5 -q <file>` on macOS, `md5sum <file>` on Linux). If hashes match, skip. If they differ, overwrite with the plugin version — plugin rules are the source of truth
   - Report which rules were copied, which matched, and which were updated
7. Check if `.claude/settings.local.json` exists using Read. If missing or missing deny rules, create/update it with the standard deny list from the `project-defaults` skill.
8. Check if the augur-skills bin directory is in the user's PATH:
   - The bin path is: `$HOME/.claude/plugins/marketplaces/augur-skills/plugins/simpleapps/bin`
   - Run `grep -q 'augur-skills/plugins/simpleapps/bin' ~/.zshrc` to check
   - If not found, append the export line to `~/.zshrc` using the Edit tool:
     ```
     # SimpleApps augur-skills bin scripts
     export PATH="$PATH:$HOME/.claude/plugins/marketplaces/augur-skills/plugins/simpleapps/bin"
     ```
   - Tell the user to run `source ~/.zshrc` or open a new terminal for the change to take effect
   - If already present, report it as already configured
9. Final verification: `ls -la .claude/`

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
