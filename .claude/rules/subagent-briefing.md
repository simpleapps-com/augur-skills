# Subagent Briefing

Subagents start with zero context — they cannot see this conversation, the wiki, or what has already been tried. Every Agent/Task call MUST brief the subagent completely, or results come back generic, wrong, or ignore project conventions.

## Required in every subagent prompt

- **Goal** — the outcome the main agent needs, stated plainly
- **Context learned this session** — what has been tried, ruled out, or discovered (file paths, function names, error messages)
- **Exact file paths and line numbers** — never leave the subagent to re-search for what the main agent already found
- **Relevant wiki context** — see Wiki Handling below
- **Expected output** — format, length cap, and whether to write code or only research

## Wiki handling

The main agent MUST keep the project wiki loaded (via `/wiki` or direct reads) so it can cite conventions when delegating. For each subagent call, pick per-section:

- **Paste** short, load-bearing rules directly into the briefing (e.g., a versioning rule, a naming convention, a commit-safety guardrail)
- **Point** the subagent at specific pages like `wiki/Deployment.md#publish` for larger context it should internalize itself

MUST NOT spawn a subagent with zero wiki context when project conventions apply to the task. Generic output is the #1 failure mode of delegation.

## Operational rules

Subagents do NOT reliably inherit project rules from `.claude/rules/`. The main agent MUST paste the relevant rule verbatim into the briefing whenever the subagent will touch that tool:

- **Bash use** → paste `bash-simplicity.md` (no shell plumbing, dedicated tools over `grep`/`find`/`cat`/`sed`)
- **git use** → paste `git-safety.md` (no write operations without explicit user approval)
- **Chrome automation** → paste `chrome-resilience.md` (retry sequence on MCP failures)

Skipping this produces subagents that run `find -exec grep`, commit without approval, or give up on Chrome after one failed call — all of which cost far more than the ~100-200 words each rule adds to the briefing.

## Anti-patterns

- "Investigate X" with no file paths, no prior findings, no wiki pointers
- Pasting the entire wiki into every briefing (wasteful — point instead)
- Assuming the subagent knows project conventions (it does not)
- Omitting the expected output format (produces sprawling, unusable reports)
