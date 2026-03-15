# SiteFix — Agent Reference File Instructions
# Every agent reads this before writing any code

## The 4 reference files and when to read them

These files exist at the project root. Every agent
must read the relevant ones before starting work.
Reading them is not optional. Do not skip this step.

---

## STEP 1 — Before writing any code at all

Every agent without exception reads these two files
first:

READ: AGENT_MEMORY.md
Why: Contains all decisions made by previous agents,
all packages installed with exact versions, all
Convex functions that already exist, all known
gotchas, and the message left specifically for you
by the previous agent. Starting without reading this
is how agents break things that already work.

READ: DONE_MEANS_DONE.md
Why: Contains your specific definition of done.
Find your agent number in the file and read your
checklist. This is the only definition of done
that counts. Your own judgment of "it works" is
not sufficient.

---

## STEP 2 — Before writing any Convex function

READ: CONVEX_REGISTRY.md
Why: Contains every Convex function that exists
or will exist in the project. Before creating any
new function check this file first.

Rules:
- If the function you need is listed — use that
  exact name. Do not create a new one.
- If it is not listed — create it and immediately
  add it to the registry section in AGENT_MEMORY.md
  and note it in your inter-agent message.
- Never create two functions that do the same thing.
- Never rename an existing function.
- The "use node" isolation rules in this file are
  hard rules — follow them exactly.

---

## STEP 3 — Before writing any UI component

READ: DESIGN_TOKENS.md
Why: Contains every exact color value, font spec,
spacing measurement, animation keyframe, component
measurement, and the design quality checklist.

Rules:
- Every color used must come from this file.
  Never approximate. #0c0c14 is not "basically black".
  #131220 is not "dark gray". Use the exact values.
- Every component measurement must match this file.
  Score ring stroke-width is 5. Not 4. Not 6. 5.
  Badges are border-radius 999px. Not 12px. Not 20px.
- Run the design quality checklist at the bottom of
  this file before marking UI work complete.
- If you are unsure about any visual decision —
  the answer is in this file. Do not guess.

---

## STEP 4 — Before writing the scan engine
## (Agent 2 only — also relevant for Agent 11)

READ: SCAN_CHECKS.md
Why: Contains every exact checkName string used
throughout the entire codebase. The scan engine,
impact predictor, illustration system, and feedback
widget all key off these exact strings.

Rules:
- Every check stored in scanResults must use a
  checkName from this file exactly as written.
  Hyphenated lowercase only. No variations.
- lib/impactScores.ts must have an entry for every
  single checkName in this file. Check the impact
  scores table at the bottom of SCAN_CHECKS.md and
  copy it exactly.
- If a new check is needed that is not in the file —
  add it to SCAN_CHECKS.md first, then implement it.
  Never implement a check with a name that is not
  in the registry.

---

## How to read the files

Use the view tool to read each file:

To read AGENT_MEMORY.md:
view AGENT_MEMORY.md

To read DONE_MEANS_DONE.md:
view DONE_MEANS_DONE.md

To read CONVEX_REGISTRY.md:
view CONVEX_REGISTRY.md

To read DESIGN_TOKENS.md:
view DESIGN_TOKENS.md

To read SCAN_CHECKS.md:
view SCAN_CHECKS.md

Read the full content of each file before proceeding.
Do not skim. Do not summarise and move on.
The details in these files are why the build stays
consistent across 14 agents.

---

## When to update the files

### AGENT_MEMORY.md — update during and after your work
- Add packages immediately when installed
- Add Convex functions immediately when created
- Add files immediately when created
- Log problems and solutions as they happen
- Write inter-agent message when work is complete
- Update QA status table when QA passes

### CONVEX_REGISTRY.md — update when you create a function
- Add every new Convex function to the registry
- Include: file, function name, type, purpose
- Mark "use node" files clearly

### SCAN_CHECKS.md — update only if adding a new check
- Add the exact checkName string
- Add the impact score entry
- Note which agent added it

### DESIGN_TOKENS.md — do not modify
- This file is read-only for all agents
- If a design decision needs updating, flag it
  in AGENT_MEMORY.md and wait for instruction
- Never change color values, measurements, or
  animation specs without explicit instruction

### DONE_MEANS_DONE.md — do not modify
- This file is read-only for all agents
- It defines the standard — agents meet it,
  not the other way around

---

## The reading order for each agent

### Agent 1
1. AGENT_MEMORY.md (read gotchas 1-37)
2. DONE_MEANS_DONE.md (read Agent 1 checklist)
3. DESIGN_TOKENS.md (read everything)
4. CONVEX_REGISTRY.md (read schema + all functions)

### Agent 2
1. AGENT_MEMORY.md (read message from Agent 1)
2. DONE_MEANS_DONE.md (read Agent 2 checklist)
3. CONVEX_REGISTRY.md (read before any function)
4. SCAN_CHECKS.md (read everything — critical)

### Agent 3
1. AGENT_MEMORY.md (read message from Agent 2)
2. DONE_MEANS_DONE.md (read Agent 3 checklist)
3. DESIGN_TOKENS.md (read everything)
4. CONVEX_REGISTRY.md (read queries section)
5. SCAN_CHECKS.md (read checkName list)

### Agent 4
1. AGENT_MEMORY.md (read message from Agent 3)
2. DONE_MEANS_DONE.md (read Agent 4 checklist)
3. CONVEX_REGISTRY.md (read users.ts section)

### Agent 5
1. AGENT_MEMORY.md (read message from Agent 4)
2. DONE_MEANS_DONE.md (read Agent 5 checklist)
3. CONVEX_REGISTRY.md (read monitoring + crons)

### Agent 6
1. AGENT_MEMORY.md (read message from Agent 5)
2. DONE_MEANS_DONE.md (read Agent 6 checklist)
3. CONVEX_REGISTRY.md (read scanQueries section)
4. DESIGN_TOKENS.md (read component specs)

### Agent 7
1. AGENT_MEMORY.md (read message from Agent 6)
2. DONE_MEANS_DONE.md (read Agent 7 checklist)
3. DESIGN_TOKENS.md (read component specs)

### Agent 8
1. AGENT_MEMORY.md (read message from Agent 7)
2. DONE_MEANS_DONE.md (read Agent 8 checklist)
3. CONVEX_REGISTRY.md (read aiTools section)
4. DESIGN_TOKENS.md (read component specs)

### Agent 9
1. AGENT_MEMORY.md (read message from Agent 8)
2. DONE_MEANS_DONE.md (read Agent 9 checklist)
3. DESIGN_TOKENS.md (read everything)
4. CONVEX_REGISTRY.md (read users section for getCurrentUser)

### Agent 10
1. AGENT_MEMORY.md (read message from Agent 9)
2. DONE_MEANS_DONE.md (read Agent 10 checklist)
3. CONVEX_REGISTRY.md (read sitemapGenerator + scanQueries)
4. DESIGN_TOKENS.md (read component specs)

### Agent 11
1. AGENT_MEMORY.md (read message from Agent 10)
2. DONE_MEANS_DONE.md (read Agent 11 checklist)
3. CONVEX_REGISTRY.md (read chat + aiTools sections)
4. SCAN_CHECKS.md (read everything — critical for impact predictor)
5. DESIGN_TOKENS.md (read component specs)

### Agent 12
1. AGENT_MEMORY.md (read message from Agent 11)
2. DONE_MEANS_DONE.md (read Agent 12 checklist)
3. CONVEX_REGISTRY.md (read comparisons + users sections)
4. DESIGN_TOKENS.md (read component specs)

### Agent 13
1. AGENT_MEMORY.md (read message from Agent 12)
2. DONE_MEANS_DONE.md (read Agent 13 checklist)
3. DESIGN_TOKENS.md (read upgrade modal spec)

### Agent 14
1. AGENT_MEMORY.md (read message from Agent 13)
2. DONE_MEANS_DONE.md (read Agent 14 checklist)
3. CONVEX_REGISTRY.md (read emails + emailMutations)
4. DESIGN_TOKENS.md (read component specs)

---

## QA agents — reading order

Every QA agent reads:
1. AGENT_MEMORY.md — check QA status table
2. DONE_MEANS_DONE.md — find the agent N checklist
   This is the primary source for what to test
3. The QA report from the previous pass if it exists
   (QA_REPORT_AGENT_N.md)

QA agents for UI work also read:
4. DESIGN_TOKENS.md — use this to verify every
   color, font, measurement, and animation

QA agent for Agent 2 also reads:
4. SCAN_CHECKS.md — verify every checkName in
   scanResults matches the registry exactly

---

## What happens if an agent skips a file

If an agent skips AGENT_MEMORY.md:
It will reinstall packages that already exist,
create Convex functions with wrong names, and
miss critical gotchas that caused previous agents
to fail.

If an agent skips DONE_MEANS_DONE.md:
It will self-certify work that is incomplete and
pass broken code to the next agent.

If a UI agent skips DESIGN_TOKENS.md:
It will produce generic shadcn styling that
looks nothing like Demo D and requires a full
UI rebuild.

If Agent 2 skips SCAN_CHECKS.md:
It will invent checkName strings that break the
impact predictor, feedback widget, and illustration
system in every subsequent agent.

---

## One rule above all others

Read the files. Then build.
Never build then read.
The 5 minutes spent reading is why the build
does not break halfway through.
