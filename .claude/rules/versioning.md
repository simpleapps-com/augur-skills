---
description: Version management across the monorepo
globs: ["**/package.json", "**/marketplace.json", "**/plugin.json", "VERSION"]
---

# Versioning

Full docs: [Versioning](../../../wiki/Versioning.md)

`VERSION` file = source of truth. All `version` fields in `marketplace.json`, `plugin.json`, and `packages/cli/package.json` MUST match.

**MUST NOT deploy without explicit user approval.**
