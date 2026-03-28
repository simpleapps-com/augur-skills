# Chrome Browser Automation Resilience

The Chrome MCP connection frequently fails on the first attempt. This is normal — the extension may need a moment to respond. MUST NOT give up after a single failure.

## Connection failures

When any `mcp__claude-in-chrome__*` tool call fails (timeout, no response, connection error):

1. Wait 3 seconds, then retry the exact same call
2. If it fails again, wait 5 seconds and retry once more
3. Only after 3 consecutive failures should you report the issue to the user

This applies to ALL Chrome tool calls, but especially to the first call in a session (`tabs_context_mcp`).

## Mid-session failures

If Chrome tools were working and then stop responding:

1. Call `tabs_context_mcp` to re-establish context
2. If that fails, follow the retry sequence above
3. If the tab was lost, create a new one and continue

MUST NOT abandon a multi-step browser task because one call in the middle failed. Retry, recover, continue.
