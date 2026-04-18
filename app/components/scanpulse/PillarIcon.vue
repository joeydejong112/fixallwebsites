<script setup lang="ts">
defineProps<{ name: string; size?: number; color?: string; stroke?: number }>()
</script>

<template>
  <svg
    :width="size ?? 18"
    :height="size ?? 18"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color ?? 'currentColor'"
    :stroke-width="stroke ?? 1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <template v-if="name === 'shield'">
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </template>
    <template v-else-if="name === 'zap'">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </template>
    <template v-else-if="name === 'a11y'">
      <circle cx="12" cy="5" r="2" />
      <path d="M5 9h14M12 9v6M9 21l3-6 3 6" />
    </template>
    <template v-else-if="name === 'spark'">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </template>
    <template v-else-if="name === 'globe'">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
    </template>
    <template v-else-if="name === 'heart'">
      <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="9" />
    </template>
  </svg>
</template>