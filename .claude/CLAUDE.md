# augur-skills

Claude Code plugin marketplace. No build step. Content is static markdown; the executable exceptions are `scripts/validate.mjs`, the plugin's `mcp/` server, and the `bin/` helper scripts.

## Wiki (Source of Truth for Dev Docs)

The wiki is cloned at `../../wiki/` relative to this file. Read it locally:

- [Home](../../wiki/Home.md)
- [Getting Started](../../wiki/Getting-Started.md)
- [Architecture](../../wiki/Architecture.md)
- [Plugin Structure](../../wiki/Plugin-Structure.md)
- [Skill Format](../../wiki/Skill-Format.md)
- [Marketplace](../../wiki/Marketplace.md)
- [Versioning](../../wiki/Versioning.md)
- [Development](../../wiki/Development.md)
- [Testing](../../wiki/Testing.md)
- [Deployment](../../wiki/Deployment.md)

## Rules

`plugins/simpleapps/rules/` is **canonical** (shipped + versioned). `.claude/rules/` mirrors the shared rules so agents working in this repo get the same governance, plus repo-dev-only rules (marketplace, plugin-structure, skill-format, skill-token-limit, versioning). Edit the plugin copy, then sync shared rules plugin→repo. `pnpm validate` fails on same-named drift.

## Quick Reference

```bash
pnpm validate       # Plugin validator: frontmatter, naming, token budgets,
                    # Skill() references, version sync, rule drift
```

`pnpm validate` is the only check in this repo. The lefthook pre-push hook runs it, and CI runs it on every push and PR.

## Deploy

**MUST NOT deploy without explicit user approval.** Full procedure: [Versioning](../../wiki/Versioning.md#version-bump-procedure).

Use `gh auth setup-git` before pushing.
