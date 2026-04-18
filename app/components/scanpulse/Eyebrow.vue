<script setup lang="ts">
defineProps<{ label?: string; pillar?: string }>()
</script>

<template>
  <span
    class="eyebrow font-display text-[11px] tracking-[0.2em] uppercase font-semibold inline-flex items-center gap-3"
    :style="pillar ? `color: ${pillar}` : ''"
  >
    <span
      v-if="!$slots.default"
      class="inline-block w-7 h-0.5"
      :style="pillar ? `background: ${pillar}` : 'background: #ec3586'"
    />
    <slot />
    {{ label }}
  </span>
</template>