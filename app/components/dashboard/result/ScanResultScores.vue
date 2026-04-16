<script setup lang="ts">
const props = defineProps<{
  scan: any
}>()
</script>

<template>
  <div class="grid grid-cols-7 gap-2">
    <div v-for="[name, val, color, bonus] in [
      ['Security',      scan.securityScore,      '#00d4aa', false],
      ['Performance',   scan.performanceScore,   '#ffaa00', false],
      ['SEO',           scan.seoScore,           '#6c5ce7', false],
      ['Accessibility', scan.accessibilityScore, '#a29bfe', false],
      ['AI Readiness',  scan.aiScore,            '#ff7675', false],
      ['DNS & Email',   scan.dnsScore,           '#74b9ff', true],
      ['Trust',         scan.trustScore,         '#fd79a8', true],
    ]" :key="String(name)" class="relative overflow-hidden rounded-[10px] border border-white/7 bg-[#0f0f14] flex flex-col gap-2 px-3.5 py-3 pt-[10px]" :style="`--pc:${color}`">
      <!-- Top gradient line via pseudo (use absolute inset-x bar) -->
      <div class="absolute top-0 left-0 right-0 h-0.5 opacity-50" :style="`background: linear-gradient(90deg, transparent, ${color} 50%, transparent)`" />
      <div class="flex items-center gap-[5px]">
        <span class="font-display text-[9px] font-bold tracking-widest uppercase" :style="`color: color-mix(in srgb, ${color} 75%, white)`">{{ name }}</span>
        <span v-if="bonus" class="text-[7px] text-white/30 bg-white/5 border border-white/10 rounded-[3px] px-1 py-0.5 tracking-wider">BONUS</span>
      </div>
      <div class="font-display text-[30px] font-extrabold leading-none tracking-tighter" :style="{ color: val != null ? String(color) : 'rgba(255,255,255,0.18)' }">{{ val ?? '—' }}</div>
      <div class="h-0.5 bg-white/7 rounded overflow-hidden">
        <div class="h-full rounded transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] min-w-0.5" :style="{ width: (Number(val)||0)+'%', background: String(color) }"/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  scan: any
}>()
</script>
