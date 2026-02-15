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

## Deploy / Release

"Deploy" means: bump version → commit → tag → push. Full procedure in `.claude/rules/versioning.md`.

- Check `git status` before committing — ask the user about any unstaged/untracked files
- Use `gh auth setup-git` before pushing (handles expired HTTPS credentials)
- Push with `git push origin main && git push origin vX.Y.Z`
- Tag push triggers `.github/workflows/release.yml` (typecheck → test → build → npm publish → GitHub Release)

## Conventions
- Plugins are directories under `plugins/`, each with `.claude-plugin/plugin.json`
- Skills live in `plugins/<name>/skills/<skill-name>/SKILL.md`
- CLI installs skills to `~/.claude/skills/` (user) or `.claude/skills/` (project)
- 100% test coverage REQUIRED
- Conventional commits REQUIRED
