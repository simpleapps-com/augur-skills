---
name: quality
description: Discover and run all code quality checks, fix every issue, and flag missing quality tooling. No pre-existing excuses.
allowed-tools: Bash(git -C:*), Bash(pnpm:*), Bash(npm:*), Bash(npx:*), Bash(python:*), Bash(pip:*), Bash(composer:*), Bash(php:*), Bash(rm:*), Skill(quality), Skill(wiki), Skill(project-defaults), Skill(git-safety), Skill(bash-simplicity), Read, Write, Glob, Grep, Edit, Agent
---

First, use Skill("quality") to load quality tooling awareness, then Skill("wiki") to check for project-specific conventions, then Skill("project-defaults") for layout, then Skill("git-safety") for git guardrails, then Skill("bash-simplicity") for Bash conventions.

Run all code quality checks on the FULL codebase and fix issues found.

**Scope rule**: Fix every issue in files touched during this session — context compaction erases your memory of earlier changes, so what looks pre-existing may be something you introduced. For failures in files you did NOT touch, report them as separate issues to fix later rather than fixing them inline. The goal is zero issues in the work area, not unbounded cleanup of the entire codebase. Fixing unrelated files is local optimization that delays shipping the actual task.

## 1. Discover quality tools

Use the tool table and config files from the quality skill to check what's configured. Read `repo/package.json` (or equivalent for PHP/Python). The config files are the source of truth — only run what's defined.

## 2. Flag missing tooling

Use the minimum expected tooling checklist from the quality skill. Report what's missing and suggest the right setup for the project type. Ask the user before adding anything.

Do NOT silently skip missing tools. Flag them every time.

When suggesting new tools, always suggest adding them as `package.json` scripts (e.g., `"knip": "knip"`, `"format": "prettier --write ."`). Scripts run via `pnpm` are pre-approved (`pnpm:*` is in the allow list) — no permission prompts. A tool that isn't in `package.json` will trigger a permission prompt every time it runs, defeating the purpose of autonomous quality checks.

## 3. Update augur packages

For Node projects with `@simpleapps-com/augur-*` packages installed — do this BEFORE running quality checks. Outdated or mismatched augur packages cause lefthook and other checks to fail.

**If `augur-doctor` is available** (ships with `@simpleapps-com/augur-config`): run `pnpm augur-doctor .` from the site directory. This checks version alignment, latest versions, and platform standard conformance in one pre-approved command. No permission prompt.

**If `augur-doctor` is NOT available**: use the Read tool to check each package's `package.json` for its version, and `npm view @simpleapps-com/<pkg> version` as separate Bash calls for latest versions. MUST NOT use `node -e` or `require()`.

**augur-* packages (semver):** All `@simpleapps-com/augur-*` packages are published together from a monorepo and MUST be on the same version. If any are mismatched, flag it as an error — mixed versions cause subtle bugs. If any are outdated, all MUST be updated together.

**augur-api (CalVer):** `@simpleapps-com/augur-api` is versioned independently using CalVer (YYYY.MM.seq). Check it separately.

If any augur-* packages are outdated or mismatched, update them automatically. Client sites use pnpm workspaces — augur packages are installed at the site level, not the root. Use `--filter` to target the right workspace:

```bash
pnpm --filter <site-name> update @simpleapps-com/augur-config @simpleapps-com/augur-hooks @simpleapps-com/augur-server @simpleapps-com/augur-utils @simpleapps-com/augur-web @simpleapps-com/augur-tailwind
```

To find the site name, read `pnpm-workspace.yaml` and the site-level `package.json`. For non-workspace projects, run `pnpm update` without `--filter`.

Update ALL augur-* packages together in a single command — never update one without the others.

**augur-api** is independent (CalVer) — update it separately if outdated: `pnpm --filter <site-name> update @simpleapps-com/augur-api`.

## 4. Verify pnpm lockfile sync

For pnpm workspace projects (check for `pnpm-workspace.yaml`), the root `pnpm-lock.yaml` and any site-level lockfiles MUST be in sync. CI uses `--frozen-lockfile` and will fail if they diverge. This is the most common cause of deploy failures.

Check: `pnpm install --frozen-lockfile` from the repo root. If it fails, the lockfiles are out of sync. Fix: run `pnpm install` from the repo root to regenerate, then stage and commit the updated lockfile alongside your other changes.

This check MUST run after any package updates (step 3) and before quality checks (step 5). If you updated packages in step 3, the lockfile is almost certainly out of sync — always run `pnpm install` at the root after updating.

## 5. Run quality checks

Run each discovered check as a separate command. Order matters — fix formatting first, then lint, then typecheck, then test:

1. **Format** — `pnpm format` (or equivalent). Formatters auto-fix.
2. **Lint** — `pnpm lint` (or equivalent). If a `lint:fix` script exists, use it.
3. **Typecheck** — `pnpm typecheck` (or equivalent).
4. **Test** — `pnpm test` (or equivalent).
5. **Dead code** — `pnpm knip` (if configured). Report findings but do not auto-fix — unused exports may be intentional public API.
6. **Other checks** — any additional scripts like `validate-skills`, `check`, etc.

## 6. Fix issues in scope

For each failing check:

1. Read the error output carefully
2. If the failure is in a file touched during this session, fix it
3. If the failure is in an unrelated file, add it to the report as a separate finding
4. Re-run the check to verify the fix
5. If a fix introduces new issues in other checks, fix those too

### Rules

- Fix every issue in files you touched. No exceptions. No skipping.
- Context compaction erases your memory of earlier changes — if a check fails in a file you might have touched, fix it. Err on the side of owning it.
- For failures in files you definitely did not touch, report them — do not fix them inline. They are separate work.
- If a fix is unclear, explore the codebase to understand the intent before changing code
- If a test fails because of a real bug in code you touched, fix the bug

### Resolve, never hide

The solution to a failing check is ALWAYS to fix the underlying code. NEVER:

- Disable or weaken a lint rule (no `eslint-disable`, no rule removal)
- Skip, delete, or `.skip` a failing test
- Add `@ts-ignore`, `// @ts-expect-error`, or `type: any` to silence type errors
- Suppress warnings, lower coverage thresholds, or modify quality configs
- Add `--no-verify`, `--force`, or flags that bypass checks

If a rule or test seems wrong, investigate why it exists before concluding it should change. Rules exist for reasons. If after investigation a rule genuinely does not apply, explain the reasoning to the user and let them decide — do not unilaterally disable it.

### Detect existing suppressions

Scan the codebase for existing disabled checks: `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `.skip` tests, `noqa`, `phpcs:ignore`, and similar suppression comments. Report every instance found to the user so they can decide whether each should be resolved. These are technical debt — make them visible.

## 7. Loop until clean

After fixing all issues from one round:

1. Re-run ALL checks from the beginning
2. If new issues appear, fix them
3. Repeat until all checks pass with zero issues
4. MUST restart from step 4 after ANY code change — a fix in one area can break another

## 8. Report

```
## Quality Report

**Tools discovered**: lint, format, typecheck, test
**Missing tooling**: lefthook (pre-commit hooks)

### Results
- Format: ✅ clean
- Lint: ✅ 3 issues fixed
- Typecheck: ✅ clean
- Test: ✅ 12/12 passing

### Files modified
- path/to/file.ts — fixed lint issues
- path/to/other.ts — fixed type error
```
