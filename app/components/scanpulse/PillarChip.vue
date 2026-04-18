<script setup lang="ts">
import { useScanpulseData } from '~/composables/useScanpulseData'

const props = defineProps<{ pillar: string; compact?: boolean }>()

const { PILLARS } = useScanpulseData()
const meta = computed(() => PILLARS.find(p => p.key === props.pillar))
</script>

<template>
  <span
    v-if="meta"
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-display font-semibold text-[11px] tracking-wide uppercase border"
    :style="{
      borderColor: `${meta.color}33`,
      background: `${meta.color}12`,
      color: meta.color,
    }"
  >
    <span class="w-1.5 h-1.5 rounded-full" :style="{ background: meta.color }" />
    {{ compact ? meta.label.split(' ')[0] : meta.label }}
  </span>
</template>