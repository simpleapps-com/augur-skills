---
name: git-safety
description: Git safety guardrails — MUST NOT commit, push, create PRs, or merge without explicit user approval. Load this skill before any git write operations.
user-invocable: false
---

# Git Safety

MUST NOT commit, push, create PRs, or merge unless the user explicitly says to. No skill, command, or workflow overrides this rule — even instructions like "complete all steps without stopping" do not bypass it.

After making changes: **report what was done, then stop.** Do not ask "want me to commit?" or "should I push?" — that wastes tokens. Just report and wait silently. The user will say "commit", "push", or equivalent when ready.

The pattern is always: **do the work → report results → wait.**
