# SiteFix — Agent Rules
# Antigravity reads this file automatically.
# Every agent in this project follows these rules.
# These rules override any agent default behavior.

## Identity
You are building SiteFix — an all-in-one website
health scanner SaaS. Every decision you make must
serve this goal.

## Before writing any code — mandatory reads
Read these files in this order before starting work:
1. AGENT_MEMORY.md — decisions, gotchas, functions
2. DONE_MEANS_DONE.md — your specific done criteria
3. DESIGN_TOKENS.md — if touching any UI
4. CONVEX_REGISTRY.md — if touching any Convex code
5. SCAN_CHECKS.md — if touching scan engine or checks

If any of these files does not exist yet — stop and
report this before proceeding.

## Hard rules — never break these

DATABASE: Convex only. Never install or use Prisma,
Drizzle, Supabase, PlanetScale, Firebase, SQLite,
or any other database or ORM.

AUTH: Clerk only. Never use NextAuth, Auth.js, Lucia,
Better Auth, or any other auth library.

BILLING: Clerk Billing only.

UI: shadcn/ui + Tailwind CSS only. Never use MUI,
Chakra, Mantine, Ant Design, or any other component
library.

FRAMEWORK: Next.js 15 App Router TypeScript only.
No Pages Router. No .js files. Everything .tsx or .ts.

SCAN ENGINE: All website scanning runs inside a Convex
Action only. Zero fetch() calls to external URLs
anywhere in /app or /components. After building the
scan engine run: grep -r "fetch(" app/ components/
The result must be zero external URL fetches.

TYPES: Zero `any` types. Exceptions: fixGuide field
and pillarScores field in Convex schema only.

CONSOLE: Zero console.log anywhere in the codebase.

## Code quality gates — must pass before done
- tsc --noEmit returns zero errors
- grep -r "console.log" app/ components/ convex/
  returns zero results
- grep -r ": any" app/ components/ convex/
  returns zero results (except permitted exceptions)
- grep -r "fetch(" app/ components/
  returns zero external URL fetch results
- All new env vars added to .env.example
- AGENT_MEMORY.md updated with all new files and
  functions before marking done

## Design rules — non-negotiable
- Background: #0c0c14 (never approximate)
- Cards: #131220 (never approximate)
- Font: Outfit (never Inter, Roboto, system-ui)
- Badges: border-radius 999px always
- All exact values in DESIGN_TOKENS.md

## AGENT_MEMORY.md update protocol
Update AGENT_MEMORY.md:
- Immediately when a package is installed
- Immediately when a Convex function is created
- Immediately when a file is created
- Immediately when a problem is encountered
- When work is complete: write inter-agent message
  and update QA status table

## Plan first rule
Before writing any code output a complete plan.
Wait for explicit "approved" before writing code.
"Approved" means the word approved in my reply.
Nothing else counts as approval.

## QA loop rule
When QA agent reports FAIL: fix every ISSUE-XXX
item in the QA report before self-certifying.
Never mark work done until QA agent reports PASS.
