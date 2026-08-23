---
name: wiki-sync
description: Pull, commit, and push the project wiki in one step. Use when wiki edits are ready to share. Operates on wiki/ only, never the main repo.
allowed-tools: Bash(git -C:*), Bash(gh auth:*), Bash(ls:*), Bash(rm:*), Read, Write, Skill(git-safety), Skill(bash-simplicity), Skill(conventional-commits)
---

First, use Skill("git-safety") for git guardrails, then Skill("bash-simplicity") for Bash conventions, then Skill("conventional-commits") for the commit message format.

## Scope and prohibitions

**This command operates on `wiki/` ONLY.** MUST NOT stage, commit, or push anything in `repo/` or any other git repo, even when that repo has uncommitted changes sitting right next to the wiki's.

Invoking `/wiki-sync` IS the approval for the wiki operations below, and for nothing else (see `simpleapps:git-safety`). MUST NOT ask the user to re-confirm the commit or the push.

MUST NOT force push. MUST NOT resolve a rebase conflict without the user. MUST NOT run `git reset`, `git checkout --`, or anything else that discards a local commit or a local edit.

## Why pull before push

The wiki is a separate clone and GitHub lets anyone edit wiki pages in the browser, so the local copy drifts silently. A push that skipped the pull either fails non-fast-forward or tempts the agent toward `--force`. Committing before the pull means the rebase never has to touch uncommitted work.

## 1. Locate the wiki

Run `ls wiki/`. If `wiki/` does not exist, stop and tell the user. MUST NOT create or clone it.

Run `git -C wiki branch --show-current` and use that branch for the rest of the run. GitHub wikis default to `master`, not `main`. MUST NOT assume either one.

## 2. Survey local state

Run `git -C wiki status --porcelain`.

Untracked entries (`??`) MUST be reported by name before staging. A page authored months ago and never committed is invisible in every other view: it renders locally, it satisfies local links, and only `status` shows it missing. Name them, include them, and keep going. MUST NOT stop to ask whether to include them.

Modified files the current session did not edit MUST also be named in the report. Include them; the user asked to sync the wiki, not a subset of it.

If the tree is clean, skip to step 4. There is nothing to commit, but there may still be something to pull.

## 3. Commit

1. Read the diff with `git -C wiki diff`
2. Write a conventional commit message to `tmp/commit-msg.txt` using the Write tool. Type `docs`, scope `wiki`. Summarize by page and by what changed, not file-by-file
3. `git -C wiki add -A`
4. `git -C wiki commit -F ../tmp/commit-msg.txt`
5. `rm tmp/commit-msg.txt`

Commit BEFORE pulling. A rebase over uncommitted changes either refuses to start or drops them.

## 4. Pull

Run `git -C wiki pull --rebase origin <branch>`.

On conflict: STOP. Report the conflicted files and hand them to the user. MUST NOT auto-resolve, MUST NOT `git rebase --abort` without saying so first, and MUST NOT skip ahead to the push.

## 5. Push

Run `git -C wiki push origin <branch>`.

| Failure | Fix |
|---------|-----|
| 401 / 403 | Run `gh auth setup-git`, then retry the push once |
| non-fast-forward | The pull in step 4 did not take. Re-run step 4. MUST NOT force |

## 6. Report

- Commit SHA and subject line, or "nothing to commit"
- Files committed, flagging any that were previously untracked or edited outside this session
- What the pull brought in, or "already up to date"
- Push result as `<old>..<new>` on `<branch>`

**Then stop.** MUST NOT offer to commit or push the main repo, and MUST NOT suggest a next command.
