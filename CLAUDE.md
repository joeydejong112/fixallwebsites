# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ FIRST THING TO DO IN EVERY SESSION

**Read `memory/MEMORY.md` before doing anything else.** It contains the full project history, current phase status, known issues, and where the last session left off. After completing any work, update the "Last Session" section so the next Claude instance is fully up to date.

## Project Overview

**ScanPulse** — a website health scanner SaaS that analyses sites across Security, Performance, SEO, Accessibility, DNS, Trust, and AI-readiness pillars. Free + Pro tiers (Stripe), public REST API, scheduled monitoring, bulk scans, and a suite of standalone tools (CSP builder, schema generator, contrast checker, etc.).

## Stack

- **Frontend**: Nuxt 4 (`app/` directory layout) + Vue 3 `<script setup lang="ts">` SFCs
- **UI**: PrimeVue 4 (`theme: 'none'` — styled via Tailwind, not PrimeVue themes)
- **Styling**: `@nuxtjs/tailwindcss` with custom design tokens in [tailwind.config.ts](tailwind.config.ts)
- **Auth**: `@clerk/nuxt` — composables (`useAuth`, `useUser`) and middleware-based route protection
- **Backend**: Convex (`convex/` — schema, queries, mutations, actions, scheduled crons, HTTP webhooks)
- **Content**: `@nuxt/content` for blog
- **Payments**: Stripe + Svix (webhook signature verification)
- **Animations**: anime.js (always dynamic-imported — see pattern below)
- **Storage**: `unstorage` + `better-sqlite3` (Nitro server-side caching)

## Commands

```bash
npm run dev        # Nuxt dev server at http://localhost:3000
npm run build      # Production build (.output/)
npm run generate   # Static site generation
npm run preview    # Preview production build
npm run postinstall  # Runs nuxt prepare (auto-generates .nuxt types)
```

There is no `lint` or `test` script defined in [package.json](package.json) — no test framework is configured.

## Architecture

### Nuxt directory layout (app/)

- `app/app.vue` — root component (`NuxtLayout` → `NuxtPage` + global `AppToast`)
- `app/pages/` — file-based routes. Notable areas:
  - `index.vue` — landing
  - `dashboard/`, `results/`, `settings/`, `history/`, `compare/`, `bulk-scan/`, `share/[id]` — authed app
  - `tools/` — 10 standalone tools (CSP builder, schema generator, contrast checker, etc.) using `layouts/tool.vue`
  - `blog/`, `pricing/`, `api-docs.vue` — marketing
  - `sign-in/`, `sign-up/` — Clerk catch-all routes
- `app/layouts/` — only `tool.vue` is custom; default layout is implicit
- `app/middleware/auth.ts` — client-side guard; redirects to `/sign-in` when `!isSignedIn`. Apply via `definePageMeta({ middleware: 'auth' })` on protected pages
- `app/composables/` — `useConvex` / `useConvexWs` (Convex clients), `useAppToast`, `useTools`, `useClerkAppearance`
- `app/components/` — `NavBar`, `Logo`, `ScanInput`, `TrendChart`, `ToolCommandPalette`, `ProGate`, `ToolSeoSection`, `AppToast`
- `app/utils/` — `fixSnippets.ts`, `exportBulkCsv.ts`

### Server (Nitro)

- `server/api/scan.post.ts`, `server/api/scan.get.ts` — public REST API. Auth via `Bearer <api-key>` validated through `convex.query(api.apiKeys.validateApiKeyPublic)`. POST creates a scan and fires `api.scanAction.runScan` (fire-and-forget action).
- `server/routes/og/` — dynamic OG image generation for tool pages and scans

### Convex backend (convex/)

[convex/schema.ts](convex/schema.ts) defines: `users` (Clerk-linked, plan, Stripe IDs, alert prefs), `scans` (URL + per-pillar scores + issues array), `apiKeys` (SHA-256 hashed), `monitoredSites` (daily/weekly cron-driven), `scoreHistory` (time-series for trends), `bulkScans`.

Functional layout:
- `convex/scans.ts`, `scanAction.ts` — scan lifecycle (mutation creates row, action runs checks)
- `convex/checks/` — pluggable check modules: `security`, `performance`, `seo`, `accessibility`, `dns`, `trust`, `techDetect`, `ai` (each returns issues + score contribution)
- `convex/bulkScans.ts`, `bulkScanAction.ts` — multi-URL batch scans
- `convex/scoreHistory.ts`, `compare.ts` — historical comparison
- `convex/monitors.ts`, `crons.ts`, `alerts.ts`, `emails.ts` — scheduled re-scans + drop alerts
- `convex/apiKeys.ts` — issue/rotate/validate API keys
- `convex/stripe.ts`, `convex/http.ts` — Stripe checkout + webhook handlers (Svix signature verify)
- `convex/users.ts` — Clerk webhook sync

### Convex client usage

The Convex URL comes from `runtimeConfig.public.convexUrl` (env: `NUXT_PUBLIC_CONVEX_URL`). Two singleton clients in [app/composables/useConvex.ts](app/composables/useConvex.ts):
- `useConvex()` — `ConvexHttpClient` (one-shot queries/mutations/actions; SSR-safe)
- `useConvexWs()` — `ConvexClient` (WebSocket subscriptions; client-only — returns `{ client: null }` on SSR)

Both return `{ client, api }` where `api` is the typed `convex/_generated/api` import.

**Important**: When working on Convex code, always read [convex/_generated/ai/guidelines.md](convex/_generated/ai/guidelines.md) first — it contains rules that override training-data assumptions about Convex APIs and patterns. Install task-specific Convex skills via `npx convex ai-files install`.

### Design tokens (tailwind.config.ts)

- Brand: `primary` (#ec3586), `primary-hover`
- Dark surfaces: `dark` (#07070a), `dark-surface`, `dark-elevated`, `dark-border` (rgba)
- Pillar accents: `security` (#00d4aa), `performance` (#ffaa00), `seo` (#6c5ce7)
- Semantic: `success`, `warning`, `danger`, `muted`
- Shadows: `glow-{primary,success,warning,danger}`, `elevation-{sm,md,lg}`
- Fonts: `font-display` (Space Grotesk, headings), `font-body` (DM Sans). Loaded via Google Fonts with preconnect in [nuxt.config.ts](nuxt.config.ts).
- `rounded-card` — 16px radius

The Tailwind `content` glob covers `app/**/*.{vue,ts}` plus root `components/`, `layouts/`, `pages/` folders.

### anime.js pattern (Vue)

anime.js touches `window`, so always dynamic-import inside `onMounted` to avoid SSR breakage:

```ts
onMounted(async () => {
  const anime = (await import('animejs')).default
  // anime calls here
})
```

[app/components/Logo.vue](app/components/Logo.vue) — animated SVG radar/pulse logo. Accepts `animate` prop (`false` to disable motion, used in footer).

## Environment Variables

```env
# Clerk
NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NUXT_CLERK_SECRET_KEY=sk_test_...

# Convex
NUXT_PUBLIC_CONVEX_URL=https://<project>.convex.cloud

# Stripe (set in Convex dashboard env, not Nuxt)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Clerk redirect URLs are configured statically in `nuxt.config.ts` (`signInUrl: '/sign-in'`, `afterSignInUrl: '/dashboard'`, etc.) — not via env vars.

## Conventions

- Use `<script setup lang="ts">` for all components
- Composables live in `app/composables/` and start with `use`
- Server endpoints in `server/api/` use Nitro's `defineEventHandler` + `getHeader`/`readBody`/`setResponseStatus`
- Use the `~/` alias for `app/` imports inside Vue files
- Convex generated types come from `../../convex/_generated/api` relative to composables
- When adding a new scan check, drop a module in `convex/checks/` and wire it from `scanAction.ts`
- Always prefer `context7` MCP for framework docs/code generation
