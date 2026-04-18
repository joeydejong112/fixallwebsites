<script setup lang="ts">
import { STATIC_PILLARS, STATIC_TOOLS } from '~/types/scanpulse'
import type { PillarKey } from '~/types/scanpulse'

interface FilterTab {
  key: string
  label: string
  color: string
  count: number
}

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const active = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// Build tab list: "all" + pillars that have tools
const tabs = computed<FilterTab[]>(() => {
  const allCount = STATIC_TOOLS.length
  const pillarCounts: Record<string, number> = {}
  for (const t of STATIC_TOOLS) {
    pillarCounts[t.pillar] = (pillarCounts[t.pillar] ?? 0) + 1
  }

  const result: FilterTab[] = [
    { key: 'all', label: 'All tools', color: '#ec3586', count: allCount },
  ]

  for (const p of STATIC_PILLARS) {
    if ((pillarCounts[p.key] ?? 0) > 0) {
      result.push({ key: p.key, label: p.label, color: p.color, count: pillarCounts[p.key] })
    }
  }

  return result
})
</script>

<template>
  <div class="filter-tabs" role="tablist" aria-label="Filter tools by pillar">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      role="tab"
      :aria-selected="active === tab.key"
      class="tab-btn"
      :class="{ 'tab-btn--active': active === tab.key }"
      :style="active === tab.key ? `--tc:${tab.color}` : ''"
      @click="active = tab.key"
    >
      {{ tab.label }}
      <span
        class="tab-count"
        :class="{ 'tab-count--active': active === tab.key }"
        :style="active === tab.key ? `--tc:${tab.color}` : ''"
      >{{ tab.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}

.tab-btn:hover {
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.04);
}

.tab-btn--active {
  color: var(--tc);
  background: color-mix(in srgb, var(--tc) 10%, transparent);
  border-color: var(--tc);
}

.tab-count {
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-faint);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  transition: background 0.15s, color 0.15s;
}

.tab-count--active {
  background: color-mix(in srgb, var(--tc) 15%, transparent);
  color: var(--tc);
}
</style>
