<script setup lang="ts">
defineProps<{ size?: number; stroke?: number }>()
</script>

<template>
  <svg
    :width="size ?? 14"
    :height="size ?? 14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke ?? 2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
</template>