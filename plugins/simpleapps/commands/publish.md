---
name: publish
description: Publish to production — version bump, tag, and release with mandatory verification. Reads steps from the project wiki Deployment page.
allowed-tools: Bash(git:*), Bash(gh:*), Bash(rm:*), Bash(wc:*), Bash(pnpm:*), Skill(deployment), Skill(git-safety), Skill(bash-simplicity), Read, Write, Glob, Grep, Edit
---

First, load these skills:
1. Skill("deployment") — reads wiki Deployment page, loads git-safety, defines verification gate
2. Skill("bash-simplicity") — Bash conventions

## What This Command Does

Publish a production release by following the **Publish** section of the project's `wiki/Deployment.md` page. This is the highest-stakes command — it puts code in front of real users.

## Process

1. Read `wiki/Deployment.md` and find the **Publish** section
2. If missing, stop and tell the user: "No Publish section found in wiki/Deployment.md. Run `/curate-wiki` to generate the Deployment page."

### Verification Gate (MUST complete before any action)

3. Read the current version (VERSION file, package.json, or as wiki specifies)
4. Determine the proposed new version from the versioning scheme
5. List all changes since last release: `git log --oneline <last-tag>..HEAD`
6. Run tests locally or check CI status
7. Present a clear summary:
   ```
   Version:  v{current} -> v{new}
   Changes:  {N} commits since last release
   Tests:    {pass/fail}
   ```
8. **Stop and wait** for the user to explicitly confirm this specific version

### Execute Publish Steps

9. Follow the steps defined in the Publish section (typically: bump version files, commit, tag, push)
10. At each git write operation, report and wait for user approval

## MUST NOT

- Skip or abbreviate the verification gate
- Assume the version number — always read and display it
- Proceed without explicit user confirmation of the specific version
- Guess publish steps if the wiki section is missing
- Run this command casually — it is intentionally named "publish" to signal production impact
