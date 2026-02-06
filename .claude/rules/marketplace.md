---
description: Marketplace configuration rules
globs: .claude-plugin/**/*
---

# Marketplace Rules

`.claude-plugin/marketplace.json` MUST contain:
- `name` - Marketplace identifier
- `description` - Human-readable description
- `owner` - Object with `name` and `email`
- `plugins` - Array of plugin entries

When adding a plugin to the marketplace, each entry MUST have:
- `name` - Plugin identifier (matches directory name under `plugins/`)
- `description` - Brief description
- `source` - Relative path (e.g., `./plugins/<name>`)
- `version` - SemVer version
