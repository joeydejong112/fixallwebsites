<script setup lang="ts">
import type { Issue, PillarKey } from '~/types/scanpulse'

interface Props {
  pillarKey: PillarKey
  pillarLabel: string
  pillarColor: string
  pillarScore: number
  issues: Issue[]
  open?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: true,
})

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'open-tool', toolId: string): void
}>()

const critCount = computed(() => props.issues.filter(i => i.status === 'crit').length)
const warnCount = computed(() => props.issues.filter(i => i.status === 'warn').length)
const passCount = computed(() => props.issues.filter(i => i.status === 'pass').length)
</script>

<template>
  <div style="position: relative;">
    <!-- Colored left rail -->
    <div
      :style="{
        position: 'absolute',
        top: 44,
        bottom: 0,
        left: 0,
        width: 2,
        background: pillarColor,
        borderRadius: 2,
        opacity: open ? 0.6 : 0.2,
      }"
    />

    <!-- Group header -->
    <div
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px 12px 20px;
        margin-bottom: 10px;
      "
    >
      <div style="display: flex; align-items: center; gap: 14px;">
        <!-- Chevron toggle -->
        <button
          :style="{
            width: 22,
            height: 22,
            border: 'none',
            background: 'transparent',
            color: pillarColor,
            cursor: 'pointer',
            transform: open ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }"
          @click="emit('toggle')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        <!-- Pillar label -->
        <span
          class="eyebrow-pillar"
          :style="{ color: pillarColor, fontSize: 12 }"
        >
          <span
            :style="{
              width: 28,
              height: 2,
              background: pillarColor,
              display: 'inline-block',
            }"
          />
          {{ pillarLabel }}
        </span>

        <!-- Pillar score -->
        <div class="num" :style="{ fontSize: 22, color: pillarColor }">
          {{ pillarScore }}
        </div>

        <!-- Issue counts -->
        <div
          style="
            color: var(--text-muted);
            font-size: 12px;
            font-family: var(--font-mono);
          "
        >
          {{ critCount }} critical &middot; {{ warnCount }} warning &middot; {{ passCount }} pass
        </div>
      </div>
    </div>

    <!-- Issue rows -->
    <div
      v-if="open"
      style="display: flex; flex-direction: column; gap: 8px; margin-left: 20px;"
    >
      <IssueRow
        v-for="(iss, i) in issues"
        :key="i"
        :iss="iss"
        :pillar-key="pillarKey"
        :pillar-color="pillarColor"
        @open-tool="emit('open-tool', $event)"
      />
    </div>
  </div>
</template>
