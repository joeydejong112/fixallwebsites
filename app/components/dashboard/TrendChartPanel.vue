<script setup lang="ts">
/**
 * TrendChartPanel — wraps TrendChart + MonitorPanel in a 1.4fr/1fr grid.
 */
const props = defineProps<{
  /** URL for the trend chart's primary line */
  trendHost: string | null
  /** Score history points [{ x, score }, ...] */
  scoreHistory: { x: number; score: number }[]
  /** Monitored sites / events for the monitor panel */
  monitoredSites: any[]
  loading: boolean
}>()
</script>

<template>
  <div class="grid" style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px">
    <TrendChart :host="trendHost" :score-history="scoreHistory" :loading="loading" />
    <MonitorPanel :events="monitoredSites" :loading="loading" />
  </div>
</template>
