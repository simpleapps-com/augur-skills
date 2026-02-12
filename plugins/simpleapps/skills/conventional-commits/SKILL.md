---
name: conventional-commits
description: Format all commit messages per the Conventional Commits v1.0.0 spec. Use when creating commits, reviewing commit messages, or discussing git workflow.
---

# Conventional Commits

Spec: https://www.conventionalcommits.org/en/v1.0.0/

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

- `feat` — new feature (SemVer MINOR)
- `fix` — bug fix (SemVer PATCH)
- Also permitted: `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`

## Rules

- Scope is optional, in parentheses: `feat(parser):`
- Description MUST immediately follow the colon and space
- Body is optional, separated by one blank line from description
- Footers are optional, separated by one blank line from body
- Breaking changes: add `!` before colon OR use `BREAKING CHANGE:` footer (SemVer MAJOR)
- `BREAKING CHANGE` MUST be uppercase
- Footer tokens use hyphens for spaces (e.g., `Acked-by`)
