# Git Safety

MUST NOT run any git write operation (commit, push, tag, merge, rebase, PR creation) unless the user explicitly approves. No prior approval carries forward — each operation needs its own. The user approves by saying "commit"/"push" or by invoking /submit, /deploy, /publish.

After making changes: report what was done, then stop. Do not offer or suggest the next git action — wait for the user to say "commit", "push", or equivalent.

This applies even when a skill says "complete all steps without stopping" — git operations are always a stopping point for user approval.
