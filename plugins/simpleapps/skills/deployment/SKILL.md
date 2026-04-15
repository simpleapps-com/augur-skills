---
name: deployment
description: Project deployment conventions. Reads the wiki Deployment page and executes submit, deploy, or publish steps. Refuses to operate without a Deployment page.
user-invocable: false
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Skill(git-safety)
---

First, use Skill("git-safety") to load git guardrails. The shipping commands (`/submit`, `/deploy`, `/publish`) load `conventional-commits` and `github` directly when they need them. This skill does not pre-load them.

# Deployment

This skill reads the project's `wiki/Deployment.md` and executes the steps defined there. Each project defines its own deployment workflow. This skill is the executor, the wiki is the config.

## Deployment Page Format

Every project wiki MUST have a `Deployment.md` page with up to three sections:

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
3. If the page or section is missing, **refuse to operate**. Tell the user to run `/curate-wiki` to generate it.
4. Execute the steps in that section

## Command approval model

The user invoking a command IS the approval to execute all its steps, including git writes. Do not stop to ask for confirmation mid-execution.

- `/submit`: execute all steps (commit, push, PR). Report at the end.
- `/deploy`: execute all steps. Report at the end.
- `/publish`: **EXCEPTION**. Must complete the verification gate below and get secondary confirmation BEFORE executing any publish steps. This is the only command that pauses for approval.

## Guard Rails

- **If `wiki/Deployment.md` does not exist, STOP IMMEDIATELY.** Do not guess, do not improvise, do not infer steps from the codebase. Tell the user to run `/curate-wiki` to generate it. Then do nothing else.
- **If the relevant section (Submit, Deploy, or Publish) is missing from the page, STOP IMMEDIATELY.** Same rule: do not guess the steps.
- MUST NOT guess deployment steps. Only execute what the wiki defines.

## Translating Wiki Shell Commands

Wiki Deployment pages often contain shell snippets written for humans, e.g. `pnpm typecheck && pnpm test` or `git add -A; git commit -m "..."`. These violate `simpleapps:bash-simplicity` (no `&&`, `;`, `|`, `$()`).

When a wiki step uses shell operators, you MUST translate it into separate, single-command Bash calls. The wiki defines **what** to run; `bash-simplicity` defines **how** to run it. Both rules stand. One does not override the other.

Example: wiki says `pnpm typecheck && pnpm test` → make two Bash calls: `pnpm typecheck`, then `pnpm test`. If the first fails, stop and report. Do not run the second.

Translation does NOT mean skipping or reordering the wiki's logic. It means executing the same operations through compliant tool calls. If a wiki step truly requires a compound operation that cannot be split (rare), flag it and ask the user before proceeding.

## Publish Verification Gate

Before executing any Publish steps, MUST:

1. Show the **current version** and the **proposed new version**
2. Show **what changes** are included since the last release (`git log` from last tag)
3. Show **CI/test status** if available (`gh run list` or local test run)
4. Present a summary: version transition, commit count, test status
5. Require the user to **explicitly confirm** the specific version going to production

This is not just git-safety. It is an active verification checklist. The user MUST see exactly what they are releasing and confirm that specific version.
