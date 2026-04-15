---
name: file-issue
description: File an issue — locally or on another repo — and cross-link it to the current work. Use to capture something worth tracking without losing your flow.
allowed-tools:
  - Bash(gh issue:*)
  - Bash(gh pr:*)
  - Bash(git -C:*)
  - Bash(git remote:*)
  - Bash(rm:*)
  - Read
  - Write
  - Skill(github)
  - Skill(bash-simplicity)
  - Skill(work-habits)
---

First, use Skill("github") to load GitHub conventions, Skill("bash-simplicity") for Bash conventions, and Skill("work-habits") for autonomous execution rules and RFC 2119 compliance.

File an issue and cross-link it to the current work. Two modes:

- **Local** — file on the current repo to track something discovered during this session
- **Cross-repo** — file on another team's repo when the current work depends on a change there

## 1. Determine context

1. Run `git -C repo remote -v` to identify the current repo
2. Find the local issue for the current work (check in order):
   - Branch name for issue references (e.g., `fix/42-description`)
   - Recent commit messages for `#N` references
   - Skip if none found — not all work has an issue yet
3. If the user provided arguments, use them as the issue description

## 2. Choose mode and target

If the user's request is about tracking something in THIS repo (a bug found, a TODO, a follow-up task), this is a **local** issue. If the request involves another team's repo, this is **cross-repo**.

For cross-repo, ask which target repo or infer from context:

| Dependency | Repo |
|------------|------|
| Backend microservices | `simpleapps-com/augur` |
| Shared frontend packages | `simpleapps-com/augur-packages` |
| TypeScript API SDK | `simpleapps-com/augur-api` |
| Another client site | `simpleapps-com/<site-name>` |

## 3. Draft the issue

Use the Write tool to create `tmp/issue-body.txt`. Use the github skill's issue body template (Problem, Expected Behavior, Acceptance Criteria, Context).

For **cross-repo** issues, also include:
- Originating repo: `simpleapps-com/<current-repo>`
- Local issue reference: `simpleapps-com/<current-repo>#N` (if exists)
- Impact: what is blocked without this change

Create the issue immediately — the user invoking this command is the approval:
```bash
gh issue create --repo simpleapps-com/<target> --title "type: description" --body-file tmp/issue-body.txt
```

Capture the new issue URL from the output.

## 4. Cross-link (cross-repo only)

If this is a cross-repo issue AND a local issue exists, link them:

1. Write to `tmp/blocked-comment.txt` using the Write tool:
   ```
   Blocked by simpleapps-com/<target>#N

   Filed upstream issue for <brief description>. This issue cannot be fully resolved until the upstream change lands.
   ```

2. Add the comment:
   ```bash
   gh issue comment <local-number> --repo simpleapps-com/<current-repo> --body-file tmp/blocked-comment.txt
   ```

3. Add the `blocked` label:
   ```bash
   gh issue edit <local-number> --repo simpleapps-com/<current-repo> --add-label blocked
   ```

If this is cross-repo but NO local issue exists, ask the user if they want to create one to track the dependency.

## 5. Clean up

```bash
rm tmp/issue-body.txt
```
```bash
rm tmp/blocked-comment.txt
```

## 6. Report

Show:
- Issue created: `simpleapps-com/<repo>#N` — title
- Cross-linked to: `simpleapps-com/<current-repo>#N` (if cross-repo with local issue)
- Labels added (if any)

MUST NOT push or commit — this command only creates GitHub issues and comments.
