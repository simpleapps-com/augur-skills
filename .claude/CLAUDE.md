# augur-skills

Claude Code plugin marketplace. No build step. Content is static markdown; the executable exceptions are `scripts/validate.mjs`, the `simpleapps` plugin's `mcp/` server and `bin/` helper scripts, and the `simpleapps-statusline` mod.

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
pnpm quality        # format:check, lint, typecheck, knip, test (100% coverage), validate
pnpm validate       # Plugin validator: frontmatter, naming, token budgets,
                    # Skill() references, version sync, rule drift
```

The lefthook pre-push hook and CI (every push and PR) run `pnpm quality`. It lints and formats mods too; their validation, tests, and type check run locally only (`claude plugin validate --strict`, `claude plugin test`, `tsc` against the generated types). See [Testing](../../wiki/Testing.md#test-tiers).

## Deploy

**MUST NOT deploy unless the user runs `/publish` or says "publish".** That is the approval; do not ask again or ask for the version. Full procedure: [Versioning](../../wiki/Versioning.md#version-bump-procedure).

Use `gh auth setup-git` before pushing.
