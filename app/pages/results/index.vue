<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Scan Results — ScanPulse' })

const route  = useRoute()
const { userId } = useAuth()
const { client, api } = useConvex()

const scan    = ref<any>(null)
const loading = ref(true)
const error   = ref('')
let pollInterval: ReturnType<typeof setInterval> | null = null

async function fetchScan(id: string) {
  scan.value = await client.query(api.scans.getScan, { scanId: id })
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
      }
    }, 2000)

    await fetchScan(newScanId)
    if (scan.value?.status === 'done' || scan.value?.status === 'error') {
      clearInterval(pollInterval!)
      loading.value = false
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
  { key: 'security',    label: 'Security',    color: '#00d4aa', score: scan.value?.securityScore },
  { key: 'performance', label: 'Performance', color: '#ffaa00', score: scan.value?.performanceScore },
  { key: 'seo',         label: 'SEO',         color: '#6c5ce7', score: scan.value?.seoScore },
])

const activeTab    = ref<'all' | 'security' | 'performance' | 'seo'>('all')
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
      <p class="text-white/30 font-body text-sm mb-1">{{ scan?.url }}</p>
      <p class="text-white/18 font-body text-xs">Running 15+ checks across security, performance & SEO</p>

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
      <p class="text-white/35 text-sm font-body mb-8 max-w-xs text-center">{{ error || scan?.errorMessage }}</p>
      <NuxtLink to="/dashboard" class="btn-secondary text-sm">← Back to dashboard</NuxtLink>
    </div>

    <!-- ── Results ───────────────────────────────────────────────── -->
    <div v-else-if="scan?.status === 'done'" class="relative z-10 max-w-5xl mx-auto px-8 pt-28 pb-24">

      <!-- Back -->
      <NuxtLink
        to="/dashboard"
        class="inline-flex items-center gap-2 text-white/25 hover:text-white/55 transition-colors mb-10 group"
      >
        <svg class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="text-[10px] font-display font-semibold tracking-[0.16em] uppercase">Dashboard</span>
      </NuxtLink>

      <!-- ── Hero row: URL + overall score ── -->
      <div class="flex items-start justify-between gap-12 mb-14">
        <div class="min-w-0 pt-1">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-7 h-px bg-primary" />
            <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">Results</span>
          </div>
          <h1
            class="font-display font-bold text-white leading-tight tracking-[-0.03em] mb-3 break-all"
            style="font-size: clamp(1.1rem, 2vw, 1.5rem); max-width: 50ch"
          >{{ scan.url }}</h1>
          <p class="text-white/25 text-xs font-body">Scanned just now · 15 checks</p>
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
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span
                class="font-display font-bold leading-none"
                :class="scoreColor(scan.overallScore)"
                style="font-size: 2.8rem; letter-spacing: -0.06em"
              >{{ scan.overallScore }}</span>
              <span class="text-[9px] font-display font-semibold tracking-[0.14em] uppercase text-white/25 mt-1">Overall</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Pillar score bars ── -->
      <div class="grid grid-cols-3 gap-3 mb-12">
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

      <!-- ── Issues ── -->
      <div>
        <!-- Tab bar -->
        <div class="flex items-end gap-1 border-b border-white/[0.05] mb-6">
          <button
            v-for="tab in ['all', 'security', 'performance', 'seo']"
            :key="tab"
            class="results-tab"
            :class="activeTab === tab ? 'results-tab--active' : ''"
            @click="activeTab = tab as any"
          >
            <span class="capitalize">{{ tab }}</span>
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
              <p class="text-white/35 text-xs font-body leading-relaxed">{{ issue.description }}</p>
            </div>

            <span class="flex-shrink-0 text-[9px] font-display font-bold uppercase tracking-[0.14em] text-white/15">
              {{ issue.pillar }}
            </span>
          </div>

          <div v-if="!displayIssues.length" class="text-center py-12 text-white/20 text-sm font-body">
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
  color: rgba(255,255,255,0.3);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: none;
  border-left: none;
  border-right: none;
  border-top: none;
  cursor: pointer;
  transition: color 0.15s ease;
}
.results-tab:hover { color: rgba(255,255,255,0.6); }
.results-tab--active { color: white; border-bottom-color: #ec3586; }
.results-tab__count {
  font-size: 10px;
  font-weight: 700;
  color: rgba(255,255,255,0.2);
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
</style>
