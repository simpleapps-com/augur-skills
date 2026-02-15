---
description: Version management across the monorepo
globs: ["**/package.json", "**/marketplace.json", "**/plugin.json", "VERSION"]
---

# Versioning Rules

## Source of Truth

The `VERSION` file at the repo root contains the canonical version. All other version fields MUST match it.

## Versioned Files

All versions MUST stay in sync with the `VERSION` file:

1. `VERSION` → single line, e.g. `0.0.2`
2. `.claude-plugin/marketplace.json` → top-level `version` field
3. `.claude-plugin/marketplace.json` → each plugin entry `version` field
4. `packages/cli/package.json` → `version` field
5. `plugins/<name>/.claude-plugin/plugin.json` → `version` field (all plugins)

`src/index.ts` reads from `package.json` at runtime — no manual update needed there.

## Version Bump Procedure

When the user says "bump the version" (with or without commit/push/tag), execute all steps below in sequence.

### Step 1: Update VERSION file

Update the `VERSION` file to the new version number.

### Step 2: Update all matching files

Search for all JSON files still containing the old version:

```bash
grep -rl '"version": "OLD_VERSION"' --include="*.json" .
```

Update `version` in ALL matched files to match the `VERSION` file.

### Step 3: Verify

Confirm no files were missed:

```bash
grep -rl '"version": "OLD_VERSION"' --include="*.json" .
```

This SHOULD return no results.

### Step 4: Stage and commit

Stage all version-bumped files plus any other staged changes:

```bash
git add VERSION .claude-plugin/marketplace.json plugins/*/. claude-plugin/plugin.json packages/cli/package.json
git commit -m "chore: bump version to X.Y.Z"
```

### Step 5: Tag

```bash
git tag vX.Y.Z
```

### Step 6: Push commit and tag

Both the commit and the tag MUST be pushed. The tag triggers the release workflow.

Use `gh` for authentication (handles expired HTTPS credentials):

```bash
gh auth setup-git
git push origin main && git push origin vX.Y.Z
```

**Note**: If `git push` fails with 401/403, run `gh auth setup-git` first to configure gh as the credential helper.

## Release Workflow

Pushing a `v*` tag triggers `.github/workflows/release.yml` which:
1. Runs typecheck and tests
2. Builds the CLI
3. Publishes to npm
4. Creates a GitHub Release with auto-generated notes
