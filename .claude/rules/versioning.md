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

## Deployment

MUST NOT deploy without explicit user approval. Full procedure: [Deployment](../../../wiki/Deployment.md#publish).
