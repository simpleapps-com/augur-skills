---
name: project-init
description: Check and fix the project directory structure. Create missing folders, set up symlinks, clone repos, verify layout.
argument-hint: "[repo-name]"
allowed-tools: Bash(ls:*), Bash(mkdir:*), Bash(ln:*), Bash(readlink:*), Bash(gh repo clone:*), Bash(gh label:*), Bash(grep:*), Bash(cp:*), Bash(md5sum:*), Bash(md5:*), Read, Write, Edit, Skill(project-defaults), Skill(bash-simplicity), Skill(context-efficiency)
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
6. **MUST sync plugin rules into the project.** This step is NOT optional. Every project MUST have the latest plugin rules.
   a. Set the source path using the plugin's install-location env var: `ls ${CLAUDE_PLUGIN_ROOT}/rules/`. If `CLAUDE_PLUGIN_ROOT` is unset (the plugin is not loaded in this session), fall back to `~/.claude/plugins/marketplaces/augur-skills/plugins/simpleapps/rules/` and warn the user that the plugin may not be properly installed.
   b. For EVERY `.md` file found in that directory, do the following:
      - Run `ls repo/.claude/rules/<filename>` to check if it exists
      - If it does NOT exist: `cp ${CLAUDE_PLUGIN_ROOT}/rules/<file> repo/.claude/rules/<file>`
      - If it DOES exist: hash both files with `md5 -q <file>` (macOS) or `md5sum <file>` (Linux). If hashes differ, overwrite: `cp ${CLAUDE_PLUGIN_ROOT}/rules/<file> repo/.claude/rules/<file>`. Plugin rules are the source of truth.
      - If hashes match: skip (already up to date)
   c. Report: which rules were copied (new), updated (hash mismatch), or matched (already current)
7. Check `.simpleapps/` configuration:
   a. Check if `~/.simpleapps/settings.json` exists using Read. If missing, create it with default content: `{"projectRoot": "~/projects"}`. Ask the user to confirm the projectRoot value. When comparing the current project path against `projectRoot`, use case-insensitive comparison. macOS APFS is case-insensitive by default, so `~/Projects/` and `~/projects/` are the same directory. Only flag if the path genuinely does not resolve (wrong directory, not just casing).
   b. Check for old `{siteId}.json` files in `.simpleapps/`. Any `.json` file that is NOT `settings.json`, `site.json`, `basecamp.json`, or `augur-api.json` is likely an old site ID file. If found, report them and suggest migrating their content to `site.json`. Do NOT auto-migrate. The files contain PII and the user must review.
   c. For client projects: if `.simpleapps/site.json` does not exist, suggest creating it. Do NOT create it automatically. The user needs to provide the site data.
8. Check if `.claude/settings.local.json` exists using Read. If missing or missing deny rules, create/update it with the standard settings from the `project-defaults` skill, including the `env` block with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY`, `CLAUDE_CODE_NO_FLICKER`, and the full allow/deny lists. If the file exists but is missing the `env` block or any env vars, add them. `CLAUDE_CODE_NO_FLICKER` MUST be set to `"1"`. This enables fullscreen rendering that eliminates terminal flicker.
9. Check if cross-project directory access is configured. Read `~/.claude/settings.json` and check for `additionalDirectories`. If missing, suggest adding it so agents can read other project wikis and repos without permission prompts each session:
   ```json
   {
     "additionalDirectories": [
       "~/projects/clients/*/wiki",
       "~/projects/clients/*/repo",
       "~/projects/clients/*/tmp",
       "~/projects/simpleapps/*/wiki",
       "~/projects/simpleapps/*/repo",
       "~/projects/simpleapps/*/tmp"
     ]
   }
   ```
   This is a global setting. Ask the user before modifying `~/.claude/settings.json`. If already configured, report it as already set up.
10. Check if the augur-skills bin directory is in the user's PATH:
   - The bin path is: `$HOME/.claude/plugins/marketplaces/augur-skills/plugins/simpleapps/bin`
   - Run `grep -q 'augur-skills/plugins/simpleapps/bin' ~/.zshrc` to check
   - If not found, append the export line to `~/.zshrc` using the Edit tool:
     ```
     # SimpleApps augur-skills bin scripts
     export PATH="$PATH:$HOME/.claude/plugins/marketplaces/augur-skills/plugins/simpleapps/bin"
     ```
   - Tell the user to run `source ~/.zshrc` or open a new terminal for the change to take effect
   - If already present, report it as already configured
11. Check if a status line is configured. Read `~/.claude/settings.json` and check for a `statusLine` field. If missing, suggest setting one up. Two options are available via the plugin bin scripts:
   - `statusline-basic`: model, project name, version
   - `statusline-full`: model, project name, git branch, version, context %
   Ask the user which they prefer, then add to `~/.claude/settings.json`:
   ```json
   { "statusLine": { "type": "command", "command": "statusline-basic" } }
   ```
   If already configured, report it as already set up.
12. Check GitHub labels. Determine the repo from `git -C repo remote -v`. List existing labels with `gh label list --repo <org>/<repo>`. Compare against the standard set:

   **Type labels:**
   | Label | Color | Purpose |
   |-------|-------|---------|
   | `bug` | `d73a4a` | Broken behavior users can see |
   | `security` | `e11d48` | Exploitable vulnerability |
   | `a11y` | `7c3aed` | Accessibility |
   | `perf` | `7dd3fc` | Performance / Core Web Vitals |
   | `SEO` | `14b8a6` | Search engine optimization |
   | `enhancement` | `0075ca` | New feature |
   | `refactor` | `a855f7` | Code quality, no user impact |

   **Status labels:**
   | Label | Color | Purpose |
   |-------|-------|---------|
   | `production-blocker` | `7f1d1d` | Must resolve before/to stay in production |
   | `blocked` | `fbbf24` | Waiting on external dependency |

   For each missing label, create it: `gh label create "<name>" --color "<color>" --description "<purpose>" --repo <org>/<repo>`

   Report which labels were created and which already existed.
13. Final verification: `ls -la .claude/`

## Output

Report what was checked, what was created, and what was already correct. Use a simple checklist format:

- [x] `repo/` exists
- [x] `wiki/` exists
- [ ] `wip/` created
- [x] `.claude/rules` → `repo/.claude/rules`

MUST NOT create `repo/` or `wiki/` with `mkdir`. These are git clones.

If `repo/` or `wiki/` is missing, MUST ask the user for the correct repo name before cloning. Do not guess or infer from the current directory or plugin. Once confirmed:
- `gh repo clone simpleapps-com/<name> repo`
- `gh repo clone simpleapps-com/<name>.wiki wiki`
