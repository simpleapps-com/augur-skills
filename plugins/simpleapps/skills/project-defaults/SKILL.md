---
name: project-defaults
description: SimpleApps project conventions. Covers directory layout, symlink setup for .claude integration, permission defaults (deny cd, kill), and per-project baseline settings. Use when setting up projects, checking structure, or configuring Claude Code defaults.
allowed-tools:
  - Read
  - Bash
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
├── .claude/            # Claude Code config (symlinks to repo/.claude/)
│   ├── rules/          # → repo/.claude/rules/
│   └── commands/       # → repo/.claude/commands/
├── repo/               # Git repo (simpleapps-com/<name>.git)
├── wiki/               # Wiki repo (simpleapps-com/<name>.wiki.git)
├── wip/                # Work-in-progress files (not in git)
├── tmp/                # Temporary files (not in git)
└── .simpleapps/        # Config, credentials, site profile (not in git)
```

The parent `{project}/` is NOT a git repo. It keeps code and wiki side-by-side. The git repo is always at `repo/`. Use `git -C repo` for git operations from the project root.

| Content | Location | Examples |
|---------|----------|---------|
| Product code | `repo/` | Source, tests, configs, SKILL.md files |
| Dev documentation | `wiki/` | Architecture, guides, specs, conventions |
| Repo `.claude/rules/` | `repo/` | Minimal summaries referencing wiki |
| Repo `.claude/CLAUDE.md` | `repo/` | Quick reference + wiki links |
| Active task context | `wip/` | `{issue-number}-{short-desc}.md` files |
| Temporary files | `tmp/` | Scratch space: commit msgs, PR bodies, intermediate output. Full access. |
| SimpleApps config | `.simpleapps/` | Settings, site profile, credentials (see below) |

**WIP**: Research, plans, decisions, test results. MUST NOT contain secrets, final docs, or code.

**tmp/**: Fully available for scratch work: commit messages, PR bodies, issue comments, intermediate output, and any throwaway files. Read, write, and delete freely without asking. Create the folder if missing. Clean up files after use.

## Plugin Rules

The plugin ships rule templates in `plugins/simpleapps/rules/` that MUST exist in every project's `repo/.claude/rules/`. Rules are always loaded into context. They enforce baseline guardrails (like git safety) without depending on a skill being invoked. The `/project-init` command copies missing rules from the plugin into the project.

## .simpleapps/ Configuration

Two scopes, project overrides user:

```
~/.simpleapps/                    # User global
├── settings.json                 # Config (projectRoot, orgName)
├── basecamp.json                 # Basecamp MCP credentials
└── augur-api.json                # Augur API MCP credentials

{project}/.simpleapps/            # Project (gitignored)
├── settings.json                 # Project config overrides
├── site.json                     # Site profile (defaults, PII, auth)
├── basecamp.json                 # Project basecamp overrides (if needed)
└── augur-api.json                # Project augur-api overrides (if needed)
```

### File types

| File | Scope | Purpose | Read by |
|------|-------|---------|---------|
| `settings.json` | Global + project | Infrastructure config | All skills via project-defaults |
| `site.json` | Project only | Site profile: defaults, search terms, PII, auth | Skills needing site context |
| `basecamp.json` | Global + project | Basecamp MCP credentials | Basecamp MCP server |
| `augur-api.json` | Global + project | Augur API MCP credentials | Augur API MCP server |

### settings.json

```json
{
  "projectRoot": "~/projects"
}
```

Resolution: read `{project}/.simpleapps/settings.json` first, fall back to `~/.simpleapps/settings.json`, fall back to defaults. Field-level override: project wins for any field it defines.

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

## Symlink Setup

The repo contains `.claude/rules/` and `.claude/commands/` with project-specific rules and commands. To make these active from the project root (without starting Claude Code inside `repo/`), symlink them into the project-level `.claude/` folder:

```bash
mkdir -p {project}/.claude
mkdir -p {project}/repo/.claude/rules {project}/repo/.claude/commands
ln -sf ../repo/.claude/rules {project}/.claude/rules
ln -sf ../repo/.claude/commands {project}/.claude/commands
```

This lets you run Claude Code from `{project}/` and still get the repo's rules and commands loaded automatically.

## Permission Defaults

Every project SHOULD configure `.claude/settings.local.json` with these deny rules:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY": "1",
    "CLAUDE_CODE_NO_FLICKER": "1"
  },
  "permissions": {
    "allow": [
      "Bash(pnpm:*)",
      "Bash(ls:*)",
      "Bash(wc:*)",
      "Bash(md5:*)",
      "Bash(md5sum:*)",
      "Bash(readlink:*)",
      "Bash(which:*)",
      "Bash(basename:*)",
      "Bash(dirname:*)",
      "Bash(pwd:*)",
      "Bash(lsof:*)",
      "mcp__plugin_simpleapps_augur-api__*"
    ],
    "deny": [
      "Bash(awk:*)",
      "Bash(cat:*)",
      "Bash(cd:*)",
      "Bash(find:*)",
      "Bash(for:*)",
      "Bash(grep:*)",
      "Bash(head:*)",
      "Bash(kill:*)",
      "Bash(pkill:*)",
      "Bash(rg:*)",
      "Bash(sed:*)",
      "Bash(sleep:*)",
      "Bash(tail:*)",
      "Edit(~/.claude/plugins/**)",
      "Write(~/.claude/plugins/**)"
    ]
  }
}
```

Why each is denied:

- **`awk`**: Use the Edit tool instead.
- **`cat`**: Use the Read tool instead.
- **`cd`**: MUST NOT use in any Bash command, including compound commands (`cd /path && git`). Use `git -C repo` for git, path arguments for everything else. Compound cd+git commands trigger an unblockable Claude Code security prompt that interrupts the user even when `cd` is denied.
- **`find`**: Use the Glob tool instead.
- **`for`**: Shell loops are unnecessary; use dedicated tools or make multiple tool calls instead.
- **`grep`**: Use the Grep tool instead.
- **`head`/`tail`**: Use the Read tool with `offset` and `limit` parameters instead.
- **`kill`/`pkill`**: Use `TaskStop` to manage background processes. `TaskStop` cleanly shuts down the task and updates Claude Code's internal tracking.
- **`rg`**: Use the Grep tool instead (it uses ripgrep internally).
- **`sed`**: Use the Edit tool instead.
- **`sleep`**: Unnecessary; use proper sequencing or background tasks.
- **`Edit(~/.claude/plugins/**)` / `Write(~/.claude/plugins/**)`**: The installed plugin tree is a cache. Marketplace updates clobber it. To change plugin behavior, edit the plugin's source repo (e.g., `~/projects/simpleapps/augur-skills/`) instead.

## Bin Scripts (PATH)

The augur-skills plugin includes shell scripts (`cld`, `cldo`, `tmcld`, etc.) in `plugins/simpleapps/bin/`. When installed via the Claude Code marketplace, these live at:

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

```bash
mkdir {project} && cd {project}
git clone https://github.com/simpleapps-com/<name>.git repo
git clone https://github.com/simpleapps-com/<name>.wiki.git wiki
mkdir -p wip tmp .simpleapps .claude
mkdir -p repo/.claude/rules repo/.claude/commands
ln -sf ../repo/.claude/rules .claude/rules
ln -sf ../repo/.claude/commands .claude/commands
```
