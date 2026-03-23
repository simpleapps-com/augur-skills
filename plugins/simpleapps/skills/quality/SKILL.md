---
name: quality
description: Quality tooling awareness for projects. Covers linting, formatting, type checking, testing, dead code detection, and pre-commit hooks. Use when reviewing code, setting up projects, or noticing missing quality tooling.
---

# Quality Tooling

These tools keep codebases healthy. When working in a project, check whether they are configured. If any are missing, suggest them to the user.

## Tools to know

### Node / TypeScript

| Tool | Purpose | Config files | Run command |
|------|---------|-------------|-------------|
| **ESLint** | Catch bugs and enforce patterns | `.eslintrc*`, `eslint.config.*` | `pnpm lint` |
| **Prettier** | Consistent formatting | `.prettierrc*`, `prettier.config.*` | `pnpm format` |
| **TypeScript** | Type safety | `tsconfig.json` | `pnpm typecheck` |
| **Vitest** / **Jest** | Tests | `vitest.config.*`, `jest.config.*` | `pnpm test` |
| **knip** | Dead code — unused exports, deps, and files | `knip.json`, `knip.ts` | `pnpm knip` |
| **Lefthook** | Pre-commit hooks — run checks before push | `lefthook.yml` | auto on commit |

Also check `repo/package.json` for scripts containing: `lint`, `format`, `typecheck`, `test`, `check`, `validate`.

### PHP

Check `repo/composer.json` for scripts. Look for PHPStan (static analysis), PHP-CS-Fixer (formatting), PHPUnit (tests).

### Python

Check `repo/pyproject.toml` or `repo/setup.cfg`. Look for ruff (lint/format), black (formatting), mypy (types), pytest (tests).

## Minimum expected tooling

Every project SHOULD have at minimum: **lint**, **format**, **test**. Increasingly, **dead code detection (knip)** and **pre-commit hooks (lefthook)** are expected.

If any are missing, flag them:

```
Missing quality tooling:
- [ ] Linting — suggest: eslint / ruff / phpstan
- [ ] Formatting — suggest: prettier / black / php-cs-fixer
- [ ] Testing — suggest: vitest / pytest / phpunit
- [ ] Dead code detection — suggest: knip
- [ ] Pre-commit hooks — suggest: lefthook
```

Do not install or configure tools without the user's approval. Flag what's missing and explain why it helps — let the user decide.

## When to suggest

- **Setting up a new project** — suggest the full set
- **Reviewing code with unused imports/exports** — suggest knip
- **Seeing inconsistent formatting** — suggest prettier
- **No tests for changed code** — suggest vitest
- **No pre-commit hooks** — suggest lefthook

## Resolve, never hide

When a check fails, fix the underlying code. NEVER disable lint rules, skip tests, suppress warnings, lower thresholds, or add ignore comments to make checks pass. The goal is to resolve issues, not hide them. If a rule seems wrong, investigate why it exists and ask the user before changing it.

When reviewing code, scan for existing suppressions (`eslint-disable`, `@ts-ignore`, `.skip`, `noqa`, etc.) and flag them to the user. These are hidden technical debt that should be evaluated for resolution.

## Browser Error Overlays

When debugging in the browser (Chrome automation), Next.js and other frameworks show a **red error overlay** at the bottom of the page when there are runtime errors. This overlay contains the actual error message, stack trace, and usually the exact file and line number causing the problem.

MUST click on the error overlay and read the full error before attempting any fix. 95% of the time the answer is right there. Do not ignore it, do not guess at the problem, do not look elsewhere first — read the error overlay. If using Chrome automation tools, click the overlay element to expand it and read the details.

## Running quality checks

Use the `/quality` command to discover and run all configured checks. It handles the full cycle: discover, run, fix, repeat until clean.
