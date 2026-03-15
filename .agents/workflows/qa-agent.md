# QA Agent Workflow
# Antigravity follows these steps for every QA agent.

## Step 1 — Read context
Read in this order:
- AGENT_MEMORY.md (check QA status table)
- DONE_MEANS_DONE.md (find agent N checklist)
- QA_REPORT_AGENT_[N].md if it exists
  (this is a re-check — note the pass number)
- DESIGN_TOKENS.md if reviewing UI work
- SCAN_CHECKS.md if reviewing Agent 2 work

## Step 2 — Run universal checks first
These run for every agent without exception:

CHECK 1 — TypeScript
Run: tsc --noEmit
Expected: zero errors
If fails: CRITICAL — stop and report immediately

CHECK 2 — Forbidden packages
Run: cat package.json | grep -E "prisma|drizzle|supabase|nextauth|auth.js|lucia|mui|chakra|mantine"
Expected: zero results
If any found: CRITICAL

CHECK 3 — External fetch location
Run: grep -rn "fetch(" app/ components/
Review each result — external URLs only
Expected: zero external URL fetches
If found: CRITICAL

CHECK 4 — Console logs
Run: grep -rn "console.log" app/ components/ convex/
Expected: zero results
If found: WARNING per occurrence

CHECK 5 — Any types
Run: grep -rn ": any" app/ components/ convex/
Expected: zero results outside fixGuide/pillarScores
If found outside permitted locations: WARNING

CHECK 6 — Environment variables
Run: grep -rn "process.env\." app/ convex/
Compare each variable against .env.example
Expected: every variable in .env.example
If missing: WARNING

CHECK 7 — AGENT_MEMORY.md completeness
Check file ownership map — new files listed?
Check functions registry — new functions listed?
Check inter-agent message — written?
If any missing: WARNING

## Step 3 — Run agent-specific checks
Open DONE_MEANS_DONE.md.
Find the checklist for Agent [N].
Go through every checkbox.
Test each item that can be tested right now.
Record PASS or FAIL for each item.

## Step 4 — Run design checks (UI agents only)
Open DESIGN_TOKENS.md.
Find the design quality checklist at the bottom.
Go through every item.
Check each in the browser using DevTools.
Record PASS or FAIL for each item.

## Step 5 — Write QA report
Create or update QA_REPORT_AGENT_[N].md:
QA Report — Agent [N] — Pass [X]
Date: [date]
Overall verdict: PASS / FAIL
Universal checks
TypeScript:        PASS / FAIL — [details]
Forbidden pkgs:    PASS / FAIL — [details]
External fetches:  PASS / FAIL — [details]
Console logs:      PASS / FAIL — [count found]
Any types:         PASS / FAIL — [count found]
Env variables:     PASS / FAIL — [missing vars]
AGENT_MEMORY:      PASS / FAIL — [what's missing]
Agent-specific checks
[list every item from DONE_MEANS_DONE.md
with PASS or FAIL and details for each]
Design checks (if applicable)
[list every item from DESIGN_TOKENS.md checklist
with PASS or FAIL]
Issues to fix
[Only if verdict is FAIL]
ISSUE-001
File: [exact filepath]
Line: [line number]
Severity: CRITICAL / WARNING / MINOR
Description: [what is wrong]
Expected: [what it should be]
Actual: [what it is]
Fix: [exact instruction]
[repeat for every issue]
Verdict
PASS — Agent [N+1] is cleared to start
or
FAIL — Build Agent [N] must fix issues above

## Step 6 — Update AGENT_MEMORY.md QA table
Find the QA Status table in AGENT_MEMORY.md.
Update Agent [N] row:
- Passes: [number of passes taken]
- Status: passed / failed
- Last updated: [date]

## Step 7 — Output verdict
End your response with exactly one of:

VERDICT: PASS
Agent [N] complete. Agent [N+1] is cleared to start.

or

VERDICT: FAIL
[N] issues found. Build Agent [N] must fix all
ISSUE-XXX items in QA_REPORT_AGENT_[N].md.
