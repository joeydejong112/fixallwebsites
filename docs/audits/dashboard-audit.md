# Dashboard Deep Audit Report

**Scope**
- `app/pages/dashboard/index.vue`
- `app/components/dashboard/views/*.vue`
  - `BulkView.vue`, `ChartDetailView.vue`, `ChartsView.vue`, `CompareView.vue`, `HistoryView.vue`, `OverviewView.vue`, `ScanView.vue`, `ToolDetailView.vue`, `ToolsView.vue`

**Audit axes:** Bugs · Security · Best Practices · Performance · Coding Standards · Accessibility · UX/UI

**Severity legend**
- 🔴 **CRITICAL** — Broken, blocks merge / invalid HTML / XSS surface / data loss
- 🟠 **HIGH** — Real bug, usability regression, or standard violation
- 🟡 **MEDIUM** — Maintainability, performance, or consistency concern
- 🔵 **LOW** — Polish, style, micro-optimization

---

## 1. `app/pages/dashboard/index.vue`

### 🔴 CRITICAL

#### C1 — `selectedChartUrl` referenced un-namespaced in template
Line 241 and the entire `chart-detail` template block reference `selectedChartUrl` directly, but in the script only `view.selectedChartUrl.value` exists. The condition `v-else-if="view.currentView.value === 'chart-detail' && selectedChartUrl"` will always evaluate the right operand as `undefined` → the entire chart-detail view is unreachable.

**Fix:** Replace every bare `selectedChartUrl` with `view.selectedChartUrl.value` (or `view.selectedChartUrl` in the template, since template auto-unwraps refs).

```diff
- v-else-if="view.currentView.value === 'chart-detail' && selectedChartUrl"
+ v-else-if="view.currentView.value === 'chart-detail' && view.selectedChartUrl"
...
- :src="faviconUrl(selectedChartUrl)!"
+ :src="faviconUrl(view.selectedChartUrl)!"
```

Apply to lines 241, 248, 249, 252, 253, 271.

#### C2 — `cdX`, `cdY`, `cdAreaPath`, `cdPolyline`, `shortDate` are undefined in template
Line 35: `const geom = useChartGeometry()`. The template (lines 284, 289, 294, 305, 315, 324, 331) uses bare identifiers `cdX`, `cdY`, `cdAreaPath`, `cdPolyline`, `shortDate` — they are not destructured and not assigned to the component scope. Chart rendering will throw `ReferenceError` at runtime.

**Fix:** Destructure the helpers:
```ts
const { cdX, cdY, cdAreaPath, cdPolyline, shortDate, CD_W, CD_H, CD_PL, CD_PR, CD_GRID } = useChartGeometry()
```
Then remove the redundant `import { CD_W, CD_H, ... }` if those are also exported from the composable, or keep the constant imports but drop `const geom = ...`.

#### C3 — Type cast on dynamic key access is a lie
Line 79: `chartDetailScans.value.map(s => s[`${key}Score` as 'securityScore'] as number)` — the `as 'securityScore'` cast is fabricated to shut up TS. If `key === 'ai'`, actual key is `aiScore`, which TS then thinks is `securityScore`. Works at runtime only because the literal happens to exist, but the type system is actively misleading.

**Fix:**
```ts
const PILLAR_KEY_MAP = {
  security: 'securityScore',
  performance: 'performanceScore',
  seo: 'seoScore',
  accessibility: 'accessibilityScore',
} as const satisfies Record<typeof PILLAR_KEYS[number], keyof Scan>
```
Then `s[PILLAR_KEY_MAP[key]]`.

### 🟠 HIGH

#### H1 — Duplicate filter on every render (Previous scans list)
Lines 438 and 442: the same `data.scans.value.filter(...)` is computed twice per render — once for `v-if` and once for the `v-for`. Any scan-list mutation triggers two O(n) traversals.

**Fix:** Memoize:
```ts
const previousScansOfSelected = computed(() => {
  const target = view.selectedScan.value
  if (!target) return []
  return data.scans.value.filter(s => s.url === target.url && s._id !== target._id)
})
```

#### H2 — Dead/unused code in page script
- Line 34 `scoreTrend` destructured but never used in this file.
- Lines 38, 90, 91 `router`, `compareUrlA`, `compareUrlB`, `submitCompare` are defined but have no template bindings (CompareView has its own copies).
- Line 84–88 `toolsFilter`, `toolsFiltered`, `toolsFeatured`, `toolsRest`, `toolsPillarCount` duplicate logic already in `ToolsView.vue`.

**Fix:** Delete unused locals; page should only orchestrate views, not duplicate their state.

#### H3 — `any` casts proliferate through the template
Occurrences: `(s:any)` on lines 289, 294, 396, 438, 442. Any schema change silently stops type-checking.

**Fix:** Import the Convex `Doc<'scans'>` type (or export a shared `DashboardScan` alias from `~/types/dashboard.ts`) and remove all `: any`.

#### H4 — SVG chart has no accessible name
Lines 281 and per-point `<text>` nodes form a full chart with no `role="img"`, `aria-label`, `<title>`, or `<desc>`. Screen readers announce it as "image" with no context.

**Fix:**
```html
<svg role="img" :aria-label="`Overall score history for ${hostname(view.selectedChartUrl)}`" ...>
  <title>Overall score over time</title>
  <desc>{{ chartDetailScans.length }} data points, latest {{ chartDetailLatest?.overallScore }}</desc>
  ...
</svg>
```

#### H5 — `grid-cols-4` layouts break on narrow viewports
Lines 136, 139 — stat grid uses 4 columns with no responsive variants. Below ~900 px, content overflows horizontally.

**Fix:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.

#### H6 — Fixed `h-screen` + `pt-[62px]` magic number couples layout to navbar height
Line 98. If `NavBar` height changes, content clips. Use CSS variable `--nav-h` set on `NavBar` and consumed here.

#### H7 — Watch with `immediate:true` may fire with `userId=null`
Line 93: `watch(userId, id => { if (id) data.loadUserData(id) }, { immediate: true })` — guard present, so OK, but on sign-out (`id → null`) there's no cleanup of existing scans. Stale data persists between users.

**Fix:** Add `if (!id) data.clearUserData()` branch in the watcher.

### 🟡 MEDIUM

#### M1 — Inline `reduce`/`Math.max`/`.filter` chains in computed
Lines 48, 49, 51–55, 57–65 build maps and sort on every reactivity tick. At 500+ scans this becomes noticeable.

**Fix:** Use a single-pass accumulator or memoize via `computedWithControl`.

#### M2 — `bulk scan` view duplicates `BulkView.vue`
Lines 182–212 inline the bulk-scan UI instead of using `<BulkView :bulk-scans="data.bulkScans.value" />`. Two places to maintain.

#### M3 — Chart-detail hero: delta arrow direction only accounts for +/- sign
Line 265–266 compares `latest >= first`. If equal, shows "↑0" — misleading. Should show "→0" or omit.

#### M4 — `chartDetailScans[chartDetailScans.length-1]` accessed without bounds guard inside `v-if`
Works because of `v-if="chartDetailScans.length >= 2"` on the parent `<div>`, but the nested hero card (line 255–269) is not wrapped — the per-site delta uses a separate `v-if`. Still fine, but the repeated `.length - 1` indexing is hard to scan.

**Fix:** Compute `first`, `last` in script.

#### M5 — `style="height:82px"` and `style="height:240px"` next to Tailwind classes
Lines 137, 140, 141. Mix `h-[82px]`/`h-[240px]` utility classes or Tailwind JIT arbitrary values; don't mix inline style + class.

#### M6 — Back button doesn't handle 'chart-detail' → 'chart' cleanly
`handleBack()` flows `chart-detail → charts`, but if the user deep-links to chart-detail without a history stack, "back" still lands on `history`. Consider a crumb stack (`view.pushView` / `view.popView`).

### 🔵 LOW

- **L1:** Chart grid Y labels (0, 50, 100) are hardcoded into `CD_GRID` — fine, but should be exported as `CD_GRID_LABELS` so text formatting is uniform across detail/overview charts.
- **L2:** `whitespace-nowrap max-w-[300px]` on truncated URL (line 253) — `truncate` is shorter and sets all three properties.
- **L3:** The `PILLAR_KEYS` tuple and `PILLAR_LABELS` record should live in `~/lib/dashboard/pillars.ts` and be shared with `OverviewView`, `ChartsView`, `ChartDetailView`.

---

## 2. `app/components/dashboard/views/OverviewView.vue`

### 🟠 HIGH

#### H1 — Props typed as `any[]`
Lines 5–8: `scans: any[]`, `doneScans: any[]`, `monitors: any[]`, `bulkScans: any[]`. Typed backbone required; this is the highest-traffic view.

**Fix:** Define shared interfaces (or import Convex `Doc` types):
```ts
defineProps<{
  scans: Scan[]
  doneScans: Scan[]
  monitors: Monitor[]
  bulkScans: BulkScan[]
  ...
}>()
```

#### H2 — Favicon `<img>` missing `alt`
Line 98: `<img v-if="faviconUrl(scan.url)" :src="..." ... />` — no `alt` attribute. Screen readers announce filename. Must include `alt=""` (decorative) since the domain text is adjacent.

#### H3 — "Low Score Sites" double-counts and has a semantic bug
Line 50:
```ts
doneScans.filter(s => (s.overallScore ?? 100) < 60).length + scans.filter(s => s.status === 'error').length
```
- Fallback `?? 100` means "null score = passing" — wrong. If `status === 'done'` but `overallScore` is null, that's an error case, not a pass. Use `?? 0` or exclude null scores.
- Error scans that already finished as done-with-low-score could double-count if someone re-classifies.

**Fix:**
```ts
const low = doneScans.filter(s => typeof s.overallScore === 'number' && s.overallScore < 60).length
const errored = scans.filter(s => s.status === 'error').length
return low + errored
```

#### H4 — `animate-ping` on every running scan (line 212)
Continuous infinite animation, ignores `prefers-reduced-motion`.

**Fix:**
```css
@media (prefers-reduced-motion: reduce) {
  .ds-scan-running { animation: none; }
}
```

#### H5 — Activity dot color palette inconsistent with the rest of the app
Line 152: `'bg-[rgba(255,71,87,...)] text-[#ff4757]'`-style literals hardcoded. Tailwind has the `danger` token already. Use design tokens.

### 🟡 MEDIUM

#### M1 — `doneScansRef = computed(() => props.doneScans)` is redundant
Line 21. Props are already reactive; wrapping adds an extra computed layer with no benefit. Pass `toRef(props, 'doneScans')` instead, or hand `props.doneScans` directly to `useScoreTrend` if it accepts a getter.

#### M2 — `ds-stats-row` CSS class defined but unused
Line 170 defines `.ds-stats-row` but the template uses inline `grid grid-cols-4 gap-3.5` (line 37). Dead style.

#### M3 — `grid-cols-4` / `grid-cols-[1fr_300px]` / `grid-cols-2` never adapt
Lines 37, 180, 181 — no responsive breakpoints, mobile unusable.

#### M4 — `<button>` used for navigation
Lines 56, 64, 92, 119 are navigation, not state mutation. Should be `<NuxtLink>` with appropriate `to=""` so right-click "Open in new tab" works, URLs are shareable, and prefetch kicks in.

#### M5 — Inline style chains
Lines 127, 132, 134, 152 construct styles per-iteration. Bind via `class` tokens (`bg-warning`, `text-danger`) for fewer string concatenations per render.

### 🔵 LOW

- **L1:** `[name, val, color]` tuple iteration (line 72–80) relies on array ordering. A record with explicit keys is safer; also makes per-row TrendChart reuse trivial.
- **L2:** Empty-state hint on Monitored Sites (line 123) is too quiet at `text-white/20` — WCAG contrast fails.
- **L3:** `ds-monitor-stop` button is labeled "Stop" but toggles — label should be "Unwatch" (matches `toggleMonitor`).

---

## 3. `app/components/dashboard/views/ChartsView.vue`

### 🔴 CRITICAL

#### C1 — `v-if` and `v-for` on the same element (line 200)
```html
<button v-for="site in topSites" :key="site.url" v-if="props.openScanByUrl" ...>
```
Vue 3 explicitly forbids this combo and the ESLint rule `vue/no-use-v-if-with-v-for` flags it. At compile time, `v-if` is evaluated per iteration after `v-for`, which is both confusing and wrong (prop presence doesn't change between iterations).

**Fix:** Hoist the guard:
```html
<template v-if="props.openScanByUrl">
  <button v-for="site in topSites" :key="site.url" @click="props.openScanByUrl(site.url)" ...>
</template>
```

#### C2 — Sparkline denominator can be zero
Line 214: `(v, i, arr) => `${i / (arr.length - 1) * 60}`. When `arr.length === 1`, denominator is 0 → `NaN` → invalid SVG. Template guards on `arr.length > 1` before entering the template, but defensive code should still guard.

**Fix:**
```ts
const denom = Math.max(arr.length - 1, 1)
```

### 🟠 HIGH

#### H1 — SVG charts not accessible
All `<svg>` blocks (lines 211, 253) lack `role="img"`, `aria-label`, `<title>`, `<desc>`.

#### H2 — `bg-none` class is not real Tailwind
Lines 200, 225 use `bg-none`. Tailwind has `bg-transparent` and `bg-none` (for background-image). `bg-none` compiles only because of JIT fallback; in some configs it's a no-op.

**Fix:** `bg-transparent`.

#### H3 — Card is a div with `@click` (lines 236)
```html
<div class="... cursor-pointer" @click="openChartDetail(site.url)">
```
No `role="button"`, no `tabindex`, no `@keydown.enter/space`. Keyboard/screen-reader users can't open charts.

**Fix:** Wrap in `<button>` or add `role="button" tabindex="0" @keydown.enter="..." @keydown.space.prevent="...`.

#### H4 — Hardcoded pillar colors scattered in three places
Lines 81–87 and again in `OverviewView`, `ChartDetailView`. Pull from `~/lib/dashboard/tools.PILLAR_COLORS`.

### 🟡 MEDIUM

#### M1 — `scansPerDay` recomputes entire 14-day window on any scan mutation
Line 61. Acceptable for 14 items but uses `Date.now()` freshly — so it's not stable between renders within a minute boundary. Cache the day-bucket object if scan count unchanged.

#### M2 — `scansPerDay.reduce((max, d) => Math.max(max, d.count), 1)` inside template
Line 148 — reduce runs once per bar. Precompute `maxPerDay` in a `computed`.

#### M3 — Duplicate interfaces with page `ChartPoint`
Lines 27–36 define `ChartPoint`, `UrlChart` that the page also defines. Export from a shared module to avoid drift.

#### M4 — Empty `alt=""` on favicons (line 202, 241)
OK for decorative, but then the `<span>` fallback is also aria-silent. Add an `aria-hidden="true"` on the icon container and keep the hostname text visible.

### 🔵 LOW

- **L1:** Bar chart day labels show every other label via `i % 2 === 0` (line 150) — produces "1, 3, 5…" but on 14 days you land on "last shown is Mar 15 not today". Anchor on "show first, every 2nd, last".
- **L2:** `whitespace-nowrap overflow-hidden text-ellipsis` repeats at least 8 times → create `.truncate` utility is already there; use Tailwind `truncate`.

---

## 4. `app/components/dashboard/views/HistoryView.vue`

### 🔴 CRITICAL

#### C1 — Nested `<button>` elements (invalid HTML, screen-reader chaos)
Lines 86–129: the list row is a `<button>` and it contains three more `<button>`s (rescan / monitor / delete). HTML5 forbids interactive-in-interactive; browsers silently split the DOM and screen readers announce the wrong control.

**Fix:** Make the row an `<a>` / `<NuxtLink>` or a `<div role="button" tabindex="0">`, and keep the action cluster as real buttons outside:
```html
<div class="flex items-center ..." @click="emit('open-scan', scan)"
     role="button" tabindex="0" @keydown.enter="emit('open-scan', scan)">
  ...
  <div class="flex gap-[2px]" @click.stop>
    <button @click="emit('rescan', scan.url, $event)" aria-label="Re-scan">...</button>
    <button @click="emit('toggle-monitor', scan.url, $event)" :aria-label="isMonitored(scan.url) ? 'Stop monitoring' : 'Monitor'">...</button>
    <button @click="emit('delete-scan', scan._id, $event)" aria-label="Delete scan">...</button>
  </div>
</div>
```

#### C2 — Delete button without confirmation
Line 125: `emit('delete-scan', scan._id, $event)` fires immediately. Destructive, irreversible at data level, no undo.

**Fix:** Add a confirmation modal (PrimeVue `ConfirmDialog`) or inline "click again to confirm" pattern with a 3-second timeout.

### 🟠 HIGH

#### H1 — Privacy leak via Google favicon endpoint
Line 56: `https://www.google.com/s2/favicons?domain=...` leaks every hostname the user scans to Google, even when the user is on a privacy-sensitive audit. Fine as a default, but:
1. Proxy through `/api/favicon?url=...` with caching.
2. Or use DuckDuckGo's `icons.duckduckgo.com/ip3/{host}.ico` as a less-tracked alternative.
3. Document the choice in CLAUDE.md.

#### H2 — Invalid Tailwind pseudo-class
Line 76 (and ScanView): `hover:not(:disabled):opacity-80` is not valid Tailwind. Correct form:
```
enabled:hover:opacity-80
```
or:
```
hover:[&:not(:disabled)]:opacity-80
```
As written, the entire class is discarded by JIT, so disabled-hover visually identical to enabled.

#### H3 — Color semantics inverted
- Line 99 `'bg-primary'` for error state. `primary` is the brand pink, not danger red. Misleads users.
- Line 38–39 `scoreBg`: returns `#ec3586` (brand pink) for scores < 60. Should be `danger` (#ff4757 — already used elsewhere).

**Fix:** Standardize `scoreBg`:
```ts
if (s >= 80) return '--color-success'   // #00d4aa
if (s >= 60) return '--color-warning'   // #ffaa00
return '--color-danger'                 // #ff4757
```

#### H4 — Search input has no programmatic label
Line 64. Placeholder is not a label. Screen readers get nothing until focused.

**Fix:**
```html
<label for="history-search" class="sr-only">Search scans</label>
<input id="history-search" v-model="historySearch" ... />
```

#### H5 — Filter button group not implemented as a toggle/radio group
Lines 69–76 — buttons with active class. Should be `role="tablist"` or `role="radiogroup"` with `aria-checked`/`aria-selected`.

### 🟡 MEDIUM

#### M1 — Local helpers duplicate composable
`hostname`, `relativeTime`, `statusLabel`, `scoreBg`, `faviconUrl` are already in `useScoreFormat`. Three places to change on every logic update.

**Fix:** Delete locals, use `const { hostname, relativeTime, ... } = useScoreFormat()`.

#### M2 — `filterStatus` cast inline
Line 73: `@click="filterStatus = f as 'all' | 'pass' | 'warning' | 'critical'"` — runtime sees a plain string. Type-cast in template is script-only safety theater.

**Fix:**
```ts
type FilterStatus = 'all' | 'pass' | 'warning' | 'critical'
const FILTER_OPTIONS: FilterStatus[] = ['all', 'pass', 'warning', 'critical']
const filterStatus = ref<FilterStatus>('all')
```
Then iterate `FILTER_OPTIONS`.

#### M3 — Search lacks debouncing
Filter re-runs on every keystroke. Fine at <1k scans, painful at 10k. Add `useDebounceFn` (VueUse) or a 150 ms `setTimeout` wrapper.

#### M4 — Height math `(Number(v) || 0) * 0.28 + 'px'`
Line 112 — magic multiplier with `px` suffix; hard to style responsively. Use a CSS variable or Tailwind arbitrary `h-[calc(100%_*_var(--v))]`.

### 🔵 LOW

- **L1:** `font-inherit`/`text-inherit` (line 91) are not Tailwind utilities — they ship as raw CSS only if you have `@tailwindcss/forms` or custom plugin.
- **L2:** Empty state copy (line 83) is plain; add a CTA button.

---

## 5. `app/components/dashboard/views/CompareView.vue`

### 🟠 HIGH

#### H1 — `recentComparisons` is always empty
Line 12: `const recentComparisons = ref<any[]>([])` — never assigned. The entire "Past Comparisons" block (lines 44–62) renders only when the ref is populated, so this is dead UI.

**Fix:** Either wire the Convex query (`data.recentComparisons` from the page) via prop/composable, or delete the block until feature is implemented.

#### H2 — Duplicates state with `index.vue`
`compareUrlA`, `compareUrlB`, `submitCompare` also live in `dashboard/index.vue` (lines 90–91). Keep one copy — the component's.

#### H3 — No URL validation before routing
`submitCompare` accepts any string and builds `/compare?urlA=<raw>`. Garbage in → garbage URL. Add `new URL()` guard and surface an error.

#### H4 — Form not wrapped in `<form>`
Lines 27–40 are structured as a form visually but not semantically. Pressing Enter in either input does nothing.

**Fix:**
```html
<form @submit.prevent="submitCompare" class="flex items-center gap-3">
  ...
  <button type="submit" ...>Compare →</button>
</form>
```

#### H5 — Labels present but not associated (`for`/`id`)
Lines 29 and 34 use `<label>` without `for=""`. Wrap input inside label, or add matching `id`.

### 🟡 MEDIUM

#### M1 — Redundant `useRouter` import
Nuxt auto-imports `useRouter`. Line 2 is not wrong but inconsistent with the rest of the codebase.

#### M2 — Responsive break
`flex items-center gap-3` with two full-width inputs and "vs" — stacks poorly <640 px. Add `flex-col md:flex-row`.

#### M3 — Submit button has no loading state
No `:disabled="submitting"` or spinner. Network latency to the `/compare` route is invisible to the user.

### 🔵 LOW

- **L1:** "vs" text marked as `text-[11px] text-white/20` — barely visible; make it a `<span aria-hidden="true" class="text-white/40">VS</span>`.
- **L2:** Placeholders mention `yoursite.com` / `competitor.com` — fine, but should match your landing-page example URLs.

---

## 6. `app/components/dashboard/views/ScanView.vue`

### 🟠 HIGH

#### H1 — Invalid Tailwind: `hover:not(:disabled):opacity-80`
Line 76. Same problem as HistoryView.

**Fix:** `enabled:hover:opacity-80`.

#### H2 — Pillar badges rely on CSS custom props not verified to exist
Line 85 uses `--color-security`, `--color-performance`, `--color-seo`, `--color-accessibility`, `--color-ai`, `--color-dns`, `--color-trust`. If these aren't defined in `styles/tokens.css`, every border/color is transparent and the row is invisible.

**Fix:** Audit `tailwind.config.ts` / global CSS. If tokens absent, define them or use Tailwind color classes:
```ts
const PILLAR_BADGES = [
  { n: 'Security',      c: 'border-security text-security' },
  { n: 'Performance',   c: 'border-performance text-performance' },
  ...
]
```

#### H3 — `emit('open-scan', ...)` declared but never emitted
Line 16. Dead API surface; confuses consumers. Remove.

### 🟡 MEDIUM

#### M1 — No trim on `v-model`
User can type trailing spaces and the `:disabled="scanning || !scanUrl.trim()"` works, but `submit()` also calls `trim()` a second time. Use `v-model.trim="scanUrl"`.

#### M2 — URL validation rejects bare-domain intent inconsistently
`normalise('example')` returns `https://example` which passes `new URL()` but isn't a real site. Add hostname dot check:
```ts
const u = new URL(url)
if (!u.hostname.includes('.')) return false
```

#### M3 — Error message inline but not associated with input
Line 74: `<p v-if="urlError">` is visually below input, but no `aria-describedby="scan-error"` on the `<input>`.

**Fix:**
```html
<input ... aria-invalid="!!urlError" aria-describedby="scan-url-error" />
<p id="scan-url-error" ...>{{ urlError }}</p>
```

### 🔵 LOW

- **L1:** Local `hostname`/`relativeTime` redefined but only `hostname` is used (line 46) and even that only in the unused `ScanSummary` emit. Delete.
- **L2:** Heading "What site do you want to audit?" is a `<div>`, should be `<h1>` or `<h2>` for structure.

---

## 7. `app/components/dashboard/views/ToolsView.vue`

### 🟠 HIGH

#### H1 — `v-html` on `tool.icon` is safe *today* but is a landmine
Lines 57, 62, 97. Comment acknowledges it. If `allTools` ever becomes dynamic (CMS, i18n, Convex, user-submitted), this is persistent XSS.

**Fix:** Define a pre-compiled `IconComponent` per tool, or load via a strict SVG sprite:
```html
<svg><use :href="`#icon-${tool.slug}`"/></svg>
```

#### H2 — `role="button"` on a `<div>` without space-key handler
Lines 50–52, 88–91:
```html
<div role="button" tabindex="0" @click="..." @keydown.enter="...">
```
Buttons must also respond to **Space**. Add `@keydown.space.prevent="..."`.

**Fix (best):** Use actual `<button>` element — no `tabindex`, no role, native a11y.

#### H3 — Active filter tab not announced
Lines 28–40. Active state only visually indicated. Add `role="tab"`, parent `role="tablist"`, `aria-selected`:
```html
<div role="tablist" aria-label="Tool pillar filter" class="flex ...">
  <button v-for="p in toolPillars" role="tab" :aria-selected="toolsFilter === p.key" ...>
</div>
```

#### H4 — Focus ring stripped
`bg-none border-none` on filter tabs (line 31) — no default focus outline.

**Fix:** Add `focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary`.

#### H5 — `text-decoration-none` is not a Tailwind class
Lines 47, 84. Use `no-underline`.

### 🟡 MEDIUM

#### M1 — Motion doesn't respect `prefers-reduced-motion`
Card entrance animation (line 86, keyframe line 125) plays unconditionally.

**Fix:**
```css
@media (prefers-reduced-motion: reduce) {
  .animate-\[tl-card-in_0\.3s_ease_both\] { animation: none; }
}
```

#### M2 — Deeply nested inline style strings
Lines 47–56, 96–108 construct 4–6 `:style` expressions per card, each containing `:style="\`color:${x};background:${x}15;border-color:${x}25\``. Hard to read, hard to maintain, no CSS caching.

**Fix:** One CSS variable + utility classes:
```html
<div :style="{ '--c': t.color }" class="tool-card">...</div>
```
```css
.tool-card { background: rgb(from var(--c) r g b / 0.12); border-color: rgb(from var(--c) r g b / 0.25); }
```

#### M3 — `scrollbar-none` requires plugin
Line 27. If `@tailwindcss/scrollbar` isn't installed, class is a no-op. Verify and document.

### 🔵 LOW

- **L1:** `hover:translate-y-[-2px]` → use `hover:-translate-y-0.5`.
- **L2:** `animation-delay:calc(var(--i)*0.05s)` (line 87) creates a visible stagger > 20 cards (> 1 s). Cap to first 12.

---

## 8. `app/components/dashboard/views/ToolDetailView.vue`

### 🟠 HIGH

#### H1 — Missing error boundary
Line 18: `<component :is="currentToolComponent" :slug="slug" />`. If the async chunk fails (network drop, 404), the Suspense fallback shows forever.

**Fix:**
```html
<Suspense>
  <ErrorBoundary @error="..."> 
    <component ... />
  </ErrorBoundary>
  <template #fallback>...</template>
</Suspense>
```
Or use Vue's `onErrorCaptured`.

#### H2 — Slug not sanitized
`toolComponentMap[props.slug]` — if `slug` is something weird from URL, you get `undefined` which is handled, but log/telemetry should still record unknown slugs.

### 🟡 MEDIUM

#### M1 — "Loading tool…" fallback lacks `role="status"`/`aria-live`
Line 20–23. Screen readers don't announce loading.

**Fix:** Add `role="status" aria-live="polite"`.

---

## 9. `app/components/dashboard/views/ChartDetailView.vue`

### 🔴 CRITICAL

#### C1 — `.length` on a `ComputedRef` in script scope (line 33)
```ts
const dateLabelInterval = computed(() => Math.ceil(chartDetailScans.length / 8))
```
In `<script setup>`, `chartDetailScans` is a `ComputedRef`. `.length` on it is `undefined`. `Math.ceil(undefined / 8) = NaN`. All downstream `i % dateLabelInterval === 0` returns `false` for `i === 0` (0 % NaN → NaN, which is falsy, but the first-/last-index guards still show endpoints).

**Fix:**
```ts
const dateLabelInterval = computed(() => Math.ceil(chartDetailScans.value.length / 8))
```

#### C2 — Auto-imports assumed but not guaranteed
Lines 50–51 call `useScoreFormat()`, `useChartGeometry()` without `import` statements. Nuxt auto-import covers `~/composables/**` if enabled with matching conventions. If either file lives in a path not covered or if auto-import is disabled (e.g., in Vitest), these throw.

**Fix:** Explicit imports:
```ts
import { useScoreFormat } from '~/composables/dashboard/useScoreFormat'
import { useChartGeometry } from '~/composables/dashboard/useChartGeometry'
```

### 🟠 HIGH

#### H1 — `view` composable instance passed through props (anti-pattern)
Lines 14–23. You're serializing a composable's reactive handles through a prop. This couples a view component to the page's view-state instance, breaks Vue DevTools inspection, and prevents re-parenting.

**Fix:** Either:
1. Emit events (`@open-scan`, `@open-by-url`) and let the parent handle view state; or
2. Use `provide`/`inject` with a typed `DashboardViewKey`.

#### H2 — `any` casts in mapping
Lines 43–46, 102, 107, 115 use `(s: any)`. Matches page-level issue.

#### H3 — `[...chartDetailScans].reverse()` per render
Line 210. Creates a shallow copy and reverses on every reactivity tick. Cache:
```ts
const reversedScans = computed(() => [...chartDetailScans.value].reverse())
```

#### H4 — SVG chart lacks accessible name
Same as CharView H1 above. Add `role="img" aria-label="…"`.

### 🟡 MEDIUM

#### M1 — Hero hostname truncation hides full URL on mobile
Line 66: `truncate max-w-[300px]`. On 360 px viewports, this cuts into the score pills. Use `min-w-0` on parent and `truncate` without max.

#### M2 — Table has no empty state
If `chartDetailScans.length === 0`, the outer `v-if` hides everything — OK. But if only partial pillar data, the table shows em-dash cells without caption. Caption `sr-only` is good; also expose rows to assistive tech via `scope="row"` on the date `<td>`.

#### M3 — Delta span compares latest vs first even if first is null
If `chartDetailScans[0].overallScore === null`, the math is `latest - null = latest`, misleading. Guard.

### 🔵 LOW

- **L1:** Border color stacking on the Overall-score pill (line 212) sets both `class="border-white/30"` and `:style="{ borderColor: ... }"`; the inline style wins but the class is dead.
- **L2:** `transition-all` on table rows is heavy (`all` invalidates every property). Use `transition-colors`.

---

## 10. `app/components/dashboard/views/BulkView.vue`

### 🟠 HIGH

#### H1 — No `<script setup lang="ts">`
Line 1: plain `<script setup>` with `defineProps({...})` object syntax. Inconsistent with every other view.

**Fix:**
```ts
<script setup lang="ts">
interface BulkScan { _id: string; name: string; totalUrls: number; completedUrls: number; status: 'pending'|'running'|'done'|'error' }
defineProps<{ bulkScans: BulkScan[] }>()
</script>
```

#### H2 — Division by zero in progress bar
Line 25: `Math.round((b.completedUrls / b.totalUrls) * 100)` — `totalUrls === 0` → `NaN%` inline style → CSS invalid, width defaults.

**Fix:** `totalUrls ? Math.round(completedUrls/totalUrls*100) : 0`.

### 🟡 MEDIUM

#### M1 — Status `<span>` lacks a11y
No `aria-label` explaining state; colors are the only indicator (fails WCAG 1.4.1).

**Fix:** `:aria-label="`Status: ${b.status}`"` or include icon.

#### M2 — File is orphaned
The page renders bulk UI inline (index.vue §181–212). Either delete this component or refactor the page to use it.

---

## 11. Cross-cutting Concerns

### ⭐ CC1 — Weak typing epidemic
Every view uses `any[]` or `(s: any)`. Shared types should live in `~/types/dashboard.ts`:
```ts
export type ScanStatus = 'pending' | 'running' | 'done' | 'error'
export interface Scan {
  _id: Id<'scans'>
  _creationTime: number
  url: string
  status: ScanStatus
  overallScore?: number | null
  securityScore?: number | null
  performanceScore?: number | null
  seoScore?: number | null
  accessibilityScore?: number | null
  aiScore?: number | null
  dnsScore?: number | null
  trustScore?: number | null
}
export type PillarKey = 'security' | 'performance' | 'seo' | 'accessibility' | 'ai' | 'dns' | 'trust'
export type PillarScoreKey = `${PillarKey}Score`
```

### ⭐ CC2 — Design-token discipline
Hex literals appear 40+ times (`#0f0f14`, `#1e1e28`, `#6b7280`, `#ec3586`, `#00d4aa`, `#ffaa00`, `#ff4757`, `#6c5ce7`, `#a29bfe`, `#ff7675`, `#fd79a8`, `#74b9ff`, `#e8e8f0`, `#9898b0`, `#07070a`, `#0a0a10`, `#13131a`, `#16161e`, `#0e0e13`). Replace with `bg-dark`, `bg-dark-surface`, `bg-dark-elevated`, `text-muted`, etc.

### ⭐ CC3 — Repeated SVG patterns
All views redraw dots/lines inline. Extract `<ScoreChart>` and `<Sparkline>` with a shared props contract:
```ts
<ScoreChart :points="points" :color="color" variant="detail" />
<Sparkline :values="values" :color="color" />
```

### ⭐ CC4 — Reduced-motion
No `@media (prefers-reduced-motion: reduce)` anywhere. `animate-ping`, `animate-pulse`, `animate-spin`, `animate-[tl-card-in...]` all run regardless.

### ⭐ CC5 — Keyboard & screen-reader access
Most clickable rows are `<button>` or `<div role=button>` but:
- No visible focus ring (`outline` stripped).
- No "skip to main" link on the dashboard frame.
- No `aria-live` for scan-status changes ("scan complete", "scan failed").

### ⭐ CC6 — Color-contrast failures (WCAG AA)
Small-size text at `text-white/20`, `text-white/25`, `text-white/28`, `text-white/30` on `#0f0f14` ≈ ratio 2.3–2.6 — fails AA (needs 4.5). Raise to at least `text-white/55`.

### ⭐ CC7 — Inline class duplication
Patterns like `"bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4"` appear 20+ times. Extract `.panel` utility in global css or a `<SurfaceCard>` component.

### ⭐ CC8 — Router / hash state not synced
View state (`tools`, `charts`, `history`, `chart-detail`) lives only in the composable; reloading the page, sharing, or right-clicking always dumps the user on overview. Serialize:
```ts
const route = useRoute()
const router = useRouter()
watch(() => view.currentView.value, v => router.replace({ query: { ...route.query, view: v }}))
```

### ⭐ CC9 — Telemetry / error reporting absent
No `try/catch` around favicon failures, chart math, or route pushes. Errors vanish into the console. Wire up Sentry or a lightweight `reportError()` helper that hooks into `onErrorCaptured`.

---

## 12. Suggested Fix Order (for minimax 2.7)

Priority tiers — finish tier 1 before tier 2.

**Tier 1 — Correctness blockers (CRITICAL / top HIGH)**
1. `index.vue` C1: namespace `view.selectedChartUrl` everywhere in template.
2. `index.vue` C2: destructure `cdX, cdY, cdAreaPath, cdPolyline, shortDate` from `useChartGeometry()`.
3. `ChartDetailView.vue` C1: `chartDetailScans.value.length`.
4. `ChartDetailView.vue` C2: explicit imports for the composables.
5. `ChartsView.vue` C1: remove `v-if` + `v-for` on the same element.
6. `ChartsView.vue` C2: sparkline division-by-zero guard.
7. `HistoryView.vue` C1: fix nested `<button>` — split row + action cluster.
8. `HistoryView.vue` C2: add delete confirmation.
9. `BulkView.vue` H2: division-by-zero in progress bar.

**Tier 2 — A11y & UX baseline (HIGH)**
1. All SVG charts: `role="img" aria-label title desc`.
2. Replace bare `<div role="button">` with actual `<button>` (ToolsView H2, ChartsView H3).
3. Add `aria-selected` / `role="tab"` to filter button groups (ToolsView, HistoryView).
4. Fix `hover:not(:disabled)` → `enabled:hover:*` in HistoryView and ScanView.
5. Fix `bg-none` → `bg-transparent`.
6. Fix `text-decoration-none` → `no-underline`.
7. Add favicon `alt=""`, associate labels via `for`/`id`.
8. `grid-cols-4` → responsive variants across Overview and Charts.
9. Add `prefers-reduced-motion` rules.
10. Strengthen `scoreBg` / color-semantic mapping (danger/warning/success tokens).
11. Privacy proxy for favicon fetch.

**Tier 3 — Typing & deduplication (HIGH / MEDIUM)**
1. Introduce `~/types/dashboard.ts` with `Scan`, `Monitor`, `BulkScan`, `PillarKey`.
2. Replace every `any[]` prop with real types.
3. Extract `<SurfaceCard>`, `<ScoreChart>`, `<Sparkline>` components.
4. Consolidate `hostname`, `relativeTime`, `statusLabel`, `scoreBg` into `useScoreFormat` — delete local copies from HistoryView/ScanView.
5. Replace inline hex literals with design tokens.
6. Remove duplicated state between `index.vue` and CompareView / ToolsView.
7. Use `<BulkView>` in `index.vue` instead of inline markup.
8. Re-architect `ChartDetailView` to use emits, not the `view` prop.

**Tier 4 — Performance & polish (MEDIUM / LOW)**
1. Memoize `previousScansOfSelected`, `reversedScans`, `maxPerDay`.
2. Debounce `historySearch`.
3. Persist `view.currentView` in URL query.
4. Add error boundaries inside Suspense (`ToolDetailView`).
5. Unify animations and stagger caps.
6. Wire `recentComparisons` in CompareView or remove the block.

---

## 13. Quick-reference Checklist (for minimax 2.7)

```
[ ] index.vue:  prefix selectedChartUrl usages with view.
[ ] index.vue:  destructure chart geom helpers
[ ] index.vue:  remove unused: scoreTrend, router, compareUrlA/B, submitCompare, toolsFilter...
[ ] index.vue:  memoize previousScansOfSelected
[ ] index.vue:  replace any casts with typed Scan
[ ] index.vue:  use <BulkView> instead of inline bulk block
[ ] index.vue:  responsive grid-cols classes
[ ] index.vue:  SVG aria-label + title

[ ] OverviewView: type props, favicons alt="", responsive grid, reduced-motion

[ ] ChartsView:   remove v-if+v-for, guard arr.length-1, replace bg-none, use <button>, aria on SVG, import shared PILLAR_COLORS

[ ] HistoryView:  split nested buttons, delete confirmation, label search input, radiogroup for filter, proxy favicons, fix hover:not(:disabled), use useScoreFormat

[ ] CompareView:  remove duplicate state, validate URLs, use <form>, associate labels, responsive flex

[ ] ScanView:     fix hover:not(:disabled), define/verify pillar CSS vars, v-model.trim, aria-describedby, remove dead emit

[ ] ToolsView:    keydown.space, <button> instead of role=button div, aria tablist, no-underline, reduced-motion, focus-visible rings

[ ] ToolDetailView: error boundary, aria-live on fallback

[ ] ChartDetailView: .value.length fix, explicit imports, stop passing view composable as prop, memoize reversedScans, SVG aria

[ ] BulkView:     lang="ts", typed interface, guard totalUrls === 0, aria-label on status

[ ] Global:       types/dashboard.ts, design tokens over hex, <SurfaceCard>/<ScoreChart>, contrast pass, URL-synced view state
```

---

**Generated:** 2026-04-17
**Target remediation tool:** minimax 2.7
