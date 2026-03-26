# ScanPulse — Project Memory

> **Claude: Read this file at the start of every session before touching any code.**
> Update the "Last Session" and "Current State" sections at the end of every session.

---

## What This Project Is

**ScanPulse** — A website health scanner SaaS. Users enter any URL and get an instant report across three pillars: Security, Performance, and SEO. Built for freelancers, developers, and agency clients.

- **Repo**: `C:\Users\Joey\Documents\JDJFreelance\fixallwebsites`
- **GitHub**: https://github.com/joeydejong112/fixallwebsites
- **Convex prod**: https://hip-bass-536.eu-west-1.convex.cloud
- **Dev server**: http://localhost:3000 (never run `npm run dev` — use Chrome extension for verification)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 (SSR, `app/` directory) |
| UI | Tailwind CSS (custom design tokens, no component library) |
| Auth | Clerk (`@clerk/nuxt` v2) |
| Backend / DB | Convex (serverless functions + reactive database) |
| Fonts | Space Grotesk (display) + DM Sans (body) |
| Animations | anime.js (client-only, always dynamic import) |
| Language | TypeScript throughout |

---

## Rules Claude Must Follow

- Always use **context7** plugin for documentation lookups before writing Convex or framework code
- Always read `convex/_generated/ai/guidelines.md` before touching any Convex code
- Never run `npm run dev` — server is already running; use Chrome extension for visual checks
- Never work in git worktrees — commit directly to `main` or a branch
- Never save files to the root folder
- Always run `npx convex deploy --yes` after changing any file in `convex/`
- Always commit and push after completing a task (conventional commit format)
- Dispatch a security-auditor subagent after each task before committing

---

## Design System (Quick Reference)

| Token | Value | Use |
|-------|-------|-----|
| `primary` | `#ec3586` | Brand pink — CTAs, accents |
| `dark` | `#07070a` | Page background |
| `dark-surface` | `#0f0f14` | Card backgrounds |
| `security` | `#00d4aa` | Security pillar |
| `performance` | `#ffaa00` | Performance pillar |
| `seo` | `#6c5ce7` | SEO pillar |
| `success` | `#00d4aa` | Pass states |
| `warning` | `#ffaa00` | Warning states |
| `danger` | `#ff4757` | Critical/error states |

Typography: Space Grotesk Bold for headings, DM Sans for body. Hero H1: `clamp(3.6rem, 7.5vw, 6.2rem)`.

---

## File Structure

```
fixallwebsites/
├── app/
│   ├── app.vue
│   ├── assets/css/main.css
│   ├── components/
│   │   ├── Logo.vue              # Animated SVG radar (anime.js)
│   │   ├── NavBar.vue            # Top nav with Clerk auth state
│   │   └── ScanInput.vue         # URL input + scan button
│   ├── composables/
│   │   └── useConvex.ts          # ConvexHttpClient singleton + api ref
│   ├── middleware/
│   │   └── auth.ts               # Redirect unauthenticated users
│   └── pages/
│       ├── index.vue             # Landing page
│       ├── sign-in/              # Clerk sign-in (catch-all SSO)
│       ├── sign-up/              # Clerk sign-up (catch-all SSO)
│       ├── dashboard/index.vue   # Scan history (protected)
│       └── results/index.vue     # Scan results + polling (protected)
├── convex/
│   ├── schema.ts                 # DB tables: users, scans
│   ├── users.ts                  # upsertUser (internal), getUserByClerkId (public)
│   ├── scans.ts                  # createScan, getScan, getScansByUser, updateScan
│   ├── scanAction.ts             # Node.js action: fetch URL + run 12 checks
│   ├── http.ts                   # Clerk webhook handler (/clerk POST)
│   ├── package.json              # svix listed (even though not used — native HMAC now)
│   └── convex.json               # Project: hip-bass-536, team: joey-de-jong
├── docs/
│   ├── PLAN.md                   # Full project plan with phase checkboxes
│   └── DESIGN-SYSTEM.md
└── memory/
    └── MEMORY.md                 # This file
```

---

## Convex Data Model

### `users` table
| Field | Type | Notes |
|-------|------|-------|
| `clerkId` | string | Indexed via `by_clerk` |
| `email` | string | |
| `name` | string? | |
| `plan` | `'free' \| 'pro'` | Default: `'free'` |
| `scanCount` | number | Lifetime scans, enforced at 10 for free |

### `scans` table
| Field | Type | Notes |
|-------|------|-------|
| `userId` | string | Clerk user ID |
| `url` | string | Target URL |
| `status` | `'pending' \| 'running' \| 'done' \| 'error'` | |
| `securityScore` | number? | 0–100 |
| `performanceScore` | number? | 0–100 |
| `seoScore` | number? | 0–100 |
| `overallScore` | number? | Average of three pillars |
| `issues` | array? | `{ pillar, severity, title, description }[]` |
| `errorMessage` | string? | Set if status = error |

---

## Scan Engine (12 checks)

### Security (5)
1. HTTPS enforced
2. `Strict-Transport-Security` header
3. `Content-Security-Policy` header
4. `X-Frame-Options` or CSP `frame-ancestors`
5. `X-Content-Type-Options` header

### Performance (3)
1. TTFB ≤ 400ms (critical if >800ms)
2. Compression (gzip or Brotli)
3. Images have `width`/`height` attributes

### SEO (4)
1. `<title>` present and 10–60 chars
2. `<meta name="description">` present
3. Exactly one `<h1>`
4. `<link rel="canonical">` present

Scores: `(passing / total) × 100`. Overall = average of three pillars.

---

## Phase History

### Phase 1 — Foundation ✅ Complete (2026-03-25)
- Nuxt 4 project scaffolded with Clerk, Convex, Tailwind, anime.js
- All global CSS and design tokens set up
- Logo, NavBar, ScanInput components built
- Auth middleware + Clerk sign-in/sign-up pages
- Convex schema deployed (users + scans tables)
- All Convex functions: `createScan`, `getScan`, `getScansByUser`, `updateScan`, `runScan`
- Landing page — full editorial design with animated hero
- Dashboard page — scan history with score rings and pillar bars
- Results page — polling, score display, issue list with severity tabs

### Phase 2 — Auth & User ✅ Complete (2026-03-26)

**What was built:**
- `convex/users.ts` — `upsertUser` (internalMutation) + `getUserByClerkId` (projected query)
- `convex/http.ts` — Clerk webhook handler at `/clerk` POST
  - Verifies Svix HMAC-SHA256 signature using native `crypto.subtle` (no npm dep — Convex edge runtime can't bundle svix)
  - Guards against empty email
  - Calls `upsertUser` on `user.created` and `user.updated` events
- `convex/scans.ts` — `createScan` refactored to be fully atomic: check free-tier limit + insert + increment scanCount in one mutation (prevents race condition)
- `app/pages/dashboard/index.vue` — fixed:
  - Replaced `onMounted` early-return with `watch(userId, ...)` for correct Clerk hydration timing
  - Replaced `Promise.all` with `Promise.allSettled` so scan list loads even if `getUserByClerkId` fails
  - Plan badge shows `X / 10 free` for free users, `Pro` for pro users

**Key bugs fixed along the way:**
- Missing `convex/package.json` (lost in squash merge) — recreated
- `"use node"` directive not allowed in `http.ts` (HTTP actions are edge-only) — removed, replaced svix with native HMAC
- Convex deploy failing due to unresolvable `svix` import — fixed by native implementation

**Manual setup still required (one-time, done in Clerk/Convex dashboards):**
- Add Clerk webhook pointing to `https://hip-bass-536.eu-west-1.convex.cloud/clerk`
- Set `CLERK_WEBHOOK_SECRET` env var in Convex dashboard

---

## Phase 2 — Remaining Work

### Scan Improvements
- [ ] More checks: Open Graph tags, robots.txt, sitemap.xml, redirect chains
- [ ] PageSpeed Insights API for real Core Web Vitals
- [ ] SSL certificate expiry check
- [ ] Mixed content detection
- [ ] Response time percentiles

### Dashboard
- [ ] Real-time scan history (Convex subscription via `onUpdate`)
- [ ] Delete scan from history
- [ ] Re-scan button on each row
- [ ] Filter by pillar / status

### Results
- [ ] PDF export
- [ ] Share link (public results URL)
- [ ] Compare with previous scan of same URL
- [ ] Fix recommendations with code examples

### Monitoring
- [ ] Scheduled scans via Convex crons
- [ ] Email alerts when score drops below threshold
- [ ] Dashboard widget for monitored sites

### Billing
- [ ] Stripe integration for Pro tier
- [ ] Pro: unlimited scans, PDF reports, monitoring, API access

---

## Phase 3 — Growth (Not Started)
- [ ] Public API (`/api/scan`)
- [ ] Chrome extension
- [ ] Bulk scan (CSV upload)
- [ ] Team accounts
- [ ] White-label for agencies

---

## Known Issues / Decisions

| Issue | Decision |
|-------|----------|
| svix can't be bundled in Convex edge runtime | Replaced with native `crypto.subtle` HMAC-SHA256 |
| `scanCount` in stat strip caps at 20 (`.take(20)`) | Cosmetic inconsistency — deferred |
| Plan upgrade via Clerk metadata not handled in `upsertUser` | Out of scope until billing phase |
| Caller-supplied `userId` in scanAction (minor attack surface) | Accepted for now, harden in security pass |
| Scans don't live-update on dashboard | Deferred — Phase 2 Dashboard item |

---

## Last Session

**Date**: 2026-03-26
**What was done**:
- Completed Phase 2 Auth & User entirely
- Fixed 3 critical bugs from code review (race condition, Clerk hydration, missing `'use node'`)
- Fixed svix bundling issue — replaced with native HMAC using `crypto.subtle`
- Deployed all Convex functions to prod (`hip-bass-536`)
- Pushed all changes to `main` on GitHub
- Updated `docs/PLAN.md` with phase checkmarks
- Created this memory file

**Where we left off**: Phase 2 Auth & User is done. Next up is any remaining Phase 2 item — suggested priorities are real-time dashboard (Convex subscriptions) or more scan checks.

**Branch**: `main` (all work committed directly, no open branches)
