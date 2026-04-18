<script setup lang="ts">
defineProps<{ status: 'pass' | 'warn' | 'crit' }>()

const map = {
  pass:  { c: '#00d4aa', t: 'Pass' },
  warn:  { c: '#ffaa00', t: 'Warning' },
  crit:  { c: '#ff4757', t: 'Critical' },
} as const
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-display font-semibold text-[11px] tracking-wide uppercase border"
    :style="{
      borderColor: `${map[status].c}40`,
      background: `${map[status].c}14`,
      color: map[status].c,
    }"
  >
    <span class="w-1.5 h-1.5 rounded-full" :style="{ background: map[status].c }" />
    {{ map[status].t }}
  </span>
</template>