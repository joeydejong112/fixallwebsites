# ScanPulse Redesign — AI Agent Port Guide

You are porting a React HTML prototype into an existing Nuxt 3 + Vue 3 + Convex + Tailwind application. Follow this guide step-by-step. Do not deviate.

---

## Context

- **Prototype:** `ScanPulse.html` + `src/*.jsx` in the handoff project. Open side-by-side while porting.
- **Target stack:** Nuxt 3, Vue 3 `<script setup lang="ts">`, Tailwind CSS, Convex, TypeScript.
- **Target repo root:** user's `fixallwebsites/` (or equivalent).
- **Scope:** 5 screens — landing, dashboard, scan result, tools index, CSP builder.

---

## Operating rules

1. **One screen per PR.** Never combine screens in a single change.
2. **Tokens and primitives before screens.** Do not start screens until Section 3 is complete and committed.
3. **Match the prototype pixel-for-pixel.** When in doubt, open `ScanPulse.html` at 1440px and measure.
4. **Do not invent colors, spacings, or motion.** Every value comes from this doc or the prototype.
5. **Read before writing.** Before creating any `.vue` file, `read_file` the existing components in the same directory to match conventions (naming, script setup style, composable imports).
6. **Ask, don't assume.** If a Convex query named in this doc doesn't exist, stop and ask the user — do not invent the shape.
7. **No emoji in UI.** The prototype uses inline SVG glyphs; replicate them.

---

## Phase 0 — Audit (do this first, report findings)

Run these reads, then reply to the user with a bullet list of what exists and what's missing:

```
read_file  fixallwebsites/nuxt.config.ts
read_file  fixallwebsites/tailwind.config.ts
read_file  fixallwebsites/package.json
list_files fixallwebsites/app/components
list_files fixallwebsites/app/pages
list_files fixallwebsites/app/lib
list_files fixallwebsites/convex
read_file  fixallwebsites/convex/schema.ts
read_file  fixallwebsites/convex/scans.ts
read_file  fixallwebsites/convex/scoreHistory.ts
read_file  fixallwebsites/convex/monitors.ts
```

Report:
- [ ] Does `tailwind.config.ts` already define pillar colors? If yes, match their names exactly.
- [ ] Does Convex `scans` table have `pillarScores`, `overallScore`, `issues[]` fields? List the actual schema.
- [ ] Is there an existing `ScoreRing` / `Score` component? If yes, extend it; don't duplicate.
- [ ] Is there an existing scan result page? Record the route for Phase 3.
- [ ] Does `app/lib/` exist or should I use `composables/`?

**Do not proceed until the user confirms the audit.**

---

## Phase 1 — Tokens

### 1.1 Copy CSS tokens

```
copy_files src=styles/tokens.css dest=fixallwebsites/app/assets/css/tokens.css
```

Register in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  css: ["~/assets/css/tokens.css"],
});
```

### 1.2 Load fonts

Add to `nuxt.config.ts` → `app.head.link`:

```ts
{ rel: "preconnect", href: "https://fonts.googleapis.com" },
{ rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
```

### 1.3 Extend Tailwind

Merge into `tailwind.config.ts` `theme.extend`:

```ts
colors: {
  canvas: "#07070a",
  surface: "#0f0f14",
  elevated: "#16161e",
  brand: { DEFAULT: "#ec3586", soft: "rgba(236,53,134,0.12)" },
  pillar: {
    security: "#00d4aa", performance: "#ffaa00", seo: "#6c5ce7",
    accessibility: "#a29bfe", ai: "#ff7675", dns: "#74b9ff", trust: "#fd79a8",
  },
  status: { pass: "#00d4aa", warn: "#ffaa00", crit: "#ff4757" },
},
fontFamily: {
  display: ['"Space Grotesk"', "sans-serif"],
  body:    ['"DM Sans"', "sans-serif"],
  mono:    ['"JetBrains Mono"', "ui-monospace", "monospace"],
},
borderRadius: { card: "16px", btn: "9px" },
```

### 1.4 Pillar constants

Create `app/lib/pillars.ts`:

```ts
export const PILLARS = [
  { key: "security",      label: "Security",      color: "#00d4aa", icon: "shield" },
  { key: "performance",   label: "Performance",   color: "#ffaa00", icon: "zap" },
  { key: "seo",           label: "SEO",           color: "#6c5ce7", icon: "search" },
  { key: "accessibility", label: "Accessibility", color: "#a29bfe", icon: "a11y" },
  { key: "ai",            label: "AI Readiness",  color: "#ff7675", icon: "spark" },
  { key: "dns",           label: "DNS & Email",   color: "#74b9ff", icon: "globe" },
  { key: "trust",         label: "Trust",         color: "#fd79a8", icon: "heart" },
] as const;
export type PillarKey = typeof PILLARS[number]["key"];
export const pillarFor = (k: PillarKey) => PILLARS.find(p => p.key === k)!;
```

**Verify:** run `pnpm dev`, open any existing page, confirm `document.body` has the Space Grotesk font loaded via devtools.

---

## Phase 2 — Primitives

Create under `app/components/scanpulse/`. Source of truth for logic: `src/primitives.jsx`.

### Required components

| File | Source JSX | Notes |
|---|---|---|
| `ScoreRing.vue` | `ScoreRing` | Animate stroke-dashoffset on mount. Props: `score, size?, stroke?, color?, label?, delta?` |
| `PillarIcon.vue` | `PillarIcon` | Inline SVG switch on `name` prop. 8 glyphs — copy paths verbatim. |
| `StatusIcon.vue` | `StatusIcon` | Pass/warn/crit SVG glyphs. No emoji. |
| `PillarChip.vue` | `PillarChip` | bg = `${color}12`, border = `${color}33`. |
| `StatusChip.vue` | `StatusChip` | Same pattern, status-colored. |
| `Favicon.vue` | `Favicon` | Deterministic color from host char-code sum mod 7. |
| `PillarSparkline.vue` | `PillarSparkline` | 7 bars. height = `max(15, v) * 0.22px`. gap 3. |
| `Eyebrow.vue` | (pattern) | 28px pink rule + 11px uppercase tracked text. |
| `Arrow.vue` | `Arrow` | Inline SVG arrow. |
| `ScoreChip.vue` | `ScoreChip` | Color by range: ≥85 teal, ≥65 amber, else red. |

### Template for `ScoreRing.vue`

```vue
<script setup lang="ts">
const props = withDefaults(defineProps<{
  score: number; size?: number; stroke?: number; color?: string; label?: string; delta?: string | null;
}>(), { size: 220, stroke: 14, color: "#ec3586", label: "Overall", delta: null });

const r = computed(() => (props.size - props.stroke) / 2);
const circ = computed(() => 2 * Math.PI * r.value);
const animated = ref(0);
onMounted(() => setTimeout(() => { animated.value = props.score; }, 120));
const offset = computed(() => circ.value - (animated.value / 100) * circ.value);
</script>

<template>
  <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" style="transform: rotate(-90deg)">
      <circle :cx="size/2" :cy="size/2" :r="r" stroke="rgba(255,255,255,0.06)" :stroke-width="stroke" fill="none" />
      <circle :cx="size/2" :cy="size/2" :r="r" :stroke="color" :stroke-width="stroke" fill="none"
        stroke-linecap="round" :stroke-dasharray="circ" :stroke-dashoffset="offset"
        style="transition: stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <div class="font-display font-bold tabular-nums tracking-[-0.05em]" :style="{ fontSize: `${size*0.36}px` }">
        {{ Math.round(animated) }}
      </div>
      <div class="mt-2 font-display text-[10px] tracking-[0.22em] uppercase text-white/45">{{ label }}</div>
      <div v-if="delta" class="mt-1 font-display font-semibold text-xs"
           :class="delta.startsWith('+') ? 'text-pillar-security' : 'text-status-crit'">
        {{ delta }} since last scan
      </div>
    </div>
  </div>
</template>
```

**Verify after Phase 2:** create `app/pages/_sandbox.vue` that imports all primitives and renders them. Screenshot. Compare to prototype. Delete the sandbox before merging.

---

## Phase 3 — Screens

Port in this order. One PR each. Each section below lists: route, required Convex bindings, component tree, and key interactions.

### 3.1 Dashboard — `pages/app/dashboard.vue`

**Why first:** reuses all primitives, exercises the most Convex wiring.

**Required Convex (verify in Phase 0, ask user if missing):**
- `api.scans.latestForUser` → `{ host, scheme, overallScore, pillarScores, scannedAt, monitoringEnabled }`
- `api.scans.quickWins(scanId)` → top 3 issues with `scoreImpact` where `toolId != null`
- `api.scoreHistory.forUrl({ url, range: "12w" })` → `{ points: { weekIndex, score }[] }`
- `api.monitors.recentEvents({ hours: 24 })`
- `api.scans.recentForUser({ limit: 6 })`

**Component tree:**
```
layouts/app.vue           ← wraps with AppRail + AppTopStrip
  DashboardHeader
  HeroScanPanel           ← ScoreRing + pillar bars, potential uplift sidebar
  QuickWinsRow            ← 3 × QuickWinCard — THE focal component
  [TrendChart | MonitorPanel]   ← 1.4fr / 1fr grid
  RecentScansTable
```

**QuickWinCard interaction:** click → `navigateTo(\`/app/tools/\${toolId}?from=\${scanId}\`)`. On hover, box-shadow `0 0 30px {pillar.color}25` and border-color `{pillar.color}40`.

**Do not** use a traditional sidebar. Rail is 56px, icons only, with `<UTooltip>` (or equivalent) on hover.

### 3.2 Scan Result — `pages/app/scan/[scanId].vue`

**Convex:** `api.scans.get(scanId)` returning `{ scan, issues: IssueRecord[] }`.

```ts
interface IssueRecord {
  id: string; pillar: PillarKey; status: "pass"|"warn"|"crit";
  title: string; blurb: string; toolId: string | null;
}
```

**Tree:**
```
ResultHero          ← score ring (size 140) + 7 pillar score bubbles
FilterToolbar       ← sticky top-[68px], backdrop-blur, all/crit/warn/pass + pillar pills
IssueList
  PillarGroup × 7   ← colored 2px left rail running top:44 bottom:0
    IssueRow        ← [110px status badge][1fr title/blurb][auto CTA]
```

**IssueRow CTA logic (exact):**
- `iss.toolId` → `<NuxtLink>` styled `btn-pink-ghost`, label `Open in {tool.name} →`
- `iss.status === "pass"` → muted `✓ verified`
- else → `Learn more →`

### 3.3 CSP Builder — `pages/app/tools/csp.vue`

**Why before tools index:** it's the exemplar. Completing it validates the tool-page layout for the remaining 9.

**State:**
```ts
const directives = ref<{ name: string; values: string[] }[]>(DEFAULT_DIRECTIVES);
const UNSAFE = ["'unsafe-inline'", "'unsafe-eval'", "*", "data:"];
const hasUnsafe = computed(() => directives.value.some(d => d.values.some(v => UNSAFE.includes(v))));
const uplift    = computed(() => hasUnsafe.value ? 9 : 12);
const header    = computed(() =>
  directives.value.filter(d => d.values.length).map(d => `${d.name} ${d.values.join(" ")}`).join("; ")
);
```

**Layout:** 60px header strip + 40/60 split below. Left: directive editor with tag chips + `+ Add source` input per row. Right (top-to-bottom): LiveHeaderOutput → ImpactPreview → InstallAccordion (5 targets).

**Install snippets:** copy `INSTALL_SNIPPETS` from `src/csp.jsx` verbatim into `app/lib/cspInstallers.ts`.

**Save & rescan action:**
```ts
async function saveAndRescan() {
  await convex.mutation(api.tools.saveCspConfig, { url, header: header.value });
  const scanId = await convex.action(api.scanAction.runScan, { url });
  await navigateTo(`/app/scan/${scanId}`);
}
```

### 3.4 Tools Index — `pages/app/tools/index.vue`

Trivial after ToolCard exists.

**Data:** static `TOOLS` array in `app/lib/tools.ts` — copy verbatim from `src/data.jsx`.

```
ToolsHeader
TabBar           ← All + 5 pillar tabs with counts
grid-cols-3      ← ToolCard × N, filtered by active tab
RoadmapStrip
```

**Tool card hover:** `boxShadow: 0 0 30px {pillar.color}30`, accent bar `2px → 3px`.

### 3.5 Landing — `pages/index.vue`

**Most bespoke — last.** No Convex wiring except `api.scans.countToday` for the live chip and optionally `api.scans.recentPublic` for the feed (if you expose a public subset — verify with user first).

**Sections (in order):** Hero, Coverage, How it works, Sample result, Pricing, Love, FAQ.

**Fixed left section-dot nav:** use `IntersectionObserver` on section refs; `threshold: 0.4`. Active dot fills pink; fill-line height is `(active+1) / 7 * 100%`.

**Live feed marquee:** triple the feed array for seamless loop, animate `transform: translateY(0 → -50%)` over 28s linear infinite.

---

## Phase 4 — Verification

After each screen PR, run:

1. `pnpm build` — zero errors, zero warnings.
2. `pnpm typecheck` — zero errors.
3. Open at 1440×900 viewport. Screenshot. Diff against the prototype screen. Spacing, colors, font sizes must match within 2px.
4. Tab through with keyboard — focus rings must use `var(--brand)`.
5. Disable animations in system prefs; confirm the UI still conveys hierarchy without motion.

---

## Phase 5 — Things to ask the user before you start

Write these questions to the user and wait for answers:

1. **Routing:** current dashboard route? Current scan result route? Should I match or reshape?
2. **Auth:** is there a composable like `useUser()` I should pull from for the top strip avatar?
3. **Tool slugs:** is `/app/tools/csp` acceptable, or do you have a preferred pattern?
4. **Icon library:** use inline SVG (default) or your existing icon system?
5. **Component naming:** `ScoreRing` or `SPScoreRing` or scoped under a namespace?
6. **Do the 10 tool pages exist in any form today?** If yes, list them so I don't duplicate routes.

---

## Motion rules (enforce exactly)

| Animation | Trigger | Duration | Easing |
|---|---|---|---|
| Score ring fill | mount / score change | 800ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Feed marquee | always | 28s | `linear` |
| Pulse dot | always | 1.5s | `ease-in-out` |
| Counter tick | hero mount | 1100ms | `easeOutCubic` |
| Card hover | `.lift` | 200ms | `ease` |
| Button press | all btns | 150ms | `ease` (scale 0.98) |
| Chevron bounce | scroll hint only | 2s | `ease-in-out` |
| Accordion open | FAQ / install | 350ms | `cubic-bezier(0.16, 1, 0.3, 1)` |

**Forbidden:** fade-in-from-bottom on scroll, parallax, any additional scroll-driven motion.

---

## Anti-patterns (blocking in review)

- Traditional left sidebar
- Light mode
- shadcn/Radix default radii (must be 16px cards, 9px buttons)
- Rainbow gradient backgrounds
- Pillar color used decoratively — must map to pillar / issue / tool / uplift
- Emoji in UI
- Centered hero headline on gradient blob

---

## Reference files in handoff project

- `ScanPulse.html` — live prototype
- `styles/tokens.css` — copy verbatim
- `src/data.jsx` — data shapes → TypeScript interfaces
- `src/primitives.jsx` — porting targets for `app/components/scanpulse/`
- `src/landing.jsx`, `src/dashboard.jsx`, `src/result.jsx`, `src/tools.jsx`, `src/csp.jsx` — screen layouts

---

## Definition of done

- [ ] Phase 0 audit posted and user-confirmed.
- [ ] Phase 1 tokens merged, dev server renders with Space Grotesk.
- [ ] Phase 2 primitives merged, sandbox page matches prototype screenshot.
- [ ] Phases 3.1–3.5 merged as 5 separate PRs, each screenshot-diffed.
- [ ] `pnpm build && pnpm typecheck` clean.
- [ ] Every issue → tool link tested end to end (Dashboard Quick Win → CSP Builder → Save & Rescan → Scan Result).
