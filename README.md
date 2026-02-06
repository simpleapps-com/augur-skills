# augur-skills

Curated skills marketplace for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

## Overview

**augur-skills** is both a Claude Code plugin marketplace and an npm package for distributing skills to less technical users.

### Architecture

```
augur-skills (marketplace)
├── plugin-a (bundle of related skills)
│   ├── skill-1
│   ├── skill-2
│   └── skill-3
└── plugin-b
    ├── skill-4
    └── skill-5
```

- **Marketplace** = this repo. One marketplace, many plugins.
- **Plugin** = a bundle of related skills (+ optional agents, commands, hooks).
- **Skill** = an individual `SKILL.md`. Namespaced as `plugin:skill`.

## Installation

### For Claude Code Users (Marketplace)

```bash
/plugin marketplace add simpleapps-com/augur-skills
/plugin install <plugin>@augur-skills
```

### For npm Users

```bash
# List available skills
npx augur-skills list

# Install all skills from a plugin (user scope)
npx augur-skills install <plugin>

# Install a single skill
npx augur-skills install <plugin>:<skill>

# Install into current project
npx augur-skills install <plugin> --scope project

# Uninstall
npx augur-skills uninstall <plugin>
```

### Install Scopes

| Scope | Target | Use Case |
|-------|--------|----------|
| `--scope user` (default) | `~/.claude/skills/` | Available across all projects |
| `--scope project` | `.claude/skills/` | Scoped to current project, committable |

## Creating Plugins

Each plugin lives under `plugins/<name>/`:

```
plugins/my-plugin/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── my-skill/
│       └── SKILL.md
├── commands/        # optional
├── agents/          # optional
└── README.md
```

### SKILL.md Format

Every skill MUST have YAML frontmatter:

```yaml
---
name: my-skill
description: What this skill does
version: 1.0.0
---

# My Skill

Skill instructions in markdown...
```

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm test:coverage
pnpm typecheck
pnpm validate-skills
```

## Tech Stack

- **pnpm** - Package manager + workspaces
- **TypeScript** - CLI source
- **tsup** - ESM bundler
- **vitest** - Testing (100% coverage)
- **commander** - CLI parsing
- **Node 18+** - Runtime

## License

MIT
