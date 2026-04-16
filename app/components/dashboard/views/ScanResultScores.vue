<script setup lang="ts">
const props = defineProps<{
  scan: any
}>()
</script>

<template>
  <div class="rs2-score-strip">
    <div v-for="[name, val, color, bonus] in [
      ['Security',      scan.securityScore,      '#00d4aa', false],
      ['Performance',   scan.performanceScore,   '#ffaa00', false],
      ['SEO',           scan.seoScore,           '#6c5ce7', false],
      ['Accessibility', scan.accessibilityScore, '#a29bfe', false],
      ['AI Readiness',  scan.aiScore,            '#ff7675', false],
      ['DNS & Email',   scan.dnsScore,           '#74b9ff', true],
      ['Trust',         scan.trustScore,         '#fd79a8', true],
    ]" :key="String(name)" class="rs2-score-card" :style="`--pc:${color}`">
      <div class="rs2-score-card__label">
        {{ name }}
        <span v-if="bonus" class="rs2-score-card__bonus">BONUS</span>
      </div>
      <div class="rs2-score-card__num" :style="{ color: val != null ? String(color) : 'rgba(255,255,255,0.18)' }">{{ val ?? '—' }}</div>
      <div class="rs2-score-card__bar-bg">
        <div class="rs2-score-card__bar" :style="{ width: (Number(val)||0)+'%', background: String(color) }"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Score strip ─────────────────────────────────────── */
.rs2-score-strip {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
.rs2-score-card {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px; padding: 12px 14px 10px;
  display: flex; flex-direction: column; gap: 8px;
  position: relative; overflow: hidden;
}
.rs2-score-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--pc) 50%, transparent);
  opacity: 0.5;
}
.rs2-score-card__label {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.13em; text-transform: uppercase;
  color: color-mix(in srgb, var(--pc) 75%, white);
  display: flex; align-items: center; gap: 5px;
}
.rs2-score-card__bonus {
  font-size: 7px; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; padding: 1px 4px;
  letter-spacing: 0.1em;
}
.rs2-score-card__num {
  font-family: 'Space Grotesk', sans-serif; font-size: 30px; font-weight: 800;
  line-height: 1; letter-spacing: -0.04em;
}
.rs2-score-card__bar-bg { height: 3px; background: rgba(255,255,255,0.07); border-radius: 2px; overflow: hidden; }
.rs2-score-card__bar    { height: 100%; border-radius: 2px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); min-width: 2px; }
</style>
