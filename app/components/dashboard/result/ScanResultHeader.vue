<script setup lang="ts">
const props = defineProps<{
  scan: any
  isMonitored: (url: string) => boolean
}>()

const emit = defineEmits<{
  (e: 'rescan'): void
  (e: 'delete'): void
  (e: 'share'): void
  (e: 'toggle-monitor'): void
}>()

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
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Mini score ring -->
    <div class="relative w-11 h-11 flex-shrink-0 flex items-center justify-center">
      <svg width="44" height="44" viewBox="0 0 44 44" style="transform:rotate(-90deg)">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#1e1e28" stroke-width="4"/>
        <circle v-if="scan.overallScore" cx="22" cy="22" r="18" fill="none"
          :stroke="scoreBg(scan.overallScore)" stroke-width="4" stroke-linecap="round"
          :stroke-dasharray="`${(scan.overallScore/100)*113} 113`"/>
      </svg>
      <span class="absolute font-display text-xs font-extrabold leading-none" :style="{ color: scoreBg(scan.overallScore) }">{{ scan.overallScore ?? '—' }}</span>
    </div>

    <!-- URL + meta -->
    <div class="flex-1 min-w-0 flex flex-col gap-1">
      <div class="font-display text-[13px] font-bold text-white/88 whitespace-nowrap overflow-hidden text-ellipsis">{{ scan.url }}</div>
      <div class="flex items-center gap-[7px] flex-wrap">
        <span class="font-body text-[11px] text-white/30">{{ relativeTime(scan._creationTime) }}</span>
        <span class="font-display text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded text-security bg-security/10 border border-security/20">● COMPLETE</span>
        <span v-if="isMonitored(scan.url)" class="font-display text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded text-primary bg-primary/8 border border-primary/20">● MONITORED</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-row gap-1.5 flex-shrink-0 flex-wrap justify-end">
      <button @click="emit('rescan')" class="inline-flex items-center gap-[5px] font-display text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/55 cursor-pointer transition-all duration-150 hover:bg-white/10 hover:text-white/85 hover:border-white/20 whitespace-nowrap">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        Re-scan
      </button>
      <button @click="emit('toggle-monitor')" class="inline-flex items-center gap-[5px] font-display text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/55 cursor-pointer transition-all duration-150 hover:bg-white/10 hover:text-white/85 hover:border-white/20 whitespace-nowrap" :class="{ '!text-primary !border-primary/30 !bg-primary/8': isMonitored(scan.url) }">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        {{ isMonitored(scan.url) ? 'Stop monitoring' : 'Monitor' }}
      </button>
      <button @click="emit('share')" class="inline-flex items-center gap-[5px] font-display text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/55 cursor-pointer transition-all duration-150 hover:bg-white/10 hover:text-white/85 hover:border-white/20 whitespace-nowrap">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
        Share
      </button>
      <button @click="emit('delete')" class="inline-flex items-center gap-[5px] font-display text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 cursor-pointer transition-all duration-150 hover:bg-white/10 hover:!text-red-500 hover:border-red-500/20 whitespace-nowrap">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  scan: any
  isMonitored: (url: string) => boolean
}>()

const emit = defineEmits<{
  (e: 'rescan'): void
  (e: 'delete'): void
  (e: 'share'): void
  (e: 'toggle-monitor'): void
}>()

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
</script>
