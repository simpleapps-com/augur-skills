---
name: project-defaults
description: SimpleApps project conventions. Covers directory layout, symlink setup for .claude integration, permission defaults (deny cd, kill), and per-project baseline settings. Use when setting up projects, checking structure, or configuring Claude Code defaults.
---

# Project Defaults

## Directory Layout

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
ln -sf ../repo/.claude/rules {project}/.claude/rules
ln -sf ../repo/.claude/commands {project}/.claude/commands
```

This lets you run Claude Code from `{project}/` and still get the repo's rules and commands loaded automatically.

## Permission Defaults

Every project SHOULD configure `.claude/settings.local.json` with these deny rules:

```json
{
  "permissions": {
    "deny": [
      "Bash(cd:*)",
      "Bash(cat:*)",
      "Bash(sed:*)",
      "Bash(grep:*)",
      "Bash(sleep:*)",
      "Bash(kill:*)",
      "Bash(pkill:*)"
    ]
  }
}
```

Why each is denied:

- **`cd`** — Use `git -C` or tool-specific flags (`--repo`, `-C`) instead. `cd` loses working directory context.
- **`cat`** — Use the Read tool instead.
- **`sed`** — Use the Edit tool instead.
- **`grep`** — Use the Grep tool instead.
- **`sleep`** — Unnecessary; use proper sequencing or background tasks.
- **`kill`/`pkill`** — Use `TaskStop` to manage background processes. For internal tasks running in the background (dev servers, watchers, etc.), always use `TaskStop` instead of shell kill commands. `TaskStop` cleanly shuts down the task and updates Claude Code's internal tracking.

## New Project Setup

```bash
mkdir {project} && cd {project}
git clone https://github.com/simpleapps-com/<name>.git repo
git clone https://github.com/simpleapps-com/<name>.wiki.git wiki
mkdir -p wip tmp .simpleapps .claude
ln -sf ../repo/.claude/rules .claude/rules
ln -sf ../repo/.claude/commands .claude/commands
```
