<script setup lang="ts">
const props = withDefaults(defineProps<{
  score: number
  size?: number
  stroke?: number
  color?: string
  label?: string
  delta?: string | null
}>(), {
  size: 220,
  stroke: 14,
  color: '#ec3586',
  label: 'Overall',
  delta: null,
})

const r = computed(() => (props.size - props.stroke) / 2)
const circ = computed(() => 2 * Math.PI * r.value)
const animated = ref(0)

onMounted(() => setTimeout(() => { animated.value = props.score }, 120))

const offset = computed(() => circ.value - (animated.value / 100) * circ.value)
const gradId = computed(() => `grad-${props.label.replace(/\s+/g, '-').toLowerCase()}`)
</script>

<template>
  <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" style="transform: rotate(-90deg)">
      <defs>
        <linearGradient :id="gradId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="1" />
          <stop offset="100%" :stop-color="color" stop-opacity="0.55" />
        </linearGradient>
      </defs>
      <circle
        :cx="size / 2" :cy="size / 2" :r="r"
        stroke="rgba(255,255,255,0.06)" :stroke-width="stroke" fill="none"
      />
      <circle
        :cx="size / 2" :cy="size / 2" :r="r"
        :stroke="`url(#${gradId})`"
        :stroke-width="stroke" fill="none"
        stroke-linecap="round"
        :stroke-dasharray="circ"
        :stroke-dashoffset="offset"
        style="transition: stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <div
        class="font-display font-bold tabular-nums tracking-[-0.05em]"
        :style="{ fontSize: `${size * 0.36}px`, lineHeight: 1 }"
      >
        {{ Math.round(animated) }}
      </div>
      <div class="mt-2 font-display text-[10px] tracking-[0.22em] uppercase" style="color: rgba(255,255,255,0.45)">
        {{ label }}
      </div>
      <div
        v-if="delta"
        class="mt-1 font-display font-semibold text-xs"
        :class="delta.startsWith('+') ? 'text-[var(--s-pass)]' : 'text-[var(--s-crit)]'"
      >
        {{ delta }} since last scan
      </div>
    </div>
  </div>
</template>