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

MUST follow these steps in order. MUST NOT commit and push without explicit user approval at each step.

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

### Step 4: Wait for user approval to commit

Show the user what changed and wait for explicit approval before committing.

### Step 5: Commit

```bash
git add -A
git commit -m "chore: bump version to X.Y.Z"
```

### Step 6: Tag

```bash
git tag vX.Y.Z
```

### Step 7: Wait for user approval to push

MUST NOT push without explicit user approval.

### Step 8: Push commit and tag

Both the commit and the tag MUST be pushed. The tag triggers the release workflow.

```bash
git push origin main
git push origin vX.Y.Z
```

## Release Workflow

Pushing a `v*` tag triggers `.github/workflows/release.yml` which:
1. Runs typecheck and tests
2. Builds the CLI
3. Publishes to npm
4. Creates a GitHub Release with auto-generated notes
