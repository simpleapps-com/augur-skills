---
name: stage
description: Stage to staging environment. Execute the staging deployment steps from the project wiki Deployment page.
allowed-tools: Bash(git -C:*), Bash(gh:*), Bash(rm:*), Bash(wc:*), Skill(deployment), Skill(git-safety), Skill(bash-simplicity), Skill(work-habits), Read, Write, Glob, Grep
---

First, load these skills:
1. Skill("deployment"): reads wiki Deployment page and loads git-safety
2. Skill("bash-simplicity"): Bash conventions
3. Skill("work-habits"): autonomous execution rules and RFC 2119 compliance

## What This Command Does

Stage to staging by following the **Deploy** section of the project's `wiki/Deployment.md` page.

## Hard Requirement: Deployment Page

**MUST verify `wiki/Deployment.md` exists before proceeding.** Context compaction can cause the file to drop from memory even if it was read earlier in the session.

1. Check if `wiki/Deployment.md` is currently in context from this session
2. If NOT in context: explicitly `Read wiki/Deployment.md` to reload it
3. Find the **Deploy** section in the page

**If the page is missing or has no Deploy section, STOP IMMEDIATELY.** Do not guess, do not improvise, do not infer steps from the codebase. Tell the user:

> "Cannot run /stage: `wiki/Deployment.md` is missing or has no Deploy section. Run `/curate-wiki` to generate it from the codebase."

Then stop. Do nothing else. MUST NOT attempt to merge PRs, trigger builds, or figure out the steps on your own.

## Process (only if Deployment page exists)

This command IS the user's approval to stage. Execute all steps without stopping to ask for confirmation.

1. Follow the steps defined in the **Deploy** section of `wiki/Deployment.md`. When the wiki uses shell operators (`&&`, `;`, `|`, `$()`), you MUST split them into separate, single-command Bash calls per `bash-simplicity`. One command per call, no exceptions.
2. Execute all git and deployment operations. Do not pause between them.
3. Report what was done at the end
