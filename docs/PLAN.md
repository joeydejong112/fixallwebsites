# ScanPulse — Full Project Plan

## What It Is

ScanPulse is a website health scanner SaaS. Users enter any URL and get an instant report across three pillars: **Security**, **Performance**, and **SEO**. Built for freelancers, developers, and agency clients who want actionable fixes, not just scores.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 (SSR, `app/` directory) |
| UI | PrimeVue + TailwindCSS (PrimeVue unstyled, Tailwind owns all design) |
| Auth | Clerk (`@clerk/nuxt` v2) |
| Backend / DB | Convex (serverless functions + reactive database) |
| Fonts | Space Grotesk (display) + DM Sans (body) via Google Fonts |
| Animations | anime.js (client-only, dynamic import to avoid SSR crash) |
| Language | TypeScript throughout |

---

## Design System

### Colors
| Token | Hex | Use |
|-------|-----|-----|
| `primary` | `#ec3586` | Brand pink — CTAs, accents |
| `dark` | `#07070a` | Page background |
| `dark-surface` | `#0f0f14` | Card backgrounds |
| `dark-elevated` | `#16161e` | Hover states, inputs |
| `dark-border` | `rgba(255,255,255,0.07)` | All borders |
| `security` | `#00d4aa` | Security pillar accent |
| `performance` | `#ffaa00` | Performance pillar accent |
| `seo` | `#6c5ce7` | SEO pillar accent |
| `success` | `#00d4aa` | Pass states |
| `warning` | `#ffaa00` | Warning states |
| `danger` | `#ff4757` | Critical/error states |

### Typography Scale (key sizes)
- Hero H1: `clamp(3.6rem, 7.5vw, 6.2rem)` — Space Grotesk Bold
- Section H2: `clamp(2.2rem, 3.5vw, 3rem)` — Space Grotesk Bold
- Page heading (dashboard): `clamp(2.8rem, 6vw, 4.5rem)`
- Overall score (results): `clamp(4rem, 8vw, 6rem)`
- Labels/caps: `text-[9-10px]`, `tracking-[0.16-0.18em]`, uppercase

---

## Project Structure

```
fixallwebsites/
├── app/
│   ├── app.vue                    # Root shell
│   ├── assets/css/main.css        # Global CSS, fonts, component classes
│   ├── components/
│   │   ├── Logo.vue               # Animated SVG radar logo (anime.js)
│   │   ├── NavBar.vue             # Top nav with Clerk auth state
│   │   └── ScanInput.vue          # URL input + scan button
│   ├── composables/
│   │   └── useConvex.ts           # ConvexHttpClient singleton + api ref
│   ├── middleware/
│   │   └── auth.ts                # Redirect unauthenticated users
│   └── pages/
│       ├── index.vue              # Landing page
│       ├── sign-in/               # Clerk sign-in (catch-all for SSO)
│       │   ├── index.vue
│       │   └── [...slug].vue
│       ├── sign-up/               # Clerk sign-up (catch-all for SSO)
│       │   ├── index.vue
│       │   └── [...slug].vue
│       ├── dashboard/
│       │   └── index.vue          # Scan history (protected)
│       └── results/
│           └── index.vue          # Scan results + polling (protected)
├── convex/
│   ├── schema.ts                  # DB tables: users, scans
│   ├── scans.ts                   # Public: createScan, getScan, getScansByUser
│   │                              # Internal: updateScan
│   └── scanAction.ts              # Node.js action: fetch URL + run checks
├── nuxt.config.ts
├── tailwind.config.ts
└── docs/
    └── PLAN.md                    # This file
```

---

## Convex Data Model

### `scans` table
| Field | Type | Notes |
|-------|------|-------|
| `userId` | string | Clerk user ID |
| `url` | string | Target URL |
| `status` | enum | `pending \| running \| done \| error` |
| `securityScore` | number? | 0–100 |
| `performanceScore` | number? | 0–100 |
| `seoScore` | number? | 0–100 |
| `overallScore` | number? | Average of three pillars |
| `issues` | array? | `{ pillar, severity, title, description }[]` |
| `errorMessage` | string? | Set if status = error |

### `users` table
| Field | Type | Notes |
|-------|------|-------|
| `clerkId` | string | Indexed |
| `email` | string | |
| `name` | string? | |
| `plan` | enum | `free \| pro` |
| `scanCount` | number | Lifetime scans |

---

## Scan Engine — What We Check

### Security (5 checks)
1. HTTPS enforced
2. `Strict-Transport-Security` header present
3. `Content-Security-Policy` header present
4. `X-Frame-Options` or CSP `frame-ancestors` present
5. `X-Content-Type-Options` header present

### Performance (3 checks)
1. Time to First Byte ≤ 400ms (critical if >800ms)
2. Compression enabled (gzip or Brotli)
3. Images have `width`/`height` attributes

### SEO (4 checks)
1. `<title>` tag present and 10–60 chars
2. `<meta name="description">` present
3. Exactly one `<h1>` tag
4. `<link rel="canonical">` present

Scores are `(passing checks / total checks) × 100`. Overall = average of three pillar scores.

---

## Pages

### `/` — Landing page
- Full-height hero: large editorial headline + animated radar sphere (560px) with floating score cards
- Stats ticker strip: 15+ checks · 3 pillars · ~10s · Free
- Coverage section: horizontal pillar strips with pill-style check list
- Mock result card showing what output looks like
- FAQ accordion
- Footer

### `/dashboard` — Scan history (auth required)
- Editorial header: "Dashboard" at 4.5rem
- Scan input at top with pink accent bar
- Scan history table: URL, status, pillar scores, overall score, timestamp
- Empty state with Logo and prompt

### `/results` — Scan output (auth required)
- Triggered by `?url=` (new scan) or `?scanId=` (existing scan)
- New scan flow: createScan → fire runScan action → poll every 2s until done/error
- Radar loading animation during scan
- Overall score displayed at 6rem
- Three pillar score cards with progress bars (8px)
- Tabbed issue list: All / Security / Performance / SEO
- Each issue: left-border severity accent (red/amber/teal), title, description, pillar tag

---

## Phase 1 — Foundation ✅ Complete

- [x] Project scaffolded (Nuxt 4, PrimeVue, Tailwind, Clerk, Convex)
- [x] Global CSS + design tokens
- [x] Logo component (animated SVG radar, anime.js)
- [x] NavBar with auth state
- [x] ScanInput component
- [x] Clerk auth pages + catch-all SSO routes
- [x] Auth middleware
- [x] Convex schema deployed
- [x] `createScan`, `getScan`, `getScansByUser` (public)
- [x] `updateScan` (internal)
- [x] `runScan` action (Node.js) with all 12 checks
- [x] Landing page — full design
- [x] Dashboard page — full design
- [x] Results page — full design with polling

---

## Phase 2 — Polish & Features (In Progress)

### Auth & User ✅ Complete
- [x] Clerk webhook → sync user to Convex `users` table on sign-up
- [x] User plan tracking (free/pro)
- [x] Scan count enforcement for free tier (atomic mutation, race-safe)
- [x] Native HMAC-SHA256 webhook verification (no svix dependency)
- [x] Dashboard queries decoupled with Promise.allSettled

### Dashboard
- [ ] Refresh scan history in real-time (Convex subscription via `onUpdate`)
- [ ] Delete scan from history
- [ ] Re-scan button on each row
- [ ] Filter by pillar / status

### Results
- [ ] PDF export of scan report
- [ ] Share link (public results URL)
- [ ] Comparison with previous scan of same URL
- [ ] Fix recommendations with code examples

### Monitoring
- [ ] "Watch this site" — scheduled scans via Convex crons
- [ ] Email alerts when score drops below threshold
- [ ] Dashboard widget for monitored sites

### Billing
- [ ] Stripe integration for Pro tier
- [ ] Pro: unlimited scans, PDF reports, monitoring, API access

---

## Phase 2.5 — Best-in-Class Scan Engine

> **Goal**: Make ScanPulse the most comprehensive free website scanner on the market.
> Competitors (GTmetrix, SecurityHeaders.com, PageSpeed Insights, Ahrefs) each own one pillar.
> We own all of them — plus Accessibility, which nobody else offers for free.

### 🔒 Security — Expand to 15+ checks
Currently 5 checks. Target: most thorough free security header scanner available.

**TLS / Certificate**
- [ ] SSL certificate expiry — show days remaining, warn at <30 days
- [ ] TLS version detection — flag TLS 1.0/1.1 as critical, reward TLS 1.3
- [ ] Cipher suite strength — warn on weak/export ciphers

**Headers (expand current set)**
- [ ] `Referrer-Policy` header present and strict
- [ ] `Permissions-Policy` header present
- [ ] Cross-Origin headers: `COEP`, `COOP`, `CORP`
- [ ] Server info leakage — `Server:` and `X-Powered-By` should be absent or obscured

**Content & Cookies**
- [ ] Mixed content detection — HTTPS page loading HTTP sub-resources
- [ ] Cookie flags audit — check Secure, HttpOnly, SameSite on all Set-Cookie headers
- [ ] Subresource Integrity (SRI) on external `<script>` and `<link>` tags

**Exposure**
- [ ] Sensitive file exposure probe — `/.env`, `/.git/HEAD`, `/phpinfo.php`, `/wp-login.php`
- [ ] CORS misconfiguration — `Access-Control-Allow-Origin: *` on credentialed requests
- [ ] Redirect chain audit — http→https, www→non-www, count hops, flag long chains

### ⚡ Performance — Real data, not estimates
Currently 3 checks. Target: replace Lighthouse for most users.

**Core Web Vitals (real field data)**
- [ ] PageSpeed Insights API integration — LCP, INP, CLS (real user data, not synthetic)
- [ ] CrUX data where available, fallback to lab data

**Resource audit**
- [ ] Total page weight — HTML + CSS + JS + images breakdown
- [ ] Render-blocking resources count and size
- [ ] JavaScript bundle size — flag if >500kb uncompressed
- [ ] Image format audit — detect unoptimised PNG/JPEG that should be WebP/AVIF
- [ ] Image lazy loading coverage — % of below-fold images with `loading="lazy"`
- [ ] Third-party script count and domains

**Infrastructure**
- [ ] HTTP/2 or HTTP/3 support
- [ ] CDN detection — Cloudflare, Fastly, AWS CloudFront, Vercel, etc.
- [ ] Cache-Control audit — are static assets cached with long max-age?
- [ ] Font loading strategy — `font-display` swap, preload hints
- [ ] Compression ratio — report actual bytes saved by gzip/Brotli

### 🔍 SEO — Full technical SEO audit
Currently 4 checks. Target: replace free Screaming Frog / Ahrefs site audit for single pages.

**Social & Structured Data**
- [ ] Open Graph tags — og:title, og:description, og:image, og:url
- [ ] Twitter Card tags — twitter:card, twitter:title, twitter:image
- [ ] JSON-LD / Schema.org structured data detection and type identification
- [ ] Social preview simulation — show how the page looks when shared on X/LinkedIn

**Crawlability**
- [ ] robots.txt — reachable, valid, not blocking key pages
- [ ] sitemap.xml — reachable, linked from robots.txt
- [ ] `noindex` detection — is this page actually indexable?
- [ ] Canonical URL — self-referencing, no conflicts

**On-page**
- [ ] Mobile viewport meta tag present
- [ ] Image alt text coverage — % of images with alt attribute
- [ ] Internal link count
- [ ] Hreflang tags for multilingual sites
- [ ] URL structure — no query string junk, readable slugs
- [ ] Page word count — thin content detection (<300 words)

### ♿ Accessibility — 4th Pillar (unique differentiator)
No major free scanner includes accessibility. This is our moat.

- [ ] Color contrast ratio — WCAG AA (4.5:1) and AAA (7:1) for body text
- [ ] Images without alt text — count and list offenders
- [ ] Form inputs without associated `<label>`
- [ ] Buttons with no accessible name (no text, no aria-label)
- [ ] `lang` attribute present on `<html>` element
- [ ] Focus visible — interactive elements have visible focus ring
- [ ] Heading hierarchy — h1→h2→h3 in logical order, no skipped levels
- [ ] ARIA landmark regions present (main, nav, footer)
- [ ] Links with non-descriptive text ("click here", "read more")
- [ ] Auto-playing media (video/audio) — WCAG failure

### 🤖 AI-Powered Recommendations
The feature that turns a score into action — and justifies Pro pricing.

- [ ] Technology stack detection — WordPress, Shopify, Next.js, Nuxt, Nginx, Apache, etc.
- [ ] Platform-aware fix recommendations — show the right config for their stack
  - e.g. "Add to your `next.config.js` headers" vs "Add to `.htaccess`" vs "Cloudflare Page Rule"
- [ ] Priority ranking — sort issues by `impact × ease of fix`, not just severity
- [ ] Code snippet per issue — copy-pasteable fix for every failing check
- [ ] Plain-English summary — "Your site is secure but slow. The biggest win is enabling compression — it'll cut load time by ~40%."

### 📊 Score Intelligence
- [ ] Score history stored per URL — trend chart over time (sparkline on dashboard)
- [ ] Regression detection — flag if any pillar drops >10 points since last scan
- [ ] Competitor scan — scan two URLs side by side, see scores compared
- [ ] Industry benchmarking — "Your performance score is better than 73% of e-commerce sites"

---

## Environment Variables

```env
# Clerk
NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NUXT_CLERK_SECRET_KEY=sk_test_...

# Convex
NUXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

---

## Key Decisions Made

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | Nuxt 4 (not Next.js) | Better Vue ecosystem, SSR out of the box |
| UI library | PrimeVue unstyled + Tailwind | Full design control, no theme conflicts |
| Auth | Clerk | Best DX, SSO built in, Vue/Nuxt SDK |
| Backend | Convex | Realtime, TypeScript-native, no infra management |
| Scan engine | Convex Node.js action | Server-side fetch bypasses CORS, no cold start issues |
| `updateScan` | `internalMutation` | Not exposed to public internet |
| Results polling | 2s interval | Simple, reliable; WebSocket subscription in Phase 2 |
| Fonts | Space Grotesk + DM Sans | Display + body pairing, loaded via Google Fonts |

---

_Last updated: 2026-03-26 — Phase 2.5 added_
