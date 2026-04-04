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

### Task 5 — Email sending for alerts (Resend + Convex cron)
- [ ] Sign up for Resend and add `RESEND_API_KEY` to Convex env vars
- [ ] Create `convex/emails.ts` action: `sendAlertEmail({ to, subject, html })` using Resend API
- [ ] Design email template HTML: ScanPulse branding, score drop summary, link to results page
- [ ] Create `convex/crons.ts` scheduled job (or extend existing monitoring cron):
  - Query all users with `alertPreferences.enabled === true`
  - For each monitored site, compare latest scan score to `alertPreferences.threshold`
  - If score < threshold and no alert sent in last 24h, fire `sendAlertEmail`
- [ ] Add `lastAlertSentAt` field to `monitors` table to prevent spam
- [ ] Test: manually lower a score below threshold, verify email arrives
- [ ] Mark Phase 2 "Email alerts when score drops below threshold" as ✅

---

### Task 6 — Developer tab (API keys)
- [ ] Create `apiKeys` table in `convex/schema.ts`:
  - `userId: v.string()`
  - `key: v.string()` (hashed)
  - `prefix: v.string()` (`sp_live_` + first 8 chars, for display)
  - `createdAt: v.number()`
  - `lastUsedAt: v.optional(v.number())`
  - Indexes: `by_user`, `by_key`
- [ ] Create `convex/apiKeys.ts` with mutations/queries:
  - `generateApiKey({ userId })` → generate `sp_live_` + 32-char random hex, hash, store, return raw key once
  - `listApiKeys({ userId })` → return prefix + createdAt + lastUsedAt (never full key)
  - `revokeApiKey({ userId, keyId })` → delete the key document
- [ ] Build Developer tab UI:
  - "Generate API Key" button (disabled if free plan)
  - After generation: show full key once in a copy-to-clipboard box with warning
  - Table listing existing keys: prefix, created date, last used, revoke button
  - Code example showing how to call the API with `curl`
- [ ] Create Convex HTTP endpoint `POST /api/scan` in `convex/http.ts`:
  - Validate `Authorization: Bearer` header against `apiKeys` table
  - Call `createScan` + `runScan` action
  - Return JSON `{ scanId, status }`
  - Update `lastUsedAt` on the API key
- [ ] Create Convex HTTP endpoint `GET /api/scan/:id` in `convex/http.ts`:
  - Return scan results as JSON
- [ ] Gate behind Pro/Agency plan — free users see "Upgrade to Pro" overlay

---

### Task 7 — Danger Zone (Account deletion)
- [ ] Build Danger Zone tab UI:
  - Red-bordered card with warning text
  - "Delete my account and all data" button (red, destructive)
  - Confirmation modal: type account email to confirm
- [ ] Create `convex/users.ts` mutation: `deleteUserData({ clerkId })`:
  - Delete all scans belonging to this user
  - Delete all monitors belonging to this user
  - Delete all API keys belonging to this user
  - Delete the user document itself
- [ ] After Convex cleanup, call Clerk's `deleteUser` API or redirect to Clerk's account deletion flow
- [ ] Handle `user.deleted` Clerk webhook in `convex/http.ts`:
  - If user deleted from Clerk dashboard, also clean up Convex data
  - Prevents orphaned data
- [ ] Add toast confirmation: "Your account has been deleted" → redirect to `/`

---

### Task 8 — Dashboard widget for monitored sites (Phase 2 completion)
- [ ] Add a "Monitored Sites" section to `/dashboard` above the scan history
- [ ] Query `monitors` table for user's active monitors
- [ ] Display each monitor as a card:
  - URL + favicon
  - Latest overall score (color-coded)
  - Score trend arrow (↑ / ↓ / →) comparing last 2 scans
  - Monitoring frequency badge (Hourly / Daily / Weekly)
  - "Last checked: 2h ago" timestamp
- [ ] Add "View History" button → navigates to results page with `?url=` filter
- [ ] Empty state: "No sites monitored yet. Scan a site and toggle Watch."
- [ ] Mark Phase 2 "Dashboard widget for monitored sites" as ✅

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

### Task 1 — Tools Hub page & ProGate component (foundation)
- [ ] Build reusable `<ProGate>` component: blurred overlay with "Upgrade to Pro to unlock" CTA — used by all tools
- [ ] Create `app/pages/tools/index.vue` as the tools landing/directory page
- [ ] Grid of tool cards with icon, title, one-line description, and pillar badge (Security/Performance/SEO/etc.)
- [ ] Group tools by pillar category
- [ ] Each card links to the individual tool page
- [ ] Show "Free" and "Pro" badges on each card to indicate gating level
- [ ] SEO: unique title/description per tool page for organic traffic
- [ ] Add "Tools" link to NavBar between "Pricing" and "Dashboard"
- [ ] Cross-link from scan results: when an issue is flagged, show a "Fix with our tool →" link to the relevant tool
- [ ] All tools accessible without login — Pro features prompt sign-in → upgrade

---

### Task 2 — Meta Tag Generator
> Fixes: SEO Checks 1–7 (title, description, OG, Twitter Card, viewport)

- [ ] Create `app/pages/tools/meta-generator.vue`
- [ ] 🟢 FREE: Form fields:
  - Page title (with character counter, 30–60 target)
  - Meta description (with character counter, 70–160 target)
  - Canonical URL
  - Viewport (pre-filled with best practice default)
  - Charset (pre-filled UTF-8)
  - Robots (index/noindex toggle)
- [ ] 🟢 FREE: "Copy to clipboard" button for the generated `<head>` HTML block
- [ ] 🟢 FREE: Live preview: Google search result snippet (title + description + URL)
- [ ] 🔒 PRO: OG image URL field (with preview thumbnail)
- [ ] 🔒 PRO: Twitter card type dropdown (summary / summary_large_image)
- [ ] 🔒 PRO: Live preview: social share card (Facebook and Twitter/X)
- [ ] 🔒 PRO: **Platform-specific output tabs**: Next.js `metadata`, Nuxt `useSeoMeta`, WordPress Yoast

---

### Task 3 — Image Optimizer & Converter
> Fixes: Performance Check 10 (image format audit), Check 12 (lazy loading awareness)

- [ ] Create `app/pages/tools/image-optimizer.vue`
- [ ] 🟢 FREE: Drag-and-drop upload zone — accept PNG, JPEG, BMP, GIF, TIFF
- [ ] 🟢 FREE: Client-side conversion to **WebP** using `HTMLCanvasElement.toBlob()`
- [ ] 🟢 FREE: Quality slider: 1–100 with live preview (before/after side-by-side)
- [ ] 🟢 FREE: Show file size savings: "Original: 1.2MB → WebP: 180KB (85% smaller)"
- [ ] 🟢 FREE: Single image download
- [ ] 🔒 PRO: **AVIF** output format (WASM library, e.g. `squoosh-wasm`)
- [ ] 🔒 PRO: **Batch upload** — convert multiple images at once with download-all ZIP (via `JSZip`)
- [ ] 🔒 PRO: **Resize** option — set max width/height while maintaining aspect ratio
- [ ] 🟢 FREE: Output `width` and `height` attributes in a copyable `<img>` tag snippet with `loading="lazy"`
- [ ] All processing happens client-side — no server upload needed (privacy-friendly)

---

### Task 4 — Security Headers Checker & Generator
> Fixes: Security Checks 2–13 (all header checks)

- [ ] Create `app/pages/tools/security-headers.vue`
- [ ] 🟢 FREE: Generate recommended headers with one click:
  - `Strict-Transport-Security` (with recommended max-age)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (with sensible defaults)
  - `Cross-Origin-Embedder-Policy`
  - `Cross-Origin-Opener-Policy`
- [ ] 🟢 FREE: Copy individual or all headers to clipboard
- [ ] 🔒 PRO: **"Check my site"** input: enter URL → fetch headers → score them (A+ to F)
- [ ] 🔒 PRO: **Platform-specific install tabs**: Nginx, Apache, Cloudflare, Vercel, Netlify, Next.js
- [ ] 🔒 PRO: **Before/after comparison**: current headers vs recommended

---

### Task 5 — CSP Header Builder
> Fixes: Security Checks 3, 5b (CSP present, CSP quality)

- [ ] Create `app/pages/tools/csp-builder.vue`
- [ ] 🟢 FREE: Visual directive editor — add/remove sources for each CSP directive:
  - `default-src`, `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`, `media-src`, `object-src`, `base-uri`, `form-action`, `frame-ancestors`
- [ ] 🟢 FREE: Warn visually when `unsafe-inline`, `unsafe-eval`, or `*` wildcards are used
- [ ] 🟢 FREE: Live output: full `Content-Security-Policy` header value + copy-to-clipboard
- [ ] 🔒 PRO: **Common presets**: "Strict", "Google Analytics compatible", "Cloudflare compatible"
- [ ] 🔒 PRO: **Platform-specific install tabs**: Nginx, Apache, Cloudflare Workers, Next.js, Vercel, `<meta>` fallback
- [ ] 🔒 PRO: **"Test against my site"** button: paste a URL → fetch headers → show what would change

---

### Task 6 — Robots.txt Generator & Validator
> Fixes: SEO Check 10 (robots.txt reachable)

- [ ] Create `app/pages/tools/robots-txt.vue`
- [ ] 🟢 FREE: Visual editor:
  - Add user-agent rules (Googlebot, Bingbot, *, etc.)
  - Allow/Disallow path rules per agent
  - Sitemap URL input
  - Crawl-delay setting
- [ ] 🟢 FREE: Common presets: "Allow all", "Block all", "Block specific folders", "WordPress default"
- [ ] 🟢 FREE: Download as `robots.txt` file + copy-to-clipboard
- [ ] 🔒 PRO: **"Test a URL"** input: check if a given path would be crawled or blocked
- [ ] 🔒 PRO: **"Fetch my current robots.txt"** button: paste domain → show current file + analysis

---

### Task 7 — Favicon Generator
> Fixes: SEO Check 9 (favicon present)

- [ ] Create `app/pages/tools/favicon-generator.vue`
- [ ] 🟢 FREE: Upload a source image (SVG, PNG, JPEG) or pick from emoji/icon grid
- [ ] 🟢 FREE: Generate basic sizes client-side:
  - `favicon.ico` (16×16, 32×32 multi-size)
  - `apple-touch-icon.png` (180×180)
- [ ] 🟢 FREE: Preview on a mock browser tab
- [ ] 🟢 FREE: Download favicon.ico + apple-touch-icon individually
- [ ] 🔒 PRO: **Full PWA set**: `icon-192.png`, `icon-512.png`
- [ ] 🔒 PRO: **OG image** (1200×630) with customizable background color
- [ ] 🔒 PRO: Preview on phone home screen and bookmarks bar
- [ ] 🔒 PRO: **Download all as ZIP** with ready-to-paste `<head>` snippet + `site.webmanifest`

---

### Task 8 — Schema Markup Generator (JSON-LD)
> Fixes: SEO Checks 8, 18, 19 (structured data, author, dates)

- [ ] Create `app/pages/tools/schema-generator.vue`
- [ ] 🟢 FREE: Template selector for basic types:
  - `Article` / `BlogPosting` (with author, datePublished, dateModified)
  - `Organization` (with logo, social profiles)
- [ ] 🟢 FREE: Guided form: fill in fields, auto-generates valid JSON-LD
- [ ] 🟢 FREE: Live preview: rendered JSON-LD `<script>` block
- [ ] 🟢 FREE: "Copy to clipboard" and "Download .json" buttons
- [ ] 🔒 PRO: **Additional schema types**: `LocalBusiness`, `Product`, `BreadcrumbList`, `FAQPage`, `WebSite` (sitelinks searchbox)
- [ ] 🔒 PRO: **Validation**: run against Schema.org rules, flag missing required fields
- [ ] 🔒 PRO: **Google Rich Results preview** mock (how it would look in search)

---

### Task 9 — Color Contrast Checker
> Fixes: Accessibility — WCAG contrast requirements

- [ ] Create `app/pages/tools/contrast-checker.vue`
- [ ] 🟢 FREE: Two color pickers: foreground (text) and background
- [ ] 🟢 FREE: Live preview: sample text rendered with chosen colors at different sizes
- [ ] 🟢 FREE: Calculate contrast ratio using WCAG 2.1 formula
- [ ] 🟢 FREE: Show pass/fail badges for AA Normal, AA Large, AAA Normal, AAA Large
- [ ] 🟢 FREE: Hex, RGB, and HSL input support
- [ ] 🔒 PRO: **"Suggest closest passing color"** — auto-adjust hue/lightness to meet AA
- [ ] 🔒 PRO: **Color blindness simulation**: protanopia, deuteranopia, tritanopia preview

---

### Task 10 — SPF / DKIM / DMARC Record Generator
> Fixes: DNS Checks 1–3 (SPF, DMARC, DKIM)

- [ ] Create `app/pages/tools/email-auth.vue`
- [ ] 🟢 FREE: **SPF Builder**:
  - Dropdown to add common senders: Google Workspace, Microsoft 365, Mailchimp, SendGrid, Resend, Amazon SES, Zoho
  - Add custom IP ranges
  - Choose policy: `~all` (softfail) or `-all` (hardfail)
  - Output: full SPF TXT record value
- [ ] 🟢 FREE: **DMARC Builder**:
  - Policy selector: `none`, `quarantine`, `reject`
  - Reporting email input (`rua=`)
  - Subdomain policy option
  - Output: full DMARC TXT record value for `_dmarc.yourdomain.com`
- [ ] 🟢 FREE: **DKIM guidance**: step-by-step instructions per provider (Google, Microsoft, etc.)
- [ ] 🟢 FREE: Copy-to-clipboard for each record
- [ ] 🔒 PRO: **"Check my domain"** button: enter domain → query DNS → show current SPF/DMARC records + analysis
- [ ] 🔒 PRO: DNS provider-specific instructions (Cloudflare, Namecheap, GoDaddy)

---

_Last updated: 2026-04-02 — Phase 4 (Fix-It Tools) planned with Free/Pro gating, tasks reordered_

---

## Phase 5 — AI Searchability (AEO)

> **Goal**: 94 checks across 7 categories + a dedicated fix-it tool — the first website scanner with native Answer Engine Optimization. Evaluates how well AI systems (ChatGPT, Perplexity, Google AI Overviews, Claude) can discover, parse, and cite the website.

---

### Task 1 — Schema migration

- [ ] Add `aiScore: v.optional(v.number())` to `scans` table in `convex/schema.ts`
- [ ] Update `updateScan` in `convex/scans.ts` to accept new `aiScore` field
- [ ] Run `npx convex deploy --yes`

---

### Task 2 — AI Readiness checks module (10 checks)

- [ ] Create `convex/checks/ai.ts` exporting `runAiChecks(html, headers, robotsTxt, jsonLd, llmsTxtResult, llmsFullTxtResult): PillarResult`
- [ ] Check 1: `llms.txt` present — 200 status from parallel HEAD to `/llms.txt` or `/.well-known/llms.txt`
- [ ] Check 2: `llms-full.txt` present — 200 status from parallel HEAD for extended AI ingestion content
- [ ] Check 3: AI crawler allow-list — parse `robotsTxt` for `GPTBot`, `ChatGPT-User`, `Google-Extended`, `ClaudeBot`, `PerplexityBot`, `anthropic-ai`; flag if any are `Disallow: /`
- [ ] Check 4: Answer-Engine Schema — parse `jsonLd` for `FAQPage`, `HowTo`, `QAPage`, or `Article` types (AIs extract structured answers from these)
- [ ] Check 5: Author Authority (E-E-A-T) — detect `Person` or `Organization` in `jsonLd`, or `rel="author"` / `<meta name="author">` in HTML
- [ ] Check 6: Semantic Content Isolation — check `html` for `<main>`, `<article>`, or `<section>` usage to help LLM parsers separate content from boilerplate
- [ ] Check 7: Content Freshness — detect `dateModified` in `jsonLd` or `<meta property="article:modified_time">` (RAG pipelines prefer recent data)
- [ ] Check 8: Heading Continuity — ensure `H1` → `H2` → `H3` flows without skipped levels, providing clean outlines for AI parsers
- [ ] Check 9: Citation-Friendly Formatting — detect `<ol>`, `<ul>`, `<dl>`, or `<table>` tags; LLMs prefer structured lists/tables for factual extraction
- [ ] Check 10: Open Graph Article Data — check for `article:published_time`, `article:author`, `article:section` providing metadata context for browsing agents

---

### Task 3 — Orchestrator update

- [ ] Add parallel HEAD requests in `convex/scanAction.ts` for `/llms.txt`, `/.well-known/llms.txt`, `/llms-full.txt`
- [ ] Pass results to `runAiChecks()` alongside existing `html`, `headers`, `robotsTxt`, `jsonLd`
- [ ] Compute `aiScore: (passing / total) * 100`
- [ ] Update overall score calculation: `avg(security, performance, seo, accessibility, ai)` — 5 pillars; DNS and Trust remain bonus
- [ ] Save `aiScore` via `updateScan`

---

### Task 4 — Expand FIX_SNIPPETS for AI checks

- [ ] Update `app/utils/fixSnippets.ts` with generic fix instructions for all 10 AI Readiness checks
- [ ] Add platform-specific snippets where applicable:
  - `llms.txt` creation guide (generic markdown file)
  - `robots.txt` AI bot rules (Nginx, Vercel, Cloudflare)
  - JSON-LD `FAQPage` / `HowTo` templates (Next.js, Nuxt, WordPress)

---

### Task 5 — UI updates for AI Readiness pillar

- [ ] Add AI Readiness pillar card (color: `#ff7675`) to results page — update grid to 5-col for main pillars
- [ ] Add `AI` tab to the tabbed issue list in `/results`
- [ ] Update overall score ring to reflect 5-pillar average
- [ ] Update landing page pillar strip to show 7 categories and 94 check count
- [ ] Update landing page stats ticker: `94+ checks · 7 pillars`

---

### Task 6 — AI Optimizer & `llms.txt` Generator tool
> Fixes: AI Readiness Checks 1, 2, 3

- [ ] Create `app/pages/tools/ai-optimizer.vue`
- [ ] 🟢 FREE: **`llms.txt` Generator**:
  - Form fields: Site Name, Short Description, Target Audience, Key URLs (Docs, Pricing, API, Blog)
  - Live output: valid markdown formatted for LLM ingestion
  - Download as `llms.txt` file + copy-to-clipboard
- [ ] 🟢 FREE: **AI Crawler robots.txt Builder**:
  - Dropdown per agent: `GPTBot`, `ChatGPT-User`, `Google-Extended`, `ClaudeBot`, `PerplexityBot`, `anthropic-ai`
  - Toggle each: Allow / Block
  - Output: pasteable `robots.txt` snippet
  - Copy-to-clipboard
- [ ] 🔒 PRO: **"Live AI Parse Test"**: enter URL → backend strips nav/footer/scripts → returns exact markdown an LLM would "see" (helps debug Semantic Isolation, Check 6)
- [ ] Add to `/tools` hub with pillar badge "AI Readiness"
- [ ] Cross-link from scan results when AI checks fail: "Fix with our tool →"

---

_Last updated: 2026-04-02 — Phase 5 (AI Searchability / AEO) planned_
