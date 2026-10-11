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
└── .simpleapps/        # Config, credentials, site profile (not in git)
```

Repo-specific folders (e.g. a `work/` folder for per-person data) MUST NOT be added to this standard layout. The repo's own onboarding procedure creates them (see `/project-init`).

The parent `{project}/` is NOT a git repo. It keeps code and wiki side-by-side. The git repo is always at `repo/`. Use `git -C repo` for git operations from the project root.

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
| SimpleApps config | `.simpleapps/` | Settings, site profile, credentials (see below) |

**goals/**: Project-level scratch space (sibling of `repo/`) for the goals/objectives currently being worked. Short-lived: reviewed regularly, archived or deleted when the goal is met, like `wip/` but goal-scoped rather than task-scoped. Not in git; lives on one machine. MUST NOT hold durable team-shared goals (those go in `wiki/`) or secrets.

**clones/**: The project boundary. Agents MUST stay inside the current `{project}/` folder. Another repo or wiki MUST be read through `clones/<name>` or `clones/<name>.wiki`, NEVER by a path into another project folder (`~/projects/<group>/<other>/`). A Read blocked by `blockReadsOutsideWorkingDirectories` is the boundary working; MUST NOT route around it with `ls`, `rg`, or `git -C`.
- Pull before reading: `git -C clones/<name> pull`
- Missing clone: ask the user, then `gh repo clone simpleapps-com/<name> clones/<name>` (wiki: `gh repo clone simpleapps-com/<name>.wiki clones/<name>.wiki`)
- Read-only: MUST NOT edit, commit, or push in `clones/`. To change another repo, file an issue there (`/file-issue`)
- Not in git; lives on one machine

**WIP**: Research, plans, decisions, test results. MUST NOT contain secrets, final docs, or code. See `simpleapps:wip-conventions` for the frontmatter schema, status lifecycle, retention rule, and daily processing via `/process-wips`.

**tmp/**: Project-level scratch space (sibling of `repo/`) for commit messages, PR/issue bodies, intermediate output, and throwaway files. Read, write, and delete freely without asking; create the folder if missing; clean up after use.

MUST keep scratch files in the **project-level** `tmp/`, NEVER `repo/tmp/` (or `wiki/tmp/`). Files inside a git tree get swept into commits by `git add -A`/`git add .`; a real incident put `tmp/commit-msg.txt` onto a project's main branch this way. Add `tmp/` to each repo's `.gitignore` as a safety net, but the convention is to stay outside the tree entirely so the accident cannot recur.

Standard patterns. Note the `../tmp/` indirection: `git -C repo` / `git -C wiki` resolves `-F` and other paths relative to that subdir, so a plain `tmp/` would wrongly mean `repo/tmp/`:
- Commit message → Write `tmp/commit-msg.txt`, then `git -C repo commit -F ../tmp/commit-msg.txt`
- Wiki commit → Write `tmp/commit-msg.txt`, then `git -C wiki commit -F ../tmp/commit-msg.txt`
- PR body → Write `tmp/pr-body.txt`, then `gh pr create ... --body-file tmp/pr-body.txt` (gh runs from the project root, so plain `tmp/` is correct, no `../`)
- Issue body/comment → Write `tmp/issue-*.txt`, then `gh issue ... --body-file tmp/issue-*.txt`
- Clean up with `rm tmp/<file>` after each op

See `simpleapps:github` for the full git/gh command conventions.

## Plugin Rules

The plugin ships rule templates in `plugins/simpleapps/rules/` that MUST exist in every project's `repo/.claude/rules/`. Rules are always loaded into context. They enforce baseline guardrails (like git safety) without depending on a skill being invoked. The `/project-init` command copies missing rules from the plugin into the project.

## .simpleapps/ Configuration

Two scopes, project overrides user:

```
~/.simpleapps/                    # User global
├── settings.json                 # Config (projectRoot, orgName)
└── basecamp.json                 # Basecamp MCP credentials

{project}/.simpleapps/            # Project (gitignored)
├── settings.json                 # Project config overrides
├── site.json                     # Site profile (defaults, PII, auth)
└── basecamp.json                 # Project basecamp overrides (if needed)
```

The Augur API MCP is hosted and signs in with OAuth, so it reads no `.simpleapps/` file. An `augur-api.json` left from the retired local server is unused and holds stale JWTs, so it SHOULD be deleted.

### File types

| File | Scope | Purpose | Read by |
|------|-------|---------|---------|
| `settings.json` | Global + project | Infrastructure config | All skills via project-defaults |
| `site.json` | Project only | Site profile: defaults, search terms, PII, auth | Skills needing site context |
| `basecamp.json` | Global + project | Basecamp MCP credentials | Basecamp MCP server |

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
      "Bash(wc:*)",
      "Bash(which:*)",
      "mcp__plugin_simpleapps_augur-api__*"
    ],
    "deny": [
      "Bash(cd:*)",
      "Bash(kill:*)",
      "Bash(pkill:*)",
      "Edit(~/.claude/plugins/**)",
      "Write(~/.claude/plugins/**)"
    ],
    "ask": []
  }
}
```

**Deny reasons:**
- `cd` - Use `git -C repo` instead; compound `cd && git` triggers unblockable prompts
- `kill`/`pkill` - Use `TaskStop` to manage background tasks
- `Edit(~/.claude/plugins/**)` / `Write(~/.claude/plugins/**)` - Plugin tree is a cache; edit source repo instead

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
