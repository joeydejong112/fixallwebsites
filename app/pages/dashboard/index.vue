<script setup lang="ts">
import { useDashboardData } from '~/composables/dashboard/useDashboardData'
import { useScanActions } from '~/composables/dashboard/useScanActions'
import { useDashboardView } from '~/composables/dashboard/useDashboardView'
import { useScoreFormat, useScoreTrend } from '~/composables/dashboard/useScoreFormat'
import { useChartGeometry } from '~/composables/dashboard/useChartGeometry'
import { allTools, toolPillars, TOOL_LINKS, PILLAR_COLORS } from '~/lib/dashboard/tools'
import { toolComponentMap } from '~/lib/dashboard/toolComponentMap'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Dashboard — ScanPulse' })

const { userId } = useAuth()
const data = useDashboardData()
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
const resultActiveTab = ref<IssueTab>('all')
const resultExpandedFix = ref<string | null>(null)
const resultCopied = ref(false)
const resultIssueTabs: IssueTab[] = ['all', 'security', 'performance', 'seo', 'accessibility', 'ai', 'dns', 'trust']
const resultExpandedIssues  = ref<Set<string>>(new Set())
const resultCollapsedGroups = ref<Set<string>>(new Set(['pass']))

function toggleResultIssue(title: string) { const s = new Set(resultExpandedIssues.value); if (s.has(title)) s.delete(title); else s.add(title); resultExpandedIssues.value = s }
function toggleResultGroup(key: string) { const s = new Set(resultCollapsedGroups.value); if (s.has(key)) s.delete(key); else s.add(key); resultCollapsedGroups.value = s }
const resultSeverityGroups = computed(() => {
  const issues = (view.selectedScan.value?.issues ?? []).filter((i: any) => resultActiveTab.value === 'all' || i.pillar === resultActiveTab.value)
  return { critical: issues.filter((i: any) => i.severity === 'critical'), warning: issues.filter((i: any) => i.severity === 'warning'), pass: issues.filter((i: any) => i.severity === 'pass') }
})
const resultToolCards = computed(() => {
  if (!view.selectedScan.value?.issues) return []
  const map = new Map<string, { count: number; hasCritical: boolean }>()
  for (const issue of view.selectedScan.value.issues) {
    if (issue.severity === 'pass') continue
    const toolPath = TOOL_LINKS[issue.title as string]
    if (!toolPath) continue
    const tool = allTools.find(t => toolPath.endsWith(t.slug))
    if (!tool) continue
    const entry = map.get(tool.slug) ?? { count: 0, hasCritical: false }
    entry.count++; if (issue.severity === 'critical') entry.hasCritical = true
    map.set(tool.slug, entry)
  }
  return [...map.entries()].map(([slug, data]) => ({ tool: allTools.find(t => t.slug === slug)!, ...data })).sort((a, b) => (b.hasCritical ? 1 : 0) - (a.hasCritical ? 1 : 0) || b.count - a.count)
})
watch(resultActiveTab, () => { resultExpandedIssues.value = new Set() })
const resultIssues = computed(() => {
  if (!view.selectedScan.value?.issues) return []
  if (resultActiveTab.value === 'all') return view.selectedScan.value.issues
  return view.selectedScan.value.issues.filter((i: any) => i.pillar === resultActiveTab.value)
})
function shareResult() { if (!view.selectedScan.value?._id) return; navigator.clipboard.writeText(`${window.location.origin}/share/${view.selectedScan.value._id}`); resultCopied.value = true; setTimeout(() => { resultCopied.value = false }, 2000) }

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
  <div class="ds-shell">
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
    <div class="ds-main">
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
      <div class="ds-content">

        <!-- Loading -->
        <template v-if="loading">
          <div class="ds-stats-row">
            <div v-for="i in 4" :key="i" class="ds-stat-card ds-skeleton" style="height:82px;" />
          </div>
          <div class="ds-mid-grid">
            <div class="ds-card ds-skeleton" style="height:240px;" />
            <div class="ds-card ds-skeleton" style="height:240px;" />
          </div>
        </template>

        <template v-else>

          <!-- ══════════════════════════════════════════════
               VIEW: OVERVIEW
          ══════════════════════════════════════════════════ -->
          <template v-if="currentView === 'overview'">
            <OverviewView
              :scans="data.scans.value"
              :done-scans="doneScans"
              :monitors="data.monitors"
              :bulk-scans="data.bulkScans"
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
          <template v-else-if="currentView === 'history'">
            <HistoryView :scans="data.scans.value" :is-monitored="actions.isMonitored" @open-scan="view.openScan" @delete-scan="actions.deleteScan" @rescan="actions.reScan" @toggle-monitor="actions.toggleMonitor" />
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: COMPARE
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'compare'">
            <CompareView />
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: BULK SCAN
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'bulk'">
            <div class="ds-card">
              <div class="ds-card-header">
                <div class="ds-card-title">Bulk Scans</div>
                <NuxtLink to="/bulk-scan" class="ds-card-action">Open bulk scan tool →</NuxtLink>
              </div>
              <div v-if="!bulkScans.length" class="ds-empty-state">
                <p>No bulk scans yet</p>
                <p class="ds-empty-hint">Scan up to 50 URLs in a single job — Pro feature.</p>
                <NuxtLink to="/bulk-scan" class="ds-primary-btn" style="margin-top:12px;">Start a bulk scan</NuxtLink>
              </div>
              <template v-else>
                <NuxtLink v-for="b in bulkScans" :key="b._id" :to="`/bulk-scan/${b._id}`" class="ds-history-row">
                  <div class="ds-scan-info">
                    <div class="ds-scan-domain">{{ b.name }}</div>
                    <div class="ds-scan-time">{{ b.totalUrls }} URLs · {{ b.completedUrls }} complete</div>
                  </div>
                  <div v-if="b.status === 'running' || b.status === 'pending'" class="ds-bulk-progress">
                    <div class="ds-bulk-bar" :style="{ width: Math.round((b.completedUrls / b.totalUrls) * 100) + '%' }"></div>
                  </div>
                  <span class="ds-status-pill" :class="{
                    'ds-s-done': b.status === 'done',
                    'ds-s-running': b.status === 'running',
                    'ds-s-pending': b.status === 'pending',
                    'ds-s-error': b.status === 'error',
                  }">{{ b.status }}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
                </NuxtLink>
              </template>
            </div>
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: SCAN
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'scan'">
            <ScanView :scanning="actions.scanning.value" @submit="actions.handleScan" />
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: CHARTS
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'charts'">

            <!-- Stats strip -->
            <div class="ds-stats-row">
              <div class="ds-stat-card">
                <div class="ds-stat-label">Total Scans</div>
                <div class="ds-stat-value" style="color:#ec3586">{{ scans.length }}</div>
                <div class="ds-stat-delta">All time</div>
              </div>
              <div class="ds-stat-card">
                <div class="ds-stat-label">Completed</div>
                <div class="ds-stat-value" :style="{ color: '#00d4aa' }">{{ doneScans.length }}</div>
                <div class="ds-stat-delta">{{ scans.filter(s=>s.status==='error').length }} failed</div>
              </div>
              <div class="ds-stat-card">
                <div class="ds-stat-label">Avg Score</div>
                <div class="ds-stat-value" :style="{ color: avgScore != null ? scoreBg(avgScore) : 'rgba(255,255,255,0.2)' }">{{ avgScore ?? '—' }}</div>
                <div class="ds-stat-delta">Across all done scans</div>
              </div>
              <div class="ds-stat-card">
                <div class="ds-stat-label">Unique Sites</div>
                <div class="ds-stat-value" style="color:#6c5ce7">{{ new Set(doneScans.map(s=>s.url)).size }}</div>
                <div class="ds-stat-delta">{{ monitors.length }} monitored</div>
              </div>
            </div>

            <div class="ds-mid-grid">
              <!-- Scans per day bar chart -->
              <div class="ds-card">
                <div class="ds-card-header"><div class="ds-card-title">Scans per Day (last 14 days)</div></div>
                <div v-if="!scans.length" class="ds-empty-state"><p>No scans yet</p></div>
                <div v-else class="ds-bar-chart">
                  <div class="ds-bar-chart-inner">
                    <div v-for="(day, i) in scansPerDay" :key="i" class="ds-bar-col">
                      <div class="ds-bar-value">{{ day.count || '' }}</div>
                      <div class="ds-bar-wrap">
                        <div class="ds-bar" :style="{ height: Math.max(day.count / Math.max(...scansPerDay.map(d=>d.count), 1) * 100, day.count ? 8 : 0) + '%', background: day.count ? '#ec3586' : '#1e1e28' }"></div>
                      </div>
                      <div class="ds-bar-label">{{ i % 2 === 0 ? day.label.split(' ')[1] : '' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Score distribution donut-style -->
              <div class="ds-card">
                <div class="ds-card-header"><div class="ds-card-title">Score Distribution</div></div>
                <div v-if="!doneScans.length" class="ds-empty-state"><p>No completed scans</p></div>
                <div v-else class="ds-dist-chart">
                  <div v-for="bucket in scoreDistribution" :key="bucket.label" class="ds-dist-row">
                    <div class="ds-dist-label">{{ bucket.label }}</div>
                    <div class="ds-dist-bar-bg">
                      <div class="ds-dist-bar" :style="{ width: bucket.pct + '%', background: bucket.color }"></div>
                    </div>
                    <div class="ds-dist-count" :style="{ color: bucket.color }">{{ bucket.count }}</div>
                    <div class="ds-dist-pct">{{ bucket.pct }}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="ds-mid-grid">
              <!-- Avg pillar scores -->
              <div class="ds-card">
                <div class="ds-card-header"><div class="ds-card-title">Average Score per Pillar</div></div>
                <div v-if="!doneScans.length" class="ds-empty-state"><p>No completed scans</p></div>
                <div v-else class="ds-pillars-grid">
                  <div v-for="p in avgPillarScores" :key="p.name" class="ds-pillar-row">
                    <div class="ds-pillar-dot" :style="{ background: p.color }"></div>
                    <div class="ds-pillar-name">{{ p.name }}</div>
                    <div class="ds-pillar-bar-bg"><div class="ds-pillar-bar" :style="{ width: (p.score || 0) + '%', background: p.color }"></div></div>
                    <div class="ds-pillar-score" :style="{ color: p.score ? p.color : 'rgba(255,255,255,0.2)' }">{{ p.score || '—' }}</div>
                  </div>
                </div>
              </div>

              <!-- Top sites -->
              <div class="ds-card">
                <div class="ds-card-header">
                  <div class="ds-card-title">Most Scanned Sites</div>
                  <span class="ds-card-sub">{{ topSites.length }} sites</span>
                </div>
                <div v-if="!topSites.length" class="ds-empty-state"><p>No completed scans</p></div>
                <div v-else>
                  <button v-for="site in topSites" :key="site.url" @click="openScanByUrl(site.url)" class="ds-top-site-row">
                    <div class="ds-scan-fav">
                      <img v-if="faviconUrl(site.url)" :src="faviconUrl(site.url)!" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
                      <span v-else>{{ hostname(site.url).charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="ds-scan-info">
                      <div class="ds-scan-domain">{{ hostname(site.url) }}</div>
                      <div class="ds-scan-time">{{ site.count }} scan{{ site.count !== 1 ? 's' : '' }}</div>
                    </div>
                    <div class="ds-top-site-score" :style="{ color: scoreBg(site.latestScore ?? undefined) }">{{ site.latestScore ?? '—' }}</div>
                    <div class="ds-top-site-sparkline">
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
            <div v-if="urlCharts.length" class="cht-section">
              <div class="cht-section-head">
                <span class="cht-section-title">Score History per Site</span>
                <span class="cht-section-sub">{{ urlCharts.length }} site{{ urlCharts.length !== 1 ? 's' : '' }}</span>
              </div>
              <div class="cht-grid">
                <div v-for="site in urlCharts" :key="site.url" class="cht-card" @click="openChartDetail(site.url)">

                  <!-- Card header -->
                  <div class="cht-card-head">
                    <div class="ds-scan-fav">
                      <img v-if="faviconUrl(site.url)" :src="faviconUrl(site.url)!" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
                      <span v-else>{{ hostname(site.url).charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="cht-card-meta">
                      <div class="cht-card-host">{{ hostname(site.url) }}</div>
                      <div class="cht-card-count">{{ site.points.length }} scan{{ site.points.length !== 1 ? 's' : '' }}</div>
                    </div>
                    <div class="cht-card-score" :style="{ color: scoreColor(site.latest.score) }">{{ site.latest.score }}</div>
                  </div>

                  <!-- SVG line chart -->
                  <div class="cht-chart-wrap">
                    <svg viewBox="0 0 300 80" preserveAspectRatio="none" class="cht-svg" xmlns="http://www.w3.org/2000/svg">
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
                  <div class="cht-pillars">
                    <div v-if="site.latest.securityScore != null" class="cht-pillar">
                      <span class="cht-p-label">Sec</span>
                      <div class="cht-p-bar-bg"><div class="cht-p-bar" :style="{ width: site.latest.securityScore + '%', background: '#00d4aa' }"/></div>
                      <span class="cht-p-val" style="color:#00d4aa">{{ site.latest.securityScore }}</span>
                    </div>
                    <div v-if="site.latest.performanceScore != null" class="cht-pillar">
                      <span class="cht-p-label">Perf</span>
                      <div class="cht-p-bar-bg"><div class="cht-p-bar" :style="{ width: site.latest.performanceScore + '%', background: '#ffaa00' }"/></div>
                      <span class="cht-p-val" style="color:#ffaa00">{{ site.latest.performanceScore }}</span>
                    </div>
                    <div v-if="site.latest.seoScore != null" class="cht-pillar">
                      <span class="cht-p-label">SEO</span>
                      <div class="cht-p-bar-bg"><div class="cht-p-bar" :style="{ width: site.latest.seoScore + '%', background: '#6c5ce7' }"/></div>
                      <span class="cht-p-val" style="color:#6c5ce7">{{ site.latest.seoScore }}</span>
                    </div>
                    <div v-if="site.latest.accessibilityScore != null" class="cht-pillar">
                      <span class="cht-p-label">A11y</span>
                      <div class="cht-p-bar-bg"><div class="cht-p-bar" :style="{ width: site.latest.accessibilityScore + '%', background: '#a29bfe' }"/></div>
                      <span class="cht-p-val" style="color:#a29bfe">{{ site.latest.accessibilityScore }}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: CHART DETAIL
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'chart-detail' && selectedChartUrl">
            <div v-if="!chartDetailScans.length" class="ds-empty-state"><p>No completed scans for this site.</p></div>
            <div v-else class="cd-wrap">

              <!-- Hero header -->
              <div class="cd-hero">
                <div class="ds-scan-fav cd-fav">
                  <img v-if="faviconUrl(selectedChartUrl)" :src="faviconUrl(selectedChartUrl)!" loading="lazy" width="20" height="20" @error="($event.target as HTMLImageElement).style.display='none'" />
                  <span v-else>{{ hostname(selectedChartUrl).charAt(0).toUpperCase() }}</span>
                </div>
                <div class="cd-hero-meta">
                  <div class="cd-hero-host">{{ hostname(selectedChartUrl) }}</div>
                  <div class="cd-hero-url">{{ selectedChartUrl }}</div>
                </div>
                <div class="cd-hero-stats">
                  <div class="cd-hero-stat">
                    <div class="cd-hero-stat-val" :style="{ color: scoreColor(chartDetailLatest?.overallScore) }">{{ chartDetailLatest?.overallScore ?? '—' }}</div>
                    <div class="cd-hero-stat-label">Latest score</div>
                  </div>
                  <div class="cd-hero-stat">
                    <div class="cd-hero-stat-val" style="color:rgba(255,255,255,0.7)">{{ chartDetailScans.length }}</div>
                    <div class="cd-hero-stat-label">Scans</div>
                  </div>
                  <div class="cd-hero-stat" v-if="chartDetailScans.length >= 2">
                    <div class="cd-hero-stat-val" :style="{ color: chartDetailScans[chartDetailScans.length-1].overallScore >= chartDetailScans[0].overallScore ? '#00d4aa' : '#ff4757' }">
                      {{ chartDetailScans[chartDetailScans.length-1].overallScore >= chartDetailScans[0].overallScore ? '↑' : '↓' }}{{ Math.abs(chartDetailScans[chartDetailScans.length-1].overallScore - chartDetailScans[0].overallScore) }}
                    </div>
                    <div class="cd-hero-stat-label">Since first scan</div>
                  </div>
                </div>
                <button class="cd-view-result-btn" @click="openScanByUrl(selectedChartUrl)">View latest result →</button>
              </div>

              <!-- Large overall chart -->
              <div class="ds-card cd-main-chart-card">
                <div class="ds-card-header">
                  <div class="ds-card-title">Overall Score Over Time</div>
                  <span class="ds-card-sub">{{ chartDetailScans.length }} data point{{ chartDetailScans.length !== 1 ? 's' : '' }}</span>
                </div>
                <div class="cd-main-chart-wrap">
                  <svg :viewBox="`0 0 ${CD_W} ${CD_H}`" preserveAspectRatio="xMidYMid meet" class="cd-main-svg" xmlns="http://www.w3.org/2000/svg">
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
              <div v-if="chartDetailPillars.length" class="cd-pillars-section">
                <div class="cht-section-head">
                  <span class="cht-section-title">Pillar Breakdown</span>
                  <span class="cht-section-sub">scores from latest scan</span>
                </div>
                <div class="cd-pillars-grid">
                  <div v-for="p in chartDetailPillars" :key="p.key" class="cd-pillar-card">
                    <div class="cd-pillar-card-head">
                      <div class="cd-pillar-dot" :style="{ background: p.color }"/>
                      <span class="cd-pillar-name">{{ p.label }}</span>
                      <span class="cd-pillar-score" :style="{ color: p.color }">{{ p.latest ?? '—' }}</span>
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
                    <div v-else-if="p.scores.length === 1" class="cd-pillar-single">
                      <div class="cd-pillar-bar-bg">
                        <div class="cd-pillar-bar" :style="{ width: (p.latest ?? 0) + '%', background: p.color }"/>
                      </div>
                      <span class="cd-pillar-bar-val" :style="{ color: p.color }">{{ p.latest }}/100</span>
                    </div>
                    <div class="cd-pillar-card-foot">
                      <span class="cd-pillar-scan-count">{{ p.scores.length }} scan{{ p.scores.length !== 1 ? 's' : '' }}</span>
                      <span v-if="p.scores.length >= 2" class="cd-pillar-delta" :style="{ color: p.scores[p.scores.length-1] >= p.scores[0] ? '#00d4aa' : '#ff4757' }">
                        {{ p.scores[p.scores.length-1] >= p.scores[0] ? '+' : '' }}{{ p.scores[p.scores.length-1] - p.scores[0] }} vs first
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Scan log table -->
              <div class="ds-card cd-log-card">
                <div class="ds-card-header">
                  <div class="ds-card-title">Scan Log</div>
                  <span class="ds-card-sub">{{ chartDetailScans.length }} scans — most recent first</span>
                </div>
                <div class="cd-log-wrap">
                  <table class="cd-log-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Overall</th>
                        <th>Security</th>
                        <th>Performance</th>
                        <th>SEO</th>
                        <th>A11y</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="scan in [...chartDetailScans].reverse()" :key="scan._id">
                        <td class="cd-log-date">{{ shortDate(scan._creationTime) }}</td>
                        <td><span class="cd-log-score" :style="{ color: scoreColor(scan.overallScore), borderColor: scoreColor(scan.overallScore) + '30', background: scoreColor(scan.overallScore) + '12' }">{{ scan.overallScore ?? '—' }}</span></td>
                        <td><span v-if="scan.securityScore != null" class="cd-log-pill" :style="{ color: scoreColor(scan.securityScore) }">{{ scan.securityScore }}</span><span v-else class="cd-log-na">—</span></td>
                        <td><span v-if="scan.performanceScore != null" class="cd-log-pill" :style="{ color: scoreColor(scan.performanceScore) }">{{ scan.performanceScore }}</span><span v-else class="cd-log-na">—</span></td>
                        <td><span v-if="scan.seoScore != null" class="cd-log-pill" :style="{ color: scoreColor(scan.seoScore) }">{{ scan.seoScore }}</span><span v-else class="cd-log-na">—</span></td>
                        <td><span v-if="scan.accessibilityScore != null" class="cd-log-pill" :style="{ color: scoreColor(scan.accessibilityScore) }">{{ scan.accessibilityScore }}</span><span v-else class="cd-log-na">—</span></td>
                        <td><button class="cd-log-view" @click="openScan(scan)">View →</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </template>

          <template v-else-if="currentView === 'tools'">
            <ToolsView @open-tool="view.openTool" />
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: TOOL DETAIL
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'tool-detail' && currentToolComponent">
            <div class="ds-tool-detail">
              <Suspense>
                <component :is="currentToolComponent" />
                <template #fallback>
                  <div class="ds-tool-loading">
                    <div class="ds-tool-loading-dot" />
                    <span>Loading tool…</span>
                  </div>
                </template>
              </Suspense>
            </div>
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: RESULT
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'result' && selectedScan">

            <!-- ── Scanning state ───────────────────────── -->
            <div v-if="selectedScan.status === 'pending' || selectedScan.status === 'running'" class="rs-scanning">
              <div class="rs-scan-rings">
                <div class="rs-ring rs-ring-1"/>
                <div class="rs-ring rs-ring-2"/>
                <div class="rs-ring rs-ring-3"/>
                <div class="rs-ring rs-ring-spin"/>
                <div class="rs-ring-dot"/>
              </div>
              <div class="rs-scan-label">{{ selectedScan.status === 'running' ? 'Scanning…' : 'Initialising…' }}</div>
              <div class="rs-scan-url">{{ selectedScan.url }}</div>
              <div class="rs-scan-sub">Running 94 checks across security, performance, SEO, accessibility, AI readiness, DNS &amp; trust</div>
              <div class="rs-scan-dots">
                <div class="rs-scan-dot" style="animation-delay:0s"/>
                <div class="rs-scan-dot" style="animation-delay:0.2s"/>
                <div class="rs-scan-dot" style="animation-delay:0.4s"/>
              </div>
            </div>

            <!-- ── Error state ──────────────────────────── -->
            <div v-else-if="selectedScan.status === 'error'" class="rs-error">
              <div class="rs-error-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div class="rs-error-title">Scan failed</div>
              <div class="rs-error-msg">{{ selectedScan.errorMessage ?? 'Something went wrong.' }}</div>
              <button class="rs-retry-btn" @click="handleScan(selectedScan.url)">Try again</button>
            </div>

            <!-- ── Done state ───────────────────────────── -->
            <div v-else class="ds-result-layout">

              <!-- ══ HEADER BAR ══ -->
              <div class="rs2-header">
                <!-- Mini score ring -->
                <div class="rs2-mini-ring">
                  <svg width="44" height="44" viewBox="0 0 44 44" style="transform:rotate(-90deg)">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#1e1e28" stroke-width="4"/>
                    <circle v-if="selectedScan.overallScore" cx="22" cy="22" r="18" fill="none"
                      :stroke="scoreBg(selectedScan.overallScore)" stroke-width="4" stroke-linecap="round"
                      :stroke-dasharray="`${(selectedScan.overallScore/100)*113} 113`"/>
                  </svg>
                  <span class="rs2-mini-score" :style="{ color: scoreBg(selectedScan.overallScore) }">{{ selectedScan.overallScore ?? '—' }}</span>
                </div>

                <!-- URL + meta -->
                <div class="rs2-header-meta">
                  <div class="rs2-url">{{ selectedScan.url }}</div>
                  <div class="rs2-meta-row">
                    <span class="rs2-time">{{ relativeTime(selectedScan._creationTime) }}</span>
                    <span class="rs2-pill-done">● COMPLETE</span>
                    <span v-if="isMonitored(selectedScan.url)" class="rs2-pill-monitored">● MONITORED</span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="rs2-header-actions">
                  <button @click="reScan(selectedScan.url)" class="rs2-act-btn">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                    Re-scan
                  </button>
                  <button @click="toggleMonitor(selectedScan.url)" class="rs2-act-btn" :class="{ 'rs2-act-btn--danger-active': isMonitored(selectedScan.url) }">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {{ isMonitored(selectedScan.url) ? 'Stop monitoring' : 'Monitor' }}
                  </button>
                  <button @click="shareResult()" class="rs2-act-btn">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                    {{ resultCopied ? 'Copied!' : 'Share' }}
                  </button>
                  <button @click="deleteScan(selectedScan._id)" class="rs2-act-btn rs2-act-btn--danger">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                    Delete
                  </button>
                </div>
              </div>

              <!-- ══ SCORE STRIP ══ -->
              <div class="rs2-score-strip">
                <div v-for="[name, val, color, bonus] in [
                  ['Security',      selectedScan.securityScore,      '#00d4aa', false],
                  ['Performance',   selectedScan.performanceScore,   '#ffaa00', false],
                  ['SEO',           selectedScan.seoScore,           '#6c5ce7', false],
                  ['Accessibility', selectedScan.accessibilityScore, '#a29bfe', false],
                  ['AI Readiness',  selectedScan.aiScore,            '#ff7675', false],
                  ['DNS & Email',   selectedScan.dnsScore,           '#74b9ff', true],
                  ['Trust',         selectedScan.trustScore,         '#fd79a8', true],
                ]" :key="String(name)" class="rs2-score-card" :style="`--pc:${color}`">
                  <div class="rs2-score-card__label">
                    {{ name }}
                    <span v-if="bonus" class="rs2-score-card__bonus">BONUS</span>
                  </div>
                  <div class="rs2-score-card__num" :style="{ color: val != null ? String(color) : 'rgba(255,255,255,0.18)' }">{{ val ?? '—' }}</div>
                  <div class="rs2-score-card__bar-bg">
                    <div class="rs2-score-card__bar" :style="{ width: (Number(val)||0)+'%', background: String(color) }"/>
                  </div>
                </div>
              </div>

              <!-- ══ ISSUES ══ -->
              <template v-if="selectedScan.issues?.length">

                <!-- Issues heading -->
                <div class="rs2-issues-hdr">
                  <span class="rs2-issues-title">ISSUES</span>
                  <span class="rs2-issues-count">{{ selectedScan.issues.filter((i:any) => i.severity !== 'pass').length }}</span>
                </div>

                <!-- Fix Now — large tool cards -->
                <div v-if="resultToolCards.length" class="rs2-fix-panel">
                  <div class="rs2-fix-panel-head">
                    <span class="rs2-fix-panel-label">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                      FIX NOW
                    </span>
                    <span class="rs2-fix-panel-sub">Tools that directly address your open issues</span>
                  </div>
                  <div class="rs2-fix-cards">
                    <div
                      v-for="{ tool, count, hasCritical, issues: toolIssues } in resultToolCards"
                      :key="tool.slug"
                      class="rs2-fix-card"
                      :class="{ 'rs2-fix-card--critical': hasCritical }"
                      :style="`--tc:${tool.color}`"
                    >
                      <div class="rs2-fix-card-badge" :class="hasCritical ? 'rs2-fix-card-badge--crit' : 'rs2-fix-card-badge--warn'">
                        {{ count }} {{ hasCritical ? 'critical' : 'warning' }}{{ count === 1 ? '' : 's' }}
                      </div>
                      <div class="rs2-fix-card-body">
                        <div class="rs2-fix-card-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" :style="`color:${tool.color}`" v-html="tool.icon"/>
                        </div>
                        <div class="rs2-fix-card-title">{{ tool.title }}</div>
                        <div class="rs2-fix-card-desc">{{ toolIssues?.slice(0,2).map((i:any) => i.title).join(', ') || tool.description }}</div>
                      </div>
                      <button class="rs2-fix-card-cta" @click="dashboardNavigate(`/tools/${tool.slug}`)">
                        FIX ISSUES →
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Filter row -->
                <div class="rs2-filter-row">
                  <span class="rs2-filter-label">FILTER</span>
                  <div class="rs2-filter-bar">
                    <button
                      v-for="tab in resultIssueTabs" :key="tab"
                      class="rs2-chip"
                      :class="{ 'rs2-chip--active': resultActiveTab === tab }"
                      @click="resultActiveTab = tab"
                    >
                      {{ tab === 'all' ? 'All' : tab === 'seo' ? 'SEO' : tab === 'ai' ? 'AI' : tab === 'dns' ? 'DNS' : tab.charAt(0).toUpperCase() + tab.slice(1) }}
                      <span v-if="issueTabCount(tab)" class="rs2-chip-count">{{ issueTabCount(tab) }}</span>
                    </button>
                  </div>
                </div>

                <!-- Severity groups -->
                <div class="rs2-groups">

                  <!-- Critical -->
                  <div v-if="resultSeverityGroups.critical.length" class="rs2-sev-group">
                    <button class="rs2-sev-head rs2-sev-head--critical" @click="toggleResultGroup('critical')">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff4757" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <span class="rs2-sev-label">CRITICAL</span>
                      <span class="rs2-sev-cnt rs2-sev-cnt--critical">{{ resultSeverityGroups.critical.length }}</span>
                      <span class="rs2-sev-sub">Immediate action needed</span>
                      <svg class="rs2-sev-chevron" :class="{ open: !resultCollapsedGroups.has('critical') }" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <div v-if="!resultCollapsedGroups.has('critical')" class="rs2-issue-list">
                      <div v-for="issue in resultSeverityGroups.critical" :key="issue.title" class="rs2-issue rs2-issue--critical">
                        <!-- Title row -->
                        <div class="rs2-issue-title-row">
                          <span class="rs2-issue-bullet rs2-issue-bullet--critical">•</span>
                          <span class="rs2-issue-title">{{ issue.title }}</span>
                          <span class="rs2-sev-badge rs2-sev-badge--critical">CRITICAL</span>
                          <span class="rs2-issue-pillar" :style="pillarColor(issue.pillar)">{{ issue.pillar?.toUpperCase() }}</span>
                        </div>
                        <!-- Description always visible -->
                        <p class="rs2-issue-desc">{{ issue.description }}</p>
                        <!-- HOW TO FIX toggle -->
                        <template v-if="FIX_SNIPPETS[issue.title] || TOOL_LINKS[issue.title]">
                          <button class="rs2-how-toggle" @click="toggleResultIssue(issue.title)">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" class="rs2-how-chevron" :class="{ open: resultExpandedIssues.has(issue.title) }">
                              <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            HOW TO FIX
                          </button>
                          <div v-if="resultExpandedIssues.has(issue.title)" class="rs2-fix-expand">
                            <div v-if="FIX_SNIPPETS[issue.title]" class="rs2-snippet">
                              <pre class="rs2-pre">{{ FIX_SNIPPETS[issue.title].generic }}</pre>
                            </div>
                            <button v-if="TOOL_LINKS[issue.title]" class="rs2-open-tool" @click="dashboardNavigate(TOOL_LINKS[issue.title])">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                              Build your {{ allTools.find(t => TOOL_LINKS[issue.title]?.endsWith(t.slug))?.title ?? 'tool' }} with our tool →
                            </button>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>

                  <!-- Warning -->
                  <div v-if="resultSeverityGroups.warning.length" class="rs2-sev-group">
                    <button class="rs2-sev-head rs2-sev-head--warning" @click="toggleResultGroup('warning')">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span class="rs2-sev-label">WARNINGS</span>
                      <span class="rs2-sev-cnt rs2-sev-cnt--warning">{{ resultSeverityGroups.warning.length }}</span>
                      <span class="rs2-sev-sub">Review recommended</span>
                      <svg class="rs2-sev-chevron" :class="{ open: !resultCollapsedGroups.has('warning') }" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <div v-if="!resultCollapsedGroups.has('warning')" class="rs2-issue-list">
                      <div v-for="issue in resultSeverityGroups.warning" :key="issue.title" class="rs2-issue rs2-issue--warning">
                        <div class="rs2-issue-title-row">
                          <span class="rs2-issue-bullet rs2-issue-bullet--warning">•</span>
                          <span class="rs2-issue-title">{{ issue.title }}</span>
                          <span class="rs2-sev-badge rs2-sev-badge--warning">WARNING</span>
                          <span class="rs2-issue-pillar" :style="pillarColor(issue.pillar)">{{ issue.pillar?.toUpperCase() }}</span>
                        </div>
                        <p class="rs2-issue-desc">{{ issue.description }}</p>
                        <template v-if="FIX_SNIPPETS[issue.title] || TOOL_LINKS[issue.title]">
                          <button class="rs2-how-toggle" @click="toggleResultIssue(issue.title)">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" class="rs2-how-chevron" :class="{ open: resultExpandedIssues.has(issue.title) }">
                              <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            HOW TO FIX
                          </button>
                          <div v-if="resultExpandedIssues.has(issue.title)" class="rs2-fix-expand">
                            <div v-if="FIX_SNIPPETS[issue.title]" class="rs2-snippet">
                              <pre class="rs2-pre">{{ FIX_SNIPPETS[issue.title].generic }}</pre>
                            </div>
                            <button v-if="TOOL_LINKS[issue.title]" class="rs2-open-tool" @click="dashboardNavigate(TOOL_LINKS[issue.title])">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                              Build your {{ allTools.find(t => TOOL_LINKS[issue.title]?.endsWith(t.slug))?.title ?? 'tool' }} with our tool →
                            </button>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>

                  <!-- Passing -->
                  <div v-if="resultSeverityGroups.pass.length" class="rs2-sev-group">
                    <button class="rs2-sev-head rs2-sev-head--pass" @click="toggleResultGroup('pass')">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span class="rs2-sev-label">PASSING</span>
                      <span class="rs2-sev-cnt rs2-sev-cnt--pass">{{ resultSeverityGroups.pass.length }}</span>
                      <span class="rs2-sev-sub">All checks passed</span>
                      <svg class="rs2-sev-chevron" :class="{ open: !resultCollapsedGroups.has('pass') }" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <div v-if="!resultCollapsedGroups.has('pass')" class="rs2-issue-list">
                      <div v-for="issue in resultSeverityGroups.pass" :key="issue.title" class="rs2-issue rs2-issue--pass">
                        <div class="rs2-issue-title-row">
                          <span class="rs2-issue-bullet rs2-issue-bullet--pass">✓</span>
                          <span class="rs2-issue-title">{{ issue.title }}</span>
                          <span class="rs2-issue-pillar" :style="pillarColor(issue.pillar)">{{ issue.pillar?.toUpperCase() }}</span>
                        </div>
                        <p class="rs2-issue-desc">{{ issue.description }}</p>
                      </div>
                    </div>
                  </div>

                  <div v-if="!resultSeverityGroups.critical.length && !resultSeverityGroups.warning.length && !resultSeverityGroups.pass.length" class="ds-empty-state">
                    <p>No issues in this category</p>
                  </div>

                </div>

              </template>

              <!-- No issues -->
              <div v-else-if="selectedScan.status === 'done'" class="rs2-all-pass">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                No issues found — everything looks great
              </div>

              <!-- Other scans of same site -->
              <div v-if="scans.filter((s:any) => s.url === selectedScan.url && s._id !== selectedScan._id).length" class="ds-card">
                <div class="ds-card-header">
                  <div class="ds-card-title">Previous scans of {{ hostname(selectedScan.url) }}</div>
                </div>
                <button v-for="s in scans.filter((s:any) => s.url === selectedScan.url && s._id !== selectedScan._id).slice(0, 5)" :key="s._id" @click="openScan(s)" class="ds-scan-item">
                  <div class="ds-scan-info">
                    <div class="ds-scan-domain">{{ relativeTime(s._creationTime) }}</div>
                    <div class="ds-scan-time">{{ statusLabel(s.status) }}</div>
                  </div>
                  <span class="ds-scan-score" :style="{ color: scoreBg(s.overallScore) }">{{ s.overallScore ?? '—' }}</span>
                </button>
              </div>

            </div>
          </template>

        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Shell ────────────────────────────────────────────── */
.ds-shell {
  display: flex;
  height: 100vh;
  padding-top: 62px;
  overflow: hidden;
  background: #07070a;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
}


/* ── Content ──────────────────────────────────────────── */
.ds-content { flex: 1; overflow-y: auto; padding: 20px 22px; display: flex; flex-direction: column; gap: 18px; scrollbar-width: thin; scrollbar-color: rgba(236,53,134,0.3) transparent; }
.ds-content::-webkit-scrollbar { width: 4px; }
.ds-content::-webkit-scrollbar-track { background: transparent; }
.ds-content::-webkit-scrollbar-thumb { background: rgba(236,53,134,0.3); border-radius: 4px; transition: background 0.2s; }
.ds-content::-webkit-scrollbar-thumb:hover { background: rgba(236,53,134,0.6); }
.ds-nav { padding: 12px 0; flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(236,53,134,0.2) transparent; }
.ds-nav::-webkit-scrollbar { width: 3px; }
.ds-nav::-webkit-scrollbar-track { background: transparent; }
.ds-nav::-webkit-scrollbar-thumb { background: rgba(236,53,134,0.2); border-radius: 4px; }
.ds-nav::-webkit-scrollbar-thumb:hover { background: rgba(236,53,134,0.45); }
.ds-skeleton { background: rgba(255,255,255,0.03); animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* Stats */
.ds-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.ds-stat-card { background: #0f0f14; border: 1px solid #1e1e28; border-radius: 12px; padding: 16px; }
.ds-stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; font-family: 'Space Grotesk', sans-serif; }
.ds-stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; line-height: 1; }
.ds-stat-delta { font-size: 11px; color: #6b7280; margin-top: 5px; }
.ds-stat-link { color: #ec3586; background: none; border: none; cursor: pointer; font-size: 11px; padding: 0; }
.ds-stat-link:hover { opacity: 0.8; }

/* Grids */
.ds-mid-grid { display: grid; grid-template-columns: 1fr 300px; gap: 18px; }
.ds-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }

/* Card */
.ds-card { background: #0f0f14; border: 1px solid #1e1e28; border-radius: 12px; padding: 18px; }
.ds-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.ds-card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 13px; color: #e8e8f0; }
.ds-card-action { font-size: 12px; color: #ec3586; text-decoration: none; cursor: pointer; background: none; border: none; transition: opacity 0.15s; padding: 0; }
.ds-card-action:hover { opacity: 0.75; }
.ds-card-sub { font-size: 11px; color: #6b7280; }

/* Pillar rows */
.ds-pillars-grid { display: flex; flex-direction: column; gap: 10px; }
.ds-pillar-row { display: flex; align-items: center; gap: 10px; }
.ds-pillar-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ds-pillar-name { font-size: 12px; color: #9898b0; width: 90px; flex-shrink: 0; }
.ds-pillar-bar-bg { flex: 1; height: 5px; background: #1e1e28; border-radius: 3px; overflow: hidden; }
.ds-pillar-bar { height: 100%; border-radius: 3px; transition: width 0.5s ease; min-width: 2px; }
.ds-pillar-score { font-size: 12px; font-weight: 600; width: 28px; text-align: right; font-family: 'Space Grotesk', sans-serif; flex-shrink: 0; }

/* Scan items (button version) */
.ds-scan-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 0; border-bottom: 1px solid #1e1e28;
  background: none; border-left: none; border-right: none; border-top: none;
  width: 100%; text-align: left; cursor: pointer;
  transition: opacity 0.15s;
}
.ds-scan-item:last-child { border-bottom: none; padding-bottom: 0; }
.ds-scan-item:hover { opacity: 0.75; }
.ds-scan-fav { width: 28px; height: 28px; background: #16161e; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #9898b0; flex-shrink: 0; overflow: hidden; }
.ds-scan-info { flex: 1; min-width: 0; }
.ds-scan-domain { font-size: 13px; font-weight: 500; color: #e8e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ds-scan-time { font-size: 11px; color: #6b7280; margin-top: 1px; }
.ds-scan-right { flex-shrink: 0; }
.ds-scan-score { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; }
.ds-scan-running { color: #ec3586; animation: pingpulse 1s infinite; }
@keyframes pingpulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

/* Monitor rows */
.ds-monitor-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #1e1e28; }
.ds-monitor-row:last-child { border-bottom: none; }
.ds-monitor-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ds-monitor-info { flex: 1; min-width: 0; }
.ds-monitor-domain { font-size: 13px; font-weight: 500; color: #e8e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ds-monitor-meta { font-size: 11px; color: #6b7280; margin-top: 1px; }
.ds-monitor-score { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; display: flex; align-items: center; gap: 4px; }
.ds-monitor-actions { display: flex; gap: 8px; align-items: center; }
.ds-monitor-link { font-size: 12px; color: #9898b0; background: none; border: none; cursor: pointer; transition: color 0.1s; padding: 0; }
.ds-monitor-link:hover { color: #e8e8f0; }
.ds-monitor-stop { font-size: 11px; color: rgba(255,71,87,0.4); background: none; border: none; cursor: pointer; transition: color 0.1s; padding: 0; }
.ds-monitor-stop:hover { color: #ff4757; }

/* Activity */
.ds-activity-list { display: flex; flex-direction: column; }
.ds-activity-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1e1e28; font-size: 12px; color: #9898b0; background: none; border-left: none; border-right: none; border-top: none; width: 100%; text-align: left; cursor: pointer; transition: opacity 0.15s; }
.ds-activity-item:last-child { border-bottom: none; }
.ds-activity-item:hover { opacity: 0.8; }
.ds-activity-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.ds-activity-text { flex: 1; }
.ds-activity-domain { color: #e8e8f0; font-weight: 500; margin-right: 4px; }
.ds-activity-time { font-size: 11px; color: #6b7280; flex-shrink: 0; }

/* Status pills */
.ds-status-pill { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 2px 7px; border-radius: 4px; font-family: 'Space Grotesk', sans-serif; flex-shrink: 0; }
.ds-s-done    { background: rgba(0,212,170,0.1);   color: #00d4aa; }
.ds-s-running { background: rgba(236,53,134,0.1);  color: #ec3586; }
.ds-s-pending { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); }
.ds-s-error   { background: rgba(255,71,87,0.1);   color: #ff4757; }

/* Empty states */
.ds-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 0; color: rgba(255,255,255,0.3); font-size: 13px; text-align: center; gap: 6px; }
.ds-empty-logo { width: 32px; height: 32px; opacity: 0.15; }
.ds-empty-hint { font-size: 12px; color: rgba(255,255,255,0.2); }
.ds-empty-btn { font-size: 12px; color: #ec3586; background: none; border: none; cursor: pointer; padding: 0; margin-top: 4px; }
.ds-primary-btn { display: inline-block; background: #ec3586; color: white; text-decoration: none; font-size: 13px; font-weight: 500; padding: 8px 18px; border-radius: 8px; }

/* ── History view ─────────────────────────────────────── */
.ds-history-toolbar { display: flex; align-items: center; gap: 12px; }
.ds-history-search { background: #0f0f14; border: 1px solid #1e1e28; border-radius: 8px; padding: 7px 14px; color: #e8e8f0; font-size: 13px; width: 260px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s; }
.ds-history-search::placeholder { color: #6b7280; }
.ds-history-search:focus { border-color: rgba(236,53,134,0.4); }
.ds-filter-tabs { display: flex; gap: 2px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 3px; border-radius: 8px; }
.ds-filter-tab { padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 0.08em; background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.1s; }
.ds-filter-active { background: #ec3586; color: white; }
.ds-history-count { font-size: 12px; color: #6b7280; margin-left: auto; }

.ds-history-row {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 18px; border-bottom: 1px solid #1e1e28;
  background: none; width: 100%; text-align: left; cursor: pointer;
  transition: background 0.1s; text-decoration: none; color: inherit;
}
.ds-history-row:last-child { border-bottom: none; }
.ds-history-row:hover { background: rgba(255,255,255,0.025); }
.ds-comparison-row { padding: 13px 18px; }

.ds-history-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dot-pending { background: rgba(255,255,255,0.15); }
.dot-running { background: #ec3586; }
.dot-done    { background: #00d4aa; }
.dot-error   { background: #ff4757; }

.ds-history-pillars { display: flex; align-items: flex-end; gap: 3px; height: 28px; }
.ds-mini-bar-wrap { width: 3px; height: 28px; background: #1e1e28; border-radius: 2px; display: flex; flex-direction: column; justify-content: flex-end; }
.ds-mini-bar { width: 100%; border-radius: 2px; transition: height 0.3s; }
.ds-history-score { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 20px; flex-shrink: 0; width: 40px; text-align: right; }
.ds-history-actions { display: flex; gap: 2px; align-items: center; flex-shrink: 0; }
.ds-icon-btn { width: 28px; height: 28px; border-radius: 6px; background: transparent; border: none; color: rgba(255,255,255,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
.ds-icon-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); }
.ds-icon-btn--active { color: #ec3586; }
.ds-icon-btn--danger:hover { background: rgba(255,71,87,0.12); color: #ff4757; }

/* ── Compare view ─────────────────────────────────────── */
.ds-compare-form { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; }
.ds-compare-col { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 200px; }
.ds-compare-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'Space Grotesk', sans-serif; }
.ds-compare-input { background: #16161e; border: 1px solid #1e1e28; border-radius: 8px; padding: 9px 14px; color: #e8e8f0; font-size: 13px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s; width: 100%; }
.ds-compare-input::placeholder { color: #6b7280; }
.ds-compare-input:focus { border-color: rgba(236,53,134,0.4); }
.ds-compare-vs { font-family: 'Space Grotesk', sans-serif; font-size: 12px; color: #6b7280; padding-bottom: 10px; }
.ds-compare-btn { background: #ec3586; color: white; border: none; border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; }
.ds-compare-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Bulk view ────────────────────────────────────────── */
.ds-bulk-progress { flex: 1; max-width: 120px; height: 4px; background: #1e1e28; border-radius: 2px; overflow: hidden; }
.ds-bulk-bar { height: 100%; background: #ec3586; border-radius: 2px; transition: width 0.3s; }

/* ── Result view ──────────────────────────────────────── */
.ds-result-layout { display: flex; flex-direction: column; gap: 18px; }
.ds-result-hero { display: flex; align-items: flex-start; gap: 28px; }
.ds-result-ring-wrap { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
.ds-result-ring-num { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ds-result-big-score { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 700; line-height: 1; }
.ds-result-score-label { font-size: 11px; color: #6b7280; }
.ds-result-meta { flex: 1; min-width: 0; }
.ds-result-url { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 600; color: #e8e8f0; word-break: break-all; margin-bottom: 4px; }
.ds-result-time { font-size: 12px; color: #6b7280; margin-bottom: 10px; }
.ds-result-status-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.ds-monitored-tag { font-size: 11px; color: #00d4aa; }
.ds-result-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.ds-action-btn { padding: 7px 14px; border-radius: 7px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid #1e1e28; background: transparent; color: #9898b0; transition: all 0.1s; text-decoration: none; display: inline-block; font-family: 'DM Sans', sans-serif; }
.ds-action-btn:hover { border-color: rgba(255,255,255,0.15); color: #e8e8f0; }
.ds-action-btn--active { color: #ec3586; border-color: rgba(236,53,134,0.3); }
.ds-action-btn--danger:hover { color: #ff4757; border-color: rgba(255,71,87,0.3); }
.ds-action-btn--primary { background: #ec3586; color: white !important; border-color: #ec3586 !important; }
.ds-action-btn--primary:hover { opacity: 0.9; }

.rs-pillars-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.rs-pillar-card {
  position: relative; background: #0f0f14; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; padding: 16px 16px 14px; overflow: hidden;
  display: flex; flex-direction: column; gap: 10px;
}
.rs-pillar-card-top {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--pc, #fff) 50%, transparent);
  opacity: 0.6;
}
.rs-pillar-card-glow {
  position: absolute; inset: 0; pointer-events: none; border-radius: 12px;
  background: radial-gradient(ellipse at 50% -10%, color-mix(in srgb, var(--pc, #fff) 8%, transparent) 0%, transparent 65%);
}
.rs-pillar-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: color-mix(in srgb, var(--pc, #fff) 80%, white);
  display: flex; align-items: center; gap: 6px;
}
.rs-pillar-bonus {
  font-size: 8px; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; padding: 1px 5px;
  letter-spacing: 0.1em;
}
.rs-pillar-score {
  font-family: 'Space Grotesk', sans-serif; font-size: 34px; font-weight: 800;
  line-height: 1; letter-spacing: -0.04em;
}
.rs-pillar-bar-bg { height: 4px; background: rgba(255,255,255,0.07); border-radius: 2px; overflow: hidden; width: 100%; }
.rs-pillar-bar    { height: 100%; border-radius: 2px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); min-width: 2px; }

/* ── Tools dropdown (sidebar) ─────────────────────────── */
.ds-nav-chevron { width: 12px; height: 12px; margin-left: auto; transition: transform 0.2s; opacity: 0.5; flex-shrink: 0; }
.ds-nav-chevron--open { transform: rotate(180deg); }
.ds-tools-dropdown { padding: 2px 0 6px 28px; display: flex; flex-direction: column; gap: 1px; }
.ds-tools-sub-item {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 10px 5px 0; color: #6b7280; font-size: 12px;
  text-decoration: none; background: none; border: none;
  width: 100%; text-align: left; cursor: pointer;
  transition: color 0.1s; border-radius: 5px;
}
.ds-tools-sub-item:hover { color: #e8e8f0; }
.ds-tools-sub-active { color: white !important; background: color-mix(in srgb, var(--ac) 10%, transparent) !important; }
.ds-tools-sub-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

/* ── Tool detail view ─────────────────────────────────── */
.ds-tool-detail { min-height: 100%; }
.ds-tool-loading { display: flex; align-items: center; gap: 12px; padding: 60px 0; justify-content: center; color: #6b7280; font-size: 13px; }
.ds-tool-loading-dot { width: 8px; height: 8px; border-radius: 50%; background: #ec3586; animation: pulse 1s infinite; }

/* ── Charts view ──────────────────────────────────────── */
.ds-bar-chart { padding-top: 8px; }
.ds-bar-chart-inner { display: flex; align-items: flex-end; gap: 4px; height: 120px; }
.ds-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; height: 100%; }
.ds-bar-value { font-size: 9px; color: #6b7280; height: 14px; display: flex; align-items: center; font-family: 'Space Grotesk', sans-serif; }
.ds-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
.ds-bar { width: 100%; border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.4s ease; }
.ds-bar-label { font-size: 9px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: clip; max-width: 100%; text-align: center; }

.ds-dist-chart { display: flex; flex-direction: column; gap: 14px; padding-top: 6px; }
.ds-dist-row { display: flex; align-items: center; gap: 10px; }
.ds-dist-label { font-size: 12px; color: #9898b0; width: 120px; flex-shrink: 0; }
.ds-dist-bar-bg { flex: 1; height: 8px; background: #1e1e28; border-radius: 4px; overflow: hidden; }
.ds-dist-bar { height: 100%; border-radius: 4px; transition: width 0.5s ease; min-width: 2px; }
.ds-dist-count { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; width: 24px; text-align: right; flex-shrink: 0; }
.ds-dist-pct { font-size: 11px; color: #6b7280; width: 32px; text-align: right; flex-shrink: 0; }

.ds-top-site-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #1e1e28; background: none; width: 100%; text-align: left; cursor: pointer; transition: opacity 0.15s; }
.ds-top-site-row:last-child { border-bottom: none; }
.ds-top-site-row:hover { opacity: 0.75; }
.ds-top-site-score { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; flex-shrink: 0; width: 32px; text-align: right; }
.ds-top-site-sparkline { flex-shrink: 0; opacity: 0.7; }

/* ── Tools view (mirrors /tools page) ────────────────── */
.tl-tabs { display: flex; gap: 0; overflow-x: auto; border-bottom: 1px solid rgba(255,255,255,0.05); scrollbar-width: none; flex-shrink: 0; }
.tl-tabs::-webkit-scrollbar { display: none; }
.tl-tab { display: inline-flex; align-items: center; gap: 7px; font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700; padding: 12px 14px; color: rgba(255,255,255,0.28); background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 0.15s, border-color 0.15s; white-space: nowrap; }
.tl-tab:hover { color: rgba(255,255,255,0.6); }
.tl-tab--active { color: var(--tc); border-bottom-color: var(--tc); }
.tl-tdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.tl-tcount { font-family: 'Space Grotesk', sans-serif; font-size: 9px; background: rgba(255,255,255,0.06); border-radius: 4px; padding: 1px 5px; color: rgba(255,255,255,0.22); }
.tl-tab--active .tl-tcount { background: color-mix(in srgb, var(--tc) 15%, transparent); color: var(--tc); }

.tl-feat { position: relative; overflow: hidden; display: flex; align-items: stretch; border-radius: 14px; background: #0e0e13; border: 1px solid rgba(255,255,255,0.07); text-decoration: none; min-height: 200px; transition: border-color 0.25s, transform 0.2s, box-shadow 0.25s; }
.tl-feat:hover { border-color: var(--pc); transform: translateY(-2px); box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px var(--pc); }
.tl-feat-shimmer { position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--pc), transparent); opacity: 0; transition: opacity 0.3s; }
.tl-feat:hover .tl-feat-shimmer { opacity: 1; }
.tl-feat-glow { position: absolute; inset: 0; pointer-events: none; }
.tl-feat-deco { position: absolute; right: -20px; bottom: -20px; opacity: 0.045; pointer-events: none; transition: opacity 0.3s; }
.tl-feat:hover .tl-feat-deco { opacity: 0.07; }
.tl-feat-body { position: relative; z-index: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 14px; flex: 1; }
.tl-feat-top { display: flex; align-items: center; gap: 12px; }
.tl-feat-ring { width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid; }
.tl-feat-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.tl-fbadge { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; border: 1px solid; }
.tl-fbadge--free { color: #00d4aa; background: rgba(0,212,170,0.08); border-color: rgba(0,212,170,0.22); }
.tl-fbadge--feat { color: #ec3586; background: rgba(236,53,134,0.08); border-color: rgba(236,53,134,0.22); }
.tl-feat-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.3rem, 2.5vw, 1.9rem); font-weight: 800; color: white; letter-spacing: -0.03em; margin: 0; line-height: 1.1; }
.tl-feat-desc { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.36); line-height: 1.6; margin: 0; flex: 1; }
.tl-feat-foot { display: flex; align-items: center; gap: 16px; margin-top: auto; }
.tl-feat-checks { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; flex: 1; }
.tl-feat-cta { display: inline-flex; align-items: center; font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 9px 18px; border-radius: 6px; transition: filter 0.15s, transform 0.15s; flex-shrink: 0; }
.tl-feat:hover .tl-feat-cta { filter: brightness(1.1); transform: translateX(2px); }

.tl-rest-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.tl-rcard { display: flex; position: relative; overflow: hidden; border-radius: 12px; background: #0e0e13; border: 1px solid rgba(255,255,255,0.055); text-decoration: none; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; animation: tl-card-in 0.3s ease both; animation-delay: calc(var(--i) * 40ms); }
@keyframes tl-card-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.tl-rcard:hover { border-color: var(--pc); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px var(--pc); }
.tl-rcard-accent { width: 3px; flex-shrink: 0; opacity: 0.5; transition: opacity 0.2s; }
.tl-rcard:hover .tl-rcard-accent { opacity: 1; }
.tl-rcard-inner { display: flex; flex-direction: column; gap: 9px; padding: 18px 18px 18px 16px; flex: 1; }
.tl-rcard-head { display: flex; align-items: center; gap: 8px; }
.tl-rcard-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tl-rcard-pillar { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; flex: 1; }
.tl-rcard-free { font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; padding: 2px 5px; }
.tl-rcard-title { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.88); margin: 0; line-height: 1.3; transition: color 0.15s; }
.tl-rcard:hover .tl-rcard-title { color: white; }
.tl-rcard-desc { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.26); line-height: 1.5; margin: 0; flex: 1; }
.tl-rcard-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.tl-rcard-checks { font-family: 'Space Grotesk', sans-serif; font-size: 10px; padding: 2px 7px; border-radius: 4px; }
.tl-rcard-cta { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; color: var(--pc); letter-spacing: 0.04em; transition: letter-spacing 0.15s; }
.tl-rcard:hover .tl-rcard-cta { letter-spacing: 0.08em; }

.tl-fade-enter-active { transition: opacity 0.2s, transform 0.2s; }
.tl-fade-leave-active { transition: opacity 0.15s; }
.tl-fade-enter-from { opacity: 0; transform: translateY(6px); }
.tl-fade-leave-to   { opacity: 0; }

/* ── Result: scanning state ──────────────────────────── */
.rs-scanning {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 0; gap: 10px;
}
.rs-scan-rings { position: relative; width: 100px; height: 100px; margin-bottom: 24px; }
.rs-ring { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.05); }
.rs-ring-1 { inset: 0; }
.rs-ring-2 { inset: 14px; border-color: rgba(255,255,255,0.07); }
.rs-ring-3 { inset: 28px; border-color: rgba(255,255,255,0.09); }
.rs-ring-spin { inset: 0; border: 2px solid transparent; border-top-color: #ec3586; border-radius: 50%; animation: rs-spin 1.4s linear infinite; }
@keyframes rs-spin { to { transform: rotate(360deg); } }
.rs-ring-dot { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 10px; height: 10px; border-radius: 50%; background: #ec3586; animation: rs-pulse 1.4s ease-in-out infinite; }
@keyframes rs-pulse { 0%,100%{opacity:1;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.4;transform:translate(-50%,-50%) scale(0.8)} }
.rs-scan-label { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.9); }
.rs-scan-url   { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.5); }
.rs-scan-sub   { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.3); max-width: 360px; text-align: center; }
.rs-scan-dots  { display: flex; gap: 5px; margin-top: 8px; }
.rs-scan-dot   { width: 5px; height: 5px; border-radius: 50%; background: rgba(236,53,134,0.5); animation: rs-pulse 1.4s ease-in-out infinite; }

/* ── Result: error state ─────────────────────────────── */
.rs-error { display: flex; flex-direction: column; align-items: center; padding: 80px 0; gap: 10px; }
.rs-error-icon { width: 52px; height: 52px; border-radius: 50%; background: rgba(255,71,87,0.08); border: 1px solid rgba(255,71,87,0.15); display: flex; align-items: center; justify-content: center; color: #ff4757; margin-bottom: 6px; }
.rs-error-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.88); }
.rs-error-msg { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.45); max-width: 300px; text-align: center; }
.rs-retry-btn { margin-top: 8px; font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; padding: 8px 16px; cursor: pointer; transition: background 0.15s; }
.rs-retry-btn:hover { background: rgba(255,255,255,0.1); }

/* ── Result: issues section ──────────────────────────── */
.rs-issue-total { font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 400; margin-left: 6px; font-family: 'DM Sans', sans-serif; }
.rs-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 14px; }
.rs-tab {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  padding: 5px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);
  background: none; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.12s;
  display: flex; align-items: center; gap: 5px;
}
.rs-tab:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.15); }
.rs-tab--active { background: rgba(236,53,134,0.12); border-color: rgba(236,53,134,0.3); color: #ec3586; }
.rs-tab-count { font-size: 10px; background: rgba(255,255,255,0.07); border-radius: 4px; padding: 1px 5px; }
.rs-tab--active .rs-tab-count { background: rgba(236,53,134,0.15); }

.rs-issues { display: flex; flex-direction: column; }
.rs-issue { border-bottom: 1px solid rgba(255,255,255,0.04); }
.rs-issue:last-child { border-bottom: none; }
.rs-issue-head {
  display: flex; align-items: center; gap: 10px; padding: 11px 0;
  background: none; border: none; width: 100%; text-align: left; cursor: pointer;
  transition: opacity 0.1s;
}
.rs-issue-head:hover { opacity: 0.8; }
.rs-sev {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 7px; border-radius: 4px;
  flex-shrink: 0; border: 1px solid;
}
.rs-sev--critical { color: #ff4757; background: rgba(255,71,87,0.1);   border-color: rgba(255,71,87,0.25); }
.rs-sev--warning  { color: #ffaa00; background: rgba(255,170,0,0.1);  border-color: rgba(255,170,0,0.25); }
.rs-sev--pass     { color: #00d4aa; background: rgba(0,212,170,0.1);  border-color: rgba(0,212,170,0.25); }
.rs-sev--info     { color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
.rs-issue-title { flex: 1; font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.75); text-align: left; }
.rs-issue-pillar { font-family: 'DM Sans', sans-serif; font-size: 11px; flex-shrink: 0; }
.rs-fix-badge { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; color: #00d4aa; background: rgba(0,212,170,0.08); border: 1px solid rgba(0,212,170,0.2); border-radius: 4px; padding: 2px 6px; flex-shrink: 0; }
.rs-issue-chevron { flex-shrink: 0; color: rgba(255,255,255,0.25); transition: transform 0.2s; }
.rs-issue-chevron.open { transform: rotate(180deg); color: rgba(255,255,255,0.5); }

.rs-issue-body { padding: 0 0 14px 0; display: flex; flex-direction: column; gap: 10px; }
.rs-issue-desc { font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: rgba(255,255,255,0.45); line-height: 1.65; margin: 0; }
.rs-snippet { background: #0a0a10; border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; overflow: hidden; }
.rs-pre { font-family: 'Fira Mono','Cascadia Code',monospace; font-size: 11px; line-height: 1.65; color: rgba(255,255,255,0.65); padding: 12px 14px; margin: 0; overflow-x: auto; white-space: pre; }
.rs-tool-link {
  align-self: flex-start; font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  color: #ec3586; background: rgba(236,53,134,0.08); border: 1px solid rgba(236,53,134,0.2);
  border-radius: 6px; padding: 6px 12px; cursor: pointer; transition: background 0.12s;
}
.rs-tool-link:hover { background: rgba(236,53,134,0.16); }

/* ── Chart detail view ───────────────────────────────── */
.cd-wrap { display: flex; flex-direction: column; gap: 20px; }

.cd-hero {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; padding: 18px 20px;
}
.cd-fav { width: 36px; height: 36px; border-radius: 8px; font-size: 16px; }
.cd-hero-meta { flex: 1; min-width: 0; }
.cd-hero-host { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.88); }
.cd-hero-url  { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; }
.cd-hero-stats { display: flex; gap: 20px; }
.cd-hero-stat { text-align: center; }
.cd-hero-stat-val   { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 800; line-height: 1; }
.cd-hero-stat-label { font-family: 'DM Sans', sans-serif; font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 3px; white-space: nowrap; }
.cd-view-result-btn {
  font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600;
  color: #ec3586; background: rgba(236,53,134,0.1); border: 1px solid rgba(236,53,134,0.25);
  border-radius: 7px; padding: 8px 14px; cursor: pointer; transition: background 0.15s;
  white-space: nowrap;
}
.cd-view-result-btn:hover { background: rgba(236,53,134,0.18); }

.cd-main-chart-card { }
.cd-main-chart-wrap { padding: 8px 4px 4px; }
.cd-main-svg { width: 100%; height: auto; display: block; min-height: 120px; }

.cd-pillars-section { display: flex; flex-direction: column; gap: 12px; }
.cd-pillars-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.cd-pillar-card {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px;
  padding: 14px; display: flex; flex-direction: column; gap: 10px;
}
.cd-pillar-card-head { display: flex; align-items: center; gap: 8px; }
.cd-pillar-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.cd-pillar-name { font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.65); flex: 1; }
.cd-pillar-score { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 800; line-height: 1; }
.cd-pillar-single { display: flex; flex-direction: column; gap: 6px; }
.cd-pillar-bar-bg { height: 5px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
.cd-pillar-bar { height: 100%; border-radius: 3px; transition: width 0.4s; }
.cd-pillar-bar-val { font-family: 'DM Sans', sans-serif; font-size: 11px; }
.cd-pillar-card-foot { display: flex; justify-content: space-between; align-items: center; }
.cd-pillar-scan-count { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.28); }
.cd-pillar-delta { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; }

.cd-log-card { }
.cd-log-wrap { overflow-x: auto; }
.cd-log-table { width: 100%; border-collapse: collapse; font-family: 'DM Sans', sans-serif; font-size: 12px; }
.cd-log-table thead th {
  text-align: left; padding: 8px 12px;
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.25);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.cd-log-table tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.1s; }
.cd-log-table tbody tr:hover { background: rgba(255,255,255,0.025); }
.cd-log-table tbody td { padding: 9px 12px; vertical-align: middle; }
.cd-log-date { color: rgba(255,255,255,0.45); white-space: nowrap; }
.cd-log-score {
  font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700;
  padding: 3px 8px; border-radius: 5px; border: 1px solid;
}
.cd-log-pill { font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600; }
.cd-log-na { color: rgba(255,255,255,0.2); }
.cd-log-view {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  color: rgba(255,255,255,0.45); background: none; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 5px; padding: 4px 9px; cursor: pointer; transition: color 0.1s, border-color 0.1s;
}
.cd-log-view:hover { color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.25); }

/* ── Per-site score history charts ───────────────────── */
.cht-section { display: flex; flex-direction: column; gap: 16px; }
.cht-section-head { display: flex; align-items: baseline; gap: 10px; }
.cht-section-title {
  font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700;
  color: rgba(255,255,255,0.75);
}
.cht-section-sub {
  font-family: 'DM Sans', sans-serif; font-size: 11px;
  color: rgba(255,255,255,0.28);
}
.cht-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px;
}
.cht-card {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px;
  padding: 16px; display: flex; flex-direction: column; gap: 14px;
  cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.cht-card:hover { border-color: rgba(255,255,255,0.14); background: #13131a; }

.cht-card-head { display: flex; align-items: center; gap: 10px; }
.cht-card-meta { flex: 1; min-width: 0; }
.cht-card-host {
  font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600;
  color: rgba(255,255,255,0.82); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cht-card-count { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 1px; }
.cht-card-score {
  font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 800;
  line-height: 1; flex-shrink: 0;
}

.cht-chart-wrap { border-radius: 8px; overflow: hidden; background: #0a0a10; }
.cht-svg { width: 100%; height: 90px; display: block; }

.cht-pillars { display: flex; flex-direction: column; gap: 6px; }
.cht-pillar { display: flex; align-items: center; gap: 8px; }
.cht-p-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  color: rgba(255,255,255,0.35); width: 28px; flex-shrink: 0;
}
.cht-p-bar-bg {
  flex: 1; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden;
}
.cht-p-bar { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
.cht-p-val {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  width: 22px; text-align: right; flex-shrink: 0;
}

/* ── Result v2: header ───────────────────────────────── */
.rs2-header {
  display: flex; align-items: center; gap: 14px;
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; padding: 12px 16px;
}
/* Mini ring */
.rs2-mini-ring {
  position: relative; width: 44px; height: 44px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.rs2-mini-score {
  position: absolute; font-family: 'Space Grotesk', sans-serif;
  font-size: 11px; font-weight: 800; line-height: 1;
}
.rs2-header-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.rs2-url {
  font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700;
  color: rgba(255,255,255,0.88); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.rs2-meta-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.rs2-time { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.28); }
.rs2-pill-done {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 6px; border-radius: 4px;
  color: #00d4aa; background: rgba(0,212,170,0.1); border: 1px solid rgba(0,212,170,0.2);
}
.rs2-pill-monitored {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 6px; border-radius: 4px;
  color: #ec3586; background: rgba(236,53,134,0.08); border: 1px solid rgba(236,53,134,0.2);
}
/* Action buttons — horizontal row on the right */
.rs2-header-actions { display: flex; flex-direction: row; gap: 6px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
.rs2-act-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  padding: 5px 10px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.09);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.55); cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s; white-space: nowrap;
}
.rs2-act-btn:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.85); border-color: rgba(255,255,255,0.16); }
.rs2-act-btn--danger-active { color: #ec3586; border-color: rgba(236,53,134,0.3); background: rgba(236,53,134,0.08); }
.rs2-act-btn--danger { color: rgba(255,71,87,0.5); }
.rs2-act-btn--danger:hover { color: #ff4757; background: rgba(255,71,87,0.08); border-color: rgba(255,71,87,0.2); }

/* ── Score strip ─────────────────────────────────────── */
.rs2-score-strip {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
.rs2-score-card {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px; padding: 12px 14px 10px;
  display: flex; flex-direction: column; gap: 8px;
  position: relative; overflow: hidden;
}
.rs2-score-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--pc) 50%, transparent);
  opacity: 0.5;
}
.rs2-score-card__label {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.13em; text-transform: uppercase;
  color: color-mix(in srgb, var(--pc) 75%, white);
  display: flex; align-items: center; gap: 5px;
}
.rs2-score-card__bonus {
  font-size: 7px; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; padding: 1px 4px;
  letter-spacing: 0.1em;
}
.rs2-score-card__num {
  font-family: 'Space Grotesk', sans-serif; font-size: 30px; font-weight: 800;
  line-height: 1; letter-spacing: -0.04em;
}
.rs2-score-card__bar-bg { height: 3px; background: rgba(255,255,255,0.07); border-radius: 2px; overflow: hidden; }
.rs2-score-card__bar    { height: 100%; border-radius: 2px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); min-width: 2px; }

/* ── Result v2: issues heading ───────────────────────── */
.rs2-issues-hdr {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 6px; padding: 0 4px;
}
.rs2-issues-title { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); letter-spacing: 0.1em; }
.rs2-issues-count { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); }

/* ── Result v2: fix now panel ────────────────────────── */
.rs2-fix-panel {
  display: flex; flex-direction: column; gap: 14px;
  padding: 16px; border-radius: 12px; margin-bottom: 20px;
  background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05);
}
.rs2-fix-panel-head { display: flex; align-items: center; justify-content: space-between; }
.rs2-fix-panel-label {
  display: flex; align-items: center; gap: 6px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 800;
  letter-spacing: 0.08em; color: #ec3586;
}
.rs2-fix-panel-sub { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.25); }

.rs2-fix-cards { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 6px; }
.rs2-fix-cards::-webkit-scrollbar { height: 6px; }
.rs2-fix-cards::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

.rs2-fix-card {
  display: flex; flex-direction: column; width: 220px; flex-shrink: 0;
  border-radius: 10px; background: #0f0f14; border: 1px solid rgba(255,255,255,0.06);
  padding: 14px; position: relative; overflow: hidden; transition: transform 0.2s, border-color 0.2s;
}
.rs2-fix-card:hover { transform: translateY(-2px); border-color: var(--tc); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
.rs2-fix-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--tc); opacity: 0.8; }
.rs2-fix-card-badge { align-self: flex-end; font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; margin-bottom: 8px; }
.rs2-fix-card-badge--crit { background: rgba(255,71,87,0.1); color: #ff4757; }
.rs2-fix-card-badge--warn { background: rgba(255,170,0,0.1); color: #ffaa00; }

.rs2-fix-card-body { display: flex; flex-direction: column; gap: 8px; flex: 1; margin-bottom: 16px; }
.rs2-fix-card-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; }
.rs2-fix-card-title { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.9); }
.rs2-fix-card-desc { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }

.rs2-fix-card-cta { font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; color: var(--tc); text-transform: uppercase; background: none; border: none; cursor: pointer; text-align: left; padding: 0; transition: filter 0.2s; }
.rs2-fix-card-cta:hover { filter: brightness(1.2); }

/* ── Result v2: filter row ───────────────────────────── */
.rs2-filter-row { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; margin-top: 20px; }
.rs2-filter-label { font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: rgba(255,255,255,0.25); }
.rs2-filter-bar { display: flex; gap: 6px; flex-wrap: wrap; }
.rs2-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.12s;
}
.rs2-chip:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); }
.rs2-chip--active { background: rgba(236,53,134,0.12); border-color: rgba(236,53,134,0.3); color: #ec3586; }
.rs2-chip-count { font-size: 10px; background: rgba(255,255,255,0.07); border-radius: 4px; padding: 1px 5px; }
.rs2-chip--active .rs2-chip-count { background: rgba(236,53,134,0.15); }

/* ── Result v2: severity groups ──────────────────────── */
.rs2-groups { display: flex; flex-direction: column; gap: 12px; }
.rs2-sev-group { border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.01); }
.rs2-sev-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px; width: 100%; border: none; background: transparent;
  cursor: pointer; transition: background 0.12s;
}
.rs2-sev-head:hover { background: rgba(255,255,255,0.02); }

.rs2-sev-label { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.05em; color: rgba(255,255,255,0.8); }
.rs2-sev-head--critical .rs2-sev-label { color: #ff4757; }
.rs2-sev-cnt { font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 800; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
.rs2-sev-cnt--critical { background: rgba(255,71,87,0.15); color: #ff4757; }
.rs2-sev-cnt--warning { background: rgba(255,170,0,0.15); color: #ffaa00; }
.rs2-sev-cnt--pass { background: rgba(0,212,170,0.15); color: #00d4aa; }
.rs2-sev-sub { font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(255,255,255,0.3); flex: 1; text-align: left; }
.rs2-sev-chevron { flex-shrink: 0; color: rgba(255,255,255,0.3); transition: transform 0.2s; }
.rs2-sev-chevron.open { transform: rotate(180deg); color: rgba(255,255,255,0.6); }

.rs2-issue-list { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 8px; }
.rs2-issue {
  padding: 14px 16px; border-radius: 8px; border: 1px solid transparent; transition: background 0.15s, border-color 0.15s;
}
.rs2-issue:hover { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); }

.rs2-issue-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.rs2-issue-bullet { font-size: 16px; line-height: 1; }
.rs2-issue-bullet--critical { color: #ff4757; }
.rs2-issue-bullet--warning { color: #ffaa00; font-size: 12px; }
.rs2-issue-bullet--pass { color: #00d4aa; font-size: 12px; }

.rs2-issue-title { font-family: 'Space Grotesk', sans-serif; font-size: 13.5px; font-weight: 700; color: rgba(255,255,255,0.85); }
.rs2-issue--pass .rs2-issue-title { color: rgba(255,255,255,0.5); }
.rs2-sev-badge { font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 800; letter-spacing: 0.1em; padding: 2px 5px; border-radius: 4px; }
.rs2-sev-badge--critical { background: #ff4757; color: #fff; }
.rs2-sev-badge--warning { background: #ffaa00; color: #000; }
.rs2-issue-pillar { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.1em; margin-left: auto; color: rgba(255,255,255,0.3); }

.rs2-issue-desc { font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: rgba(255,255,255,0.45); line-height: 1.5; margin: 0 0 10px 18px; }

.rs2-how-toggle {
  display: inline-flex; align-items: center; gap: 6px; margin-left: 18px;
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: rgba(255,255,255,0.3);
  background: none; border: none; cursor: pointer; padding: 4px 6px; border-radius: 4px; transition: background 0.15s, color 0.15s;
}
.rs2-how-toggle:hover { color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.05); }
.rs2-how-chevron { transition: transform 0.2s; }
.rs2-how-chevron.open { transform: rotate(180deg); }

.rs2-fix-expand {
  margin: 12px 0 0 18px; display: flex; flex-direction: column; gap: 12px;
  background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 16px;
}
.rs2-snippet { background: #07070a; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden; }
.rs2-pre { font-family: 'Fira Mono','Cascadia Code',monospace; font-size: 11px; line-height: 1.6; color: rgba(255,255,255,0.65); padding: 12px; margin: 0; overflow-x: auto; white-space: pre; }
.rs2-open-tool {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 8px;
  font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700;
  color: #ec3586; background: rgba(236,53,134,0.08); border: 1px solid rgba(236,53,134,0.25);
  border-radius: 6px; padding: 8px 14px; cursor: pointer; transition: background 0.12s;
}
.rs2-open-tool:hover { background: rgba(236,53,134,0.15); }

/* ── Result v2: all-pass state ───────────────────────── */
.rs2-all-pass {
  display: flex; align-items: center; gap: 10px;
  padding: 20px; border-radius: 10px;
  background: rgba(0,212,170,0.05); border: 1px solid rgba(0,212,170,0.15);
  font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600;
  color: #00d4aa;
}
</style>
