---
name: commit-message
description: Generate a conventional commit message from staged changes
disable-model-invocation: true
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Skill(conventional-commits)
---

First, use Skill("conventional-commits") to load the commit format rules.

Analyze the staged git changes and generate a commit message.

1. Run `git diff --cached --stat` to see what files changed
2. Run `git diff --cached` to see the actual changes
3. Run `git log --oneline -5` to see recent commit style

Generate a single commit message. IMPORTANT: YOU MUST NOT commit — only output the message.
