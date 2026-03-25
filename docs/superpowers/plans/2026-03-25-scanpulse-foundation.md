# ScanPulse Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ScanPulse website health scanner SaaS — landing page, auth, Convex backend, and scan engine — using Nuxt 4, PrimeVue, TailwindCSS, Clerk, and Convex.

**Architecture:** Nuxt 4 SSR app with `app/` directory layout. Clerk handles auth via `@clerk/nuxt` module with middleware protecting `/dashboard` and `/results`. Convex provides the realtime database and serverless scan actions. PrimeVue provides base UI primitives; Tailwind handles all visual design.

**Tech Stack:** Nuxt 4, Vue 3, PrimeVue, TailwindCSS, Clerk (`@clerk/nuxt`), Convex, TypeScript, animejs

---

## File Map

```
app/
  app.vue                          — root shell (NuxtRouteAnnouncer + NuxtPage)
  assets/
    css/
      main.css                     — global styles, fonts, component classes
  components/
    Logo.vue                       — animated SVG radar logo
    NavBar.vue                     — top nav (logo, sign in/up or user button)
    PillarCard.vue                 — security/performance/seo score card
    ScoreRing.vue                  — animated SVG circular score display
    ScanInput.vue                  — URL input + scan button (reused on landing + dashboard)
  pages/
    index.vue                      — landing page (hero, pillars, features, FAQ)
    sign-in.vue                    — Clerk sign-in embed
    sign-up.vue                    — Clerk sign-up embed
    dashboard/
      index.vue                    — scan history list
    results/
      index.vue                    — scan results display
  middleware/
    auth.ts                        — redirect unauthenticated users from protected routes
convex/
  schema.ts                        — Convex table definitions
  scans.ts                         — scan mutations + queries
  scanAction.ts                    — "use node" server action: fetch URL + run checks
nuxt.config.ts                     — modules, runtimeConfig, routeRules
tailwind.config.ts                 — design tokens (already created)
```

---

## Task 1: Global CSS & Fonts

**Files:**
- Create: `app/assets/css/main.css`
- Modify: `nuxt.config.ts`

- [ ] Create `app/assets/css/main.css` with Google Fonts import, CSS variables, and Tailwind component classes:

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { @apply scroll-smooth; }
  body { @apply bg-dark text-white font-body antialiased overflow-x-hidden; }
  h1, h2, h3, h4 { @apply font-display; }
}

@layer components {
  .btn-primary {
    @apply bg-primary hover:bg-primary-hover text-white font-display font-semibold
           px-6 py-3 rounded-lg transition-all duration-200 shadow-glow-primary
           hover:shadow-glow-primary hover:-translate-y-0.5 active:translate-y-0;
  }
  .btn-secondary {
    @apply bg-dark-elevated border border-dark-border text-white font-display font-medium
           px-6 py-3 rounded-lg transition-all duration-200 hover:border-white/20;
  }
  .btn-ghost {
    @apply text-white/60 hover:text-white font-display font-medium
           px-4 py-2 rounded-lg transition-colors duration-200;
  }
  .card {
    @apply bg-dark-surface border border-dark-border rounded-card p-5;
  }
  .card-interactive {
    @apply card cursor-pointer hover:border-white/15 transition-all duration-200
           hover:shadow-elevation-md hover:-translate-y-0.5;
  }
  .input-field {
    @apply w-full bg-dark-elevated border border-dark-border text-white
           placeholder-white/30 rounded-lg px-4 py-3 font-body
           focus:outline-none focus:border-primary/60 transition-colors duration-200;
  }
  .badge {
    @apply inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-medium;
  }
  .badge-success { @apply badge bg-success/10 text-success border border-success/20; }
  .badge-warning { @apply badge bg-warning/10 text-warning border border-warning/20; }
  .badge-danger  { @apply badge bg-danger/10 text-danger border border-danger/20; }
  .badge-primary { @apply badge bg-primary/10 text-primary border border-primary/20; }
  .section { @apply py-20 px-6 max-w-6xl mx-auto; }
  .section-title { @apply font-display font-bold text-4xl md:text-5xl text-white leading-tight; }
  .section-subtitle { @apply font-body text-white/55 text-lg leading-relaxed; }
}

@layer utilities {
  .text-gradient {
    @apply bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent;
  }
  .text-gradient-multi {
    background: linear-gradient(90deg, #00d4aa, #ffaa00, #6c5ce7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .animation-delay-100 { animation-delay: 100ms; }
  .animation-delay-200 { animation-delay: 200ms; }
  .animation-delay-300 { animation-delay: 300ms; }
  .animation-delay-400 { animation-delay: 400ms; }
  .animation-delay-500 { animation-delay: 500ms; }
}

@keyframes scan-beam {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(80px); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes pulse-ring {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 0; transform: scale(2.2); }
}
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

- [ ] Register CSS in `nuxt.config.ts`:

```ts
css: ['~/assets/css/main.css'],
```

- [ ] Verify: `npm run dev` starts without errors, body background is `#07070a`

- [ ] Commit:
```bash
git add app/assets/css/main.css nuxt.config.ts
git commit -m "feat: add global CSS, fonts, and design tokens"
```

---

## Task 2: Root App Shell

**Files:**
- Modify: `app/app.vue`

- [ ] Replace `app/app.vue` with:

```vue
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
```

- [ ] Commit:
```bash
git add app/app.vue
git commit -m "feat: set up root app shell"
```

---

## Task 3: Logo Component

**Files:**
- Create: `app/components/Logo.vue`

- [ ] Create `app/components/Logo.vue` — animated SVG radar logo with animejs:

```vue
<script setup lang="ts">
const props = defineProps<{ animate?: boolean; class?: string }>()
const svgRef = ref<SVGSVGElement | null>(null)

onMounted(async () => {
  if (props.animate === false) return
  const anime = (await import('animejs')).default
  anime({ targets: '.radar-sweep', rotate: 360, duration: 4000, easing: 'linear', loop: true })
  anime({ targets: '.pulse-ring', scale: [1, 2], opacity: [0.5, 0], duration: 2000, easing: 'easeOutCubic', loop: true, delay: (_: Element, i: number) => i * 600 })
  anime({ targets: '.logo-center', scale: [1, 1.15, 1], duration: 1500, easing: 'easeInOutSine', loop: true })
})
</script>

<template>
  <svg ref="svgRef" viewBox="0 0 48 48" :class="props.class ?? 'w-10 h-10'" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ec3586" />
        <stop offset="100%" stop-color="#ff5fa3" />
      </linearGradient>
      <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ec3586" stop-opacity="0" />
        <stop offset="50%" stop-color="#ec3586" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#ec3586" stop-opacity="0" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="22" fill="#12121a" stroke="#2a2a3a" stroke-width="1" />
    <circle class="pulse-ring" cx="24" cy="24" r="8" fill="none" stroke="#ec3586" stroke-width="1" opacity="0.5" />
    <circle class="pulse-ring" cx="24" cy="24" r="8" fill="none" stroke="#ec3586" stroke-width="1" opacity="0.5" />
    <circle cx="24" cy="24" r="8"  fill="none" stroke="#2a2a3a" stroke-width="0.5" />
    <circle cx="24" cy="24" r="14" fill="none" stroke="#2a2a3a" stroke-width="0.5" />
    <circle cx="24" cy="24" r="20" fill="none" stroke="#2a2a3a" stroke-width="0.5" />
    <line x1="24" y1="4"  x2="24" y2="44" stroke="#2a2a3a" stroke-width="0.5" />
    <line x1="4"  y1="24" x2="44" y2="24" stroke="#2a2a3a" stroke-width="0.5" />
    <g class="radar-sweep" style="transform-origin: 24px 24px">
      <path d="M24 24 L24 4 A20 20 0 0 1 44 24 Z" fill="url(#sweepGrad)" opacity="0.3" />
      <line x1="24" y1="24" x2="24" y2="4" stroke="#ec3586" stroke-width="1.5" />
    </g>
    <circle class="logo-center" cx="24" cy="24" r="4" fill="url(#logoGrad)" />
    <circle cx="32" cy="16" r="2"   fill="#00d4aa" opacity="0.8" />
    <circle cx="14" cy="30" r="1.5" fill="#ffaa00" opacity="0.8" />
    <circle cx="36" cy="32" r="1.5" fill="#6c5ce7" opacity="0.8" />
  </svg>
</template>
```

- [ ] Commit:
```bash
git add app/components/Logo.vue
git commit -m "feat: add animated Logo component"
```

---

## Task 4: NavBar Component

**Files:**
- Create: `app/components/NavBar.vue`

- [ ] Create `app/components/NavBar.vue`:

```vue
<script setup lang="ts">
const { isSignedIn } = useAuth()
</script>

<template>
  <nav class="fixed top-0 inset-x-0 z-50 border-b border-dark-border bg-dark/80 backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-3">
        <Logo class="w-9 h-9" />
        <span class="font-display font-bold text-lg text-white">ScanPulse</span>
      </NuxtLink>

      <div class="flex items-center gap-3">
        <template v-if="isSignedIn">
          <NuxtLink to="/dashboard" class="btn-ghost text-sm">Dashboard</NuxtLink>
          <UserButton />
        </template>
        <template v-else>
          <NuxtLink to="/sign-in" class="btn-ghost text-sm">Sign in</NuxtLink>
          <NuxtLink to="/sign-up" class="btn-primary text-sm py-2">Get started free</NuxtLink>
        </template>
      </div>
    </div>
  </nav>
</template>
```

- [ ] Commit:
```bash
git add app/components/NavBar.vue
git commit -m "feat: add NavBar with Clerk auth state"
```

---

## Task 5: Clerk Auth Pages & Middleware

**Files:**
- Create: `app/pages/sign-in.vue`
- Create: `app/pages/sign-up.vue`
- Create: `app/middleware/auth.ts`
- Modify: `nuxt.config.ts`

- [ ] Create `app/pages/sign-in.vue`:

```vue
<template>
  <div class="min-h-screen bg-dark flex items-center justify-center">
    <SignIn />
  </div>
</template>
```

- [ ] Create `app/pages/sign-up.vue`:

```vue
<template>
  <div class="min-h-screen bg-dark flex items-center justify-center">
    <SignUp />
  </div>
</template>
```

- [ ] Create `app/middleware/auth.ts`:

```ts
export default defineNuxtRouteMiddleware(() => {
  const { isSignedIn } = useAuth()
  if (!isSignedIn.value) {
    return navigateTo('/sign-in')
  }
})
```

- [ ] Add Clerk redirect URLs to `nuxt.config.ts` runtimeConfig:

```ts
clerk: {
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/dashboard',
},
```

- [ ] Commit:
```bash
git add app/pages/sign-in.vue app/pages/sign-up.vue app/middleware/auth.ts nuxt.config.ts
git commit -m "feat: add Clerk auth pages and route middleware"
```

---

## Task 6: Convex Schema & Client Setup

**Files:**
- Create: `convex/schema.ts`
- Create: `convex/scans.ts`
- Create: `app/plugins/convex.client.ts`

- [ ] Create `convex/schema.ts`:

```ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    plan: v.union(v.literal('free'), v.literal('pro')),
    scanCount: v.number(),
  }).index('by_clerk', ['clerkId']),

  scans: defineTable({
    userId: v.string(),
    url: v.string(),
    status: v.union(v.literal('pending'), v.literal('running'), v.literal('done'), v.literal('error')),
    securityScore: v.optional(v.number()),
    performanceScore: v.optional(v.number()),
    seoScore: v.optional(v.number()),
    overallScore: v.optional(v.number()),
    issues: v.optional(v.array(v.object({
      pillar: v.string(),
      severity: v.union(v.literal('critical'), v.literal('warning'), v.literal('pass')),
      title: v.string(),
      description: v.string(),
    }))),
    errorMessage: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status']),
})
```

- [ ] Create `convex/scans.ts` with query + mutation stubs:

```ts
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const createScan = mutation({
  args: { userId: v.string(), url: v.string() },
  handler: async (ctx, { userId, url }) => {
    return await ctx.db.insert('scans', {
      userId,
      url,
      status: 'pending',
    })
  },
})

export const getScansByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('scans')
      .withIndex('by_user', q => q.eq('userId', userId))
      .order('desc')
      .take(20)
  },
})

export const getScan = query({
  args: { scanId: v.id('scans') },
  handler: async (ctx, { scanId }) => {
    return await ctx.db.get(scanId)
  },
})

export const updateScan = mutation({
  args: {
    scanId: v.id('scans'),
    status: v.union(v.literal('pending'), v.literal('running'), v.literal('done'), v.literal('error')),
    securityScore: v.optional(v.number()),
    performanceScore: v.optional(v.number()),
    seoScore: v.optional(v.number()),
    overallScore: v.optional(v.number()),
    issues: v.optional(v.array(v.object({
      pillar: v.string(),
      severity: v.union(v.literal('critical'), v.literal('warning'), v.literal('pass')),
      title: v.string(),
      description: v.string(),
    }))),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { scanId, ...updates }) => {
    await ctx.db.patch(scanId, updates)
  },
})
```

- [ ] Create `app/plugins/convex.client.ts` to provide Convex client:

```ts
import { ConvexClient } from 'convex/browser'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const client = new ConvexClient(config.public.convexUrl as string)

  return {
    provide: {
      convex: client,
    },
  }
})
```

- [ ] Run `npx convex dev` once to push schema (requires CONVEX_DEPLOY_KEY or logged-in Convex CLI)
- [ ] Commit:
```bash
git add convex/schema.ts convex/scans.ts app/plugins/convex.client.ts
git commit -m "feat: add Convex schema and scan mutations/queries"
```

---

## Task 7: Scan Action (Server-Side Scan Engine)

**Files:**
- Create: `convex/scanAction.ts`

- [ ] Create `convex/scanAction.ts` — the core scan engine running in Convex Node.js action:

```ts
'use node'

import { action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'

interface ScanIssue {
  pillar: string
  severity: 'critical' | 'warning' | 'pass'
  title: string
  description: string
}

export const runScan = action({
  args: { scanId: v.id('scans'), url: v.string() },
  handler: async (ctx, { scanId, url }) => {
    await ctx.runMutation(api.scans.updateScan, { scanId, status: 'running' })

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const start = Date.now()
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'ScanPulse/1.0' },
      })
      const ttfb = Date.now() - start
      clearTimeout(timeout)

      const html = await res.text()
      const headers = Object.fromEntries(res.headers.entries())

      const issues: ScanIssue[] = []

      // ── Security checks ──────────────────────────────────────
      if (!url.startsWith('https://')) {
        issues.push({ pillar: 'security', severity: 'critical', title: 'No HTTPS', description: 'Site is not served over HTTPS. All traffic is unencrypted.' })
      }
      if (!headers['strict-transport-security']) {
        issues.push({ pillar: 'security', severity: 'warning', title: 'Missing HSTS header', description: 'Add Strict-Transport-Security to enforce HTTPS.' })
      }
      if (!headers['content-security-policy']) {
        issues.push({ pillar: 'security', severity: 'warning', title: 'Missing CSP header', description: 'Content-Security-Policy helps prevent XSS attacks.' })
      }
      if (!headers['x-frame-options'] && !headers['content-security-policy']?.includes('frame-ancestors')) {
        issues.push({ pillar: 'security', severity: 'warning', title: 'Missing X-Frame-Options', description: 'Site may be vulnerable to clickjacking.' })
      }
      if (!headers['x-content-type-options']) {
        issues.push({ pillar: 'security', severity: 'warning', title: 'Missing X-Content-Type-Options', description: 'Add nosniff to prevent MIME-type sniffing.' })
      }
      const securityPasses = [
        url.startsWith('https://'),
        !!headers['strict-transport-security'],
        !!headers['content-security-policy'],
        !!headers['x-frame-options'],
        !!headers['x-content-type-options'],
      ]
      const securityScore = Math.round((securityPasses.filter(Boolean).length / securityPasses.length) * 100)

      // ── Performance checks ────────────────────────────────────
      if (ttfb > 800) {
        issues.push({ pillar: 'performance', severity: 'critical', title: 'Slow TTFB', description: `Time to first byte was ${ttfb}ms. Aim for under 200ms.` })
      } else if (ttfb > 400) {
        issues.push({ pillar: 'performance', severity: 'warning', title: 'High TTFB', description: `TTFB is ${ttfb}ms. Consider server-side caching.` })
      }
      const encoding = headers['content-encoding']
      if (!encoding || (!encoding.includes('gzip') && !encoding.includes('br'))) {
        issues.push({ pillar: 'performance', severity: 'warning', title: 'No compression', description: 'Enable gzip or Brotli compression to reduce transfer size.' })
      }
      const imgWithoutDimensions = (html.match(/<img(?![^>]*width)[^>]*>/gi) || []).length
      if (imgWithoutDimensions > 0) {
        issues.push({ pillar: 'performance', severity: 'warning', title: 'Images without dimensions', description: `${imgWithoutDimensions} image(s) lack width/height, causing layout shifts.` })
      }
      const perfPasses = [ttfb <= 400, !!encoding, imgWithoutDimensions === 0]
      const performanceScore = Math.round((perfPasses.filter(Boolean).length / perfPasses.length) * 100)

      // ── SEO checks ────────────────────────────────────────────
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (!titleMatch) {
        issues.push({ pillar: 'seo', severity: 'critical', title: 'Missing <title>', description: 'Every page needs a unique, descriptive title tag.' })
      } else if (titleMatch[1].length < 10 || titleMatch[1].length > 60) {
        issues.push({ pillar: 'seo', severity: 'warning', title: 'Title length suboptimal', description: `Title is ${titleMatch[1].length} chars. Aim for 30–60 characters.` })
      }
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      if (!descMatch) {
        issues.push({ pillar: 'seo', severity: 'critical', title: 'Missing meta description', description: 'Add a meta description to improve click-through rates.' })
      }
      const h1Count = (html.match(/<h1[^>]*>/gi) || []).length
      if (h1Count === 0) {
        issues.push({ pillar: 'seo', severity: 'critical', title: 'Missing H1 tag', description: 'Every page should have exactly one H1.' })
      } else if (h1Count > 1) {
        issues.push({ pillar: 'seo', severity: 'warning', title: 'Multiple H1 tags', description: `Found ${h1Count} H1 tags. Use only one per page.` })
      }
      const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html)
      if (!hasCanonical) {
        issues.push({ pillar: 'seo', severity: 'warning', title: 'Missing canonical URL', description: 'Add a canonical link to prevent duplicate content issues.' })
      }
      const seoPasses = [!!titleMatch, !!descMatch, h1Count === 1, hasCanonical]
      const seoScore = Math.round((seoPasses.filter(Boolean).length / seoPasses.length) * 100)

      const overallScore = Math.round((securityScore + performanceScore + seoScore) / 3)

      await ctx.runMutation(api.scans.updateScan, {
        scanId,
        status: 'done',
        securityScore,
        performanceScore,
        seoScore,
        overallScore,
        issues,
      })
    } catch (err) {
      await ctx.runMutation(api.scans.updateScan, {
        scanId,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  },
})
```

- [ ] Push to Convex: `npx convex dev` (let it sync the new action)
- [ ] Commit:
```bash
git add convex/scanAction.ts
git commit -m "feat: add Convex scan engine action with security/performance/SEO checks"
```

---

## Task 8: ScanInput Component

**Files:**
- Create: `app/components/ScanInput.vue`

- [ ] Create `app/components/ScanInput.vue`:

```vue
<script setup lang="ts">
const props = defineProps<{ size?: 'lg' | 'sm' }>()
const emit = defineEmits<{ scan: [url: string] }>()

const url = ref('')
const loading = ref(false)

function normalise(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

async function submit() {
  const finalUrl = normalise(url.value)
  if (!finalUrl) return
  loading.value = true
  emit('scan', finalUrl)
}
</script>

<template>
  <form @submit.prevent="submit" class="flex gap-3" :class="size === 'lg' ? 'flex-col sm:flex-row' : 'flex-row'">
    <input
      v-model="url"
      type="url"
      placeholder="https://yoursite.com"
      class="input-field flex-1"
      :class="size === 'lg' ? 'text-lg py-4' : ''"
      :disabled="loading"
    />
    <button type="submit" class="btn-primary whitespace-nowrap" :disabled="loading">
      <span v-if="loading" class="flex items-center gap-2">
        <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-dashoffset="12" />
        </svg>
        Scanning…
      </span>
      <span v-else>{{ size === 'lg' ? 'Scan my website →' : 'Scan →' }}</span>
    </button>
  </form>
</template>
```

- [ ] Commit:
```bash
git add app/components/ScanInput.vue
git commit -m "feat: add ScanInput component"
```

---

## Task 9: Landing Page

**Files:**
- Create: `app/pages/index.vue`

- [ ] Create `app/pages/index.vue` with hero, pillars, features, FAQ sections:

```vue
<script setup lang="ts">
useSeoMeta({
  title: 'ScanPulse — Website Health Scanner',
  description: 'Scan your website for security vulnerabilities, performance issues, and SEO problems. Free, instant, no signup required.',
})

const { isSignedIn } = useAuth()
const router = useRouter()

const openFaq = ref<number | null>(0)

const faqs = [
  { q: 'Is ScanPulse really free?', a: 'Yes! Basic scans are completely free with no signup required. Premium features like scan history, monitoring, and detailed reports are available on paid plans.' },
  { q: 'How accurate are the security checks?', a: 'We check publicly detectable vulnerabilities — SSL, security headers, and known misconfigurations. For critical apps, combine with a full penetration test.' },
  { q: 'Do I need to install anything?', a: 'No installation required. ScanPulse works entirely from the outside, just like a search engine would.' },
  { q: 'How is the performance score calculated?', a: 'We measure TTFB, compression, image optimisation, and other factors that directly impact Core Web Vitals.' },
  { q: 'Can I scan competitor websites?', a: 'Absolutely. You can scan any publicly accessible website.' },
]

async function handleScan(url: string) {
  if (isSignedIn.value) {
    await router.push(`/results?url=${encodeURIComponent(url)}`)
  } else {
    await router.push(`/sign-up?redirect_url=${encodeURIComponent(`/results?url=${encodeURIComponent(url)}`)}`)
  }
}
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />

    <!-- Hero -->
    <section class="relative pt-32 pb-20 px-6 overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      </div>
      <div class="max-w-4xl mx-auto text-center relative z-10">
        <div class="badge-primary mb-6 inline-flex">Free website health check</div>
        <h1 class="section-title text-5xl md:text-7xl mb-6">
          Your site's complete<br />
          <span class="text-gradient">health checkup</span>
        </h1>
        <p class="section-subtitle max-w-2xl mx-auto mb-10">
          Scan for security vulnerabilities, performance bottlenecks, and SEO issues — all in one place. Get actionable fixes, not just scores.
        </p>
        <ScanInput size="lg" @scan="handleScan" />
      </div>
    </section>

    <!-- Pillars -->
    <section class="section">
      <div class="text-center mb-12">
        <h2 class="section-title text-3xl mb-4">Three pillars. One score.</h2>
        <p class="section-subtitle">Everything that matters for a healthy website.</p>
      </div>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="card border-security/20 hover:border-security/40 transition-colors">
          <div class="w-10 h-10 rounded-lg bg-security/10 flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-security" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="font-display font-bold text-lg text-white mb-2">Security</h3>
          <p class="text-white/50 text-sm leading-relaxed">HTTPS, security headers, SSL configuration, and vulnerability detection.</p>
        </div>
        <div class="card border-performance/20 hover:border-performance/40 transition-colors">
          <div class="w-10 h-10 rounded-lg bg-performance/10 flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-performance" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="font-display font-bold text-lg text-white mb-2">Performance</h3>
          <p class="text-white/50 text-sm leading-relaxed">TTFB, compression, image optimisation, and Core Web Vitals signals.</p>
        </div>
        <div class="card border-seo/20 hover:border-seo/40 transition-colors">
          <div class="w-10 h-10 rounded-lg bg-seo/10 flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-seo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="font-display font-bold text-lg text-white mb-2">SEO</h3>
          <p class="text-white/50 text-sm leading-relaxed">Meta tags, heading structure, canonical URLs, and crawlability.</p>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="section">
      <div class="text-center mb-12">
        <h2 class="section-title text-3xl mb-4">Frequently asked</h2>
      </div>
      <div class="max-w-2xl mx-auto space-y-3">
        <div
          v-for="(faq, i) in faqs"
          :key="i"
          class="card cursor-pointer select-none"
          @click="openFaq = openFaq === i ? null : i"
        >
          <div class="flex items-center justify-between gap-4">
            <span class="font-display font-medium text-white">{{ faq.q }}</span>
            <svg class="w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-200" :class="openFaq === i ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <p v-if="openFaq === i" class="mt-3 text-white/55 text-sm leading-relaxed">{{ faq.a }}</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-dark-border py-8 px-6 text-center text-white/30 text-sm font-body">
      <Logo :animate="false" class="w-7 h-7 mx-auto mb-3 opacity-50" />
      © 2026 ScanPulse. Free website health scanning.
    </footer>
  </div>
</template>
```

- [ ] Verify landing page renders at `http://localhost:3000`
- [ ] Commit:
```bash
git add app/pages/index.vue
git commit -m "feat: add landing page with hero, pillars, and FAQ"
```

---

## Task 10: Dashboard & Results Pages

**Files:**
- Create: `app/pages/dashboard/index.vue`
- Create: `app/pages/results/index.vue`

- [ ] Create `app/pages/dashboard/index.vue`:

```vue
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { userId } = useAuth()
const { $convex } = useNuxtApp()

const scans = ref<any[]>([])

onMounted(async () => {
  if (!userId.value) return
  scans.value = await $convex.query('scans:getScansByUser', { userId: userId.value })
})
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />
    <div class="max-w-4xl mx-auto px-6 pt-28 pb-16">
      <div class="flex items-center justify-between mb-8">
        <h1 class="font-display font-bold text-3xl text-white">My Scans</h1>
      </div>
      <ScanInput @scan="url => navigateTo(`/results?url=${encodeURIComponent(url)}`)" />
      <div class="mt-8 space-y-3">
        <div v-if="scans.length === 0" class="card text-center py-12 text-white/40">
          No scans yet. Enter a URL above to get started.
        </div>
        <NuxtLink
          v-for="scan in scans"
          :key="scan._id"
          :to="`/results?scanId=${scan._id}`"
          class="card-interactive flex items-center justify-between"
        >
          <div>
            <p class="font-display font-medium text-white">{{ scan.url }}</p>
            <p class="text-white/40 text-sm mt-1">{{ scan.status }}</p>
          </div>
          <div v-if="scan.overallScore !== undefined" class="text-2xl font-display font-bold" :class="scan.overallScore >= 80 ? 'text-success' : scan.overallScore >= 60 ? 'text-warning' : 'text-danger'">
            {{ scan.overallScore }}
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
```

- [ ] Create `app/pages/results/index.vue`:

```vue
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { userId } = useAuth()
const { $convex } = useNuxtApp()

const scan = ref<any>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const url = route.query.url as string
  const scanId = route.query.scanId as string

  if (scanId) {
    scan.value = await $convex.query('scans:getScan', { scanId })
    loading.value = false
    return
  }

  if (!url || !userId.value) {
    error.value = 'No URL provided'
    loading.value = false
    return
  }

  const newScanId = await $convex.mutation('scans:createScan', { userId: userId.value, url })
  await $convex.action('scanAction:runScan', { scanId: newScanId, url })

  scan.value = await $convex.query('scans:getScan', { scanId: newScanId })
  loading.value = false
})
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />
    <div class="max-w-4xl mx-auto px-6 pt-28 pb-16">

      <div v-if="loading" class="text-center py-24">
        <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6" />
        <p class="text-white/60 font-body">Scanning your website…</p>
      </div>

      <div v-else-if="error" class="card text-center py-12">
        <p class="text-danger">{{ error }}</p>
      </div>

      <div v-else-if="scan">
        <div class="mb-8">
          <p class="text-white/40 text-sm font-body mb-2">Results for</p>
          <h1 class="font-display font-bold text-2xl text-white break-all">{{ scan.url }}</h1>
        </div>

        <!-- Score cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="card text-center">
            <p class="text-white/40 text-xs uppercase tracking-wider font-display mb-2">Overall</p>
            <p class="font-display font-bold text-4xl" :class="scan.overallScore >= 80 ? 'text-success' : scan.overallScore >= 60 ? 'text-warning' : 'text-danger'">{{ scan.overallScore ?? '—' }}</p>
          </div>
          <div class="card text-center">
            <p class="text-security text-xs uppercase tracking-wider font-display mb-2">Security</p>
            <p class="font-display font-bold text-3xl" :class="scan.securityScore >= 80 ? 'text-success' : scan.securityScore >= 60 ? 'text-warning' : 'text-danger'">{{ scan.securityScore ?? '—' }}</p>
          </div>
          <div class="card text-center">
            <p class="text-performance text-xs uppercase tracking-wider font-display mb-2">Performance</p>
            <p class="font-display font-bold text-3xl" :class="scan.performanceScore >= 80 ? 'text-success' : scan.performanceScore >= 60 ? 'text-warning' : 'text-danger'">{{ scan.performanceScore ?? '—' }}</p>
          </div>
          <div class="card text-center">
            <p class="text-seo text-xs uppercase tracking-wider font-display mb-2">SEO</p>
            <p class="font-display font-bold text-3xl" :class="scan.seoScore >= 80 ? 'text-success' : scan.seoScore >= 60 ? 'text-warning' : 'text-danger'">{{ scan.seoScore ?? '—' }}</p>
          </div>
        </div>

        <!-- Issues -->
        <h2 class="font-display font-bold text-xl text-white mb-4">Issues found</h2>
        <div class="space-y-3">
          <div v-if="!scan.issues?.length" class="card text-center py-8 text-white/40">No issues found.</div>
          <div
            v-for="(issue, i) in scan.issues"
            :key="i"
            class="card"
          >
            <div class="flex items-start gap-3">
              <span :class="{
                'badge-danger': issue.severity === 'critical',
                'badge-warning': issue.severity === 'warning',
                'badge-success': issue.severity === 'pass',
              }" class="badge mt-0.5 flex-shrink-0">{{ issue.severity }}</span>
              <div>
                <p class="font-display font-medium text-white">{{ issue.title }}</p>
                <p class="text-white/50 text-sm mt-1 leading-relaxed">{{ issue.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
```

- [ ] Verify both pages load (dashboard redirects to sign-in when logged out)
- [ ] Commit:
```bash
git add app/pages/dashboard/index.vue app/pages/results/index.vue
git commit -m "feat: add dashboard and results pages"
```

---

## Task 11: Final Wiring & Smoke Test

- [ ] Run `npm run dev` and test full flow:
  1. Visit `/` — landing page loads
  2. Enter a URL and click Scan → redirected to `/sign-up`
  3. Sign up → redirected to `/results?url=...` → scan runs → scores appear
  4. Visit `/dashboard` → scan history shows
- [ ] Run `npm run build` — verify no build errors
- [ ] Commit:
```bash
git add .
git commit -m "feat: ScanPulse foundation complete — Nuxt 4, Clerk, Convex scan engine"
```
