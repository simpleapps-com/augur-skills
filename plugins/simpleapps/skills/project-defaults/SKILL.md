---
name: project-defaults
description: SimpleApps project conventions for directory layout, .claude integration, permission defaults, and .simpleapps/ configuration. Load when setting up projects, checking structure, or configuring Claude Code defaults.
allowed-tools:
  - Read
  - Bash
user-invocable: false
---

# Project Defaults

## Base Directory Standard

All projects live under `~/projects/` in two groups:

```
~/projects/
├── simpleapps/          # Internal repos (augur-*, shared infra)
│   └── <repo-name>/
├── clients/             # Client site repos
│   └── <site-name>/
└── workspaces/          # VSCode/Cursor workspace files
    └── <project-name>.code-workspace
```

- Internal repos go in `~/projects/simpleapps/`
- Client site repos go in `~/projects/clients/`
- Workspace files go in `~/projects/workspaces/`, one `.code-workspace` per project

macOS APFS is case-insensitive by default. `~/Projects/` and `~/projects/` resolve to the same directory. Do NOT flag path casing differences as errors. Only flag paths that genuinely do not resolve.

## Project Directory Layout

Every project MUST use this layout:

```
{project}/
├── CLAUDE.md           # → repo/.claude/CLAUDE.md
├── .claude             # → repo/.claude (whole folder, one symlink)
├── .mcp.json           # → repo/.mcp.json (only when the repo has one)
├── repo/               # Git repo (simpleapps-com/<name>.git)
│   └── .claude/
│       ├── CLAUDE.md
│       ├── settings.json            # Shared, committed
│       ├── settings.<login>.json    # Per-user, committed (<login> = GitHub login)
│       ├── settings.local.json      # → settings.<login>.json, gitignored
│       └── rules/ commands/ prompts/ hooks/
├── wiki/               # Wiki repo (simpleapps-com/<name>.wiki.git)
├── clones/             # Read-only clones of other repos and wikis (not in git)
├── goals/              # Active goal tracking (not in git)
├── wip/                # Work-in-progress files (not in git)
├── tmp/                # Temporary files (not in git)
├── worktrees/          # Git worktrees of repo/, made by Claude Code (not in git)
└── .simpleapps/        # Config, credentials, site profile (not in git)
```

Repo-specific folders (e.g. a `work/` folder for per-person data) MUST NOT be added to this standard layout. The repo's own onboarding procedure creates them (see `/project-init`).

The parent `{project}/` is NOT a git repo. It keeps code and wiki side-by-side. The git repo is always at `repo/`. Use `git -C repo` for git operations from the project root.

**Default branch: `main`.** Code repos are moving from `master` to `main`; new repos MUST use `main`. When an agent finds a code repo whose default branch is still `master` (`git -C repo symbolic-ref --short refs/remotes/origin/HEAD` prints `origin/master`), it MUST tell the user once per session that the standard is `main` and that `/project-init` walks through the rename, then carry on with `master`. It MUST NOT rename the branch itself. Wiki repos keep `master`: GitHub fixes that for `.wiki.git`.

| Content | Location | Examples |
|---------|----------|---------|
| Product code | `repo/` | Source, tests, configs, SKILL.md files |
| Dev documentation | `wiki/` | Architecture, guides, specs, conventions |
| Repo `.claude/rules/` | `repo/` | Minimal summaries referencing wiki |
| Repo `.claude/CLAUDE.md` | `repo/` | Quick reference + wiki links |
| Other repos and wikis | `clones/` | `clones/augur`, `clones/augur.wiki` (read-only) |
| Active goals | `goals/` | Current cycle/sprint objectives being tracked |
| Active task context | `wip/` | `{issue-number}-{short-desc}.md` files |
| Temporary files | `tmp/` | Scratch space: commit msgs, PR bodies, intermediate output. Full access. |
| Git worktrees | `worktrees/` | `worktrees/agent-<id>` from an isolated subagent (see below) |
| SimpleApps config | `.simpleapps/` | Settings, site profile, credentials (see below) |

**goals/**: Project-level scratch space (sibling of `repo/`) for the goals/objectives currently being worked. Short-lived: reviewed regularly, archived or deleted when the goal is met, like `wip/` but goal-scoped rather than task-scoped. Not in git; lives on one machine. MUST NOT hold durable team-shared goals (those go in `wiki/`) or secrets.

**clones/**: The project boundary. Agents MUST stay inside the current `{project}/` folder. Another repo or wiki MUST be read through `clones/<name>` or `clones/<name>.wiki`, NEVER by a path into another project folder (`~/projects/<group>/<other>/`). A Read blocked by `blockReadsOutsideWorkingDirectories` is the boundary working; MUST NOT route around it with `ls`, `rg`, or `git -C`.
- Pull before reading: `git -C clones/<name> pull`
- Missing clone: ask the user, then `gh repo clone simpleapps-com/<name> clones/<name>` (wiki: `gh repo clone simpleapps-com/<name>.wiki clones/<name>.wiki`)
- Read-only: MUST NOT edit, commit, or push in `clones/`. To change another repo, file an issue there (`/file-issue`)
- Not in git; lives on one machine

**WIP**: Research, plans, decisions, test results. MUST NOT contain secrets, final docs, or code. See `simpleapps:wip-conventions` for the frontmatter schema, status lifecycle, retention rule, and daily processing via `/process-wips`.

**tmp/**: Project-level scratch space (sibling of `repo/`) for commit messages, PR/issue bodies, intermediate output, and throwaway files. Read, write, and delete freely without asking; create the folder if missing; clean up after use.

MUST keep scratch files in the **project-level** `tmp/`, NEVER `repo/tmp/` (or `wiki/tmp/`). Files inside a git tree get swept into commits by `git add -A`/`git add .`; a real incident put `tmp/commit-msg.txt` onto a project's main branch this way. A repo MUST NOT have a `tmp/` folder at all, and its `.gitignore` needs no `tmp/` entry: scratch space lives outside the tree, so the accident cannot happen.

`tmp/` is emptied regularly: `/process-wips` (daily) and `/project-init` delete everything in it older than one day with `find tmp -mindepth 1 -mtime +0 -delete`. The one-day margin protects files a running session still needs. Anything worth keeping MUST NOT live in `tmp/`: findings go in `wip/`, durable knowledge in `wiki/`.

Standard patterns. Note the `../tmp/` indirection: `git -C repo` / `git -C wiki` resolves `-F` and other paths relative to that subdir, so a plain `tmp/` would wrongly mean `repo/tmp/`:
- Commit message → Write `tmp/commit-msg.txt`, then `git -C repo commit -F ../tmp/commit-msg.txt`
- Wiki commit → Write `tmp/commit-msg.txt`, then `git -C wiki commit -F ../tmp/commit-msg.txt`
- PR body → Write `tmp/pr-body.txt`, then `gh pr create ... --body-file tmp/pr-body.txt` (gh runs from the project root, so plain `tmp/` is correct, no `../`)
- Issue body/comment → Write `tmp/issue-*.txt`, then `gh issue ... --body-file tmp/issue-*.txt`
- Clean up with `rm tmp/<file>` after each op

See `simpleapps:github` for the full git/gh command conventions.

**worktrees/**: Git worktrees of `repo/`, one folder per worktree, not in git. The plugin's `WorktreeCreate` hook (Claude Code 2.1.300+) puts every worktree Claude Code makes (`EnterWorktree`, `claude -w`, subagent `isolation: "worktree"`) at `worktrees/<name>`, **detached** at the fetched default branch, so no local branch is created and none is left to clean up. A new worktree holds only what is pushed to the default branch: not uncommitted changes in `repo/`, and not commits on a local branch. Work a subagent needs MUST be pushed first, or its briefing MUST say the worktree does not have it. Optional: Claude Code's `"worktree": { "baseRef": "head" }` setting (in `.claude/settings.local.json`, `.claude/settings.json`, or `~/.claude/settings.json`) starts worktrees at `repo/`'s current commit instead, so local commits come along; uncommitted changes never do. The hook reads those files itself, so `--settings` and managed settings do not apply. Worktrees MUST NOT be created by hand in `tmp/`, `clones/`, or inside `repo/`.

A session or subagent in a worktree is sealed inside it by Claude Code: writes and `git -C` outside it are blocked, even with `--add-dir`, and `blockReadsOutsideWorkingDirectories` blocks reads of `wip/`, `tmp/`, `wiki/`, and `repo/`. Workflow commands (`/wip` through `/submit`) MUST therefore run from `{project}/`, and a subagent's brief MUST carry the WIP and wiki content it needs. Parallel work goes to a subagent with `isolation: "worktree"`; the main session stays in `{project}/` and works on the result by path:
- Install first: subagent worktrees skip it to stay fast, and git hooks need it. `pnpm --dir worktrees/<name> install --frozen-lockfile`, then, where the repo uses lefthook, `pnpm --dir repo exec lefthook install` (the install points the shared git hooks at the worktree, which breaks pushes once it is removed; the hook does this itself for named worktrees)
- Review and test: `git -C worktrees/<name> status`, `pnpm --dir worktrees/<name> test`
- Commit: `git -C worktrees/<name> commit -F ../../tmp/commit-msg.txt` (paths resolve from the worktree, two levels down)
- Push: HEAD is detached, so name the branch: `git -C worktrees/<name> push origin HEAD:refs/heads/<type>/<N>-<slug>`
- Remove once pushed or merged: `git -C repo worktree remove ../worktrees/<name>`, then `git -C repo fetch --prune origin`. Before removing, `git -C worktrees/<name> log --oneline HEAD --not --remotes` MUST print nothing: git refuses only on uncommitted files, so a commit no remote holds would be orphaned

Cleanup is automatic where it is safe. The hook keeps any worktree holding work: uncommitted or untracked changes, commits no branch or remote holds, or a checked-out branch. An unchanged subagent worktree is removed when the subagent finishes, and when the session ends every worktree it made or last re-entered that holds no work is removed (workflow agents' and named ones included; not on `/clear` or `/resume`, and never the folder the session is in). Session-end cleanup is best-effort: Claude Code gives session-end hooks about 1.5 s, and a plugin hook's own timeout may not raise it, so with several worktrees some can be left behind. Launching with `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS=30000 claude` gives it more time. One holding work is kept for the main session, and `/project-init` reports leftovers. Files listed in `repo/.worktreeinclude` (gitignore syntax) that are also gitignored, such as `.env`, are copied into every new worktree. `ExitWorktree` remove needs `discard_changes: true` for a hook-made worktree; that leaves the hook as the only check, and it still refuses a worktree holding work. MUST NOT commit with `--no-verify` when an install failed; install instead.

Limits: `claude -w --tmux` does not run a plugin hook. Matching subagents to `worktrees/agent-<id>` relies on observed naming, not documented behaviour; session-end cleanup catches what that misses. The Windows `pnpm` path is untested. In a plain repo (no `{project}/repo/`), worktrees go to `<repo>/.claude/worktrees/<name>`, also detached, and the hook replaces Claude Code's own worktree setup: no `worktree-<name>` branch, and `claude -w "#<PR>"` starts from the default branch, not the PR head.

## Plugin Rules

The plugin ships rule templates in `plugins/simpleapps/rules/` that MUST exist in every project's `repo/.claude/rules/`. Rules are always loaded into context. They enforce baseline guardrails (like git safety) without depending on a skill being invoked. The `/project-init` command copies missing rules from the plugin into the project.

## .simpleapps/ Configuration

Two scopes, project overrides user:

```
~/.simpleapps/                    # User global
└── settings.json                 # Config (projectRoot, orgName)

{project}/.simpleapps/            # Project (gitignored)
├── settings.json                 # Project config overrides
└── site.json                     # Site profile (defaults, PII, auth)
```

The Augur API and Basecamp MCP servers are hosted and sign in through Claude Code, so they read no `.simpleapps/` file. An `augur-api.json` or `basecamp.json` left from the retired local servers is unused and holds stale tokens, so it SHOULD be deleted.

### File types

| File | Scope | Purpose | Read by |
|------|-------|---------|---------|
| `settings.json` | Global + project | Infrastructure config | All skills via project-defaults |
| `site.json` | Project only | Site profile: defaults, search terms, PII, auth | Skills needing site context |

### settings.json

```json
{
  "projectRoot": "~/projects"
}
```

Resolution: read `{project}/.simpleapps/settings.json` first, fall back to `~/.simpleapps/settings.json`, fall back to defaults. Field-level override: project wins for any field it defines.

`.simpleapps/` is gitignored and lives on one machine. MUST NOT store anything here that the team needs to share, anything that should travel with the repo (e.g., wiki token budget overrides; those go in `wiki/Home.md` as HTML comments), or anything that MUST be reproducible on a fresh clone.

### site.json

One per client project. Consistent structure across all sites: same fields, different values. Replaces the old `{siteId}.json` pattern.

```json
{
  "siteId": "...",
  "siteName": "...",
  "auth": { },
  "defaults": { }
}
```

### Rules

- MUST NOT commit `.simpleapps/` to git. Contains PII and credentials.
- MUST NOT save site data to wiki or memory (PII)
- MUST NOT create `{siteId}.json` files. Use `site.json` instead.
- If old `{siteId}.json` files exist, `/project-init` will flag them for migration to `site.json`

### Resolution order

`{project}/.simpleapps/settings.json` is read first, then falls back to `~/.simpleapps/settings.json`. Project-level fields override user-level ones.

## settings.local.json and settings.<login>.json

Each user's local settings live in `repo/.claude/settings.<login>.json`, committed, so they carry over to a new machine or clone. `<login>` MUST come from `gh api user --jq .login` (e.g. `settings.simpleapps-io.json`).

`repo/.claude/settings.local.json` is a symlink to `settings.<login>.json` (relative target, same folder). The symlink differs per user, so `repo/.gitignore` MUST contain `.claude/settings.local.json`.

Because `settings.<login>.json` is committed, it MUST NOT contain secrets (tokens, API keys, passwords, `apiKeyHelper`). Those belong in `~/.claude/settings.json`, which is never committed.

## Symlink Setup

These symlinks let you run Claude Code from `{project}/` while everything it loads lives in the repo:

| Symlink | Target | Purpose |
|---------|--------|---------|
| `{project}/CLAUDE.md` | `repo/.claude/CLAUDE.md` | Project memory loaded at session start |
| `{project}/.claude` | `repo/.claude` | Settings, rules, commands, prompts, hooks. Anything added to `repo/.claude/` later appears automatically |
| `{project}/.mcp.json` | `repo/.mcp.json` | The team's shared MCP servers. Only when `repo/.mcp.json` exists |
| `repo/.claude/settings.local.json` | `settings.<login>.json` | Per-user settings (see above). Gitignored |

`CLAUDE.md` and `.mcp.json` link at the project root because Claude Code reads both from `{project}/`, outside `.claude/`.

`/project-init` creates and repairs all of them, and migrates a project whose `{project}/.claude/` is still a real folder of per-item symlinks.

## Permission Defaults

Every project SHOULD configure `repo/.claude/settings.<login>.json` (loaded as `settings.local.json`) with these rules. `env` and `permissions` are honoured at project scope; `autoMode` is NOT (see below):

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY": "1",
    "CLAUDE_CODE_NO_FLICKER": "1"
  },
  "permissions": {
    "allow": [
      "Bash(basename:*)",
      "Bash(cat:*)",
      "Bash(dirname:*)",
      "Bash(find:*)",
      "Bash(grep:*)",
      "Bash(ls:*)",
      "Bash(lsof:*)",
      "Bash(md5:*)",
      "Bash(md5sum:*)",
      "Bash(pnpm:*)",
      "Bash(pwd:*)",
      "Bash(readlink:*)",
      "Bash(rg:*)",
      "Bash(sed:*)",
      "Bash(wc:*)",
      "Bash(which:*)",
      "mcp__plugin_simpleapps_augur-api__*"
    ],
    "deny": [
      "Bash(cd:*)",
      "Bash(kill:*)",
      "Bash(pkill:*)"
    ],
    "ask": []
  }
}
```

**Deny reasons:**
- `cd` - Keeps the session inside the project folder (see "clones/"). Use `git -C repo` and path arguments instead
- `kill`/`pkill` - Protects the user's own processes. Use `TaskStop` for background tasks this session started; ask the user about anything else

The deny list is exactly these three. Older defaults also denied `cat`, `sed`, `awk`, `head`, `tail`, `for`, `sleep`, `Edit(~/.claude/plugins/**)`, and `Write(~/.claude/plugins/**)`; all are retired (`/project-init` removes them). A `Write(...)` file rule is never matched and Claude Code warns about it on every run.

## Auto Mode Guardrail (user settings only)

`autoMode` MUST live in **`~/.claude/settings.json`**, not in any project settings file. Claude Code reads `autoMode` from user settings, the `--settings` flag, and managed settings only; it is **ignored** in project `.claude/settings.json` and `.claude/settings.local.json`. A `hard_deny` written into a project file looks correct in review and silently protects nothing.

```json
{
  "autoMode": {
    "hard_deny": [
      "Bash(git push:*)"
    ]
  }
}
```

`hard_deny` blocks the auto-mode classifier from approving `git push` regardless of user intent or allow exceptions, which is what makes the `simpleapps:git-safety` guardrail (explicit user approval per push) enforceable in auto mode. Manual approval at the prompt still works.

`autoMode` also accepts `environment`, `allow`, and `soft_deny` arrays. Include the literal string `"$defaults"` in an array to inherit the built-in rules at that position.

## Bin Scripts (PATH)

The augur-skills plugin includes shell scripts in `plugins/simpleapps/bin/`. `cld` updates Claude Code and starts a session, passing every argument through to `claude` (`cld -c` continues, `cld -r` resumes). `cldf`, `cldh`, `cldo`, and `clds` delegate to `cld` with `--model fable|haiku|opus|sonnet` prepended, so they inherit the same behaviour. `upcld` updates without starting a session. When installed via the Claude Code marketplace, these live at:

```
~/.claude/plugins/marketplaces/augur-skills/plugins/simpleapps/bin/
```

To make them available on PATH, add to `~/.zshrc`:

```bash
# SimpleApps augur-skills bin scripts
export PATH="$PATH:$HOME/.claude/plugins/marketplaces/augur-skills/plugins/simpleapps/bin"
```

This path is stable across plugin updates (marketplace updates are git pulls). The `project-init` command checks for this and adds it if missing.

## New Project Setup

Use `/project-init` to set up a new project. This command verifies the directory structure, syncs plugin rules, and configures permissions automatically.

For manual setup (advanced), see the [wiki](../../../wiki/Development.md#local-setup) for the complete setup procedure.
