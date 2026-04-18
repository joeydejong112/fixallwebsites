<script setup lang="ts">
import { useScanpulseData } from '~/composables/useScanpulseData'

const props = defineProps<{ values: number[] }>()
const { PILLARS } = useScanpulseData()
</script>

<template>
  <div class="flex gap-0.75 items-end h-5">
    <div
      v-for="(v, i) in values"
      :key="i"
      class="w-1 rounded-sm"
      :style="{
        height: `${Math.max(15, v) * 0.22}px`,
        background: PILLARS[i]?.color ?? '#fff',
        opacity: 0.9,
      }"
    />
  </div>
</template>