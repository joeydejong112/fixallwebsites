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
- [x] Real-time scan history (Convex subscription via `onUpdate`)
- [x] Delete scan from history
- [x] Re-scan button on each row
- [x] Filter by pillar / status

### Results
- [x] PDF export of scan report
- [x] Share link (public results URL)
- [x] Comparison with previous scan of same URL
- [x] Fix recommendations with code examples

### Monitoring ✅ Complete (Foundation)
- [x] "Watch this site" — toggle monitoring in dashboard
- [x] Billing integration for Pro tier (Stripe)
- [x] Custom Toast & Modal system (replaces native alert/confirm)
- [ ] Email alerts when score drops below threshold
- [ ] Dashboard widget for monitored sites

### Billing ✅ Complete
- [x] Stripe integration for Pro tier
- [x] Pro: unlimited scans, PDF reports, monitoring, API access

---

## Phase 2.5 — Best-in-Class Scan Engine

> **Goal**: 84 checks across 6 categories — the most comprehensive free website scanner on the market.
> Full design spec: [`docs/superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md`](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md)

---

### Task 1 — Shared types and interfaces
> Spec ref: [Shared Interface](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md#shared-interface)

- [x] Create `convex/checks/types.ts` with `ScanIssue`, `PillarResult`, `TlsInfo`, `CwvData`, `DnsData` interfaces

---

### Task 2 — Schema migration
> Spec ref: [Schema Changes](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md#schema-changes)

- [x] Add `accessibilityScore: v.optional(v.number())` to `scans` table in `convex/schema.ts`
- [x] Add `dnsScore: v.optional(v.number())` to `scans` table
- [x] Add `trustScore: v.optional(v.number())` to `scans` table
- [x] Add `detectedTech: v.optional(v.array(v.string()))` to `scans` table
- [x] Add `carbonGrams: v.optional(v.number())` to `scans` table
- [x] Add `greenHosting: v.optional(v.boolean())` to `scans` table
- [x] Add `domainExpiry: v.optional(v.string())` to `scans` table
- [x] Add `certExpiry: v.optional(v.string())` to `scans` table
- [x] Update `updateScan` in `convex/scans.ts` to accept all new optional fields
- [x] Run `npx convex deploy --yes`

---

### Task 3 — Security checks module (21 checks)
> Spec ref: [Security](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md#security-21-checks)

- [x] Create `convex/checks/security.ts` exporting `runSecurityChecks(headers, html, url, tlsInfo, exposureResults): PillarResult`
- [x] Checks 1–5: keep existing HTTPS, HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- [x] Check 3b: HSTS quality (max-age ≥ 15768000, includeSubDomains)
- [x] Check 5b: CSP quality (no `unsafe-inline`/`unsafe-eval`, no wildcard sources)
- [x] Check 6: `Referrer-Policy` present and strict
- [x] Check 7: `Permissions-Policy` present
- [x] Check 8: `COEP` header present
- [x] Check 9: `COOP` header present
- [x] Check 10: `Reporting-Endpoints` configured when CSP exists
- [x] Check 11: `Trusted Types` in CSP (`require-trusted-types-for`)
- [x] Check 12: `Server` header not leaking version info
- [x] Check 13: `X-Powered-By` absent
- [x] Check 14: Cookie flags audit — Secure, HttpOnly, SameSite on all `Set-Cookie` headers
- [x] Check 15: Mixed content — HTTP resources on HTTPS page
- [x] Check 16: SRI on external `<script>` and `<link rel="stylesheet">` tags
- [x] Check 17: `Access-Control-Allow-Origin: *` CORS misconfiguration
- [x] Check 18: Sensitive file exposure — HEAD `/.env`, `/.git/HEAD`, `/phpinfo.php` (200 = critical)
- [x] Check 19: Redirect chain — count hops via manual `redirect: 'manual'` fetches, flag >2
- [x] Check 20 (TLS): SSL cert expiry — `tls.connect` → `valid_to`, warn <30d, critical <7d
- [x] Check 21 (TLS): TLS version — flag 1.0/1.1 as critical, reward 1.3

---

### Task 4 — Performance checks module (18 checks)
> Spec ref: [Performance](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md#performance-18-checks)

- [x] Create `convex/checks/performance.ts` exporting `runPerformanceChecks(headers, html, url, cwvData, greenHosting): PillarResult`
- [x] Check 1: TTFB ≤ 400ms (>800ms critical) — keep existing
- [x] Check 2: Compression enabled (gzip/Brotli) — keep existing
- [x] Check 3: Images have `width`/`height` attributes — keep existing
- [x] Check 4: HTTP/2+ support — `alt-svc` header or response protocol
- [x] Check 5: LCP from `cwvData` — ≤2.5s pass, >4s critical (skip if `cwvData.available = false`)
- [x] Check 6: INP from `cwvData` — ≤200ms pass, >500ms critical
- [x] Check 7: CLS from `cwvData` — ≤0.1 pass, >0.25 critical
- [x] Check 8: Total HTML size — warn if >100KB
- [x] Check 9: Render-blocking scripts in `<head>` without async/defer
- [x] Check 10: Image format audit — flag PNG/JPEG/BMP in `<img src>` URLs
- [x] Check 11: Third-party script count — count `<script src>` with different origin, warn >10
- [x] Check 12: Image lazy loading — count `<img>` without `loading="lazy"`, warn if majority missing
- [x] Check 13: Cache-Control header — warn if absent or no `max-age`
- [x] Check 14: CDN detection — `cf-ray`, `x-vercel-id`, `x-amz-cf-id`, `x-fastly-request-id` (info)
- [x] Check 15: `fetchpriority="high"` usage — warn if absent on any resource
- [x] Check 16: Resource hints — `<link rel="preconnect|preload">` for third-party origins
- [x] Check 17: Carbon footprint — calculate grams CO2/pageview from transfer size, warn >0.5g
- [x] Check 18: Green hosting — from `greenHosting` boolean passed in (info)

---

### Task 5 — SEO checks module (19 checks)
> Spec ref: [SEO](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md#seo-19-checks)

- [x] Create `convex/checks/seo.ts` exporting `runSeoChecks(headers, html, url, robotsTxt, sitemap, wwwCheck): PillarResult`
- [x] Checks 1–4: keep existing title, meta description, H1 count, canonical
- [x] Check 5: Viewport meta tag present
- [x] Check 6: Open Graph tags — `og:title`, `og:description`, `og:image`
- [x] Check 7: Twitter Card tags — `twitter:card`, `twitter:title`
- [x] Check 8: JSON-LD structured data — detect and identify type
- [x] Check 9: Favicon present — `<link rel="icon">` or HEAD `/favicon.ico`
- [x] Check 10: `robots.txt` reachable — 200 status from parallel HEAD request
- [x] Check 11: `sitemap.xml` reachable — 200 status from parallel HEAD request
- [x] Check 12: `noindex` detection — `<meta name="robots" content="noindex">` or `X-Robots-Tag` header
- [x] Check 13: WWW vs non-WWW — one should 301 to the other
- [x] Check 14: Image alt text coverage — >80% of `<img>` tags have `alt`
- [x] Check 15: Page word count — strip tags, count words, warn <300
- [x] Check 16: Charset declaration — `<meta charset>` or `Content-Type` header
- [x] Check 17: HTTP status is 200 — flag 3xx/4xx/5xx
- [x] Check 18: Author attribution — `meta author`, `Person` schema, or byline patterns
- [x] Check 19: Publication dates — `datePublished`/`dateModified` in JSON-LD

---

### Task 6 — Accessibility checks module (12 checks)
> Spec ref: [Accessibility](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md#accessibility-12-checks)

- [x] Create `convex/checks/accessibility.ts` exporting `runAccessibilityChecks(html): PillarResult`
- [x] Check 1: `lang` attribute on `<html>`
- [x] Check 2: Images without `alt` — count offenders, critical if any
- [x] Check 3: Form `<input>` without associated `<label>` (via `for`/`id` or nesting)
- [x] Check 4: `<button>` with no text content and no `aria-label`
- [x] Check 5: Heading hierarchy — parse h1–h6, flag skipped levels
- [x] Check 6: ARIA landmarks — `<main>`, `<nav>`, `<footer>` or `role=` equivalents
- [x] Check 7: Non-descriptive link text — "click here", "read more", "here"
- [x] Check 8: Auto-playing media — `<video autoplay>`, `<audio autoplay>`
- [x] Check 9: Skip-navigation link — first `<a>` targeting `#main` or similar
- [x] Check 10: Tabindex abuse — any `tabindex` value > 0
- [x] Check 11: Duplicate IDs — collect all `id=` values, flag duplicates
- [x] Check 12: Focus killer — `outline: none` on `:focus` in inline `<style>` without `:focus-visible`

---

### Task 7 — DNS & Email checks module (8 checks) ✅ Complete
> Spec ref: [DNS & Email](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md#dns--email-8-checks)

- [x] Create `convex/checks/dns.ts` exporting `runDnsChecks(dnsData, domainExpiry): PillarResult`
- [x] Check 1: SPF record — `dns.resolveTxt(domain)`, find `v=spf1`, flag `+all`
- [x] Check 2: DMARC — `dns.resolveTxt('_dmarc.' + domain)`, check `p=quarantine|reject`
- [x] Check 3: DKIM — probe 8 selectors: google, default, selector1, selector2, k1, ses, mandrill, dkim
- [x] Check 4: MX records — `dns.resolveMx(domain)`, critical if none
- [x] Check 5: Domain expiry — RDAP API `https://rdap.org/domain/${domain}`, warn <30d, critical <7d
- [x] Check 6: DNSSEC — DoH `https://dns.google/resolve?name=${domain}&type=A&do=1`, check `AD` flag
- [x] Check 7: IPv6 support — `dns.resolve(domain, 'AAAA')` exists
- [x] Check 8: DNS response time — time the A record resolve, warn >300ms, critical >600ms

---

### Task 8 — Trust & Compliance checks module (6 checks) ✅ Complete
> Spec ref: [Trust & Compliance](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md#trust--compliance-6-checks)

- [x] Create `convex/checks/trust.ts` exporting `runTrustChecks(html, headers, gpcResult, custom404Result): PillarResult`
- [x] Check 1: Privacy policy link — regex links with "privacy" in href/text
- [x] Check 2: Terms of service link — regex links with "terms"
- [x] Check 3: Cookie consent — search for OneTrust, Cookiebot, CookieYes, Osano, Civic signatures
- [x] Check 4: Contact information — `tel:`, `mailto:`, or `/contact` links
- [x] Check 5: GPC support — HEAD `/.well-known/gpc.json`, 200 = pass (info)
- [x] Check 6: Custom 404 page — fetch nonexistent path, check for branded content vs bare server error

---

### Task 9 — Tech stack detection ✅ Complete
> Spec ref: [Tech Stack Detection](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md#tech-stack-detection)

- [x] Create `convex/checks/techDetect.ts` exporting `detectTechStack(headers, html): string[]`
- [x] Detect CMS: WordPress, Shopify, Wix, Squarespace, Drupal, Ghost, Webflow
- [x] Detect frameworks: Next.js, Nuxt, Gatsby, SvelteKit, Angular, React, Vue
- [x] Detect servers from `Server` header: Nginx, Apache, Caddy, IIS, LiteSpeed
- [x] Detect CDN/hosting: Cloudflare, Vercel, Netlify, AWS CloudFront, Fastly, Render
- [x] Detect analytics: GA4, GTM, Plausible, Fathom, Hotjar

---

### Task 10 — Orchestrator refactor ✅ Complete
> Spec ref: [Orchestrator Flow](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md#orchestrator-flow)

- [x] Refactor `convex/scanAction.ts` to thin orchestrator (~100 lines)
- [x] Initial fetch with 15s timeout and `ScanPulse/1.0` User-Agent
- [x] `Promise.allSettled` parallel calls: PageSpeed API, `tls.connect`, DNS, RDAP, Green Web Foundation API
- [x] Parallel HEAD requests: `/.env`, `/.git/HEAD`, `/phpinfo.php`, `/robots.txt`, `/sitemap.xml`, `/.well-known/gpc.json`
- [x] Parallel GET: nonexistent path (custom 404 check), www vs non-www variant
- [x] Fan out to all 6 pillar modules with correct arguments
- [x] Compute per-pillar scores: `(passing / total) * 100`
- [x] Compute overall score: `avg(security, performance, seo, accessibility)` — DNS and Trust excluded
- [x] Save all new fields via `updateScan`
- [x] Add `GOOGLE_PSI_API_KEY` env var to Convex dashboard docs

---

### Task 11 — Expand FIX_SNIPPETS to cover all 84 checks ✅ Complete
> Spec ref: [Fix Snippets Expansion](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md#fix-snippets-expansion)

- [x] Update `app/utils/fixSnippets.ts` structure to `{ generic, platforms? }` per check
- [x] Add generic + platform-specific snippets for all 21 security checks (Next.js, Nginx, Cloudflare, Apache, .htaccess)
- [x] Add generic + platform-specific snippets for all 18 performance checks
- [x] Add generic + platform-specific snippets for all 19 SEO checks
- [x] Add generic snippets for all 12 accessibility checks
- [x] Add generic snippets for all 8 DNS & Email checks
- [x] Add generic snippets for all 6 Trust checks

---

### Task 12 — UI updates for new pillars and scores ✅ Complete
- [x] Add Accessibility pillar card (color: `#a29bfe`) to results page — 4-col grid
- [x] Add DNS & Email and Trust scores as "bonus" category cards (not in overall ring)
- [x] Display `detectedTech` stack badges on results page
- [x] Display `certExpiry` and `domainExpiry` prominently on results (days remaining)
- [x] Display `carbonGrams` and `greenHosting` badge on results
- [x] Update overall score ring reads `scan.overallScore` (orchestrator averages 4 pillars)
- [x] Update landing page pillar strip to show 6 categories and 84 check count

---

## Phase 3 — Account & Settings

> **Goal**: A dedicated `/settings` page giving users control over their profile, billing, notifications, API access, and account deletion — all in our dark-theme design language.

---

### Task 1 — Settings layout & sidebar navigation ✅ Complete
- [x] Create `app/pages/settings/index.vue` as the settings shell page
- [x] Build a vertical sidebar nav with icons for each tab: Profile, Billing, Notifications, Developer, Danger Zone
- [x] Use `activeTab` ref to switch between tab content panels (no sub-routes needed)
- [x] Apply auth middleware — redirect unauthenticated users to `/sign-in`
- [x] Add "Settings" link to NavBar (gear icon) when user is signed in
- [x] Style sidebar with dark theme: `bg-dark-surface`, `border-white/[0.06]`, active tab accent `#ec3586`
- [x] Make layout responsive — sidebar collapses to horizontal tabs on mobile

---

### Task 2 — Profile tab (Clerk integration) ✅ Complete
- [x] Embed `<UserProfile />` from `@clerk/nuxt` inside the Profile tab panel
- [x] Apply `useClerkAppearance()` dark-theme overrides so Clerk UI matches our design
- [x] Override Clerk card backgrounds to `#0f0f14`, text to `white/70`, borders to `white/[0.06]`
- [x] Test MFA setup, email change, and profile picture upload through the embedded component
- [x] Add a custom header above Clerk component: user's name, email, and plan badge (`Free` / `Pro`)

---

### Task 3 — Billing & Usage tab ✅ Complete
- [x] Display current plan prominently: `Free` or `Pro` with accent color badge
- [x] Show usage stats from Convex `users` table:
  - Lifetime scan count (`scanCount`)
  - Remaining scans (for free tier: `1 - scanCount`, for Pro: "Unlimited")
  - Number of monitored sites (count from `monitors` table)
- [x] For **Free users**: Show upgrade CTA button → triggers `api.stripe.pay` action (existing logic)
- [x] For **Pro users**: Show "Manage Subscription" button → triggers `api.stripe.portal` (existing logic)
- [x] Display when the Pro subscription renews (if available from Stripe metadata)
- [x] Show invoice history link (points to Stripe customer portal)
- [x] Style usage bars: horizontal progress bars with pillar accent colors

---

### Task 4 — Notifications tab (schema + UI) ✅ Complete
- [x] Add `alertPreferences` field to `users` table in `convex/schema.ts`:
  - `enabled: v.boolean()`
  - `threshold: v.number()` (0–100, alert if score drops below)
  - `email: v.optional(v.string())` (override email for alerts)
- [x] Create `convex/users.ts` mutation: `updateAlertPreferences` — validates threshold 0–100, patches user
- [x] Build Notifications tab UI:
  - Toggle switch: "Enable email alerts" (on/off)
  - Threshold slider: 0–100 with label "Alert me when overall score drops below **{value}**"
  - Optional email override input (defaults to Clerk email)
  - Save button with success toast
- [x] Style slider with `#ec3586` accent track + dark handle
- [x] Wire up save button to call `updateAlertPreferences` mutation
- [x] Show "Pro only" lock overlay if user is on free plan (notifications require Pro)

---

### Task 5 — Email sending for alerts (Resend + Convex cron) ✅ Complete
- [x] Sign up for Resend and add `RESEND_API_KEY` to Convex env vars
- [x] Create `convex/emails.ts` action: `sendAlertEmail({ to, subject, html })` using Resend API
- [x] Design email template HTML: ScanPulse branding, score drop summary, link to results page
- [x] Extend monitoring cron (`processDueMonitors`) to fire `checkAndSendAlert` after each scan
- [x] `checkAndSendAlert` respects alertPreferences (enabled, threshold, email override), plan=pro gate, 24h spam guard
- [x] Add `lastAlertSentAt` field to `monitoredSites` table + `updateLastAlertSent` mutation
- [x] Add `getUserForAlert` internal query to fetch email + alertPreferences
- [x] Convex deployed ✅

---

### Task 6 — Developer tab (API keys) ✅ Complete
- [x] Create `apiKeys` table in `convex/schema.ts`:
  - `userId: v.string()`
  - `key: v.string()` (hashed)
  - `prefix: v.string()` (`sp_live_` + first 8 chars, for display)
  - `createdAt: v.number()`
  - `lastUsedAt: v.optional(v.number())`
  - Indexes: `by_user`, `by_key`
- [x] Create `convex/apiKeys.ts` with mutations/queries:
  - `generateApiKey({ userId })` → generate `sp_live_` + 32-char random hex, hash, store, return raw key once
  - `listApiKeys({ userId })` → return prefix + createdAt + lastUsedAt (never full key)
  - `revokeApiKey({ userId, keyId })` → delete the key document
- [x] Build Developer tab UI:
  - "Generate API Key" button (disabled if free plan)
  - After generation: show full key once in a copy-to-clipboard box with warning
  - Table listing existing keys: prefix, created date, last used, revoke button
  - curl code example for POST /api/scan and GET /api/scan?id=
- [x] Create Convex HTTP endpoint `POST /api/scan` in `convex/http.ts`
- [x] Create Convex HTTP endpoint `GET /api/scan` in `convex/http.ts`
- [x] Gate behind Pro plan — free users see "Upgrade to Pro" overlay
- [x] Convex deployed ✅

---

### Task 7 — Danger Zone (Account deletion) ✅ Complete
- [x] Build Danger Zone tab UI:
  - Red-bordered card listing what gets deleted
  - Email confirmation input — button only enables when typed email matches account email
  - "Delete my account and all data" button (red, destructive)
- [x] Create `convex/users.ts` mutations: `deleteUserData` (internal) + `deleteUserDataPublic` (public)
  - Deletes scans, monitors, API keys, user document
- [x] After Convex cleanup: signOut() via Clerk → redirect to `/`
- [x] Handle `user.deleted` Clerk webhook → runs `deleteUserData` internal mutation
- [x] Convex deployed ✅

---

### Task 8 — Dashboard widget for monitored sites (Phase 2 completion) ✅ Complete
- [x] Add a "Monitored Sites" section to `/dashboard` above the scan history
- [x] Query `monitors` table for user's active monitors
- [x] Display each monitor as a card:
  - URL + Google favicon
  - Latest overall score (color-coded with score color)
  - Score trend arrow (↑ / ↓ / →) computed from last 2 scans in history
  - Monitoring frequency badge (Daily / Weekly)
  - "Last checked: Xh ago" timestamp
- [x] Add "View →" link → results page with `?url=` filter
- [x] Empty state with icon and "Scan a site and toggle Watch" message
- [x] Mark Phase 2 "Dashboard widget for monitored sites" as ✅

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

## Phase 4 — Fix-It Tools

> **Goal**: A `/tools` hub with free, standalone utilities that help users **fix** the exact issues the scanner flags. Each tool maps directly to one or more scan checks — turning "here's what's broken" into "here, fix it now." Tools also serve as SEO landing pages to drive organic traffic.
>
> **Gating strategy**: Every tool is usable for free (drives SEO traffic + trust). Advanced power features are locked behind Pro with an upgrade prompt overlay.

---

### Task 1 — Tools Hub page & ProGate component (foundation) ✅ Complete
- [x] Build reusable `<ProGate>` component: blurred overlay with "Upgrade to Pro to unlock" CTA — used by all tools
- [x] Create `app/pages/tools/index.vue` as the tools landing/directory page
- [x] Grid of tool cards with icon, title, one-line description, and pillar badge (Security/Performance/SEO/etc.)
- [x] Group tools by pillar category
- [x] Each card links to the individual tool page
- [x] Show "Free" and "Pro" badges on each card to indicate gating level
- [x] SEO: unique title/description per tool page for organic traffic
- [x] Add "Tools" link to NavBar between "Pricing" and "Dashboard"
- [x] Cross-link from scan results: when an issue is flagged, show a "Fix with our tool →" link to the relevant tool
- [x] All tools accessible without login — Pro features prompt sign-in → upgrade

---

### Task 2 — Meta Tag Generator ✅ Complete
> Fixes: SEO Checks 1–7 (title, description, OG, Twitter Card, viewport)

- [x] Create `app/pages/tools/meta-generator.vue`
- [x] 🟢 FREE: Form fields:
  - Page title (with character counter, 30–60 target)
  - Meta description (with character counter, 70–160 target)
  - Canonical URL
  - Viewport (pre-filled with best practice default)
  - Charset (pre-filled UTF-8)
  - Robots (index/noindex toggle)
- [x] 🟢 FREE: "Copy to clipboard" button for the generated `<head>` HTML block
- [x] 🟢 FREE: Live preview: Google search result snippet (title + description + URL)
- [x] 🔒 PRO: OG image URL field (with preview thumbnail)
- [x] 🔒 PRO: Twitter card type dropdown (summary / summary_large_image)
- [x] 🔒 PRO: Live preview: social share card (Facebook and Twitter/X)
- [x] 🔒 PRO: **Platform-specific output tabs**: Next.js `metadata`, Nuxt `useSeoMeta`, WordPress Yoast

---

### Task 3 — Image Optimizer & Converter ✅ Complete
> Fixes: Performance Check 10 (image format audit), Check 12 (lazy loading awareness)

- [x] Create `app/pages/tools/image-optimizer.vue`
- [x] 🟢 FREE: Drag-and-drop upload zone — accept PNG, JPEG, BMP, GIF, TIFF
- [x] 🟢 FREE: Client-side conversion to **WebP** using `HTMLCanvasElement.toBlob()`
- [x] 🟢 FREE: Quality slider: 1–100 with live preview (before/after side-by-side)
- [x] 🟢 FREE: Show file size savings: "Original: 1.2MB → WebP: 180KB (85% smaller)"
- [x] 🟢 FREE: Single image download
- [x] 🔒 PRO: **AVIF** output format (WASM library, e.g. `squoosh-wasm`)
- [x] 🔒 PRO: **Batch upload** — convert multiple images at once with download-all ZIP (via `JSZip`)
- [x] 🔒 PRO: **Resize** option — set max width/height while maintaining aspect ratio
- [x] 🟢 FREE: Output `width` and `height` attributes in a copyable `<img>` tag snippet with `loading="lazy"`
- [x] All processing happens client-side — no server upload needed (privacy-friendly)

---

### Task 4 — Security Headers Checker & Generator ✅ Complete
> Fixes: Security Checks 2–13 (all header checks)

- [x] Create `app/pages/tools/security-headers.vue`
- [x] 🟢 FREE: Generate recommended headers with one click:
  - `Strict-Transport-Security` (with recommended max-age)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (with sensible defaults)
  - `Cross-Origin-Embedder-Policy`
  - `Cross-Origin-Opener-Policy`
- [x] 🟢 FREE: Copy individual or all headers to clipboard
- [x] 🔒 PRO: **"Check my site"** input: enter URL → fetch headers → score them (A+ to F)
- [x] 🔒 PRO: **Platform-specific install tabs**: Nginx, Apache, Cloudflare, Vercel, Netlify, Next.js
- [x] 🔒 PRO: **Before/after comparison**: current headers vs recommended

---

### Task 5 — CSP Header Builder ✅ Complete
> Fixes: Security Checks 3, 5b (CSP present, CSP quality)

- [x] Create `app/pages/tools/csp-builder.vue`
- [x] 🟢 FREE: Visual directive editor — add/remove sources for each CSP directive
- [x] 🟢 FREE: Warn visually when `unsafe-inline`, `unsafe-eval`, or `*` wildcards are used
- [x] 🟢 FREE: Live output: full `Content-Security-Policy` header value + copy-to-clipboard
- [x] 🔒 PRO: Common presets, platform install tabs, site tester

---

### Task 6 — Robots.txt Generator & Validator ✅ Complete
> Fixes: SEO Check 10 (robots.txt reachable)

- [x] Create `app/pages/tools/robots-txt.vue`
- [x] 🟢 FREE: Visual editor with user-agent rules, allow/disallow paths, sitemap, crawl-delay
- [x] 🟢 FREE: Common presets: "Allow all", "Block all", "Block folders", "WordPress"
- [x] 🟢 FREE: Download as `robots.txt` + copy-to-clipboard
- [x] 🔒 PRO: URL tester & live fetch

---

### Task 7 — Favicon Generator ✅ Complete
> Fixes: SEO Check 9 (favicon present)

- [x] Create `app/pages/tools/favicon-generator.vue`
- [x] 🟢 FREE: Upload source image, generate favicon.ico (32×32) + apple-touch-icon (180×180)
- [x] 🟢 FREE: Mock browser tab preview with editable tab title
- [x] 🟢 FREE: Download favicon.ico + apple-touch-icon individually + head snippet
- [x] 🔒 PRO: PWA set, OG image, ZIP download

---

### Task 8 — Schema Markup Generator (JSON-LD) ✅ Complete
> Fixes: SEO Checks 8, 18, 19 (structured data, author, dates)

- [x] Create `app/pages/tools/schema-generator.vue`
- [x] 🟢 FREE: Article, BlogPosting, Organization type selector
- [x] 🟢 FREE: Guided form → auto-generates valid JSON-LD
- [x] 🟢 FREE: Copy `<script>` block + Download .json
- [x] 🔒 PRO: Additional types, validation, rich results preview

---

### Task 9 — Color Contrast Checker ✅ Complete
> Fixes: Accessibility — WCAG contrast requirements

- [x] Create `app/pages/tools/contrast-checker.vue`
- [x] 🟢 FREE: Color pickers for foreground + background with swap button
- [x] 🟢 FREE: Live preview at normal and large text sizes
- [x] 🟢 FREE: WCAG 2.1 contrast ratio (AA Normal, AA Large, AAA Normal, AAA Large)
- [x] 🔒 PRO: Color suggestions & colorblind simulation

---

### Task 10 — SPF / DKIM / DMARC Record Generator ✅ Complete
> Fixes: DNS Checks 1–3 (SPF, DMARC, DKIM)

- [x] Create `app/pages/tools/email-auth.vue`
- [x] 🟢 FREE: SPF Builder with provider dropdown + custom IPs + softfail/hardfail policy
- [x] 🟢 FREE: DMARC Builder with policy selector, rua email, subdomain policy, pct slider
- [x] 🟢 FREE: DKIM guidance with per-provider setup instructions
- [x] 🟢 FREE: Copy-to-clipboard for each record
- [x] 🔒 PRO: Live DNS checker

---

_Last updated: 2026-04-02 — Phase 4 (Fix-It Tools) planned with Free/Pro gating, tasks reordered_

---

## Phase 5 — AI Searchability (AEO)

> **Goal**: 94 checks across 7 categories + a dedicated fix-it tool — the first website scanner with native Answer Engine Optimization. Evaluates how well AI systems (ChatGPT, Perplexity, Google AI Overviews, Claude) can discover, parse, and cite the website.

---

### Task 1 — Schema migration ✅ Complete

- [x] Add `aiScore: v.optional(v.number())` to `scans` table in `convex/schema.ts`
- [x] Update `updateScan` in `convex/scans.ts` to accept new `aiScore` field
- [x] Run `npx convex deploy --yes`

---

### Task 2 — AI Readiness checks module (10 checks) ✅ Complete

- [x] Create `convex/checks/ai.ts` exporting `runAiChecks(html, headers, robotsTxt, jsonLd, llmsTxtResult, llmsFullTxtResult): PillarResult`
- [x] Check 1: `llms.txt` present
- [x] Check 2: `llms-full.txt` present
- [x] Check 3: AI crawler allow-list
- [x] Check 4: Answer-Engine Schema
- [x] Check 5: Author Authority (E-E-A-T)
- [x] Check 6: Semantic Content Isolation
- [x] Check 7: Content Freshness
- [x] Check 8: Heading Continuity
- [x] Check 9: Citation-Friendly Formatting
- [x] Check 10: Open Graph Article Data

---

### Task 3 — Orchestrator update ✅ Complete

- [x] Add parallel HEAD/GET requests in `convex/scanAction.ts` for `/llms.txt`, `/.well-known/llms.txt`, `/llms-full.txt`, and robots.txt content
- [x] Pass results to `runAiChecks()` alongside existing `html`, `headers`, `robotsTxt`, `jsonLd`
- [x] Compute `aiScore: (passing / total) * 100`
- [x] Update overall score calculation: `avg(security, performance, seo, accessibility, ai)` — 5 pillars; DNS and Trust remain bonus
- [x] Save `aiScore` via `updateScan`

---

### Task 4 — Expand FIX_SNIPPETS for AI checks ✅ Complete

- [x] Update `app/utils/fixSnippets.ts` with generic fix instructions for all 10 AI Readiness checks
- [x] Platform-specific snippets for llms.txt (Next.js, Nuxt, Nginx, Cloudflare), robots.txt AI rules, and JSON-LD FAQPage (Next.js, Nuxt)

---

### Task 5 — UI updates for AI Readiness pillar ✅ Complete

- [x] Add AI Readiness pillar card (color: `#ff7675`) to results page — updated grid to 5-col
- [x] Add `AI` tab to the tabbed issue list in `/results`
- [x] Overall score ring reflects 5-pillar average (computed in scanAction.ts)
- [x] Landing page pillar strip updated — 7 pillars, AI Readiness entry with 10 checks
- [x] Landing page stats updated: `94 checks · 7 pillars`

---

### Task 6 — AI Optimizer & `llms.txt` Generator tool ✅ Complete

- [x] Created `app/pages/tools/ai-optimizer.vue`
- [x] 🟢 FREE: `llms.txt` Generator with live preview + download + copy
- [x] 🟢 FREE: AI Crawler robots.txt Builder with Allow/Block/Partial toggles per agent
- [x] Added to `/tools` hub with AI Readiness pillar badge
- [x] Cross-linked from scan results for AI check failures

---

_Last updated: 2026-04-07 — Phase 5 Tasks 1–6 complete_

---

## Phase 6 — Bulk Scan (Pro)

> **Goal**: Let Pro users scan up to 50 URLs in a single job. Upload a CSV or paste URLs, watch real-time progress, then export a full results spreadsheet. Turns ScanPulse into an agency tool — audit an entire client site map in one click.
>
> **Gating**: Entire feature locked behind Pro. Free users see a `<ProGate>` upgrade prompt at `/bulk-scan`.

---

### Task 1 — Schema migration ✅ Complete

- [x] `bulkScans` table added to `convex/schema.ts`
- [x] `bulkScanId: v.optional(v.id('bulkScans'))` added to `scans` table
- [x] `by_bulk` index added to `scans`
- [x] Deployed

---

### Task 2 — Convex functions for bulk scan lifecycle ✅ Complete

- [x] `convex/bulkScans.ts`: `createBulkScan` (Pro-gated, max 50), `getBulkScan`, `getBulkScanWithScans`, `getBulkScansByUser`, `updateBulkScan`, `deleteBulkScan`, `getNextPendingScan`

---

### Task 3 — `runBulkScan` action (orchestrator) ✅ Complete

- [x] `convex/bulkScanAction.ts`: `startBulkScan` (public) + `processNextScan` (internal) chained via `ctx.scheduler.runAfter(0, ...)` — one URL per invocation

---

### Task 4 — `/bulk-scan` input page ✅ Complete

- [x] `app/pages/bulk-scan/index.vue`: ProGate, paste/CSV tab, client-side validation, 50-URL counter + bar, scan name, submit

---

### Task 5 — `/bulk-scan/[id]` results page ✅ Complete

- [x] `app/pages/bulk-scan/[id].vue`: live progress bar, elapsed + estimated time, sortable score table with skeleton rows, delete button

---

### Task 6 — CSV export ✅ Complete

- [x] `app/utils/exportBulkCsv.ts`: all pillar scores + issue counts, Blob download
- [x] Wired into results page

---

### Task 7 — Dashboard & navigation integration ✅ Complete

- [x] Bulk Scans widget added to `/dashboard` — last 5 jobs with progress bar + status badge
- [x] "Bulk Scan" NavBar link (pink, Pro accent)
- [x] Both pages use `definePageMeta({ middleware: 'auth' })`

---

_Last updated: 2026-04-07 — Phase 6 (Bulk Scan) complete_

---

## Phase 7 — Score History & Trend Charts ✅ Complete

> **Goal**: Track every scan result per URL over time and surface trends — rising or falling scores, regression alerts, and a sparkline chart per pillar. Turns ScanPulse from a one-shot scanner into a continuous health monitor.
>
> **Gating**: History view and charts are Pro. Free users see the last scan only.

---

### Task 1 — Schema: score snapshots

- [x] Add `scoreHistory` table to `convex/schema.ts`:
  ```ts
  scoreHistory: defineTable({
    userId:             v.string(),
    url:                v.string(),        // normalised (no trailing slash, lowercase)
    scanId:             v.id('scans'),
    ts:                 v.number(),        // _creationTime copy for easy range queries
    overallScore:       v.optional(v.number()),
    securityScore:      v.optional(v.number()),
    performanceScore:   v.optional(v.number()),
    seoScore:           v.optional(v.number()),
    accessibilityScore: v.optional(v.number()),
    aiScore:            v.optional(v.number()),
  })
    .index('by_user_url', ['userId', 'url'])
    .index('by_user_url_ts', ['userId', 'url', 'ts'])
  ```
- [x] Run `npx convex deploy --yes`

---

### Task 2 — Write snapshot on scan completion

- [x] Create `convex/scoreHistory.ts`:
  - `recordSnapshot` internalMutation: insert one `scoreHistory` doc from a completed scan
  - `getHistory` query: `by_user_url_ts` index, `.order('asc').take(90)` — last 90 snapshots per URL
  - `getHistoryForUser` query: distinct URLs with latest snapshot each (for dashboard overview)
- [x] Call `recordSnapshot` from `scanAction.ts` after a successful `updateScan` (status `done`)

---

### Task 3 — Trend chart component

Create `app/components/TrendChart.vue`:

- [x] Accept `{ snapshots: ScoreSnapshot[], pillar: string, color: string }` props
- [x] Render an SVG sparkline (no external chart lib — pure SVG path from score values)
- [x] Show min / max / latest score labels
- [x] Highlight regressions (drop >10pts between consecutive points) with a red dot
- [x] Tooltip on hover showing date + score
- [x] Animate path draw on mount (CSS stroke-dashoffset transition)

---

### Task 4 — `/history/[url]` page

Create `app/pages/history/[url].vue` (URL base64-encoded in param):

- [x] `<ProGate>` — free users see latest scan only, no chart
- [x] Hero: URL + overall trend direction badge (`↑ +12 this month` / `↓ -5`)
- [x] Full trend chart for overall score (90-day window)
- [x] Per-pillar sparklines row (6 small charts: security, performance, SEO, a11y, AI, DNS)
- [x] Score history table: date · overall · per-pillar scores · issues count — paginated, newest first
- [x] Regression alert row: highlighted in red when overall drops >10pts vs previous scan
- [x] "Scan now" CTA to add a new data point

---

### Task 5 — Dashboard trend widgets

- [x] Add mini sparkline to each scan history row in `/dashboard` (overall score over last 5 scans for that URL)
- [x] Add "Score Trends" card to dashboard overview: top 3 URLs by activity with direction badge
- [x] Link each URL to `/history/[url]`

---

### Task 6 — Regression alert emails

- [x] Add `regressionThreshold` field to `alertPreferences` (default: 10 pts)
- [x] In `recordSnapshot`: after insert, compare new overall score to previous snapshot — if drop ≥ threshold and user has alerts enabled, schedule email via Resend
- [x] Email template: "Your score for example.com dropped from 84 → 71 — view details"

---

_Last updated: 2026-04-08 — Phase 7 (Score History) complete_

---

## Phase 8 — Competitor Scan (Pro) ✅ Complete

> **Goal**: Side-by-side scan of two URLs — your site vs a competitor. Shows score deltas per pillar, highlights where you're behind, and prioritises fixes by competitive impact.
>
> **Gating**: Pro only. Free users see a teaser with blurred competitor column.

---

### Task 1 — `/compare` input page

- [x] `definePageMeta({ middleware: 'auth' })`
- [x] `<ProGate>` wraps the compare tool
- [x] Two URL inputs: "Your site" + "Competitor"
- [x] Swap button (flip the two URLs)
- [x] "Compare" CTA → triggers two parallel scans → redirects to `/compare/[scanIdA]/[scanIdB]`
- [x] Recent comparisons list (stored in localStorage, last 5 pairs)

---

### Task 2 — Parallel scan orchestration

- [x] Add `compareScans` action in `convex/compare.ts`
- [x] No new schema needed — reuses existing `scans` table

---

### Task 3 — `/compare/[scanIdA]/[scanIdB]` results page

- [x] Poll both scans until both reach `done` or `error`
- [x] Hero: two score rings side by side with delta badge
- [x] Pillar comparison table sorted by delta (biggest gap first)
- [x] Issue diff section + Strengths section
- [x] Share button + Export PDF via `window.print()`

---

### Task 4 — Dashboard integration

- [x] "New comparison" CTA on dashboard for Pro users
- [x] Last 3 comparisons shown with URL pair + score delta badge

---

_Last updated: 2026-04-08 — Phase 8 (Competitor Scan) complete_

---

## Phase 9 — Public API (Pro) ✅ Complete

> **Goal**: A documented REST API at `/api/v1/scan` so developers and agencies can run ScanPulse scans programmatically — from CI pipelines, Slack bots, custom dashboards. Authenticated via the API key system already built.
>
> **Gating**: Pro only. Rate-limited to 60 req/min per key.

---

### Task 1 — API HTTP router ✅ Complete

- [x] `POST /api/v1/scan`, `GET /api/v1/scan/:scanId`, `GET /api/v1/scans` in `convex/http.ts`
- [x] Auth middleware: Bearer token → hash → `apiKeys` table → userId + Pro plan check
- [x] Rate limiting: 429 if exceeded

---

### Task 2 — `POST /api/v1/scan` endpoint ✅ Complete

- [x] Validate URL body, createScan, fire runScan async, return 201 with pollUrl

---

### Task 3 — `GET /api/v1/scan/:scanId` endpoint ✅ Complete

- [x] Owner check, full scan doc as JSON with scores + issues

---

### Task 4 — `GET /api/v1/scans` endpoint ✅ Complete

- [x] Last 20 scans, `?status=` filter, `?limit=N`, cursor pagination

---

### Task 5 — API docs page ✅ Complete

- [x] `app/pages/api-docs.vue` — all 3 endpoints documented, curl/fetch/Python snippets, interactive Try-it

---

### Task 6 — CI/CD integration guide ✅ Complete

- [x] `docs/API.md` with GitHub Actions workflow example

---

_Last updated: 2026-04-08 — Phase 9 (Public API) complete_

---

## Phase 10 — Marketing & SEO Polish

> **Goal**: Make ScanPulse rank for high-intent keywords ("website security checker", "free SEO audit tool", "WCAG accessibility checker") and convert organic visitors to signups. Each tool page is already an SEO landing page — this phase sharpens copy, adds social proof, improves Core Web Vitals, and builds linkable assets.

---

### Task 1 — On-page SEO audit of key routes ✅ Complete

- [x] Unique `<title>` + `<meta description>` + OG tags on every public page (landing, tools hub, all 10 tool pages, pricing)
- [x] Add `<link rel="canonical">` to all public pages via `useRequestURL()`
- [x] Add `dateModified` + `FAQPage` JSON-LD + `WebSite` schema to landing page (5 FAQ entries targeting key queries)
- [x] All tool page H1s match their target keyword (Security Headers Generator, CSP Header Builder, etc.)
- [x] Improved titles to be more keyword-rich (e.g. "Free WCAG Color Contrast Checker — AA & AAA Ratio Tool")

---

### Task 2 — Landing page copy & conversion improvements

- [ ] A/B test hero headline variants (store chosen variant in localStorage)
- [ ] Add social proof strip: "Join 1,200+ developers scanning their sites" (dynamic counter from Convex scan count)
- [ ] Add "As used by" logo strip (placeholder logos initially)
- [ ] Add testimonial cards (3 quotes with avatar, name, role)
- [ ] Improve pricing section: add feature comparison table (Free vs Pro side by side)
- [ ] Add FAQ section targeting long-tail keywords

---

### Task 3 — Tool SEO landing pages

Each tool page (`/tools/*`) should:
- [ ] Have a unique meta description mentioning the specific problem it solves
- [ ] Include a short "What is X?" intro paragraph (150–200 words) targeting the keyword
- [ ] Add FAQ JSON-LD with 3–5 questions per tool
- [ ] Internal link to related tools and the main scanner

---

### Task 4 — Blog / content engine

- [ ] Create `app/pages/blog/index.vue` — blog index listing posts
- [ ] Create `app/pages/blog/[slug].vue` — blog post template
- [ ] Store posts as static `.md` files in `content/blog/` using Nuxt Content module
- [ ] Initial 3 posts:
  - "What is HSTS and why your site needs it" (targets security header keywords)
  - "How to pass a WCAG accessibility audit in 2026"
  - "What is llms.txt and why AI search engines need it"
- [ ] Each post cross-links to the relevant scanner check + fix-it tool

---

### Task 5 — Performance & Core Web Vitals

- [ ] Audit and fix LCP on landing page (preload hero font, defer non-critical scripts)
- [ ] Add `loading="lazy"` and explicit `width`/`height` to all images
- [ ] Ensure no layout shift from Clerk auth hydration (skeleton loader)
- [ ] Add `<link rel="preconnect">` for Google Fonts, Convex cloud
- [ ] Run Lighthouse CI in GitHub Actions: fail build if LCP > 2.5s or CLS > 0.1

---

### Task 6 — Open Graph & social preview

- [ ] Dynamic OG image for scan results: generate a card showing URL + scores (edge function using `@vercel/og` or similar)
- [ ] Static OG images for all tool pages (branded card with tool name + pillar colour)
- [ ] Twitter Card `summary_large_image` on all pages
- [ ] Test all previews with opengraph.xyz

---

_Last updated: 2026-04-08 — Phase 10 Task 1 (On-page SEO audit) complete_
