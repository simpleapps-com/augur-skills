---
name: deploy
description: Deploy to staging — execute the staging deployment steps from the project wiki Deployment page
allowed-tools: Bash(git:*), Bash(gh:*), Bash(rm:*), Bash(wc:*), Skill(deployment), Skill(git-safety), Skill(bash-simplicity), Skill(work-habits), Read, Write, Glob, Grep
---

First, load these skills:
1. Skill("deployment") — reads wiki Deployment page and loads git-safety
2. Skill("bash-simplicity") — Bash conventions
3. Skill("work-habits") — autonomous execution rules and RFC 2119 compliance

## What This Command Does

Deploy to staging by following the **Deploy** section of the project's `wiki/Deployment.md` page.

## Hard Requirement: Deployment Page

Before doing ANYTHING else, read `wiki/Deployment.md` and find the **Deploy** section.

**If `wiki/Deployment.md` does not exist or has no Deploy section, YOU MUST STOP IMMEDIATELY.** Do not guess, do not improvise, do not infer steps from the codebase. Tell the user:

> "Cannot run /deploy — no Deployment page found at wiki/Deployment.md. Run /curate-wiki to generate it from the codebase."

Then stop. Do nothing else. MUST NOT attempt to merge PRs, trigger builds, or figure out the steps on your own.

## Process (only if Deployment page exists)

This command IS the user's approval to deploy. Execute all steps without stopping to ask for confirmation.

1. Follow the steps defined in the **Deploy** section of `wiki/Deployment.md`
2. Execute all git and deployment operations — do not pause between them
3. Report what was done at the end
