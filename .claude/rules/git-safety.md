# Git Safety

MUST NOT run any git write operation (commit, push, tag, merge, rebase, branch -D, stash, or PR creation) unless the user explicitly approves.

Exception: fast-forwarding a clean local `main`/`master` to its remote (`git -C repo merge --ff-only origin/main`) is not a merge for this rule. It creates no commit, rewrites nothing, and refuses if histories diverged.

**Approval rules:**
- Each approval covers ONE specific operation only
- Approval for one repo does NOT extend to another
- Previous approvals do NOT carry forward

After making changes: report what was done, then stop. Do not suggest the next git action.

Load Skill("git-safety") for full guardrails before any git write operations.
