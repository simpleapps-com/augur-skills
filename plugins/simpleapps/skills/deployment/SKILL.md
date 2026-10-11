---
name: deployment
description: Project deployment conventions. Reads the wiki Deployment page and executes submit, stage, or publish steps. Refuses to operate without a Deployment page.
user-invocable: false
allowed-tools:
  - Read
  - Bash
  - Skill(git-safety)
---

First, use Skill("git-safety") to load git guardrails. The shipping commands (`/submit`, `/stage`, `/publish`) load `conventional-commits` and `github` directly when they need them. This skill does not pre-load them.

# Deployment

This skill reads the project's `wiki/Deployment.md` and executes the steps defined there. Each project defines its own deployment workflow. This skill is the executor, the wiki is the config.

## Deployment Page Format

Every project wiki MUST have a `Deployment.md` page with up to three sections:

```
## Submit
How to commit and create a PR for review.

## Deploy
How to deploy to staging. (Run by `/stage`: the command is named "stage"; the wiki section is "Deploy".)

## Publish
How to release to production.
```

Not all projects need all three. Client sites may only have Submit and Deploy. Package repos may have all three.

## How It Works

1. Read `wiki/Deployment.md`
2. Find the section matching the requested action. Command→section map: `/submit`→`## Submit`, `/stage`→`## Deploy`, `/publish`→`## Publish`. Note `/stage` maps to the `## Deploy` heading.
3. If the page or section is missing, **refuse to operate**. Tell the user to run `/wiki-curate` to generate it.
4. Execute the steps in that section

## Command approval model

The user invoking a command IS the approval to execute all its steps, including git writes. MUST NOT ask for confirmation before or during execution: not "should I proceed?", not "which version?", not "confirm this release?".

- `/submit`: execute all steps (commit, push, PR). Report at the end.
- `/stage`: execute all steps. Report at the end.
- `/publish`: execute all steps after the pre-flight checks below pass. MUST NOT ask for a second confirmation of the version or the release; invoking `/publish` is the approval. Stop only when a check fails.

## Guard Rails

- **If `wiki/Deployment.md` does not exist, STOP IMMEDIATELY.** Do not guess, do not improvise, do not infer steps from the codebase. Tell the user to run `/wiki-curate` to generate it. Then do nothing else.
- **If the relevant section (Submit, Deploy, or Publish) is missing from the page, STOP IMMEDIATELY.** Same rule: do not guess the steps.
- MUST NOT guess deployment steps. Only execute what the wiki defines.

## Translating Wiki Shell Commands

Wiki Deployment pages often contain shell snippets written for humans, e.g. `pnpm typecheck && pnpm test` or `git add -A; git commit -m "..."`. These violate `simpleapps:bash-simplicity` (no `&&`, `;`, `|`, `$()`).

When a wiki step uses shell operators, you MUST translate it into separate, single-command Bash calls. The wiki defines **what** to run; `bash-simplicity` defines **how** to run it. Both rules stand. One does not override the other. (The invoking commands `/submit`, `/stage`, and `/publish` load `Skill("bash-simplicity")`; if reading this skill on its own, load it first for the full translation rules.)

Example: wiki says `pnpm typecheck && pnpm test` → make two Bash calls: `pnpm typecheck`, then `pnpm test`. If the first fails, stop and report. Do not run the second.

Translation does NOT mean skipping or reordering the wiki's logic. It means executing the same operations through compliant tool calls. If a wiki step truly requires a compound operation that cannot be split (rare), flag it and ask the user before proceeding.

## Publish Pre-flight Checks

Before the first Publish git write, MUST:

1. Show the **current version** and the **new version**, computed from the versioning scheme. MUST NOT ask the user for the version
2. Show **what changes** are included since the last release (`git log` from last tag). Zero commits: stop
3. Show **CI/test status** (`gh run list` or local test run). Any failure: stop
4. Confirm a clean tree that matches its remote. Otherwise: stop
5. Present a summary (version transition, commit count, test status), then continue without waiting

The checks exist to catch a broken release, not to ask permission. The user already approved by invoking `/publish`; a second "confirm this version?" prompt MUST NOT be added.
