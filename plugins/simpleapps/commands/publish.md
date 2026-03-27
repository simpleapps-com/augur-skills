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

## Hard Requirement: Deployment Page

Before doing ANYTHING else, read `wiki/Deployment.md` and find the **Publish** section.

**If `wiki/Deployment.md` does not exist or has no Publish section, YOU MUST STOP IMMEDIATELY.** Do not guess, do not improvise, do not infer steps from the codebase or version files. Tell the user:

> "Cannot run /publish — no Deployment page found at wiki/Deployment.md. Run /curate-wiki to generate it from the codebase."

Then stop. Do nothing else. MUST NOT attempt to bump versions, tag, or push on your own.

## Process (only if Deployment page exists)

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

### Execute Publish Steps (only after user confirms)

Once the user confirms, execute ALL remaining steps without pausing — the confirmation IS the approval for all git writes.

9. Follow the steps defined in the Publish section (typically: bump version files, commit, tag, push)
10. Report what was done at the end

## MUST NOT

- Skip or abbreviate the verification gate
- Assume the version number — always read and display it
- Proceed without explicit user confirmation of the specific version
- Guess publish steps if the wiki section is missing
- Run this command casually — it is intentionally named "publish" to signal production impact
