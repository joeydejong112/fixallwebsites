# Dashboard Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the 2616-line `app/pages/dashboard/index.vue` into focused composables + view components, migrate the 800-line scoped `<style>` block to Tailwind utilities, and delete pages that the dashboard SPA has rendered obsolete.

**Architecture:** The dashboard is a single Vue SFC that hosts 9 view modes (`overview`, `scan`, `history`, `compare`, `bulk`, `charts`, `chart-detail`, `tools`, `tool-detail`, `result`) switched by a `currentView` ref. We will (1) lift state into typed composables under `app/composables/dashboard/`, (2) extract each view into its own component under `app/components/dashboard/`, (3) replace `ds-*` scoped CSS with Tailwind utilities (using `@apply` only where the same long class chain repeats 3+ times within one component), (4) remove pages whose only inbound link in the audit is the now-deleted dashboard view.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Tailwind CSS, Convex (`useConvex` / `useConvexWs` composables), Clerk (`useAuth`).

---

## Coordination Rules (binding for the orchestrator and every subagent)

1. **Overseer pattern** — the main session is the overseer. It dispatches one fresh subagent per task via the Task tool. The overseer owns the todo list (TodoWrite), reviews each subagent's diff before marking the task complete, and never edits code directly during execution phases.
2. **Concurrency cap** — at most **4 subagents** may run in parallel at any time. Tasks marked `[parallel-batch]` may be dispatched in one message; tasks marked `[serial]` must complete before the next starts.
3. **Mandatory CLAUDE.md read** — every subagent prompt must begin with: *"Before doing anything else, read `C:/Users/Joey/Documents/JDJFreelance/fixallwebsites/CLAUDE.md` and `memory/MEMORY.md`. Confirm in your first sentence that you read them."*
4. **Per-task verification** — the overseer never marks a task complete based on the subagent's word alone. After every task it must:
   a. Read the changed files to confirm they match the spec in this plan.
   b. Run the verification step listed in the task.
   c. Only then call TodoWrite to flip the task to `completed`.
   This applies even inside parallel batches — each task gets its own verify before the batch is considered closed. A "batch verification gate" is an *additional* gate (cross-cutting smoke test of the batch as a whole), not a replacement for per-task verifies.
5. **No dev server starts** — `npm run dev` is already running at `http://localhost:3000`. Never run it. Never call `preview_start`. Verification = browser refresh + console check via the user's Chrome extension.
6. **Commit + push after every task** — each task ends with a commit. If git config blocks the push, surface the prepared commit message to the user instead of guessing credentials.
7. **No auto memory writes, no auto security-auditor dispatches** — these are explicit user preferences. Skip both unless the user asks.
8. **Type discipline** — every new `.ts` file uses explicit return types on exports. Every new `.vue` file uses `<script setup lang="ts">` with `defineProps<...>()` and `defineEmits<...>()` typed generic arguments — no runtime declarations.

---

## File Structure (target end-state)

```
app/
├── composables/
│   └── dashboard/
│       ├── useDashboardData.ts        # scans, monitors, bulkScans, convexUser, sparklines, loadUserData, ws subscriptions
│       ├── useScanActions.ts          # handleScan, deleteScan, reScan, toggleMonitor, isMonitored
│       ├── useDashboardView.ts        # currentView, selectedScan, selectedTool, selectedChartUrl + setView/openScan/openTool/openChartDetail/dashboardNavigate + topbarInfo
│       ├── useScoreFormat.ts          # scoreColor, scoreBg, statusLabel, relativeTime, scoreTrend, trendColor, faviconUrl, hostname
│       └── useChartGeometry.ts        # chartSvgPoints, chartAreaPath, chartDotX/Y, shortDate, CD_* constants, cdX/cdY/cdPolyline/cdAreaPath
├── lib/
│   └── dashboard/
│       ├── tools.ts                   # allTools, toolPillars, TOOL_LINKS, PILLAR_COLORS
│       └── toolComponentMap.ts        # defineAsyncComponent map for the 10 tool pages
├── components/
│   └── dashboard/
│       ├── DashboardSidebar.vue       # full sidebar (logo, nav, monitored sites, account, user card)
│       ├── DashboardTopbar.vue        # back button, title/sub, scan input
│       ├── views/
│       │   ├── OverviewView.vue
│       │   ├── ScanView.vue
│       │   ├── HistoryView.vue
│       │   ├── CompareView.vue
│       │   ├── BulkView.vue
│       │   ├── ChartsView.vue
│       │   ├── ChartDetailView.vue
│       │   ├── ToolsView.vue
│       │   ├── ToolDetailView.vue
│       │   └── ResultView.vue
│       └── result/
│           ├── ScanResultHeader.vue   # mini ring + URL meta + actions row
│           ├── ScanResultScores.vue   # pillar score strip
│           ├── ScanResultToolCards.vue# "Fix Now" tool cards (uses resultToolCards)
│           ├── ScanResultIssues.vue   # severity-grouped issues with collapse/expand
│           └── ScanResultLog.vue      # scan log table (used in chart-detail too)
└── pages/
    └── dashboard/
        └── index.vue                  # ≤300 lines: imports + composable wiring + sidebar/topbar/view-switch shell
```

Files to delete (pending audit confirmation in Phase 0):
- `app/pages/results/index.vue` (1371 lines)
- `app/pages/history/index.vue`
- `app/pages/compare/index.vue`
- `app/pages/compare/[scanIdA]/[scanIdB].vue`
- `app/pages/bulk-scan/index.vue`
- `app/pages/bulk-scan/[id].vue`

---

## Phase 0 — Audit (overseer-only, no subagents)

### Task 0.1: Map inbound links to candidate-obsolete pages

**Files:**
- Read: `app/components/NavBar.vue`, `app/pages/share/[id].vue`, `server/routes/og/scan.ts`, `app/pages/index.vue`, all files in `app/pages/**/*.vue`
- Create: `docs/superpowers/plans/2026-04-16-dashboard-audit.md`

- [ ] **Step 1: Grep for every inbound link to candidate-obsolete routes**

Run each Grep separately and record results in the audit doc. Use the Grep tool (ripgrep), output_mode=`content`, `-n` line numbers, search paths `app/`, `server/`, `nuxt.config.ts`, `app/middleware/`, `app/pages/share/`, `server/routes/og/`. Patterns (one Grep call per pattern, no PCRE2 needed):

- `to=["']/results` and `(navigateTo|router\.push|push)\(["']/results` and `href=["']/results`
- `to=["']/history` and `(navigateTo|router\.push|push)\(["']/history` and `href=["']/history`
- `to=["']/compare` and `(navigateTo|router\.push|push)\(["']/compare` and `href=["']/compare`
- `to=["']/bulk-scan` and `(navigateTo|router\.push|push)\(["']/bulk-scan` and `href=["']/bulk-scan`

Also one bare-string sanity grep per route (`'/results'|"/results"`) to catch anything the structured patterns miss (e.g. sitemap entries, OG metadata, blog content).

For each match, record the file + line + surrounding 1 line of context.

**Additional audit items (read these files carefully before deciding DELETE):**
- `app/pages/share/[id].vue` — reads scan data; confirm it does not depend on routes inside `/results/*`, `/compare/*`, or `/bulk-scan/*` for its rendering or its "open full report" CTA. If it does, that CTA must be rewritten to `/dashboard?view=result&scan=<id>` before the page can be deleted.
- `server/routes/og/*.ts` — confirm OG image generation reads scan data directly from Convex, not by scraping a `/results/*` page.

- [ ] **Step 2: Read each referencing file to classify the link**

Classify each match as one of:
- `internal-only` — only the dashboard or its child components link here
- `external-still-needed` — NavBar, share page, OG route, sitemap, blog, marketing page, or external doc references it
- `dead` — string only appears in the candidate page itself

- [ ] **Step 3: Decide kept vs delete per page**

A page can be deleted if and only if every inbound link is `dead` or rewritable to a `?view=` query on `/dashboard`. Record the decision (KEEP / DELETE / REWRITE-LINKS-FIRST) for each of the 6 candidates in the audit doc, with the list of files needing rewrites for the third category.

- [ ] **Step 4: Write `docs/superpowers/plans/2026-04-16-dashboard-audit.md`**

The doc must contain:
- A table of `route → status (KEEP/DELETE/REWRITE-LINKS-FIRST) → files-to-update`
- A list of every dashboard view (`overview`, `scan`, `history`, `compare`, `bulk`, `charts`, `chart-detail`, `tools`, `tool-detail`, `result`) with its source line range in `app/pages/dashboard/index.vue` (use the line ranges in this plan as a starting point and confirm with grep)
- A list of every script-setup symbol (state ref, function, computed) with the destination composable from the file structure above

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-04-16-dashboard-audit.md
git commit -m "docs: dashboard refactor audit"
git push
```

**Verification:** Audit doc exists and lists all 6 candidate pages with classifications. Overseer reads it end-to-end before marking Phase 0 complete.

---

## Phase 1 — Composable Extraction

> **Constraint:** The dashboard must keep working between every task. Each composable task copies code into a new file and re-exports it, but the dashboard does NOT switch to using the composable until Task 1.7. This keeps each task small and independently revertible.

### Task 1.1: `useScoreFormat.ts` `[parallel-batch A, serial source]`

**Files:**
- Create: `app/composables/dashboard/useScoreFormat.ts`
- Source: `app/pages/dashboard/index.vue:171-224` (scoreTrend, trendColor, faviconUrl, hostname, scoreColor, scoreBg, statusLabel, relativeTime)

- [ ] **Step 1: Write the composable**

```ts
// app/composables/dashboard/useScoreFormat.ts
export function useScoreFormat() {
  function scoreColor(score?: number): string {
    if (score == null) return 'rgba(255,255,255,0.4)'
    if (score >= 80) return '#00d4aa'
    if (score >= 60) return '#ffaa00'
    return '#ff4757'
  }
  function scoreBg(score?: number): string {
    if (score == null) return 'rgba(255,255,255,0.05)'
    if (score >= 80) return 'rgba(0,212,170,0.15)'
    if (score >= 60) return 'rgba(255,170,0,0.15)'
    return 'rgba(255,71,87,0.15)'
  }
  function statusLabel(status: string): string {
    if (status === 'pending' || status === 'running') return 'Scanning'
    if (status === 'error') return 'Failed'
    return 'Done'
  }
  function relativeTime(ts: number): string {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }
  function faviconUrl(url: string): string {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64` } catch { return '' }
  }
  function hostname(url: string): string {
    try { return new URL(url).hostname } catch { return url }
  }
  function trendColor(trend: string | null): string {
    if (trend === '↑') return '#00d4aa'
    if (trend === '↓') return '#ff4757'
    return 'rgba(255,255,255,0.4)'
  }
  return { scoreColor, scoreBg, statusLabel, relativeTime, faviconUrl, hostname, trendColor }
}

export function useScoreTrend(scans: import('vue').Ref<any[]>) {
  function scoreTrend(url: string): '↑' | '↓' | '→' | null {
    const urlScans = scans.value
      .filter(s => s.url === url && s.status === 'done')
      .sort((a, b) => b._creationTime - a._creationTime)
    if (urlScans.length < 2) return null
    const diff = urlScans[0].overallScore - urlScans[1].overallScore
    return diff > 5 ? '↑' : diff < -5 ? '↓' : '→'
  }
  return { scoreTrend }
}
```

> NOTE FOR THE SUBAGENT: The actual function bodies above must match the source in `app/pages/dashboard/index.vue` exactly. Read lines 171-224 and 206-224 first. If anything in the source differs from what's shown above (e.g. different break-points for score thresholds), match the source — don't trust this plan's snippet.

- [ ] **Step 2: Verify the composable type-checks in isolation**

Run: `npx vue-tsc --noEmit`
Expected: clean (or no new errors compared to baseline `git stash && npx vue-tsc --noEmit && git stash pop`).

- [ ] **Step 3: Commit**

```bash
git add app/composables/dashboard/useScoreFormat.ts
git commit -m "refactor(dashboard): extract score formatting composable"
git push
```

---

### Task 1.2: `lib/dashboard/tools.ts` `[parallel-batch A]`

**Files:**
- Create: `app/lib/dashboard/tools.ts`
- Source: `app/pages/dashboard/index.vue:6-28` (TOOL_LINKS), `:356-360` (PILLAR_COLORS), `:517-542` (allTools, toolPillars)

- [ ] **Step 1: Move the four constants verbatim into `app/lib/dashboard/tools.ts`**

Export shape:
```ts
export const TOOL_LINKS: Record<string, string> = { /* ...verbatim from source... */ }
export const PILLAR_COLORS: Record<string, string> = { /* ...verbatim... */ }
export interface DashboardTool {
  slug: string; title: string; subtitle: string; desc: string; short: string;
  pillar: string; color: string; fixes: number; icon: string;
}
export const allTools: DashboardTool[] = [ /* ...verbatim... */ ]
export interface DashboardToolPillar { key: string; label: string; color: string }
export const toolPillars: DashboardToolPillar[] = [ /* ...verbatim... */ ]
```

- [ ] **Step 2: Verify** — `npx vue-tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add app/lib/dashboard/tools.ts
git commit -m "refactor(dashboard): extract tool catalog constants"
git push
```

---

### Task 1.3: `useChartGeometry.ts` `[parallel-batch A]`

**Files:**
- Create: `app/composables/dashboard/useChartGeometry.ts`
- Source: `app/pages/dashboard/index.vue:456-514`

- [ ] **Step 1: Move chart helpers**

Export the following named functions and constants (signatures must match source verbatim — copy the bodies from the source lines, do not reinvent):
- `chartSvgPoints(scores: number[]): string`
- `chartAreaPath(scores: number[]): string`
- `chartDotX(i: number, total: number): number`
- `chartDotY(score: number): number`
- `shortDate(ts: number): string`
- `CD_W, CD_H, CD_PL, CD_PR, CD_PT, CD_PB, CD_CW, CD_CH, CD_GRID` (constants)
- `cdX(i: number, n: number): number`
- `cdY(score: number): number`
- `cdPolyline(scores: number[]): string`
- `cdAreaPath(scores: number[]): string`

Wrap them in a `useChartGeometry()` composable that returns the function set; export the constants as named exports:
```ts
export const CD_W = 560, CD_H = 150, /* ... */
export function useChartGeometry() { return { chartSvgPoints, chartAreaPath, chartDotX, chartDotY, shortDate, cdX, cdY, cdPolyline, cdAreaPath } }
```

- [ ] **Step 2: Verify** — `npx vue-tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add app/composables/dashboard/useChartGeometry.ts
git commit -m "refactor(dashboard): extract chart SVG geometry helpers"
git push
```

---

### Task 1.4: `useDashboardData.ts` `[serial — depends on nothing, but is the largest single composable]`

**Files:**
- Create: `app/composables/dashboard/useDashboardData.ts`
- Source: `app/pages/dashboard/index.vue:32-103` (state, refs, loadUserData, sparkline fetch, ws subscriptions, recentComparisons localStorage hydration)

- [ ] **Step 1: Define the composable signature**

```ts
export interface DashboardData {
  scans: import('vue').Ref<any[]>
  monitors: import('vue').Ref<any[]>
  bulkScans: import('vue').Ref<any[]>
  convexUser: import('vue').Ref<{ plan: 'free' | 'pro'; scanCount: number } | null>
  urlSparklines: import('vue').Ref<Map<string, number[]>>
  recentComparisons: import('vue').Ref<{ urlA: string; urlB: string; scanIdA: string; scanIdB: string }[]>
  loading: import('vue').Ref<boolean>
  loadUserData: (id: string) => Promise<void>
  pushRecentComparison: (entry: { urlA: string; urlB: string; scanIdA: string; scanIdB: string }) => void
}
export function useDashboardData(): DashboardData
```

- [ ] **Step 2: Implement**

Move lines 37-103 from `app/pages/dashboard/index.vue` into the composable body. Specifically:
- All `ref()` declarations from the source
- `onMounted(() => { ...localStorage hydration... })` — keep inside the composable; `onMounted` is callable inside composables
- `loadUserData(id)` function — keep verbatim (it uses `useConvex()` and `useConvexWs()` — call these inside the composable)
- The two ws subscription `let unsubscribeScans` / `unsubscribeMonitors` declarations and the `onUnmounted` cleanup pattern — confirm the source uses `onUnmounted` (read source lines 54-103); if not present, add `onUnmounted(() => { unsubscribeScans?.(); unsubscribeMonitors?.() })`

Add a `pushRecentComparison(entry)` helper that prepends to `recentComparisons.value`, dedups by `scanIdA+scanIdB`, slices to 10, and persists to `localStorage.setItem('sp_recent_comparisons', JSON.stringify(...))`. (Today this localStorage write is inline in the dashboard — run `Grep pattern="sp_recent_comparisons" path="app/pages/dashboard/index.vue" output_mode=content -n` to locate the existing write sites, then replace them with calls to this helper.)

- [ ] **Step 3: Verify** — `npx vue-tsc --noEmit` clean.

- [ ] **Step 4: Commit**

```bash
git add app/composables/dashboard/useDashboardData.ts
git commit -m "refactor(dashboard): extract data loading composable"
git push
```

---

### Task 1.5: `useScanActions.ts` `[serial — depends on Task 1.4 for the data refs]`

**Files:**
- Create: `app/composables/dashboard/useScanActions.ts`
- Source: `app/pages/dashboard/index.vue:105-170`

- [ ] **Step 1: Define signature**

```ts
import type { Id } from '~~/convex/_generated/dataModel'
import type { DashboardData } from './useDashboardData'

export interface ScanActionsOptions {
  onScanCreated?: (scanId: Id<'scans'>) => void
}

export function useScanActions(
  data: Pick<DashboardData, 'scans' | 'monitors'>,
  opts?: ScanActionsOptions,
) {
  // returns:
  // - scanning: Ref<boolean>
  // - handleScan(url: string): Promise<void>            // invokes opts.onScanCreated(newScanId) on success
  // - deleteScan(scanId: Id<'scans'>, e?: Event): Promise<void>
  // - reScan(url: string, e?: Event): Promise<void>
  // - toggleMonitor(url: string, e?: Event): Promise<void>
  // - isMonitored(url: string): boolean
}
```

- [ ] **Step 2: Move the bodies**

Copy each function body from source lines 105-170 verbatim. The composable owns its own `scanning` ref. It calls `useConvex()` and `useAppToast()` internally. Inside `handleScan`, immediately after the create-scan mutation returns the new scan id, call `opts?.onScanCreated?.(newScanId)` so the dashboard can flip to the result view — this replaces the original `currentView.value = 'result'` line in source. The composable itself does **not** import or reference `currentView`.

- [ ] **Step 3: Verify** — `npx vue-tsc --noEmit` clean.

- [ ] **Step 4: Commit**

```bash
git add app/composables/dashboard/useScanActions.ts
git commit -m "refactor(dashboard): extract scan action composable"
git push
```

---

### Task 1.6: `useDashboardView.ts` `[serial]`

**Files:**
- Create: `app/composables/dashboard/useDashboardView.ts`
- Source: `app/pages/dashboard/index.vue:225-292`

- [ ] **Step 1: Define signature**

```ts
import type { DashboardTool } from '~/lib/dashboard/tools'

export type View = 'overview' | 'scan' | 'history' | 'compare' | 'bulk' | 'charts' | 'chart-detail' | 'tools' | 'tool-detail' | 'result'

export function useDashboardView(opts: {
  scans: import('vue').Ref<any[]>
  doneScans: import('vue').ComputedRef<any[]>
}) {
  // returns:
  // - currentView: Ref<View>
  // - selectedScan: Ref<any>
  // - selectedTool: Ref<string | null>
  // - selectedChartUrl: Ref<string | null>
  // - toolsExpanded: Ref<boolean>
  // - setView(v: View): void
  // - openScan(scan: any): void
  // - openScanByUrl(url: string): void
  // - openChartDetail(url: string): void
  // - openTool(slug: string): void
  // - dashboardNavigate(href: string): void              // also calls provide('dashboardNavigate', dashboardNavigate)
  // - currentToolMeta: ComputedRef<DashboardTool | undefined>   // pure derivation of selectedTool + allTools; topbarInfo depends on it, so it stays here (NOT moved into ToolDetailView)
  // - topbarInfo: ComputedRef<{ title: string; sub: string }>
}
```

> **Note on `currentToolMeta`:** keep it in this composable. `topbarInfo` reads `currentToolMeta.value?.title`, and the topbar is rendered from the page shell — not from inside `ToolDetailView`. Only `currentToolComponent` (the async component binding) moves to `ToolDetailView` in Task 3.9. `historySearch` is NOT owned here — it lives locally inside `HistoryView` (see Task 3.3).

- [ ] **Step 2: Move logic verbatim**

Import `allTools` from `~/lib/dashboard/tools` (Task 1.2). Import `useScoreFormat` for `hostname` and `relativeTime` used by `topbarInfo`. The `provide('dashboardNavigate', dashboardNavigate)` call must remain — the tool sub-pages inject this key.

- [ ] **Step 3: Verify** — `npx vue-tsc --noEmit` clean.

- [ ] **Step 4: Commit**

```bash
git add app/composables/dashboard/useDashboardView.ts
git commit -m "refactor(dashboard): extract view router composable"
git push
```

---

### Task 1.7: `lib/dashboard/toolComponentMap.ts` `[parallel-batch B]`

**Files:**
- Create: `app/lib/dashboard/toolComponentMap.ts`
- Source: `app/pages/dashboard/index.vue:266-277`

- [ ] **Step 1: Move the map verbatim**

```ts
import { defineAsyncComponent } from 'vue'
export const toolComponentMap: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  'security-headers': defineAsyncComponent(() => import('~/pages/tools/security-headers.vue')),
  // ...repeat for all 10, copy source verbatim
}
```

- [ ] **Step 2: Verify** — `npx vue-tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add app/lib/dashboard/toolComponentMap.ts
git commit -m "refactor(dashboard): extract async tool component map"
git push
```

---

### Task 1.8: Wire all composables into the dashboard `[serial — depends on 1.1–1.7]`

**Files:**
- Modify: `app/pages/dashboard/index.vue:1-550` (replace the bulk of `<script setup>`)

- [ ] **Step 1: Rewrite the `<script setup>` block**

Replace lines 1-550 with:

```vue
<script setup lang="ts">
import { useDashboardData } from '~/composables/dashboard/useDashboardData'
import { useScanActions } from '~/composables/dashboard/useScanActions'
import { useDashboardView } from '~/composables/dashboard/useDashboardView'
import { useScoreFormat, useScoreTrend } from '~/composables/dashboard/useScoreFormat'
import { useChartGeometry } from '~/composables/dashboard/useChartGeometry'
import { allTools, toolPillars, TOOL_LINKS, PILLAR_COLORS } from '~/lib/dashboard/tools'
import { toolComponentMap } from '~/lib/dashboard/toolComponentMap'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Dashboard — ScanPulse' })

const { userId } = useAuth()
const data = useDashboardData()
const view = useDashboardView({ scans: data.scans, doneScans: computed(() => data.scans.value.filter(s => s.status === 'done')) })
// onScanCreated wiring: when handleScan returns a new scan id, select it and switch to the result view.
// This replaces the old inline `currentView.value = 'result'` line in the source.
const actions = useScanActions(
  { scans: data.scans, monitors: data.monitors },
  {
    onScanCreated: (scanId) => {
      const scan = data.scans.value.find(s => s._id === scanId)
      if (scan) {
        view.selectedScan.value = scan
        view.setView('result')
      }
    },
  },
)
const fmt = useScoreFormat()
const { scoreTrend } = useScoreTrend(data.scans)
const geom = useChartGeometry()

// ---- View-local state that doesn't belong in any composable ----
// (Move these only if they remain after view extraction in Phase 3.)
// For now: keep filterStatus, newScanUrl, compareUrlA/B, toolsFilter, resultActiveTab/etc HERE
// They will move into their respective view components in Phase 3.
//
// Lines 295-549 (result view state, chart-detail, topbar input, compare form, tools filter)
// stay in this file UNTIL the matching view component is extracted in Phase 3.

watch(userId, (id) => { if (id) data.loadUserData(id) }, { immediate: true })
</script>
```

> **CRITICAL:** This rewrite intentionally leaves view-local state (resultActiveTab, newScanUrl, compareUrlA/B, toolsFilter, etc.) in `index.vue` for now. Each piece moves into its view component in Phase 3. Do not try to do both at once.

- [ ] **Step 2: Verify in browser**

Refresh `http://localhost:3000/dashboard`. Expected:
- Page loads, sidebar renders, all 9 nav items navigate correctly.
- Scan list, monitors, bulk scans all populate.
- Console is free of new errors (compare against the baseline screenshot the user took — if a baseline doesn't exist, ask the user to confirm "no new console errors" via their Chrome extension before proceeding).

- [ ] **Step 3: Commit**

```bash
git add app/pages/dashboard/index.vue
git commit -m "refactor(dashboard): wire composables into page shell"
git push
```

---

## Phase 2 — Layout Shell Extraction

### Task 2.1: `DashboardSidebar.vue` `[serial]`

**Files:**
- Create: `app/components/dashboard/DashboardSidebar.vue`
- Modify: `app/pages/dashboard/index.vue:556-645` (replace with `<DashboardSidebar v-bind="..." @... />`)

- [ ] **Step 1: Create the component**

Props (typed):
```ts
defineProps<{
  currentView: string
  toolsExpanded: boolean
  selectedTool: string | null
  selectedScanUrl: string | null
  scans: any[]
  bulkScans: any[]
  recentComparisons: any[]
  monitors: any[]
  convexUser: { plan: 'free' | 'pro'; scanCount: number } | null
  userId: string | null | undefined
}>()
const emit = defineEmits<{
  (e: 'set-view', v: string): void
  (e: 'toggle-tools'): void
  (e: 'open-tool', slug: string): void
  (e: 'open-scan-by-url', url: string): void
}>()
```

Template = lines 556-645 verbatim, with:
- `setView(...)` → `emit('set-view', ...)`
- `toolsExpanded = !toolsExpanded; setView('tools')` → `emit('toggle-tools'); emit('set-view', 'tools')`
- `openTool(t.slug)` → `emit('open-tool', t.slug)`
- `openScanByUrl(m.url)` → `emit('open-scan-by-url', m.url)`
- `selectedScan?.url === m.url` → `selectedScanUrl === m.url`
- `scoreBg(m.lastScore)` → import `useScoreFormat` and call locally (sidebar should be self-contained for formatting helpers)
- `hostname(m.url)` → same

`<style scoped>` block — copy ALL `ds-logo`, `ds-plan-badge`, `ds-nav`, `ds-nav-item`, `ds-nav-active`, `ds-nav-section`, `ds-nav-badge`, `ds-nav-count`, `ds-nav-empty`, `ds-nav-chevron`, `ds-tools-dropdown`, `ds-tools-sub-item`, `ds-tools-sub-active`, `ds-tools-sub-dot`, `ds-site-dot`, `ds-site-name`, `ds-user`, `ds-user-avatar`, `ds-user-info`, `ds-user-plan`, `ds-user-sub`, and the parent `.ds-sidebar` rule from the source `<style>` block (lines 1809-2616). Leave the source `<style>` untouched for now — Phase 4 prunes it.

- [ ] **Step 2: Wire into the dashboard**

Replace source lines 556-645 with:

```vue
<DashboardSidebar
  :current-view="view.currentView.value"
  :tools-expanded="view.toolsExpanded.value"
  :selected-tool="view.selectedTool.value"
  :selected-scan-url="view.selectedScan.value?.url ?? null"
  :scans="data.scans.value"
  :bulk-scans="data.bulkScans.value"
  :recent-comparisons="data.recentComparisons.value"
  :monitors="data.monitors.value"
  :convex-user="data.convexUser.value"
  :user-id="userId"
  @set-view="view.setView"
  @toggle-tools="view.toolsExpanded.value = !view.toolsExpanded.value"
  @open-tool="view.openTool"
  @open-scan-by-url="view.openScanByUrl"
/>
```

- [ ] **Step 3: Verify in browser** — refresh, click every sidebar item, confirm each view loads.

- [ ] **Step 4: Commit**

```bash
git add app/components/dashboard/DashboardSidebar.vue app/pages/dashboard/index.vue
git commit -m "refactor(dashboard): extract sidebar component"
git push
```

---

### Task 2.2: `DashboardTopbar.vue` `[serial]`

**Files:**
- Create: `app/components/dashboard/DashboardTopbar.vue`
- Modify: `app/pages/dashboard/index.vue:649-667`

- [ ] **Step 1: Create the component**

Props:
```ts
defineProps<{
  title: string
  subtitle: string
  showBack: boolean
  scanning: boolean
  modelValue: string  // newScanUrl
}>()
const emit = defineEmits<{
  (e: 'back'): void
  (e: 'submit'): void
  (e: 'update:modelValue', v: string): void
}>()
```

Template = source lines 649-667 verbatim, with:
- back-button click → `emit('back')`
- input → `v-model` via `modelValue` + `update:modelValue`
- scan button click → `emit('submit')`
- Move `ds-topbar`, `ds-topbar-left`, `ds-back-btn`, `ds-topbar-title`, `ds-topbar-sub`, `ds-topbar-spacer`, `ds-scan-row`, `ds-scan-input`, `ds-scan-btn` styles into the component's `<style scoped>`.

The `back` handler in the dashboard:
```ts
function handleBack() {
  if (view.currentView.value === 'tool-detail') view.setView('tools')
  else if (view.currentView.value === 'chart-detail') view.setView('charts')
  else view.setView('history')
}
```

- [ ] **Step 2: Wire into dashboard**

```vue
<DashboardTopbar
  :title="view.topbarInfo.value?.title ?? ''"
  :subtitle="view.topbarInfo.value?.sub ?? ''"
  :show-back="['result','tool-detail','chart-detail'].includes(view.currentView.value)"
  :scanning="actions.scanning.value"
  v-model="newScanUrl"
  @back="handleBack"
  @submit="submitNewScan"
/>
```

`newScanUrl` and `submitNewScan` stay inline in `index.vue` for now (they move into the topbar in Phase 3 if appropriate, or stay if other views need them).

- [ ] **Step 3: Verify** — back button works on result/tool-detail/chart-detail; topbar input creates a scan.

- [ ] **Step 4: Commit**

```bash
git add app/components/dashboard/DashboardTopbar.vue app/pages/dashboard/index.vue
git commit -m "refactor(dashboard): extract topbar component"
git push
```

---

## Phase 3 — View Component Extraction

> **Pattern for every view task** (do not deviate):
> 1. Subagent reads CLAUDE.md + the source line range.
> 2. Subagent creates the new file under `app/components/dashboard/views/<Name>View.vue` with `<script setup lang="ts">` + `<template>` + `<style scoped>`.
> 3. Props are typed via generic `defineProps<{ ... }>()`. Emits via `defineEmits<{ ... }>()`. **No inheritAttrs hacks.**
> 4. Move every `ds-*` CSS rule used inside this view's template from the source `<style>` block into the new component's `<style scoped>`. (Phase 4 will Tailwind-ify; Phase 3 just relocates.)
> 5. Replace the source template region with `<OverviewView v-bind="..." @... />`.
> 6. Verify in browser by switching to the view.
> 7. Commit + push.

### Task 3.1: `OverviewView.vue` `[parallel-batch C]`

**Files:**
- Create: `app/components/dashboard/views/OverviewView.vue`
- Modify: `app/pages/dashboard/index.vue:688-818`

Props:
```ts
defineProps<{
  scans: any[]
  doneScans: any[]
  monitors: any[]
  bulkScans: any[]
  avgScore: number | null
  bestScore: number | null
}>()
const emit = defineEmits<{
  (e: 'set-view', v: string): void
  (e: 'open-scan', scan: any): void
}>()
```

- [ ] **Step 1**: Move template lines 688-818 into the new file's `<template>`.
- [ ] **Step 2**: Move `ds-stat-*`, `ds-card-action`, `ds-stat-link`, `ds-stat-delta`, and any other ds-rules referenced only inside this template from `<style>` to component-scoped `<style>`.
- [ ] **Step 3**: Replace source lines 688-818 with the component invocation.
- [ ] **Step 4**: Verify in browser — switch to Overview, confirm stats render, "see all" links work.
- [ ] **Step 5**: Commit `refactor(dashboard): extract OverviewView` + push.

### Task 3.2: `ScanView.vue` `[parallel-batch C]`

**Files:**
- Create: `app/components/dashboard/views/ScanView.vue`
- Modify: `app/pages/dashboard/index.vue:819-874`

Props: `{ scanning: boolean }`. Emits: `{ (e: 'submit', url: string): void }`. The `<ScanInput />` component already exists at `app/components/ScanInput.vue` — reuse it inside this view rather than duplicating its markup.

Steps 1-5 follow the Phase 3 pattern.

### Task 3.3: `HistoryView.vue` `[parallel-batch C]`

**Files:**
- Create: `app/components/dashboard/views/HistoryView.vue`
- Modify: `app/pages/dashboard/index.vue:875-915`

Props:
```ts
defineProps<{
  scans: any[]
  isMonitored: (url: string) => boolean
}>()
const emit = defineEmits<{
  (e: 'open-scan', scan: any): void
  (e: 'delete-scan', scanId: string, ev: Event): void
  (e: 'rescan', url: string, ev: Event): void
  (e: 'toggle-monitor', url: string, ev: Event): void
}>()
```

`historySearch` and `filterStatus` are **local refs inside `HistoryView.vue`** — not props, not emits. The parent dashboard never reads them, so they must not round-trip through `v-model`. The `filteredScans` computed also lives inside the component, derived from `props.scans`, `historySearch`, and `filterStatus`. After this task these refs are removed from `index.vue`.

Steps 1-5 per pattern.

### Task 3.4: `ToolsView.vue` `[parallel-batch C]`

**Files:**
- Create: `app/components/dashboard/views/ToolsView.vue`
- Modify: `app/pages/dashboard/index.vue:1390-1479`

Props: `{ }` (none — fully self-contained: imports `allTools`, `toolPillars` from `~/lib/dashboard/tools`, owns its own `toolsFilter` ref). Emits: `{ (e: 'open-tool', slug: string): void }`.

Move `toolsFilter`, `toolsFiltered`, `toolsFeatured`, `toolsRest`, `toolsPillarCount` from `index.vue` into this component. They are removed from the dashboard's script.

Steps 1-5 per pattern.

> **Verification gate after batch C:** Overseer must visit each of Overview/Scan/History/Tools in the browser and confirm zero console errors before proceeding to batch D. Mark all four tasks complete in TodoWrite as a single batch.

### Task 3.5: `CompareView.vue` `[parallel-batch D]`

**Files:**
- Create: `app/components/dashboard/views/CompareView.vue`
- Modify: `app/pages/dashboard/index.vue:916-950`

Props: `{ recentComparisons: any[] }`. Emits: `{ (e: 'submit', urlA: string, urlB: string): void }`.

Move `compareUrlA`, `compareUrlB`, `submitCompare` into the component (the component does the `router.push` directly via `useRouter()`).

### Task 3.6: `BulkView.vue` `[parallel-batch D]`

**Files:**
- Create: `app/components/dashboard/views/BulkView.vue`
- Modify: `app/pages/dashboard/index.vue:951-990`

Props: `{ bulkScans: any[] }`. No emits (links navigate via NuxtLink directly, or emit `set-view` if needed).

### Task 3.7: `ChartsView.vue` `[parallel-batch D]`

**Files:**
- Create: `app/components/dashboard/views/ChartsView.vue`
- Modify: `app/pages/dashboard/index.vue:991-1213`

Props:
```ts
defineProps<{
  scans: any[]
  doneScans: any[]
  scansPerDay: { label: string; count: number }[]
  scoreDistribution: { label: string; count: number; pct: number; color: string }[]
  avgPillarScores: { name: string; score: number; color: string }[]
  topSites: { url: string; count: number; latestScore: number | null }[]
  urlCharts: any[]
}>()
const emit = defineEmits<{ (e: 'open-chart', url: string): void }>()
```

`scansPerDay`, `avgPillarScores`, `scoreDistribution`, `topSites`, `urlCharts` (lines 384-454 in source) MOVE INTO this component as local computed (the dashboard never uses them except for this view). After this task they are deleted from `index.vue`. Imports `useChartGeometry` for SVG paths.

### Task 3.8: `ChartDetailView.vue` `[parallel-batch D]`

**Files:**
- Create: `app/components/dashboard/views/ChartDetailView.vue`
- Modify: `app/pages/dashboard/index.vue:1215-1389`

Props:
```ts
defineProps<{
  url: string | null
  scans: any[]
}>()
```

`chartDetailScans`, `chartDetailLatest`, `chartDetailPillars` (lines 477-495) move into this component as computed driven by the `url` prop. Imports `useChartGeometry` for `cdX/cdY/cdPolyline/cdAreaPath` and the `CD_*` constants. The scan log table near the bottom (which is also rendered in chart-detail) becomes a small inline subcomponent inside this file — do NOT extract `ScanResultLog` separately yet (that comes from the result view in Task 3.10).

> **Verification gate after batch D:** Same as batch C — overseer visits each view in the browser.

### Task 3.9: `ToolDetailView.vue` `[serial]`

**Files:**
- Create: `app/components/dashboard/views/ToolDetailView.vue`
- Modify: `app/pages/dashboard/index.vue:1480-1496`

Props: `{ slug: string | null }`. Internally imports `toolComponentMap` from `~/lib/dashboard/toolComponentMap` and renders `<component :is="toolComponentMap[slug]" />`. Only `currentToolComponent` (source line 278) lives here — **`currentToolMeta` stays in `useDashboardView`** because the topbar (rendered from the page shell, not this component) reads it via `topbarInfo`.

### Task 3.10: `ResultView.vue` + result subcomponents `[serial — biggest single task, must be split into sub-steps]`

**Files:**
- Create: `app/components/dashboard/views/ResultView.vue`
- Create: `app/components/dashboard/result/ScanResultHeader.vue`
- Create: `app/components/dashboard/result/ScanResultScores.vue`
- Create: `app/components/dashboard/result/ScanResultToolCards.vue`
- Create: `app/components/dashboard/result/ScanResultIssues.vue`
- Modify: `app/pages/dashboard/index.vue:1497-1807` (replace with `<ResultView :scan="view.selectedScan.value" @rescan="..." @delete="..." @back="..." />`)

This task is **dispatched as 5 sub-tasks**, not one. The overseer dispatches them serially (each sub-task depends on the previous so the ResultView wrapper compiles).

#### Task 3.10a: `ScanResultHeader.vue` (source: 1536-1579)

Props:
```ts
defineProps<{ scan: any }>()
const emit = defineEmits<{
  (e: 'rescan'): void
  (e: 'delete'): void
  (e: 'share'): void
}>()
```

Renders the mini score ring, URL + meta block, and the actions row (Re-scan, Delete, Share buttons). Move all related ds-* CSS into component scope.

#### Task 3.10b: `ScanResultScores.vue` (source: 1580-1601)

Props: `{ scan: any }`. Renders the per-pillar score strip. Move the ds-score-* styles.

#### Task 3.10c: `ScanResultToolCards.vue` (source: 1611-1644)

Props:
```ts
defineProps<{
  toolCards: { tool: any; count: number; hasCritical: boolean }[]
}>()
const emit = defineEmits<{ (e: 'open-tool', slug: string): void }>()
```

The `resultToolCards` computed (source line 326) moves into the parent `ResultView.vue` and is passed in as a prop. Move ds-tool-card-* styles.

#### Task 3.10d: `ScanResultIssues.vue` (source: 1645-1807)

Props:
```ts
defineProps<{
  issues: any[]
  activeTab: string
  severityGroups: { critical: any[]; warning: any[]; pass: any[] }
  collapsedGroups: Set<string>
  expandedIssues: Set<string>
  toolLinks: Record<string, string>
}>()
const emit = defineEmits<{
  (e: 'update:activeTab', v: string): void
  (e: 'toggle-issue', title: string): void
  (e: 'toggle-group', key: string): void
}>()
```

> **Step note:** `issueTabCount` (source line 351) is a pure function over `issues` — make it a local helper function inside `ScanResultIssues.vue`. It is NOT an emit (Vue emits don't return values). Same for `pillarColor`. Both move into this component as private helpers, not part of the component's public contract.

#### Task 3.10e: `ResultView.vue` wrapper

Props:
```ts
defineProps<{ scan: any }>()
const emit = defineEmits<{
  (e: 'rescan', url: string): void
  (e: 'delete', scanId: string): void
  (e: 'open-tool', slug: string): void
}>()
```

Owns `resultActiveTab`, `resultExpandedFix`, `resultCopied`, `resultExpandedIssues`, `resultCollapsedGroups`, `toggleResultIssue`, `toggleResultGroup`, `resultSeverityGroups`, `resultToolCards`, `resultIssues`, `shareResult` (source lines 295-366) — all move INTO this wrapper. Renders:

```vue
<template>
  <div v-if="scan?.status === 'pending' || scan?.status === 'running'">
    <!-- Scanning state from source 1502-1520 -->
  </div>
  <div v-else-if="scan?.status === 'error'">
    <!-- Error state from source 1521-1532 -->
  </div>
  <div v-else-if="scan?.status === 'done'">
    <ScanResultHeader :scan="scan" @rescan="emit('rescan', scan.url)" @delete="emit('delete', scan._id)" @share="shareResult" />
    <ScanResultScores :scan="scan" />
    <ScanResultToolCards :tool-cards="resultToolCards" @open-tool="emit('open-tool', $event)" />
    <ScanResultIssues
      :issues="scan.issues ?? []"
      :active-tab="resultActiveTab"
      :severity-groups="resultSeverityGroups"
      :collapsed-groups="resultCollapsedGroups"
      :expanded-issues="resultExpandedIssues"
      :tool-links="TOOL_LINKS"
      @update:active-tab="resultActiveTab = $event"
      @toggle-issue="toggleResultIssue"
      @toggle-group="toggleResultGroup"
    />
  </div>
</template>
```

After this task `index.vue` template lines 1497-1807 become:

```vue
<ResultView
  v-if="view.currentView.value === 'result'"
  :scan="view.selectedScan.value"
  @rescan="actions.reScan"
  @delete="actions.deleteScan"
  @open-tool="view.openTool"
/>
```

- [ ] **Verification after 3.10e:** Trigger a scan, click into the result, verify scanning/done states render, click a tool card, expand/collapse a severity group, share button copies URL. Console clean.

- [ ] **Commit each sub-task separately**, e.g. `refactor(dashboard): extract ScanResultHeader`, `... ScanResultScores`, etc.

---

## Phase 4 — CSS Migration to Tailwind

> **Strategy:** Convert each component's `ds-*` classes one component at a time. Three rules:
> 1. If a class chain repeats 3+ times in the same template, define it via `@apply` in the same component's `<style scoped>`.
> 2. If a class is used once, inline it as Tailwind utilities and delete the rule.
> 3. Custom shadows / colors that already exist in `tailwind.config.ts` (`shadow-glow-*`, `bg-dark-*`, `text-primary`, etc.) take precedence over `@apply` — use them directly.

> **Shared CSS audit first:** Before starting Task 4.2, read `app/assets/css/main.css` in full. If any `ds-*` class or similar dashboard-specific rule lives there, list it in `docs/superpowers/plans/2026-04-16-dashboard-audit.md` under a new heading "Shared CSS" and decide: keep (if used outside the dashboard), inline to the component (if used only in one place), or delete (if unused). Do this audit as Task 4.1.5 (implicit, no separate subagent — overseer reads the file in one pass).

> **Verification:** See Task 4.1 for the chosen approach (optional screenshots OR eye-check). Ask the user to confirm parity if anything looks off after migrating a component.

### Task 4.1: Baseline visual reference `[serial — overseer-only, OPTIONAL]`

The user has disabled preview-based verification (see `feedback_no_preview.md`). This task offers a lightweight baseline without forcing manual screenshot capture.

- [ ] **Option A (preferred, zero friction):** Skip baseline capture entirely. Per-component verification in Task 4.2 – 4.13 becomes "overseer asks user to eye-check the migrated view against its prior state and report any drift." Any regression is fixed in the same task's commit.
- [ ] **Option B (only if the user opts in):** The user takes 10 screenshots (one per view) at `http://localhost:3000/dashboard` with their extension and saves them to `docs/dashboard-mockups/baseline-2026-04-16/`. Per-component verification then compares visually against those files.
- [ ] Record the chosen option at the top of `docs/superpowers/plans/2026-04-16-dashboard-audit.md` so later tasks reference the correct flow.
- [ ] Do NOT call `preview_screenshot` or any preview_* tool — those are disabled by user preference.

### Task 4.2 – 4.13: Per-component Tailwind migration

Per Coordination Rule 2 the cap is 4 concurrent subagents. Components that share styles (the two shell pieces, sidebar + topbar) are batched together. Views that share significant layout patterns (overview/scan/history/tools; compare/bulk/charts/chart-detail) are batched together. The result cluster runs alone because it touches 5 files.

- 4.2 `DashboardSidebar.vue`       `[parallel-batch E]`
- 4.3 `DashboardTopbar.vue`        `[parallel-batch E]`
- 4.4 `OverviewView.vue`           `[parallel-batch F]`
- 4.5 `ScanView.vue`               `[parallel-batch F]`
- 4.6 `HistoryView.vue`            `[parallel-batch F]`
- 4.7 `ToolsView.vue`              `[parallel-batch F]`
- 4.8 `CompareView.vue`            `[parallel-batch G]`
- 4.9 `BulkView.vue`               `[parallel-batch G]`
- 4.10 `ChartsView.vue`            `[parallel-batch G]`
- 4.11 `ChartDetailView.vue`       `[parallel-batch G]`
- 4.12 `ToolDetailView.vue`        `[serial]`
- 4.13 `ResultView.vue` and its 4 result sub-components (one task; they share the same design language) `[serial]`

> **Per-task + batch gate (Rule 4):** each task gets its own verify (overseer reads the diff and eyeballs the migrated view). After a batch completes, one additional cross-cutting smoke-pass of all views in that batch before dispatching the next batch.

Each task follows this template:

- [ ] **Step 1**: Read the component's `<template>` and `<style scoped>` blocks.
- [ ] **Step 2**: For every `ds-*` class in the template, find its rule in `<style>`, translate the rule to a Tailwind utility chain, and replace the class binding with the utilities. If the rule uses one of: `border-radius: 16px` → `rounded-card`; `background: rgba(255,255,255,0.05)` → `bg-white/5`; `color: rgba(255,255,255,0.4)` → `text-white/40`; `box-shadow: 0 0 20px rgba(...)` → `shadow-glow-*` (match the color to the existing token); else use the closest Tailwind utility.
- [ ] **Step 3**: If a chain repeats 3+ times in this file, define it via `@apply` under a single class in the component's remaining `<style scoped>` block.
- [ ] **Step 4**: Delete every `ds-*` rule that was inlined.
- [ ] **Step 5**: Refresh the browser, switch to this view, visually compare against the baseline screenshot from Task 4.1.
- [ ] **Step 6**: Commit `style(dashboard): tailwind-migrate <ComponentName>` + push.

### Task 4.14: Strip remaining ds-* CSS from `app/pages/dashboard/index.vue` `[serial — last]`

- [ ] **Step 1**: After 4.2–4.13, the source `<style scoped>` block (lines 1809-2616) should contain only rules for `ds-shell`, `ds-main`, `ds-content` and any wrapper-level styles still used in the page-level template.
- [ ] **Step 2**: Convert these to Tailwind on the wrapper elements in the page template.
- [ ] **Step 3**: Delete the entire `<style scoped>` block.
- [ ] **Step 4**: Verify — refresh dashboard, navigate every view, no visual regression.
- [ ] **Step 5**: Commit `style(dashboard): remove final ds-* scoped CSS` + push.

---

## Phase 5 — Obsolete Page Removal

### Task 5.0: Add `?view=` query parsing to `useDashboardView` `[serial — must land before 5.1]`

**Files:** Modify `app/composables/dashboard/useDashboardView.ts`.

Rationale: Task 5.1 rewrites inbound links to use `/dashboard?view=<name>`, but this convention does not yet exist in the composable. This small task adds it first so 5.1 has something to link to.

- [ ] **Step 1**: In `useDashboardView`, on mount, parse `useRoute().query.view` and call `setView(v)` when the value matches a known `View`. Also watch `useRoute().query.view` so client-side nav (e.g. from a sidebar `NuxtLink to="/dashboard?view=history"`) still triggers `setView`. Example (5 lines):

```ts
const route = useRoute()
const applyQueryView = () => {
  const q = route.query.view
  if (typeof q === 'string' && VIEWS.includes(q as View)) setView(q as View)
}
onMounted(applyQueryView)
watch(() => route.query.view, applyQueryView)
```

- [ ] **Step 2**: Verify — in the browser, navigate to `http://localhost:3000/dashboard?view=history` and confirm the History view is selected. Then `?view=charts`, `?view=compare`, `?view=bulk`. Console clean.
- [ ] **Step 3**: Commit `feat(dashboard): accept ?view= query param for direct-link deep navigation` + push.

### Task 5.1: Rewrite inbound links per audit `[serial — depends on 5.0]`

**Files:** Per the audit doc from Task 0.1, every file in the `REWRITE-LINKS-FIRST` column.

- [ ] **Step 1**: For each file, replace links as follows (using the `?view=` convention from Task 5.0):
  - `to="/results"` → `to="/dashboard"` (if it was a plain index link) or `to="/dashboard?view=history"` (if it was opening the list)
  - `to="/history"` → `to="/dashboard?view=history"`
  - `to="/compare"` → `to="/dashboard?view=compare"`
  - `to="/bulk-scan"` → `to="/dashboard?view=bulk"`
  - Same substitutions for `navigateTo(...)`, `router.push(...)`, and `href="..."` forms.
- [ ] **Step 2**: Verify each rewritten link in the browser by clicking through. Confirm the correct view opens.
- [ ] **Step 3**: Commit `refactor: redirect legacy dashboard routes to /dashboard` + push.

### Task 5.2: Delete confirmed-orphan pages `[serial]`

For each page marked DELETE in the audit:

- [ ] **Step 1**: `git rm app/pages/<path>.vue`
- [ ] **Step 2**: Run `npx vue-tsc --noEmit` — confirm no broken imports.
- [ ] **Step 3**: Refresh browser, navigate to the deleted route, confirm 404 (Nuxt's default error page).
- [ ] **Step 4**: Commit `chore: remove obsolete <route> page (superseded by dashboard view)` + push. One commit per deleted page.

### Task 5.3: Audit `app/components/` for now-unused components `[serial]`

- [ ] **Step 1**: For each component in `app/components/` (excluding ones we just created under `dashboard/`), grep the codebase for inbound usage (template `<ComponentName />`, explicit imports, dynamic `defineAsyncComponent(() => import(...))`, and string references in `nuxt.config.ts` / `components.dirs`).
- [ ] **Step 2**: Append findings to `docs/superpowers/plans/2026-04-16-dashboard-audit.md` under a new heading "Phase 5.3 unused-component audit" — one row per component: name, usage count, recommendation (KEEP / PROPOSE-DELETE). Do NOT edit this plan file.
- [ ] **Step 3**: Surface the `PROPOSE-DELETE` list to the user. Wait for go/no-go before deleting (Nuxt auto-import and indirect dynamic imports can hide references that grep misses).
- [ ] **Step 4** (conditional): Delete confirmed-unused components. One commit per component.

---

## Phase 6 — Final Verification

### Task 6.1: Build check `[serial]`

- [ ] **Step 1**: Run `npx nuxt build` (NOT `npm run dev`). This is the **authoritative production-build gate** and is mandatory — a successful build is the only way to close out the refactor. Expected: build succeeds with no type errors and no Nuxt/Vite warnings about missing components, unresolved imports, or scoped-style leaks.
- [ ] **Step 2** (supplemental, not a substitute): Run `npx vue-tsc --noEmit` as a faster signal during iteration. If `vue-tsc` is clean but `nuxt build` fails, the build is still the source of truth — do not skip it.
- [ ] **Step 3**: If the build fails, the failing subagent must NOT mark the task complete — surface errors to the overseer for triage.

### Task 6.2: Line-count check `[serial]`

- [ ] **Step 1**: Run `wc -l app/pages/dashboard/index.vue`.
Expected: < 300 lines.
If above 300, identify the largest remaining concern and either (a) extract one more component, or (b) document why the lines are unavoidable in this plan file.

### Task 6.3: End-to-end click-through `[serial — overseer-only]`

- [ ] **Step 1**: Refresh `http://localhost:3000/dashboard`. Click through every sidebar item, every "see all" link, every back button. For each of the 9 view modes, perform one realistic action (start a scan, open a result, expand an issue group, click a tool card, etc.).
- [ ] **Step 2**: Watch the browser console (via the user's Chrome extension) for new errors.
- [ ] **Step 3**: Compare the dashboard against the Phase 4 baseline screenshots — flag any visual regression to the user.
- [ ] **Step 4**: Confirm the file structure on disk matches the target in this plan's "File Structure" section.

### Task 6.4: Final commit and summary `[serial — overseer-only]`

- [ ] **Step 1**: If the working tree is clean, write a final summary commit message (no code change, just a summary note in `docs/superpowers/plans/2026-04-16-dashboard-refactor.md` updating the header to `**Status: Complete**`).
- [ ] **Step 2**: Commit `docs: dashboard refactor complete` + push.
- [ ] **Step 3**: Surface the final summary to the user: line count before/after, list of deleted pages, list of created components, list of remaining open questions (e.g. proposals from Task 5.3 awaiting confirmation).

---

## Self-Review (overseer's pre-execution checklist)

Before dispatching Task 0.1, the overseer confirms:

- [ ] All 9 dashboard views are accounted for in Phase 3 (overview, scan, history, compare, bulk, charts, chart-detail, tools, tool-detail, result) ✓
- [ ] Every script-setup symbol from the source is assigned to a composable, view component, or explicitly retained in `index.vue` ✓
- [ ] No task contains a placeholder ("TBD", "implement later", "add appropriate error handling") ✓
- [ ] Every task has explicit file paths ✓
- [ ] Every task ends with a commit step ✓
- [ ] Every task has a verification gate that does not require running `npm run dev` ✓
- [ ] The 4-subagent cap is enforced via `[parallel-batch]` annotations (including Phase 4 batches E / F / G) ✓
- [ ] CLAUDE.md read mandate appears in the Coordination Rules ✓
- [ ] No automatic memory write or security-auditor dispatch is scheduled ✓
- [ ] `useScanActions` signature and `index.vue` wiring both show the `onScanCreated` callback — no placeholder `watch` blocks remain ✓
- [ ] `currentToolMeta` is declared as a return of `useDashboardView`, not moved into `ToolDetailView` ✓
- [ ] `HistoryView` owns `historySearch` / `filterStatus` locally — not as props / emits ✓
- [ ] No Vue emit declares a return type (emits are fire-and-forget by design) ✓
- [ ] Task 5.0 (`?view=` parsing) lands before Task 5.1 (link rewrites) ✓
- [ ] `nuxt build` is the authoritative gate in Task 6.1; `vue-tsc` is supplemental ✓
- [ ] Task 4.1 does not force manual screenshot capture on the user ✓

If any item above is unchecked when execution starts, fix the plan first.
