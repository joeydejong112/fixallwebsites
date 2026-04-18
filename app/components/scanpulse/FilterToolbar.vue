<script setup lang="ts">
import type { PillarKey } from '~/types/scanpulse'

type StatusFilter = 'all' | 'crit' | 'warn' | 'pass'

interface Props {
  filter: StatusFilter
  pillarFilter: PillarKey | null
  pillars: Array<{ key: PillarKey; label: string; color: string }>
  totalChecks?: number
}

const props = withDefaults(defineProps<Props>(), {
  totalChecks: 94,
})

const emit = defineEmits<{
  (e: 'update:filter', value: StatusFilter): void
  (e: 'update:pillarFilter', value: PillarKey | null): void
}>()

const statuses = [
  { key: 'all' as StatusFilter,  label: 'All checks' },
  { key: 'crit' as StatusFilter, label: 'Critical', color: '#ff4757' },
  { key: 'warn' as StatusFilter, label: 'Warning',  color: '#ffaa00' },
  { key: 'pass' as StatusFilter, label: 'Pass',     color: '#00d4aa' },
]

function togglePillar(key: PillarKey) {
  emit('update:pillarFilter', props.pillarFilter === key ? null : key)
}
</script>

<template>
  <div
    style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      padding: 16px 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      position: sticky;
      top: 68px;
      z-index: 5;
      backdrop-filter: blur(16px);
    "
  >
    <!-- Status tabs -->
    <div style="display: flex; gap: 4px;">
      <button
        v-for="s in statuses"
        :key="s.key"
        :style="{
          padding: '8px 14px',
          borderRadius: 7,
          border: 'none',
          background: filter === s.key ? 'var(--elevated-2)' : 'transparent',
          color: filter === s.key ? (s.color || '#fff') : 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }"
        @click="emit('update:filter', s.key)"
      >
        <span
          v-if="s.color"
          :style="{ width: 7, height: 7, borderRadius: '50%', background: s.color }"
        />
        {{ s.label }}
      </button>
    </div>

    <div style="width: 1px; height: 20px; background: var(--border);" />

    <!-- Pillar chips -->
    <div style="display: flex; gap: 6px; flex-wrap: wrap; flex: 1;">
      <button
        v-for="p in pillars"
        :key="p.key"
        :style="{
          padding: '6px 12px',
          borderRadius: 999,
          border: `1px solid ${pillarFilter === p.key ? p.color : p.color + '26'}`,
          background: pillarFilter === p.key ? p.color + '22' : p.color + '0a',
          color: p.color,
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }"
        @click="togglePillar(p.key)"
      >
        <span :style="{ width: 6, height: 6, borderRadius: '50%', background: p.color }" />
        {{ p.label.split(' ')[0] }}
      </button>
    </div>

    <div style="color: var(--text-muted); font-size: 12px; font-family: var(--font-mono);">
      {{ totalChecks }} checks total
    </div>
  </div>
</template>
