<script setup lang="ts">
import type { Issue, PillarKey, Tool } from '~/types/scanpulse'

interface Props {
  iss: Issue
  pillarKey: PillarKey
  pillarColor: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'open-tool', toolId: string): void
}>()

function getStatusColor(status: string): string {
  if (status === 'pass') return '#00d4aa'
  if (status === 'warn') return '#ffaa00'
  return '#ff4757'
}

function getStatusLabel(status: string): string {
  if (status === 'crit') return 'CRITICAL'
  if (status === 'warn') return 'WARNING'
  return 'PASS'
}
</script>

<template>
  <div
    class="card lift"
    :style="{
      padding: '18px 22px',
      display: 'grid',
      gridTemplateColumns: '110px 1fr auto',
      gap: 20,
      alignItems: 'center',
      borderLeft: `2px solid ${getStatusColor(iss.status)}`,
      borderRadius: 10,
    }"
  >
    <!-- Status badge -->
    <div style="display: flex; align-items: center; gap: 8px;">
      <StatusIcon :status="iss.status" :size="14" />
      <span
        :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '0.12em',
          fontWeight: 700,
          color: getStatusColor(iss.status),
        }"
      >{{ getStatusLabel(iss.status) }}</span>
    </div>

    <!-- Issue content -->
    <div>
      <div
        :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 600,
          color: '#fff',
          marginBottom: 3,
        }"
      >{{ iss.title }}</div>
      <div style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">
        {{ iss.blurb }}
      </div>
    </div>

    <!-- Action -->
    <div>
      <template v-if="iss.tool">
        <button
          class="btn btn-pink-ghost"
          @click="emit('open-tool', iss.tool!)"
        >
          Open in {{ iss.tool }} <Arrow :size="13" />
        </button>
      </template>
      <template v-else-if="iss.status === 'pass'">
        <span
          style="
            color: var(--text-faint);
            font-size: 12px;
            font-family: var(--font-mono);
          "
        >
          &#10003; verified
        </span>
      </template>
      <template v-else>
        <a
          style="
            color: var(--text-muted);
            font-size: 13px;
            cursor: pointer;
            font-family: var(--font-display);
          "
        >
          Learn more &#8594;
        </a>
      </template>
    </div>
  </div>
</template>
