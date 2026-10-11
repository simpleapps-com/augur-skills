---
name: augur-api
description: Augur API integration via the hosted MCP at augur-api.io/mcp. Covers service discovery, CRUD across Augur microservices, OAuth sign-in, and staff siteId. Use when querying or modifying Augur data (contacts, transactions, inventory, etc.).
---

# Augur API

Hosted MCP server at `https://augur-api.io/mcp` exposing the whole Augur SDK through 6 registry tools. Every call runs as the signed-in user on their site.

## Tools

| Tool | Purpose |
|------|---------|
| `augur_discover` | No arguments: list services. With `service` and/or `q`: list endpoints |
| `augur_list` | List records (GET collection) |
| `augur_get` | Get single record by ID |
| `augur_create` | Create record (POST) |
| `augur_update` | Update record (PUT) |
| `augur_delete` | Delete record (DELETE) |

## Usage Pattern

MUST start with discovery:

1. `augur_discover()`: lists all available services
2. `augur_discover(service="<name>")` or `augur_discover(q="<words>")`: lists endpoints, each with an id and the tool that calls it
3. Call the endpoint by its id (e.g. `items.invMast.list`) with the tool discovery names. Ids are `service.chain.action`; path params are named in braces in the path
4. List endpoints take `limit` and `offset` (default limit 25, max 1000)

MUST NOT hardcode service names or endpoints. Use `augur_discover` to find them at runtime.

`augur_create`, `augur_update`, and `augur_delete` change live data. MUST confirm the site and the change with the user before calling them.

## Sign-in

Joomla Super Users only. Claude Code runs an OAuth sign-in on first use: Site ID, username, password. The plugin ships the server; no local credentials, env vars, or `.simpleapps/` file are involved.

Outside the plugin, the same server MAY be added by hand: `claude mcp add --transport http augur-api https://augur-api.io/mcp`.

Headless sessions (`claude -p`, CI) cannot complete the browser sign-in. They MUST pass a Joomla JWT instead: `claude mcp add --transport http augur-api https://augur-api.io/mcp --header "Authorization: Bearer <JWT>"`. MUST NOT commit the JWT.

## Staff Access (augur_info)

An augur_info staff account holds no ERP data of its own. Staff act on any site by naming it:

- MUST pass a top-level `siteId` (e.g. `ampro-online`) on every `augur_list`, `augur_get`, `augur_create`, `augur_update`, and `augur_delete` call. It is separate from any `siteId` inside `pathParams`, `query`, or `body`
- The call runs as the staff member's own account on the target site (same username and email, Super User, not blocked)
- Every result carries its `siteId`. To compare sites, make the same call once per site
- If the user names a company ("ampro", "Direct Supply") and the exact `siteId` is not known, MUST ask. MUST NOT guess

Non-staff Super Users omit `siteId`; calls run on the site they signed in to.

## API Reference

Documentation hub: https://augur-api.info/

- **Service directory**: https://items.augur-api.com/llms.txt lists all available services
- **Per-service docs**: `https://{service}.augur-api.com/llms.txt` (LLM-friendly), `/openapi.json`, `/postman.json`, `/endpoints.jsonl`
- **FAQ for agents**: https://augur-api.info/faq.md (auth, pagination, rate limits)

Services include items, pricing, commerce, orders, customers, payments, shipping, open-search, and more. Use `augur_discover` at runtime rather than hardcoding service names.

## When Auth Fails

If tools return authentication errors:
- Ask the user to re-run the sign-in: `/mcp`, select `augur-api`, authenticate
- Confirm the account is a Super User on the target site. Other Joomla users cannot sign in
- For staff: confirm the call passed the right top-level `siteId` and that the staff account exists on that site

## When the MCP Server Is Unavailable

If `augur_*` tools are not present in the toolset (server not configured) or every call returns connection errors:

1. Stop trying. Repeated calls will keep failing.
2. Tell the user the Augur API MCP is unavailable and ask whether to (a) fix it, (b) skip the data check, or (c) use a different approach (e.g., reading data directly from the codebase, asking the user for the value)
3. MUST NOT fabricate API responses or guess at data the API would have returned

There is no documented HTTP fallback. The MCP server holds the auth and routing logic. If the MCP is down, that path is closed for this session.
