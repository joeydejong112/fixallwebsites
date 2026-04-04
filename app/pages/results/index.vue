<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Scan Results — ScanPulse' })

const route  = useRoute()
const router = useRouter()
const { userId } = useAuth()
const { client, api } = useConvex()

const scan    = ref<any>(null)
const previousScan = ref<any>(null)
const loading = ref(true)
const error   = ref('')
const copied  = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

async function fetchScan(id: string) {
  scan.value = await client.query(api.scans.getScan, { scanId: id as any })
  if (scan.value && scan.value.status === 'done' && scan.value._creationTime) {
    try {
      previousScan.value = await client.query(api.scans.getPreviousScan, {
        url: scan.value.url,
        beforeTs: scan.value._creationTime
      })
    } catch(e) {}
  }
}

function shareLink() {
  const shareUrl = `${window.location.origin}/share/${scan.value._id}`
  navigator.clipboard.writeText(shareUrl)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

function printPDF() {
  window.print()
}

import { FIX_SNIPPETS } from '~/utils/fixSnippets'

const TOOL_LINKS: Record<string, string> = {
  // Security headers
  'Missing HSTS header':              '/tools/security-headers',
  'Weak HSTS configuration':          '/tools/security-headers',
  'Missing clickjacking protection':  '/tools/security-headers',
  'Missing X-Content-Type-Options':   '/tools/security-headers',
  'Missing Referrer-Policy':          '/tools/security-headers',
  'Weak Referrer-Policy':             '/tools/security-headers',
  'Missing Permissions-Policy':       '/tools/security-headers',
  'No COEP header':                   '/tools/security-headers',
  'No COOP header':                   '/tools/security-headers',
  // CSP
  'Missing Content-Security-Policy':  '/tools/csp-builder',
  'Weak CSP configuration':           '/tools/csp-builder',
  // Images
  'Unoptimized image formats':        '/tools/image-optimizer',
  'Images missing lazy loading':      '/tools/image-optimizer',
  'Images without dimensions':        '/tools/image-optimizer',
  // SEO / meta
  'Missing <title> tag':              '/tools/meta-generator',
  'Title length suboptimal':          '/tools/meta-generator',
  'Missing meta description':         '/tools/meta-generator',
  'Meta description length suboptimal': '/tools/meta-generator',
  'Missing canonical URL':            '/tools/meta-generator',
  'Missing viewport meta tag':        '/tools/meta-generator',
  'Incomplete Open Graph tags':       '/tools/meta-generator',
  'Incomplete Twitter Card tags':     '/tools/meta-generator',
  // Robots
  'robots.txt not reachable':         '/tools/robots-txt',
  // Favicon
  'No favicon detected':              '/tools/favicon-generator',
  // Schema
  'No structured data':               '/tools/schema-generator',
  'No author attribution':            '/tools/schema-generator',
  'No publication dates':             '/tools/schema-generator',
  // DNS / email
  'No SPF record found':              '/tools/email-auth',
  'SPF record too permissive':        '/tools/email-auth',
  'No DMARC record found':            '/tools/email-auth',
  'DMARC policy not enforcing':       '/tools/email-auth',
  'No DKIM record detected':          '/tools/email-auth',
}

onMounted(async () => {
  const url    = route.query.url    as string
  const scanId = route.query.scanId as string

  if (scanId) {
    await fetchScan(scanId)
    loading.value = false
    return
  }

  if (!url || !userId.value) {
    error.value   = 'No URL provided.'
    loading.value = false
    return
  }

  try {
    const newScanId = await client.mutation(api.scans.createScan, { userId: userId.value, url })
    client.action(api.scanAction.runScan, { scanId: newScanId, url }).catch(() => {})

    pollInterval = setInterval(async () => {
      await fetchScan(newScanId)
      if (scan.value?.status === 'done' || scan.value?.status === 'error') {
        clearInterval(pollInterval!)
        loading.value = false
        router.replace({ query: { scanId: newScanId } })
      }
    }, 2000)

    await fetchScan(newScanId)
    if (scan.value?.status === 'done' || scan.value?.status === 'error') {
      clearInterval(pollInterval!)
      loading.value = false
      router.replace({ query: { scanId: newScanId } })
    }
  } catch (e) {
    error.value   = e instanceof Error ? e.message : 'Something went wrong.'
    loading.value = false
  }
})

onUnmounted(() => { if (pollInterval) clearInterval(pollInterval) })

function scoreColor(score?: number) {
  if (score == null) return 'text-white/30'
  if (score >= 80)   return 'text-success'
  if (score >= 60)   return 'text-warning'
  return 'text-danger'
}

function barColor(score?: number) {
  if (score == null) return '#ffffff10'
  if (score >= 80)   return '#00d4aa'
  if (score >= 60)   return '#ffaa00'
  return '#ff4757'
}

const pillars = computed(() => [
  { key: 'security',      label: 'Security',      color: '#00d4aa', score: scan.value?.securityScore },
  { key: 'performance',   label: 'Performance',   color: '#ffaa00', score: scan.value?.performanceScore },
  { key: 'seo',           label: 'SEO',            color: '#6c5ce7', score: scan.value?.seoScore },
  { key: 'accessibility', label: 'Accessibility', color: '#a29bfe', score: scan.value?.accessibilityScore },
])

const bonusCards = computed(() => [
  { key: 'dns',   label: 'DNS & Email', color: '#74b9ff', score: scan.value?.dnsScore },
  { key: 'trust', label: 'Trust',       color: '#fd79a8', score: scan.value?.trustScore },
])

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

const certDays   = computed(() => daysUntil(scan.value?.certExpiry))
const domainDays = computed(() => daysUntil(scan.value?.domainExpiry))

type TabKey = 'all' | 'security' | 'performance' | 'seo' | 'accessibility' | 'dns' | 'trust'
const activeTab = ref<TabKey>('all')
const issueTabs: TabKey[] = ['all', 'security', 'performance', 'seo', 'accessibility', 'dns', 'trust']

const displayIssues = computed(() => {
  if (!scan.value?.issues) return []
  if (activeTab.value === 'all') return scan.value.issues
  return scan.value.issues.filter((i: any) => i.pillar === activeTab.value)
})

const issueCount = (tab: string) => {
  if (!scan.value?.issues) return 0
  if (tab === 'all') return scan.value.issues.length
  return scan.value.issues.filter((i: any) => i.pillar === tab).length
}

// SVG arc helpers for score rings
function arcPath(score: number, r = 42) {
  const c = 2 * Math.PI * r
  return { dasharray: `${(score / 100) * c} ${c}`, dashoffset: c * 0.25 }
}
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />

    <!-- Grid bg -->
    <div
      class="fixed inset-0 pointer-events-none z-0"
      style="background-image:
        linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),
        linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px);
        background-size:64px 64px"
    />

    <!-- ── Scanning state ────────────────────────────────────────── -->
    <div
      v-if="loading || scan?.status === 'pending' || scan?.status === 'running'"
      class="relative z-10 flex flex-col items-center justify-center min-h-screen gap-0"
    >
      <!-- Spinning rings -->
      <div class="relative w-32 h-32 mb-10">
        <div class="absolute inset-0 rounded-full border border-white/[0.04]" />
        <div class="absolute inset-5 rounded-full border border-white/[0.06]" />
        <div class="absolute inset-10 rounded-full border border-white/[0.08]" />
        <div class="absolute inset-0 rounded-full border-t-2 border-primary" style="animation: spin-ring 1.4s linear infinite" />
        <div class="absolute inset-5 rounded-full border-t border-primary/40" style="animation: spin-ring 2.2s linear infinite reverse" />
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-2.5 h-2.5 rounded-full bg-primary" style="animation: pulse-dot 1.4s ease-in-out infinite" />
        </div>
      </div>

      <p class="font-display font-bold text-white mb-2" style="font-size: 1.5rem; letter-spacing: -0.03em">
        {{ scan?.status === 'running' ? 'Scanning…' : 'Initialising…' }}
      </p>
      <p class="text-white/50 font-body text-sm mb-1">{{ scan?.url }}</p>
      <p class="text-white/40 font-body text-xs">Running 84 checks across security, performance, SEO, accessibility, DNS & trust</p>

      <!-- Animated progress dots -->
      <div class="flex gap-1.5 mt-8">
        <div v-for="n in 3" :key="n" class="w-1 h-1 rounded-full bg-primary/50" :style="`animation: pulse-dot 1.4s ease-in-out infinite; animation-delay: ${(n-1)*0.2}s`" />
      </div>
    </div>

    <!-- ── Error state ───────────────────────────────────────────── -->
    <div v-else-if="error || scan?.status === 'error'" class="relative z-10 flex flex-col items-center justify-center min-h-screen">
      <div class="w-14 h-14 rounded-full bg-danger/8 border border-danger/15 flex items-center justify-center mb-6">
        <svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <p class="font-display font-bold text-white text-xl mb-2 tracking-tight">Scan failed</p>
      <p class="text-white/55 text-sm font-body mb-8 max-w-xs text-center">{{ error || scan?.errorMessage }}</p>
      <NuxtLink to="/dashboard" class="btn-secondary text-sm">← Back to dashboard</NuxtLink>
    </div>

    <!-- ── Results ───────────────────────────────────────────────── -->
    <div v-else-if="scan?.status === 'done'" class="relative z-10 max-w-5xl mx-auto px-8 pt-28 pb-24">

      <!-- Action Bar (Back + Print + Share) -->
      <div class="flex items-center justify-between mb-10 print:hidden">
        <NuxtLink
          to="/dashboard"
          class="inline-flex items-center gap-2 text-white/25 hover:text-white/55 transition-colors group"
        >
          <svg class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="text-[10px] font-display font-semibold tracking-[0.16em] uppercase">Dashboard</span>
        </NuxtLink>

        <!-- Right actions -->
        <div class="flex items-center gap-3">
          <button @click="printPDF" class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-colors text-white/50 hover:text-white text-xs font-display font-medium">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Save PDF
          </button>
          <button @click="shareLink" class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors text-primary text-xs font-display font-medium">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            {{ copied ? 'Copied!' : 'Share' }}
          </button>
        </div>
      </div>

      <!-- ── Hero row: URL + overall score ── -->
      <div class="flex items-start justify-between gap-12 mb-14">
        <div class="min-w-0 pt-1">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-7 h-px bg-primary" />
            <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">Results</span>
          </div>
          <h1
            class="font-display font-bold text-white leading-tight tracking-[-0.03em] mb-3 break-all"
            style="font-size: clamp(1.4rem, 2.5vw, 1.8rem); max-width: 50ch"
          >{{ scan.url }}</h1>
          <p class="text-white/45 text-sm font-body">Scanned just now · 84 checks</p>
        </div>

        <!-- Big score -->
        <div class="flex-shrink-0 flex flex-col items-center">
          <div class="relative w-36 h-36">
            <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="4" />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                :stroke="barColor(scan.overallScore)"
                stroke-width="4"
                stroke-linecap="round"
                :stroke-dasharray="arcPath(scan.overallScore).dasharray"
                :stroke-dashoffset="-arcPath(scan.overallScore).dashoffset"
                style="transition: stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)"
              />
            </svg>
            <!-- Score display & Indicator -->
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span
                class="font-display font-bold leading-none"
                :class="scoreColor(scan.overallScore)"
                style="font-size: 2.8rem; letter-spacing: -0.06em"
              >{{ scan.overallScore ?? '—' }}</span>

              <div class="flex items-center gap-2 mt-1">
                <span class="text-[11px] font-display font-semibold tracking-[0.14em] uppercase text-white/45">Overall</span>
                <span v-if="previousScan && previousScan.overallScore != null && scan.overallScore != null" 
                      class="text-[10px] font-display font-semibold leading-none rounded-sm px-1"
                      :class="scan.overallScore > previousScan.overallScore ? 'text-success bg-success/10' : (scan.overallScore < previousScan.overallScore ? 'text-danger bg-danger/10' : 'text-white/40 bg-white/5')">
                  {{ scan.overallScore > previousScan.overallScore ? `+${scan.overallScore - previousScan.overallScore}` : (scan.overallScore < previousScan.overallScore ? scan.overallScore - previousScan.overallScore : '=') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Pillar score bars (4 pillars in overall score) ── -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div
          v-for="p in pillars"
          :key="p.key"
          class="pillar-card"
        >
          <div class="absolute top-0 left-0 right-0 h-px" :style="{ background: `linear-gradient(90deg, transparent, ${p.color}50, transparent)` }" />
          <div class="absolute inset-0 pointer-events-none rounded-xl" :style="{ background: `radial-gradient(ellipse at 50% 0%, ${p.color}08 0%, transparent 60%)` }" />

          <div class="relative z-10 flex items-center justify-between mb-5">
            <span class="text-[10px] font-display font-bold tracking-[0.16em] uppercase" :style="{ color: p.color }">{{ p.label }}</span>
            <span
              class="font-display font-bold leading-none"
              :class="scoreColor(p.score)"
              style="font-size: 2.2rem; letter-spacing: -0.04em"
            >{{ p.score ?? '—' }}</span>
          </div>
          <div class="relative z-10 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{ width: (p.score ?? 0) + '%', background: barColor(p.score) }"
            />
          </div>
        </div>
      </div>

      <!-- ── Bonus cards (DNS & Trust — not in overall score) ── -->
      <div class="flex gap-3 mb-6">
        <div
          v-for="b in bonusCards"
          :key="b.key"
          class="pillar-card flex-1"
          style="padding: 14px 18px"
        >
          <div class="absolute top-0 left-0 right-0 h-px" :style="{ background: `linear-gradient(90deg, transparent, ${b.color}40, transparent)` }" />
          <div class="relative z-10 flex items-center justify-between">
            <div>
              <span class="text-[11px] font-display font-bold tracking-[0.16em] uppercase block mb-0.5" :style="{ color: b.color }">{{ b.label }}</span>
              <span class="text-[11px] font-body text-white/45">Bonus · not in overall</span>
            </div>
            <span
              class="font-display font-bold leading-none"
              :class="scoreColor(b.score)"
              style="font-size: 1.7rem; letter-spacing: -0.04em"
            >{{ b.score ?? '—' }}</span>
          </div>
        </div>

        <!-- Cert + Domain expiry strip -->
        <div v-if="certDays !== null || domainDays !== null" class="pillar-card flex-1" style="padding: 14px 18px">
          <div class="relative z-10 flex flex-col gap-2">
            <div v-if="certDays !== null" class="flex items-center justify-between">
              <span class="text-[11px] font-display tracking-[0.14em] uppercase text-white/50">SSL cert</span>
              <span
                class="text-[12px] font-display font-bold"
                :class="certDays < 7 ? 'text-danger' : certDays < 30 ? 'text-warning' : 'text-success'"
              >{{ certDays }}d</span>
            </div>
            <div v-if="domainDays !== null" class="flex items-center justify-between">
              <span class="text-[11px] font-display tracking-[0.14em] uppercase text-white/50">Domain</span>
              <span
                class="text-[12px] font-display font-bold"
                :class="domainDays < 7 ? 'text-danger' : domainDays < 30 ? 'text-warning' : 'text-success'"
              >{{ domainDays }}d</span>
            </div>
            <div v-if="scan.carbonGrams != null" class="flex items-center justify-between">
              <span class="text-[11px] font-display tracking-[0.14em] uppercase text-white/50">CO₂/view</span>
              <span class="text-[12px] font-display font-bold" :class="scan.carbonGrams > 0.5 ? 'text-warning' : 'text-success'">
                {{ scan.carbonGrams }}g
              </span>
            </div>
            <div v-if="scan.greenHosting != null" class="flex items-center gap-1.5 mt-0.5">
              <div class="w-2 h-2 rounded-full" :class="scan.greenHosting ? 'bg-success' : 'bg-white/20'" />
              <span class="text-[11px] font-body" :class="scan.greenHosting ? 'text-success' : 'text-white/25'">
                {{ scan.greenHosting ? 'Green hosting' : 'Not green hosted' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tech stack badges ── -->
      <div v-if="scan.detectedTech?.length" class="flex flex-wrap gap-2.5 mb-8">
        <span class="text-[11px] font-display font-semibold tracking-[0.14em] uppercase text-white/45 self-center mr-1">Stack</span>
        <span
          v-for="tech in scan.detectedTech"
          :key="tech"
          class="text-[12px] font-body text-white/55 bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1"
        >{{ tech }}</span>
      </div>

      <!-- ── Issues ── -->
      <div>
        <!-- Tab bar -->
        <div class="flex items-end gap-0.5 border-b border-white/[0.05] mb-6 overflow-x-auto overflow-y-hidden">
          <button
            v-for="tab in issueTabs"
            :key="tab"
            class="results-tab"
            :class="activeTab === tab ? 'results-tab--active' : ''"
            @click="activeTab = tab"
          >
            <span class="capitalize">{{ tab === 'dns' ? 'DNS' : tab === 'seo' ? 'SEO' : tab }}</span>
            <span class="results-tab__count">{{ issueCount(tab) }}</span>
          </button>
        </div>

        <!-- Issue rows -->
        <div class="space-y-1.5">
          <div
            v-for="(issue, i) in displayIssues"
            :key="i"
            class="issue-row"
            :class="{
              'issue-row--critical': issue.severity === 'critical',
              'issue-row--warning':  issue.severity === 'warning',
              'issue-row--pass':     issue.severity === 'pass',
            }"
          >
            <!-- Severity dot -->
            <div
              class="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
              :class="{
                'bg-danger':  issue.severity === 'critical',
                'bg-warning': issue.severity === 'warning',
                'bg-success': issue.severity === 'pass',
              }"
            />

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 flex-wrap mb-0.5">
                <p class="font-display font-semibold text-white/85 text-sm">{{ issue.title }}</p>
                <span
                  class="text-[8px] font-display font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full"
                  :class="{
                    'bg-danger/8 text-danger':   issue.severity === 'critical',
                    'bg-warning/8 text-warning': issue.severity === 'warning',
                    'bg-success/8 text-success': issue.severity === 'pass',
                  }"
                >{{ issue.severity }}</span>
              </div>
              <p class="text-white/55 text-xs font-body leading-relaxed max-w-2xl">{{ issue.description }}</p>
              
              <!-- Fix recommendation -->
              <div v-if="issue.severity !== 'pass' && (FIX_SNIPPETS[issue.title] || TOOL_LINKS[issue.title])" class="mt-3 pt-3 border-t border-white/[0.04] max-w-2xl">
                <div v-if="FIX_SNIPPETS[issue.title]">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span class="text-[10px] font-display font-semibold uppercase tracking-wider text-white/40">How to fix</span>
                  </div>
                  <div class="bg-[#07070a] border border-white/[0.05] rounded-lg p-3 overflow-x-auto">
                    <pre class="text-[11px] font-mono text-white/70 whitespace-pre-wrap">{{ FIX_SNIPPETS[issue.title]?.generic }}</pre>
                  </div>
                </div>
                <NuxtLink
                  v-if="TOOL_LINKS[issue.title]"
                  :to="TOOL_LINKS[issue.title]"
                  class="tool-fix-link"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-4 10H4V5h14v14z"/><path d="M6 13h5v4H6zm6-6h4v3h-4zm0 4h4v6h-4zM6 7h5v5H6z"/></svg>
                  Fix with our tool
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </NuxtLink>
              </div>
            </div>

            <span class="flex-shrink-0 text-[11px] font-display font-bold uppercase tracking-[0.14em] text-white/35">
              {{ issue.pillar }}
            </span>
          </div>

          <div v-if="!displayIssues.length" class="text-center py-12 text-white/40 text-sm font-body">
            No {{ activeTab === 'all' ? '' : activeTab }} issues found.
          </div>
        </div>

        <!-- Bottom actions -->
        <div class="flex items-center gap-4 mt-10 pt-8 border-t border-white/[0.04]">
          <NuxtLink to="/dashboard" class="btn-secondary text-sm">← Back</NuxtLink>
          <button
            class="btn-ghost text-sm text-white/35 hover:text-white/60"
            @click="$router.push(`/results?url=${encodeURIComponent(scan.url)}`)"
          >Scan again</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Scanning animation ──────────────────────────────── */
@keyframes spin-ring  { from { transform: rotate(0deg) }  to { transform: rotate(360deg) } }
@keyframes pulse-dot  { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.3; transform:scale(0.7) } }

/* ── Pillar cards ────────────────────────────────────── */
.pillar-card {
  position: relative;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 14px;
  padding: 20px 22px 18px;
  overflow: hidden;
  transition: border-color 0.2s ease;
}
.pillar-card:hover { border-color: rgba(255,255,255,0.09); }

/* ── Tabs ────────────────────────────────────────────── */
.results-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: rgba(255,255,255,0.50);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: none;
  border-left: none;
  border-right: none;
  border-top: none;
  cursor: pointer;
  transition: color 0.15s ease;
}
.results-tab:hover { color: rgba(255,255,255,0.75); }
.results-tab--active { color: white; border-bottom-color: #ec3586; }
.results-tab__count {
  font-size: 10px;
  font-weight: 700;
  color: rgba(255,255,255,0.40);
  background: rgba(255,255,255,0.05);
  padding: 1px 6px;
  border-radius: 20px;
}
.results-tab--active .results-tab__count { color: rgba(236,53,134,0.8); background: rgba(236,53,134,0.1); }

/* ── Issue rows ──────────────────────────────────────── */
.issue-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(255,255,255,0.015);
  border: 1px solid rgba(255,255,255,0.04);
  border-left-width: 2px;
  transition: background 0.15s ease;
}
.issue-row:hover { background: rgba(255,255,255,0.03); }
.issue-row--critical { border-left-color: #ff4757; }
.issue-row--warning  { border-left-color: #ffaa00; }
.issue-row--pass     { border-left-color: #00d4aa; }

/* ── Tool fix link ───────────────────────────────────── */
.tool-fix-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #ec3586;
  text-decoration: none;
  transition: opacity 0.15s ease;
}
.tool-fix-link:hover { opacity: 0.75; }

/* ── Print Styles ────────────────────────────────────── */
@media print {
  @page { margin: 1.5cm; }
  .min-h-screen { min-height: auto; background: #07070a !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .btn-secondary, .btn-ghost, header { display: none !important; }
  .border-b, .border-t { border-color: rgba(255,255,255,0.1) !important; }
  .bg-dark { background: #07070a !important; }
  .issue-row { break-inside: avoid; border-color: rgba(255,255,255,0.1) !important; padding: 10px; margin-bottom: 6px; }
  .pillar-card { break-inside: avoid; border-color: rgba(255,255,255,0.1) !important; }
  .print\:hidden { display: none !important; }
}
</style>
