---
name: deploy
description: Deploy to staging — execute the staging deployment steps from the project wiki Deployment page
allowed-tools: Bash(git:*), Bash(gh:*), Bash(rm:*), Bash(wc:*), Skill(deployment), Skill(git-safety), Skill(bash-simplicity), Read, Write, Glob, Grep
---

First, load these skills:
1. Skill("deployment") — reads wiki Deployment page and loads git-safety
2. Skill("bash-simplicity") — Bash conventions

## What This Command Does

Deploy to staging by following the **Deploy** section of the project's `wiki/Deployment.md` page.

## Process

1. Read `wiki/Deployment.md` and find the **Deploy** section
2. If missing, stop and tell the user: "No Deploy section found in wiki/Deployment.md. Run `/curate-wiki` to generate the Deployment page."
3. Follow the steps defined in the Deploy section
4. At each git write operation, report and wait for user approval (git-safety)

## Common Patterns

The Deploy section may define different workflows per project:
- **Client sites**: merge all open approved PRs, staging auto-deploys on merge
- **Package repos**: merge PR to main, staging picks up changes
- **Services**: merge PR, trigger staging deploy

The command does NOT guess — it reads and executes what the wiki says. If the steps involve batch operations (e.g. merging multiple PRs), show the list and confirm with the user before proceeding.
