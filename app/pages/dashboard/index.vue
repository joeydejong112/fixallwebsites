<script setup lang="ts">
import { useDashboardData } from '~/composables/dashboard/useDashboardData'
import { useScanActions } from '~/composables/dashboard/useScanActions'
import { useDashboardView } from '~/composables/dashboard/useDashboardView'
import { useScoreFormat, useScoreTrend } from '~/composables/dashboard/useScoreFormat'
import { useChartGeometry, CD_W, CD_H, CD_PL, CD_PR, CD_GRID } from '~/composables/dashboard/useChartGeometry'
import { allTools, PILLAR_COLORS } from '~/lib/dashboard/tools'
import ToolsView from '~/components/dashboard/views/ToolsView.vue'
import ToolDetailView from '~/components/dashboard/views/ToolDetailView.vue'
import CompareView from '~/components/dashboard/views/CompareView.vue'
import ChartsView from '~/components/dashboard/views/ChartsView.vue'
import ResultView from '~/components/dashboard/result/ResultView.vue'
import OverviewView from '~/components/dashboard/views/OverviewView.vue'
import ScanView from '~/components/dashboard/views/ScanView.vue'
import HistoryView from '~/components/dashboard/views/HistoryView.vue'
import ChartDetailView from '~/components/dashboard/views/ChartDetailView.vue'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Dashboard — ScanPulse' })

const { userId } = useAuth()
const data = useDashboardData()
const { loading } = data
const view = useDashboardView({ scans: data.scans, doneScans: computed(() => data.scans.value.filter(s => s.status === 'done')) })
const actions = useScanActions(
  { scans: data.scans, monitors: data.monitors },
  {
    onScanCreated: (scanId) => {
      const scan = data.scans.value.find(s => s._id === scanId)
      if (scan) { view.selectedScan.value = scan; view.setView('result') }
    },
  },
)
const { scoreColor, scoreBg, statusLabel, relativeTime, faviconUrl, hostname } = useScoreFormat()
const { scoreTrend } = useScoreTrend(data.scans)
const geom = useChartGeometry()

// ── View-local state (moves to view components in Phase 3) ──
const router = useRouter()
const newScanUrl = ref('')
function submitNewScan() { const url = newScanUrl.value.trim(); if (url) { actions.handleScan(url); newScanUrl.value = '' } }
function handleBack() {
  if (view.currentView.value === 'tool-detail') view.setView('tools')
  else if (view.currentView.value === 'chart-detail') view.setView('charts')
  else view.setView('history')
}

const doneScans = computed(() => data.scans.value.filter(s => s.status === 'done'))
const avgScore  = computed(() => { if (!doneScans.value.length) return null; return Math.round(doneScans.value.reduce((s, x) => s + (x.overallScore ?? 0), 0) / doneScans.value.length) })
const bestScore = computed(() => doneScans.value.length ? Math.max(...doneScans.value.map(s => s.overallScore ?? 0)) : null)

const topSites = computed(() => {
  const map = new Map<string, { url: string; count: number; latestScore: number | null }>()
  for (const s of doneScans.value) { const e = map.get(s.url); if (e) e.count++; else map.set(s.url, { url: s.url, count: 1, latestScore: s.overallScore ?? null }) }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8)
})
interface ChartPoint { score: number; time: number; securityScore?: number; performanceScore?: number; seoScore?: number; accessibilityScore?: number }
const urlCharts = computed(() => {
  const map = new Map<string, ChartPoint[]>()
  for (const s of doneScans.value) {
    if (s.overallScore == null) continue
    if (!map.has(s.url)) map.set(s.url, [])
    map.get(s.url)!.push({ score: s.overallScore, time: s._creationTime, securityScore: s.securityScore, performanceScore: s.performanceScore, seoScore: s.seoScore, accessibilityScore: s.accessibilityScore })
  }
  return [...map.entries()].map(([url, pts]) => { const sorted = [...pts].sort((a, b) => a.time - b.time); return { url, points: sorted, latest: sorted[sorted.length - 1] } }).sort((a, b) => b.points.length - a.points.length)
})

// ── Chart detail derived state ──
const chartDetailScans = computed(() => {
  if (!view.selectedChartUrl.value) return []
  return doneScans.value
    .filter(s => s.url === view.selectedChartUrl.value)
    .sort((a, b) => a._creationTime - b._creationTime)
})
const chartDetailLatest = computed(() => chartDetailScans.value[chartDetailScans.value.length - 1] ?? null)
const PILLAR_KEYS = ['security', 'performance', 'seo', 'accessibility'] as const
const PILLAR_LABELS = { security: 'Security', performance: 'Performance', seo: 'SEO', accessibility: 'Accessibility' }
const PILLAR_KEY_MAP: Record<string, string> = {
  security: 'securityScore', performance: 'performanceScore',
  seo: 'seoScore', accessibility: 'accessibilityScore',
}
const chartDetailPillars = computed(() =>
  PILLAR_KEYS.map(key => {
    const scores: number[] = chartDetailScans.value.map(s => s[PILLAR_KEY_MAP[key]] ?? null).filter(s => s != null)
    return { key, label: PILLAR_LABELS[key], color: PILLAR_COLORS[key] ?? '#fff', latest: scores[scores.length - 1] ?? null, scores }
  }).filter(p => p.scores.length > 0)
)

const previousScansOfSelected = computed(() => {
  const target = view.selectedScan.value
  if (!target) return []
  return data.scans.value.filter(s => s.url === target.url && s._id !== target._id)
})

watch(userId, id => { if (id) data.loadUserData(id) }, { immediate: true })
</script>


<template>
  <div class="flex h-screen bg-dark text-white overflow-hidden pt-[62px]">
    <NavBar />

    <!-- ── SIDEBAR ──────────────────────────────────────── -->
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

    <!-- ── MAIN ─────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <DashboardTopbar
        :title="view.topbarInfo.value?.title ?? ''"
        :subtitle="view.topbarInfo.value?.sub ?? ''"
        :show-back="['result','tool-detail','chart-detail'].includes(view.currentView.value)"
        :scanning="actions.scanning.value"
        v-model="newScanUrl"
        @back="handleBack"
        @submit="submitNewScan"
      />

      <!-- ── CONTENT ──────────────────────────────────────── -->
      <div class="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

        <!-- Loading -->
        <template v-if="loading">
          <div class="grid grid-cols-4 gap-3.5">
            <div v-for="i in 4" :key="i" class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4 bg-white/3 animate-pulse" style="height:82px;" />
          </div>
          <div class="grid grid-cols-1fr-300px gap-4.5">
            <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4 bg-white/3 animate-pulse" style="height:240px;" />
            <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4 bg-white/3 animate-pulse" style="height:240px;" />
          </div>
        </template>

        <template v-else>

          <!-- ══════════════════════════════════════════════
               VIEW: OVERVIEW
          ══════════════════════════════════════════════════ -->
          <template v-if="view.currentView.value === 'overview'">
            <OverviewView
              :scans="data.scans.value"
              :done-scans="doneScans"
              :monitors="data.monitors.value"
              :bulk-scans="data.bulkScans.value"
              :avg-score="avgScore"
              :best-score="bestScore"
              :open-scan-by-url="view.openScanByUrl"
              :toggle-monitor="actions.toggleMonitor"
              @set-view="view.setView"
              @open-scan="view.openScan"
            />
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: HISTORY
          ══════════════════════════════════════════════════ -->
          <template v-else-if="view.currentView.value === 'history'">
            <HistoryView :scans="data.scans.value" :is-monitored="actions.isMonitored" @open-scan="view.openScan" @delete-scan="actions.deleteScan" @rescan="actions.reScan" @toggle-monitor="actions.toggleMonitor" />
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: COMPARE
          ══════════════════════════════════════════════════ -->
          <template v-else-if="view.currentView.value === 'compare'">
            <CompareView />
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: BULK SCAN
          ══════════════════════════════════════════════════ -->
          <template v-else-if="view.currentView.value === 'bulk'">
            <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
              <div class="flex items-center justify-between mb-4">
                <div class="font-display font-semibold text-[13px] text-white/70">Bulk Scans</div>
                <NuxtLink to="/bulk-scan" class="text-[12px] text-primary hover:opacity-75 transition-opacity">Open bulk scan tool →</NuxtLink>
              </div>
              <div v-if="!data.bulkScans.value.length" class="flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center">
                <p>No bulk scans yet</p>
                <p class="text-[12px] text-white/25 mt-1">Scan up to 50 URLs in a single job — Pro feature.</p>
                <NuxtLink to="/bulk-scan" class="inline-block bg-primary text-white text-[13px] font-medium px-[18px] py-2 rounded-lg mt-3" style="margin-top:12px;">Start a bulk scan</NuxtLink>
              </div>
              <template v-else>
                <NuxtLink v-for="b in data.bulkScans.value" :key="b._id" :to="`/bulk-scan/${b._id}`" class="flex items-center gap-3 px-[18px] py-[13px] border-b border-[#1e1e28] hover:bg-white/5 last:border-b-0 no-underline text-inherit">
                  <div class="flex-1 min-w-0">
                    <div class="text-[13px] font-body text-white/90 truncate">{{ b.name }}</div>
                    <div class="text-[11px] text-white/30 mt-0.5">{{ b.totalUrls }} URLs · {{ b.completedUrls }} complete</div>
                  </div>
                  <div v-if="b.status === 'running' || b.status === 'pending'" class="flex-1 max-w-[120px] h-1 bg-[#1e1e28] rounded-sm overflow-hidden">
                    <div class="h-full bg-primary rounded-sm transition-all" :style="{ width: Math.round((b.completedUrls / b.totalUrls) * 100) + '%' }"></div>
                  </div>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" :class="{
                    'bg-[rgba(0,212,170,0.1)] text-[#00d4aa]': b.status === 'done',
                    'bg-[rgba(236,53,134,0.1)] text-[#ec3586]': b.status === 'running',
                    'bg-white/5 text-white/30': b.status === 'pending',
                    'bg-[rgba(255,71,87,0.1)] text-[#ff4757]': b.status === 'error',
                  }">{{ b.status }}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
                </NuxtLink>
              </template>
            </div>
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: SCAN
          ══════════════════════════════════════════════════ -->
          <template v-else-if="view.currentView.value === 'scan'">
            <ScanView :scanning="actions.scanning.value" @submit="actions.handleScan" />
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: CHARTS
          ══════════════════════════════════════════════════ -->
          <template v-else-if="view.currentView.value === 'charts'">
            <ChartsView
              :scans="data.scans.value ?? []"
              :done-scans="doneScans"
              :monitors="data.monitors.value ?? []"
              :avg-score="avgScore"
              :url-sparklines="data.urlSparklines.value"
              :top-sites="topSites"
              :url-charts="urlCharts"
              :open-scan-by-url="view.openScanByUrl"
              @open-chart-detail="view.openChartDetail"
            />
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: CHART DETAIL
          ══════════════════════════════════════════════════ -->
          <template v-else-if="view.currentView.value === 'chart-detail' && view.selectedChartUrl">
            <ChartDetailView
              :done-scans="doneScans"
              :selected-chart-url="view.selectedChartUrl"
              :open-scan-by-url="view.openScanByUrl"
              :open-scan="view.openScan"
            />
          </template>

          <template v-else-if="view.currentView.value === 'tools'">
            <ToolsView @open-tool="view.openTool" />
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: TOOL DETAIL
          ══════════════════════════════════════════════════ -->
          <template v-else-if="view.currentView.value === 'tool-detail'">
            <ToolDetailView :slug="view.selectedTool.value" />
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: RESULT
          ══════════════════════════════════════════════════ -->
          <ResultView
            v-if="view.currentView.value === 'result'"
            :scan="view.selectedScan.value"
            :is-monitored="actions.isMonitored"
            @rescan="actions.reScan"
            @delete="actions.deleteScan"
            @open-tool="view.openTool"
            @toggle-monitor="actions.toggleMonitor"
          />

          <!-- Previous scans of same site (shown when result view is active) -->
          <div v-if="view.currentView.value === 'result' && previousScansOfSelected.length" class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
            <div class="flex items-center justify-between mb-4">
              <div class="font-display font-semibold text-[13px] text-white/70">Previous scans of {{ hostname(view.selectedScan.value?.url ?? '') }}</div>
            </div>
            <button v-for="s in previousScansOfSelected.slice(0, 5)" :key="s._id" @click="view.openScan(s)" class="flex items-center gap-2.5 py-2.5 border-b border-[#1e1e28] last:border-b-0 bg-transparent border-l-0 border-r-0 border-t-0 w-full text-left cursor-pointer transition-opacity hover:opacity-75">
              <div class="flex-1 min-w-0">
                <div class="text-[13px] font-body text-white/90">{{ relativeTime(s._creationTime) }}</div>
                <div class="text-[11px] text-white/30 mt-0.5">{{ statusLabel(s.status) }}</div>
              </div>
              <span class="font-display font-bold text-[18px]" :style="{ color: scoreBg(s.overallScore) }">{{ s.overallScore ?? '—' }}</span>
            </button>
          </div>

        </template>
      </div>
    </div>
  </div>
</template>
