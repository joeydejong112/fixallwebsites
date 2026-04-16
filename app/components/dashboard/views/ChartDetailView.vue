<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<{
  doneScans: any[]
  view: any
}>()

const view = props.view

const chartDetailScans = computed(() =>
  props.doneScans
    .filter((s: any) => s.url === view.selectedChartUrl.value)
    .sort((a: any, b: any) => a._creationTime - b._creationTime)
)

const chartDetailLatest = computed(() =>
  chartDetailScans.value[chartDetailScans.value.length - 1] ?? null
)

const chartDetailPillars = computed(() => {
  const latest = chartDetailLatest.value
  if (!latest) return []
  return [
    { key: 'security', label: 'Security', color: '#00d4aa', latest: latest.securityScore, scores: chartDetailScans.value.map((s: any) => s.securityScore).filter((v: any) => v != null) },
    { key: 'performance', label: 'Performance', color: '#ffaa00', latest: latest.performanceScore, scores: chartDetailScans.value.map((s: any) => s.performanceScore).filter((v: any) => v != null) },
    { key: 'seo', label: 'SEO', color: '#6c5ce7', latest: latest.seoScore, scores: chartDetailScans.value.map((s: any) => s.seoScore).filter((v: any) => v != null) },
    { key: 'accessibility', label: 'Accessibility', color: '#a29bfe', latest: latest.accessibilityScore, scores: chartDetailScans.value.map((s: any) => s.accessibilityScore).filter((v: any) => v != null) },
  ].filter((p) => p.latest != null)
})

const { scoreColor, hostname, faviconUrl, shortDate } = useScoreFormat()
const { cdX, cdY, cdPolyline, cdAreaPath, CD_W, CD_H, CD_PL, CD_PR, CD_GRID } = useChartGeometry()
</script>

<template>
  <div v-if="!chartDetailScans.length" class="text-center py-10 text-white/30 font-body text-sm"><p>No completed scans for this site.</p></div>
  <div v-else class="flex flex-col gap-5">

    <!-- Hero header -->
    <div class="flex items-center gap-4 flex-wrap">
      <div class="size-9 rounded-lg text-base bg-white/5 border border-white/10 flex items-center justify-center font-display text-sm font-bold text-white/65">
        <img v-if="faviconUrl(view.selectedChartUrl)" :src="faviconUrl(view.selectedChartUrl)!" loading="lazy" width="20" height="20" @error="($event.target as HTMLImageElement).style.display='none'" />
        <span v-else>{{ hostname(view.selectedChartUrl).charAt(0).toUpperCase() }}</span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-display text-base font-bold text-white/88">{{ hostname(view.selectedChartUrl) }}</div>
        <div class="font-body text-xs text-white/30 mt-0.5 truncate max-w-[300px]">{{ view.selectedChartUrl }}</div>
      </div>
      <div class="flex gap-5">
        <div class="text-center">
          <div class="font-display text-xl font-extrabold leading-none" :style="{ color: scoreColor(chartDetailLatest?.overallScore) }">{{ chartDetailLatest?.overallScore ?? '—' }}</div>
          <div class="font-body text-[10px] text-white/30 mt-0.5 whitespace-nowrap">Latest score</div>
        </div>
        <div class="text-center">
          <div class="font-display text-xl font-extrabold leading-none" style="color:rgba(255,255,255,0.7)">{{ chartDetailScans.length }}</div>
          <div class="font-body text-[10px] text-white/30 mt-0.5 whitespace-nowrap">Scans</div>
        </div>
        <div class="text-center" v-if="chartDetailScans.length >= 2">
          <div class="font-display text-xl font-extrabold leading-none" :style="{ color: chartDetailScans[chartDetailScans.length-1].overallScore >= chartDetailScans[0].overallScore ? '#00d4aa' : '#ff4757' }">
            {{ chartDetailScans[chartDetailScans.length-1].overallScore >= chartDetailScans[0].overallScore ? '↑' : '↓' }}{{ Math.abs(chartDetailScans[chartDetailScans.length-1].overallScore - chartDetailScans[0].overallScore) }}
          </div>
          <div class="font-body text-[10px] text-white/30 mt-0.5 whitespace-nowrap">Since first scan</div>
        </div>
      </div>
      <button class="bg-primary/12 border border-primary/30 rounded-lg px-4 py-2 font-display text-sm font-semibold text-primary cursor-pointer hover:bg-primary/18 transition-all duration-150 whitespace-nowrap" @click="view.openScanByUrl(view.selectedChartUrl)">View latest result →</button>
    </div>

    <!-- Large overall chart -->
    <div class="bg-white/5 border border-white/10 rounded-card p-4 flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <div class="font-display text-sm font-bold text-white/75">Overall Score Over Time</div>
        <span class="font-body text-xs text-white/28">{{ chartDetailScans.length }} data point{{ chartDetailScans.length !== 1 ? 's' : '' }}</span>
      </div>
      <div class="p-2 pt-1">
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
        <div v-for="p in chartDetailPillars" :key="p.key" class="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5">
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
              <div class="h-full rounded transition-all duration-400" :style="{ width: (p.latest ?? 0) + '%', background: p.color }"/>
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
    <div class="bg-white/5 border border-white/10 rounded-card p-4 flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <div class="font-display text-sm font-bold text-white/75">Scan Log</div>
        <span class="font-body text-xs text-white/28">{{ chartDetailScans.length }} scans — most recent first</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse font-body text-xs">
          <thead>
            <tr>
              <th class="text-left p-2.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/28 border-b border-white/6 whitespace-nowrap">Date</th>
              <th class="text-left p-2.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/28 border-b border-white/6 whitespace-nowrap">Overall</th>
              <th class="text-left p-2.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/28 border-b border-white/6 whitespace-nowrap">Security</th>
              <th class="text-left p-2.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/28 border-b border-white/6 whitespace-nowrap">Performance</th>
              <th class="text-left p-2.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/28 border-b border-white/6 whitespace-nowrap">SEO</th>
              <th class="text-left p-2.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/28 border-b border-white/6 whitespace-nowrap">A11y</th>
              <th class="text-left p-2.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/28 border-b border-white/6 whitespace-nowrap"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="scan in [...chartDetailScans].reverse()" :key="scan._id" class="border-b border-white/4 hover:bg-white/5 transition-colors duration-100">
              <td class="p-2.5 align-middle text-white/45 whitespace-nowrap">{{ shortDate(scan._creationTime) }}</td>
              <td class="p-2.5 align-middle"><span class="inline-block px-2 py-0.5 rounded font-display text-xs font-bold border border-solid border-white/30" :style="{ color: scoreColor(scan.overallScore), borderColor: scoreColor(scan.overallScore) + '30', background: scoreColor(scan.overallScore) + '12' }">{{ scan.overallScore ?? '—' }}</span></td>
              <td class="p-2.5 align-middle"><span v-if="scan.securityScore != null" class="font-display text-xs font-semibold" :style="{ color: scoreColor(scan.securityScore) }">{{ scan.securityScore }}</span><span v-else class="text-white/20">—</span></td>
              <td class="p-2.5 align-middle"><span v-if="scan.performanceScore != null" class="font-display text-xs font-semibold" :style="{ color: scoreColor(scan.performanceScore) }">{{ scan.performanceScore }}</span><span v-else class="text-white/20">—</span></td>
              <td class="p-2.5 align-middle"><span v-if="scan.seoScore != null" class="font-display text-xs font-semibold" :style="{ color: scoreColor(scan.seoScore) }">{{ scan.seoScore }}</span><span v-else class="text-white/20">—</span></td>
              <td class="p-2.5 align-middle"><span v-if="scan.accessibilityScore != null" class="font-display text-xs font-semibold" :style="{ color: scoreColor(scan.accessibilityScore) }">{{ scan.accessibilityScore }}</span><span v-else class="text-white/20">—</span></td>
              <td class="p-2.5 align-middle"><button class="bg-transparent border border-white/10 rounded-md px-2.5 py-1 font-body text-xs text-white/45 cursor-pointer hover:text-white/80 hover:border-white/25 transition-all duration-150 whitespace-nowrap" @click="view.openScan(scan)">View →</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

