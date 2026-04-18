<script setup lang="ts">
import type { Tool, Pillar } from '~/composables/useScanpulseData'

const props = defineProps<{
  tool: Tool
  pillar: Pillar
  featured?: boolean
}>()

const hover = ref(false)

// Map tool id to route slug
const routeSlug = computed(() => {
  const idMap: Record<string, string> = {
    csp: 'csp-builder',
    headers: 'security-headers',
    cors: 'cors-inspector',
    imgopt: 'image-optimizer',
    meta: 'meta-generator',
    schema: 'schema-generator',
    robots: 'robots-txt',
    favicon: 'favicon-generator',
    contrast: 'contrast-checker',
    email: 'email-auth',
    llms: 'ai-optimizer',
  }
  return idMap[props.tool.id] ?? props.tool.id
})

const fixesLabel = computed(() =>
  props.tool.fixes === 0 ? 'WCAG accessibility' : `Fixes ${props.tool.fixes} issue${props.tool.fixes === 1 ? '' : 's'}`
)
</script>

<template>
  <NuxtLink
    :to="`/tools/${routeSlug}`"
    class="tool-card"
    :class="{ 'tool-card--featured': featured }"
    :style="`--pc: ${pillar.color}`"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <!-- Pillar accent top -->
    <div class="accent-top" :style="`background: ${pillar.color}`" />

    <!-- Background glow on hover -->
    <div v-if="hover" class="card-glow" :style="`background: radial-gradient(ellipse at 50% 0%, ${pillar.color}18 0%, transparent 65%)`" />

    <!-- Icon ring -->
    <div class="icon-ring" :style="`color:${pillar.color}; background:${pillar.color}15; border-color:${pillar.color}30`">
      <PillarIcon :name="pillar.icon" :size="featured ? 22 : 16" :stroke="1.8" />
    </div>

    <!-- Pillar label + kind -->
    <div class="meta">
      <span class="pillar-label" :style="`color: ${pillar.color}`">{{ pillar.label }}</span>
      <span class="kind">{{ tool.kind }}</span>
    </div>

    <!-- Title -->
    <h3 class="card-title">{{ tool.name }}</h3>

    <!-- Description -->
    <p class="card-desc">{{ tool.blurb }}</p>

    <!-- Footer -->
    <div class="card-footer">
      <span class="fixes-badge" :style="`color:${pillar.color}; background:${pillar.color}14; border-color:${pillar.color}28`">
        {{ fixesLabel }}
      </span>
      <span class="open-cta" :style="hover ? `color:${pillar.color}` : ''">
        Open <Arrow :size="12" />
      </span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.tool-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px 20px 18px;
  border-radius: 14px;
  background: var(--elevated);
  border: 1px solid var(--border);
  text-decoration: none;
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  animation: card-in 0.3s ease both;
}

.tool-card:hover {
  border-color: color-mix(in srgb, var(--pc) 40%, transparent);
  transform: translateY(-2px) scale(1.005);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--pc);
}

.tool-card--featured {
  padding: 28px 28px 24px;
  min-height: 220px;
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.accent-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  opacity: 0.6;
  transition: height 0.2s ease, opacity 0.2s ease;
}

.tool-card:hover .accent-top {
  height: 3px;
  opacity: 1;
}

.card-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.icon-ring {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tool-card--featured .icon-ring {
  width: 52px;
  height: 52px;
  border-radius: 13px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.pillar-label {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.kind {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-faint);
}

.card-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.88);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.2;
  position: relative;
  z-index: 1;
  transition: color 0.15s;
}

.tool-card--featured .card-title {
  font-size: 22px;
}

.tool-card:hover .card-title {
  color: white;
}

.card-desc {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.55;
  margin: 0;
  flex: 1;
  position: relative;
  z-index: 1;
}

.tool-card--featured .card-desc {
  font-size: 14px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 4px;
  position: relative;
  z-index: 1;
}

.fixes-badge {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid;
}

.tool-card--featured .fixes-badge {
  font-size: 11px;
  padding: 5px 12px;
}

.open-cta {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s ease;
}
</style>
