# SiteFix — Resume Build

## Project context

I am building SiteFix — an all-in-one website health
scanner SaaS. This project was started in a previous
session. The full specification and build memory is
stored in the project files.

## What you must read first

Read these files in this exact order before doing
anything else:

1. AGENTS.md
   The permanent rules for this project.
   Every rule in this file applies to you.

2. AGENT_MEMORY.md
   The shared build memory. This tells you:
   - Which agent last ran and what it built
   - All Convex functions that already exist
   - All packages installed with exact versions
   - All files created and who owns them
   - Known gotchas discovered during the build
   - The QA status of each completed agent
   - The inter-agent message left for the next agent

3. DONE_MEANS_DONE.md
   Find the current agent number from AGENT_MEMORY.md
   and read that agent's done checklist.

4. QA*REPORT_AGENT*[N].md (if it exists)
   Read the most recent QA report to understand
   what was passing and what still needs fixing.

## After reading all files, tell me:

1. Which agent last completed with QA PASS
2. Which agent is currently in progress (if any)
3. What was built so far
4. What needs to be built next
5. Any open issues or broken items logged in
   AGENT_MEMORY.md under "What is broken right now"

Then wait for me to say which agent to run next.
Do not start building until I confirm.
