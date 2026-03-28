---
name: verify
description: Run the E2E verification checklist from the wiki's Testing page using Chrome automation
allowed-tools: Skill(wiki), Skill(work-habits), Skill(bash-simplicity), Skill(git-safety), Read, Glob, Grep, mcp__claude-in-chrome__*, Bash(pnpm:*)
---

First, use Skill("wiki") to load wiki conventions and Skill("work-habits") for error overlay guidance.

Run the project's E2E verification checklist using Chrome automation.

## 1. Find the checklist

Read the project wiki's Testing page — check for `wiki/Testing.md`. If it does not exist, tell the user this project needs a Testing page in the wiki and suggest running `/curate-wiki` to create one. Stop here if no Testing page exists.

## 2. Parse the checklist

Read `wiki/Testing.md` and extract all checklist items (`- [ ]` lines). Group them by section (e.g., Homepage, Product listing, Cart, Checkout). Identify any test data (items, accounts, URLs) listed on the page.

## 3. Start the dev server

Check if a dev server is already running. If not, ask the user if they want to start one. The dev server command varies by project — check `repo/package.json` for a `dev` script. Run it via `pnpm dev` or the appropriate filter command. Wait for it to be ready before proceeding.

## 4. Connect to Chrome

Call `tabs_context_mcp` to establish the browser connection. If it fails, wait 3 seconds and retry up to 3 times before giving up — the extension often needs a moment on the first call. Once connected, create a new tab for testing.

## 5. Walk through the checklist

For each checklist section, use Chrome automation to:

1. Navigate to the page
2. For each checklist item, verify the condition described
3. **If something looks wrong, check for the red error overlay first** — click it and read the full error before investigating further
4. Record pass or fail for each item
5. If a check fails, capture what was expected vs what was observed

MUST run each Chrome action as a separate tool call. MUST NOT skip items or assume they pass without checking.

## 6. Report

```
## Verification Report

**Checklist**: wiki/Testing.md
**Environment**: dev server / staging URL

### Results
- Homepage: ✅ 3/3 passed
- Product listing: ✅ 5/5 passed
- Cart: ⚠️ 4/5 passed (1 issue)
  - ❌ Stock shows "Out of stock" for in-stock items

### Issues found
1. [Section > Item] — expected: X, observed: Y

### Error overlays
- (any errors captured from the red error overlay)
```

**Then stop.** Do not fix issues — report them. The user decides what to do next.
