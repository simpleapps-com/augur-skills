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

## Process

1. Read `wiki/Deployment.md` and find the **Submit** section
2. If missing, stop and tell the user: "No Submit section found in wiki/Deployment.md. Run `/curate-wiki` to generate the Deployment page."
3. Check the current branch — warn if on main/master
4. Follow the steps defined in the Submit section
5. At each git write operation, report and wait for user approval (git-safety)

## Defaults

When the Submit section exists but is minimal, fill in with skill conventions:
- Commit message: conventional-commits format
- PR title: under 70 chars, conventional style
- PR body: summary + test plan (github skill conventions)
- Base branch: repo default branch
- MUST NOT use `$()` in gh commands — use `--body-file` with a tmp file
