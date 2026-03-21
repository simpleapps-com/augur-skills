---
name: quality
description: Discover and run all code quality checks, fix every issue, and flag missing quality tooling. No pre-existing excuses.
allowed-tools: Bash(git -C:*), Bash(pnpm:*), Bash(npm:*), Bash(npx:*), Bash(python:*), Bash(pip:*), Bash(composer:*), Bash(php:*), Bash(rm:*), Skill(quality), Skill(wiki), Skill(project-defaults), Skill(git-safety), Read, Write, Glob, Grep, Edit, Agent
---

First, use Skill("quality") to load quality tooling awareness, then Skill("wiki") to check for project-specific conventions, then Skill("project-defaults") for layout, then Skill("git-safety") for git guardrails.

Run all code quality checks, fix every issue found, and repeat until clean.

## 1. Discover quality tools

Use the tool table and config files from the quality skill to check what's configured. Read `repo/package.json` (or equivalent for PHP/Python). The config files are the source of truth — only run what's defined.

## 2. Flag missing tooling

Use the minimum expected tooling checklist from the quality skill. Report what's missing and suggest the right setup for the project type. Ask the user before adding anything.

Do NOT silently skip missing tools. Flag them every time.

## 3. Run quality checks

Run each discovered check as a separate command. Order matters — fix formatting first, then lint, then typecheck, then test:

1. **Format** — `pnpm format` (or equivalent). Formatters auto-fix.
2. **Lint** — `pnpm lint` (or equivalent). If a `lint:fix` script exists, use it.
3. **Typecheck** — `pnpm typecheck` (or equivalent).
4. **Test** — `pnpm test` (or equivalent).
5. **Dead code** — `pnpm knip` (if configured). Report findings but do not auto-fix — unused exports may be intentional public API.
6. **Other checks** — any additional scripts like `validate-skills`, `check`, etc.

## 4. Fix all issues

For each failing check:

1. Read the error output carefully
2. Fix the issue in the source code using Edit
3. Re-run the check to verify the fix
4. If a fix introduces new issues in other checks, fix those too

### Rules

- Fix EVERY issue. No exceptions. No skipping.
- "Pre-existing" is not an excuse. Context compaction erases your memory of introducing issues earlier in the session. If a check fails, you own it. Fix it.
- If you did not introduce an issue, fix it anyway. The goal is zero issues, not blame assignment.
- If a fix is unclear, explore the codebase to understand the intent before changing code
- If a test fails because of a real bug, fix the bug

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

## 5. Check package freshness

For Node projects, check whether `@simpleapps-com/augur-*` and `augur-api` packages are at their latest versions:

1. Run `ls repo/node_modules/@simpleapps-com/` to find installed packages
2. For each, compare the installed version (`repo/node_modules/@simpleapps-com/<pkg>/package.json`) against the latest on npm (`npm view @simpleapps-com/<pkg> version`)
3. Also check `augur-api` if installed

**augur-* packages (semver):** All `@simpleapps-com/augur-*` packages are published together from a monorepo and MUST be on the same version. If any are mismatched, flag it as an error — mixed versions cause subtle bugs. If any are outdated, all MUST be updated together.

**augur-api (CalVer):** `@simpleapps-com/augur-api` is versioned independently using CalVer (YYYY.MM.seq). Check it separately.

Report any outdated or mismatched packages to the user. Outdated shared packages mean the project is missing bug fixes, new features, and consistency improvements that other sites already have. Suggest updating but let the user decide — updates can require code changes.

## 6. Loop until clean

After fixing all issues from one round:

1. Re-run ALL checks from the beginning
2. If new issues appear, fix them
3. Repeat until all checks pass with zero issues
4. MUST restart from step 3 after ANY code change — a fix in one area can break another

## 7. Report

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
