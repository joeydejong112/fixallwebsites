<script setup lang="ts">
defineProps<{ score: number }>()

const color = computed(() =>
  props.score >= 85 ? '#00d4aa' : props.score >= 65 ? '#ffaa00' : '#ff4757'
)
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded font-display font-bold text-[13px] border font-variant-numeric tabular-nums"
    :style="{
      background: `${color}14`,
      color,
      borderColor: `${color}30`,
    }"
  >
    {{ score }}
  </span>
</template>