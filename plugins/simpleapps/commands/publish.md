---
name: publish
description: Publish to production. Pre-flight checks, then version bump, tag, and release with no second confirmation. Reads steps from the project wiki Deployment page.
allowed-tools: Bash(git -C:*), Bash(gh:*), Bash(rm:*), Bash(wc:*), Bash(pnpm:*), Skill(deployment), Skill(git-safety), Skill(bash-simplicity), Skill(work-habits), Read, Write, Bash(rg:*), Bash(grep:*), Bash(find:*), Bash(ls:*), Edit
---

First, load these skills:
1. Skill("deployment"): reads wiki Deployment page, loads git-safety, defines the pre-flight checks
2. Skill("bash-simplicity"): Bash conventions
3. Skill("work-habits"): autonomous execution rules and RFC 2119 compliance

## What This Command Does

Publish a production release by following the **Publish** section of the project's `wiki/Deployment.md` page. This is the highest-stakes command. It puts code in front of real users.

## Hard Requirement: Deployment Page

Before doing ANYTHING else, read `wiki/Deployment.md` and find the **Publish** section.

**If `wiki/Deployment.md` does not exist or has no Publish section, YOU MUST STOP IMMEDIATELY.** Do not guess, do not improvise, do not infer steps from the codebase or version files. Tell the user:

> "Cannot run /publish: no Deployment page found at wiki/Deployment.md. Run /wiki-curate to generate it from the codebase."

Then stop. Do nothing else. MUST NOT attempt to bump versions, tag, or push on your own.

## Process (only if Deployment page exists)

**Invoking `/publish` IS the approval to release.** MUST NOT ask the user to confirm the version, the changes, or any step. The only reason to stop before the release is a failed pre-flight check below.

### Pre-flight checks (MUST pass before any git write)

1. Read the current version (VERSION file, package.json, or as wiki specifies)
2. Compute the new version from the versioning scheme (for CalVer: today's `YYYY.MM`, next `seq`). The scheme determines it; MUST NOT ask the user for it or to confirm it
3. List all changes since last release: `git log --oneline <last-tag>..HEAD`. Zero commits means there is nothing to release: stop and report
4. Confirm the tree is clean and the branch matches its remote
5. Run tests locally and check CI status. Any failure: stop and report
6. Show the summary, then continue straight into the publish steps without waiting:
   ```
   Version:  v{current} -> v{new}
   Changes:  {N} commits since last release
   Tests:    {pass/fail}
   ```

### Execute Publish Steps

Execute ALL steps without pausing.

1. Follow the steps defined in the Publish section (typically: bump version files, commit, tag, push). When the wiki uses shell operators (`&&`, `;`, `|`, `$()`), you MUST split them into separate, single-command Bash calls per `bash-simplicity`.
2. Verify the release (CI run, release workflow, release entry) as the wiki defines
3. Report what was done at the end

## MUST NOT

- Ask for a second confirmation once `/publish` has been invoked
- Skip or abbreviate the pre-flight checks
- Assume the version number. Always read and display it.
- Ask the user which version to publish; the versioning scheme already answers that
- Publish with a failing check, a dirty tree, or zero commits since the last release
- Guess publish steps if the wiki section is missing
