# SiteFix Convex Functions Registry

# Read this before creating any new Convex function.

# If the function you need is listed here, USE IT.

# Never create a duplicate with a different name.

---

## How to use this file

Before writing any Convex function:

1. Check if it already exists in this registry
2. If yes: use the exact name listed — do not rename
3. If no: add it here when you create it
4. Never create two functions that do the same thing

---

## Naming convention

Files: camelCase (scanMutations.ts)
Functions: camelCase (createScan)
Called as: api.fileName.functionName
internal.fileName.functionName

---

## convex/schema.ts — tables

users — one record per Clerk user
scans — one record per scan job
scanResults — one record per check per scan
watchedSites — sites being monitored weekly
aiUsage — AI API usage per user per month
comparisons — competitor comparison pairs
sitemapJobs — sitemap generation progress
apiKeys — REST API keys for Pro users
fixFeedback — thumbs up/down on fix guides
emailSequence — onboarding email drip rows

---

## convex/users.ts

getOrCreateUser mutation — called on sign-in
creates user if not exists
getByClerkId query — fetch user by clerkId
getCurrentUser query — fetch current auth user
updatePlan mutation — update plan field
syncPlanFromWebhook internalMutation — called by webhook
createFromClerk internalMutation — called by webhook
updateFromClerk internalMutation — called by webhook
deleteFromClerk internalMutation — called by webhook
invalidateApiKeys internalMutation — on plan downgrade
resetMonthlyScanCounts internalMutation — monthly cron
deleteAccount mutation — GDPR user-initiated delete

---

## convex/scans.ts ("use node")

runScanAction internalAction — main scan engine

---

## convex/scanMutations.ts

createScan mutation — public, called by client
updateScanStatus internalMutation
saveScanResults internalMutation

---

## convex/scanQueries.ts

getScanResults query — scan + results by scanId
getUserScans query — all scans for auth user
getScanHistory query — last 30 scans for a URL
getFullScanForExport query — for PDF generation
getScanByPublicToken query — no auth, public reports
getScanWithResults internalQuery — used by chat action

---

## convex/watchedSites.ts

toggleWatchSite mutation — add or deactivate
getWatchedSites query — user's watched sites

---

## convex/monitoring.ts

runWeeklyScans internalAction — weekly cron
sendWeeklyDigest internalAction — Monday digest

---

## convex/crons.ts

Registers all 4 crons:

1. weekly site monitoring — Sunday 08:00 UTC
2. weekly digest — Monday 09:00 UTC
3. reset monthly counts — 1st of month 00:00 UTC
4. send scheduled emails — hourly :00

---

## convex/aiTools.ts ("use node")

generateMetaTags action — Claude API
generateAltText action — Claude vision
checkAndIncrementMetaUsage internalMutation
checkAndIncrementAltUsage internalMutation
checkAndIncrementChatUsage internalMutation

---

## convex/chat.ts ("use node")

sendChatMessage action — context-aware scan chat

---

## convex/sitemapGenerator.ts

generateSitemap internalAction — crawl + write job

---

## convex/comparisons.ts

createComparison mutation — trigger two scans
getComparison query — both scans + results

---

## convex/emails.ts ("use node")

scheduleOnboardingSequence internalAction
sendScheduledEmails internalAction

---

## convex/emailMutations.ts (no "use node")

insertEmailStep internalMutation
getDueEmails internalQuery
markEmailSent internalMutation
unsubscribeUser mutation

---

## convex/admin.ts (no "use node")

getOverviewStats query
getRecentScans query
getRecentUsers query
getTopDomains query
getAiUsageStats query
getFixFeedback query
getEmailStats query
getRecentErrors query

---

## convex/http.ts

clerkUsersWebhook httpAction — POST /clerk-users-webhook

---

## convex/fixFeedback.ts

submitFeedback mutation — submit helpful/not helpful

---

## ⚠️ "use node" isolation rules

Files WITH "use node":
convex/scans.ts
convex/aiTools.ts
convex/chat.ts
convex/emails.ts

Files WITHOUT "use node" (all others):
convex/scanMutations.ts
convex/scanQueries.ts
convex/users.ts
convex/watchedSites.ts
convex/monitoring.ts
convex/emailMutations.ts
convex/admin.ts
convex/comparisons.ts
convex/fixFeedback.ts
convex/http.ts
convex/crons.ts

A "use node" file CANNOT import from a non-node file.
A "use node" file calls other functions via:
ctx.runMutation(internal.fileName.functionName, args)
ctx.runQuery(internal.fileName.functionName, args)
Never use direct imports between node/non-node files.

---

## Complete schema (copy exactly — never modify)

[paste the complete final convex/schema.ts here
after corrections are applied]
