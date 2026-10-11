# Versioning & Deployment

Full docs: [Versioning](../../../wiki/Versioning.md)

## Scheme: CalVer (YYYY.MM.seq)

Format: `2026.03.1` = first release of March 2026. Versions signal knowledge freshness, not API compatibility.

## Source of truth

`VERSION` file. All `version` fields in `marketplace.json` (top-level AND each plugin entry) and `plugin.json` MUST match.

## Deployment

MUST NOT deploy unless the user runs `/publish` or says "publish". That is the approval: MUST NOT ask again or ask for the version (CalVer determines it). Full procedure: [Deployment](../../../wiki/Deployment.md#publish).
