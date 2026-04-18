<script setup lang="ts">
import { useScanpulseData } from '~/composables/useScanpulseData'

const { TOOLS, PILLARS } = useScanpulseData()

const active = ref('all')

const pillarCount = (key: string) =>
  key === 'all' ? TOOLS.length : TOOLS.filter(t => t.pillar.toLowerCase() === key.toLowerCase()).length

const filtered = computed(() =>
  active.value === 'all' ? TOOLS : TOOLS.filter(t => t.pillar.toLowerCase() === active.value.toLowerCase())
)

const featured = computed(() => filtered.value[0] ?? null)
const rest = computed(() => filtered.value.slice(1))

// Resolve pillar color + icon for a tool
const getPillar = (toolPillar: string): typeof PILLARS[0] | undefined =>
  PILLARS.find(p => p.key.toLowerCase() === toolPillar.toLowerCase())
</script>

<template>
  <div class="tools-grid-wrap">
    <!-- Filter tabs -->
    <div class="tabs-bar">
      <div class="tabs-inner">
        <button
          v-for="p in PILLARS"
          :key="p.key"
          class="tab"
          :class="{ 'tab--active': active === p.key }"
          :style="active === p.key ? `--tc:${p.color}` : ''"
          @click="active = p.key"
        >
          <span class="tdot" :style="`background:${p.color}`" />
          {{ p.label }}
          <span class="tcount">{{ pillarCount(p.key) }}</span>
        </button>
      </div>
    </div>

    <!-- Grid area -->
    <TransitionGroup name="fade" tag="div" class="grid-area">
      <!-- Featured card (first item) -->
      <ToolCard
        v-if="featured"
        :key="'feat-' + featured.id"
        :tool="featured"
        :pillar="getPillar(featured.pillar) ?? PILLARS[0]"
        :featured="true"
        class="feat-card"
      />

      <!-- Rest of the grid -->
      <div v-if="rest.length" key="rest-grid" class="rest-grid">
        <ToolCard
          v-for="(t, i) in rest"
          :key="t.id"
          :tool="t"
          :pillar="getPillar(t.pillar) ?? PILLARS[0]"
          :style="`--i: ${i}`"
          class="rest-card"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.tools-grid-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Tabs ─────────────────────────────────────────────────── */
.tabs-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 1;
}

.tabs-inner {
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 0 2px;
}

.tabs-inner::-webkit-scrollbar { display: none; }

.tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  padding: 14px 16px;
  color: rgba(255, 255, 255, 0.28);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.tab:hover { color: rgba(255, 255, 255, 0.6); }

.tab--active {
  color: var(--tc);
  border-bottom-color: var(--tc);
}

.tdot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
  opacity: 0.6;
}

.tab--active .tdot { opacity: 1; }

.tcount {
  font-family: var(--font-mono);
  font-size: 9px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  padding: 1px 5px;
  color: rgba(255, 255, 255, 0.22);
}

.tab--active .tcount {
  background: color-mix(in srgb, var(--tc) 15%, transparent);
  color: var(--tc);
}

/* ── Grid area ─────────────────────────────────────────────── */
.grid-area {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 28px;
}

.feat-card {
  animation-delay: 0ms;
}

.rest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 14px;
}

.rest-card {
  animation: card-in 0.3s ease both;
  animation-delay: calc(var(--i, 0) * 40ms);
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Transitions ───────────────────────────────────────────── */
.fade-enter-active { transition: opacity 0.2s, transform 0.2s; }
.fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from { opacity: 0; transform: translateY(6px); }
.fade-leave-to   { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .rest-card {
    animation: none;
  }
  .fade-enter-active { transition: none; }
  .fade-leave-active { transition: none; }
  .fade-enter-from { transform: none; }
}
</style>
