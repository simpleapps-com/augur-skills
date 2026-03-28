---
name: git-safety
description: Git safety guardrails — MUST NOT commit, push, create PRs, or merge without explicit user approval. Load this skill before any git write operations.
user-invocable: false
---

# Git Safety

## The Rule

MUST NOT run any git write operation unless the user explicitly approves it. Git write operations include: `commit`, `push`, `tag`, `merge`, `rebase`, `reset`, `cherry-pick`, `stash`, `branch -D`, and any `gh` command that creates or modifies PRs, issues, or releases.

`git add` (staging) is permitted as part of preparing to show the user what will be committed — but the commit itself requires approval.

No skill, command, or workflow overrides this rule. Even instructions like "complete all steps without stopping" do not bypass it. This applies to ALL repos — the main repo, the wiki repo, and any other git repo.

## Why

Every git push, every PR, every wiki edit that hits GitHub is done under the user's credentials — their name, their reputation. The user is responsible for every action taken on their behalf. That is why they decide when to commit, not the agent.

## How Approval Works

The user gives approval in one of two ways:

1. **Direct instruction** — the user says "commit", "push", "tag", or equivalent
2. **Shipping commands** — the user invokes `/submit`, `/deploy`, or `/publish`. Invoking the command IS the approval for the git operations defined in that command's workflow.

### Approval is scoped, not blanket

Each approval covers ONE specific operation. Examples:

- The user says "commit" → you may commit the current staged changes. You may NOT also push.
- The user runs `/submit` → you may execute the Submit steps (commit + push or PR). You may NOT also tag or publish.
- The user runs `/publish` → you may execute the Publish steps (bump, commit, tag, push). This does NOT carry forward to future commits.

Approval for one repo does NOT extend to another. Approval to commit/push the wiki does NOT grant approval to commit/push the main repo, and vice versa. Each repo requires its own explicit approval.

Previous approvals do NOT grant future permissions. If the user approved a commit earlier in the session, that does not mean you can commit again later without asking.

### When /submit follows earlier work

If you made changes and the user then runs `/submit`, the command starts fresh — it reads the Deployment page and follows those steps. There is no conflict with earlier work. The user chose to invoke `/submit` at this moment, and that is all the approval needed for the operations within it.

Do NOT ask for redundant confirmation inside `/submit` if the user just invoked it. The invocation is the approval. But each discrete git operation within the flow (commit, then push) should still be reported before execution.

## The Pattern

**Do the work → report results → wait.**

After making changes: report what was done, then stop. Do not ask "want me to commit?" or "should I push?" — that wastes tokens. Just report and wait silently. The user will say "commit", "push", or run a shipping command when ready.
