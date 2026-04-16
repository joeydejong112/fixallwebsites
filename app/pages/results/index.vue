<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { origin } = useRequestURL()

useSeoMeta({
  title: 'Scan Results — ScanPulse',
  twitterCard: 'summary_large_image',
})

const route = useRoute()
const router = useRouter()
const { userId } = useAuth()
const { client, api } = useConvex()

const scan = ref<any>(null)
const previousScan = ref<any>(null)
const loading = ref(true)
const error = ref('')
const copied = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

async function fetchScan(id: string) {
  scan.value = await client.query(api.scans.getScan, { scanId: id as any })
  if (scan.value && scan.value.status === 'done' && scan.value._creationTime) {
    try {
      previousScan.value = await client.query(api.scans.getPreviousScan, {
        url: scan.value.url,
        beforeTs: scan.value._creationTime
      })
    } catch (e) { }
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
  'Missing HSTS header': '/tools/security-headers',
  'Weak HSTS configuration': '/tools/security-headers',
  'Missing clickjacking protection': '/tools/security-headers',
  'Missing X-Content-Type-Options': '/tools/security-headers',
  'Missing Referrer-Policy': '/tools/security-headers',
  'Weak Referrer-Policy': '/tools/security-headers',
  'Missing Permissions-Policy': '/tools/security-headers',
  'No COEP header': '/tools/security-headers',
  'No COOP header': '/tools/security-headers',
  'Missing Content-Security-Policy': '/tools/csp-builder',
  'Weak CSP configuration': '/tools/csp-builder',
  'Unoptimized image formats': '/tools/image-optimizer',
  'Images missing lazy loading': '/tools/image-optimizer',
  'Images without dimensions': '/tools/image-optimizer',
  'Missing <title> tag': '/tools/meta-generator',
  'Title length suboptimal': '/tools/meta-generator',
  'Missing meta description': '/tools/meta-generator',
  'Meta description length suboptimal': '/tools/meta-generator',
  'Missing canonical URL': '/tools/meta-generator',
  'Missing viewport meta tag': '/tools/meta-generator',
  'Incomplete Open Graph tags': '/tools/meta-generator',
  'Incomplete Twitter Card tags': '/tools/meta-generator',
  'robots.txt not reachable': '/tools/robots-txt',
  'No favicon detected': '/tools/favicon-generator',
  'No structured data': '/tools/schema-generator',
  'No author attribution': '/tools/schema-generator',
  'No publication dates': '/tools/schema-generator',
  'No SPF record found': '/tools/email-auth',
  'SPF record too permissive': '/tools/email-auth',
  'No DMARC record found': '/tools/email-auth',
  'DMARC policy not enforcing': '/tools/email-auth',
  'No DKIM record detected': '/tools/email-auth',
  'No llms.txt found': '/tools/ai-optimizer',
  'No llms-full.txt found': '/tools/ai-optimizer',
  'AI crawlers blocked in robots.txt': '/tools/ai-optimizer',
}

// Tool definitions for "Fix Now" section
const FIX_NOW_TOOLS = [
  {
    key: 'csp',
    icon: '🛡️',
    label: 'CSP Builder',
    description: 'Missing CSP, weak headers',
    path: '/tools/csp-builder',
    issueKeys: ['Missing Content-Security-Policy', 'Weak CSP configuration'],
    severity: 'critical',
  },
  {
    key: 'security-headers',
    icon: '🔒',
    label: 'Security Headers',
    description: 'Permissions-Policy, COEP, COOP',
    path: '/tools/security-headers',
    issueKeys: ['Missing HSTS header', 'Weak HSTS configuration', 'Missing clickjacking protection', 'Missing X-Content-Type-Options', 'Missing Referrer-Policy', 'Weak Referrer-Policy', 'Missing Permissions-Policy', 'No COEP header', 'No COOP header'],
    severity: 'warning',
  },
  {
    key: 'meta',
    icon: '🔍',
    label: 'Meta Generator',
    description: 'Missing og:image, description, CООP',
    path: '/tools/meta-generator',
    issueKeys: ['Missing <title> tag', 'Title length suboptimal', 'Missing meta description', 'Meta description length suboptimal', 'Missing canonical URL', 'Missing viewport meta tag', 'Incomplete Open Graph tags', 'Incomplete Twitter Card tags'],
    severity: 'seo',
  },
  {
    key: 'email-auth',
    icon: '📧',
    label: 'Email Auth',
    description: 'DMARC not enforcing, SPF loose',
    path: '/tools/email-auth',
    issueKeys: ['No SPF record found', 'SPF record too permissive', 'No DMARC record found', 'DMARC policy not enforcing', 'No DKIM record detected'],
    severity: 'warning',
  },
  {
    key: 'image-optimizer',
    icon: '🖼️',
    label: 'Image Optimizer',
    description: 'Unoptimised formats, no lazy load',
    path: '/tools/image-optimizer',
    issueKeys: ['Unoptimized image formats', 'Images missing lazy loading', 'Images without dimensions'],
    severity: 'warning',
  },
  {
    key: 'ai-optimizer',
    icon: '🤖',
    label: 'AI Optimizer',
    description: 'No llms.txt, crawlers blocked',
    path: '/tools/ai-optimizer',
    issueKeys: ['No llms.txt found', 'No llms-full.txt found', 'AI crawlers blocked in robots.txt'],
    severity: 'ai',
  },
]

watchEffect(() => {
  if (!scan.value || scan.value.status !== 'done') return
  const scannedUrl = scan.value.url ?? ''
  const score = scan.value.score ?? 0
  const ogImage = `${origin}/og/scan?url=${encodeURIComponent(scannedUrl)}&score=${score}`
  useSeoMeta({
    title: `${scannedUrl} — ScanPulse Results`,
    description: `ScanPulse scanned ${scannedUrl} and gave it a health score of ${score}/100.`,
    ogTitle: `${scannedUrl} scored ${score}/100 on ScanPulse`,
    ogDescription: `94-point website health scan: Security, Performance, SEO, Accessibility, AI Readiness, DNS & Trust.`,
    ogImage,
    twitterImage: ogImage,
    twitterCard: 'summary_large_image',
  })
})

onMounted(async () => {
  const url = route.query.url as string
  const scanId = route.query.scanId as string

  if (scanId) {
    await fetchScan(scanId)
    loading.value = false
    return
  }

  if (!url || !userId.value) {
    error.value = 'No URL provided.'
    loading.value = false
    return
  }

  try {
    const newScanId = await client.mutation(api.scans.createScan, { userId: userId.value, url })
    client.action(api.scanAction.runScan, { scanId: newScanId, url }).catch(() => { })

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
    error.value = e instanceof Error ? e.message : 'Something went wrong.'
    loading.value = false
  }
})

onUnmounted(() => { if (pollInterval) clearInterval(pollInterval) })

function scoreColor(score?: number) {
  if (score == null) return 'text-white/30'
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-warning'
  return 'text-danger'
}

function barColor(score?: number) {
  if (score == null) return '#ffffff10'
  if (score >= 80) return '#00d4aa'
  if (score >= 60) return '#ffaa00'
  return '#ff4757'
}

const pillars = computed(() => [
  { key: 'security', label: 'Security', color: '#00d4aa', score: scan.value?.securityScore },
  { key: 'performance', label: 'Performance', color: '#ffaa00', score: scan.value?.performanceScore },
  { key: 'seo', label: 'SEO', color: '#6c5ce7', score: scan.value?.seoScore },
  { key: 'accessibility', label: 'Accessibility', color: '#a29bfe', score: scan.value?.accessibilityScore },
  { key: 'ai', label: 'AI Readiness', color: '#ff7675', score: scan.value?.aiScore },
  { key: 'dns', label: 'DNS & Email', color: '#74b9ff', score: scan.value?.dnsScore },
  { key: 'trust', label: 'Trust', color: '#fd79a8', score: scan.value?.trustScore },
])

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

const certDays = computed(() => daysUntil(scan.value?.certExpiry))
const domainDays = computed(() => daysUntil(scan.value?.domainExpiry))

type TabKey = 'all' | 'security' | 'performance' | 'seo' | 'accessibility' | 'ai' | 'dns' | 'trust'
const activeTab = ref<TabKey>('all')
const issueTabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'security', label: 'Security' },
  { key: 'performance', label: 'Performance' },
  { key: 'seo', label: 'SEO' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'ai', label: 'AI' },
  { key: 'dns', label: 'DNS' },
  { key: 'trust', label: 'Trust' },
]

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

// Group issues by severity for display
const criticalIssues = computed(() => displayIssues.value.filter((i: any) => i.severity === 'critical'))
const warningIssues = computed(() => displayIssues.value.filter((i: any) => i.severity === 'warning'))
const passIssues = computed(() => displayIssues.value.filter((i: any) => i.severity === 'pass'))

// Expand/collapse state per issue
const expandedIssues = ref<Set<number>>(new Set())
function toggleIssue(index: number) {
  if (expandedIssues.value.has(index)) {
    expandedIssues.value.delete(index)
  } else {
    expandedIssues.value.add(index)
  }
}

// Fix Now: compute which tools have actionable issues
const fixNowTools = computed(() => {
  if (!scan.value?.issues) return []
  return FIX_NOW_TOOLS.map(tool => {
    const count = scan.value.issues.filter(
      (i: any) => tool.issueKeys.includes(i.title) && i.severity !== 'pass'
    ).length
    return { ...tool, count }
  }).filter(t => t.count > 0)
})

// Format scan time
const scanTimeLabel = computed(() => {
  if (!scan.value?._creationTime) return 'just now'
  const diffMs = Date.now() - scan.value._creationTime
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  if (diffH > 0) return `${diffH}h ago`
  if (diffMin > 0) return `${diffMin}m ago`
  return 'just now'
})

// Pillar color map for issue rows
const PILLAR_COLORS: Record<string, string> = {
  security: '#00d4aa',
  performance: '#ffaa00',
  seo: '#6c5ce7',
  accessibility: '#a29bfe',
  ai: '#ff7675',
  dns: '#74b9ff',
  trust: '#fd79a8',
}

function getPillarColor(pillar: string) {
  return PILLAR_COLORS[pillar] || '#ffffff40'
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
    <div class="fixed inset-0 pointer-events-none z-0" style="background-image:
        linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),
        linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px);
        background-size:64px 64px" />

    <!-- ── Scanning state ──────────────────────────────── -->
    <div v-if="loading || scan?.status === 'pending' || scan?.status === 'running'"
      class="relative z-10 flex flex-col items-center justify-center min-h-screen gap-0">
      <div class="relative w-32 h-32 mb-10">
        <div class="absolute inset-0 rounded-full border border-white/[0.04]" />
        <div class="absolute inset-5 rounded-full border border-white/[0.06]" />
        <div class="absolute inset-10 rounded-full border border-white/[0.08]" />
        <div class="absolute inset-0 rounded-full border-t-2 border-primary"
          style="animation: spin-ring 1.4s linear infinite" />
        <div class="absolute inset-5 rounded-full border-t border-primary/40"
          style="animation: spin-ring 2.2s linear infinite reverse" />
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-2.5 h-2.5 rounded-full bg-primary" style="animation: pulse-dot 1.4s ease-in-out infinite" />
        </div>
      </div>
      <p class="font-display font-bold text-white mb-2" style="font-size: 1.5rem; letter-spacing: -0.03em">
        {{ scan?.status === 'running' ? 'Scanning…' : 'Initialising…' }}
      </p>
      <p class="text-white/50 font-body text-sm mb-1">{{ scan?.url }}</p>
      <p class="text-white/40 font-body text-xs">Running 94 checks across security, performance, SEO, accessibility, AI
        readiness, DNS & trust</p>
      <div class="flex gap-1.5 mt-8">
        <div v-for="n in 3" :key="n" class="w-1 h-1 rounded-full bg-primary/50"
          :style="`animation: pulse-dot 1.4s ease-in-out infinite; animation-delay: ${(n - 1) * 0.2}s`" />
      </div>
    </div>

    <!-- ── Error state ─────────────────────────────────── -->
    <div v-else-if="error || scan?.status === 'error'"
      class="relative z-10 flex flex-col items-center justify-center min-h-screen">
      <div class="w-14 h-14 rounded-full bg-danger/8 border border-danger/15 flex items-center justify-center mb-6">
        <svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <p class="font-display font-bold text-white text-xl mb-2 tracking-tight">Scan failed</p>
      <p class="text-white/55 text-sm font-body mb-8 max-w-xs text-center">{{ error || scan?.errorMessage }}</p>
      <NuxtLink to="/dashboard" class="btn-secondary text-sm">← Back to dashboard</NuxtLink>
    </div>

    <!-- ── Results ──────────────────────────────────────── -->
    <div v-else-if="scan?.status === 'done'" class="relative z-10 pt-16">

      <!-- ══ TOP HEADER BAR ══════════════════════════════ -->
      <div class="results-header">
        <div class="results-header__inner">
          <!-- Left: Score ring + URL + meta -->
          <div class="flex items-center gap-4 min-w-0">
            <!-- Mini score ring -->
            <div class="relative w-11 h-11 flex-shrink-0">
              <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8" />
                <circle cx="50" cy="50" r="38" fill="none" :stroke="barColor(scan.overallScore)" stroke-width="8"
                  stroke-linecap="round" :stroke-dasharray="arcPath(scan.overallScore, 38).dasharray"
                  :stroke-dashoffset="-arcPath(scan.overallScore, 38).dashoffset"
                  style="transition: stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="font-display font-bold leading-none text-[11px]" :class="scoreColor(scan.overallScore)">{{
                  scan.overallScore ?? '—' }}</span>
              </div>
            </div>

            <!-- URL + meta -->
            <div class="min-w-0">
              <div class="flex items-center gap-2.5 mb-0.5">
                <p class="font-display font-semibold text-white text-sm truncate" style="max-width: 40ch">{{
                  scan.url }}</p>
                <!-- Status pills -->
                <span class="status-pill status-pill--complete">● COMPLETE</span>
                <span v-if="scan.monitored" class="status-pill status-pill--monitored">● MONITORED</span>
              </div>
              <p class="text-white/35 text-[11px] font-body">Scanned {{ scanTimeLabel }} · 94 checks</p>
            </div>
          </div>

          <!-- Right: Action buttons -->
          <div class="flex items-center gap-2 flex-shrink-0 print:hidden">
            <button @click="$router.push(`/results?url=${encodeURIComponent(scan.url)}`)"
              class="header-btn header-btn--secondary">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Re-scan
            </button>
            <button class="header-btn header-btn--danger">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Stop monitoring
            </button>
            <button @click="shareLink" class="header-btn header-btn--secondary">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {{ copied ? 'Copied!' : 'Share' }}
            </button>
            <button @click="printPDF" class="header-btn header-btn--ghost">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- ══ SCORE STRIP ═════════════════════════════════ -->
      <div class="score-strip">
        <div v-for="p in pillars" :key="p.key" class="score-card">
          <span class="score-card__label" :style="{ color: p.color }">{{ p.label.toUpperCase() }}</span>
          <span class="score-card__number" :style="{ color: barColor(p.score) }">{{ p.score ?? '—' }}</span>
          <div class="score-card__bar">
            <div class="score-card__bar-fill" :style="{ width: (p.score ?? 0) + '%', background: barColor(p.score) }" />
          </div>
        </div>

        <!-- SSL / Domain expiry inline -->
        <div v-if="certDays !== null || domainDays !== null" class="score-card score-card--expiry">
          <div v-if="certDays !== null" class="expiry-row">
            <span class="expiry-row__label">SSL cert</span>
            <span class="expiry-row__value"
              :class="certDays < 7 ? 'text-danger' : certDays < 30 ? 'text-warning' : 'text-success'">{{
                certDays }}d</span>
          </div>
          <div v-if="domainDays !== null" class="expiry-row">
            <span class="expiry-row__label">Domain</span>
            <span class="expiry-row__value"
              :class="domainDays < 7 ? 'text-danger' : domainDays < 30 ? 'text-warning' : 'text-success'">{{
                domainDays }}d</span>
          </div>
          <div v-if="scan.greenHosting != null" class="expiry-row">
            <span class="expiry-row__label">Green</span>
            <span class="expiry-row__value" :class="scan.greenHosting ? 'text-success' : 'text-white/25'">{{
              scan.greenHosting ? '✓' : '✗' }}</span>
          </div>
        </div>
      </div>

      <!-- ══ ISSUES SECTION ═════════════════════════════ -->
      <div class="issues-section">

        <!-- Issues count header -->
        <div class="issues-count-bar">
          <span class="issues-count-bar__label">ISSUES</span>
          <span class="issues-count-bar__number">{{ scan.issues?.length ?? 0 }}</span>

          <!-- Tech stack badges (right side) -->
          <div v-if="scan.detectedTech?.length" class="ml-auto flex items-center gap-2">
            <span class="text-[10px] font-display font-semibold tracking-[0.14em] uppercase text-white/30">Stack</span>
            <span v-for="tech in scan.detectedTech.slice(0, 5)" :key="tech"
              class="text-[11px] font-body text-white/50 bg-white/[0.04] border border-white/[0.05] rounded-full px-2.5 py-0.5">{{
                tech }}</span>
          </div>
        </div>

        <!-- FIX NOW section -->
        <div v-if="fixNowTools.length" class="fix-now">
          <div class="fix-now__header">
            <div class="fix-now__header-left">
              <svg class="w-3.5 h-3.5 text-danger" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd" />
              </svg>
              <span class="fix-now__header-text">FIX NOW</span>
            </div>
            <span class="fix-now__header-hint">Tools that directly address your open issues</span>
          </div>

          <div class="fix-now__cards">
            <NuxtLink v-for="tool in fixNowTools" :key="tool.key" :to="tool.path" class="fix-now-card">
              <!-- Severity badge top-right -->
              <div class="fix-now-card__badge"
                :class="`fix-now-card__badge--${tool.severity === 'critical' ? 'critical' : tool.severity === 'warning' ? 'warning' : 'info'}`">
                {{ tool.count }} {{ tool.severity === 'critical' ? 'critical' : tool.severity === 'seo' ? 'SEO issues' :
                  tool.severity === 'ai' ? 'AI issues' : 'warnings' }}
              </div>
              <div class="fix-now-card__icon">{{ tool.icon }}</div>
              <div class="fix-now-card__label">{{ tool.label }}</div>
              <div class="fix-now-card__desc">{{ tool.description }}</div>
              <div class="fix-now-card__cta">
                FIX ISSUES
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="filter-tabs">
          <button v-for="tab in issueTabs" :key="tab.key" class="filter-tab"
            :class="activeTab === tab.key ? 'filter-tab--active' : ''" @click="activeTab = tab.key">
            <span>{{ tab.label }}</span>
            <span class="filter-tab__count" :class="activeTab === tab.key ? 'filter-tab__count--active' : ''">{{
              issueCount(tab.key) }}</span>
          </button>
        </div>

        <!-- Issue list grouped by severity -->
        <div class="issue-list">

          <!-- CRITICAL group -->
          <div v-if="criticalIssues.length" class="issue-group">
            <div class="issue-group__header issue-group__header--critical">
              <div class="flex items-center gap-2">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd" />
                </svg>
                <span class="issue-group__title">CRITICAL</span>
                <span class="issue-group__subtitle">· Immediate action needed</span>
              </div>
              <span class="issue-group__count issue-group__count--critical">{{ criticalIssues.length }}</span>
            </div>

            <div v-for="(issue, i) in criticalIssues" :key="`critical-${i}`" class="issue-item issue-item--critical">
              <!-- Top row: dot + title + badge + toggle -->
              <div class="issue-item__header" @click="toggleIssue(issue._index ?? i)">
                <div class="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <span class="issue-item__title">{{ issue.title }}</span>
                    <span class="issue-badge issue-badge--critical">CRITICAL</span>
                  </div>
                  <p class="issue-item__desc">{{ issue.description }}</p>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                  <span class="issue-item__pillar" :style="{ color: getPillarColor(issue.pillar) }">{{
                    issue.pillar?.toUpperCase() }}</span>
                  <svg class="w-4 h-4 text-white/25 transition-transform"
                    :class="expandedIssues.has(issue._index ?? i) ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <!-- Expanded: fix snippet + tool link -->
              <div
                v-if="expandedIssues.has(issue._index ?? i) && issue.severity !== 'pass' && (FIX_SNIPPETS[issue.title] || TOOL_LINKS[issue.title])"
                class="issue-item__expand">
                <div v-if="FIX_SNIPPETS[issue.title]">
                  <div class="issue-expand__label">
                    <svg class="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    HOW TO FIX
                  </div>
                  <div class="issue-expand__code">
                    <pre class="issue-expand__pre">{{ FIX_SNIPPETS[issue.title]?.generic }}</pre>
                  </div>
                </div>
                <NuxtLink v-if="TOOL_LINKS[issue.title]" :to="TOOL_LINKS[issue.title]" class="issue-expand__tool-btn">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-4 10H4V5h14v14z" />
                    <path d="M6 13h5v4H6zm6-6h4v3h-4zm0 4h4v6h-4zM6 7h5v5H6z" />
                  </svg>
                  Build your CSP with our tool →
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- WARNINGS group -->
          <div v-if="warningIssues.length" class="issue-group">
            <div class="issue-group__header issue-group__header--warning">
              <div class="flex items-center gap-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span class="issue-group__title">WARNINGS</span>
                <span class="issue-group__subtitle">· Should be addressed soon</span>
              </div>
              <span class="issue-group__count issue-group__count--warning">{{ warningIssues.length }}</span>
            </div>

            <div v-for="(issue, i) in warningIssues" :key="`warning-${i}`" class="issue-item issue-item--warning">
              <div class="issue-item__header" @click="toggleIssue(1000 + i)">
                <div class="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <span class="issue-item__title">{{ issue.title }}</span>
                    <span class="issue-badge issue-badge--warning">WARNING</span>
                  </div>
                  <p class="issue-item__desc">{{ issue.description }}</p>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                  <span class="issue-item__pillar" :style="{ color: getPillarColor(issue.pillar) }">{{
                    issue.pillar?.toUpperCase() }}</span>
                  <svg class="w-4 h-4 text-white/25 transition-transform"
                    :class="expandedIssues.has(1000 + i) ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div
                v-if="expandedIssues.has(1000 + i) && issue.severity !== 'pass' && (FIX_SNIPPETS[issue.title] || TOOL_LINKS[issue.title])"
                class="issue-item__expand">
                <div v-if="FIX_SNIPPETS[issue.title]">
                  <div class="issue-expand__label">
                    <svg class="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    HOW TO FIX
                  </div>
                  <div class="issue-expand__code">
                    <pre class="issue-expand__pre">{{ FIX_SNIPPETS[issue.title]?.generic }}</pre>
                  </div>
                </div>
                <NuxtLink v-if="TOOL_LINKS[issue.title]" :to="TOOL_LINKS[issue.title]" class="issue-expand__tool-btn">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-4 10H4V5h14v14z" />
                    <path d="M6 13h5v4H6zm6-6h4v3h-4zm0 4h4v6h-4zM6 7h5v5H6z" />
                  </svg>
                  Fix with our tool →
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- PASS group -->
          <div v-if="passIssues.length" class="issue-group">
            <div class="issue-group__header issue-group__header--pass">
              <div class="flex items-center gap-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="issue-group__title">PASSING</span>
                <span class="issue-group__subtitle">· No action needed</span>
              </div>
              <span class="issue-group__count issue-group__count--pass">{{ passIssues.length }}</span>
            </div>

            <div v-for="(issue, i) in passIssues" :key="`pass-${i}`" class="issue-item issue-item--pass">
              <div class="issue-item__header">
                <div class="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <span class="issue-item__title issue-item__title--muted">{{ issue.title }}</span>
                </div>
                <span class="issue-item__pillar" :style="{ color: getPillarColor(issue.pillar) }">{{
                  issue.pillar?.toUpperCase() }}</span>
              </div>
            </div>
          </div>

          <div v-if="!displayIssues.length" class="text-center py-16 text-white/35 text-sm font-body">
            No {{ activeTab === 'all' ? '' : activeTab }} issues found.
          </div>
        </div>

        <!-- Bottom nav -->
        <div class="flex items-center gap-4 mt-8 pt-6 border-t border-white/[0.04] print:hidden">
          <NuxtLink to="/dashboard" class="btn-secondary text-sm">← Back to dashboard</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Scanning animation ──────────────────────────────── */
@keyframes spin-ring {
  from {
    transform: rotate(0deg)
  }

  to {
    transform: rotate(360deg)
  }
}

@keyframes pulse-dot {

  0%,
  100% {
    opacity: 1;
    transform: scale(1)
  }

  50% {
    opacity: 0.3;
    transform: scale(0.7)
  }
}

/* ════════════════════════════════════════════════════════
   TOP HEADER BAR
════════════════════════════════════════════════════════ */
.results-header {
  position: sticky;
  top: 56px;
  /* below navbar */
  z-index: 40;
  background: rgba(7, 7, 10, 0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.results-header__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* Status pills */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: 20px;
}

.status-pill--complete {
  color: #00d4aa;
  background: rgba(0, 212, 170, 0.08);
  border: 1px solid rgba(0, 212, 170, 0.2);
}

.status-pill--monitored {
  color: #74b9ff;
  background: rgba(116, 185, 255, 0.08);
  border: 1px solid rgba(116, 185, 255, 0.2);
}

/* Header action buttons */
.header-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  white-space: nowrap;
}

.header-btn--secondary {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
}

.header-btn--secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.header-btn--danger {
  background: rgba(255, 71, 87, 0.08);
  border-color: rgba(255, 71, 87, 0.2);
  color: #ff4757;
}

.header-btn--danger:hover {
  background: rgba(255, 71, 87, 0.15);
}

.header-btn--ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.40);
}

.header-btn--ghost:hover {
  color: rgba(255, 255, 255, 0.65);
}

/* ════════════════════════════════════════════════════════
   SCORE STRIP
════════════════════════════════════════════════════════ */
.score-strip {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .score-strip {
    grid-template-columns: repeat(4, 1fr);
  }
}

.score-card {
  padding: 16px 20px;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: background 0.15s ease;
}

.score-card:hover {
  background: rgba(255, 255, 255, 0.02);
}

.score-card:last-child {
  border-right: none;
}

.score-card__label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.score-card__number {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
}

.score-card__bar {
  height: 2px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

.score-card__bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Expiry card variant */
.score-card--expiry {
  justify-content: center;
}

.expiry-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.expiry-row__label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.40);
}

.expiry-row__value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 700;
}

/* ════════════════════════════════════════════════════════
   ISSUES SECTION
════════════════════════════════════════════════════════ */
.issues-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

/* Issues count bar */
.issues-count-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.issues-count-bar__label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.35);
}

.issues-count-bar__number {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: white;
}

/* ── FIX NOW ─────────────────────────────────────────── */
.fix-now {
  margin-top: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  margin-bottom: 20px;
}

.fix-now__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.fix-now__header-left {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #ff4757;
}

.fix-now__header-text {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.75);
}

.fix-now__header-hint {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.30);
}

.fix-now__cards {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
}

.fix-now-card {
  position: relative;
  flex-shrink: 0;
  width: 160px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
}

.fix-now-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.fix-now-card__badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 20px;
}

.fix-now-card__badge--critical {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.12);
  border: 1px solid rgba(255, 71, 87, 0.25);
}

.fix-now-card__badge--warning {
  color: #ffaa00;
  background: rgba(255, 170, 0, 0.10);
  border: 1px solid rgba(255, 170, 0, 0.25);
}

.fix-now-card__badge--info {
  color: #74b9ff;
  background: rgba(116, 185, 255, 0.10);
  border: 1px solid rgba(116, 185, 255, 0.25);
}

.fix-now-card__icon {
  font-size: 18px;
  margin-bottom: 2px;
}

.fix-now-card__label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: white;
}

.fix-now-card__desc {
  font-family: 'DM Sans', sans-serif;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.40);
  line-height: 1.4;
}

.fix-now-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #ec3586;
}

/* ── FILTER TABS ────────────────────────────────────── */
.filter-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 6px;
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: 0.01em;
}

.filter-tab:hover {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.04);
}

.filter-tab--active {
  color: white;
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.filter-tab__count {
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.30);
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 5px;
  border-radius: 20px;
}

.filter-tab__count--active {
  color: rgba(236, 53, 134, 0.85);
  background: rgba(236, 53, 134, 0.1);
}

/* ── ISSUE LIST ──────────────────────────────────────── */
.issue-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Issue group */
.issue-group {
  margin-bottom: 2px;
}

.issue-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 8px 8px 0 0;
  margin-bottom: 1px;
}

.issue-group__header--critical {
  background: rgba(255, 71, 87, 0.06);
  border: 1px solid rgba(255, 71, 87, 0.12);
  color: #ff4757;
}

.issue-group__header--warning {
  background: rgba(255, 170, 0, 0.05);
  border: 1px solid rgba(255, 170, 0, 0.10);
  color: #ffaa00;
}

.issue-group__header--pass {
  background: rgba(0, 212, 170, 0.04);
  border: 1px solid rgba(0, 212, 170, 0.08);
  color: #00d4aa;
}

.issue-group__title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.issue-group__subtitle {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
}

.issue-group__count {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}

.issue-group__count--critical {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.12);
}

.issue-group__count--warning {
  color: #ffaa00;
  background: rgba(255, 170, 0, 0.10);
}

.issue-group__count--pass {
  color: #00d4aa;
  background: rgba(0, 212, 170, 0.08);
}

/* Issue item */
.issue-item {
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-top: none;
  transition: background 0.12s ease;
}

.issue-item:hover {
  background: rgba(255, 255, 255, 0.025);
}

.issue-item:last-child {
  border-radius: 0 0 8px 8px;
}

.issue-item--critical {
  border-left: 2px solid rgba(255, 71, 87, 0.5);
}

.issue-item--warning {
  border-left: 2px solid rgba(255, 170, 0, 0.4);
}

.issue-item--pass {
  border-left: 2px solid rgba(0, 212, 170, 0.3);
}

.issue-item__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 16px;
  cursor: pointer;
  user-select: none;
}

.issue-item__title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
}

.issue-item__title--muted {
  color: rgba(255, 255, 255, 0.50);
}

.issue-item__desc {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.5;
  margin-top: 2px;
}

.issue-item__pillar {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  opacity: 0.8;
}

/* Issue badges */
.issue-badge {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 2px 6px;
  border-radius: 4px;
}

.issue-badge--critical {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.10);
}

.issue-badge--warning {
  color: #ffaa00;
  background: rgba(255, 170, 0, 0.10);
}

/* Issue expand area */
.issue-item__expand {
  padding: 0 16px 14px 40px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.issue-expand__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 8px;
  margin-top: 12px;
}

.issue-expand__code {
  background: #07070a;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
  margin-bottom: 10px;
}

.issue-expand__pre {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
  white-space: pre-wrap;
  line-height: 1.6;
}

.issue-expand__tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  background: rgba(236, 53, 134, 0.08);
  border: 1px solid rgba(236, 53, 134, 0.2);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #ec3586;
  text-decoration: none;
  transition: all 0.15s ease;
  letter-spacing: 0.03em;
}

.issue-expand__tool-btn:hover {
  background: rgba(236, 53, 134, 0.14);
  border-color: rgba(236, 53, 134, 0.35);
}

/* ── Print Styles ──────────────────────────────────── */
@media print {
  @page {
    margin: 1.5cm;
  }

  .results-header,
  .fix-now,
  .filter-tabs,
  header {
    display: none !important;
  }

  .issue-item {
    break-inside: avoid;
    border-color: rgba(255, 255, 255, 0.1) !important;
    margin-bottom: 6px;
  }

  .score-strip {
    break-inside: avoid;
    border-color: rgba(255, 255, 255, 0.1) !important;
  }
}
</style>
