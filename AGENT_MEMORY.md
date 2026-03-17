# SiteFix — Shared Agent Memory

## Project state
Current agent: 3
Last completed agent: 2
Build status: in progress

---

## Convex schema version
Last updated by: none
Status: not yet created
Notes: none

---

## Key decisions log
This section records every important technical decision 
made during the build. Any agent that makes a decision 
that affects other agents MUST log it here.

Format:
- [Agent N] [what was decided] [why]

Decisions:
- none yet

---

## Problems encountered and how they were solved
Any agent that hits a non-obvious problem and solves it 
MUST log it here so future agents don't hit the same wall.

Format:
- [Agent N] Problem: [what broke]
  Solution: [how it was fixed]
  Watch out for: [what future agents should know]

Problems:
- none yet

---

## Package versions installed
Every npm package installed must be logged here with its 
exact version so future agents use the same versions and 
don't introduce conflicts.

Format:
- package-name: x.x.x — installed by Agent N

Packages:
- svix@latest — webhook signature verification — Agent 1

---

## Environment variables confirmed working
Log each env variable here once it is confirmed working 
in the running app, so future agents know what is safe 
to rely on.

Format:
- VARIABLE_NAME — confirmed by Agent N — purpose

Variables:
- CLERK_WEBHOOK_SECRET — confirmed by Agent 1 — Clerk webhook validation
- SENTRY_ORG — confirmed by Agent 13 — Sentry plugin setup
- SENTRY_PROJECT — confirmed by Agent 13 — Sentry plugin setup
- NEXT_PUBLIC_CONVEX_SITE_URL — confirmed by Agent 1 — Clerk webhook HTTP routing
- CONVEX_DEPLOY_KEY — confirmed by Agent 14 — Vercel production deployment

---

## File ownership map
Tracks which agent owns which files so agents don't 
accidentally overwrite each other's work.

Format:
- filepath — owned by Agent N — status

Files:
- next.config.ts — owned by Agent 1 — completed
- convex/http.ts — owned by Agent 1 — completed
- README.md — owned by Agent 1 — completed
- app/layout.tsx — owned by Agent 1 — completed
- app/page.tsx — owned by Agent 1 — completed
- app/dashboard/page.tsx — owned by Agent 3 — completed
- app/dashboard/layout.tsx — owned by Agent 3 — completed
- components/ScoreRing.tsx — owned by Agent 3 — completed
- components/PillarCard.tsx — owned by Agent 3 — completed
- components/IssueCard.tsx — owned by Agent 3 — completed
- components/UpgradeModal.tsx — owned by Agent 3 — completed
- components/UpgradeModalProvider.tsx — owned by Agent 3 — completed
- app/dashboard/DashboardClient.tsx — owned by Agent 3 — completed
- app/dashboard/scan/[scanId]/page.tsx — owned by Agent 3 — completed
- app/dashboard/scan/[scanId]/ScanResultsClient.tsx — owned by Agent 3 — completed
- app/dashboard/settings/page.tsx — owned by Agent 4 — completed
- app/dashboard/settings/SettingsClient.tsx — owned by Agent 4 — completed
- convex/watchedSites.ts — owned by Agent 5 — completed
- convex/monitoring.ts — owned by Agent 5 — completed
- convex/crons.ts — owned by Agent 5 — completed
- app/report/[token]/page.tsx — owned by Agent 6 — completed
- app/report/[token]/ShareableReport.tsx — owned by Agent 6 — completed
- app/api/export-pdf/[scanId]/route.tsx — owned by Agent 6 — completed
- app/api/tools/convert/route.ts — owned by Agent 7 — completed
- app/dashboard/tools/image-converter/page.tsx — owned by Agent 7 — completed
- app/dashboard/tools/image-converter/ImageConverterClient.tsx — owned by Agent 7 — completed
- convex/aiTools.ts — owned by Agent 8 — completed
- convex/aiUsage.ts — owned by Agent 8 — completed
- app/dashboard/tools/meta-tag-writer/page.tsx — owned by Agent 8 — completed
- app/dashboard/tools/meta-tag-writer/MetaTagClient.tsx — owned by Agent 8 — completed
- app/dashboard/tools/alt-text-generator/page.tsx — owned by Agent 8 — completed
- app/dashboard/tools/alt-text-generator/AltTextClient.tsx — owned by Agent 8 — completed
- app/dashboard/tools/layout.tsx — owned by Agent 9 — pending
- app/dashboard/tools/image-converter/loading.tsx — owned by Agent 9 — pending
- app/dashboard/tools/meta-tag-writer/loading.tsx — owned by Agent 9 — pending
- app/dashboard/tools/alt-text-generator/loading.tsx — owned by Agent 9 — pending
- app/dashboard/tools/security-headers/loading.tsx — owned by Agent 9 — pending
- app/dashboard/tools/robots-txt/loading.tsx — owned by Agent 9 — pending
- app/dashboard/tools/open-graph/loading.tsx — owned by Agent 9 — pending
- app/dashboard/tools/sitemap-generator/loading.tsx — owned by Agent 9 — pending
- app/dashboard/tools/minifier/loading.tsx — owned by Agent 9 — pending
- app/dashboard/tools/competitor/loading.tsx — owned by Agent 9 — pending
- app/admin/page.tsx — owned by Agent 14 — pending
- app/admin/_components/AdminHeader.tsx — owned by Agent 14 — pending
- app/admin/_components/OverviewStats.tsx — owned by Agent 14 — pending
- app/admin/_components/RevenueSignals.tsx — owned by Agent 14 — pending
- app/admin/_components/PlanDistributionChart.tsx — owned by Agent 14 — pending
- app/admin/_components/ScanEngineHealth.tsx — owned by Agent 14 — pending
- app/admin/_components/RecentSignups.tsx — owned by Agent 14 — pending
- app/admin/_components/TopDomains.tsx — owned by Agent 14 — pending
- app/admin/_components/AiUsageStats.tsx — owned by Agent 14 — pending
- app/admin/_components/FixFeedbackSummary.tsx — owned by Agent 14 — pending
- app/admin/_components/EmailSequenceStats.tsx — owned by Agent 14 — pending
- app/admin/_components/ErrorLog.tsx — owned by Agent 14 — pending
- convex/admin.ts — owned by Agent 14 — pending
- app/changelog/page.tsx — owned by Agent 14 — pending
- app/changelog/feed.xml/route.ts — owned by Agent 14 — pending
- next-sitemap.config.js — owned by Agent 14 — pending
- public/llms.txt — owned by Agent 14 — pending
- public/og-image.png — owned by Agent 14 — pending
- app/api/og/route.tsx — owned by Agent 14 — pending

---

## Convex functions registry
Every Convex function created must be logged here so 
agents can call them without guessing names.

Format:
- api.file.functionName — type (mutation/query/action) 
  — what it does — created by Agent N

Functions:
1. `scans:createScan` (mutation): Validates user plan limits, inserts queued scan, increments `scansThisMonth`, schedules `runScanAction`. Created by Agent 2.
2. `scans:runScanAction` (action): Updates scan to scanning, fetches URL server-side (15s timeout via AbortController), loads cheerio, runs all checks, calculates scores, writes to `scanResults`, updates `scans.status` to complete (or error on failure). Created by Agent 2.
3. `scanMutations:updateScanStatus` (internalMutation): Called by `runScanAction` to update status. Created by Agent 2.
4. `scanMutations:saveScanResults` (internalMutation): Called by `runScanAction` to insert array of results and update overall/pillar scores. Created by Agent 2.
5. `scanQueries:getScanResults` (query): Retrieves a scan and its associated `scanResults`. Created by Agent 2.
6. `scans:getFullScanForExport` (query): Used internally by the Next.js API route to fetch all data for PDF generation. Created by Agent 6.
7. `scans:generatePublicLink` (mutation): Generates and stores nanoid token on a scan. Created by Agent 6.
8. `scans:revokePublicLink` (mutation): Nullifies the public token on a scan. Created by Agent 6.
9. `scans:getScanByPublicToken` (query): Non-auth query for the public shareable report. Created by Agent 6.
10. `users:getByClerkId` (query): Used by API routes and layout to fetch user info. Created by Agent 1.
11. `monitoring:runWeeklyScans` (action/mutation): Loops active watchedSites and sequences `runScanAction` for each; runs under cron. Created by Agent 5.
12. `scanQueries:getUserScans` (query): Returns all scans for the authenticated user ordered by createdAt desc. Created by Agent 2.
13. `users:resetMonthlyScanCounts` (internalMutation): Resets scansThisMonth to 0 for all free users, called by monthly cron. Created by Agent 1.
14. `watchedSites:toggleWatchSite` (mutation): Adds or deactivates a watched site for the user. Created by Agent 5.
15. `watchedSites:getWatchedSites` (query): Returns all active watched sites for the user. Created by Agent 5.
16. `aiTools:generateMetaTags` (action): Anthropic API call for SEO titles/descriptions. Created by Agent 8.
17. `aiTools:generateAltText` (action): Anthropic API call for image alt text via URL or base64. Created by Agent 8.
18. `chat:sendChatMessage` (action): Claude context-aware scan chat. Created by Agent 11.
19. `scanQueries:getScanHistory` (query): Get past 30 scans for chart plotting. Created by Agent 10.
20. `comparisons:createComparison` (mutation): Initiates parallel scans for A/B view. Created by Agent 12.
21. `users:deleteAccount` (mutation): GDPR data deletion. Created by Agent 13.
22. `fixFeedback:submit` (mutation): Submit helpfulness feedback. Created by Agent 13.
23. `emails:scheduleOnboardingSequence` (internalAction): Schedules 5-step email drip after a user's first scan. Called by createScan when scans.length === 1. Created by Agent 14.
24. `emails:sendScheduledEmails` (internalAction): Hourly cron — queries due emailSequence rows, sends each via Resend, marks as sent. Created by Agent 14.
25. `emailMutations:getDueEmails` (internalQuery): Returns emailSequence rows where scheduledFor is before now and status is "scheduled". Created by Agent 14.
26. `emailMutations:markEmailSent` (internalMutation): Updates a single emailSequence row to status "sent" and sets sentAt to current timestamp. Created by Agent 14.
27. `emailMutations:unsubscribeUser` (mutation): Sets all pending emailSequence rows for a userId to status "unsubscribed". Called by unsubscribe route handler. Created by Agent 14.
28. `emailMutations:insertEmailStep` (internalMutation): Inserts a single emailSequence row with userId, email, step number, and scheduledFor timestamp. Created by Agent 14.
29. `admin:getOverviewStats` (query): Returns total users, scans today, scans this week, active Pro users. Admin-only — verified server-side against ADMIN_USER_IDS env var. Created by Agent 14.
30. `users:syncPlanFromClerk` (mutation): Reads Clerk user metadata and updates the plan field in the users table to match. Created by Agent 4.
31. `sitemapGenerator:generateSitemap` (internalAction): Crawls a URL up to 3 levels deep using cheerio, max 200 pages. Writes progress to sitemapJobs table in real time. Created by Agent 10.
32. `comparisons:getComparison` (query): Returns a comparison record with both scan IDs and their full results. Created by Agent 12.
33. `aiTools:checkAndIncrementMetaUsage` (internalMutation): Checks aiUsage for the current month. Throws ConvexError("AI_LIMIT_REACHED") if at plan limit. Increments metaTagsUsed if under limit. Created by Agent 8.
34. `aiTools:checkAndIncrementAltUsage` (internalMutation): Same pattern as above for altTextsUsed. Created by Agent 8.
35. `aiTools:checkAndIncrementChatUsage` (internalMutation): Same pattern as above for chatMessagesUsed. Created by Agent 11.
36. `users:getOrCreateUser` (mutation): Called on every sign-in via Clerk. Gets user by clerkId index. Creates new user record if not found with plan "free" and scansThisMonth 0. Returns the user. Created by Agent 1.
37. `users:getCurrentUser` (query): Returns the full user record for the authenticated user. Used by tools layout for plan gating. Created by Agent 9.
38. `users:deleteAccount` (mutation): GDPR deletion. Deletes all scanResults, scans, watchedSites, aiUsage, comparisons, apiKeys, emailSequence, and finally the users record for the authenticated user. Created by Agent 13.
39. `fixFeedback:submitFeedback` (mutation): Inserts a fixFeedback row with checkName, platform, helpful boolean, and optional comment. Created by Agent 11.
40. `monitoring:sendWeeklyDigest` (internalAction): Queries all Starter/Pro users with watched sites. Builds a digest of score changes and top issues. Sends via Resend. Created by Agent 5.
41. `users:resetMonthlyScanCounts` (internalMutation): Resets scansThisMonth to 0 for all free users. Called by monthly cron. Created by Agent 1.
42. `users:createFromClerk` (internalMutation): ALWAYS checks for an existing record first. Only inserts if missing, patch if exists. Avoids race condition. Triggered by Clerk event user.created. Created by Agent 1.
43. `users:updateFromClerk` (internalMutation): Updates user email. Triggered by Clerk event user.updated. Created by Agent 1.
44. `users:deleteFromClerk` (internalMutation): Deletes user and all data. Triggered by Clerk event user.deleted. Created by Agent 1.
45. `users:syncPlanFromWebhook` (internalMutation): Maps Clerk plan slug to SiteFix plan. Triggered by subscription events. Created by Agent 4.
46. `users:invalidateApiKeys` (internalMutation): Nullifies active API keys on downgrade. Created by Agent 12.
47. `http:clerkUsersWebhook` (httpAction): Receives Clerk user and billing webhook events. Verifies svix signature. Routes to internal mutations based on event type. Created by Agent 1.

---

## Inter-agent messages
Agents use this section to leave specific notes for the 
next agent. Always write to the NEXT agent directly.

---
Message from Agent 1 → Agent 2:
Agent 1 here. I've laid the groundwork. Clerk auth is active, the strict CSP is in middleware, and Convex is wired up with a full 10-table schema. The webhook handler in `convex/http.ts` takes care of user syncing with idempotent logic. Next.js 15, React 19, and Tailwind are installed with the exact design tokens. Over to you to build the core scanning engine in `convex/scans.ts` and ensure zero client-side external fetches.

---
Message from Agent 2 → Agent 3:
Agent 2 here. I've built the core Scan Engine in `convex/scans.ts` along with the mutations in `scanMutations.ts` and queries in `scanQueries.ts`. The HTML cheerio fetch runs seamlessly on the "use node" container, strictly isolated from standard DB logic. The 49+ exact check metrics from `SCAN_CHECKS.md` are generating now. Over to you to build the beautiful interactive UI results page.

---
Message from Agent 3 → Agent 4:
Agent 3 here. I've completed the Results UI! The Dashboard now features a scan submission form and previous scan history. The dynamic scan results page uses `ScoreRing`, `PillarCard`, and `IssueCard` to visualize exactly what Agent 2's backend produces. I also implemented `UpgradeModal` to plan-gate the issue cards on the free plan (blur effect applies to issue > 5). Over to you!

---
Message from Agent 4 → Agent 5:
Agent 4 here. I've completed the Settings & Billing page! The user can now view their current plan and click an external link to their Billing Portal. Clerk subscription webhooks sync their plan to the Convex users table in real time via the `syncPlanFromWebhook` mutation. The "Logo Upload" feature is properly plan-gated to Pro users only using a direct trigger for the `UpgradeModal`. Over to you to tackle the monitoring and cron jobs!

---
Message from Agent 5 → Agent 6:
Agent 5 here. Watch Site toggle is fully wired — the watch button on every scan results page checks plan (free → UpgradeModal, starter/pro → Convex mutation). The `watchedSites` table is populated by `toggleWatchSite`. Cron jobs in `crons.ts` run weekly scans via `monitoring.runWeeklyScans` (which calls `watchedSites.createBackendScan` for each active site) and a digest stub via `monitoring.sendWeeklyDigest`. Monthly scan count reset cron also registered here. Resend email sending is stubbed — Agent 14 owns the real email send logic. Over to you for PDF exports and public report sharing!

---
Message from Agent 6 → Agent 7:
Agent 6 here. PDF export and public report sharing are complete. Share button on results page generates a nanoid token, saves it to the `publicToken` field on the scan, and copies `/report/[token]` to the clipboard. Revoke button nullifies the token. `/report/[token]` is a public unauthenticated page that renders the full scan using `ShareableReport`. PDF download hits `/api/export-pdf/[scanId]` (internal route, Pro-gated), generates a real PDF via `@react-pdf/renderer` with score ring, pillar grid, and issue list. Non-Pro users see the UpgradeModal instead. Over to you for image conversion!

---
Message from Agent 7 → Agent 8:
Agent 7 here. Image converter is done. Drop zone at `/dashboard/tools/image-converter` accepts any image type, enforces 10MB per-file limit client-side AND server-side, converts to WebP via sharp (quality 82), shows savings %, supports single download and "Download all as ZIP" via jszip. Plan gating: free users get 5 files/batch (shows UpgradeModal), starter 20, pro 50. The API route is at `/api/tools/convert` (POST, form-data, `files[]`). Sharp runs in Node.js route handler — never in Convex. Over to you for AI meta tag writer and alt text generator!

---
Message from Agent 8 → Agent 9:
Agent 8 here. Both the Meta Tag Writer and Alt Text Generator are fully operational. I've implemented a robust usage tracking system in `convex/aiUsage.ts` that enforces monthly limits based on the user's plan (Free users are completely locked out of AI tools). The tools use Anthropic's Claude 3.5 Haiku model via `convex/aiTools.ts` (Node runtime). The UI includes real-time character counters with color coding, one-click copy buttons, and URL/Upload modes for alt text. All gates pass. Over to you for legal docs and final polish!

---
Message from Agent 9 → Agent 10:
[Agent 9 fills this in when done]

---
Message from Agent 10 → Agent 11:
[Agent 10 fills this in when done]

---
Message from Agent 11 → Agent 12:
[Agent 11 fills this in when done]

---
---
Message from Agent 12 → Agent 13:
[Agent 12 fills this in when done]

---
Message from Agent 13 → Agent 14:
[Agent 13 fills this in when done]

---
Message from Agent 14 → maintainer:
[Agent 14 fills this in when done]

---

## What is broken right now
If any agent leaves something incomplete or broken, 
log it here clearly so the next agent fixes it first.

Format:
- [Agent N] [what is broken] [file/function affected]

Broken items:
- none yet

---

## TypeScript errors log
Any TS error that was tricky to fix gets logged here.

Format:
- [Agent N] Error: [the error message]
  Fix: [what resolved it]

TS errors resolved:
- none yet

---

## Known gotchas — must read before writing any code

1. ClerkProvider goes inside <body> not wrapping <html>
2. auth() is async — always await it
3. Convex Action timeout: 8s per fetch, max 20 links 
   for broken link check, parallel fetches with 
   Promise.allSettled
4. cheerio: use import * as cheerio or named import, 
   never default import
5. "use node" files cannot import from non-node 
   Convex files — split into separate files
6. internalAction/internalMutation for scan logic, 
   public mutation only for createScan
7. Next.js 15 params are a Promise — always await params
8. Convex JWT issuer must be manually configured in 
   Convex dashboard — Agent 1 does this
9. All env vars must be manually added to Vercel — 
   .env.local is not read by Vercel
10. @react-pdf/renderer needs --legacy-peer-deps flag
11. scansThisMonth needs a monthly cron reset
12. Always normalise URL before fetching in scan engine
13. Blur card content only, not the overlay CTA
14. sharp optionalDependencies: When deploying to Vercel, sharp needs @img/sharp-linux-x64 in optionalDependencies in package.json or the image converter will fail silently in production.
15. emails.ts must use "use node": The Resend SDK requires Node.js runtime. convex/emails.ts must have "use node" at the top just like scans.ts.
16. Admin route protection: /admin must be protected in middleware.ts using ADMIN_USER_IDS env var checked server-side. Never check admin status client-side. If ADMIN_USER_IDS is missing from env, /admin must redirect to /dashboard not crash.
17. emailSequence unsubscribe: Every email sent via Resend must include an unsubscribe link pointing to /api/unsubscribe?userId=[clerkId]. This is legally required under CAN-SPAM and GDPR.
18. OG image route runtime: app/api/og/route.tsx must have export const runtime = "edge" at the top. Without this Next.js runs it in Node.js runtime and ImageResponse may not render correctly.
19. next-sitemap postbuild: next-sitemap runs as a postbuild script. It requires NEXT_PUBLIC_SITE_URL to be set in the environment at build time on Vercel, not just at runtime. Add it to Vercel build environment variables, not just runtime.
20. Convex "emails" file naming: convex/emails.ts uses "use node" and calls Resend. It cannot import from any other Convex file that does NOT have "use node". Put all email-related mutations and queries that don't need Node (getDueEmails, markEmailSent, insertEmailStep, unsubscribeUser) in a separate convex/emailMutations.ts without "use node".
21. Clerk webhook URL uses .convex.site domain not .convex.cloud. The HTTP router in convex/http.ts is served from your-deployment.convex.site — this is different from the .convex.cloud URL used for the Convex client. Using the wrong domain means webhooks silently never arrive.
22. Webhook handler must be idempotent. Clerk retries failed webhooks. createFromClerk checks if user exists before inserting. syncPlanFromWebhook uses patch not insert. Never assume an event fires exactly once.
23. svix package is required for Clerk webhook signature verification. Without it anyone can POST fake events to your webhook endpoint. Never skip signature verification even in development.
24. CLERK_WEBHOOK_SECRET is different from CLERK_SECRET_KEY. It is found in the Clerk Dashboard under Webhooks → your endpoint → Signing Secret. It starts with "whsec_".
25. API keys must be invalidated when a user downgrades. This is handled by the Clerk billing webhook subscription.canceled/deleted handler calling invalidateApiKeys. Do not rely on checking plan at request time alone — the key must be deactivated at the source so it fails fast.
26. serverExternalPackages is required for sharp and cheerio in Next.js 15. Without it Next.js tries to bundle them and fails because they have native bindings or are not ESM compatible. Both must be in serverExternalPackages in next.config.ts.
27. withSentryConfig wraps the entire nextConfig object. If Agent 1 creates next.config.ts without this wrapper, Agent 13's Sentry setup will require modifying the file. Do it correctly from the start.
28. The www redirect in next.config.ts requires the NEXT_PUBLIC_SITE_URL to not include www. If your Vercel domain is www.sitefix.com the redirect will loop. Set your Vercel primary domain to sitefix.com without www.
29. Clerk CSP contentSecurityPolicy option in clerkMiddleware injects the correct CSP headers automatically. enforceForDevEnv: false means it runs in report-only mode locally so development is not blocked. Set to true only after verifying no CSP violations in production Sentry.
30. The Clerk CSP option requires @clerk/nextjs version 6.14.0 or higher. The plan already uses ^7.0.0 so this is satisfied. Do not downgrade.
31. Tools layout uses sessionStorage and a custom window event "showUpgradeModal" to trigger the UpgradeModal from a Link component. Agent 3 must add this window event listener to the dashboard layout when building the UpgradeModal.
32. The tools sidebar nav uses sticky positioning and a top offset. Do not hardcode 64px in multiple places — create a CSS variable --navbar-height in globals.css and use it for the layout sizing.
33. There are TWO Convex URLs. NEXT_PUBLIC_CONVEX_URL ends in .convex.cloud — used by the React client and server-side fetchQuery. NEXT_PUBLIC_CONVEX_SITE_URL ends in .convex.site — used for HTTP actions like the Clerk webhook. They are different deployments of the same project. Both are found in the Convex Dashboard under Settings → URL & Deploy Key. The Clerk webhook endpoint URL must use .convex.site or Clerk webhooks will never arrive.
34. The Vercel build command MUST be `npx convex deploy --cmd 'npm run build'` not just `npm run build`. Using the default command means Convex functions are never pushed to the production deployment. The app loads but every useQuery and useMutation silently fails. This is the most common Convex + Vercel failure.
35. CONVEX_DEPLOY_KEY is a secret key that must be added to Vercel environment variables to allow the build command to deploy Convex functions. It must NEVER be prefixed with NEXT_PUBLIC_. Generate it in Convex Dashboard → Settings → URL & Deploy Key → Generate Production Deploy Key. A separate key must be generated for preview deployments if you use Vercel preview branches.
36. getOrCreateUser (called by client on sign-in) and createFromClerk (called by Clerk webhook) both create user records. Both MUST check for an existing record before inserting. Both MUST be idempotent. Convex mutations are transactional but two separate mutations can both pass the "does not exist" check before either commits if they run concurrently. The safe pattern is: check → insert if missing → patch if exists. Never assume only one will run.
37. convex/emails.ts has "use node" for Resend. convex/emailMutations.ts has NO "use node" for database operations. emails.ts calls mutations via ctx.runMutation(internal.emailMutations.X). Never merge them into one file. Never call Resend from emailMutations.ts. Never do ctx.db operations directly in emails.ts — always via runMutation.

---

## SiteFix Design Brief — Demo D: Illustrated & Alive

This is the highest priority document for all UI work. Every agent that touches any UI component, page, or layout must read this entire brief first.

### Fonts
Heading / display: **Outfit**, weights 300 400 500 600 700 800 (Letter spacing: -0.04em on >= 24px)
Body: **Outfit**, weight 400 (Line height 1.7 for p, 1.3 for UI labels. Muted text: rgba(238,234,248,0.38))
Monospace: **JetBrains Mono**, weight 400 500
Import: `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap`

### Color system
- Page bg: #0c0c14
- Card surface: #131220
- Elevated surface: #16152a
- Hover surface: #1a1830
- Deep inset: #0e0d1c
- Default border: rgba(255,255,255,0.05)
- Subtle border: rgba(255,255,255,0.07)
- Active border: rgba(124,106,255,0.25)
- Text Primary: #eeeaf8
- Text Secondary: rgba(238,234,248,0.55)
- Purple (primary): #7c6aff
- Purple light: #a89dff
- Green (success / score >= 80): #6ee7b7
- Amber (warning / score 60-79): #f59e0b
- Red (critical / score < 60): #f87171
- Blue (info): #60a5fa

### Border radius system
- Page-level cards: 20px
- Section cards: 14px
- Inner elements: 10px
- Buttons / chips: 8px
- Badges / pills: 999px
- Step number circles: 50%
- Tiny elements: 6px
- Never use below 6px.

### The illustration system
Every issue type has a dedicated animated SVG illustration. (36x36px icon, 100x100px expanded panel).
Colors: Backgrounds (#1e1c35, #13122a, #0e0d1c, #2d2a52), Strokes (severity color), Accents (#7c6aff, #a89dff).
Required animations (at least 2 per illustration): scan-beam, blink, float, draw-in path, pop-in, pulse ring, slow spin, bounce. Wrap in `@media (prefers-reduced-motion: no-preference)`.

*Specific illustrations required for SEO, Security, Performance, Accessibility, Technical, and Mobile.* (See original brief for detailed illustration specs).

### Component specifications
- Logo: sitefix (site in #eeeaf8, fix in #7c6aff, Outfit 800 18px).
- URL chip: green dot #6ee7b7 with box-shadow.
- Score ring: SVG circle, 1.3s animation on mount.
- Pillar cards: #131220 default, 22x22 SVG animated icons.
- Issue cards: collapsed/expanded states, platform tabs, step numbers, severity badges.
- Hero card: 20px radius, illustration panel vs text panel.

### Animation CSS
Add keyframes for `scan-beam`, `blink`, `float`, `spin-slow`, `pulse-ring`, `pop-in`, `check-draw`, `bounce-x`, `bar-in`, `dash-in` to globals.css. Wrap in `prefers-reduced-motion: reduce`.

### Quality Bar
- Pages feel alive (>=3 elements animating).
- Every issue card has an illustration (placeholder or real).
- Score rings and pillar bars animate on mount.
- All fonts are Outfit.
- Colors and border-radii exactly match spec.
- Purple accent applied correctly.
- Hover feels responsive.
- Mobile layout works at 375px.

---

## New packages added in Stages 7-12
- sharp@latest — image conversion — Stage 7
- jszip@latest — client-side ZIP — Stage 7
- @anthropic-ai/sdk@latest — Claude API — Stage 8
- recharts@latest — score charts — Stage 10
- cssnano@latest — CSS minification — Stage 10
- terser@latest — JS minification — Stage 10
- @sentry/nextjs@latest, @sentry/node@latest — Error monitoring — Stage 13
- @upstash/ratelimit@latest, @upstash/redis@latest — Rate limiting — Stage 13
- @consent-manager/core@latest — Cookie consent — Stage 13
- next-sitemap@latest — Sitemap generation — Stage 14

## New API routes (Next.js Route Handlers)
- POST /api/tools/convert — image conversion (sharp)
- POST /api/tools/minify — CSS/JS minification
- GET /api/v1/scan — REST API trigger scan
- GET /api/v1/scan/:scanId — REST API get results
- GET /api/v1/sites — REST API list sites

## New Convex files
- convex/aiTools.ts — "use node" — Claude API calls
- convex/chat.ts — "use node" — chat messages
- convex/sitemapGenerator.ts — sitemap crawl action
- convex/emails.ts — "use node" — email sequence sending
- convex/emailMutations.ts — no "use node" — email data mutations
- convex/watchedSites.ts — no "use node" — watch site mutations/queries
- convex/admin.ts — no "use node" — admin dashboard queries

## Important: sharp cannot run in Convex
Sharp requires native Node.js bindings and CANNOT
run in the Convex Action runtime. Always use the
Next.js Route Handler at /api/tools/convert instead.
The Convex "no external fetch" rule does NOT apply
to sharp because it processes uploaded files, not
external URLs. This is a documented exception.

## Important: Claude API in Convex Actions only
ANTHROPIC_API_KEY is only available in the Convex
runtime environment, not in Next.js components.
All calls to @anthropic-ai/sdk go in convex/aiTools.ts
or convex/chat.ts — never in /app or /components.

## Cron jobs registry
All cron jobs registered in convex/crons.ts:

- "weekly site monitoring"
Schedule: Sunday 08:00 UTC
Function: internal.monitoring.runWeeklyScans
Created by: Agent 5

- "weekly digest"
Schedule: Monday 09:00 UTC
Function: internal.monitoring.sendWeeklyDigest
Created by: Agent 5

- "reset monthly scan counts"
Schedule: 1st of month 00:00 UTC
Function: internal.users.resetMonthlyScanCounts
Created by: Agent 1

- "send scheduled emails"
Schedule: hourly at :00
Function: internal.emails.sendScheduledEmails
Created by: Agent 14

## Reusable components registry
Components that must be reused — never duplicated:

- components/ScoreRing.tsx
Props: score (number), size? (number, default 88)
Used by: results page hero, PDF export, public report
Created by: Agent 3

- components/PillarCard.tsx
Props: pillar (string), score (number), active (boolean), onClick (() => void)
Used by: results page, competitor comparison
Created by: Agent 3

- components/IssueCard.tsx
Props: issue (ScanResult), isBlurred (boolean), onUpgradeClick (() => void)
Used by: results page, public report page
Created by: Agent 3

- components/UpgradeModal.tsx
Props: open (boolean), onClose (() => void), trigger ("scan-limit" | "blurred-issue" | "watch-site" | "export-pdf" | "competitor" | "chat" | "sitemap")
Used by: every agent that needs plan gating
Created by: Agent 3

- components/FixFeedback.tsx
Props: checkName (string), platform (string)
Used by: IssueCard expanded state
Created by: Agent 11

---

## QA Status

| Agent | Passes | Status    | Last updated |
|-------|--------|-----------|--------------|
| 1     | 1      | passed    | 2026-03-16   |
| 2     | 1      | passed    | 2026-03-15   |
| 3     | 1      | passed    | 2026-03-17   |
| 4     | 1      | passed    | 2026-03-17   |
| 5     | 1      | passed    | 2026-03-17   |
| 6     | 1      | passed    | 2026-03-17   |
| 7     | 1      | passed    | 2026-03-17   |
| 8     | 1      | passed    | 2026-03-17   |
| 9     | -      | pending   | -            |
| 10    | -      | pending   | -            |
| 11    | -      | pending   | -            |
| 12    | -      | pending   | -            |
| 13    | -      | pending   | -            |
| 14    | -      | pending   | -            |

Status key:
pending   = build agent not yet complete
in-review = QA agent currently running
failed    = QA found issues, build agent fixing
passed    = QA signed off, next agent cleared
