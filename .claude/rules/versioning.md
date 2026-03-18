---
description: Version management and deployment process
globs: ["**/package.json", "**/marketplace.json", "**/plugin.json", "VERSION"]
---

# Versioning & Deployment

Full docs: [Versioning](../../../wiki/Versioning.md)

## Scheme: CalVer (YYYY.MM.seq)

Format: `2026.03.1` = first release of March 2026. Versions signal knowledge freshness, not API compatibility.

## Source of truth

`VERSION` file. All `version` fields in `marketplace.json` (top-level AND each plugin entry), `plugin.json`, and `packages/cli/package.json` MUST match.

## Deployment process

MUST NOT deploy without explicit user approval.

1. **Bump version** in all 4 files (VERSION, marketplace.json x2, plugin.json, packages/cli/package.json)
2. **Commit**: `chore: bump version to YYYY.MM.seq`
3. **Tag**: `git tag vYYYY.MM.seq`
4. **Push commit and tag**: `git push origin main && git push origin vYYYY.MM.seq`

## What the tag triggers

Pushing a `v*` tag triggers `.github/workflows/release.yml` which:
1. Runs typecheck and tests
2. Builds the CLI
3. Copies skills into the CLI package (`pnpm prepare-publish`)
4. Publishes `@simpleapps-com/augur-skills` to npm
5. Creates a GitHub Release with auto-generated notes

The tag also serves as the version marker that the plugin system checks when consumers update.

## Common mistakes

- Bumping version and pushing without tagging — nothing gets published
- Tagging without pushing the tag — `git push` alone does NOT push tags
- Describing the release workflow from memory instead of reading `release.yml` — always check the file
