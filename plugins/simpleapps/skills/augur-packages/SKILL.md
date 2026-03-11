---
name: augur-packages
description: Shared npm packages under @simpleapps-com/augur-*. Covers what each package provides, correct import patterns, key usage patterns, and what custom code they replace. Use when writing code for a site that consumes augur packages, during migration, or when deciding whether to write custom code.
---

# Augur Packages

Shared npm packages for Next.js ecommerce sites and React Native apps. Published to npm under `@simpleapps-com`. Source: `simpleapps-com/augur-packages`.

Before writing custom code, check whether a package export already solves the problem.

## augur-utils

Types, formatters, cache config. Zero framework dependencies. Works everywhere.

```typescript
import { formatPrice, CACHE_CONFIG } from "@simpleapps-com/augur-utils";
import type { TCartLine, TProductItem } from "@simpleapps-com/augur-utils";
import { cn } from "@simpleapps-com/augur-utils/web"; // clsx + tailwind-merge
```

**Types** cover: cart, category, inventory, product, pricing, attributes, UOM, supplier, filter, customer, menu, order, shipping, search, tax, metadata. Each has a Valibot schema (e.g., `CartLineSchema`).

**Cache tiers** for React Query — every hook maps to one of these:

| Tier | Use Case |
|------|----------|
| `CACHE_CONFIG.STATIC` | Rarely changes (categories, item master) |
| `CACHE_CONFIG.SEMI_STATIC` | Changes occasionally (pricing, search) |
| `CACHE_CONFIG.DYNAMIC` | Changes frequently (stock levels) |
| `CACHE_CONFIG.CART` | User-specific, short-lived |
| `CACHE_CONFIG.REALTIME` | Always refetch |

## augur-web

shadcn/Radix UI components. Per-component entry points — no barrel export, only what you import gets bundled.

```typescript
import { Button } from "@simpleapps-com/augur-web/button";
import { Dialog, DialogContent, DialogTitle } from "@simpleapps-com/augur-web/dialog";
import { Card, CardHeader, CardContent } from "@simpleapps-com/augur-web/card";
```

**Component conventions:** CVA variants, `React.forwardRef`, `asChild` via Radix Slot, `cn()` for class merging, `"use client"` preserved in build, `displayName` set, icons use `react-icons/lu`.

**Tailwind content detection:** Tailwind v4 auto-detects sources. If augur-web classes are missing, add `@source "../node_modules/@simpleapps-com/augur-web/dist";` to your CSS.

## augur-hooks

React Query hooks and Zustand stores. Cross-platform (works in Next.js and React Native).

```typescript
// Cross-platform
import { useItemPrice, useCartStore, useDebounce, AugurHooksProvider } from "@simpleapps-com/augur-hooks";
// Web only (DOM-dependent)
import { useIsMobile, useIsHydrated } from "@simpleapps-com/augur-hooks/web";
```

**Hook triple pattern** — every query hook exports three things:
- `use<Name>(params, options?)` — client-side hook (reads SDK from provider context)
- `get<Name>Options(api, params)` — server-side prefetch (accepts SDK directly)
- `get<Name>Key(params)` — query key factory for cache invalidation

```typescript
// Client
const { data } = useItemPrice(itemId, customerId, 1);

// Server prefetch (no React context)
await queryClient.prefetchQuery(getItemPriceOptions(api, itemId, customerId));

// Cache invalidation
queryClient.invalidateQueries({ queryKey: getItemPriceKey(itemId, customerId) });
```

**queryFn override** — web consumers can route through cached server actions:

```typescript
const { data } = useItemPrice(itemId, customerId, 1, {
  queryFn: () => getCachedItemPrice(itemId, customerId, 1),
});
```

**Cart hooks** use dependency injection — the package provides React Query orchestration (optimistic updates, invalidation, loading states), consumers inject site-specific mutation callbacks.

**Provider required:** All query hooks need `AugurHooksProvider` wrapping the app with an SDK instance.

## augur-server

Server-side utilities for Next.js. Redis caching, auth factory, query client, environment detection.

```typescript
import { cachedSdkCall, getServerQueryClient, isDev, sdkCall } from "@simpleapps-com/augur-server";
import { createAuthConfig } from "@simpleapps-com/augur-server/auth";
```

**cachedSdkCall** wraps SDK calls with Redis caching (SHA-256 key hashing, per-method stats, fire-and-forget writes, circuit breaker). Falls through without caching if ioredis is not installed.

**createAuthConfig** — NextAuth 5 factory with dependency-injected callbacks:

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth(
  createAuthConfig({
    callbacks: { getUserProfile, cartHdrLookup }, // site-specific
    defaultCustomerId: process.env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID,
  }),
);
```

**Site action registry** — `createServerSite()` creates a process-global singleton. Self-heals via three-tier fallback (globalThis → module cache → auto-init from env vars).

## augur-tailwind

Tailwind v4 CSS theme. No `tailwind.config.ts` needed.

```css
@import "tailwindcss";
@import "@simpleapps-com/augur-tailwind/base.css";
@plugin "tailwindcss-animate";
```

Override brand with CSS variables: `--primary`, `--secondary`, `--radius`, etc. All HSL components (no wrapper).

## What Stays Site-Specific

MUST NOT be replaced by packages:
- **Server actions** (`"use server"`) — site-specific business logic
- **Layout components** (Header, Footer, MainMenu) — brand-specific
- **Domain components** (ProductItem, CartTable, CategoryCard) — compose UI primitives
- **Auth callbacks** (`getUserProfile`, `cartHdrLookup`) — injected into `createAuthConfig`
- **Cart mutation callbacks** — depend on site-specific server actions
- **CSS variable overrides** — brand colors, fonts, radius
- **next.config** — image domains, redirects, security headers
- **Site integrations** — GA4, Maps, reCAPTCHA

## Anti-Pattern Catalog

Custom code that duplicates package exports. When you see these in a site, replace with the package version.

| Custom Code | Replace With |
|-------------|-------------|
| `cn()` in `@/lib/utils` | `cn` from `augur-utils/web` |
| `formatPrice()` helpers | `formatPrice` from `augur-utils` |
| Local types (`@/types/T*`) | Types from `augur-utils` |
| Custom `CACHE_CONFIG` / inline TTLs | `CACHE_CONFIG` from `augur-utils` |
| `@/components/ui/*` imports | `augur-web/<component>` |
| Custom breadcrumb, quantity, pagination, form inputs | `augur-web/<component>` |
| Custom `useDebounce` | `useDebounce` from `augur-hooks` |
| Custom `useIsMobile` / `useIsHydrated` | From `augur-hooks/web` |
| Custom price/cart hooks or stores | From `augur-hooks` |
| Custom `cachedSdkCall` / SDK cache | `cachedSdkCall` from `augur-server` |
| Custom `getServerQueryClient` | From `augur-server` |
| Custom `isDev` / env detection | From `augur-server` |
| Manual NextAuth Credentials config | `createAuthConfig` from `augur-server/auth` |
| `lucide-react` / `@heroicons/react` | `react-icons/lu` |
| `tailwind.config.ts` (v3) | `augur-tailwind/base.css` CSS-first |

## Platform Standard

- **Icons:** `react-icons/lu`
- **Tailwind:** v4, CSS-first via `augur-tailwind/base.css`
- **Validation:** Valibot (not Zod, not Yup)
- **Auth:** NextAuth 5 via `createAuthConfig()`
- **Reference site:** ampro-online
