---
name: verify
description: Run the E2E verification checklist from the wiki's Testing page using Chrome automation
allowed-tools: Skill(wiki), Skill(work-habits), Skill(bash-simplicity), Skill(git-safety), Read, Write, Edit, Glob, Grep, mcp__claude-in-chrome__*, Bash(pnpm:*)
---

First, use Skill("wiki") to load wiki conventions and Skill("work-habits") for error overlay guidance.

Run the project's E2E verification checklist using Chrome automation.

## 1. Find the checklist

Read the project wiki's Testing page (check for `wiki/Testing.md`). If it does not exist, tell the user this project needs a Testing page in the wiki and suggest running `/curate-wiki` to create one. Stop here if no Testing page exists.

## 2. Parse the checklist

Read `wiki/Testing.md` and extract all checklist items (`- [ ]` lines). Group them by section (e.g., Homepage, Product listing, Cart, Checkout). Identify any test data (items, accounts, URLs) listed on the page.

## 3. Start the dev server

The dev server is a prerequisite for verification. Start it without asking.

1. Check if one is already running on the expected port (per `wiki/Testing.md` or `repo/package.json`)
2. If not running, check `repo/package.json` for the `dev` script and run it in the background via `pnpm dev` or the appropriate filter command (e.g. `pnpm --filter <site> run dev`)
3. Wait for it to be ready (watch for the "ready" / "compiled" line in the background task output) before proceeding to step 4
4. MUST NOT stop to ask permission. The user invoked `/verify`, which IS the approval to run the dev server.

If the dev server fails to start, stop and report the error. That's a real blocker, not a permission question.

## 4. Connect to Chrome

Call `tabs_context_mcp` to establish the browser connection. If it fails, wait 3 seconds and retry up to 3 times before giving up. The extension often needs a moment on the first call. Once connected, create a new tab for testing.

## 5. Walk through the checklist

For each checklist section, use Chrome automation to:

1. Navigate to the page
2. **Check for the red error overlay (pill/badge) on every page**: if present, click it and read the full error, stack trace, and source location before doing anything else
3. For each checklist item, verify the condition described
4. Record pass or fail for each item
5. If a check fails, capture what was expected vs what was observed

MUST run each Chrome action as a separate tool call. MUST NOT skip items or assume they pass without checking.

**Bias warning**: You may be testing code you wrote earlier in this session. Approach with skepticism. Adopt the stance of a tester who did not write the code. A clean pass should be earned, not assumed.

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
1. [Section > Item]: expected: X, observed: Y

### Error overlays
- (any errors captured from the red error overlay)
```

## 7. Fix issues

If any checks failed or error overlays were found, fix them immediately. Work-habits "Leave it better" applies. No pre-existing excuses, no arguing, no asking for permission to fix. Fix it.

After fixing, re-run the failed checks to confirm they pass. Repeat until all checks are green.

## 8. Final report

Report what was verified, what failed, and what was fixed. Suggest next step: `/sanity-check` to audit the solution, or `/submit` if ready. Then stop.
