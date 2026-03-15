# Build Agent Workflow
# Antigravity follows these steps for every build agent.

## Step 1 — Read reference files
Read these files completely before anything else:
- AGENT_MEMORY.md
- DONE_MEANS_DONE.md (find your agent number)
- DESIGN_TOKENS.md (if building UI)
- CONVEX_REGISTRY.md (if building Convex functions)
- SCAN_CHECKS.md (if building scan engine)

## Step 2 — Read previous QA report
If QA_REPORT_AGENT_[previous].md exists: read it.
Check what was fixed and what patterns to avoid.

## Step 3 — State your understanding
Before planning, output a one-paragraph summary of:
- What the previous agent built
- What you are about to build
- Any risks or dependencies you see
- The inter-agent message left for you

Wait for confirmation before proceeding.

## Step 4 — Output a plan
Output a complete plan covering:
- Every file you will create or modify
- Every Convex function you will create
- Every package you will install
- Build order

Output the plan as a numbered list.
End with: "Awaiting approval to begin."

## Step 5 — Wait for approval
Do not write any code until you see the word
"approved" in the response.
"Looks good" is not approval.
"Go ahead" is not approval.
Only "approved" counts.

## Step 6 — Build
Build in the order specified in your plan.
After each file is created:
- Update AGENT_MEMORY.md file ownership map
After each Convex function is created:
- Update AGENT_MEMORY.md functions registry

## Step 7 — Run quality gates
Run these in order:
1. tsc --noEmit — must return zero errors
   If errors exist: fix them before continuing
2. grep -r "console.log" app/ components/ convex/
   If results exist: remove them
3. grep -r ": any" app/ convex/
   If results exist outside permitted exceptions: fix
4. grep -r "fetch(" app/ components/
   If external URLs found: move to Convex Action

## Step 8 — Self-check against DONE_MEANS_DONE.md
Open DONE_MEANS_DONE.md.
Find your agent number.
Go through every checkbox.
For each item: verify it actually works.
Not "the code is there" — that it actually works.

## Step 9 — Update AGENT_MEMORY.md
- Mark your files in ownership map
- Mark your functions in registry
- Write inter-agent message for next agent
- Update QA status to "in-review"

## Step 10 — Request QA
Output exactly:
"Build complete. Requesting QA Agent [N] review.
All quality gates passed. AGENT_MEMORY.md updated."

Then stop. Wait for QA agent to run.
