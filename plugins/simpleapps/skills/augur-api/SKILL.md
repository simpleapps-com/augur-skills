---
name: augur-api
description: Augur API integration via MCP. Covers service discovery, multi-site CRUD operations across Augur microservices, and credential resolution. Use when querying or modifying Augur data (contacts, transactions, inventory, etc.).
---

# Augur API

MCP server exposing Augur microservices through 7 generic tools.

## Tools

| Tool | Purpose |
|------|---------|
| `augur_discover` | List services or endpoints for a service |
| `augur_sites` | List configured sites with default flag |
| `augur_list` | List records (GET collection) |
| `augur_get` | Get single record by ID |
| `augur_create` | Create record (POST) |
| `augur_update` | Update record (PUT) |
| `augur_delete` | Delete record (DELETE) |

All 5 data tools (`augur_list`, `augur_get`, `augur_create`, `augur_update`, `augur_delete`) accept an optional `site` parameter to target a specific site. Omit `site` to use the default.

## Usage Pattern

Always start with discovery:

1. `augur_sites()` — see which sites are configured and which is default
2. `augur_discover()` — lists all available services
3. `augur_discover(service="<name>")` — lists endpoints for a specific service
4. Use data tools for CRUD, passing `site` when targeting a non-default site

Do NOT hardcode service names or endpoints. Use `augur_discover` to find them at runtime.

## Authentication

Credentials resolve automatically from `.simpleapps/` directories.

Resolution order (first match wins):

1. **Env vars** — `AUGUR_TOKEN` + `AUGUR_SITE_ID`
2. **Explicit file** — `AUGUR_CREDS_FILE` env var pointing to a JSON file
3. **Project file** — `<cwd>/.simpleapps/augur-api.json`
4. **Global file** — `~/.simpleapps/augur-api.json`

Project and global files are merged (project takes precedence).

### Single-site format

```json
{
  "siteId": "my-site",
  "jwt": "my-token"
}
```

### Multi-site format

```json
{
  "site-a": { "jwt": "token-a" },
  "site-b": { "jwt": "token-b" }
}
```

## API Reference

Documentation hub: https://augur-api.info/

- **Service directory** — https://items.augur-api.com/llms.txt lists all available services
- **Per-service docs** — `https://{service}.augur-api.com/llms.txt` (LLM-friendly), `/openapi.json`, `/postman.json`, `/endpoints.jsonl`
- **FAQ for agents** — https://augur-api.info/faq.md (auth, pagination, rate limits)

Services include items, pricing, commerce, orders, customers, payments, shipping, open-search, and more. Use `augur_discover` at runtime rather than hardcoding service names.

## When Auth Fails

If tools return authentication errors:
- Check for `.simpleapps/augur-api.json` in the project directory or home directory
- Verify the file contains valid credentials (single-site or multi-site format)
- Fallback: set `AUGUR_TOKEN` and `AUGUR_SITE_ID` env vars
