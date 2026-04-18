<script setup lang="ts">
/**
 * MonitorPanel — live monitoring event feed for the last 24 hours.
 */
const props = defineProps<{
  events: any[]
  loading: boolean
}>()

const PILLAR_COLORS: Record<string, string> = {
  security: 'var(--p-security)',
  performance: 'var(--p-performance)',
  seo: 'var(--p-seo)',
  accessibility: 'var(--p-accessibility)',
  ai: 'var(--p-ai)',
  dns: 'var(--p-dns)',
  trust: 'var(--p-trust)',
}

function eventColor(e: any) {
  if (e.status === 'crit') return 'var(--s-crit)'
  if (e.status === 'warn') return 'var(--s-warn)'
  return PILLAR_COLORS[e.pillar] ?? 'var(--text-muted)'
}
</script>

<template>
  <div class="card" style="padding: 28px; position: relative; height: 340px; overflow: hidden">
    <div class="card-accent-top" style="background: linear-gradient(to right, #74b9ff, transparent)" />

    <div class="flex justify-between items-center" style="margin-bottom: 18px">
      <div>
        <div class="eyebrow">Monitoring</div>
        <div style="font-family: var(--font-display); font-size: 18px; font-weight: 600; margin-top: 12px">Last 24 hours</div>
      </div>
      <span class="chip" style="border-color: rgba(0, 212, 170, 0.3); background: rgba(0, 212, 170, 0.1); color: var(--p-security)">
        <span class="pulse-dot" style="background: var(--p-security); color: var(--p-security)" />
        Live
      </span>
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="flex flex-col gap-3">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3">
          <div class="h-3 w-10 bg-white/5 animate-pulse rounded" />
          <div class="h-4 flex-1 bg-white/5 animate-pulse rounded" />
          <div class="h-4 w-4 bg-white/5 animate-pulse rounded" />
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <template v-else-if="!events.length">
      <div class="flex items-center justify-center h-full">
        <p class="text-muted" style="font-size: 14px">No monitoring events in the last 24 hours.</p>
      </div>
    </template>

    <!-- Event feed -->
    <template v-else>
      <div class="flex flex-col">
        <div
          v-for="(e, i) in events.slice(0, 5)"
          :key="i"
          class="event-row"
          :style="{
            padding: '12px 0 12px 14px',
            borderLeft: `2px solid ${eventColor(e)}`,
            borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none',
            display: 'grid',
            gridTemplateColumns: '48px 1fr auto',
            gap: 12,
            alignItems: 'center',
          }"
        >
          <span class="font-mono" style="font-size: 11px; color: var(--text-faint)">{{ e.when }}</span>
          <div>
            <div style="font-size: 13px; color: #fff; margin-bottom: 2px">
              <span class="font-mono">{{ e.host }}</span>
              <span style="color: var(--text-muted)"> · {{ e.msg }}</span>
            </div>
          </div>
          <StatusIcon :status="e.status" :size="14" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.event-row {
  border-left: 2px solid;
}
</style>
