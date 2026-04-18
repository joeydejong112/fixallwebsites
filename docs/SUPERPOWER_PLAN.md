# SuperPower Plan — ScanPulse Redesign (`ScanPulse.html` → Nuxt 4)

> **Target:** Port the single-file React design reference `ScanPulse.html` into the live Nuxt 4 application at `app/` while preserving every token, primitive, and screen composition byte-for-byte.
>
> **Driver:** MiniMax M2 (2.7) agent swarm — 1 Orchestra Agent + N specialised Sub-Agents + 1 Visual Review Agent per task.
>
> **Plugin stack:** `Everything Claude Code` plugin, `context7` (framework docs), `frontend-design` skill, `impeccable:*` skills (`adapt`, `animate`, `typeset`, `critique`, `polish`, `audit`), `superpowers:*` skills (`dispatching-parallel-agents`, `subagent-driven-development`, `writing-plans`), `plankton-code-quality`, `a11y-architect` agent, `security-reviewer` agent, `build-error-resolver` agent, Chrome extension (visual verification — per `memory/feedback_verification.md`).

---

## 0.5. Reality Snapshot (project scan, April 18)

Findings from re-scanning the repo — the Orchestra must treat these as facts before dispatching Phase A.

| Area | Current state | Consequence for plan |
|------|---------------|----------------------|
| `app/assets/css/tokens.css` | **Already exists (260 lines)**, matches HTML `<style id="tokens-css">` byte-for-byte. Untracked in git. | A1 shrinks to: *verify completeness → wire into `main.css` → commit*. |
| `app/assets/css/main.css` | Carries a **parallel (older) design system** via Tailwind `@apply bg-dark text-white font-body …`. Directly conflicts with `tokens.css` CSS-var approach. | NEW task **A0** added: reconcile `main.css` so the two systems don't stomp each other (tokens.css = source of truth; `main.css` becomes thin base + keeps Tailwind layers). |
| `tailwind.config.ts` | Colors define **only 3 pillars** (security/performance/seo). Missing `accessibility`, `ai`, `dns`, `trust`, `elevated-2`, `border-strong`, and JetBrains Mono. Shorthand `text-status-pass`/`text-status-crit` is used in `ScoreRing.vue` but **no such utility is defined** (silent-fail today). | NEW task **A1.5**: expand Tailwind theme to cover all 7 pillars + mono font + status utilities. Fix the broken `ScoreRing.vue` reference. |
| `main.css` fonts | `@import` loads **Space Grotesk 400/500/600/700 + DM Sans 400/500** only. Missing **DM Sans 600/700 + JetBrains Mono 400/500**. | A2 must list exact weights; add `rel="preload"` for the critical body weight. |
| `app/components/scanpulse/*.vue` | All 11 primitives exist but use Tailwind utility classes tied to the old token map (e.g. `text-status-pass`, `bg-dark`). | A4 must audit each for (a) HTML prop-contract parity and (b) migration off broken Tailwind utilities to CSS vars defined in `tokens.css`. |
| `app/layouts/tool.vue` | Exists (241 lines) — serves the existing `/tools/*` pages. | Keep as **interim** tool layout during migration. NEW task **B5.5**: rewrite `tool.vue` to match HTML CSP Builder shell (rail + top strip + content), **or** replace it with the new `app/layouts/app.vue` and drop. Decide at B5. |
| `app/components/dashboard/{DashboardSidebar,DashboardTopbar}.vue` | Exist; different architecture from HTML's 56px rail + 60px top strip. | These are **fully replaced** by `ShellRail.vue` + `ShellTopStrip.vue`. Do not augment. |
| `app/components/dashboard/result/*.vue` (5 files) | Exist; used by current `scan/[scanId].vue`. | Fully replaced by the B3 port of HTML Scan Result screen. Delete after B3 lands. |
| `app/components/dashboard/views/*.vue` (9 files) | Legacy multi-view dashboard. | Audit with `refactor-cleaner` at D2. Remove unreferenced. |
| `app/composables/dashboard/*.ts` (5 composables) | `useChartGeometry`, `useDashboardData`, `useDashboardView`, `useScanActions`, `useScoreFormat`. | Data-layer composables (`useDashboardData`, `useScanActions`) keep; view/chart geometry ones likely deprecated — reassess at B2. |
| `redesign/` directory | 11 files **staged for deletion** (git status `D`). | NEW task **A-1** (runs first): stage & commit the tombstones in a dedicated `chore(redesign):` commit so the working tree is clean before Phase A. |
| `ScanPulse.html` | Untracked (`??`). | **Commit it** as part of A-1 so every agent references the same checksum. |
| `docs/SUPERPOWER_PLAN.md` | Untracked. | Commit alongside `A-1` so the plan itself is versioned. |

### Verified HTML line ranges (fixed off-by-ones)

| Block | Lines |
|-------|-------|
| `<style id="fonts-css">` | **139–429** |
| `<style id="tokens-css">` | **431–694** |
| `<script id="data-jsx">` | **705–834** |
| `<script id="primitives-jsx">` | **837–1052** |
| `<script id="shell-jsx">` | **1055–1232** |
| `<script id="landing-jsx">` | **1235–2039** |
| `<script id="dashboard-jsx">` | **2042–2415** |
| `<script id="result-jsx">` | **2418–2693** |
| `<script id="tools-jsx">` | **2696–2855** |
| `<script id="csp-jsx">` | **2858–3284** |
| `<script id="mount-jsx">` | **3287–3387** |

All line-range citations elsewhere in this plan now match the above.

---

## 0. Ground Rules (read before anything)

1. **SOURCE OF TRUTH =** `ScanPulse.html` (3,435 lines). All styling, spacing, colors, radii, shadows, animations, copy and composition are authoritative. Deviation = rework.
2. **DO NOT** introduce new pillar/status colors, fonts, or radii. `DESIGN_TOKENS` block is locked.
3. **DO NOT** ship the in-browser Babel setup. Port to Vue 3 `<script setup lang="ts">` SFCs.
4. **DO NOT** run `npm run dev`, `preview_start`, or any other verification workflow. A dev server is already running on `http://localhost:3000`. The **VISUAL-REVIEWER** verifies exclusively via the **Chrome extension** (screenshot + DOM inspect) — never headless preview tools (per `memory/feedback_verification.md` + `memory/feedback_no_preview.md`).
5. **Framework constraints:** Nuxt 4 (`app/` dir), PrimeVue 4 with `theme: 'none'`, `@nuxtjs/tailwindcss`, `@clerk/nuxt`, Convex, anime.js (always dynamic-imported inside `onMounted`).
6. **No test framework is configured.** Visual regression + a11y + Lighthouse are the quality gates.
7. **File size ceiling:** 800 lines per SFC (see `.claude/rules/web/hooks.md`). Split aggressively.
8. **Never commit** `.env`, Clerk/Stripe secrets, or the in-browser Babel CDN paths.
9. **Every completed task must be committed & pushed** with a conventional-commit message (`feat(scanpulse):`, `refactor(scanpulse):`, `style(scanpulse):`, …).

---

## 1. Agent Architecture

### 1.1 Roles

| Agent | Model | Responsibility |
|-------|-------|----------------|
| **ORCHESTRA** (1) | MiniMax 2.7 Opus-tier | Breaks plan into atomic tasks, spawns sub-agents in parallel, enforces the 10-min watchdog, owns the TodoWrite list, approves cross-offs, drives git commits. |
| **PORTER** (N ≤ 4 parallel) | MiniMax 2.7 Sonnet-tier | Ports one screen/primitive at a time. JSX → Vue SFC. Consumes `ScanPulse.html` source lines for the section they own. |
| **VISUAL-REVIEWER** (1 per task) | MiniMax 2.7 Sonnet-tier | Diff-checks the rendered port against `ScanPulse.html` at 1440×900 and 375×800 viewports. Blocks merge on any pixel-level regression in tokens, spacing, type, or motion. |
| **A11Y-REVIEWER** (on demand) | MiniMax 2.7 Sonnet-tier | Runs axe-core + keyboard + reduced-motion audit on every interactive screen. |
| **SECURITY-REVIEWER** (on demand) | MiniMax 2.7 Opus-tier | Called only when a task touches auth, API keys, user input, Clerk, Convex actions, or Stripe webhooks. |
| **BUILD-GUARDIAN** (on demand) | MiniMax 2.7 Haiku-tier | Invoked when TypeScript or Nuxt build breaks. Minimal-diff fixes only. |
| **STUCK-CHECKER** (reactive) | MiniMax 2.7 Haiku-tier | Summoned by Orchestra after the 10-min watchdog fires. Inspects git log + running shell + local file state to decide: `stuck` / `done-but-unreported` / `in-progress`. |

### 1.2 Skills each agent must load

- **Everything Claude Code** plugin baseline — for all agents.
- **PORTER** → `impeccable:adapt`, `impeccable:animate`, `impeccable:typeset`, `frontend-design:frontend-design`, `superpowers:subagent-driven-development`, `context7` for Nuxt/Vue/PrimeVue/Tailwind lookups.
- **VISUAL-REVIEWER** → `impeccable:critique`, `impeccable:polish`, `frontend-design`, **Chrome extension** for screenshots + live DOM inspection + computed-style reads. No `preview_*`, no headless browser. Side-by-side compare: ScanPulse.html (opened as local file) vs. `http://localhost:3000/<route>`.
- **A11Y-REVIEWER** → `a11y-architect` agent, `impeccable:audit`.
- **SECURITY-REVIEWER** → `security-reviewer` agent, `security-scan` skill, `aidefence_scan`.
- **ORCHESTRA** → `superpowers:dispatching-parallel-agents`, `superpowers:writing-plans`, `claude-flow` swarm tools (`swarm_init`, `agent_spawn`, `task_orchestrate`), `reasoningbank-agentdb` for pattern recall across tasks.
- **BUILD-GUARDIAN** → `build-error-resolver` agent, `build-fix` skill.

### 1.3 Orchestra workflow (per task)

```
1.  ORCHESTRA picks next unblocked task from TodoWrite.
2.  Stores "task started" timestamp in agentdb_hierarchical-store (key = task.id).
3.  Spawns PORTER with: task spec, HTML line-range, skill list, acceptance criteria.
4.  Starts 10-min watchdog (record `startedAt` in agentdb; poll on each orchestrator tick — no external scheduler needed).
5.  If PORTER returns within 10 min:
      a. Spawn VISUAL-REVIEWER (+ A11Y-REVIEWER if UI interactive)
         (+ SECURITY-REVIEWER if task touches sensitive surface).
      b. If all reviewers PASS → cross off task, commit+push.
      c. If any FAIL → loop back to PORTER with exact feedback (max 3 iterations).
6.  If 10-min watchdog fires:
      a. ORCHESTRA summons STUCK-CHECKER.
      b. STUCK-CHECKER inspects:
           - running tool output (TaskOutput)
           - git status + git log
           - existence & mtime of target files
           - agentdb pattern-search for recent progress signals
      c. Returns verdict:
           - "done-but-unreported" → ORCHESTRA runs review pipeline anyway.
           - "in-progress"          → extend by 5 min, re-arm watchdog.
           - "stuck"                → cancel PORTER (task_cancel),
                                      spawn BUILD-GUARDIAN for diagnosis,
                                      then re-spawn PORTER with stuck notes.
7.  Repeat.
```

### 1.4 Parallelism rules

- **All independent PORTER tasks** must be dispatched in a single message (per `superpowers:dispatching-parallel-agents`).
- **Review agents** run in parallel with each other, never with the PORTER they review.
- **Max 4 parallel PORTERs** (matches CLAUDE.md `maxAgents` tight-coordination guidance).
- **Shared memory namespace** for the swarm: `scanpulse-redesign`.

---

## 2. Target File Map

### 2.1 Design tokens (global)

| Source | Destination |
|--------|-------------|
| `ScanPulse.html` `<style id="tokens-css">` lines 431–694 | `app/assets/css/tokens.css` (NEW) |
| `<style id="fonts-css">` lines 139–429 | Drop (replace with `nuxt.config.ts` Google-Fonts preconnect — already partially present) |

### 2.2 Primitives (components)

| HTML source | Vue file |
|-------------|----------|
| `ScoreRing` | `app/components/scanpulse/ScoreRing.vue` (exists → verify against HTML) |
| `PillarIcon` | `app/components/scanpulse/PillarIcon.vue` (exists) |
| `StatusIcon` | `app/components/scanpulse/StatusIcon.vue` (exists) |
| `PillarChip` | `app/components/scanpulse/PillarChip.vue` (exists) |
| `StatusChip` | `app/components/scanpulse/StatusChip.vue` (exists) |
| `Favicon` | `app/components/scanpulse/Favicon.vue` (exists) |
| `PillarSparkline` | `app/components/scanpulse/PillarSparkline.vue` (exists) |
| `ScoreChip` | `app/components/scanpulse/ScoreChip.vue` (exists) |
| `Arrow` | `app/components/scanpulse/Arrow.vue` (exists) |
| `Eyebrow` | `app/components/scanpulse/Eyebrow.vue` (exists) |
| `PillarGroupSection` | `app/components/scanpulse/PillarGroupSection.vue` (exists) |

Existing primitives must be re-validated line-by-line against `ScanPulse.html` `<script id="primitives-jsx">` (lines 837–1053). No prop contract drift.

### 2.3 Shared data / contracts

| HTML source (lines 705–836) | Vue destination |
|-----------------------------|-----------------|
| `PILLARS`, `TOOLS`, `SCAN`, `QUICK_WINS`, `ISSUES`, `FEED`, `RECENT` | `app/composables/useScanpulseData.ts` (NEW). These are mocks while Convex wiring lands; contracts (see lines 88–97) are frozen. |

### 2.4 Shell (rail + top strip)

| HTML source lines 1055–1232 | Vue destination |
|-----------------------------|-----------------|
| `Rail` (56px left nav) | `app/components/scanpulse/ShellRail.vue` (NEW) |
| `TopStrip` | `app/components/scanpulse/ShellTopStrip.vue` (NEW — merge current `NavBar.vue` logic; keep Clerk bindings) |
| `Logo` | reuse existing `app/components/Logo.vue` — verify glyph matches HTML lines 1082–1097 |
| Layout wrapper | `app/layouts/app.vue` (NEW) applied to authed routes |

### 2.5 Screens

| HTML source | Nuxt route |
|-------------|------------|
| Screen 01 Landing (lines 1235–2040) | `app/pages/index.vue` (rewrite) |
| Screen 02 Dashboard (lines 2042–2416) | `app/pages/dashboard/index.vue` (rewrite) |
| Screen 03 Scan Result (lines 2418–2694) | `app/pages/scan/[scanId].vue` (rewrite — keep existing `scanId` param; HTML's `/scan/:host` mock is only a label) |
| Screen 04 Tools (lines 2696–2856) | `app/pages/tools/index.vue` (rewrite) |
| Screen 05 CSP Builder (lines 2858–3285) | `app/pages/tools/csp-builder.vue` (rewrite — existing filename kept; HTML's `/tools/csp` is only a mock route). This is the canonical shell for every other `app/pages/tools/*.vue`. |

---

## 3. Task List (atomic, reviewer-gated)

> Legend: `[ ]` pending · `[~]` in progress · `[R]` under review · `[x]` done.

### Phase A — Foundations (must land before any screen work)

- [ ] **A-1.** Commit the tombstones + reference files in a single `chore(redesign):` commit: stage `redesign/` deletions, the untracked `ScanPulse.html` (locked reference), `app/assets/css/tokens.css`, and `docs/SUPERPOWER_PLAN.md`. Working tree must be clean before any PORTER spawns.
- [ ] **A0.** Reconcile `app/assets/css/main.css` with the new `tokens.css`:
  - Move the Google-Fonts `@import` up; keep Tailwind base/components/utilities layers.
  - Replace the `@layer base { body { @apply bg-dark … } }` block with CSS-var references (`background: var(--canvas); color: var(--text); font-family: var(--font-body);`).
  - Delete `.btn-primary / .btn-secondary / .btn-ghost / .card` legacy component classes — the HTML uses plain `.btn .btn-primary / .btn-ghost / .btn-pink-ghost / .card` defined in `tokens.css`. Grep for callsites first; migrate each.
- [ ] **A1.** Confirm `app/assets/css/tokens.css` is a byte-exact port of HTML lines **431–694**; `@import "./tokens.css";` at top of `main.css` (after `@tailwind` directives). Smoke-test that CSS vars resolve at runtime.
- [ ] **A1.5.** Expand `tailwind.config.ts`:
  - Add colors: `accessibility: '#a29bfe'`, `ai: '#ff7675'`, `dns: '#74b9ff'`, `trust: '#fd79a8'`, `'dark-elevated-2': '#1c1c26'`, `'dark-border-strong': 'rgba(255,255,255,0.12)'`, `'status-pass': '#00d4aa'`, `'status-warn': '#ffaa00'`, `'status-crit': '#ff4757'`, `'text-muted': 'rgba(255,255,255,0.45)'`, `'text-faint': 'rgba(255,255,255,0.28)'`.
  - Add `fontFamily.mono: ['JetBrains Mono', 'ui-monospace', 'monospace']`.
  - After merge, fix the broken `text-status-pass` / `text-status-crit` references in `app/components/scanpulse/ScoreRing.vue` (and any grep hits elsewhere).
- [ ] **A2.** Font loading: update `main.css` `@import` to request all required weights — **Space Grotesk 400/500/600/700**, **DM Sans 400/500/600/700**, **JetBrains Mono 400/500**. Add an explicit `<link rel="preload" as="font" crossorigin>` in `nuxt.config.ts app.head` for the body weight (DM Sans 400) only — everything else is `font-display: swap`.
- [ ] **A3.** Create `app/composables/useScanpulseData.ts` exporting typed `PILLARS`, `TOOLS`, `SCAN`, `QUICK_WINS`, `ISSUES`, `FEED`, `RECENT`. TypeScript interfaces must match `DATA_CONTRACTS` (HTML lines 88–97). These are **mocks only until Convex wiring lands** — contracts are frozen.
- [ ] **A4.** Validate each existing primitive in `app/components/scanpulse/` against `<script id="primitives-jsx">` (HTML lines **837–1052**). Produce a diff report per primitive; fix drift (prop names, default values, SVG path data, animation easing). One commit per primitive.
- [ ] **A5.** Create `app/components/scanpulse/ShellRail.vue` (56px left rail, per HTML lines 1099–1164) and `app/components/scanpulse/ShellTopStrip.vue` (60px top strip, per HTML lines 1167–1228). Wire Clerk `useAuth`/`useUser` into the avatar + scans-remaining badge. **Leave** `NavBar.vue` in place; do not delete until D2.
- [ ] **A6.** Create `app/layouts/app.vue` = `ShellRail` + `ShellTopStrip` + `<slot />` + grid-bg. Apply via `definePageMeta({ layout: 'app' })` on `dashboard/index.vue`, `scan/[scanId].vue`, and all `tools/*.vue`. Landing (`pages/index.vue`) uses no layout (dedicated public hero chrome).

### Phase B — Screens (parallelisable after Phase A)

- [ ] **B1. Landing (`app/pages/index.vue` — full rewrite, current file is 1208 lines)** — 7 sections (Hero, Coverage, How, Sample, Pricing, Testimonials, FAQ) per HTML lines **1235–2039**. Left section-dot nav with animated progress rail. Live feed vertical marquee (duplicate items + `translateY(-50%)` loop). Hero counter animation (rAF, cubic ease). Preserve all existing SEO meta + JSON-LD schema from current `index.vue` (do not regress organic traffic). No `app` layout — bespoke public chrome.
- [ ] **B2. Dashboard (`app/pages/dashboard/index.vue` — full rewrite, current 294 lines)** — per HTML lines **2042–2415**. DashboardHeader · HeroScanPanel · QuickWinsRow · (TrendChart + MonitorPanel) grid · RecentScansTable. Preserve ghost-numeral (`260px`), pink glow radial, grid-bg overlay. Use `app` layout (A6). Reuse `app/composables/dashboard/useDashboardData.ts` + `useScanActions.ts` for real Convex data; drop `useDashboardView.ts` if only old-view-logic.
- [ ] **B3. Scan Result (`app/pages/scan/[scanId].vue` — full rewrite, current 288 lines)** — per HTML lines **2418–2693**. ResultHero strip · FilterToolbar (all/crit/warn/pass + pillar chips) · IssueList accordion grouped by pillar with colored left rail. "Fix with <Tool>" CTA routes to the matching `tools/*` page. Use `app` layout. After commit, delete `app/components/dashboard/result/*.vue` (5 files) in the same PR.
- [ ] **B4. Tools index (`app/pages/tools/index.vue` — full rewrite, current 408 lines)** — per HTML lines **2696–2855**. Grid of `ToolCard` grouped by pillar; pillar-colored accent top; `fixes` badge; hover lift + colored shadow. Use `app` layout.
- [ ] **B5. CSP Builder (`app/pages/tools/csp-builder.vue` — full rewrite)** — per HTML lines **2858–3284**. Directive list (left) + output panel (right) with copy button; pillar accent = security; animate directive pill additions.
- [ ] **B5.5. Tool layout decision.** After B5, compare the rewritten `csp-builder.vue` shell vs. `app/layouts/tool.vue` (241 lines). Either (a) replace `tool.vue` with a new layout that matches the HTML pattern, **or** (b) drop `tool.vue` entirely and have every `tools/*.vue` use `app` layout directly. Document the choice and apply uniformly in Phase C.

### Phase C — Tool pages (parallelisable after B5.5 merges)

- [ ] **C1.** Port the remaining 9 tool pages onto the B5 shell + B5.5 layout decision: `ai-optimizer`, `contrast-checker`, `email-auth`, `favicon-generator`, `image-optimizer`, `meta-generator`, `robots-txt`, `schema-generator`, `security-headers`. One commit per tool. Each must keep its current tool-specific logic (contrast math, schema output, etc.) — only the chrome changes.

### Phase D — Cleanup & polish

- [ ] **D1.** Legacy `redesign/*` tombstones already committed in A-1 — mark this done as a no-op confirmation.
- [ ] **D2.** Run `refactor-cleaner` agent across:
  - `app/components/NavBar.vue` (197 lines — now superseded by `ShellTopStrip.vue`)
  - `app/components/dashboard/DashboardSidebar.vue` + `DashboardTopbar.vue` (old chrome)
  - `app/components/dashboard/views/*.vue` (9 files — legacy dashboard multi-view)
  - `app/composables/dashboard/useDashboardView.ts` + `useChartGeometry.ts` (likely orphaned)
  - `docs/dashboard-mockup-*.html` (5 files) and `docs/dashboard-mockups/` (if unreferenced)
  Delete only what has zero inbound references. One commit per group.
- [ ] **D3.** Reduced-motion media query compliance on every marquee + pulse + ring-fill animation (`@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }`). Checked against HTML motion (which lacks reduced-motion — we add it proactively).
- [ ] **D4.** Lighthouse run (mobile + desktop) on Landing & Dashboard. Hit Core Web Vitals targets from `~/.claude/rules/web/performance.md` (LCP < 2.5s, INP < 200ms, CLS < 0.1). Store result JSON in `docs/audits/scanpulse-redesign-<YYYY-MM-DD>.json`.
- [ ] **D5.** Final pass: remove `console.log`, dead imports, unused composables. Run `refactor-cleaner` + `plankton-code-quality`.
- [ ] **D6.** Update `memory/MEMORY.md` "Last Session" block: port completed, files added/removed, screenshot comparison outcome, any known follow-ups.

---

## 4. Per-Task Acceptance Contract

**Every task is considered "done" only when ALL of the following hold:**

1. **Code** — SFC compiles (`nuxt build` passes). Under 800 lines. Uses `<script setup lang="ts">`. No Babel-in-browser. anime.js dynamic-imported inside `onMounted`.
2. **Tokens** — Uses only CSS vars from `tokens.css`. No new color literals outside allowed pillar/status palette.
3. **Visual** — VISUAL-REVIEWER (via Chrome extension) compares `http://localhost:3000/<route>` vs. local `ScanPulse.html` open in an adjacent tab, at 1440×900 and 375×800: **zero regressions** in tokens, spacing, type scale, radii, shadows, hover lift, ghost-numeral placement, accent-top gradient, pulse-dot ring.
4. **Motion** — Score-ring fill uses `cubic-bezier(.16,1,.3,1)` over `0.8s`. Marquee duplicates items and translates `-50%`. Lift `translateY(-2px) scale(1.005)`. Pulse `1.5s ease-in-out infinite`.
5. **A11y** — axe-core zero criticals. Keyboard navigable. Focus visible. Color contrast WCAG AA. Reduced-motion respected.
6. **Security** (if applicable) — No secrets in repo. User input validated at boundaries. Clerk session properly awaited before Convex writes. CSP compatible markup (no inline handlers, no `dangerouslySetInnerHTML` equivalents).
7. **Commit** — One conventional commit, scope `scanpulse`, body lists which HTML line-range was ported and which reviewer(s) approved. Pushed to `main`.

---

## 5. Commit Message Template

```
<type>(scanpulse): <one-line imperative>

Ported: ScanPulse.html L<start>–L<end>  →  <destination file(s)>
Reviewers: visual ✅ a11y ✅ security ✅|n/a
Task: <task-id from TodoWrite>
```

Example:
```
feat(scanpulse): port dashboard hero scan panel

Ported: ScanPulse.html L2087–L2152  →  app/pages/dashboard/index.vue
Reviewers: visual ✅ a11y ✅ security n/a
Task: B2.2
```

---

## 6. Watchdog Protocol (Orchestra → Stuck-Checker)

The Orchestra agent enforces a **10-minute soft ceiling** per PORTER spawn.

### Trigger
`Date.now() - task.startedAt > 10 * 60 * 1000` and no terminal event from the PORTER.

### Actions (in order)

1. `TaskOutput` on the running PORTER — any new chunk in last 60 s ⇒ extend 5 min, do nothing.
2. Otherwise spawn **STUCK-CHECKER** with this prompt skeleton:
    ```
    Task <id> has been running 10+ min without report.
    Target file(s): <paths>.
    HTML line-range: <range>.
    Check: (a) do target files exist with reasonable content?
           (b) has git HEAD advanced since task start?
           (c) is the PORTER still producing output?
    Return: "done-but-unreported" | "in-progress" | "stuck" + 1-line evidence.
    ```
3. Based on verdict:
   - **done-but-unreported** → Orchestra runs the review pipeline against the files as-is. If visual passes, commit; cross off.
   - **in-progress** → extend watchdog by 5 min. Max two extensions.
   - **stuck** → `task_cancel` the PORTER, spawn **BUILD-GUARDIAN** to diagnose + fix blocker, then respawn PORTER with the diagnostic appended to the prompt.

---

## 7. Review Rubric (Visual-Reviewer)

Scored pass/fail only; any fail blocks commit.

| Check | Pass criterion |
|-------|----------------|
| Canvas color | `#07070a` on body |
| Card color | `#16161e` with `1px rgba(255,255,255,0.07)` border, `16px` radius |
| Brand pink | `#ec3586` — used for primary CTA, section-nav active, trend line, accent-top start |
| Ghost numeral | semi-transparent `rgba(255,255,255,0.04)`, positioned per HTML |
| Grid-bg overlay | 64px grid, `rgba(255,255,255,0.018)` lines, opacity 0.4–0.5 per screen |
| Score ring | `cubic-bezier(.16,1,.3,1)` 0.8s ease; delta chip inside |
| Pillar chip | colored `eyebrow-pillar` (22×2 swatch + 11px tracking) |
| Pulse dot | 1.5s pulse + expanding ring via `::after` |
| Type scale | Hero `clamp(3.4rem,5.5vw,5.6rem)`; H2 28px; display headings use Space Grotesk 700 −0.04em |
| Mono fields | host / URL / timestamps use JetBrains Mono |
| Buttons | 9px radius, 12×18 padding, `btn-primary` with 24px pink glow + inset white |
| Hover lift | `translateY(-2px) scale(1.005)` on `.lift` |
| No emoji | Confirmed — all glyphs are inline SVG |
| No light mode | Dark canvas preserved |

---

## 8. Git Flow

- One branch: **`main`** (per MEMORY + CLAUDE.md — no worktrees).
- **Every task** → its own commit → `git push origin main` immediately after cross-off.
- If the user's git identity blocks a commit, Orchestra surfaces the proposed message and waits for the user (`feedback_git_push` memory rule).
- **Never skip hooks** (`--no-verify` forbidden).

---

## 9. Deliverable Index (when plan is complete)

- `app/assets/css/tokens.css`
- `app/composables/useScanpulseData.ts`
- `app/components/scanpulse/Shell{Rail,TopStrip}.vue`
- `app/layouts/app.vue`
- Verified primitives in `app/components/scanpulse/*.vue`
- Rewritten pages: `index.vue`, `dashboard/index.vue`, `scan/[scanId].vue`, `tools/index.vue`, `tools/*.vue`
- Deleted: `redesign/` directory, legacy `NavBar.vue`
- Updated `memory/MEMORY.md` "Last Session" block
- Lighthouse report in `docs/audits/scanpulse-redesign-<date>.json`

---

## 10. Kickoff Command (for the Orchestra)

```
ORCHESTRA, load this plan.

1. Read §0.5 Reality Snapshot. These are ground-truth facts from the April 18 scan.
2. TodoWrite every task in §3 as a tracked item (A-1 → D6).
3. Dispatch strictly in this order:
     (solo)    A-1   — clean working tree, commit tombstones + references
     (solo)    A0    — main.css / tokens.css reconciliation
     (||)      A1, A1.5, A2, A3  — in parallel (independent)
     (solo)    A4    — depends on A1 + A1.5 landing
     (||)      A5, A6 — in parallel
     (||)      B1, B2, B3, B4  — in parallel (max 4 PORTERs); gate on Phase A green
     (solo)    B5, B5.5
     (||)      C1.* — one PORTER per tool page, batched 4 at a time
     (serial)  D1 → D6
4. For every PORTER spawn:
     - hand it the exact HTML line-range cited in §3
     - include acceptance checklist (§4) and visual rubric (§7)
     - arm 10-min watchdog (§6)
     - on return: spawn VISUAL-REVIEWER (+ A11Y + SECURITY as §1.3 dictates)
     - on all-pass: commit with §5 template + push to main + cross off TodoWrite
     - on fail: loop PORTER with reviewer feedback (max 3 iterations)
5. Use shared memory namespace `scanpulse-redesign` in agentdb for cross-agent state.
6. Invoke `context7` for every Nuxt/Vue/PrimeVue/Tailwind/Convex/Clerk API lookup.
7. All visual verification routes through the Chrome extension — never `preview_start`,
   never `npm run dev`.
8. On plan completion (D6 green): update memory/MEMORY.md "Last Session", open a PR
   summary, and post Lighthouse JSON path.
```
