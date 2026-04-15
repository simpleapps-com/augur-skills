---
name: augur-packages
description: Shared npm packages under @simpleapps-com/augur-*. Directs agents to check installed packages before writing custom code. This skill is a starting point; always read the actual package code for current API surface.
allowed-tools:
  - Read
  - Glob
  - Grep
---

# Augur Packages

## Custom code is a liability. Shared code is an asset.

Every line of custom site code carries maintenance cost: it must be understood, tested, and updated by whoever touches it next. Shared packages are the opposite: maintained once, benefiting every site. When you write custom code that a package already handles, you are adding a liability. When you adopt a package export, you are removing one.

This means: always prefer package solutions over custom code. When no package solution exists but the code would benefit other sites, suggest it as a package addition. The goal is to shrink the liability (custom code) and grow the asset (shared packages) over time.

Shared npm packages for Next.js ecommerce sites and React Native apps. Published to npm under `@simpleapps-com`. Source: `simpleapps-com/augur-packages`.

Before writing custom code, check whether a package export already solves the problem.

## Ground Truth: Read the Docs

This skill is a **stub, not an archive**. New packages are created, existing packages gain features, APIs evolve. This skill MUST NOT be treated as the complete picture.

**Always read the installed packages' documentation in `node_modules/`:**

1. Use `Glob("repo/node_modules/@simpleapps-com/*")` to discover ALL available packages. There may be packages not listed here.
2. Read `repo/node_modules/@simpleapps-com/<package>/llms.txt`, which is machine-readable and lists every export with descriptions and usage examples. This is the fastest path to discovering what exists.
3. Read `repo/node_modules/@simpleapps-com/<package>/README.md` for full API docs, code examples, and "Replaces" guidance
4. MUST NOT read `dist/`, `.d.ts`, or compiled JS files to discover capabilities. They are minified, chunked, and incomplete. The README and llms.txt are the source of truth.

When this skill and the installed docs disagree, **the installed docs win**. This skill exists to point you in the right direction, not to replace reading the docs.

## Known Packages

These are starting hints, not a complete list. Always check `node_modules/@simpleapps-com/` for the full set.

| Package | Purpose |
|---------|---------|
| `augur-utils` | Types, formatters, cache config, Valibot schemas. Zero framework dependencies. |
| `augur-web` | shadcn/Radix UI components. Per-component entry points. |
| `augur-hooks` | React Query hooks and Zustand stores. Cross-platform. |
| `augur-server` | Server-side utilities for Next.js: Redis caching, auth factory, query client. |
| `augur-tailwind` | Tailwind v4 CSS theme. No config file needed. |

## How to Check for Package Solutions

MUST follow this procedure before writing custom code or filing a package issue:

### Step 1: Read llms.txt

For each installed `@simpleapps-com/augur-*` package, read its `llms.txt`:
```
Read("repo/node_modules/@simpleapps-com/<package>/llms.txt")
```
This lists every export with descriptions and usage examples.

### Step 2: Read README.md for details

If llms.txt shows a relevant export, read the README for full API, code examples, and "Replaces" guidance showing what site code it eliminates.

### Step 3: MUST NOT grep compiled output

MUST NOT read or grep `dist/`, `.d.ts`, `.js`, or any compiled files to discover package capabilities. These are minified build artifacts, unreliable for discovery. The README and llms.txt are the ONLY source of truth.

### Step 4: Before filing a package issue

Before creating an issue on `simpleapps-com/augur-packages` requesting a new feature:
1. Search ALL package llms.txt files for the function/hook name
2. Search ALL package README.md files for the concept
3. If found, the problem is site adoption, not a package gap. Use the existing export.

### Step 5: Before writing custom code

Before creating a custom hook, utility, or action in a site:
1. Search ALL package llms.txt files for similar functionality
2. Check the augur-hooks README "Examples" section for the pattern
3. If a package export exists, use it. If it does not work as expected, file a bug on the package, not a reimplementation in the site.

## What Stays Site-Specific

MUST NOT be replaced by packages:
- **Server actions** (`"use server"`): site-specific business logic
- **Layout components** (Header, Footer, MainMenu): brand-specific
- **Domain components** (ProductItem, CartTable, CategoryCard): compose UI primitives
- **Auth callbacks**: injected into package auth factory
- **Cart mutation callbacks**: depend on site-specific server actions
- **CSS variable overrides**: brand colors, fonts, radius
- **next.config**: image domains, redirects, security headers
- **Site integrations**: GA4, Maps, reCAPTCHA

## Suggest Package Improvements

The augur packages exist to share common code across ALL Node projects. When you find yourself writing code that would benefit other sites, suggest it as a package addition:

- Create a GitHub issue on `simpleapps-com/augur-packages` describing the proposed addition
- Explain what it does, which sites would benefit, and why it belongs in the shared package
- Examples: a new utility function, a reusable hook, a common UI component, a shared type

The goal is to grow the packages over time so sites write less custom code.

## augur-doctor

`augur-doctor` ships with `@simpleapps-com/augur-config`. It checks version alignment, latest versions, and platform standard conformance. Run via `pnpm augur-doctor .` from the site directory (pre-approved, no permission prompt). For full documentation, see the augur-packages wiki page `guide-site-assessment.md` (use the cross-project wiki path from `simpleapps:wiki`).

## Platform Standards

- **Icons:** `react-icons/lu`
- **Tailwind:** v4, CSS-first
- **Validation:** Valibot (not Zod, not Yup)
- **Auth:** NextAuth 5 via package auth factory
- **Reference site:** Ask the user which site to reference. Use `Grep`, `Glob`, and `Read` with the project path (see `simpleapps:project-defaults` for layout). MUST NOT use `find`, `grep`, or other shell commands.
