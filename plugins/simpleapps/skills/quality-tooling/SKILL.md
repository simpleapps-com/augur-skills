---
name: quality-tooling
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
| **knip** | Dead code: unused exports, deps, and files | `knip.json`, `knip.ts` | `pnpm knip` |
| **Lefthook** | Pre-commit hooks: run checks before push | `lefthook.yml` | auto on commit |

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
- [ ] Linting: suggest eslint / ruff / phpstan
- [ ] Formatting: suggest prettier / black / php-cs-fixer
- [ ] Testing: suggest vitest / pytest / phpunit
- [ ] Dead code detection: suggest knip
- [ ] Pre-commit hooks: suggest lefthook
```

Do not install or configure tools without the user's approval. Flag what's missing and explain why it helps. Let the user decide.

## Runtime Freshness

Projects SHOULD target the current Active LTS of their language runtime. Maintenance LTS is acceptable. EOL runtimes SHOULD be flagged.

Runtime freshness is advisory, not a hard failure. Legitimate exceptions exist: libraries with documented compatibility policies, hosting-locked client projects, migration-in-progress repos. Surface findings as a prompt and let the user decide.

Check the current LTS from the language's official schedule, not memory (LTS designations rotate each October):

- Node: https://nodejs.org/en/about/previous-releases
- Python: https://devguide.python.org/versions/
- PHP: https://www.php.net/supported-versions.php

### Where to check

- CI matrices in `.github/workflows/*.yml`
- `engines` in `package.json`
- `python_requires` in `pyproject.toml` / `setup.py`
- `require` or `config.platform.php` in `composer.json`

### Prompt template

> "CI matrix includes Node 18 (EOL). Current Active LTS is Node 24. Drop EOL and add current LTS?"

If the user cites a constraint (hosting, compatibility, library support policy), record it in the project's wiki so future sessions see the exception and skip the prompt.

## When to suggest

- **Setting up a new project**: suggest the full set
- **Reviewing code with unused imports/exports**: suggest knip
- **Seeing inconsistent formatting**: suggest prettier
- **No tests for changed code**: suggest vitest
- **No pre-commit hooks**: suggest lefthook
- **CI matrix or `engines` pins an EOL runtime**: suggest dropping it and adding current Active LTS

## Fix everything, hide nothing

See work-habits: "Leave it better than you found it" and "Resolve, never hide." Both apply fully to quality checks. Fix every issue regardless of who introduced it. MUST NOT add a suppression. Fix the code.

## Suppressions are defects

An existing suppression is a defect to fix in the same run, not a finding to report. MUST NOT report one as "pre-existing" or "technical debt" and move on. A clean run means **0 suppressions**, not "0 new suppressions".

### Defect classes

| Ecosystem | Directives |
|-----------|-----------|
| JS / TS | `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line` (any rule), `@ts-ignore`, `@ts-expect-error`, `prettier-ignore`, `.only` / `.skip` / `xit` / `xdescribe` on tests |
| Python | `# noqa`, `# type: ignore`, `pytest.mark.skip` |
| PHP | `phpcs:ignore`, `@phpstan-ignore*`, `markTestSkipped` |

### Scope

Discover the source directories from the project, not a fixed list: `tsconfig.json` `include`, the ESLint config, `pyproject.toml` packages, `composer.json` autoload. Search from `repo/` with one `grep -rn` (or `rg`) per directive. Exclude `node_modules/`, `vendor/`, build output, and generated files.

### A justification comment does not make it acceptable

`// eslint-disable-next-line -- deps are stable` documents the hiding; it does not fix it. The check still cannot see the code. The comment is not a pass.

### Fix recipes

| Suppressed rule | Fix |
|-----------------|-----|
| `react-hooks/exhaustive-deps` | Stabilise the dependency: `useCallback`, `useMemo`, or a `useRef`-held value; list the real dependencies |
| `@typescript-eslint/no-explicit-any` | Use the real type, or `unknown` plus narrowing |
| `@ts-expect-error` on a CSS module import | Add a `css-modules.d.ts` declaration |
| `@ts-expect-error` on an untyped JS subpath | Add a local `.d.ts` module declaration |
| `@typescript-eslint/no-deprecated` from an `@simpleapps-com/augur-*` package | Migrate to the replacement API |
| `.skip` / `.only` on a test | Fix the test so it passes. If the test is obsolete, delete it; no user approval is needed for an obsolete test |

### The one exception

A deprecated augur-* API with **no non-deprecated replacement yet**. Then: file an upstream issue (`/file-issue` to `simpleapps-com/augur-packages`) and leave the suppression with the issue URL on the same line. Report it as upstream-blocked, with the link. No other exception exists.

## pnpm lockfile sync

In pnpm workspace projects, the root `pnpm-lock.yaml` and site-level lockfiles MUST stay in sync. CI uses `--frozen-lockfile` and will reject mismatched lockfiles. This is the most common cause of deploy failures.

After ANY `pnpm install`, `pnpm update`, or `pnpm add` in a workspace, run `pnpm install` at the repo root to regenerate the root lockfile. Commit both lockfiles together. If you forget, the next deploy will fail.

## Running quality checks

Use the `/quality` command to discover and run all configured checks. It handles the full cycle: discover, run, fix, repeat until clean.
