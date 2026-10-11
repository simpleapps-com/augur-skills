---
name: project-init
description: Check and fix the project directory structure. Create missing folders, set up symlinks, clone repos, verify layout.
argument-hint: "[repo-name]"
allowed-tools: Bash(ls:*), Bash(mkdir:*), Bash(ln:*), Bash(readlink:*), Bash(unlink:*), Bash(rmdir:*), Bash(gh repo clone:*), Bash(gh label:*), Bash(gh api user:*), Bash(git -C repo ls-files:*), Bash(pnpm --dir repo install:*), Bash(grep:*), Bash(cp:*), Bash(md5sum:*), Bash(md5:*), Read, Write, Edit, Skill(project-defaults), Skill(bash-simplicity), Skill(context-efficiency)
---

First, use Skill("project-defaults") to load project conventions.

Check the current project directory against the expected layout and fix any issues found. If a repo name is provided as an argument, use it to clone missing repos.

## Steps

Run each command as a separate, simple call. MUST NOT combine commands.

1. Check which directories exist: `ls -la` in the current directory
2. For each missing directory, create it:
   - `mkdir -p clones` (if missing)
   - `mkdir -p goals` (if missing)
   - `mkdir -p wip` (if missing)
   - `mkdir -p tmp` (if missing)
   - `mkdir -p .simpleapps` (if missing)

   MUST NOT create `.claude` with `mkdir`; it is a symlink (step 5). MUST NOT create repo-specific folders such as `work/`; the repo's onboarding procedure owns those (step 15).
3. Check current symlink state: `readlink CLAUDE.md`, `readlink .claude`, and `readlink .mcp.json`
4. If `repo/` exists, ensure symlink targets exist:
   - `mkdir -p repo/.claude/rules` (if missing)
   - `mkdir -p repo/.claude/commands` (if missing)
   - `mkdir -p repo/.claude/prompts` (if missing)
   - `mkdir -p repo/.claude/hooks` (if missing)
   - For `repo/.claude/settings.json`: run `ls repo/.claude/settings.json`. If missing, create it with the Write tool as an empty stub: `{}`. Report it as created (stub). Do NOT touch `settings.local.json` here. Step 8 handles it.
   - For `repo/.claude/CLAUDE.md`: run `ls repo/.claude/CLAUDE.md`. If missing, create it with the Write tool using this minimal stub (substitute `<repo-name>` from the git remote or the command argument):
     ```markdown
     # <repo-name>

     Project memory. See the wiki for full dev docs:

     - [Home](../../wiki/Home.md)
     - [Architecture](../../wiki/Architecture.md)
     - [Development](../../wiki/Development.md)
     - [Deployment](../../wiki/Deployment.md)
     ```
     Report it as created (stub) and tell the user to flesh it out with a quick reference.
5. Create or fix symlinks:
   a. **Migrate an old `.claude/` folder.** If step 3 showed `.claude` is a real directory (old per-item layout), run `ls -la .claude`. For each entry:
      - A symlink into `repo/.claude/` (`settings.json`, `rules`, `commands`, `prompts`, `hooks`): `unlink .claude/<name>`
      - A real `settings.local.json`: run `ls repo/.claude/settings.local.json`. If that exists too, STOP and ask the user which to keep. Otherwise Read `.claude/settings.local.json`, Write its content unchanged to `repo/.claude/settings.local.json`, then `unlink .claude/settings.local.json`. Step 8c screens it for secrets and merges it into `settings.<login>.json`; MUST NOT merge it here
      - Anything else: STOP and ask the user. MUST NOT delete files the migration does not recognise

      Then `rmdir .claude`.
   b. `.claude` → `repo/.claude`: if `readlink .claude` already prints `repo/.claude`, skip. If `.claude` is a symlink to anything else, `unlink .claude` first. Then `ln -s repo/.claude .claude`. MUST NOT use `ln -sf` here: when `.claude` is an existing symlink to a directory, `ln -sf` creates the new link *inside* the target instead of replacing it.
   c. `ln -sf repo/.claude/CLAUDE.md CLAUDE.md`
   d. `.mcp.json`: run `ls repo/.mcp.json`. If it exists, `ln -sf repo/.mcp.json .mcp.json`. If it does not exist, skip. If `{project}/.mcp.json` is a real file (not a symlink), MUST NOT overwrite it: report it and ask whether to move it into the repo.
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
8. Set up per-user settings (see `project-defaults` "settings.local.json and settings.<login>.json"):
   a. Resolve `<login>`: `gh api user --jq .login`. If `gh` is not authenticated, ask the user to run `gh auth login` first. MUST NOT guess the login
   b. Check `repo/.claude/settings.<login>.json` with Read. If missing, create it with the Write tool from the Permission Defaults in the `project-defaults` skill
   c. Link `settings.local.json`:
      - Run `git -C repo ls-files .claude/settings.local.json`. If it prints the path, the file is tracked by git and `.gitignore` alone will not untrack it. Report that it MUST be untracked with `git -C repo rm --cached .claude/settings.local.json`, a git write the user runs or approves; MUST NOT run it here. Continue with the steps below
      - Check `readlink repo/.claude/settings.local.json`. If it prints `settings.<login>.json`, skip the rest of 8c
      - If `repo/.claude/settings.local.json` is a real file (including one moved there by step 5a), Read it. `settings.<login>.json` is committed, so MUST check the real file for secrets before merging: `env` values that look like tokens, keys, or passwords; names containing `TOKEN`, `KEY`, `SECRET`, or `PASSWORD`; `apiKeyHelper`; `Authorization` headers. MUST NOT copy a secret into `settings.<login>.json`: list each one for the user and suggest `~/.claude/settings.json` (user scope, never committed). Merge everything else into `settings.<login>.json`, then `unlink repo/.claude/settings.local.json`
      - `ln -sf settings.<login>.json repo/.claude/settings.local.json` (relative target: the link lives in the same folder)
   d. Run `grep -n "settings.local.json" repo/.gitignore`. If no match, add `.claude/settings.local.json` to `repo/.gitignore` with Edit (or Write if the file does not exist)

   Then check `repo/.claude/settings.<login>.json` with Read. If missing deny rules, update it with the standard settings from the `project-defaults` skill, including the `env` block with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY`, `CLAUDE_CODE_NO_FLICKER`, and the full allow/deny lists. If the file exists but is missing the `env` block or any env vars, add them. `CLAUDE_CODE_NO_FLICKER` MUST be set to `"1"`. This enables fullscreen rendering that eliminates terminal flicker.

   **Stale-deny migration:** older settings deny `Bash(grep:*)`, `Bash(find:*)`, and `Bash(rg:*)`. On macOS, Linux, and WSL, Claude Code leaves the Grep and Glob tools out by default, so those denies leave the agent no way to search. When updating an existing `settings.<login>.json`:
   - If `Bash(grep:*)` appears in `permissions.deny`, remove it from `deny` and add it to `allow` (alphabetical position).
   - Same for `Bash(find:*)` and `Bash(rg:*)`.
   - Report each migration: e.g., "Migrated `Bash(grep:*)` from deny to allow (Bash search is the default where the Grep tool is absent)."
   - Leave the other denies (`cat`, `sed`, `awk`, `head`, `tail`, `cd`, `for`, `kill`, `pkill`, `sleep`) intact: those still have dedicated-tool replacements (Read, Edit, etc.).

   **`autoMode` MUST NOT be written here.** Claude Code reads `autoMode` from user settings, the `--settings` flag, and managed settings only; it is ignored in `.claude/settings.json` and `.claude/settings.local.json`. If an `autoMode` block is found in either project file, report it as non-functional and move it to `~/.claude/settings.json` (step 8e).

8e. Check the auto-mode push guardrail. Read `~/.claude/settings.json` and look for `autoMode.hard_deny` containing `Bash(git push:*)`. If missing, ask the user before adding:
   ```json
   {
     "autoMode": {
       "hard_deny": [
         "Bash(git push:*)"
       ]
     }
   }
   ```
   This is what makes the `simpleapps:git-safety` rule enforceable in auto mode: `hard_deny` blocks the classifier from auto-approving a push regardless of allow rules. Manual approval at the prompt still works. This is a global setting; ask before modifying. If already configured, report it as already set up.
9. Check the project boundary. Agents stay inside `{project}/` and read other repos through `clones/` (see `project-defaults` "clones/"). MUST NOT suggest `permissions.additionalDirectories` for other project folders. Read `~/.claude/settings.json`; if `permissions.additionalDirectories` lists globs such as `~/projects/*/repo` or `~/projects/*/wiki`, report them as superseded by `clones/` and ask the user before removing them. A top-level `additionalDirectories` key (outside `permissions`) is invalid and fails Claude Code's settings validation; report it as invalid and ask before removing it. This is a global setting.
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
13. Install dependencies. Run `ls repo/package.json`. If it exists, run `pnpm --dir repo install`. That also runs the repo's `prepare` script (e.g. `lefthook install` for git hooks). If it does not exist, skip.
14. Final verification: `ls -la` (confirms the `CLAUDE.md`, `.claude`, and `.mcp.json` symlinks) and `ls -la repo/.claude/` (confirms the `settings.local.json` symlink)
15. Hand off to the repo's own onboarding. Run `ls repo/procedures/onboarding.md`. If it exists, end the report by telling the user to ask Claude to follow `repo/procedures/onboarding.md`. Repo-specific setup (MCP sign-ins, per-person data, folders like `work/`) lives there, not in this command. If it does not exist, skip.

## Output

Report what was checked, what was created, and what was already correct. Use a simple checklist format:

- [x] `repo/` exists
- [x] `wiki/` exists
- [ ] `clones/` created
- [ ] `goals/` created
- [ ] `wip/` created
- [x] `CLAUDE.md` → `repo/.claude/CLAUDE.md`
- [x] `.claude` → `repo/.claude`
- [x] `.mcp.json` → `repo/.mcp.json` (or: skipped, no `repo/.mcp.json`)
- [x] `repo/.claude/settings.local.json` → `settings.<login>.json`, gitignored
- [x] Dependencies installed (or: skipped, no `repo/package.json`)
- [x] `~/.claude/settings.json` `autoMode.hard_deny` blocks `git push`
- Next: ask Claude to follow `repo/procedures/onboarding.md` (only when it exists)

MUST NOT create `repo/` or `wiki/` with `mkdir`. These are git clones.

If `repo/` or `wiki/` is missing, MUST ask the user for the correct repo name before cloning. Do not guess or infer from the current directory or plugin. Once confirmed:
- `gh repo clone simpleapps-com/<name> repo`
- `gh repo clone simpleapps-com/<name>.wiki wiki`
