---
name: quality
description: Discover and run all code quality checks, fix every issue, and flag missing quality tooling. No pre-existing excuses.
allowed-tools: Bash(git -C:*), Bash(pnpm:*), Bash(npm:*), Bash(npx:*), Bash(python:*), Bash(pip:*), Bash(composer:*), Bash(php:*), Bash(rm:*), Skill(quality), Skill(wiki), Skill(project-defaults), Read, Write, Glob, Grep, Edit, Agent
---

First, use Skill("quality") to load quality tooling awareness, then Skill("wiki") to check for project-specific conventions, then Skill("project-defaults") for layout.

Run all code quality checks, fix every issue found, and repeat until clean. There are no "pre-existing" issues — most were introduced this session and lost to context compaction. Fix everything.

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

- Fix EVERY issue. No exceptions. No "this is pre-existing." No skipping.
- If a fix is unclear, explore the codebase to understand the intent before changing code
- Do NOT disable linting rules, skip tests, or suppress warnings to make checks pass
- Do NOT modify coverage thresholds or quality configs to lower the bar
- If a test fails because of a real bug, fix the bug

## 5. Loop until clean

After fixing all issues from one round:

1. Re-run ALL checks from the beginning
2. If new issues appear, fix them
3. Repeat until all checks pass with zero issues
4. MUST restart from step 3 after ANY code change — a fix in one area can break another

## 6. Report

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
