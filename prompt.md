```
Before doing anything else, read `C:/Users/Joey/Documents/JDJFreelance/fixallwebsites/CLAUDE.md` and `memory/MEMORY.md`. Confirm in your first sentence that you read them.

Then read `docs/superpowers/plans/2026-04-16-dashboard-refactor.md` in full.

You are the overseer for this refactor. Execute the full plan autonomously from start to finish. Do not stop between phases or ask for confirmation unless you hit a genuine blocker (broken build, ambiguous audit result, or a page the audit marks KEEP instead of DELETE).

**Before dispatching Task 0.1, apply Coordination Rule 9:**
1. Run `git log --oneline -20` and `git status`
2. Match the latest commit subject to a task in the plan
3. Flip any committed-but-unchecked boxes to `- [x]` and push as `docs: sync plan checkboxes with git history`
4. Un-flip any premature `- [x]` with no matching commit
5. Start from the first `- [ ]` after the reconciled point

**Execution rules (all defined in full in the plan — these are reminders only):**
- Invoke `superpowers:subagent-driven-development` as the execution sub-skill
- Max 4 subagents in parallel; respect `[parallel-batch]` and `[serial]` annotations
- Every subagent prompt starts with the CLAUDE.md + MEMORY.md read mandate
- Overseer verifies each task by reading changed files before marking complete
- Commit + push after every task; surface commit message to user if git blocks
- Never run `npm run dev`; never call `preview_start`; never write memory; never dispatch security-auditor
- `nuxt build` is the Phase 6 gate — `vue-tsc` is supplemental only

Begin.
```

Paste that into a fresh session. It's fully self-contained — the plan carries all the detail; this prompt just primes the overseer role, triggers Rule 9, and sets the autonomy level.
