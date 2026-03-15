# SiteFix Implementation Plan

## 1. Folder & File Structure
- `/`
  - `AGENT_MEMORY.md`
  - `README.md`
  - `package.json`
  - `tsconfig.json`
  - `tailwind.config.ts`
  - `next.config.ts`
  - `middleware.ts`
  - `postcss.config.mjs`
  - `next-sitemap.config.js`
  - `components.json`
  - `/public`
    - `llms.txt`
    - `og-image.png`
  - `.env.local`
  - `.env.example`
  - `sentry.client.config.ts`
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`
  - `instrumentation.ts`
  - `/app`
    - `layout.tsx`
    - `page.tsx` (Landing Page)
    - `error.tsx`
    - `globals.css`
    - `/privacy`
      - `page.tsx`
    - `/terms`
      - `page.tsx`
    - `/changelog`
      - `page.tsx`
      - `/feed.xml`
        - `route.ts`
    - `/admin`
      - `page.tsx`
      - `/_components`
        - `AdminHeader.tsx`
        - `OverviewStats.tsx`
        - `RevenueSignals.tsx`
        - `PlanDistributionChart.tsx`
        - `ScanEngineHealth.tsx`
        - `RecentSignups.tsx`
        - `TopDomains.tsx`
        - `AiUsageStats.tsx`
        - `FixFeedbackSummary.tsx`
        - `EmailSequenceStats.tsx`
        - `ErrorLog.tsx`
    - `/sign-in`
      - `/[[...sign-in]]`
        - `page.tsx`
    - `/sign-up`
      - `/[[...sign-up]]`
        - `page.tsx`
    - `/dashboard`
      - `layout.tsx`
      - `page.tsx`
      - `error.tsx`
      - `/scan`
        - `/[scanId]`
          - `page.tsx`
          - `error.tsx`
      - `/settings`
        - `page.tsx`
      - `/tools`
        - `error.tsx`
    - `/report`
      - `/[token]`
        - `page.tsx`
        - `error.tsx`
    - `/api`
      - `/tools`
        - `/convert`
          - `route.ts`
        - `/minify`
          - `route.ts`
      - `/export`
        - `/[scanId]`
          - `route.ts`
      - `/tools`
        - `layout.tsx`
        - `error.tsx`
        - `/image-converter`
          - `page.tsx`
          - `loading.tsx`
        - `/meta-tag-writer`
          - `page.tsx`
          - `loading.tsx`
        - `/alt-text-generator`
          - `page.tsx`
          - `loading.tsx`
        - `/security-headers`
          - `page.tsx`
          - `loading.tsx`
        - `/robots-txt`
          - `page.tsx`
          - `loading.tsx`
        - `/open-graph`
          - `page.tsx`
          - `loading.tsx`
        - `/sitemap-generator`
          - `page.tsx`
          - `loading.tsx`
        - `/minifier`
          - `page.tsx`
          - `loading.tsx`
        - `/competitor`
          - `page.tsx`
          - `loading.tsx`
      - `layout.tsx`
      - `/og`
        - `route.tsx`
      - `/unsubscribe`
        - `route.ts`
      - `/v1`
        - `/scan`
          - `route.ts`
          - `/[scanId]`
            - `route.ts`
        - `/sites`
          - `route.ts`
      - `/user`
        - `/export`
          - `route.ts`
  - `/components`
    - `/ui` (shadcn components: button, dialog, collapsible, progress, skeleton, sonner/toast, etc.)
    - `/pdf`
      - `ScanReportPDF.tsx`
    - `Navbar.tsx`
    - `Footer.tsx`
    - `CookieBanner.tsx`
    - `UpgradeModal.tsx`
    - `OnboardingChecklist.tsx`
    - `FixFeedback.tsx`
    - `ScoreRing.tsx`
    - `PillarCard.tsx`
    - `IssueCard.tsx`
  - `/lib`
    - `utils.ts`
    - `impactScores.ts`
    - `ratelimit.ts`
  - `/convex`
    - `schema.ts`
    - `scans.ts` ("use node" — Action only)
    - `scanMutations.ts` (no "use node" — mutations)
    - `scanQueries.ts` (no "use node" — queries)
    - `users.ts`
    - `crons.ts`
    - `monitoring.ts`
    - `aiTools.ts` ("use node" — Claude API calls)
    - `chat.ts` ("use node" — ask SiteFix chat)
    - `sitemapGenerator.ts`
    - `comparisons.ts`
    - `emails.ts`
    - `emailMutations.ts` (no "use node" — email data mutations)
    - `watchedSites.ts`
    - `admin.ts`
    - `http.ts`

## 2. convex/schema.ts
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro")
    ),
    scansThisMonth: v.number(),
    customLogoUrl: v.optional(v.string()),
    slackWebhookUrl: v.optional(v.string()),
    firstScanAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  scans: defineTable({
    userId: v.string(),
    url: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("scanning"),
      v.literal("complete"),
      v.literal("error")
    ),
    overallScore: v.optional(v.number()),
    pillarScores: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
    publicToken: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user_id", ["userId"])
    .index("by_public_token", ["publicToken"]),

  scanResults: defineTable({
    scanId: v.id("scans"),
    pillar: v.string(),
    checkName: v.string(),
    status: v.union(
      v.literal("pass"),
      v.literal("warn"),
      v.literal("fail")
    ),
    impact: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    plainEnglishDescription: v.string(),
    fixGuide: v.any(),
    rawValue: v.string(),
  }).index("by_scan_id", ["scanId"]),

  watchedSites: defineTable({
    userId: v.string(),
    url: v.string(),
    lastScore: v.number(),
    lastScannedAt: v.number(),
    active: v.boolean(),
  }).index("by_user_id", ["userId"])
    .index("by_active", ["active"]),

  aiUsage: defineTable({
    userId: v.string(),
    metaTagsUsed: v.number(),
    altTextsUsed: v.number(),
    chatMessagesUsed: v.number(),
    month: v.string(), // "2026-03" format
  }).index("by_user_month", ["userId", "month"]),

  comparisons: defineTable({
    userId: v.string(),
    urlA: v.string(),
    urlB: v.string(),
    scanIdA: v.id("scans"),
    scanIdB: v.id("scans"),
    createdAt: v.number(),
  }).index("by_user_id", ["userId"]),

  sitemapJobs: defineTable({
    userId: v.string(),
    url: v.string(),
    status: v.union(v.literal("running"), v.literal("complete"), v.literal("error")),
    pagesFound: v.number(),
    urls: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_user_id", ["userId"]),

  apiKeys: defineTable({
    userId: v.string(),
    keyHash: v.string(),
    name: v.string(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    active: v.boolean(),
  }).index("by_key_hash", ["keyHash"])
    .index("by_user_id", ["userId"]),

  fixFeedback: defineTable({
    checkName: v.string(),
    platform: v.string(),
    helpful: v.boolean(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_check_name", ["checkName"]),

  emailSequence: defineTable({
    userId: v.string(),
    email: v.string(),
    step: v.number(),
    scheduledFor: v.number(),
    sentAt: v.optional(v.number()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("sent"),
      v.literal("skipped"),
      v.literal("unsubscribed")
    ),
  }).index("by_user_id", ["userId"])
    .index("by_scheduled", ["scheduledFor"]),
});
```

## 3. Convex Functions
1. `scans:createScan` (mutation): Validates user plan limits, inserts queued scan, increments `scansThisMonth`, schedules `runScanAction`.
2. `scans:runScanAction` (action): Updates scan to scanning, fetches URL server-side (15s timeout via AbortController), loads cheerio, runs all checks, calculates scores, writes to `scanResults`, updates `scans.status` to complete (or error on failure).
3. `scans:updateScanStatus` (mutation): Called by `runScanAction` to update status.
4. `scans:saveScanResults` (mutation): Called by `runScanAction` to insert array of results and update overall/pillar scores.
5. `scans:getScanResults` (query): Retrieves a scan and its associated `scanResults`.
6. `scans:getFullScanForExport` (query): Used internally by the Next.js API route to fetch all data for PDF generation.
7. `scans:generatePublicLink` (mutation): Generates and stores nanoid token on a scan.
8. `scans:revokePublicLink` (mutation): Nullifies the public token on a scan.
9. `scans:getScanByPublicToken` (query): Non-auth query for the public shareable report.
10. `users:getByClerkId` (query): Used by API routes and layout to fetch user info.
11. `monitoring:runWeeklyScans` (action/mutation): Loops active watchedSites and sequences `runScanAction` for each; runs under cron.
12. `scans:getUserScans` (query): Returns all scans for the authenticated user ordered by createdAt desc
13. `users:resetMonthlyScanCounts` (internalMutation): Resets scansThisMonth to 0 for all free users, called by monthly cron
14. `watchedSites:toggleWatchSite` (mutation): Adds or deactivates a watched site for the user
15. `watchedSites:getWatchedSites` (query): Returns all active watched sites for the user
16. `aiTools:generateMetaTags` (action): Anthropic API call for SEO titles/descriptions.
17. `aiTools:generateAltText` (action): Anthropic API call for image alt text via URL or base64.
18. `chat:sendChatMessage` (action): Claude context-aware scan chat.
19. `scanQueries:getScanHistory` (query): Get past 30 scans for chart plotting.
20. `comparisons:createComparison` (mutation): Initiates parallel scans for A/B view.
21. `users:deleteAccount` (mutation): GDPR data deletion.
22. `fixFeedback:submit` (mutation): Submit helpfulness feedback.
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
37. `users:deleteAccount` (mutation): GDPR deletion. Deletes all scanResults, scans, watchedSites, aiUsage, comparisons, apiKeys, emailSequence, and finally the users record for the authenticated user. Created by Agent 13.
38. `fixFeedback:submitFeedback` (mutation): Inserts a fixFeedback row with checkName, platform, helpful boolean, and optional comment. Created by Agent 11.
39. `monitoring:sendWeeklyDigest` (internalAction): Queries all Starter/Pro users with watched sites. Builds a digest of score changes and top issues. Sends via Resend. Created by Agent 5.
40. `users:resetMonthlyScanCounts` (internalMutation): Resets scansThisMonth to 0 for all free users. Called by monthly cron. Created by Agent 1/2.
41. `users:createFromClerk` (internalMutation): ALWAYS checks for an existing record first. Only inserts if missing, patch if exists. Avoids race condition with getOrCreateUser. Triggered by Clerk event user.created. Created by Agent 1.
42. `users:updateFromClerk` (internalMutation): Updates user email. Triggered by Clerk event user.updated. Created by Agent 1.
43. `users:deleteFromClerk` (internalMutation): Deletes user and all data. Triggered by Clerk event user.deleted. Created by Agent 1.
44. `users:syncPlanFromWebhook` (internalMutation): Maps Clerk plan slug to SiteFix plan. Triggered by subscription events. Created by Agent 4.
45. `users:invalidateApiKeys` (internalMutation): Nullifies active API keys on downgrade. Created by Agent 12.
46. `http:clerkUsersWebhook` (httpAction): Receives Clerk user and billing webhook events. Verifies svix signature. Routes to internal mutations based on event type. Created by Agent 1.

## 4. Next.js Pages and Routes
- `/`: Public Landing Page
- `/sign-in/[[...sign-in]]`: Public Sign-In (Clerk)
- `/sign-up/[[...sign-up]]`: Public Sign-Up (Clerk)
- `/dashboard`: Protected. Lists user's scans, Watch Site toggles, New Scan trigger.
- `/dashboard/scan/[scanId]`: Protected. Scan results, scoring circles, pillar breakdown, fix queue.
- `/dashboard/settings`: Protected. Pro users can set customLogoUrl. Plan upgrade links.
- `/dashboard/tools/*`: Protected. Tools including `/image-converter`, `/meta-tag-writer`, `/alt-text-generator`, `/security-headers`, `/robots-txt`, `/open-graph`, `/sitemap-generator`, `/minifier`, `/competitor`. Tools redirect based on plan gating.
- `/admin`: Protected by middleware (ADMIN_USER_IDS). Internal dashboard.
- `/changelog`: Public. Revisions and updates.
- `/report/[token]`: Public. Shareable view of a scan. Fix steps restricted past step 1.
- `GET /api/export/[scanId]` — Pro only, returns PDF buffer
- `POST /api/tools/convert` — Image conversion via sharp.
- `POST /api/tools/minify` — JS/CSS minification via terser/cssnano.
- `GET /api/og` — Dynamic Open Graph image generation using @vercel/og. Returns 1200x630 PNG. No auth required. Created by Agent 14.
- `GET /api/unsubscribe?userId=[id]` — Marks all pending emailSequence rows as unsubscribed for the given userId. Returns HTML confirmation page. No auth required — links are in emails. Created by Agent 14.
- `GET /api/v1/scan`, `GET /api/v1/scan/[scanId]`, `GET /api/v1/sites` — Pro REST API (x-api-key).
- `GET /api/user/export` — GDPR data export. Requires Clerk auth. Fetches all user data from Convex and returns as JSON download. Created by Agent 13.
- `GET /changelog/feed.xml` — RSS 2.0 feed of changelog entries. Static content. Returns application/xml. Created by Agent 14.

## 5. Third-Party NPM Packages
- `next@15.0.0`
- `react@19.0.0`
- `react-dom@19.0.0`
- `convex@^1.13.0`
- NOTE: ConvexProviderWithClerk is imported from "convex/react-clerk" — this is an export path of the convex package, not a separate install.
- `@clerk/nextjs@^7.0.0`
- `cheerio@^1.0.0`
- `resend@^3.5.0`
- `@react-pdf/renderer@^3.4.4`
- `nanoid@^5.0.0`
- `tailwindcss@^3.4.0`
- `lucide-react@^0.400.0` 
- `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge` (shadcn deps)
- `sharp@latest` (Image conversion — use optionalDependencies for Linux binary)
- `jszip@latest` (Client-side zip)
- `@anthropic-ai/sdk@latest` (Claude)
- `recharts@latest` (Score charts)
- `cssnano@latest` (CSS minification)
- `terser@latest` (JS minification)
- `@sentry/nextjs@latest`, `@sentry/node@latest` (Error monitoring)
- `@upstash/ratelimit@latest`, `@upstash/redis@latest` (Rate limiting)
- `@consent-manager/core@latest` (Cookie consent)
- `next-sitemap@latest` (Sitemap & robots generation)
- `svix@latest` (Clerk webhook signature verification)

## 6. .env.example
```
NEXT_PUBLIC_CONVEX_URL=your_convex_url
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
CONVEX_DEPLOY_KEY=your_convex_deploy_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
NEXT_PUBLIC_APP_NAME=SiteFix
NEXT_PUBLIC_SITE_URL=https://sitefix.com
NEXT_PUBLIC_APP_NAME=SiteFix
NEXT_PUBLIC_SITE_URL=https://sitefix.com
ADMIN_USER_IDS=clerk_id_1,clerk_id_2
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
SENTRY_ORG=your_sentry_org_slug
SENTRY_PROJECT=your_sentry_project_slug
```

## 7. Step-by-Step Build Order
1. **Init Next.js**: Create the Next 15 App router project with Tailwind.
2. **Setup Dependencies**: Install Convex, Clerk, Resend, Cheerio, Nanoid, React-PDF, and shadcn/ui.
3. **Configure Providers**: Add Clerk and Convex providers to `layout.tsx`, setup `middleware.ts`, and configure environment variables.
4. **Implement Design System**: Update `globals.css` with the provided shadcn CSS variable overrides and Tailwind colors/fonts.
5. **Convex Schema & Auth Sync**: Create `convex/schema.ts`, implement clerk webhook or login sync to maintain the `users` table.
6. **Core UI/Landing**: Build the landing page (`/`), Hero, and Pricing sections.
7. **Dashboard Skeleton**: Create `/dashboard`, new scan dialog.
8. **Scan Engine Foundation**: Implement `scans.createScan` and `scans.runScanAction` with Cheerio fetching + timer.
9. **Implement Checks**: Hardcode the logic for SEO, Security, Performance, Accessibility, Technical, and Mobile checks over Cheerio HTML in `scans:runScanAction`.
10. **Results Page**: Create `/dashboard/scan/[scanId]` with animated score rings, issue list, and shadcn Collapsibles.
11. **Plan Constraints & Upgrades**: Enforce Clerk billing tier limits in mutations and UI (blurred issues, lock icons).
12. **Monitoring**: Create `watchedSites` and set up Convex cron jobs + Resend drops for score decreases.
13. **PDF & Sharing**: Add the PDF API Route Handler and the public `/report/[token]` routes for sharing mechanics.
14. **Final Verifications**: End-to-end testing against definition of done.

## 8. Agent Orchestration instructions (14 Build Agents + QA Agents)

The build process is orchestrated across 14 sequential agents. Each agent must pass its definition of done and `tsc --noEmit` before the next begins.

**Crucial QA Agent System**: Every build agent is followed by a QA Agent. The QA Agent runs universal checks (TypeScript, dependencies, `fetch` locations, `console.log`, `any` types) and stage-specific runtime/design checks. The QA Agent writes to `QA_REPORT_AGENT_[N].md`, and the build agent must fix all issues and be re-evaluated until a "PASS" verdict is achieved. No agent hands off to the next stage without QA Agent sign-off recorded in `AGENT_MEMORY.md`.

408: 1. **Agent 1 — Foundation**: Convex schema, Clerk auth, middleware, providers, layout, design system, landing page, sign-in/sign-up pages, empty dashboard shell. Create README.md (with instructions for Convex `.convex.site` URL discovery). Create convex/http.ts for Clerk webhook. Create `next.config.ts` (with sentry wrapper, security headers, and external packages). Update `middleware.ts` with Clerk CSP integration. QA: Verify svix signature, verify README.md setup steps exist.
409: 2. **Agent 2 — Scan engine**: `convex/scans.ts` full action, all 30+ checks, score calculation, `createScan` mutation, error handling, cheerio parsing. Zero client-side external fetches.
410: 3. **Agent 3 — Dashboard + results UI**: `app/dashboard/page.tsx`, `app/dashboard/scan/[scanId]/page.tsx`, upgrade modal, loading skeletons, issue expanding/collapsing, free plan gating UI.
411: 4. **Agent 4 — Plan gating + billing**: Clerk billing integration, settings page, active plan enforcement, custom logo upload, `syncPlanFromClerk` mutation, plan webhooks.
412: 5. **Agent 5 — Monitoring + email alerts**: `convex/monitoring.ts`, `convex/crons.ts`, watch toggle UI, Resend email template, weekly cron job.
413: 6. **Agent 6 — PDF export + public reports**: `app/api/export/[scanId]/route.ts`, PDF component, `/report/[token]` routes, `generatePublicLink` / `revokePublicLink` mutations.
414: 7. **Agent 7 — Image Converter**: `sharp` integration in Next.js Server Route, drag-drop UI, `jszip` client bundling. Plan limit enforcement.
415: 8. **Agent 8 — AI Meta & Alt Generators**: `@anthropic-ai/sdk` via Convex Actions `convex/aiTools.ts`, UI forms, usage limits.
416: 9. **Agent 9 — Template Tools**: Security headers, Open Graph, and robots.txt generators. Add `loading.tsx` to all 9 individual tool pages. Create `app/dashboard/tools/layout.tsx` for tool navigation and plan gating logic. QA: Check that all tool pages show a skeleton while loading without a blank white flash. Verify tools sidebar renders correctly and locked tools open upgrade modal.
417: 10. **Agent 10 — Charts & Crawlers**: Recharts score history, sitemap generator (with real-time Convex subscriptions), CSS/JS minifiers.
418: 11. **Agent 11 — Ask SiteFix & Mentoring**: Context-aware Claude Chat (`convex/chat.ts`), `impactScores.ts` predictor on UI cards.
419: 12. **Agent 12 — Pro Power Features**: Competitor A/B comparison screens, Weekly Slack digest, Pro-only REST API with API Key management. QA: API keys are properly invalidated on plan downgrade.
13. **Agent 13 — Production Readiness**: Sentry error boundaries, Upstash rate limiters, GDPR privacy/terms/export/deletion, Onboarding widgets.
14. **Agent 14 — Launch Readiness**: SEO metadata, Open Graph dynamic images, `next-sitemap`, `llms.txt`, Email onboarding sequence (Resend + Convex crons), Admin dashboard, and Changelog with RSS.

## 9. Known Gotchas (Must Read Before Authoring)

1. **ClerkProvider**: Goes inside `<body>`, not wrapping `<html>`.
2. **Async Auth/Params**: `auth()` and dynamic route params (`params`) are async in Next.js 15 — always `await` them.
3. **Convex Action limit**: 8s AbortController timeout per fetch, max 20 internal links for broken link checking, parallel fetches with `Promise.allSettled`.
4. **Cheerio**: Use `import * as cheerio`, do not use default import.
5. **Convex "use node" isolation**: Files with "use node" cannot import from non-node Convex files. Keep actions in `scans.ts` and mutations in `scanMutations.ts`.
6. **Public vs Internal Functions**: Use `internalAction`/`internalMutation` for scan logic; expose only `createScan` as public.
7. **Convex JWT Issuer**: Must be manually added to Convex settings via Clerk frontend API URL.
8. **Vercel deployment**: `.env.local` is ignored. Must manually add all env vars to the Vercel project, including the production Convex URL.
9. **React PDF**: Install with `--legacy-peer-deps` due to React 19 conflicts.
10. **Plan resets**: Added monthly cron to reset `scansThisMonth` for free users.
11. **URL Normalisation**: Engine must normalize URLs (e.g., prefix `https://`) before fetching.
12. **Card Blurring**: Blur the content div only, not the entire interactive card.
14. **sharp optionalDependencies**: When deploying to Vercel, sharp needs `@img/sharp-linux-x64` in `optionalDependencies` in package.json or the image converter will fail silently in production.
15. **emails.ts must use "use node"**: The Resend SDK requires Node.js runtime. `convex/emails.ts` must have "use node" at the top just like `scans.ts`.
16. **Admin route protection**: `/admin` must be protected in `middleware.ts` using `ADMIN_USER_IDS` env var checked server-side. Never check admin status client-side. If `ADMIN_USER_IDS` is missing from env, `/admin` must redirect to `/dashboard` not crash.
17. **emailSequence unsubscribe**: Every email sent via Resend must include an unsubscribe link pointing to `/api/unsubscribe?userId=[clerkId]`. This is legally required under CAN-SPAM and GDPR.
18. **OG image route runtime**: `app/api/og/route.tsx` must have `export const runtime = "edge"` at the top. Without this Next.js runs it in Node.js runtime and ImageResponse may not render correctly.
19. **next-sitemap postbuild**: `next-sitemap` runs as a postbuild script. It requires `NEXT_PUBLIC_SITE_URL` to be set in the environment at build time on Vercel, not just at runtime. Add it to Vercel build environment variables, not just runtime.
20. **Convex "emails" file naming**: `convex/emails.ts` uses "use node" and calls Resend. It cannot import from any other Convex file that does NOT have "use node". Put all email-related mutations and queries that don't need Node (`getDueEmails`, `markEmailSent`, `insertEmailStep`, `unsubscribeUser`) in a separate `convex/emailMutations.ts` without "use node".
21. **Convex JWT issuer dashboard setup**: Clerk webhook URL uses .convex.site domain not .convex.cloud. The HTTP router in convex/http.ts is served from your-deployment.convex.site. Using the wrong domain means webhooks silently never arrive.
22. **Webhook idempotency**: Webhook handler must be idempotent. Clerk retries failed webhooks. createFromClerk checks if user exists before inserting. syncPlanFromWebhook uses patch not insert. Never assume an event fires exactly once.
23. **svix is mandatory**: svix package is required for Clerk webhook signature verification. Without it anyone can POST fake events to your webhook endpoint. Never skip signature verification even in development.
24. **Webhook Secret**: CLERK_WEBHOOK_SECRET is different from CLERK_SECRET_KEY. It is found in the Clerk Dashboard under Webhooks → your endpoint → Signing Secret. It starts with "whsec_".
25. **API keys invalidation**: API keys must be invalidated when a user downgrades. This is handled by the Clerk billing webhook subscription.canceled/deleted handler calling invalidateApiKeys. Do not rely on checking plan at request time alone — the key must be deactivated at the source so it fails fast.
26. **serverExternalPackages**: Required for `sharp` and `cheerio` in Next.js 15. Provide `serverExternalPackages: ["sharp", "cheerio"]` in `next.config.ts`.
27. **withSentryConfig**: Wraps the entire `nextConfig` object in `next.config.ts`.
28. **www redirect limit**: The www redirect in `next.config.ts` requires the `NEXT_PUBLIC_SITE_URL` to NOT include www.
29. **Clerk CSP**: `contentSecurityPolicy` inside `clerkMiddleware` (since version 6.14.0) injects the correct CSP headers automatically.
30. **Clerk CMS dependency**: This CSP option requires `@clerk/nextjs` >= 6.14.0, which the project uses. Do not downgrade.
31. **UpgradeModal Trigger**: Tools layout uses `sessionStorage` and a custom window event (`showUpgradeModal`) to trigger the UpgradeModal. Agent 3 must add this event listener to the dashboard layout.
32. **Tools NavBar height padding**: The tools sidebar nav uses sticky positioning. Since navbar height may change, create a `--navbar-height` CSS variable in `globals.css` and use it for `top` offset rather than hardcoding.

## 10. Design System & Illustrations (Demo D Specification)

The UI must exactly match the "Demo D: Illustrated & Alive" design brief. **Do NOT use generic shadcn defaults.** 

Key requirements detailed in `AGENT_MEMORY.md` include:
- **Fonts**: Outfit (Headings & Body), JetBrains Mono (Code/Raw values).
- **Color System**: Dark theme based strictly on the provided hex codes (e.g., `#0c0c14` bg, `#131220` cards, `#7c6aff` primary).
- **Illustrations**: Every issue requires an animated SVG (36x36px icon and 100x100px expanded panel) with at least 2 CSS animations (scan-beam, blink, float, pulse-ring, etc.).
- **CSS Animations**: Must be defined globally and wrapped in `@media (prefers-reduced-motion: no-preference)`.
- **Quality Bar**: Before any UI agent is marked done, the page must feel alive (>= 3 animations), score rings must animate on mount, font-families must compute to Outfit, and exact border-radii must be used (e.g., no default rounded badges, use fully-rounded `999px`).

## 11. Cron Jobs Registry

```typescript
// convex/crons.ts — complete list of all cron jobs

// 1. Weekly site monitoring — every Sunday 08:00 UTC
crons.weekly(
  "weekly site monitoring",
  { dayOfWeek: "sunday", hourUTC: 8, minuteUTC: 0 },
  internal.monitoring.runWeeklyScans,
);

// 2. Weekly digest emails — every Monday 09:00 UTC  
crons.weekly(
  "weekly digest",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  internal.monitoring.sendWeeklyDigest,
);

// 3. Monthly scan count reset — 1st of month 00:00 UTC
crons.monthly(
  "reset monthly scan counts",
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.users.resetMonthlyScanCounts,
);

// 4. Hourly email sequence sender
crons.hourly(
  "send scheduled emails",
  { minuteUTC: 0 },
  internal.emails.sendScheduledEmails,
);
```

## 12. Admin Dashboard Specification (Agent 14)

The internal admin dashboard `/admin` provides visibility into users, revenue signals, system health, and AI usage.

### Routes and Protection
- Protected in `middleware.ts` via `ADMIN_USER_IDS` environment variable.
- Non-admins redirect to `/dashboard`.
- Unauthenticated users redirect to `/sign-in`.
- Metadata includes `robots: { index: false, follow: false }`.

### Components (`/app/admin/_components/`)
- **AdminHeader.tsx**: Top bar with refresh capability.
- **OverviewStats.tsx**: Grid of 6 stats (Total Users, Scans Today, Scans Week, Active Pro, Active Starter, Free Users).
- **RevenueSignals.tsx**: Estimated MRR, ARR, and free-to-paid conversion rate.
- **PlanDistributionChart.tsx**: `use client` Recharts BarChart for user plan distribution.
- **ScanEngineHealth.tsx**: Table of the last 100 scans, highlighting errors.
- **RecentSignups.tsx**: Table of the latest 50 users (emails masked e.g. `j***@gmail.com`).
- **TopDomains.tsx**: Which domains are actively scanned the most (unique users, avg score).
- **AiUsageStats.tsx**: Usage and estimated API cost limits via Anthropic API.
- **FixFeedbackSummary.tsx**: Aggregated helpful/not helpful votes from `fixFeedback`.
- **EmailSequenceStats.tsx**: Performance of the 5-step email onboarding.
- **ErrorLog.tsx**: The latest 50 error scans for rapid debugging.

All data fetching is server-side via `fetchQuery` on convex endpoints. No raw user PII or convex queries are exposed the client.
