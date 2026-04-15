---
name: publish
description: Publish to production. Version bump, tag, and release with mandatory verification. Reads steps from the project wiki Deployment page.
allowed-tools: Bash(git -C:*), Bash(gh:*), Bash(rm:*), Bash(wc:*), Bash(pnpm:*), Skill(deployment), Skill(git-safety), Skill(bash-simplicity), Skill(work-habits), Read, Write, Glob, Grep, Edit
---

First, load these skills:
1. Skill("deployment"): reads wiki Deployment page, loads git-safety, defines verification gate
2. Skill("bash-simplicity"): Bash conventions
3. Skill("work-habits"): autonomous execution rules and RFC 2119 compliance

## What This Command Does

Publish a production release by following the **Publish** section of the project's `wiki/Deployment.md` page. This is the highest-stakes command. It puts code in front of real users.

## Hard Requirement: Deployment Page

Before doing ANYTHING else, read `wiki/Deployment.md` and find the **Publish** section.

**If `wiki/Deployment.md` does not exist or has no Publish section, YOU MUST STOP IMMEDIATELY.** Do not guess, do not improvise, do not infer steps from the codebase or version files. Tell the user:

> "Cannot run /publish: no Deployment page found at wiki/Deployment.md. Run /curate-wiki to generate it from the codebase."

Then stop. Do nothing else. MUST NOT attempt to bump versions, tag, or push on your own.

## Process (only if Deployment page exists)

### Verification Gate (MUST complete before any action)

1. Read the current version (VERSION file, package.json, or as wiki specifies)
2. Determine the proposed new version from the versioning scheme
3. List all changes since last release: `git log --oneline <last-tag>..HEAD`
4. Run tests locally or check CI status
5. Present a clear summary:
   ```
   Version:  v{current} -> v{new}
   Changes:  {N} commits since last release
   Tests:    {pass/fail}
   ```
6. **Stop and wait** for the user to explicitly confirm this specific version

### Execute Publish Steps (only after user confirms)

Once the user confirms, execute ALL remaining steps without pausing. The confirmation IS the approval for all git writes.

1. Follow the steps defined in the Publish section (typically: bump version files, commit, tag, push)
2. Report what was done at the end

## MUST NOT

- Skip or abbreviate the verification gate
- Assume the version number. Always read and display it.
- Proceed without explicit user confirmation of the specific version
- Guess publish steps if the wiki section is missing
- Run this command casually. It is intentionally named "publish" to signal production impact.
