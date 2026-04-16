# Dashboard Refactor Audit — 2026-04-16

## Route Classification

| Route | Status | Files to Update |
|-------|--------|-----------------|
| `app/pages/results/index.vue` | **DELETE** | `app/pages/bulk-scan/[id].vue:237`, `app/pages/history/index.vue:116` must be rewritten first |
| `app/pages/history/index.vue` | **DELETE** | `app/pages/bulk-scan/[id].vue:237` must be rewritten first |
| `app/pages/compare/index.vue` | **DELETE** | No external links to update — links in this file are self-referential |
| `app/pages/compare/[scanIdA]/[scanIdB].vue` | **DELETE** | No external links to update |
| `app/pages/bulk-scan/index.vue` | **DELETE** | No external links to update |
| `app/pages/bulk-scan/[id].vue` | **DELETE** | No external links to update |

**Pages confirmed KEEP (not deleted):**
- `app/pages/share/[id].vue` — public share page. Reads scan data directly from Convex. Does NOT navigate to `/results`, `/compare`, or `/bulk-scan` routes for its rendering. No CTA in this page links to any candidate-obsolete route.
- `server/routes/og/scan.ts` — OG image generator reads query params only (`url`, `score`). Does not scrape or depend on any `/results/*`, `/compare/*`, or `/bulk-scan/*` route.

**Pages with `/results` in marketing/demo content (KEEP):**
- `app/pages/index.vue:730` — `"scanpulse.io/results/stripe.com"` appears in demo/example text on the landing page. This is static UI copy, not a live link to the results page. No action needed.

## Inbound Link Detail

### `/results`
- `app/pages/bulk-scan/[id].vue:237` — `@click="scan.status === 'done' && $router.push(\`/results?scanId=${scan._id}\`)"` — **internal-only** — this is inside `BulkScan` page which is itself a candidate for deletion. Must be rewritten to `/dashboard?view=history` before `results/index.vue` is deleted.
- `app/pages/history/index.vue:116` — `router.push(\`/results?id=${scanId}\`)` — **internal-only** — this page (`history/index.vue`) is also a DELETE candidate. Must be rewritten to `/dashboard?view=history` (via parent dashboard) before both are deleted.

### `/history`
- No files link to `/history`. The page `history/index.vue` itself uses `navigateTo` or `router.push` but there are no inbound links from outside. **DELETE.**

### `/compare`
- `app/pages/dashboard/index.vue:903` — `<NuxtLink :to="\`/compare/${c.scanIdA}/${c.scanIdB}\`">` — **internal-only** (dashboard sidebar or nav). Rewrites to `/dashboard?view=compare` plus `?scanIdA=...&scanIdB=...` query params or just the view switch; the detail page is also deleted.
- `app/pages/compare/index.vue:67`, `173` — self-referential dead links inside the same page. **DELETE.**
- `app/pages/compare/[scanIdA]/[scanIdB].vue:141` — `<NuxtLink to="/compare">` — dead link inside the DELETE candidate page. **DELETE.**

### `/bulk-scan`
- `app/pages/dashboard/index.vue:923`, `928`, `931` — internal-only dashboard links (`<NuxtLink to="/bulk-scan">` and `<NuxtLink :to="\`/bulk-scan/${b._id}\`">`). Rewrites to `/dashboard?view=bulk` and `/dashboard?view=bulk&bulkId=...` respectively.
- `app/pages/bulk-scan/index.vue:87` — `router.push(\`/bulk-scan/${bulkScanId}\`)` — self-referential dead link inside DELETE candidate. **DELETE.**

## Dashboard Views (source line ranges in `app/pages/dashboard/index.vue`)

| View | Lines | Target Component |
|------|-------|-----------------|
| `overview` | ~688–818 | `OverviewView.vue` |
| `scan` | ~819–874 | `ScanView.vue` |
| `history` | ~875–915 | `HistoryView.vue` |
| `compare` | ~916–950 | `CompareView.vue` |
| `bulk` | ~951–990 | `BulkView.vue` |
| `charts` | ~991–1213 | `ChartsView.vue` |
| `chart-detail` | ~1215–1389 | `ChartDetailView.vue` |
| `tools` | ~1390–1479 | `ToolsView.vue` |
| `tool-detail` | ~1480–1496 | `ToolDetailView.vue` |
| `result` | ~1497–1807 | `ResultView.vue` + sub-components |

## Script-Setup Symbol Map

| Symbol | Type | Destination |
|--------|------|-------------|
| `scans`, `monitors`, `bulkScans` | Ref | `useDashboardData` |
| `convexUser`, `urlSparklines`, `recentComparisons` | Ref | `useDashboardData` |
| `loadUserData`, ws subscriptions | Function/Setup | `useDashboardData` |
| `pushRecentComparison` | Function | `useDashboardData` |
| `scanning` | Ref | `useScanActions` |
| `handleScan`, `deleteScan`, `reScan`, `toggleMonitor` | Function | `useScanActions` |
| `isMonitored` | Function | `useScanActions` |
| `currentView`, `selectedScan`, `selectedTool`, `selectedChartUrl` | Ref | `useDashboardView` |
| `setView`, `openScan`, `openScanByUrl`, `openChartDetail`, `openTool` | Function | `useDashboardView` |
| `dashboardNavigate`, `provide` | Function | `useDashboardView` |
| `currentToolMeta`, `topbarInfo` | Computed | `useDashboardView` |
| `toolsExpanded` | Ref | `useDashboardView` |
| `scoreColor`, `scoreBg`, `statusLabel`, `relativeTime`, `faviconUrl`, `hostname` | Function | `useScoreFormat` |
| `trendColor` | Function | `useScoreFormat` |
| `scoreTrend` | Function | `useScoreTrend` (uses `scans` ref) |
| `chartSvgPoints`, `chartAreaPath`, `chartDotX`, `chartDotY` | Function | `useChartGeometry` |
| `cdX`, `cdY`, `cdPolyline`, `cdAreaPath`, `shortDate`, CD_* constants | Function/Const | `useChartGeometry` |
| `TOOL_LINKS`, `PILLAR_COLORS`, `allTools`, `toolPillars` | Const | `lib/dashboard/tools.ts` |
| `toolComponentMap` | Const | `lib/dashboard/toolComponentMap.ts` |

## Shared CSS Audit (Phase 4.1)

*To be filled during Phase 4 execution — overseer reads `app/assets/css/main.css` in full before Task 4.2.*

## Baseline Visual Reference (Task 4.1)

**Chosen option: Option A** — Skip baseline capture. Per-component verification in Tasks 4.2–4.13 is "overseer asks user to eye-check the migrated view against its prior state and report any drift." Any regression is fixed in the same task's commit.

## Verification Baseline

- [x] All 6 candidate DELETE pages classified
- [x] `share/[id].vue` confirmed KEEP (does not depend on obsolete routes)
- [x] `server/routes/og/scan.ts` confirmed KEEP (reads Convex directly)
- [x] All 10 dashboard views mapped to source line ranges
- [x] All script-setup symbols assigned to target composables
