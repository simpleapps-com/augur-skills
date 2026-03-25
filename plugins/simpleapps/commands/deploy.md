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

## Hard Requirement: Deployment Page

Before doing ANYTHING else, read `wiki/Deployment.md` and find the **Deploy** section.

**If `wiki/Deployment.md` does not exist or has no Deploy section, YOU MUST STOP IMMEDIATELY.** Do not guess, do not improvise, do not infer steps from the codebase. Tell the user:

> "Cannot run /deploy — no Deployment page found at wiki/Deployment.md. Run /curate-wiki to generate it from the codebase."

Then stop. Do nothing else. MUST NOT attempt to merge PRs, trigger builds, or figure out the steps on your own.

## Process (only if Deployment page exists)

1. Follow the steps defined in the **Deploy** section of `wiki/Deployment.md`
2. At each git write operation, report and wait for user approval (git-safety)
3. If the steps involve batch operations (e.g. merging multiple PRs), show the list and confirm with the user before proceeding
