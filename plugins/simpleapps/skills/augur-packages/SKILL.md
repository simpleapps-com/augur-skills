---
name: augur-packages
description: Shared npm packages under @simpleapps-com/augur-*. Directs agents to check installed packages before writing custom code. This skill is a starting point — always read the actual package code for current API surface.
allowed-tools:
  - Read
  - Glob
  - Grep
---

# Augur Packages

Shared npm packages for Next.js ecommerce sites and React Native apps. Published to npm under `@simpleapps-com`. Source: `simpleapps-com/augur-packages`.

Before writing custom code, check whether a package export already solves the problem.

## Ground Truth: Read the Code

This skill is a **stub, not an archive**. New packages are created, existing packages gain features, APIs evolve. This skill MUST NOT be treated as the complete picture.

**Always read the installed packages in your project's `node_modules/`:**

1. Use `Glob("repo/node_modules/@simpleapps-com/*")` to discover ALL available packages — there may be packages not listed here
2. Read `repo/node_modules/@simpleapps-com/<package>/package.json` for the `exports` field to find available sub-paths
3. Read files in `repo/node_modules/@simpleapps-com/<package>/dist/` to understand the current API surface
4. Do NOT look at the source repo or other folders — only read what is installed in your project's `node_modules/`

When this skill and the installed code disagree, **the installed code wins**. This skill exists to point you in the right direction, not to replace reading the code.

## Known Packages

These are starting hints — not a complete list. Always check `node_modules/@simpleapps-com/` for the full set.

| Package | Purpose |
|---------|---------|
| `augur-utils` | Types, formatters, cache config, Valibot schemas. Zero framework dependencies. |
| `augur-web` | shadcn/Radix UI components. Per-component entry points. |
| `augur-hooks` | React Query hooks and Zustand stores. Cross-platform. |
| `augur-server` | Server-side utilities for Next.js — Redis caching, auth factory, query client. |
| `augur-tailwind` | Tailwind v4 CSS theme. No config file needed. |

## How to Check for Package Solutions

When considering custom code:

1. Use `Glob("repo/node_modules/@simpleapps-com/*")` to see what's installed
2. Read the package's `package.json` `exports` and its `dist/` files for available functions, hooks, and components
3. Look for the hook triple pattern in augur-hooks: `use<Name>`, `get<Name>Options`, `get<Name>Key`
4. Check augur-web for UI components before building custom ones
5. Only use what is in your `node_modules/` — do not reference the source repo

## What Stays Site-Specific

MUST NOT be replaced by packages:
- **Server actions** (`"use server"`) — site-specific business logic
- **Layout components** (Header, Footer, MainMenu) — brand-specific
- **Domain components** (ProductItem, CartTable, CategoryCard) — compose UI primitives
- **Auth callbacks** — injected into package auth factory
- **Cart mutation callbacks** — depend on site-specific server actions
- **CSS variable overrides** — brand colors, fonts, radius
- **next.config** — image domains, redirects, security headers
- **Site integrations** — GA4, Maps, reCAPTCHA

## Suggest Package Improvements

The augur packages exist to share common code across ALL Node projects. When you find yourself writing code that would benefit other sites, suggest it as a package addition:

- Create a GitHub issue on `simpleapps-com/augur-packages` describing the proposed addition
- Explain what it does, which sites would benefit, and why it belongs in the shared package
- Examples: a new utility function, a reusable hook, a common UI component, a shared type

The goal is to grow the packages over time so sites write less custom code.

## Platform Standards

- **Icons:** `react-icons/lu`
- **Tailwind:** v4, CSS-first
- **Validation:** Valibot (not Zod, not Yup)
- **Auth:** NextAuth 5 via package auth factory
- **Reference site:** ampro-online — use `Grep`, `Glob`, and `Read` with path `~/projects/clients/ampro-online/repo` to see how patterns are implemented. MUST NOT use `find`, `grep`, or other shell commands.
