---
description: Version management across the monorepo
globs: ["**/package.json", "**/marketplace.json", "**/plugin.json"]
---

# Versioning Rules

## Versioned Files

All versions MUST stay in sync when bumping:

1. `.claude-plugin/marketplace.json` → `version` field (marketplace version)
2. `packages/cli/package.json` → `version` field (npm package version)

`src/index.ts` reads from `package.json` at runtime — no manual update needed there.

## How to Bump

1. Update `version` in both files listed above
2. Commit with: `chore: bump version to X.Y.Z`
3. Tag with: `git tag vX.Y.Z`
4. Push tag to trigger release workflow: `git push origin vX.Y.Z`

## Plugin Versions

Each `plugins/<name>/.claude-plugin/plugin.json` MUST have its own `version` field. Plugin versions are independent from the marketplace/CLI version — they follow their own release cadence.
