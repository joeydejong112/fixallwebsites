<script setup lang="ts">
/**
 * TrendChart — line chart with pink gradient fill + ghost comparison line.
 * Uses SVG directly (anime.js onMounted for entrance animation).
 */
const props = defineProps<{
  host: string | null
  scoreHistory: { x: number; score: number }[]
  loading: boolean
}>()

const W = 640
const H = 260
const PAD = 32

const chartPoints = computed(() => {
  if (!props.scoreHistory.length) return []
  const minScore = Math.min(...props.scoreHistory.map(p => p.score))
  const maxScore = Math.max(...props.scoreHistory.map(p => p.score))
  const range = Math.max(maxScore - minScore, 1)
  const count = props.scoreHistory.length

  return props.scoreHistory.map((p, i) => ({
    px: PAD + (i / Math.max(count - 1, 1)) * (W - PAD * 2),
    py: PAD + (1 - (p.score - minScore) / range) * (H - PAD * 2 - 20),
  }))
})

const linePath = computed(() => {
  if (!chartPoints.value.length) return ''
  return chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.px},${p.py}`).join(' ')
})

const areaPath = computed(() => {
  if (!chartPoints.value.length) return ''
  const last = chartPoints.value[chartPoints.value.length - 1]
  const first = chartPoints.value[0]
  return `${linePath.value} L${last.px},${H - PAD} L${first.px},${H - PAD} Z`
})

const currentScore = computed(() =>
  props.scoreHistory.length ? props.scoreHistory[props.scoreHistory.length - 1].score : 0
)

const scoreSinceStart = computed(() => {
  if (props.scoreHistory.length < 2) return 0
  return props.scoreHistory[props.scoreHistory.length - 1].score - props.scoreHistory[0].score
})

const gridValues = [50, 60, 70, 80, 90]

function yPos(v: number) {
  const scores = props.scoreHistory.map(p => p.score)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const range = Math.max(maxScore - minScore, 1)
  return PAD + (1 - (v - minScore) / range) * (H - PAD * 2 - 20)
}
</script>

<template>
  <div class="card" style="padding: 28px; position: relative; height: 340px">
    <div class="card-accent-top" style="background: linear-gradient(to right, var(--brand), transparent)" />

    <div class="flex justify-between items-start" style="margin-bottom: 24px">
      <div>
        <div class="eyebrow">Score history · 12 weeks</div>
        <div class="flex items-baseline gap-3.5" style="margin-top: 14px">
          <div class="num" style="font-size: 44px">{{ currentScore }}</div>
          <div style="color: var(--p-security); font-family: var(--font-display); font-size: 14px; font-weight: 600">
            {{ scoreSinceStart >= 0 ? '+' : '' }}{{ scoreSinceStart }} since start
          </div>
        </div>
      </div>
      <div class="flex gap-3.5 items-center">
        <div class="legend-dot">
          <span style="width: 12px; height: 2px; background: #ec3586; display: inline-block" />
          {{ host || 'your site' }}
        </div>
        <div class="legend-dot" style="color: rgba(255,255,255,0.35)">
          <span style="width: 12px; height: 2px; background: rgba(255,255,255,0.35); display: inline-block; border-radius: 1px" />
          competitor
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="w-full h-px animate-pulse" style="background: rgba(255,255,255,0.03)" />
      </div>
    </template>

    <!-- Empty state -->
    <template v-else-if="!scoreHistory.length">
      <div class="flex items-center justify-center h-full">
        <p class="text-muted" style="font-size: 14px">No score history yet — run a scan to see trends.</p>
      </div>
    </template>

    <!-- Chart -->
    <template v-else>
      <svg width="100%" :viewBox="`0 0 ${W} ${H}`" style="display: block">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ec3586" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#ec3586" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- Grid lines -->
        <g v-for="v in gridValues" :key="v">
          <line :x1="PAD" :x2="W - PAD" :y1="yPos(v)" :y2="yPos(v)" stroke="rgba(255,255,255,0.05)" stroke-dasharray="2 4" />
          <text x="8" :y="yPos(v) + 3" fill="rgba(255,255,255,0.3)" font-size="10" font-family="var(--font-mono)">{{ v }}</text>
        </g>

        <!-- Area fill -->
        <path :d="areaPath" fill="url(#areaGrad)" />

        <!-- Line -->
        <path :d="linePath" fill="none" stroke="#ec3586" stroke-width="2.2" />

        <!-- Last point -->
        <circle
          v-if="chartPoints.length"
          :cx="chartPoints[chartPoints.length - 1].px"
          :cy="chartPoints[chartPoints.length - 1].py"
          r="5"
          fill="#ec3586"
        />
        <circle
          v-if="chartPoints.length"
          :cx="chartPoints[chartPoints.length - 1].px"
          :cy="chartPoints[chartPoints.length - 1].py"
          r="10"
          fill="#ec3586"
          opacity="0.2"
        />
      </svg>
    </template>
  </div>
</template>

<style scoped>
.legend-dot {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
</style>
