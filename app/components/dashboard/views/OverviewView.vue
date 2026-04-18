<script setup lang="ts">
import { useScoreFormat, useScoreTrend } from '~/composables/dashboard/useScoreFormat'

interface Scan {
  _id: string
  _creationTime: number
  url: string
  status: string
  overallScore?: number
  securityScore?: number
  performanceScore?: number
  seoScore?: number
  accessibilityScore?: number
  aiScore?: number
  dnsScore?: number
  trustScore?: number
}

interface Monitor {
  _id: string
  url: string
  lastScore?: number
  lastRunTime?: number
  frequency: string
}

const props = defineProps<{
  scans: Scan[]
  doneScans: Scan[]
  monitors: Monitor[]
  bulkScans: { length: number }[]
  avgScore: number | null
  bestScore: number | null
  openScanByUrl: (url: string) => void
  toggleMonitor: (url: string) => void
}>()

const emit = defineEmits<{
  (e: 'set-view', v: string): void
  (e: 'open-scan', scan: Scan): void
}>()

const { scoreBg, hostname, relativeTime, faviconUrl, scoreColor, trendColor } = useScoreFormat()
const doneScansRef = computed(() => props.doneScans)
const { scoreTrend } = useScoreTrend(doneScansRef)

const latestScan = computed(() => props.doneScans[0])

const monitorTrends = computed(() => {
  const map = new Map<string, number>()
  for (const m of props.monitors) {
    map.set(m.url, scoreTrend(m.url))
  }
  return map
})

// Design token colors for pillar scores
const PILLAR_COLORS = {
  security: '#00d4aa',
  performance: '#ffaa00',
  seo: '#6c5ce7',
  accessibility: '#a29bfe',
  ai: '#ff7675',
  dns: '#74b9ff',
  trust: '#fd79a8',
} as const

const pillarRows = computed(() => [
  ['Security',      latestScan.value?.securityScore,      PILLAR_COLORS.security],
  ['Performance',   latestScan.value?.performanceScore,  PILLAR_COLORS.performance],
  ['SEO',           latestScan.value?.seoScore,           PILLAR_COLORS.seo],
  ['Accessibility', latestScan.value?.accessibilityScore, PILLAR_COLORS.accessibility],
  ['AI Readiness',  latestScan.value?.aiScore,            PILLAR_COLORS.ai],
  ['DNS & Email',   latestScan.value?.dnsScore,           PILLAR_COLORS.dns],
  ['Trust',         latestScan.value?.trustScore,         PILLAR_COLORS.trust],
] as const)

const lowScoreCount = computed(() =>
  props.doneScans.filter(s => (s.overallScore ?? 100) < 60).length +
  props.scans.filter(s => s.status === 'error').length
)
</script>

<template>
  <div>
    <div class="grid grid-cols-4 gap-3.5">
      <div class="ds-stat-card">
        <div class="ds-stat-label">Total Scans</div>
        <div class="ds-stat-value text-primary">{{ scans.length }}</div>
        <div class="ds-stat-delta">Across all sites</div>
      </div>
      <div class="ds-stat-card">
        <div class="ds-stat-label">Avg Score</div>
        <div class="ds-stat-value" :style="{ color: avgScore !== null ? scoreBg(avgScore) : 'rgba(255,255,255,0.2)' }">{{ avgScore ?? '—' }}</div>
        <div class="ds-stat-delta">{{ doneScans.length }} completed</div>
      </div>
      <div class="ds-stat-card">
        <div class="ds-stat-label">Low Score Sites</div>
        <div class="ds-stat-value text-danger">{{ lowScoreCount }}</div>
        <div class="ds-stat-delta text-danger/60">Score below 60</div>
      </div>
      <div class="ds-stat-card">
        <div class="ds-stat-label">Monitored Sites</div>
        <div class="ds-stat-value text-performance">{{ monitors.length }}</div>
        <div class="ds-stat-delta"><button class="ds-stat-link" @click="emit('set-view', 'bulk')">{{ bulkScans.length }} bulk scan{{ bulkScans.length !== 1 ? 's' : '' }}</button></div>
      </div>
    </div>

    <div class="ds-mid-grid">
      <div class="ds-card">
        <div class="ds-card-header">
          <div class="ds-card-title">Pillar Scores</div>
          <button v-if="latestScan" @click="emit('open-scan', latestScan)" class="ds-card-action">{{ hostname(latestScan.url) }} →</button>
          <span v-else class="ds-card-sub">Most recent scan</span>
        </div>
        <div v-if="!doneScans.length" class="ds-empty-state">
          <Logo :animate="false" class="ds-empty-logo" />
          <p>Scan a site to see pillar scores</p>
        </div>
        <div v-else class="ds-pillars-grid">
          <div v-for="[name, val, color] in pillarRows" :key="String(name)" class="ds-pillar-row">
            <div class="ds-pillar-dot" :style="{ background: String(color) }"></div>
            <div class="ds-pillar-name">{{ name }}</div>
            <div class="ds-pillar-bar-bg"><div class="ds-pillar-bar" :style="{ width: (Number(val) || 0) + '%', background: String(color) }"></div></div>
            <div class="ds-pillar-score" :style="{ color: val != null ? String(color) : 'rgba(255,255,255,0.2)' }">{{ val ?? '—' }}</div>
          </div>
        </div>
      </div>

      <div class="ds-card">
        <div class="ds-card-header">
          <div class="ds-card-title">Recent Scans</div>
          <button @click="emit('set-view', 'history')" class="ds-card-action">See all →</button>
        </div>
        <div v-if="!scans.length" class="ds-empty-state"><p>No scans yet</p></div>
        <template v-else>
          <button v-for="scan in scans.slice(0, 6)" :key="scan._id" @click="emit('open-scan', scan)" class="ds-scan-item">
            <div class="ds-scan-fav">
              <img v-if="faviconUrl(scan.url)" :src="faviconUrl(scan.url)!" class="w-7 h-7 rounded-[7px]" loading="lazy" width="28" height="28" @error="($event.target as HTMLImageElement).style.display='none'" />
              <span v-else>{{ hostname(scan.url).charAt(0).toUpperCase() }}</span>
            </div>
            <div class="ds-scan-info">
              <div class="ds-scan-domain">{{ hostname(scan.url) }}</div>
              <div class="ds-scan-time">{{ relativeTime(scan._creationTime) }}</div>
            </div>
            <div class="ds-scan-right">
              <span v-if="scan.status === 'running'" class="ds-scan-running">●</span>
              <span v-else-if="scan.status === 'error'" class="ds-scan-score text-danger text-base">!</span>
              <span v-else class="ds-scan-score" :style="{ color: scoreBg(scan.overallScore) }">{{ scan.overallScore ?? '—' }}</span>
            </div>
          </button>
        </template>
      </div>
    </div>

    <div class="ds-bottom-grid">
      <div class="ds-card">
        <div class="ds-card-header">
          <div class="ds-card-title">Monitored Sites</div>
          <button @click="emit('set-view', 'bulk')" class="ds-card-action">Bulk scan →</button>
        </div>
        <div v-if="!monitors.length" class="ds-empty-state">
          <p>No sites monitored</p>
          <p class="ds-empty-hint">Scan a site and use Watch to monitor it daily.</p>
        </div>
        <div v-else>
          <div v-for="m in monitors" :key="m._id" class="ds-monitor-row">
            <div class="ds-monitor-dot" :style="{ background: scoreBg(m.lastScore) }"></div>
            <div class="ds-monitor-info">
              <div class="ds-monitor-domain">{{ hostname(m.url) }}</div>
              <div class="ds-monitor-meta">{{ m.lastRunTime ? 'Checked ' + relativeTime(m.lastRunTime) : 'Not yet checked' }} · {{ m.frequency }}</div>
            </div>
            <div class="ds-monitor-score" :style="{ color: scoreBg(m.lastScore) }">
              {{ m.lastScore ?? '—' }}
              <template v-if="monitorTrends.get(m.url)"><span :style="{ color: trendColor(monitorTrends.get(m.url)) }">{{ monitorTrends.get(m.url) }}</span></template>
            </div>
            <div class="ds-monitor-actions">
              <button @click="openScanByUrl(m.url)" class="ds-monitor-link">View →</button>
              <button @click="toggleMonitor(m.url)" class="ds-monitor-stop">Stop</button>
            </div>
          </div>
        </div>
      </div>

      <div class="ds-card">
        <div class="ds-card-header">
          <div class="ds-card-title">Activity Feed</div>
          <span class="ds-card-sub" :class="scans.some(s => s.status === 'running') ? 'text-primary' : 'text-muted'">{{ scans.some(s => s.status === 'running') ? '● Live' : 'Recent' }}</span>
        </div>
        <div v-if="!scans.length" class="ds-empty-state"><p>No activity yet</p></div>
        <div v-else class="ds-activity-list">
          <button v-for="scan in scans.slice(0, 8)" :key="scan._id" @click="emit('open-scan', scan)" class="ds-activity-item">
            <div class="ds-activity-dot" :style="{ background: scan.status === 'done' ? scoreBg(scan.overallScore) : scan.status === 'running' ? '#ec3586' : scan.status === 'error' ? '#ff4757' : 'rgba(255,255,255,0.15)' }"></div>
            <div class="ds-activity-text">
              <span class="ds-activity-domain">{{ hostname(scan.url) }}</span>
              <span v-if="scan.status === 'done'">complete — score {{ scan.overallScore ?? '?' }}</span>
              <span v-else-if="scan.status === 'running'">scanning…</span>
              <span v-else-if="scan.status === 'error'">failed</span>
              <span v-else>queued</span>
            </div>
            <div class="ds-activity-time">{{ relativeTime(scan._creationTime) }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Stats row */
.ds-stats-row { @apply grid grid-cols-4 gap-3.5; }

/* Stat card chains (3+) */
.ds-stat-card { @apply bg-[#0f0f14] border border-[#1e1e28] rounded-xl p-4; }
.ds-stat-label { @apply text-[10px] text-[#6b7280] uppercase tracking-[.06em] mb-2 font-display; }
.ds-stat-value { @apply font-display text-[28px] font-bold leading-none; }
.ds-stat-value.text-primary { color: #ec3586; }
.ds-stat-value.text-danger { color: #ff4757; }
.ds-stat-value.text-performance { color: #ffaa00; }
.ds-stat-delta.text-danger\/60 { color: rgba(255,71,87,0.6); }
.ds-scan-score.text-danger.text-base { color: #ff4757; font-size: 1rem; }
.ds-stat-delta { @apply text-[11px] text-[#6b7280] mt-1.5; }
.ds-stat-link { @apply text-primary bg-none border-none cursor-pointer text-[11px] p-0 hover:opacity-80; }

/* Grids */
.ds-mid-grid { @apply grid grid-cols-[1fr_300px] gap-[18px]; }
.ds-bottom-grid { @apply grid grid-cols-2 gap-[18px]; }

/* Card chains (3+) */
.ds-card { @apply rounded-card border border-[#1e1e28]; }
.ds-card-header { @apply flex justify-between items-center mb-3; }
.ds-card-title { @apply text-[13px] font-semibold text-white/70; }
.ds-card-action { @apply text-[12px] text-[#9898b0] bg-none border-none cursor-pointer transition-colors duration-100 hover:text-white; }
.ds-card-sub.text-primary { color: #ec3586; }
.ds-card-sub.text-muted { color: #6b7280; }
.ds-card-sub { @apply text-[12px] text-white/30; }

/* Empty state chain (3+) */
.ds-empty-state { @apply flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center gap-1.5; }
.ds-empty-logo { @apply w-8 h-8 opacity-[0.15]; }
.ds-empty-hint { @apply text-[12px] text-white/20; }

/* Pillar chains (3+) */
.ds-pillars-grid { @apply flex flex-col gap-[10px]; }
.ds-pillar-row { @apply flex items-center gap-[10px]; }
.ds-pillar-dot { @apply w-[7px] h-[7px] rounded-full flex-shrink-0; }
.ds-pillar-name { @apply text-[12px] text-[#9898b0] w-[90px] flex-shrink-0; }
.ds-pillar-bar-bg { @apply flex-1 h-[5px] bg-[#1e1e28] rounded-[3px] overflow-hidden; }
.ds-pillar-bar { @apply h-full rounded-[3px] transition-all duration-500 min-w-[2px]; }
.ds-pillar-score { @apply text-[12px] font-semibold w-7 text-right font-display flex-shrink-0; }

/* Scan item chain (3+) */
.ds-scan-item { @apply flex items-center gap-[10px] py-[9px] border-b border-[#1e1e28] bg-none border-none w-full text-left cursor-pointer hover:opacity-75; }
.ds-scan-fav { @apply w-7 h-7 bg-[#16161e] rounded-[7px] flex items-center justify-center text-[11px] text-[#9898b0] flex-shrink-0 overflow-hidden; }
.ds-scan-info { @apply flex-1 min-w-0; }
.ds-scan-domain { @apply text-[13px] font-medium text-[#e8e8f0] whitespace-nowrap overflow-hidden text-ellipsis; }
.ds-scan-time { @apply text-[11px] text-[#6b7280] mt-px; }
.ds-scan-right { @apply flex-shrink-0; }
.ds-scan-score { @apply font-display font-bold text-[18px]; }
.ds-scan-running { @apply text-primary animate-ping; }

/* Monitor row chain (3+) */
.ds-monitor-row { @apply flex items-center gap-[10px] py-[9px] border-b border-[#1e1e28]; }
.ds-monitor-dot { @apply w-[7px] h-[7px] rounded-full flex-shrink-0; }
.ds-monitor-info { @apply flex-1 min-w-0; }
.ds-monitor-domain { @apply text-[13px] font-medium text-[#e8e8f0] whitespace-nowrap overflow-hidden text-ellipsis; }
.ds-monitor-meta { @apply text-[11px] text-[#6b7280] mt-px; }
.ds-monitor-score { @apply font-display font-bold text-[18px] flex items-center gap-1; }
.ds-monitor-actions { @apply flex gap-2 items-center; }
.ds-monitor-link { @apply text-[12px] text-[#9898b0] bg-none border-none cursor-pointer transition-colors duration-100 hover:text-[#e8e8f0]; }
.ds-monitor-stop { @apply text-[11px] text-white/40 bg-none border-none cursor-pointer transition-colors duration-100 hover:text-[#ff4757]; }

/* Activity item chain (3+) */
.ds-activity-item { @apply flex items-center gap-[10px] py-2 border-b border-[#1e1e28] text-[12px] text-[#9898b0] bg-none border-none w-full text-left cursor-pointer hover:opacity-80; }
.ds-activity-dot { @apply w-[6px] h-[6px] rounded-full flex-shrink-0; }
.ds-activity-text { @apply flex-1; }
.ds-activity-domain { @apply text-[#e8e8f0] font-medium mr-1; }
.ds-activity-time { @apply text-[11px] text-[#6b7280] flex-shrink-0; }
</style>
