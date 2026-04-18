<script setup lang="ts">
/**
 * RecentScansTable — 6-row table: host, score, sparkline, delta, when.
 */
import type { Recent } from '~/types/scanpulse'

const props = defineProps<{
  scans: Recent[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'openScan', host: string): void
}>()

function deltaClass(delta: string) {
  if (!delta) return ''
  return delta.startsWith('+') ? 'delta-up' : 'delta-down'
}
</script>

<template>
  <div class="card" style="padding: 0; overflow: hidden">
    <div class="table-header" style="padding: 20px 28px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border)">
      <div class="eyebrow">Recent scans</div>
      <div class="flex gap-2">
        <button class="btn btn-ghost" style="height: 32px; font-size: 12px; padding: 0 12px">Filter</button>
        <button class="btn btn-ghost" style="height: 32px; font-size: 12px; padding: 0 12px">Export CSV</button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div>
        <div v-for="i in 6" :key="i" class="table-row shimmer" style="display: grid; grid-template-columns: 2.4fr 0.8fr 1.8fr 1fr 0.7fr; padding: 16px 28px; align-items: center; border-bottom: 1px solid var(--border)">
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-full bg-white/5 animate-pulse" />
            <div class="h-4 w-28 bg-white/5 animate-pulse rounded" />
          </div>
          <div class="h-5 w-10 bg-white/5 animate-pulse rounded" />
          <div class="h-5 bg-white/5 animate-pulse rounded" />
          <div class="h-4 w-16 bg-white/5 animate-pulse rounded" />
          <div />
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <template v-else-if="!scans.length">
      <div style="padding: 48px; text-align: center">
        <p class="text-muted" style="font-size: 14px">No scans yet — run your first scan to see results here.</p>
      </div>
    </template>

    <!-- Table rows -->
    <template v-else>
      <!-- Column header -->
      <div class="col-header" style="display: grid; grid-template-columns: 2.4fr 0.8fr 1.8fr 1fr 0.7fr; padding: 12px 28px; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-faint); font-family: var(--font-display); font-weight: 600; border-bottom: 1px solid var(--border)">
        <div>Site</div>
        <div>Score</div>
        <div>Pillars</div>
        <div>When</div>
        <div />
      </div>

      <!-- Data rows -->
      <div>
        <div
          v-for="(r, i) in scans.slice(0, 6)"
          :key="r.host"
          class="scan-row"
          style="display: grid; grid-template-columns: 2.4fr 0.8fr 1.8fr 1fr 0.7fr; padding: 16px 28px; align-items: center; border-bottom: i < scans.slice(0, 6).length - 1 ? '1px solid var(--border)' : 'none'; cursor: pointer"
          @click="emit('openScan', r.host)"
        >
          <div class="flex items-center gap-3">
            <Favicon :host="r.host" :size="28" />
            <div>
              <div class="font-mono" style="font-size: 14px; color: #fff">{{ r.host }}</div>
              <div style="font-size: 11px; color: var(--text-faint); margin-top: 2px">
                <span :class="deltaClass(r.delta)">{{ r.delta.startsWith('+') ? '▲ ' + r.delta.slice(1) : '▼ ' + r.delta.slice(1) }}</span>
                since last scan
              </div>
            </div>
          </div>

          <div><ScoreChip :score="r.overall" /></div>

          <div><PillarSparkline :values="r.pillars" /></div>

          <div class="font-mono" style="font-size: 12px; color: var(--text-muted)">{{ r.when }}</div>

          <div style="text-align: right; color: var(--text-muted)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.col-header {
  display: grid;
  padding: 12px 28px;
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-family: var(--font-display);
  font-weight: 600;
  border-bottom: 1px solid var(--border);
}
.scan-row {
  display: grid;
  padding: 16px 28px;
  align-items: center;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s;
}
.scan-row:hover {
  background: rgba(255, 255, 255, 0.015);
}
.delta-up {
  color: var(--s-pass);
}
.delta-down {
  color: var(--s-crit);
}
</style>
