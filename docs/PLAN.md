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
- [ ] Add `GOOGLE_PSI_API_KEY` env var to Convex dashboard docs

---

### Task 11 — Expand FIX_SNIPPETS to cover all 84 checks
> Spec ref: [Fix Snippets Expansion](superpowers/specs/2026-04-01-phase-2.5-scan-engine-design.md#fix-snippets-expansion)

- [ ] Update `app/utils/fixSnippets.ts` structure to `{ generic, platforms? }` per check
- [ ] Add generic + platform-specific snippets for all 21 security checks (Next.js, Nginx, Cloudflare, Apache, .htaccess)
- [ ] Add generic + platform-specific snippets for all 18 performance checks
- [ ] Add generic + platform-specific snippets for all 19 SEO checks
- [ ] Add generic snippets for all 12 accessibility checks
- [ ] Add generic snippets for all 8 DNS & Email checks
- [ ] Add generic snippets for all 6 Trust checks

---

### Task 12 — UI updates for new pillars and scores
- [ ] Add Accessibility pillar card (color: pick from design system — e.g. `#a29bfe`) to results page
- [ ] Add DNS & Email and Trust scores as "bonus" category cards (not in overall ring)
- [ ] Display `detectedTech` stack badges on results page
- [ ] Display `certExpiry` and `domainExpiry` prominently on results (days remaining)
- [ ] Display `carbonGrams` and `greenHosting` badge on results
- [ ] Update overall score ring calculation to average 4 pillars when `accessibilityScore` is present
- [ ] Update landing page pillar strip to show 6 categories and 84 check count

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

_Last updated: 2026-04-02 — Task 10 (Orchestrator refactor) complete_
