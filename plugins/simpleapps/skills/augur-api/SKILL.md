---
name: augur-api
description: Augur API integration via MCP. Covers service discovery, CRUD operations across all 27 Augur microservices, and credential resolution. Use when querying or modifying Augur data (contacts, transactions, inventory, etc.).
---

# Augur API

MCP server exposing all 27 Augur microservices through 6 generic tools.

## Tools

| Tool | Purpose |
|------|---------|
| `augur_discover` | List services or endpoints for a service |
| `augur_list` | List records (GET collection) |
| `augur_get` | Get single record by ID |
| `augur_create` | Create record (POST) |
| `augur_update` | Update record (PUT) |
| `augur_delete` | Delete record (DELETE) |

## Usage Pattern

Always start with discovery:

1. `augur_discover()` — lists all available services
2. `augur_discover(service="<name>")` — lists endpoints for a specific service
3. Use `augur_list`, `augur_get`, `augur_create`, `augur_update`, `augur_delete` for CRUD

Do NOT hardcode service names or endpoints. Use `augur_discover` to find them at runtime.

## Authentication

Credentials resolve automatically — no setup needed if running from a project directory with a `protected/` folder containing credentials.

Resolution order (first match wins):

1. **Env vars** — `AUGUR_TOKEN` + `AUGUR_SITE_ID`
2. **Explicit file** — `AUGUR_CREDS_FILE` env var pointing to a JSON file
3. **Ancestor walk** — walks up from cwd looking for `protected/*.json`
4. **Default file** — `~/.simpleapps/augur-api.json`

Credentials file format: `{"siteId": "...", "jwt": "..."}`

The ancestor walk means client project directories with `protected/<client>.json` just work.

## When Auth Fails

If tools return authentication errors:
- Check for `protected/*.json` in the project directory or any ancestor
- Verify the file contains valid `siteId` and `jwt` keys
- Fallback: set `AUGUR_TOKEN` and `AUGUR_SITE_ID` env vars
