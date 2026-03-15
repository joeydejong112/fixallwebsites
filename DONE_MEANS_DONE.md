# SiteFix — What "Done" Actually Means

# Read this before marking any work complete.

# "It compiles" is not done.

# "It mostly works" is not done.

# This file defines done.

---

## The minimum bar for every single agent

Before marking anything done, ALL of these must pass:

### Code quality

[ ] tsc --noEmit returns zero errors — zero warnings
[ ] grep -r "console.log" app/ components/ convex/
returns zero results
[ ] grep -r ": any" app/ components/ convex/
returns zero results outside permitted exceptions
(permitted exceptions: fixGuide, pillarScores)
[ ] grep -r "fetch(" app/ components/
returns zero results pointing to external URLs
(internal /api/ routes are allowed)
[ ] No hardcoded API keys or secrets anywhere
[ ] All new env vars are in .env.example

### Design quality

[ ] Background color on any page is #0c0c14
Check: open DevTools → body background-color
[ ] Font on any text element is Outfit
Check: DevTools → computed → font-family
[ ] No white, gray, or light backgrounds anywhere
[ ] All badges are fully rounded (border-radius 999px)
[ ] Purple #7c6aff appears on active states

### Functionality

[ ] The feature actually works end to end
Not "the component renders"
Not "the function exists"
The complete user journey works
[ ] Error states are handled and show friendly messages
[ ] Loading states are present (skeletons or spinners)
[ ] Empty states are handled (not blank screens)

### Mobile

[ ] Page layout works at 375px viewport width
Check: DevTools → device toolbar → 375px
[ ] No horizontal overflow at 375px
[ ] All buttons and inputs are tappable (min 44px)

### AGENT_MEMORY.md

[ ] File ownership map updated with every new file
[ ] Convex functions registry updated with new functions
[ ] Package versions updated if new packages installed
[ ] Inter-agent message written for next agent
[ ] Any problems encountered logged with solutions

---

## Done means done for each stage

### Agent 1 is done when:

[ ] localhost:3000 loads the landing page
[ ] Landing page has hero, pillar icons, pricing
[ ] Syne/Outfit font loads (not system font)
[ ] Dark theme applied everywhere
[ ] Sign up with a real email works
[ ] Redirects to /dashboard after signup
[ ] /dashboard without auth redirects to /sign-in
[ ] Convex dashboard shows 4 tables
[ ] User record created in Convex after signup
[ ] convex/http.ts exists with webhook handler
[ ] README.md exists with setup instructions

### Agent 2 is done when:

[ ] Submit https://example.com via Convex function runner
[ ] Scan reaches "complete" status within 60 seconds
[ ] scanResults table has rows in all 6 pillars
[ ] overallScore is a number between 0 and 100
[ ] pillarScores has 6 keys
[ ] Error scan: submit "https://notasite.xyz123.com"
Status must become "error" not stay "scanning"
[ ] grep /app for external fetch() = zero results

### Agent 3 is done when:

[ ] New scan created from dashboard UI
[ ] Results page loads with animated score ring
[ ] All 6 pillar cards show scores
[ ] Issue cards expand with platform tabs
[ ] Free user sees blurred cards after top 5
[ ] Blurred card click opens upgrade modal
[ ] Scan limit hit opens upgrade modal (not error)
[ ] All illustrations visible on issue cards

### Agent 4 is done when:

[ ] Settings page loads at /dashboard/settings
[ ] Current plan displayed correctly
[ ] Billing portal link present
[ ] Pro user sees logo upload option
[ ] Non-Pro sees lock on logo upload
[ ] Plan change in Clerk reflects in Convex plan field

### Agent 5 is done when:

[ ] Watch toggle saves to watchedSites
[ ] Manual cron trigger runs a scan
[ ] lastScannedAt updates after cron
[ ] Test email arrives with correct content
[ ] Free user clicking watch sees upgrade modal

### Agent 6 is done when:

[ ] Pro user downloads real PDF from results page
[ ] Non-Pro clicking PDF sees upgrade modal (not 403)
[ ] Share button copies /report/[token] URL
[ ] Toast confirms copy
[ ] /report/[token] loads in incognito window
[ ] Revoking link makes URL return 404

### Agent 7 is done when:

[ ] Drop zone accepts JPG files
[ ] WebP conversion returns smaller file
[ ] "Download all as ZIP" works
[ ] Free user at limit sees upgrade modal (not 500)
[ ] File over 10MB shows clear error message

### Agent 8 is done when:

[ ] Meta tag writer returns title + description
for a real URL in under 15 seconds
[ ] Character counters show correct colors
[ ] Alt text generator works with image URL
[ ] Alt text generator works with uploaded image
[ ] Free user sees locked state on meta writer
[ ] Starter user at limit sees upgrade modal

### Agent 9 is done when:

[ ] Security headers generator produces valid nginx config
[ ] robots.txt builder generates and downloads file
[ ] OG generator live previews update as user types
[ ] Tools sidebar nav renders on all tool pages
[ ] Active tool highlighted in sidebar
[ ] Locked tools show plan badge and open modal on click
[ ] All tool pages have loading.tsx skeletons

### Agent 10 is done when:

[ ] Score history chart shows after 2+ scans same URL
[ ] Sitemap generator crawls and produces XML
[ ] XML file is valid (has <urlset> and <url> tags)
[ ] CSS minifier reduces a test stylesheet
[ ] JS minifier reduces a test script
[ ] Free user visiting sitemap generator sees upgrade

### Agent 11 is done when:

[ ] Chat panel opens and closes on results page
[ ] Suggested questions visible before first message
[ ] Response references actual scan issues (not generic)
[ ] Impact predictor shows on ALL expanded issue cards
[ ] Impact predictor has data for every check name
(check SCAN_CHECKS.md — every name must have entry)
[ ] Feedback widget appears below fix steps
[ ] Thumbs down shows comment field
[ ] Feedback saves to Convex fixFeedback table

### Agent 12 is done when:

[ ] Competitor compare runs two scans
[ ] Results show side-by-side scores
[ ] Gap table shows all 6 pillars with colors
[ ] API key generates in settings (Pro only)
[ ] GET /api/v1/scan with valid key returns scan ID
[ ] GET /api/v1/scan with invalid key returns 401
[ ] Plan downgrade invalidates API keys

### Agent 13 is done when:

[ ] Deliberate error reaches Sentry dashboard
[ ] Error boundary renders on all pages
[ ] 21st image conversion request returns 429
[ ] File over 10MB to converter returns 400
[ ] Privacy policy page loads at /privacy
[ ] Terms of service page loads at /terms
[ ] Cookie banner appears on first visit
[ ] Delete account wipes all Convex data
[ ] Data export downloads valid JSON

### Agent 14 is done when:

[ ] /sitemap.xml returns valid XML
[ ] /robots.txt present and blocks /dashboard
[ ] Landing page <title> tag is correct
[ ] og:image URL loads a 1200x630 image
[ ] Run SiteFix on sitefix.com — SEO score >= 85
[ ] Run SiteFix on sitefix.com — all 5 security
headers PASS (HSTS, CSP, X-Frame, X-Content,
Referrer)
[ ] Email sequence: 5 rows in emailSequence table
after first scan
[ ] Step 1 email arrives after cron trigger
[ ] /admin loads for admin user
[ ] /admin redirects for non-admin user
[ ] /changelog loads with 3+ entries
[ ] /changelog/feed.xml is valid RSS XML
[ ] Vercel build command is correct in Vercel settings
[ ] Production deployment runs scans successfully

---

## What is never "done"

These things disqualify a "done" claim instantly:

✗ "It works on my machine but hasn't been tested"
✗ "TypeScript errors exist but they're just warnings"
✗ "The feature works but loading states are missing"
✗ "The mobile layout is broken but it works on desktop"
✗ "AGENT_MEMORY.md hasn't been updated yet"
✗ "I'll fix the console.logs later"
✗ "The error just shows a blank screen but the
happy path works"

Done means the whole thing works for real users.
Not for developers who know what to click.
For a confused first-time visitor on a phone.
