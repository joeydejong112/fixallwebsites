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
    <div class="flex items-center gap-3">
      <input
        v-model="historySearch"
        class="bg-[#0f0f14] border border-[#1e1e28] rounded-lg px-3 py-[7px] text-[13px] w-[260px] outline-none font-['DM_Sans'] transition-colors duration-150 placeholder:text-[#6b7280] focus:border-primary/40 text-[#e8e8f0]"
        placeholder="Search URLs…"
      />
      <div class="flex gap-[2px] bg-white/3 border border-white/5 p-[3px] rounded-lg">
        <button
          v-for="f in ['all','pass','warning','critical']"
          :key="f"
          @click="filterStatus = f as any"
          class="px-3 py-[5px] rounded-md text-[11px] font-semibold font-['Space_Grotesk'] uppercase tracking-[0.08em] bg-none border-none text-white/40 cursor-pointer transition-all duration-100 hover:bg-white/6"
          :class="{ 'bg-primary text-white': filterStatus === f }"
        >{{ f }}</button>
      </div>
      <span class="text-[12px] text-[#6b7280] ml-auto">{{ filteredHistoryScans.length }} scan{{ filteredHistoryScans.length !== 1 ? 's' : '' }}</span>
    </div>

    <div class="rounded-card bg-[#1e1e28]" style="padding:0;overflow:hidden;">
      <div v-if="!filteredHistoryScans.length" class="flex flex-col items-center justify-center" style="padding:40px 0;">
        <Logo :animate="false" class="w-8 h-8 opacity-[0.15]" />
        <p>{{ scans.length ? 'No scans match the filter.' : 'No scans yet. Enter a URL above.' }}</p>
        <button v-if="scans.length" @click="filterStatus = 'all'; historySearch = ''" class="text-[12px] text-primary bg-none border-none cursor-pointer mt-1">Clear filters</button>
      </div>
      <button
        v-else
        v-for="scan in filteredHistoryScans"
        :key="scan._id"
        @click="emit('open-scan', scan)"
        class="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] cursor-pointer w-full bg-none border-l-0 border-r-0 text-left text-inherit font-inherit last:border-b-0 hover:bg-white/[0.025]"
      >
        <div
          class="w-[7px] h-[7px] rounded-full flex-shrink-0"
          :class="{
            'bg-white/20': scan.status === 'pending',
            'bg-[#ffaa00]': scan.status === 'running',
            'bg-[#00d4aa]': scan.status === 'done',
            'bg-primary': scan.status === 'error',
          }"
        ></div>
        <div class="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-[#9898b0] bg-white/[0.06] font-['Space_Grotesk']">
          <img v-if="faviconUrl(scan.url)" :src="faviconUrl(scan.url)!" class="w-4 h-4 rounded" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
          <span v-else>{{ hostname(scan.url).charAt(0).toUpperCase() }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[13px] text-[#e8e8f0] whitespace-nowrap overflow-hidden text-ellipsis font-['DM_Sans']">{{ scan.url }}</div>
          <div class="text-[11px] text-[#6b7280] mt-[1px]">{{ statusLabel(scan.status) }} · {{ relativeTime(scan._creationTime) }}</div>
        </div>
        <div v-if="scan.status === 'done'" class="flex items-end gap-[3px] h-7">
          <div v-for="[c, v] in [['#00d4aa', scan.securityScore],['#ffaa00', scan.performanceScore],['#6c5ce7', scan.seoScore]]" :key="String(c)" class="w-[6px] flex items-end">
            <div class="w-[6px] rounded-[2px] transition-all duration-300 min-h-[1px]" :style="{ height: (Number(v) || 0) * 0.28 + 'px', background: String(c) }"></div>
          </div>
        </div>
        <div class="font-['Space_Grotesk'] font-bold text-[20px] flex-shrink-0 w-10 text-right" :style="{ color: scan.status === 'done' ? scoreBg(scan.overallScore) : 'rgba(255,255,255,0.2)' }">
          {{ scan.status === 'done' ? (scan.overallScore ?? '—') : scan.status === 'running' ? '…' : '—' }}
        </div>
        <div class="flex gap-[2px] items-center flex-shrink-0" @click.stop>
          <button @click="emit('rescan', scan.url, $event)" class="w-7 h-7 rounded-md flex items-center justify-center bg-none border-none text-white/30 cursor-pointer transition-all duration-150 hover:bg-white/6 hover:text-white/70" title="Re-scan">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h5M20 20v-5h-5"/><path d="M4.93 19.07A10 10 0 0 0 20 12M19.07 4.93A10 10 0 0 0 4 12"/></svg>
          </button>
          <button @click="emit('toggle-monitor', scan.url, $event)" class="w-7 h-7 rounded-md flex items-center justify-center bg-none border-none text-white/30 cursor-pointer transition-all duration-150 hover:bg-white/6 hover:text-white/70" :class="{ 'text-primary': isMonitored(scan.url) }" title="Toggle monitor">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button @click="emit('delete-scan', scan._id, $event)" class="w-7 h-7 rounded-md flex items-center justify-center bg-none border-none text-white/30 cursor-pointer transition-all duration-150 hover:bg-primary/10 hover:text-primary" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
@apply flex items-center gap-3;
@apply bg-[#0f0f14] border border-[#1e1e28] rounded-lg px-3 py-[7px] text-[13px] w-[260px] outline-none transition-colors duration-150;
@apply bg-[#1e1e28];
@apply flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] w-full bg-none border-l-0 border-r-0 text-left text-inherit font-inherit last:border-b-0 hover:bg-white/[0.025];
@apply w-[7px] h-[7px] rounded-full flex-shrink-0;
@apply w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-[#9898b0] bg-white/[0.06] font-['Space_Grotesk'];
@apply flex-1 min-w-0;
@apply flex items-end gap-[3px] h-7;
@apply w-[6px] rounded-[2px] transition-all duration-300 min-h-[1px];
@apply font-['Space_Grotesk'] font-bold text-[20px] flex-shrink-0 w-10 text-right;
@apply flex gap-[2px] items-center flex-shrink-0;
@apply w-7 h-7 rounded-md flex items-center justify-center bg-none border-none text-white/30 cursor-pointer transition-all duration-150 hover:bg-white/6 hover:text-white/70;
@apply w-7 h-7 rounded-md flex items-center justify-center bg-none border-none text-white/30 cursor-pointer transition-all duration-150 hover:bg-white/6 hover:text-white/70 text-primary;
@apply w-7 h-7 rounded-md flex items-center justify-center bg-none border-none text-white/30 cursor-pointer transition-all duration-150 hover:bg-primary/10 hover:text-primary;
@apply text-[12px] text-primary bg-none border-none cursor-pointer mt-1;
</style>
