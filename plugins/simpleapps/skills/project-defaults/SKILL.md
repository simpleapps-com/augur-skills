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
│   ├── augur-skills/
│   ├── augur-packages/
│   └── augur/
└── clients/             # Client site repos
    ├── ampro-online/
    └── directsupplyinc/
```

- Internal repos go in `~/projects/simpleapps/`
- Client site repos go in `~/projects/clients/`

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
└── .simpleapps/        # Credentials (not in git)
```

The parent `{project}/` is NOT a git repo — it keeps code and wiki side-by-side. The git repo is always at `repo/`. Use `git -C repo` for git operations from the project root.

| Content | Location | Examples |
|---------|----------|---------|
| Product code | `repo/` | Source, tests, configs, SKILL.md files |
| Dev documentation | `wiki/` | Architecture, guides, specs, conventions |
| Repo `.claude/rules/` | `repo/` | Minimal summaries referencing wiki |
| Repo `.claude/CLAUDE.md` | `repo/` | Quick reference + wiki links |
| Active task context | `wip/` | `{issue-number}-{short-desc}.md` files |
| Temporary files | `tmp/` | Throwaway files, scratch space, build artifacts |
| Project secrets | `{project}/.simpleapps/` | Site-specific credentials |
| Global secrets | `~/.simpleapps/` | Shared credentials across all projects |

**WIP**: Research, plans, decisions, test results. MUST NOT contain secrets, final docs, or code.

**Credentials**: Project-level (`.simpleapps/`) overrides user-level (`~/.simpleapps/`). MUST NOT be committed.

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
  "permissions": {
    "allow": [
      "Bash(pnpm:*)"
    ],
    "deny": [
      "Bash(cd:*)",
      "Bash(cat:*)",
      "Bash(sed:*)",
      "Bash(grep:*)",
      "Bash(sleep:*)",
      "Bash(kill:*)",
      "Bash(pkill:*)",
      "Bash(find:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(awk:*)",
      "Bash(rg:*)"
    ]
  }
}
```

Why each is denied:

- **`cd`** — MUST NOT use in any Bash command, including compound commands (`cd /path && git`). Use `git -C repo` for git, path arguments for everything else. Compound cd+git commands trigger an unblockable Claude Code security prompt that interrupts the user even when `cd` is denied.
- **`cat`** — Use the Read tool instead.
- **`sed`** — Use the Edit tool instead.
- **`grep`** — Use the Grep tool instead.
- **`sleep`** — Unnecessary; use proper sequencing or background tasks.
- **`find`** — Use the Glob tool instead.
- **`head`/`tail`** — Use the Read tool with `offset` and `limit` parameters instead.
- **`awk`** — Use the Edit tool instead.
- **`rg`** — Use the Grep tool instead (it uses ripgrep internally).
- **`kill`/`pkill`** — Use `TaskStop` to manage background processes. For internal tasks running in the background (dev servers, watchers, etc.), always use `TaskStop` instead of shell kill commands. `TaskStop` cleanly shuts down the task and updates Claude Code's internal tracking.

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
