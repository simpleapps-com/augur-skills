# augur-skills

Monorepo: Claude Code plugin marketplace + npm CLI (`augur-skills`).

## Wiki (Source of Truth for Dev Docs)

The wiki is cloned at `../../wiki/` relative to this file. Read it locally:

- [Home](../../wiki/Home.md)
- [Architecture](../../wiki/Architecture.md)
- [Plugin Structure](../../wiki/Plugin-Structure.md)
- [Skill Format](../../wiki/Skill-Format.md)
- [Marketplace](../../wiki/Marketplace.md)
- [Versioning](../../wiki/Versioning.md)
- [Development](../../wiki/Development.md)

## Quick Reference

```bash
pnpm build          # Build CLI
pnpm test           # Run tests
pnpm test:coverage  # Coverage
pnpm typecheck      # TypeScript check
pnpm validate-skills # Validate SKILL.md frontmatter
```

## Deploy

**MUST NOT deploy without explicit user approval.** Full procedure: [Versioning](../../wiki/Versioning.md#version-bump-procedure).

Use `gh auth setup-git` before pushing.
