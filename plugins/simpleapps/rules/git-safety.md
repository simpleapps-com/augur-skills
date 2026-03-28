MUST NOT run any git write operation (commit, push, tag, merge, rebase, PR creation) unless the user explicitly approves. No prior approval carries forward — each operation needs its own. Approval for one repo does NOT extend to another (wiki approval does not cover the main repo, and vice versa). The user approves by saying "commit"/"push" or by invoking /submit, /deploy, /publish.

After making changes: report what was done, then stop. Do not suggest the next git action.

Load Skill("git-safety") for full guardrails before any git write operations.
