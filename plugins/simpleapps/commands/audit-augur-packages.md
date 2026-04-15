---
name: audit-augur-packages
description: Audit site for custom code that duplicates augur package functionality
allowed-tools: Grep, Glob, Read, Bash(gh issue create:*), Bash(gh issue list:*), Skill(project-defaults), Skill(github), Skill(augur-packages), Skill(bash-simplicity)
---

First, use Skill("augur-packages") to load the package reference and anti-pattern catalog, then Skill("project-defaults") for the project layout.

# Audit Augur Packages

Scan the current site repo for custom code that should be replaced with `@simpleapps-com/augur-*` imports. Uses the anti-pattern catalog from the `augur-packages` skill.

## 1. Locate source

Per project-defaults, the git repo is at `repo/`. Use Glob to detect:

1. `repo/app/` → `SOURCE_ROOT = repo/`
2. `repo/src/app/` → `SOURCE_ROOT = repo/src/`

## 2. Check installed packages

Glob for `repo/node_modules/@simpleapps-com/augur-*/package.json`. Only scan anti-patterns for installed packages. Note missing packages separately.

## 3. Scan

Use Grep to search `SOURCE_ROOT` for each anti-pattern. MUST run each as a separate Grep call. Exclude `node_modules/`, `.next/`, test files (`__tests__/`, `*.test.*`, `*.spec.*`).

For each match, check whether the file also imports from `@simpleapps-com/augur-*`. If so, mark as "partial migration" instead of a finding.

### Grep patterns by package

**augur-utils:**
- `from ["']@/lib/utils["']`: custom cn()
- `function formatPrice|const formatPrice|from ["']@/.*format.*price`: custom price formatting
- `from ["']@/types/T`: local type files
- `staleTime.*\d+.*gcTime|const.*CACHE_CONFIG`: custom cache config

**augur-web:**
- `from ["']@/components/ui/`: local UI component imports

**augur-hooks:**
- `function useDebounce|from ["']@/.*useDebounce`: custom debounce
- `function useIsMobile|from ["']@/.*useIsMobile|from ["']@/.*useMobile`: custom mobile detection
- `function useIsHydrated|from ["']@/.*useIsHydrated`: custom hydration check
- `function useItemPrice|function useFormatPrice`: custom price hooks
- `useCartStore|CartStore` in store files: custom cart store

**augur-server:**
- `function cachedSdkCall|function sdkCall`: custom SDK cache
- `function getServerQueryClient`: custom query client
- `function isDev|NODE_ENV.*===.*development` in utility files: custom env detection
- `CredentialsProvider|providers:.*Credentials` without createAuthConfig: manual auth

**Icons/Tailwind:**
- `from ["']lucide-react["']|from ["']@heroicons/react`: wrong icon library
- Glob for `tailwind.config.ts` or `tailwind.config.js` in repo root: v3 config

## 4. Output

### Findings

| # | File | Custom Code | Package Replacement | Priority |
|---|------|-------------|---------------------|----------|

**HIGH** = drop-in replacement. **MEDIUM** = needs refactoring. **LOW** = cosmetic.

### Summary

One line: `X findings (Y high, Z medium, W low) across N packages`

List any packages not installed that SHOULD be.

## 5. Issues (only if asked)

Use Skill("github") conventions. Group findings into one issue per package:

- `chore: replace custom utils with augur-utils`
- `chore: replace local UI imports with augur-web`
- `chore: replace custom hooks with augur-hooks`
- `chore: replace custom server utils with augur-server`
- `chore: switch to augur-tailwind CSS-first config`
- `chore: replace icon library with react-icons/lu`

Each issue body MUST list files and specific replacements from findings.
