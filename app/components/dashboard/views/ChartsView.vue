<script setup lang="ts">
import { useScoreFormat } from '~/composables/dashboard/useScoreFormat'
import { useChartGeometry } from '~/composables/dashboard/useChartGeometry'

interface Props {
  scans: any[]
  doneScans: any[]
  monitors: any[]
  avgScore: number | null
  urlSparklines: Map<string, number[]>
  topSites: { url: string; count: number; latestScore: number | null }[]
  urlCharts: { url: string; points: { score: number; time: number }[]; latest: { score: number } }[]
  openScanByUrl?: (url: string) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'open-chart-detail', url: string): void
}>()

const { scoreBg, scoreColor, hostname, faviconUrl } = useScoreFormat()
const { chartSvgPoints, chartAreaPath, chartDotX, chartDotY, shortDate } = useChartGeometry()

// Local aggregations (moved from dashboard page script setup)
const scansPerDay = computed(() => {
  const days: { label: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const end = start + 86400000
    const count = props.scans.filter(s => s._creationTime >= start && s._creationTime < end).length
    days.push({ label, count })
  }
  return days
})

const avgPillarScores = computed(() => {
  const avg = (key: string) => {
    const vals = props.doneScans.map((s: any) => s[key]).filter((v: any) => v != null)
    return vals.length ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0
  }
  return [
    { name: 'Security',      score: avg('securityScore'),      color: '#00d4aa' },
    { name: 'Performance',   score: avg('performanceScore'),   color: '#ffaa00' },
    { name: 'SEO',           score: avg('seoScore'),           color: '#6c5ce7' },
    { name: 'Accessibility', score: avg('accessibilityScore'), color: '#a29bfe' },
    { name: 'AI Readiness',  score: avg('aiScore'),            color: '#ff7675' },
    { name: 'DNS & Email',   score: avg('dnsScore'),           color: '#74b9ff' },
    { name: 'Trust',         score: avg('trustScore'),         color: '#fd79a8' },
  ]
})

const scoreDistribution = computed(() => {
  const critical = props.doneScans.filter(s => (s.overallScore ?? 0) < 60).length
  const warning  = props.doneScans.filter(s => { const sc = s.overallScore ?? 0; return sc >= 60 && sc < 80 }).length
  const good     = props.doneScans.filter(s => (s.overallScore ?? 0) >= 80).length
  const total    = props.doneScans.length || 1
  return [
    { label: 'Good (80+)',      count: good,     pct: Math.round(good     / total * 100), color: '#00d4aa' },
    { label: 'Warning (60–79)', count: warning,  pct: Math.round(warning  / total * 100), color: '#ffaa00' },
    { label: 'Critical (<60)', count: critical,  pct: Math.round(critical / total * 100), color: '#ff4757' },
  ]
})

// Proxy openChartDetail through emit to parent's view instance
function openChartDetail(url: string) {
  emit('open-chart-detail', url)
}
</script>

<template>
  <div>
    <!-- Stats strip -->
    <div class="grid grid-cols-4 gap-3.5">
      <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
        <div class="text-[10px] text-[#6b7280] uppercase tracking-[.06em] mb-2 font-display">Total Scans</div>
        <div class="font-display text-[28px] font-bold leading-none text-primary">{{ scans.length }}</div>
        <div class="text-[11px] text-[#6b7280] mt-1.5">All time</div>
      </div>
      <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
        <div class="text-[10px] text-[#6b7280] uppercase tracking-[.06em] mb-2 font-display">Completed</div>
        <div class="font-display text-[28px] font-bold leading-none text-security">{{ doneScans.length }}</div>
        <div class="text-[11px] text-[#6b7280] mt-1.5">{{ scans.filter(s=>s.status==='error').length }} failed</div>
      </div>
      <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
        <div class="text-[10px] text-[#6b7280] uppercase tracking-[.06em] mb-2 font-display">Avg Score</div>
        <div class="font-display text-[28px] font-bold leading-none" :style="{ color: avgScore != null ? scoreBg(avgScore) : 'rgba(255,255,255,0.2)' }">{{ avgScore ?? '—' }}</div>
        <div class="text-[11px] text-[#6b7280] mt-1.5">Across all done scans</div>
      </div>
      <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4">
        <div class="text-[10px] text-[#6b7280] uppercase tracking-[.06em] mb-2 font-display">Unique Sites</div>
        <div class="font-display text-[28px] font-bold leading-none text-[#6c5ce7]">{{ new Set(doneScans.map(s=>s.url)).size }}</div>
        <div class="text-[11px] text-[#6b7280] mt-1.5">{{ monitors.length }} monitored</div>
      </div>
    </div>

    <div class="grid grid-cols-[1fr_300px] gap-[18px] mt-[18px]">
      <!-- Scans per day bar chart -->
      <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-card p-[18px]">
        <div class="flex justify-between items-center mb-4">
          <div class="font-display text-[13px] font-semibold text-white/70">Scans per Day (last 14 days)</div>
        </div>
        <div v-if="!scans.length" class="flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center gap-1.5"><p>No scans yet</p></div>
        <div v-else class="pt-2">
          <div class="flex items-end gap-1 h-[120px]">
            <div v-for="(day, i) in scansPerDay" :key="i" class="flex-1 flex flex-col items-center gap-[3px] h-full">
              <div class="text-[9px] text-[#6b7280] h-3.5 flex items-center font-display">{{ day.count || '' }}</div>
              <div class="flex-1 w-full flex items-end">
                <div class="w-full rounded-t-sm min-h-[2px] transition-all duration-300" :style="{ height: Math.max(day.count / Math.max(...scansPerDay.map(d=>d.count), 1) * 100, day.count ? 8 : 0) + '%', background: day.count ? '#ec3586' : '#1e1e28' }"></div>
              </div>
              <div class="text-[9px] text-[#6b7280] whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-center">{{ i % 2 === 0 ? day.label.split(' ')[1] : '' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Score distribution donut-style -->
      <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-card p-[18px]">
        <div class="flex justify-between items-center mb-4">
          <div class="font-display text-[13px] font-semibold text-white/70">Score Distribution</div>
        </div>
        <div v-if="!doneScans.length" class="flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center gap-1.5"><p>No completed scans</p></div>
        <div v-else class="flex flex-col gap-3.5 pt-1.5">
          <div v-for="bucket in scoreDistribution" :key="bucket.label" class="flex items-center gap-2.5">
            <div class="text-[12px] text-[#9898b0] w-[120px] flex-shrink-0">{{ bucket.label }}</div>
            <div class="flex-1 h-2 bg-[#1e1e28] rounded-[4px] overflow-hidden">
              <div class="h-full rounded-[4px] transition-all duration-300 min-w-[2px]" :style="{ width: bucket.pct + '%', background: bucket.color }"></div>
            </div>
            <div class="font-display font-bold text-[14px] w-6 text-right flex-shrink-0" :style="{ color: bucket.color }">{{ bucket.count }}</div>
            <div class="text-[11px] text-[#6b7280] w-8 text-right flex-shrink-0">{{ bucket.pct }}%</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-[1fr_300px] gap-[18px] mt-[18px]">
      <!-- Avg pillar scores -->
      <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-card p-[18px]">
        <div class="flex justify-between items-center mb-4">
          <div class="font-display text-[13px] font-semibold text-white/70">Average Score per Pillar</div>
        </div>
        <div v-if="!doneScans.length" class="flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center gap-1.5"><p>No completed scans</p></div>
        <div v-else class="flex flex-col gap-[10px]">
          <div v-for="p in avgPillarScores" :key="p.name" class="flex items-center gap-[10px]">
            <div class="w-[7px] h-[7px] rounded-full flex-shrink-0" :style="{ background: p.color }"></div>
            <div class="text-[12px] text-[#9898b0] w-[90px] flex-shrink-0">{{ p.name }}</div>
            <div class="flex-1 h-[5px] bg-[#1e1e28] rounded-[3px] overflow-hidden"><div class="h-full rounded-[3px] transition-all duration-500 min-w-[2px]" :style="{ width: (p.score || 0) + '%', background: p.color }"></div></div>
            <div class="text-[12px] font-semibold w-7 text-right font-display flex-shrink-0" :style="{ color: p.score ? p.color : 'rgba(255,255,255,0.2)' }">{{ p.score || '—' }}</div>
          </div>
        </div>
      </div>

      <!-- Top sites -->
      <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-card p-[18px]">
        <div class="flex justify-between items-center mb-4">
          <div class="font-display text-[13px] font-semibold text-white/70">Most Scanned Sites</div>
          <span class="text-[12px] text-white/30">{{ topSites.length }} sites</span>
        </div>
        <div v-if="!topSites.length" class="flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center gap-1.5"><p>No completed scans</p></div>
        <div v-else>
          <button v-for="site in topSites" :key="site.url" @click="props.openScanByUrl ? props.openScanByUrl(site.url) : undefined" class="flex items-center gap-[10px] py-2.5 border-b border-[#1e1e28] bg-none w-full text-left cursor-pointer transition-all duration-150 hover:opacity-75 last:border-b-0">
            <div class="w-7 h-7 bg-[#16161e] rounded-[7px] flex items-center justify-center text-[11px] text-[#9898b0] flex-shrink-0 overflow-hidden">
              <img v-if="faviconUrl(site.url)" :src="faviconUrl(site.url)!" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
              <span v-else>{{ hostname(site.url).charAt(0).toUpperCase() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[13px] font-medium text-[#e8e8f0] whitespace-nowrap overflow-hidden text-ellipsis">{{ hostname(site.url) }}</div>
              <div class="text-[11px] text-[#6b7280] mt-px">{{ site.count }} scan{{ site.count !== 1 ? 's' : '' }}</div>
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
    <div v-if="urlCharts.length" class="flex flex-col gap-4 mt-5">
      <div class="flex items-baseline gap-2.5">
        <span class="font-display text-[13px] font-bold text-white/75">Score History per Site</span>
        <span class="font-body text-[11px] text-white/28">{{ urlCharts.length }} site{{ urlCharts.length !== 1 ? 's' : '' }}</span>
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
        <div v-for="site in urlCharts" :key="site.url" class="bg-[#0f0f14] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-3.5 cursor-pointer transition-all duration-150 hover:border-white/[0.14] hover:bg-[#13131a]" @click="openChartDetail(site.url)">

          <!-- Card header -->
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 bg-[#16161e] rounded-[7px] flex items-center justify-center text-[11px] text-[#9898b0] flex-shrink-0 overflow-hidden">
              <img v-if="faviconUrl(site.url)" :src="faviconUrl(site.url)!" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
              <span v-else>{{ hostname(site.url).charAt(0).toUpperCase() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-display text-[13px] font-semibold text-white/80 whitespace-nowrap overflow-hidden text-ellipsis">{{ hostname(site.url) }}</div>
              <div class="font-body text-[11px] text-white/30 mt-px">{{ site.points.length }} scan{{ site.points.length !== 1 ? 's' : '' }}</div>
            </div>
            <div class="font-display text-[22px] font-bold leading-none flex-shrink-0" :style="{ color: scoreColor(site.latest.score) }">{{ site.latest.score }}</div>
          </div>

          <!-- SVG line chart -->
          <div class="rounded-lg overflow-hidden bg-[#0a0a10]">
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
          <div class="flex flex-col gap-1.5">
            <div v-if="site.latest.securityScore != null" class="flex items-center gap-2">
              <span class="font-display text-[10px] font-bold text-white/35 w-7 flex-shrink-0">Sec</span>
              <div class="flex-1 h-1 bg-white/[0.06] rounded-[2px] overflow-hidden"><div class="h-full rounded-[2px] transition-all duration-300" :style="{ width: site.latest.securityScore + '%', background: '#00d4aa' }"/></div>
              <span class="font-display text-[10px] font-bold w-5 text-right text-security">{{ site.latest.securityScore }}</span>
            </div>
            <div v-if="site.latest.performanceScore != null" class="flex items-center gap-2">
              <span class="font-display text-[10px] font-bold text-white/35 w-7 flex-shrink-0">Perf</span>
              <div class="flex-1 h-1 bg-white/[0.06] rounded-[2px] overflow-hidden"><div class="h-full rounded-[2px] transition-all duration-300" :style="{ width: site.latest.performanceScore + '%', background: '#ffaa00' }"/></div>
              <span class="font-display text-[10px] font-bold w-5 text-right text-[#ffaa00]">{{ site.latest.performanceScore }}</span>
            </div>
            <div v-if="site.latest.seoScore != null" class="flex items-center gap-2">
              <span class="font-display text-[10px] font-bold text-white/35 w-7 flex-shrink-0">SEO</span>
              <div class="flex-1 h-1 bg-white/[0.06] rounded-[2px] overflow-hidden"><div class="h-full rounded-[2px] transition-all duration-300" :style="{ width: site.latest.seoScore + '%', background: '#6c5ce7' }"/></div>
              <span class="font-display text-[10px] font-bold w-5 text-right text-[#6c5ce7]">{{ site.latest.seoScore }}</span>
            </div>
            <div v-if="site.latest.accessibilityScore != null" class="flex items-center gap-2">
              <span class="font-display text-[10px] font-bold text-white/35 w-7 flex-shrink-0">A11y</span>
              <div class="flex-1 h-1 bg-white/[0.06] rounded-[2px] overflow-hidden"><div class="h-full rounded-[2px] transition-all duration-300" :style="{ width: site.latest.accessibilityScore + '%', background: '#a29bfe' }"/></div>
              <span class="font-display text-[10px] font-bold w-5 text-right text-[#a29bfe]">{{ site.latest.accessibilityScore }}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>