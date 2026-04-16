<script setup lang="ts">
defineProps<{
  scans: any[]
  doneScans: any[]
  monitors: any[]
  bulkScans: any[]
  avgScore: number | null
  bestScore: number | null
  openScanByUrl: (url: string) => void
  toggleMonitor: (url: string) => void
}>()

const emit = defineEmits<{
  (e: 'set-view', v: string): void
  (e: 'open-scan', scan: any): void
}>()
</script>

<template>
  <div>
    <div class="ds-stats-row">
      <div class="ds-stat-card">
        <div class="ds-stat-label">Total Scans</div>
        <div class="ds-stat-value" style="color:#ec3586">{{ scans.length }}</div>
        <div class="ds-stat-delta">Across all sites</div>
      </div>
      <div class="ds-stat-card">
        <div class="ds-stat-label">Avg Score</div>
        <div class="ds-stat-value" :style="{ color: avgScore != null ? scoreBg(avgScore) : 'rgba(255,255,255,0.2)' }">{{ avgScore ?? '—' }}</div>
        <div class="ds-stat-delta">{{ doneScans.length }} completed</div>
      </div>
      <div class="ds-stat-card">
        <div class="ds-stat-label">Low Score Sites</div>
        <div class="ds-stat-value" style="color:#ff4757">{{ doneScans.filter(s => (s.overallScore ?? 100) < 60).length + scans.filter(s => s.status === 'error').length }}</div>
        <div class="ds-stat-delta" style="color:rgba(255,71,87,0.6)">Score below 60</div>
      </div>
      <div class="ds-stat-card">
        <div class="ds-stat-label">Monitored Sites</div>
        <div class="ds-stat-value" style="color:#ffaa00">{{ monitors.length }}</div>
        <div class="ds-stat-delta"><button class="ds-stat-link" @click="emit('set-view', 'bulk')">{{ bulkScans.length }} bulk scan{{ bulkScans.length !== 1 ? 's' : '' }}</button></div>
      </div>
    </div>

    <div class="ds-mid-grid">
      <div class="ds-card">
        <div class="ds-card-header">
          <div class="ds-card-title">Pillar Scores</div>
          <button v-if="doneScans[0]" @click="emit('open-scan', doneScans[0])" class="ds-card-action">{{ hostname(doneScans[0].url) }} →</button>
          <span v-else class="ds-card-sub">Most recent scan</span>
        </div>
        <div v-if="!doneScans.length" class="ds-empty-state">
          <Logo :animate="false" class="ds-empty-logo" />
          <p>Scan a site to see pillar scores</p>
        </div>
        <div v-else class="ds-pillars-grid">
          <div v-for="[name, val, color] in [
            ['Security',      doneScans[0].securityScore,      '#00d4aa'],
            ['Performance',   doneScans[0].performanceScore,   '#ffaa00'],
            ['SEO',           doneScans[0].seoScore,           '#6c5ce7'],
            ['Accessibility', doneScans[0].accessibilityScore, '#a29bfe'],
            ['AI Readiness',  doneScans[0].aiScore,            '#ff7675'],
            ['DNS & Email',   doneScans[0].dnsScore,           '#74b9ff'],
            ['Trust',         doneScans[0].trustScore,         '#fd79a8'],
          ]" :key="String(name)" class="ds-pillar-row">
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
              <img v-if="faviconUrl(scan.url)" :src="faviconUrl(scan.url)!" class="w-4 h-4 rounded" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
              <span v-else>{{ hostname(scan.url).charAt(0).toUpperCase() }}</span>
            </div>
            <div class="ds-scan-info">
              <div class="ds-scan-domain">{{ hostname(scan.url) }}</div>
              <div class="ds-scan-time">{{ relativeTime(scan._creationTime) }}</div>
            </div>
            <div class="ds-scan-right">
              <span v-if="scan.status === 'running'" class="ds-scan-running">●</span>
              <span v-else-if="scan.status === 'error'" class="ds-scan-score" style="color:#ff4757;font-size:16px;">!</span>
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
              <span v-if="scoreTrend(m.url)" :style="{ color: trendColor(scoreTrend(m.url)) }">{{ scoreTrend(m.url) }}</span>
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
          <span class="ds-card-sub" :style="{ color: scans.some(s => s.status === 'running') ? '#ec3586' : '#6b7280' }">{{ scans.some(s => s.status === 'running') ? '● Live' : 'Recent' }}</span>
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

/* Empty states */
.ds-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 0; color: rgba(255,255,255,0.3); font-size: 13px; text-align: center; gap: 6px; }
.ds-empty-logo { width: 32px; height: 32px; opacity: 0.15; }
.ds-empty-hint { font-size: 12px; color: rgba(255,255,255,0.2); }
</style>
