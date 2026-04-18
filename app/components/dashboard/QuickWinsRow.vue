<script setup lang="ts">
/**
 * QuickWinsRow — 3 quick win cards ranked by score impact.
 */
import type { QuickWin } from '~/types/scanpulse'
import { STATIC_PILLARS } from '~/types/scanpulse'

const props = defineProps<{
  quickWins: QuickWin[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'goTool', tool: string): void
}>()

function pillarForKey(key: string) {
  return STATIC_PILLARS.find(p => p.key === key)
}
</script>

<template>
  <section>
    <div class="flex justify-between items-end" style="margin-bottom: 16px">
      <div>
        <div class="eyebrow">Quick wins · ranked by score impact</div>
        <h2 class="display" style="font-size: 28px; margin: 10px 0 0">
          Fix three things. Unlock 28 points.
        </h2>
      </div>
      <a class="show-all-link">Show all issues →</a>
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: 18px">
        <div v-for="i in 3" :key="i" class="card shimmer" style="padding: 24px; min-height: 220px; position: relative">
          <div class="absolute inset-0 p-6 flex flex-col gap-4">
            <div class="h-4 w-24 bg-white/5 animate-pulse rounded" />
            <div class="h-8 w-36 bg-white/5 animate-pulse rounded" />
            <div class="h-12 bg-white/5 animate-pulse rounded" />
            <div class="mt-auto h-10 bg-white/5 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <template v-else-if="!quickWins.length">
      <div class="card" style="padding: 32px; text-align: center">
        <div class="eyebrow" style="justify-content: center">Nothing to improve</div>
        <p class="text-muted" style="font-size: 14px; margin-top: 12px">Your latest scan found no quick wins — great work!</p>
      </div>
    </template>

    <!-- Quick win cards -->
    <template v-else>
      <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: 18px">
        <div
          v-for="q in quickWins.slice(0, 3)"
          :key="q.title"
          class="card lift"
          :style="{
            padding: '24px 24px 22px',
            position: 'relative',
            borderLeft: `2px solid ${pillarForKey(q.pillar)?.color ?? 'var(--border)'}`,
            minHeight: 220,
            cursor: 'pointer',
          }"
          @click="emit('goTool', q.tool)"
        >
          <div class="card-accent-top" :style="{ background: `linear-gradient(to right, ${pillarForKey(q.pillar)?.color ?? 'var(--brand)'}, transparent)` }" />

          <div class="flex justify-between items-start" style="margin-bottom: 16px">
            <span class="eyebrow-pillar" :style="{ color: pillarForKey(q.pillar)?.color ?? 'var(--text-muted)' }">
              <span :style="{ width: 22, height: 2, background: pillarForKey(q.pillar)?.color ?? 'var(--brand)', display: 'inline-block', marginRight: 6 }" />
              {{ pillarForKey(q.pillar)?.label ?? q.pillar }}
            </span>
            <div style="text-align: right">
              <div class="num" :style="{ fontSize: 26, color: 'var(--p-security)', lineHeight: 1 }">+{{ q.impact }}</div>
              <div style="font-size: 10px; color: var(--text-muted); letter-spacing: 0.12em; text-transform: uppercase; margin-top: 3px">pts potential</div>
            </div>
          </div>

          <h3 class="display" style="font-size: 20px; margin: 0 0 8px; letter-spacing: -0.02em">{{ q.title }}</h3>
          <p class="text-muted" style="font-size: 13.5px; line-height: 1.55; margin: 0 0 20px">{{ q.blurb }}</p>

          <button class="btn btn-pink-ghost" style="width: 100%; justify-content: center">
            {{ q.toolLabel }}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.show-all-link {
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  font-family: var(--font-display);
}
</style>
