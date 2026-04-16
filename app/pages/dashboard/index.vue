<script setup lang="ts">
import { useDashboardData } from '~/composables/dashboard/useDashboardData'
import { useScanActions } from '~/composables/dashboard/useScanActions'
import { useDashboardView } from '~/composables/dashboard/useDashboardView'
import { useScoreFormat, useScoreTrend } from '~/composables/dashboard/useScoreFormat'
import { useChartGeometry } from '~/composables/dashboard/useChartGeometry'
import { allTools, toolPillars, TOOL_LINKS, PILLAR_COLORS } from '~/lib/dashboard/tools'
import ToolsView from '~/components/dashboard/views/ToolsView.vue'
import ToolDetailView from '~/components/dashboard/views/ToolDetailView.vue'
import CompareView from '~/components/dashboard/views/CompareView.vue'
import ChartDetailView from '~/components/dashboard/views/ChartDetailView.vue'
import BulkView from '~/components/dashboard/views/BulkView.vue'
import ChartsView from '~/components/dashboard/views/ChartsView.vue'
import ResultView from '~/components/dashboard/result/ResultView.vue'
import OverviewView from '~/components/dashboard/views/OverviewView.vue'
import ScanView from '~/components/dashboard/views/ScanView.vue'
import HistoryView from '~/components/dashboard/views/HistoryView.vue'

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
const fmt = useScoreFormat()
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

const toolsFilter  = ref('all')
const toolsFiltered  = computed(() => toolsFilter.value === 'all' ? allTools : allTools.filter(t => t.pillar === toolsFilter.value))
const toolsFeatured  = computed(() => toolsFiltered.value[0] ?? null)
const toolsRest      = computed(() => toolsFiltered.value.slice(1))
const toolsPillarCount = (key: string) => key === 'all' ? allTools.length : allTools.filter(t => t.pillar === key).length

const compareUrlA = ref(''); const compareUrlB = ref('')
function submitCompare() { const a = compareUrlA.value.trim(); const b = compareUrlB.value.trim(); if (a && b) router.push(`/compare?urlA=${encodeURIComponent(a)}&urlB=${encodeURIComponent(b)}`) }

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
    <div class="flex-1 flex overflow-hidden">
      <DashboardTopbar
        :title="view.topbarInfo.value?.title ?? ''"
        :subtitle="view.topbarInfo.value?.sub ?? ''"
        :show-back="['result','tool-detail','chart-detail'].includes(view.currentView.value)"
        :scanning="actions.scanning.value"
        v-model="newScanUrl"
        @back="handleBack"
        @submit="submitNewScan"
      />

      <!-- ── CONTENT ───────────────────────────────────── -->
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
              <div v-if="!bulkScans.length" class="flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center">
                <p>No bulk scans yet</p>
                <p class="text-[12px] text-white/25 mt-1">Scan up to 50 URLs in a single job — Pro feature.</p>
                <NuxtLink to="/bulk-scan" class="inline-block bg-primary text-white text-[13px] font-medium px-[18px] py-2 rounded-lg mt-3" style="margin-top:12px;">Start a bulk scan</NuxtLink>
              </div>
              <template v-else>
                <NuxtLink v-for="b in bulkScans" :key="b._id" :to="`/bulk-scan/${b._id}`" class="flex items-center gap-3 px-[18px] py-[13px] border-b border-[#1e1e28] hover:bg-white/5 last:border-b-0 no-underline text-inherit">
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

            <!-- Stats strip -->
            <div class="grid grid-cols-4 gap-3.5">
              <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
                <div class="text-[10px] font-semibold font-display uppercase tracking-widest text-white/40 mb-2">Total Scans</div>
                <div class="font-display text-[28px] font-bold" style="color:#ec3586">{{ data.scans.value.length }}</div>
                <div class="text-[11px] text-white/30 mt-1">All time</div>
              </div>
              <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
                <div class="text-[10px] font-semibold font-display uppercase tracking-widest text-white/40 mb-2">Completed</div>
                <div class="font-display text-[28px] font-bold" :style="{ color: '#00d4aa' }">{{ doneScans.length }}</div>
                <div class="text-[11px] text-white/30 mt-1">{{ data.scans.value.filter(s=>s.status==='error').length }} failed</div>
              </div>
              <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
                <div class="text-[10px] font-semibold font-display uppercase tracking-widest text-white/40 mb-2">Avg Score</div>
                <div class="font-display text-[28px] font-bold" :style="{ color: avgScore != null ? scoreBg(avgScore) : 'rgba(255,255,255,0.2)' }">{{ avgScore ?? '—' }}</div>
                <div class="text-[11px] text-white/30 mt-1">Across all done scans</div>
              </div>
              <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
                <div class="text-[10px] font-semibold font-display uppercase tracking-widest text-white/40 mb-2">Unique Sites</div>
                <div class="font-display text-[28px] font-bold" style="color:#6c5ce7">{{ new Set(doneScans.map(s=>s.url)).size }}</div>
                <div class="text-[11px] text-white/30 mt-1">{{ monitors.length }} monitored</div>
              </div>
            </div>

            <div class="grid grid-cols-1fr-300px gap-4.5">
              <!-- Scans per day bar chart -->
              <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
                <div class="flex items-center justify-between mb-4"><div class="font-display font-semibold text-[13px] text-white/70">Scans per Day (last 14 days)</div></div>
                <div v-if="!data.scans.value.length" class="flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center"><p>No scans yet</p></div>
                <div v-else class="pt-2">
                  <div class="flex items-end gap-1 h-[120px]">
                    <div v-for="(day, i) in scansPerDay" :key="i" class="flex-1 flex flex-col items-center gap-0.5 h-full">
                      <div class="text-[9px] text-white/30 h-3.5 flex items-center font-display">{{ day.count || '' }}</div>
                      <div class="flex-1 w-full flex items-end">
                        <div class="w-full rounded-t bg-[#ec3586] min-h-[2px] transition-all" :style="{ height: Math.max(day.count / Math.max(...scansPerDay.map(d=>d.count), 1) * 100, day.count ? 8 : 0) + '%', background: day.count ? '#ec3586' : '#1e1e28' }"></div>
                      </div>
                      <div class="text-[9px] text-white/30 whitespace-nowrap overflow-hidden text-overflow-clip max-w-full text-center">{{ i % 2 === 0 ? day.label.split(' ')[1] : '' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Score distribution donut-style -->
              <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
                <div class="flex items-center justify-between mb-4"><div class="font-display font-semibold text-[13px] text-white/70">Score Distribution</div></div>
                <div v-if="!doneScans.length" class="flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center"><p>No completed scans</p></div>
                <div v-else class="flex flex-col gap-3.5 pt-1.5">
                  <div v-for="bucket in scoreDistribution" :key="bucket.label" class="flex items-center gap-2.5">
                    <div class="text-[12px] text-white/50 w-[120px] flex-shrink-0">{{ bucket.label }}</div>
                    <div class="flex-1 h-2 bg-[#1e1e28] rounded overflow-hidden">
                      <div class="h-full rounded transition-all" :style="{ width: bucket.pct + '%', background: bucket.color }"></div>
                    </div>
                    <div class="font-display font-bold text-[14px] w-6 text-right flex-shrink-0" :style="{ color: bucket.color }">{{ bucket.count }}</div>
                    <div class="text-[11px] text-white/30 w-8 text-right flex-shrink-0">{{ bucket.pct }}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1fr-300px gap-4.5">
              <!-- Avg pillar scores -->
              <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
                <div class="flex items-center justify-between mb-4"><div class="font-display font-semibold text-[13px] text-white/70">Average Score per Pillar</div></div>
                <div v-if="!doneScans.length" class="flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center"><p>No completed scans</p></div>
                <div v-else class="flex flex-col gap-2.5">
                  <div v-for="p in avgPillarScores" :key="p.name" class="flex items-center gap-2.5">
                    <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: p.color }"></div>
                    <div class="text-[12px] text-white/50 w-[90px] flex-shrink-0">{{ p.name }}</div>
                    <div class="flex-1 h-1 bg-[#1e1e28] rounded overflow-hidden"><div class="h-full rounded transition-all" :style="{ width: (p.score || 0) + '%', background: p.color }"></div></div>
                    <div class="text-[12px] font-semibold w-7 text-right font-display flex-shrink-0" :style="{ color: p.score ? p.color : 'rgba(255,255,255,0.2)' }">{{ p.score || '—' }}</div>
                  </div>
                </div>
              </div>

              <!-- Top sites -->
              <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
                <div class="flex items-center justify-between mb-4">
                  <div class="font-display font-semibold text-[13px] text-white/70">Most Scanned Sites</div>
                  <span class="text-[11px] text-white/30">{{ topSites.length }} sites</span>
                </div>
                <div v-if="!topSites.length" class="flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center"><p>No completed scans</p></div>
                <div v-else>
                  <button v-for="site in topSites" :key="site.url" @click="openScanByUrl(site.url)" class="flex items-center gap-3 px-0 py-2 border-b border-[#1e1e28] hover:opacity-75 w-full text-left bg-transparent border-l-0 border-r-0 border-t-0 last:border-b-0 transition-opacity">
                    <div class="w-7 h-7 rounded-[7px] bg-white/5 flex items-center justify-center overflow-hidden text-[11px] text-white/50 flex-shrink-0">
                      <img v-if="faviconUrl(site.url)" :src="faviconUrl(site.url)!" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
                      <span v-else>{{ hostname(site.url).charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-[13px] font-body text-white/90 truncate">{{ hostname(site.url) }}</div>
                      <div class="text-[11px] text-white/30 mt-0.5">{{ site.count }} scan{{ site.count !== 1 ? 's' : '' }}</div>
                    </div>
                    <div class="font-display font-bold text-[18px] flex-shrink-0 w-8 text-right" :style="{ color: scoreBg(site.latestScore ?? undefined) }">{{ site.latestScore ?? '—' }}</div>
                    <div class="flex-shrink-0 opacity-70">
                      <svg width="60" height="24" viewBox="0 0 60 24">
                        <template v-if="urlSparklines.get(site.url)?.length">
                          <polyline
                            :points="urlSparklines.get(site.url)!.map((v, i, arr) => `${i / (arr.length - 1) * 60},${24 - v / 100 * 22}`).join(' ')"
                            fill="none"
                            :stroke="scoreBg(site.latestScore ?? undefined)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </template>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Per-site score history charts -->
            <div v-if="urlCharts.length" class="flex flex-col gap-4">
              <div class="flex items-baseline gap-2.5">
                <span class="font-display text-sm font-bold text-white/75">Score History per Site</span>
                <span class="font-body text-xs text-white/28">{{ urlCharts.length }} site{{ urlCharts.length !== 1 ? 's' : '' }}</span>
              </div>
              <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
                <div v-for="site in urlCharts" :key="site.url" class="bg-[#0f0f14] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-[16px] cursor-pointer hover:border-white/14 hover:bg-[#13131a] transition-colors" @click="openChartDetail(site.url)">

                  <!-- Card header -->
                  <div class="flex items-center gap-[10px]">
                    <div class="w-7 h-7 rounded-[7px] bg-white/5 flex items-center justify-center overflow-hidden text-[11px] text-white/50 flex-shrink-0">
                      <img v-if="faviconUrl(site.url)" :src="faviconUrl(site.url)!" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
                      <span v-else>{{ hostname(site.url).charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-display text-[13px] font-semibold text-white/80 truncate">{{ hostname(site.url) }}</div>
                      <div class="font-body text-[11px] text-white/30 mt-[1px]">{{ site.points.length }} scan{{ site.points.length !== 1 ? 's' : '' }}</div>
                    </div>
                    <div class="font-display font-bold text-[18px]" :style="{ color: scoreColor(site.latest.score) }">{{ site.latest.score }}</div>
                  </div>

                  <!-- SVG line chart -->
                  <div class="rounded-[8px] overflow-hidden bg-[#0a0a10] mt-3">
                    <svg viewBox="0 0 300 80" preserveAspectRatio="none" class="w-full h-[90px] block" xmlns="http://www.w3.org/2000/svg">
                      <!-- Grid lines at 25 / 50 / 75 -->
                      <line x1="0" y1="10" x2="300" y2="10" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                      <line x1="0" y1="23" x2="300" y2="23" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                      <line x1="0" y1="36" x2="300" y2="36" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                      <line x1="0" y1="49" x2="300" y2="49" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                      <!-- Area fill (multi-point only) -->
                      <path v-if="site.points.length > 1"
                        :d="chartAreaPath(site.points.map(p => p.score))"
                        :fill="`${scoreColor(site.latest.score)}18`"
                      />
                      <!-- Line (multi-point only) -->
                      <polyline v-if="site.points.length > 1"
                        :points="chartSvgPoints(site.points.map(p => p.score))"
                        fill="none"
                        :stroke="scoreColor(site.latest.score)"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <!-- Dots + score labels -->
                      <g v-for="(pt, i) in site.points" :key="i">
                        <circle
                          :cx="chartDotX(i, site.points.length)"
                          :cy="chartDotY(pt.score)"
                          r="3.5"
                          :fill="scoreColor(pt.score)"
                          stroke="#0f0f14"
                          stroke-width="1.5"
                        />
                        <text
                          v-if="site.points.length <= 8 || i === site.points.length - 1"
                          :x="chartDotX(i, site.points.length)"
                          :y="chartDotY(pt.score) - 8"
                          text-anchor="middle"
                          font-size="8.5"
                          font-family="Space Grotesk, sans-serif"
                          font-weight="700"
                          :fill="scoreColor(pt.score)"
                        >{{ pt.score }}</text>
                        <!-- Date label on first + last when multi-point -->
                        <text
                          v-if="site.points.length > 1 && (i === 0 || i === site.points.length - 1)"
                          :x="chartDotX(i, site.points.length)"
                          y="76"
                          text-anchor="middle"
                          font-size="7.5"
                          font-family="DM Sans, sans-serif"
                          fill="rgba(255,255,255,0.28)"
                        >{{ shortDate(pt.time) }}</text>
                      </g>
                    </svg>
                  </div>

                  <!-- Pillar bars -->
                  <div class="flex flex-col gap-[6px] mt-3">
                    <div v-if="site.latest.securityScore != null" class="flex items-center gap-2">
                      <span class="font-body text-[11px] text-white/50 w-[100px] flex-shrink-0">Sec</span>
                      <div class="flex-1 h-1 bg-white/7 rounded-[2px] overflow-hidden"><div class="h-full rounded-[2px] transition-all" :style="{ width: site.latest.securityScore + '%', background: '#00d4aa' }"/></div>
                      <span class="font-body text-[11px] text-white/50 w-6 text-right" style="color:#00d4aa">{{ site.latest.securityScore }}</span>
                    </div>
                    <div v-if="site.latest.performanceScore != null" class="flex items-center gap-2">
                      <span class="font-body text-[11px] text-white/50 w-[100px] flex-shrink-0">Perf</span>
                      <div class="flex-1 h-1 bg-white/7 rounded-[2px] overflow-hidden"><div class="h-full rounded-[2px] transition-all" :style="{ width: site.latest.performanceScore + '%', background: '#ffaa00' }"/></div>
                      <span class="font-body text-[11px] text-white/50 w-6 text-right" style="color:#ffaa00">{{ site.latest.performanceScore }}</span>
                    </div>
                    <div v-if="site.latest.seoScore != null" class="flex items-center gap-2">
                      <span class="font-body text-[11px] text-white/50 w-[100px] flex-shrink-0">SEO</span>
                      <div class="flex-1 h-1 bg-white/7 rounded-[2px] overflow-hidden"><div class="h-full rounded-[2px] transition-all" :style="{ width: site.latest.seoScore + '%', background: '#6c5ce7' }"/></div>
                      <span class="font-body text-[11px] text-white/50 w-6 text-right" style="color:#6c5ce7">{{ site.latest.seoScore }}</span>
                    </div>
                    <div v-if="site.latest.accessibilityScore != null" class="flex items-center gap-2">
                      <span class="font-body text-[11px] text-white/50 w-[100px] flex-shrink-0">A11y</span>
                      <div class="flex-1 h-1 bg-white/7 rounded-[2px] overflow-hidden"><div class="h-full rounded-[2px] transition-all" :style="{ width: site.latest.accessibilityScore + '%', background: '#a29bfe' }"/></div>
                      <span class="font-body text-[11px] text-white/50 w-6 text-right" style="color:#a29bfe">{{ site.latest.accessibilityScore }}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: CHART DETAIL
          ══════════════════════════════════════════════════ -->
          <template v-else-if="view.currentView.value === 'chart-detail' && selectedChartUrl">
            <div v-if="!chartDetailScans.length" class="flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center"><p>No completed scans for this site.</p></div>
            <div v-else class="flex flex-col gap-5">

              <!-- Hero header -->
              <div class="flex items-center gap-3.5 flex-wrap bg-[#0f0f14] border border-white/7 rounded-xl p-4">
                <div class="w-9 h-9 rounded-[8px] bg-white/5 flex items-center justify-center overflow-hidden text-[16px] flex-shrink-0">
                  <img v-if="faviconUrl(selectedChartUrl)" :src="faviconUrl(selectedChartUrl)!" loading="lazy" width="20" height="20" @error="($event.target as HTMLImageElement).style.display='none'" />
                  <span v-else>{{ hostname(selectedChartUrl).charAt(0).toUpperCase() }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-display text-[16px] font-bold text-white/88">{{ hostname(selectedChartUrl) }}</div>
                  <div class="font-body text-[11px] text-white/30 mt-0.5 truncate max-w-[300px]">{{ selectedChartUrl }}</div>
                </div>
                <div class="flex gap-5">
                  <div class="text-center">
                    <div class="font-display text-[20px] font-extrabold leading-none" :style="{ color: scoreColor(chartDetailLatest?.overallScore) }">{{ chartDetailLatest?.overallScore ?? '—' }}</div>
                    <div class="font-body text-[10px] text-white/30 mt-1 whitespace-nowrap">Latest score</div>
                  </div>
                  <div class="text-center">
                    <div class="font-display text-[20px] font-extrabold leading-none" style="color:rgba(255,255,255,0.7)">{{ chartDetailScans.length }}</div>
                    <div class="font-body text-[10px] text-white/30 mt-1 whitespace-nowrap">Scans</div>
                  </div>
                  <div class="text-center" v-if="chartDetailScans.length >= 2">
                    <div class="font-display text-[20px] font-extrabold leading-none" :style="{ color: chartDetailScans[chartDetailScans.length-1].overallScore >= chartDetailScans[0].overallScore ? '#00d4aa' : '#ff4757' }">
                      {{ chartDetailScans[chartDetailScans.length-1].overallScore >= chartDetailScans[0].overallScore ? '↑' : '↓' }}{{ Math.abs(chartDetailScans[chartDetailScans.length-1].overallScore - chartDetailScans[0].overallScore) }}
                    </div>
                    <div class="font-body text-[10px] text-white/30 mt-1 whitespace-nowrap">Since first scan</div>
                  </div>
                </div>
                <button class="font-display text-[12px] font-semibold text-primary bg-[rgba(236,53,134,0.1)] border border-[rgba(236,53,134,0.25)] rounded-[7px] px-3.5 py-2 cursor-pointer transition-all hover:bg-[rgba(236,53,134,0.18)] whitespace-nowrap" @click="openScanByUrl(selectedChartUrl)">View latest result →</button>
              </div>

              <!-- Large overall chart -->
              <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
                <div class="flex items-center justify-between mb-4">
                  <div class="font-display font-semibold text-[13px] text-white/70">Overall Score Over Time</div>
                  <span class="text-[11px] text-white/30">{{ chartDetailScans.length }} data point{{ chartDetailScans.length !== 1 ? 's' : '' }}</span>
                </div>
                <div class="pt-2 px-0.5">
                  <svg :viewBox="`0 0 ${CD_W} ${CD_H}`" preserveAspectRatio="xMidYMid meet" class="w-full h-auto block min-h-[120px]" xmlns="http://www.w3.org/2000/svg">
                    <!-- Y-axis grid lines + labels -->
                    <g v-for="g in CD_GRID" :key="g">
                      <line :x1="CD_PL" :y1="cdY(g)" :x2="CD_W - CD_PR" :y2="cdY(g)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                      <text :x="CD_PL - 6" :y="cdY(g) + 3.5" text-anchor="end" font-size="9" font-family="DM Sans,sans-serif" fill="rgba(255,255,255,0.22)">{{ g }}</text>
                    </g>
                    <!-- Area fill -->
                    <path v-if="chartDetailScans.length > 1"
                      :d="cdAreaPath(chartDetailScans.map((s:any) => s.overallScore))"
                      :fill="`${scoreColor(chartDetailLatest?.overallScore)}18`"
                    />
                    <!-- Line -->
                    <polyline v-if="chartDetailScans.length > 1"
                      :points="cdPolyline(chartDetailScans.map((s:any) => s.overallScore))"
                      fill="none"
                      :stroke="scoreColor(chartDetailLatest?.overallScore)"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <!-- Dots, score labels, date labels -->
                    <g v-for="(scan, i) in chartDetailScans" :key="scan._id">
                      <!-- Score label above dot -->
                      <text
                        :x="cdX(i, chartDetailScans.length)"
                        :y="cdY(scan.overallScore) - 9"
                        text-anchor="middle"
                        font-size="10"
                        font-family="Space Grotesk, sans-serif"
                        font-weight="700"
                        :fill="scoreColor(scan.overallScore)"
                      >{{ scan.overallScore }}</text>
                      <!-- Dot -->
                      <circle
                        :cx="cdX(i, chartDetailScans.length)"
                        :cy="cdY(scan.overallScore)"
                        r="4.5"
                        :fill="scoreColor(scan.overallScore)"
                        stroke="#0f0f14"
                        stroke-width="2"
                      />
                      <!-- Date label below axis -->
                      <text
                        v-if="chartDetailScans.length <= 12 || i === 0 || i === chartDetailScans.length - 1 || i % Math.ceil(chartDetailScans.length / 8) === 0"
                        :x="cdX(i, chartDetailScans.length)"
                        :y="CD_H - 4"
                        text-anchor="middle"
                        font-size="9"
                        font-family="DM Sans, sans-serif"
                        fill="rgba(255,255,255,0.3)"
                      >{{ shortDate(scan._creationTime) }}</text>
                    </g>
                  </svg>
                </div>
              </div>

              <!-- Per-pillar charts grid -->
              <div v-if="chartDetailPillars.length" class="flex flex-col gap-3">
                <div class="flex items-baseline gap-2.5">
                  <span class="font-display text-sm font-bold text-white/75">Pillar Breakdown</span>
                  <span class="font-body text-xs text-white/28">scores from latest scan</span>
                </div>
                <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                  <div v-for="p in chartDetailPillars" :key="p.key" class="bg-white/5 border border-white/10 rounded-xl p-[14px] flex flex-col gap-2.5">
                    <div class="flex items-center gap-2">
                      <div class="size-1.5 rounded-full flex-shrink-0" :style="{ background: p.color }"/>
                      <span class="font-display text-xs font-semibold text-white/65 flex-1">{{ p.label }}</span>
                      <span class="font-display text-lg font-extrabold leading-none" :style="{ color: p.color }">{{ p.latest ?? '—' }}</span>
                    </div>
                    <!-- Pillar trend using TrendChart -->
                    <TrendChart
                      v-if="p.scores.length >= 2"
                      :data="p.scores"
                      :color="p.color"
                      :width="240"
                      :height="52"
                      :show-dots="true"
                      :show-tooltip="true"
                    />
                    <div v-else-if="p.scores.length === 1" class="flex flex-col gap-1.5">
                      <div class="h-1.5 bg-white/7 rounded overflow-hidden">
                        <div class="h-full rounded transition-all" :style="{ width: (p.latest ?? 0) + '%', background: p.color }"/>
                      </div>
                      <span class="font-body text-xs" :style="{ color: p.color }">{{ p.latest }}/100</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="font-body text-xs text-white/28">{{ p.scores.length }} scan{{ p.scores.length !== 1 ? 's' : '' }}</span>
                      <span v-if="p.scores.length >= 2" class="font-display text-xs font-bold" :style="{ color: p.scores[p.scores.length-1] >= p.scores[0] ? '#00d4aa' : '#ff4757' }">
                        {{ p.scores[p.scores.length-1] >= p.scores[0] ? '+' : '' }}{{ p.scores[p.scores.length-1] - p.scores[0] }} vs first
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Scan log table -->
              <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4 flex flex-col gap-3">
                <div class="flex items-center justify-between mb-4">
                  <div class="font-display font-semibold text-[13px] text-white/70">Scan Log</div>
                  <span class="text-[11px] text-white/30">{{ chartDetailScans.length }} scans — most recent first</span>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full border-collapse font-body text-xs">
                    <thead>
                      <tr>
                        <th class="text-left p-2.5 text-white/25 text-[10px] font-display font-bold uppercase tracking-wider border-b border-white/6 pb-2">Date</th>
                        <th class="text-left p-2.5 text-white/25 text-[10px] font-display font-bold uppercase tracking-wider border-b border-white/6 pb-2">Overall</th>
                        <th class="text-left p-2.5 text-white/25 text-[10px] font-display font-bold uppercase tracking-wider border-b border-white/6 pb-2">Security</th>
                        <th class="text-left p-2.5 text-white/25 text-[10px] font-display font-bold uppercase tracking-wider border-b border-white/6 pb-2">Performance</th>
                        <th class="text-left p-2.5 text-white/25 text-[10px] font-display font-bold uppercase tracking-wider border-b border-white/6 pb-2">SEO</th>
                        <th class="text-left p-2.5 text-white/25 text-[10px] font-display font-bold uppercase tracking-wider border-b border-white/6 pb-2">A11y</th>
                        <th class="text-left p-2.5 text-white/25 text-[10px] font-display font-bold uppercase tracking-wider border-b border-white/6 pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="scan in [...chartDetailScans].reverse()" :key="scan._id" class="border-b border-white/4 hover:bg-white/2.5 transition-all">
                        <td class="p-2.5 align-middle text-white/45 whitespace-nowrap">{{ shortDate(scan._creationTime) }}</td>
                        <td class="p-2.5 align-middle"><span class="inline-block px-2 py-0.5 rounded font-display text-xs font-bold border border-solid" :style="{ color: scoreColor(scan.overallScore), borderColor: scoreColor(scan.overallScore) + '30', background: scoreColor(scan.overallScore) + '12' }">{{ scan.overallScore ?? '—' }}</span></td>
                        <td class="p-2.5 align-middle"><span v-if="scan.securityScore != null" class="font-display text-xs font-semibold" :style="{ color: scoreColor(scan.securityScore) }">{{ scan.securityScore }}</span><span v-else class="text-white/20">—</span></td>
                        <td class="p-2.5 align-middle"><span v-if="scan.performanceScore != null" class="font-display text-xs font-semibold" :style="{ color: scoreColor(scan.performanceScore) }">{{ scan.performanceScore }}</span><span v-else class="text-white/20">—</span></td>
                        <td class="p-2.5 align-middle"><span v-if="scan.seoScore != null" class="font-display text-xs font-semibold" :style="{ color: scoreColor(scan.seoScore) }">{{ scan.seoScore }}</span><span v-else class="text-white/20">—</span></td>
                        <td class="p-2.5 align-middle"><span v-if="scan.accessibilityScore != null" class="font-display text-xs font-semibold" :style="{ color: scoreColor(scan.accessibilityScore) }">{{ scan.accessibilityScore }}</span><span v-else class="text-white/20">—</span></td>
                        <td class="p-2.5 align-middle"><button class="bg-transparent border border-white/10 rounded-md px-2.5 py-1 font-body text-xs text-white/45 cursor-pointer hover:text-white/80 transition-all whitespace-nowrap" @click="openScan(scan)">View →</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
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
          <div v-if="view.currentView.value === 'result' && data.scans.value.filter((s:any) => s.url === view.selectedScan.value?.url && s._id !== view.selectedScan.value?._id).length" class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
            <div class="flex items-center justify-between mb-4">
              <div class="font-display font-semibold text-[13px] text-white/70">Previous scans of {{ hostname(view.selectedScan.value?.url ?? '') }}</div>
            </div>
            <button v-for="s in data.scans.value.filter((s:any) => s.url === view.selectedScan.value?.url && s._id !== view.selectedScan.value?._id).slice(0, 5)" :key="s._id" @click="view.openScan(s)" class="flex items-center gap-2.5 py-2.5 border-b border-[#1e1e28] last:border-b-0 bg-transparent border-l-0 border-r-0 border-t-0 w-full text-left cursor-pointer transition-opacity hover:opacity-75">
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
