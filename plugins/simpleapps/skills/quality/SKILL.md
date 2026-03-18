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

## Running quality checks

Use the `/quality` command to discover and run all configured checks. It handles the full cycle: discover, run, fix, repeat until clean.
