<script setup lang="ts">
defineProps<{ status: 'pass' | 'warn' | 'crit'; size?: number }>()
</script>

<template>
  <svg
    :width="size ?? 18"
    :height="size ?? 18"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="status === 'pass' ? '#00d4aa' : status === 'warn' ? '#ffaa00' : '#ff4757'"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <template v-if="status === 'pass'">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </template>
    <template v-else-if="status === 'warn'">
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18v.01" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 8l8 8M16 8l-8 8" />
    </template>
  </svg>
</template>