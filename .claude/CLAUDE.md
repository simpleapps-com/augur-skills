# augur-skills

## Project Overview
Monorepo serving as both a Claude Code plugin marketplace and npm package for distributing skills.

## Architecture
- **Marketplace**: `.claude-plugin/marketplace.json` at repo root
- **Plugins**: `plugins/<name>/` directories (NOT pnpm workspaces, static markdown)
- **CLI**: `packages/cli/` (pnpm workspace, npm package `augur-skills`)
- **Skills namespaced**: `plugin-name:skill-name`

## Key Commands
```bash
pnpm build          # Build CLI
pnpm test           # Run tests
pnpm test:coverage  # Run tests with coverage
pnpm typecheck      # TypeScript check
pnpm validate-skills # Validate SKILL.md frontmatter
```

## Conventions
- Plugins are directories under `plugins/`, each with `.claude-plugin/plugin.json`
- Skills live in `plugins/<name>/skills/<skill-name>/SKILL.md`
- CLI installs skills to `~/.claude/skills/` (user) or `.claude/skills/` (project)
- 100% test coverage REQUIRED
- Conventional commits REQUIRED
