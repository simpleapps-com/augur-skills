---
name: submit
description: Submit work for review — commit and create a PR as defined in the project wiki Deployment page
allowed-tools: Bash(git:*), Bash(gh:*), Bash(rm:*), Bash(wc:*), Skill(deployment), Skill(git-safety), Skill(conventional-commits), Skill(github), Skill(bash-simplicity), Read, Write, Glob, Grep, Edit
---

First, load these skills:
1. Skill("deployment") — reads wiki Deployment page and loads git-safety
2. Skill("conventional-commits") — commit message format
3. Skill("github") — PR conventions and gh CLI
4. Skill("bash-simplicity") — Bash conventions

## What This Command Does

Submit the current work for review by following the **Submit** section of the project's `wiki/Deployment.md` page.

## Hard Requirement: Deployment Page

Before doing ANYTHING else, read `wiki/Deployment.md` and find the **Submit** section.

**If `wiki/Deployment.md` does not exist or has no Submit section, YOU MUST STOP IMMEDIATELY.** Do not guess, do not improvise, do not use defaults. Tell the user:

> "Cannot run /submit — no Deployment page found at wiki/Deployment.md. Run /curate-wiki to generate it from the codebase."

Then stop. Do nothing else. MUST NOT attempt to commit, create PRs, or figure out the steps on your own.

## Process (only if Deployment page exists)

1. Follow the steps defined in the **Submit** section of `wiki/Deployment.md`
2. Check the current branch — warn if on main/master
3. Use conventional-commits format for commit messages
4. Use github skill conventions for PR title and body
5. At each git write operation, report and wait for user approval (git-safety)
6. MUST NOT use `$()` in gh commands — use `--body-file` with a tmp file
