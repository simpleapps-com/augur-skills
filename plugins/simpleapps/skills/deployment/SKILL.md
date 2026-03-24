---
name: deployment
description: Project deployment conventions — reads the wiki Deployment page and executes submit, deploy, or publish steps. Refuses to operate without a Deployment page.
user-invocable: false
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Skill(git-safety)
  - Skill(conventional-commits)
  - Skill(github)
---

First, use Skill("git-safety") to load git guardrails.

# Deployment

This skill reads the project's `wiki/Deployment.md` and executes the steps defined there. Each project defines its own deployment workflow — this skill is the executor, the wiki is the config.

## Deployment Page Format

Every project wiki SHOULD have a `Deployment.md` page with up to three sections:

```
## Submit
How to commit and create a PR for review.

## Deploy
How to deploy to staging.

## Publish
How to release to production.
```

Not all projects need all three. Client sites may only have Submit and Deploy. Package repos may have all three.

## How It Works

1. Read `wiki/Deployment.md`
2. Find the section matching the requested action (Submit, Deploy, or Publish)
3. If the page or section is missing, **refuse to operate** — tell the user to run `/curate-wiki` to generate it
4. Execute the steps in that section, respecting git-safety at every git write operation

## Guard Rails

- MUST NOT guess deployment steps — only execute what the wiki defines
- MUST NOT operate if the Deployment page is missing or the relevant section is absent
- MUST load git-safety — every git write operation requires user approval
- `/publish` MUST complete the verification gate before executing (see below)

## Publish Verification Gate

Before executing any Publish steps, MUST:

1. Show the **current version** and the **proposed new version**
2. Show **what changes** are included since the last release (`git log` from last tag)
3. Show **CI/test status** if available (`gh run list` or local test run)
4. Present a summary: version transition, commit count, test status
5. Require the user to **explicitly confirm** the specific version going to production

This is not just git-safety. It is an active verification checklist — the user MUST see exactly what they are releasing and confirm that specific version.
