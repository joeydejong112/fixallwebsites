# Orchestrator Instructions — Dashboard Audit Remediation

**For:** AI orchestrator agent (main thread)
**Input:** [`docs/audits/dashboard-audit.md`](./dashboard-audit.md)
**Output:** All Tier-1 → Tier-4 fixes applied, build green, no regressions.

---

## 0. Your Role

You are the **orchestrator**. You DO NOT edit code directly except to:
- Create the shared `types/` file in Phase 0.
- Run verification after every wave.
- Resolve cross-agent merge conflicts.

All code changes are produced by **subagents** you spawn via the `Agent` tool. Each subagent gets a tightly-scoped prompt, a list of files it may touch, and a verification checklist.

## 1. Hard Rules

1. **Read `docs/audits/dashboard-audit.md` in full before spawning anything.** The fix order, severity, and checklist at the bottom are authoritative.
2. **Never spawn two subagents that write to the same file in parallel.** Use the file-lock matrix in §5.
3. **Tier 1 runs first, serially or in safe parallel (see §5). Tier 2–4 may overlap.**
4. **After each wave, run the verification gate in §7 before starting the next wave.** If the build breaks, spawn `build-error-resolver` before continuing.
5. **Commit after each wave** with a scoped conventional-commit message (`fix(dashboard): …`). Do not commit across waves.
6. **No scope creep.** If a subagent reports "I also noticed X", log it in `docs/audits/dashboard-followups.md` — do not let the subagent fix it unless it's in the audit.
7. **Never run `npm run dev`** (per memory `feedback_verification.md` / `feedback_no_preview.md`). Verify via `npm run build` and type-check only.
8. **Do not update `memory/` files automatically** (per `feedback_no_auto_memory_security.md`).
9. Treat the feedback memories as durable instructions — review them once at the top of the task.

## 2. Session Bootstrap

Run these tool calls in parallel at the very start:

```
- Read docs/audits/dashboard-audit.md
- Read memory/MEMORY.md + every feedback_*.md it links to
- Glob  app/components/dashboard/views/*.vue
- Glob  app/composables/dashboard/*.ts
- Read  tailwind.config.ts
- Read  app/composables/dashboard/useScoreFormat.ts
- Read  app/composables/dashboard/useChartGeometry.ts
- Read  app/composables/dashboard/useDashboardView.ts
- Read  app/lib/dashboard/tools.ts
- Bash  git status --short
```

Confirm no other work is in-flight before proceeding.

## 3. Phase 0 — Orchestrator-owned Prep (no subagent)

You do these yourself because downstream subagents all import from them:

### 3.1 Create `app/types/dashboard.ts`

```ts
import type { Id } from '~~/convex/_generated/dataModel'

export type ScanStatus = 'pending' | 'running' | 'done' | 'error'
export type PillarKey =
  | 'security' | 'performance' | 'seo'
  | 'accessibility' | 'ai' | 'dns' | 'trust'
export type PillarScoreKey = `${PillarKey}Score`

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

export interface Monitor {
  _id: Id<'monitoredSites'>
  url: string
  frequency: 'daily' | 'weekly'
  lastScore?: number | null
  lastRunTime?: number | null
}

export interface BulkScan {
  _id: Id<'bulkScans'>
  name: string
  totalUrls: number
  completedUrls: number
  status: ScanStatus
}

export interface PillarMeta {
  key: PillarKey
  scoreKey: PillarScoreKey
  label: string
  color: string // hex or design-token
}
```

### 3.2 Create `app/lib/dashboard/pillars.ts`

Export the canonical `PILLAR_META: PillarMeta[]` array so OverviewView / ChartsView / ChartDetailView all consume one source of truth. Include the 7 pillars with labels + colors from `PILLAR_COLORS`.

### 3.3 Verify bootstrap

```
- Bash: npx nuxt typecheck   (or npm run build, whichever exists)
```

Commit: `chore(dashboard): add shared Scan/Monitor/BulkScan types + PILLAR_META`.

## 4. Wave Plan

Five waves. Each wave = one `Agent` dispatch message containing 1–N subagents **in a single tool-call block** when they touch disjoint files.

| Wave | Purpose | Tier | Parallel? |
|------|---------|------|-----------|
| **W1** | Correctness blockers | Tier 1 | Partial — see §5 |
| **W2** | A11y & UX baseline | Tier 2 | Yes (disjoint files) |
| **W3** | Typing + deduplication + component extraction | Tier 3 | Serial (heavy refactor) |
| **W4** | Performance + polish | Tier 4 | Yes |
| **W5** | Cleanup + security review | — | Serial |

## 5. File-Lock Matrix

A subagent may edit the files listed in its "write" column. If two subagents in one wave share a file, **serialize them** or **merge them into one subagent**.

| Subagent ID | Write access | Read-only |
|-------------|--------------|-----------|
| `W1-index`         | `app/pages/dashboard/index.vue` | audit, useChartGeometry, useDashboardView |
| `W1-chart-detail`  | `app/components/dashboard/views/ChartDetailView.vue` | composables |
| `W1-charts`        | `app/components/dashboard/views/ChartsView.vue` | audit |
| `W1-history`       | `app/components/dashboard/views/HistoryView.vue` | useScoreFormat |
| `W1-bulk`          | `app/components/dashboard/views/BulkView.vue` | audit |
| `W2-a11y`          | all 9 view files (serial within agent) | audit, WCAG refs |
| `W3-types`         | all 9 view files + `index.vue` | `app/types/dashboard.ts` |
| `W3-extract`       | new: `app/components/dashboard/ui/SurfaceCard.vue`, `ScoreChart.vue`, `Sparkline.vue`; edits consumers | tailwind.config |
| `W4-perf`          | any view file | — |
| `W5-security`      | review-only; proposes diffs to orchestrator | all |

## 6. Subagent Prompt Templates

### 6.1 W1-index (Tier 1 critical fixes in the page)

Spawn with `subagent_type: "coder"`. Prompt:

> You are fixing **critical correctness bugs** in `app/pages/dashboard/index.vue`. Read the file first. Then read `docs/audits/dashboard-audit.md` §1 — items **C1, C2, C3, H1, H2**.
>
> **Do exactly these edits, nothing else:**
> 1. **C1:** Replace every bare `selectedChartUrl` identifier in the template (~lines 241, 248, 249, 252, 253, 271) with `view.selectedChartUrl`. In the `v-else-if` condition use `view.selectedChartUrl` too. Inside `faviconUrl(selectedChartUrl)` calls also swap.
> 2. **C2:** In `<script setup>` change `const geom = useChartGeometry()` to:
>    ```ts
>    const { cdX, cdY, cdAreaPath, cdPolyline, shortDate, CD_W, CD_H, CD_PL, CD_PR, CD_GRID } = useChartGeometry()
>    ```
>    Remove the now-duplicate `import { CD_W, ... }` line if those same names are exported from the composable; keep the import otherwise and don't destructure the duplicates.
> 3. **C3:** Add a typed key-map:
>    ```ts
>    import type { PillarKey, PillarScoreKey } from '~/types/dashboard'
>    const PILLAR_SCORE_KEY: Record<PillarKey, PillarScoreKey> = {
>      security: 'securityScore', performance: 'performanceScore',
>      seo: 'seoScore', accessibility: 'accessibilityScore',
>      ai: 'aiScore', dns: 'dnsScore', trust: 'trustScore',
>    }
>    ```
>    Replace the `as 'securityScore'` cast with `s[PILLAR_SCORE_KEY[key]] as number | null | undefined`.
> 4. **H1:** Add a `previousScansOfSelected` computed and use it in both places where the filter is currently duplicated (the `v-if` on the wrapper div and the `v-for` button). Slice to 5 in the template, keep full array in the computed.
> 5. **H2:** Delete these unused locals: `scoreTrend`, `router`, `newScanUrl` helpers already duplicated elsewhere? (keep ones still bound in template), `compareUrlA`, `compareUrlB`, `submitCompare`, `toolsFilter`, `toolsFiltered`, `toolsFeatured`, `toolsRest`, `toolsPillarCount`. Verify via template search before deletion.
>
> **Do NOT:** Add error handling, refactor layout, touch other files, or fix MEDIUM/LOW items.
>
> **Report:** a `diff --stat`-style summary + any identifier you were unsure about.

### 6.2 W1-chart-detail

> Fix `app/components/dashboard/views/ChartDetailView.vue`. Audit §9 items **C1, C2**.
>
> 1. **C1:** Line 33 — change `chartDetailScans.length` to `chartDetailScans.value.length`.
> 2. **C2:** Add explicit imports at top of `<script setup lang="ts">`:
>    ```ts
>    import { useScoreFormat } from '~/composables/dashboard/useScoreFormat'
>    import { useChartGeometry } from '~/composables/dashboard/useChartGeometry'
>    ```
>
> Do not touch prop API yet (H1 is deferred to W3). Verify typecheck passes.

### 6.3 W1-charts

> Fix `app/components/dashboard/views/ChartsView.vue`. Audit §3 items **C1, C2**.
>
> 1. **C1:** The line `<button v-for="site in topSites" :key="site.url" v-if="props.openScanByUrl" ...>` violates Vue's v-if+v-for rule. Hoist the guard:
>    ```html
>    <template v-if="props.openScanByUrl">
>      <button v-for="site in topSites" :key="site.url" @click="props.openScanByUrl(site.url)" ...>
>        ...
>      </button>
>    </template>
>    ```
> 2. **C2:** Inside the sparkline `.map` callback (around line 214), guard the denominator:
>    ```ts
>    const denom = Math.max(arr.length - 1, 1)
>    return `${(i / denom) * 60},${24 - (v / 100) * 22}`
>    ```
>
> Nothing else.

### 6.4 W1-history

> Fix `app/components/dashboard/views/HistoryView.vue`. Audit §4 items **C1, C2**.
>
> 1. **C1:** The row currently is `<button v-for="scan ...">` and contains three action `<button>`s → invalid HTML. Convert the row to `<div role="button" tabindex="0" @click="..." @keydown.enter="..." @keydown.space.prevent="...">`. Keep the action buttons as real buttons inside, wrapped in the existing `@click.stop` container. Preserve the visual layout exactly.
> 2. **C2:** Add a confirm step before emitting `delete-scan`:
>    - Introduce local `const pendingDelete = ref<string | null>(null)`.
>    - First click on trash icon: set `pendingDelete.value = scan._id`, start a 3 s timer that clears it.
>    - If clicked again while `pendingDelete.value === scan._id`, emit and clear.
>    - Button `aria-label` switches to "Click again to confirm delete" while pending.
>
> Do not touch favicon logic, search debouncing, or filter-group ARIA yet — those are W2.

### 6.5 W1-bulk

> Fix `app/components/dashboard/views/BulkView.vue`. Audit §10 item **H2**.
>
> Guard the progress width:
> ```ts
> :style="{ width: (b.totalUrls ? Math.round((b.completedUrls / b.totalUrls) * 100) : 0) + '%' }"
> ```
>
> Also convert to `<script setup lang="ts">` with a typed `defineProps<{ bulkScans: BulkScan[] }>()` using `import type { BulkScan } from '~/types/dashboard'`.

### 6.6 W2-a11y (one subagent, serial file walk)

Spawn with `subagent_type: "coder"` (or `a11y-architect` if available):

> You are fixing **Tier 2 a11y + UX baseline** issues across all 9 dashboard view files. Read audit §1–10 and filter for any item tagged HIGH that is a11y, Tailwind-invalid-class, or color-semantic. Concretely:
>
> - All SVG charts: add `role="img"`, a dynamic `aria-label`, and inline `<title>` / `<desc>`.
> - ToolsView: replace `<div role="button" tabindex="0">` with real `<button>` elements; add `@keydown.space.prevent`; add `role="tablist"` + `aria-selected` to filter tabs; remove stripped focus rings by adding `focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary`.
> - ChartsView: same treatment for per-site cards (convert to `<button>`).
> - HistoryView: label search input via `<label class="sr-only" for="history-search">`; convert filter-group to `role="radiogroup"` with `aria-checked`; remove invalid `hover:not(:disabled):opacity-80` → `enabled:hover:opacity-80`; replace `bg-none` with `bg-transparent`; replace `text-decoration-none` with `no-underline`.
> - ScanView: identical invalid-Tailwind fix; add `aria-describedby="scan-url-error"` + `aria-invalid`; lift "What site..." heading to `<h1>` or `<h2>`.
> - OverviewView: add `alt=""` on favicon `<img>`; wrap activity-dot colors in semantic tokens; add `prefers-reduced-motion` override for `animate-ping`; responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
> - CompareView: wrap inputs in real `<form @submit.prevent>`; associate labels with `for`/`id`; add mobile `flex-col md:flex-row`.
> - Privacy favicon proxy: add `server/api/favicon.get.ts` that fetches and caches, and update `faviconUrl()` in `useScoreFormat` to point at `/api/favicon?url=...`.
> - Raise every `text-white/20`, `text-white/25`, `text-white/28`, `text-white/30` used for body text to at least `text-white/55` (leave decorative dividers alone).
>
> Process files in this order to minimize re-reads:
> 1. `useScoreFormat.ts` (favicon URL)
> 2. `server/api/favicon.get.ts` (new)
> 3. Each view file alphabetically.
>
> After each file, run a mental typecheck and confirm no template binding broke.

### 6.7 W3-types

> Replace every `any[]` / `(s: any)` / `(b: any)` in `app/pages/dashboard/index.vue` and the 9 view files with types imported from `~/types/dashboard`. Key targets (per audit CC1):
>
> - `scans: Scan[]`, `doneScans: Scan[]`, `monitors: Monitor[]`, `bulkScans: BulkScan[]`.
> - Emits: `(e: 'delete-scan', scanId: Id<'scans'>, ev: MouseEvent): void`, etc.
> - In ChartDetailView replace the `view: ChartDetailView` prop with concrete emits: `@open-scan`, `@open-scan-by-url`, `@back`. Parent (`dashboard/index.vue`) passes handlers instead of the composable instance.
> - Remove all `(s:any)` from the page template by ensuring prop types propagate.
>
> Do not re-style, do not rewrite SVG.

### 6.8 W3-extract

> Create three new components under `app/components/dashboard/ui/`:
>
> - `SurfaceCard.vue` — wraps the `bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4` pattern. Props: `padding` ('sm'|'md'|'lg'), `tone` ('default'|'elevated').
> - `Sparkline.vue` — inputs `values: number[]`, `color: string`, fixed `width`, `height`, with built-in zero/one-point guards and `role="img"` + dynamic aria-label.
> - `ScoreChart.vue` — inputs `scans: Scan[]`, `variant: 'detail' | 'site'`. Renders the large SVG used by ChartDetailView + the 300×80 per-site card in ChartsView.
>
> Then refactor ChartsView.vue and ChartDetailView.vue to consume them. Delete the now-orphan SVG blocks from those two files. Keep the 14-day bar chart inline (it's distinct enough).
>
> Swap inline hex colors for design tokens (`bg-dark-elevated`, `border-dark-border`, `text-muted`) where ScanPulse's `tailwind.config.ts` already exposes them. Do NOT invent new tokens — only use ones in the existing config.

### 6.9 W4-perf

> Audit Tier 4 items:
>
> - Memoize `previousScansOfSelected`, `reversedScans`, `maxPerDay` (ChartsView).
> - Debounce `historySearch` via `useDebounceFn` (`@vueuse/core`) at 150 ms. If VueUse is not installed, add a local debounce helper in `app/utils/debounce.ts`.
> - Persist `view.currentView` and `view.selectedChartUrl` to URL query in `useDashboardView.ts`; read-back on page mount.
> - Wrap Suspense in ToolDetailView with `onErrorCaptured` → show a retry button.
> - Cap the card-entrance stagger in ToolsView to the first 12 cards (`animation-delay: calc(min(var(--i), 12) * 0.05s)`).

### 6.10 W5-security

> Act as a **review-only** security-reviewer subagent. Do NOT write to files. Produce a report at `docs/audits/dashboard-security-review.md` covering:
>
> - Any residual `v-html` usage (ToolsView icons).
> - Favicon proxy implementation: SSRF guard on the URL param, domain allow-list, cache poisoning.
> - URL encoding in CompareView's router.push.
> - Confirm no secrets committed.
>
> Return severity-classified findings + suggested fixes. The orchestrator applies them.

## 7. Verification Gate (run after each wave)

Run in parallel:

```
- Bash: npx nuxt typecheck 2>&1 | tail -40
- Bash: npm run build 2>&1 | tail -60        (skip on W1 if nuxt typecheck is enough)
- Grep: pattern "any\s*\[\]" in app/pages/dashboard and app/components/dashboard/views   (expect 0 after W3)
- Grep: pattern "hover:not\(:disabled\)"                                                  (expect 0 after W2)
- Grep: pattern "\bbg-none\b"                                                             (expect 0 after W2)
- Grep: pattern "v-html"                                                                  (expect only ToolsView until W5 decision)
- Grep: pattern "selectedChartUrl" in app/pages/dashboard/index.vue -C 1                  (every hit must be prefixed with "view.")
```

If typecheck/build fails:

1. **Do not patch manually.**
2. Spawn `build-error-resolver` with the error tail and the files touched in this wave.
3. Re-run verification.
4. Only proceed to the next wave when green.

## 8. Commit Cadence

One commit per wave. Message template:

```
fix(dashboard): W<N> - <short summary>

<bulleted list of audit items closed, by ID (C1, H3, etc.)>
```

Do **not** push. User controls pushes (per `feedback_git_push.md` — follow its explicit "provide commit message if git config blocks" guidance).

## 9. Final Deliverables

When all five waves are green:

1. `docs/audits/dashboard-audit.md` — unchanged (historical record).
2. `docs/audits/dashboard-security-review.md` — from W5.
3. `docs/audits/dashboard-followups.md` — any out-of-scope items flagged by subagents.
4. A final message to the user with:
   - Checklist of audit items closed (tick the boxes from §13 of the audit).
   - Any skipped items + why.
   - Commit hashes for each wave.
   - Explicit note: "No push performed; awaiting user direction."

## 10. Failure Modes & Recovery

| Symptom | Action |
|---------|--------|
| Subagent edits file outside its lock | Revert via `git checkout -- <file>`; respawn with stricter prompt. |
| Typecheck regresses after W1 | Spawn `build-error-resolver`, focus on files touched in W1 only. |
| Subagent reports ambiguous audit item | Read the audit yourself, send clarification with exact line numbers, do NOT let the subagent guess. |
| Duplicate work across W3-types and W3-extract | Serialize: finish W3-types first, then W3-extract. The types agent writes the interfaces the extract agent consumes. |
| Tailwind class unknown after W2 | Verify in `tailwind.config.ts`; if plugin required, add to `modules`/`plugins` and flag in follow-ups. |

## 11. Anti-Patterns to Refuse

If a subagent returns any of these, reject the diff and respawn:

- `// @ts-ignore` or `// eslint-disable-next-line` without justification.
- Deleting the entire `<style>` block instead of fixing specific rules.
- Wholesale rewrites when a surgical fix was requested.
- Changes outside its declared file lock.
- New dependencies without orchestrator approval.
- Any `dangerouslySetInnerHTML` / `v-html` additions.

## 12. Ready-to-Use Spawn Block (Wave 1 example)

Paste into a single Agent-tool message so all five Tier-1 subagents run in parallel (all file locks are disjoint):

```
[Agent] W1-index          → coder       (prompt from §6.1)
[Agent] W1-chart-detail   → coder       (prompt from §6.2)
[Agent] W1-charts         → coder       (prompt from §6.3)
[Agent] W1-history        → coder       (prompt from §6.4)
[Agent] W1-bulk           → coder       (prompt from §6.5)
```

All five must finish before verification. If one fails, the others' diffs still stand — only re-run the failed one.

---

**Proceed only after:**
- Audit file read end-to-end.
- Memory feedback files read.
- Phase 0 types + `PILLAR_META` committed.
- No untracked working-tree changes in the dashboard surface.
