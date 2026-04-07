<script setup lang="ts">
const props = withDefaults(defineProps<{
  data: number[]        // score values 0–100
  color?: string
  width?: number
  height?: number
  showDots?: boolean    // show regression dots (drops ≥ 10 pts)
  showTooltip?: boolean
}>(), {
  color: '#ec3586',
  width: 120,
  height: 36,
  showDots: true,
  showTooltip: true,
})

const PAD_X = 2
const PAD_Y = 3

const points = computed(() => {
  const d = props.data
  if (d.length < 2) return []
  const minV = Math.min(...d)
  const maxV = Math.max(...d)
  const range = maxV - minV || 1
  const w = props.width - PAD_X * 2
  const h = props.height - PAD_Y * 2
  return d.map((v, i) => ({
    x: PAD_X + (i / (d.length - 1)) * w,
    y: PAD_Y + h - ((v - minV) / range) * h,
    value: v,
  }))
})

const polyline = computed(() =>
  points.value.map(p => `${p.x},${p.y}`).join(' ')
)

// Dots on regressions ≥ 10 pts
const regressionDots = computed(() => {
  if (!props.showDots) return []
  return points.value.filter((p, i) => {
    if (i === 0) return false
    return props.data[i - 1] - p.value >= 10
  })
})

// Tooltip state
const tooltip = ref<{ x: number; y: number; value: number; index: number } | null>(null)

function onMouseMove(e: MouseEvent) {
  if (!props.showTooltip || points.value.length === 0) return
  const svg = (e.currentTarget as SVGElement).getBoundingClientRect()
  const mx = e.clientX - svg.left
  let closest = points.value[0]
  let minDist = Math.abs(mx - closest.x)
  for (const p of points.value) {
    const d = Math.abs(mx - p.x)
    if (d < minDist) { minDist = d; closest = p }
  }
  tooltip.value = { x: closest.x, y: closest.y, value: closest.value, index: points.value.indexOf(closest) }
}

function onMouseLeave() {
  tooltip.value = null
}

// Tooltip position: flip if too close to right edge
const tooltipX = computed(() => {
  if (!tooltip.value) return 0
  return tooltip.value.x > props.width - 40 ? tooltip.value.x - 36 : tooltip.value.x + 4
})
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    class="trend-chart"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- Area fill -->
    <defs>
      <linearGradient :id="`grad-${color.replace('#','')}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.25" />
        <stop offset="100%" :stop-color="color" stop-opacity="0.03" />
      </linearGradient>
    </defs>

    <template v-if="points.length >= 2">
      <!-- Fill polygon -->
      <polygon
        :points="`${points[0].x},${height - PAD_Y} ${polyline} ${points[points.length - 1].x},${height - PAD_Y}`"
        :fill="`url(#grad-${color.replace('#','')})`"
      />
      <!-- Line -->
      <polyline
        :points="polyline"
        fill="none"
        :stroke="color"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <!-- Regression dots -->
      <circle
        v-for="(dot, i) in regressionDots"
        :key="`reg-${i}`"
        :cx="dot.x"
        :cy="dot.y"
        r="2.5"
        fill="#ff4757"
        stroke="#07070a"
        stroke-width="1"
      />
      <!-- Hover dot -->
      <circle
        v-if="tooltip"
        :cx="tooltip.x"
        :cy="tooltip.y"
        r="3"
        :fill="color"
        stroke="#07070a"
        stroke-width="1.5"
      />
      <!-- Tooltip -->
      <g v-if="tooltip">
        <rect
          :x="tooltipX"
          :y="tooltip.y - 18"
          width="32"
          height="14"
          rx="3"
          fill="#1a1a24"
          stroke="#2a2a3a"
          stroke-width="0.5"
        />
        <text
          :x="tooltipX + 16"
          :y="tooltip.y - 8"
          text-anchor="middle"
          font-size="9"
          font-family="DM Sans, sans-serif"
          fill="#ffffff"
        >{{ tooltip.value }}</text>
      </g>
    </template>

    <!-- Flat line if only one data point -->
    <line
      v-else-if="points.length === 1"
      :x1="PAD_X"
      :y1="height / 2"
      :x2="width - PAD_X"
      :y2="height / 2"
      :stroke="color"
      stroke-width="1.5"
      stroke-dasharray="3,3"
    />
  </svg>
</template>

<style scoped>
.trend-chart {
  display: block;
  overflow: visible;
}
</style>
