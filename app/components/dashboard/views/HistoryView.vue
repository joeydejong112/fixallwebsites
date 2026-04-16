<script setup lang="ts">
const props = defineProps<{
  scans: any[]
  isMonitored: (url: string) => boolean
}>()

const emit = defineEmits<{
  (e: 'open-scan', scan: any): void
  (e: 'delete-scan', scanId: string, ev: Event): void
  (e: 'rescan', url: string, ev: Event): void
  (e: 'toggle-monitor', url: string, ev: Event): void
}>()

const historySearch = ref('')
const filterStatus = ref<'all' | 'pass' | 'warning' | 'critical'>('all')

const hostname = (url: string) => {
  try { return new URL(url).hostname } catch { return url }
}

const statusLabel = (status: string) => {
  const m: Record<string, string> = { pending: 'Pending', running: 'Running', done: 'Done', error: 'Error' }
  return m[status] ?? status
}

const relativeTime = (ts: number) => {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

const scoreBg = (score: any) => {
  const s = Number(score) || 0
  if (s >= 80) return '#00d4aa'
  if (s >= 60) return '#ffaa00'
  return '#ec3586'
}

const filteredHistoryScans = computed(() => {
  const q = historySearch.value.toLowerCase()
  return props.scans.filter((s: any) => {
    if (!s.url.toLowerCase().includes(q)) return false
    if (filterStatus.value === 'all') return true
    const score = Number(s.overallScore) || 0
    if (filterStatus.value === 'pass') return s.status === 'done' && score >= 80
    if (filterStatus.value === 'warning') return s.status === 'done' && score >= 60 && score < 80
    if (filterStatus.value === 'critical') return s.status === 'error' || (s.status === 'done' && score < 60)
    return true
  })
})

const faviconUrl = (url: string) => {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32` } catch { return null }
}
</script>

<template>
  <div>
    <div class="ds-history-toolbar">
      <input v-model="historySearch" class="ds-history-search" placeholder="Search URLs…" />
      <div class="ds-filter-tabs">
        <button v-for="f in ['all','pass','warning','critical']" :key="f" @click="filterStatus = f as any" class="ds-filter-tab" :class="{ 'ds-filter-active': filterStatus === f }">{{ f }}</button>
      </div>
      <span class="ds-history-count">{{ filteredHistoryScans.length }} scan{{ filteredHistoryScans.length !== 1 ? 's' : '' }}</span>
    </div>

    <div class="ds-card" style="padding:0;overflow:hidden;">
      <div v-if="!filteredHistoryScans.length" class="ds-empty-state" style="padding:40px 0;">
        <Logo :animate="false" class="ds-empty-logo" />
        <p>{{ scans.length ? 'No scans match the filter.' : 'No scans yet. Enter a URL above.' }}</p>
        <button v-if="scans.length" @click="filterStatus = 'all'; historySearch = ''" class="ds-empty-btn">Clear filters</button>
      </div>
      <button v-else v-for="scan in filteredHistoryScans" :key="scan._id" @click="emit('open-scan', scan)" class="ds-history-row">
        <div class="ds-history-status-dot" :class="{
          'dot-pending': scan.status === 'pending',
          'dot-running': scan.status === 'running',
          'dot-done': scan.status === 'done',
          'dot-error': scan.status === 'error',
        }"></div>
        <div class="ds-scan-fav">
          <img v-if="faviconUrl(scan.url)" :src="faviconUrl(scan.url)!" class="w-4 h-4 rounded" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
          <span v-else>{{ hostname(scan.url).charAt(0).toUpperCase() }}</span>
        </div>
        <div class="ds-scan-info">
          <div class="ds-scan-domain">{{ scan.url }}</div>
          <div class="ds-scan-time">{{ statusLabel(scan.status) }} · {{ relativeTime(scan._creationTime) }}</div>
        </div>
        <div v-if="scan.status === 'done'" class="ds-history-pillars">
          <div v-for="[c, v] in [['#00d4aa', scan.securityScore],['#ffaa00', scan.performanceScore],['#6c5ce7', scan.seoScore]]" :key="String(c)" class="ds-mini-bar-wrap">
            <div class="ds-mini-bar" :style="{ height: (Number(v) || 0) * 0.28 + 'px', background: String(c) }"></div>
          </div>
        </div>
        <div class="ds-history-score" :style="{ color: scan.status === 'done' ? scoreBg(scan.overallScore) : 'rgba(255,255,255,0.2)' }">
          {{ scan.status === 'done' ? (scan.overallScore ?? '—') : scan.status === 'running' ? '…' : '—' }}
        </div>
        <div class="ds-history-actions" @click.stop>
          <button @click="emit('rescan', scan.url, $event)" class="ds-icon-btn" title="Re-scan">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h5M20 20v-5h-5"/><path d="M4.93 19.07A10 10 0 0 0 20 12M19.07 4.93A10 10 0 0 0 4 12"/></svg>
          </button>
          <button @click="emit('toggle-monitor', scan.url, $event)" class="ds-icon-btn" :class="{ 'ds-icon-btn--active': isMonitored(scan.url) }" title="Toggle monitor">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button @click="emit('delete-scan', scan._id, $event)" class="ds-icon-btn ds-icon-btn--danger" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ds-history-toolbar { display: flex; align-items: center; gap: 12px; }
.ds-history-search { background: #0f0f14; border: 1px solid #1e1e28; border-radius: 8px; padding: 7px 14px; color: #e8e8f0; font-size: 13px; width: 260px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s; }
.ds-history-search::placeholder { color: #6b7280; }
.ds-history-search:focus { border-color: rgba(236,53,134,0.4); }
.ds-filter-tabs { display: flex; gap: 2px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 3px; border-radius: 8px; }
.ds-filter-tab { padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 0.08em; background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.1s; }
.ds-filter-active { background: #ec3586; color: white; }
.ds-history-count { font-size: 12px; color: #6b7280; margin-left: auto; }

.ds-history-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  cursor: pointer;
  width: 100%;
  background: none;
  border-left: none;
  border-right: none;
  text-align: left;
  color: inherit;
  font-family: inherit;
}
.ds-history-row:last-child { border-bottom: none; }
.ds-history-row:hover { background: rgba(255,255,255,0.025); }

.ds-history-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dot-pending { background: rgba(255,255,255,0.2); }
.dot-running { background: #ffaa00; }
.dot-done { background: #00d4aa; }
.dot-error { background: #ec3586; }

.ds-scan-fav { width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; color: #9898b0; background: rgba(255,255,255,0.06); font-family: 'Space Grotesk', sans-serif; }

.ds-scan-info { flex: 1; min-width: 0; }
.ds-scan-domain { font-size: 13px; color: #e8e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'DM Sans', sans-serif; }
.ds-scan-time { font-size: 11px; color: #6b7280; margin-top: 1px; }

.ds-mini-bar-wrap { width: 6px; display: flex; align-items: flex-end; }
.ds-mini-bar { width: 6px; border-radius: 2px; transition: height 0.3s; min-height: 1px; }

.ds-history-pillars { display: flex; align-items: flex-end; gap: 3px; height: 28px; }
.ds-history-score { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 20px; flex-shrink: 0; width: 40px; text-align: right; }
.ds-history-actions { display: flex; gap: 2px; align-items: center; flex-shrink: 0; }

.ds-icon-btn { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; transition: all 0.15s; }
.ds-icon-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }
.ds-icon-btn--active { color: #ec3586; }
.ds-icon-btn--danger:hover { color: #ec3586; background: rgba(236,53,134,0.1); }

.ds-empty-logo { width: 32px; height: 32px; opacity: 0.15; }
.ds-empty-btn { font-size: 12px; color: #ec3586; background: none; border: none; cursor: pointer; padding: 0; margin-top: 4px; }
</style>
