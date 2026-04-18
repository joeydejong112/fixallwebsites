<script setup lang="ts">
// RoadmapStrip — upcoming tools strip at the bottom of the tools index
const upcoming = [
  'AI Audit',
  'Lighthouse Reporter',
  'Privacy Checker',
]
</script>

<template>
  <div class="roadmap">
    <div class="roadmap-left">
      <div class="roadmap-eyebrow eyebrow">Shipping next</div>
      <div class="roadmap-title">
        {{ upcoming.slice(0, 2).join(' · ') }}
        <template v-if="upcoming.length > 2">
          · {{ upcoming[2] }}
        </template>
      </div>
    </div>
    <a class="roadmap-cta" href="#" @click.prevent>
      Vote on next tools <span>→</span>
    </a>
  </div>
</template>

<style scoped>
.roadmap {
  margin-top: 8px;
  padding: 22px 28px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed var(--border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.roadmap-eyebrow {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: 8px;
}

.roadmap-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: -0.01em;
}

.roadmap-cta {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  color: var(--brand);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.roadmap-cta:hover {
  opacity: 0.75;
}

.roadmap-cta span {
  transition: transform 0.15s;
  display: inline-block;
}

.roadmap-cta:hover span {
  transform: translateX(3px);
}
</style>
