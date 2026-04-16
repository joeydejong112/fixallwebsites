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
  <div class="rs2-header">
    <!-- Mini score ring -->
    <div class="rs2-mini-ring">
      <svg width="44" height="44" viewBox="0 0 44 44" style="transform:rotate(-90deg)">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#1e1e28" stroke-width="4"/>
        <circle v-if="scan.overallScore" cx="22" cy="22" r="18" fill="none"
          :stroke="scoreBg(scan.overallScore)" stroke-width="4" stroke-linecap="round"
          :stroke-dasharray="`${(scan.overallScore/100)*113} 113`"/>
      </svg>
      <span class="rs2-mini-score" :style="{ color: scoreBg(scan.overallScore) }">{{ scan.overallScore ?? '—' }}</span>
    </div>

    <!-- URL + meta -->
    <div class="rs2-header-meta">
      <div class="rs2-url">{{ scan.url }}</div>
      <div class="rs2-meta-row">
        <span class="rs2-time">{{ relativeTime(scan._creationTime) }}</span>
        <span class="rs2-pill-done">● COMPLETE</span>
        <span v-if="isMonitored(scan.url)" class="rs2-pill-monitored">● MONITORED</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="rs2-header-actions">
      <button @click="emit('rescan')" class="rs2-act-btn">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        Re-scan
      </button>
      <button @click="emit('toggle-monitor')" class="rs2-act-btn" :class="{ 'rs2-act-btn--danger-active': isMonitored(scan.url) }">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        {{ isMonitored(scan.url) ? 'Stop monitoring' : 'Monitor' }}
      </button>
      <button @click="emit('share')" class="rs2-act-btn">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
        Share
      </button>
      <button @click="emit('delete')" class="rs2-act-btn rs2-act-btn--danger">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
        Delete
      </button>
    </div>
  </div>
</template>

<style scoped>
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
</style>
