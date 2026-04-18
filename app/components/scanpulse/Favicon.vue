<script setup lang="ts">
const props = defineProps<{ host: string; size?: number; bg?: string | null }>()

const COLORS = ['#ec3586', '#00d4aa', '#ffaa00', '#6c5ce7', '#74b9ff', '#fd79a8', '#ff7675']

const initial = computed(() => props.host.replace(/^www\./, '')[0]?.toUpperCase() ?? '?')
const color = computed(() => {
  if (props.bg) return props.bg
  const h = props.host.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COLORS[h % COLORS.length]
})
const size = computed(() => props.size ?? 24)
const radius = computed(() => Math.round(size.value * 0.22))
</script>

<template>
  <div
    class="flex items-center justify-center font-display font-bold text-white flex-shrink-0"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: `${radius}px`,
      background: color,
      fontSize: `${size * 0.5}px`,
      letterSpacing: '-0.04em',
    }"
  >
    {{ initial }}
  </div>
</template>