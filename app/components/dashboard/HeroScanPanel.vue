<script setup lang="ts">
/**
 * HeroScanPanel — score ring + pillar mini-bars for the latest scan.
 * Zero-state shown when no scan is available.
 */
import type { Scan } from '~/types/scanpulse'
import type { PillarKey } from '~/types/scanpulse'
import { STATIC_PILLARS } from '~/types/scanpulse'

const props = defineProps<{
  scan: Scan | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'rescan'): void
  (e: 'viewAll'): void
  (e: 'goTool', tool: string): void
}>()

const pillarKeys: PillarKey[] = ['security', 'performance', 'seo', 'accessibility', 'ai', 'dns', 'trust']

const pillarByKey = computed(() => {
  const map = new Map<PillarKey, (typeof STATIC_PILLARS)[0]>()
  for (const p of STATIC_PILLARS) map.set(p.key, p)
  return map
})

const topIssues = computed(() => {
  if (!props.scan) return []
  return props.scan.pillars
    .flatMap(p => p.count > 0 ? [{ pillar: p.key, title: `Fix ${p.count} ${p.label} issues`, tool: p.key === 'security' ? 'csp' : p.key === 'performance' ? 'imgopt' : 'meta' }] : [])
    .slice(0, 3)
})

const totalChecks = computed(() => {
  if (!props.scan) return 0
  return props.scan.pillars.reduce((s, p) => s + p.count, 0)
})

const potentialUplift = computed(() => {
  if (!props.scan) return 0
  return props.scan.pillars.reduce((s, p) => s + Math.max(0, 100 - p.score), 0)
})
</script>

<template>
  <!-- Loading skeleton -->
  <template v-if="loading">
    <div class="card shimmer" style="padding: 32px 36px; min-height: 200px; position: relative">
      <div class="absolute inset-0 flex gap-6 items-center p-8">
        <div class="w-[140px] h-[140px] rounded-full bg-white/5 animate-pulse" />
        <div class="flex-1 space-y-4">
          <div class="h-6 w-48 bg-white/5 animate-pulse rounded" />
          <div class="h-4 w-72 bg-white/5 animate-pulse rounded" />
          <div class="grid grid-cols-2 gap-3 mt-4">
            <div v-for="i in 6" :key="i" class="h-3 bg-white/5 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- Zero state -->
  <template v-else-if="!scan">
    <div class="card" style="padding: 48px; text-align: center; position: relative">
      <div class="card-accent-top" style="background: linear-gradient(to right, var(--brand), transparent)" />
      <div class="ghost-numeral" style="font-size: 160px; top: 50%; left: 50%; transform: translate(-50%,-50%)">?</div>
      <div style="position: relative; z-index: 1">
        <div class="eyebrow" style="justify-content: center; margin-bottom: 16px">No scan yet</div>
        <h2 class="display" style="font-size: 28px; margin: 0 0 12px">Run your first scan</h2>
        <p class="text-muted" style="font-size: 14px; margin: 0 0 24px; max-width: 360px; margin-inline: auto">
          Analyse your site across 7 pillars — Security, Performance, SEO, Accessibility, AI Readiness, DNS, and Trust.
        </p>
        <button class="btn btn-primary" style="margin-inline: auto">
          Start scanning
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </template>

  <!-- Hero scan panel -->
  <template v-else>
    <div class="card" style="padding: 32px 36px; position: relative">
      <div class="card-accent-top" style="background: linear-gradient(to right, var(--brand), transparent)" />
      <div class="ghost-numeral" style="font-size: 260px; top: -30px; right: 20px; color: rgba(236, 53, 134, 0.05)">
        {{ scan.overall }}
      </div>

      <div class="hero-grid" style="display: grid; grid-template-columns: auto 1fr auto; gap: 48px; align-items: center; position: relative">

        <!-- Score ring -->
        <ScoreRing :score="scan.overall" :delta="scan.trend" size="140" stroke="10" />

        <!-- Pillar breakdown -->
        <div>
          <div class="flex items-center gap-3.5" style="margin-bottom: 22px">
            <Favicon :host="scan.host" :size="32" :bg="scan.faviconBg" />
            <div>
              <div class="font-mono" style="font-size: 20px; color: #fff; margin-bottom: 2px">{{ scan.host }}</div>
              <div style="font-size: 13px; color: var(--text-muted)">
                Last scanned {{ scan.when }} · <a class="brand-link">View full report →</a>
              </div>
            </div>
            <span class="chip" style="margin-left: auto; border-color: rgba(0, 212, 170, 0.3); background: rgba(0, 212, 170, 0.1); color: var(--p-security)">
              <span class="pulse-dot" style="background: var(--p-security); color: var(--p-security)" />
              Monitoring on
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 40px">
            <div
              v-for="pillar in scan.pillars"
              :key="pillar.key"
              class="pillar-row"
              style="display: grid; grid-template-columns: 110px 1fr 34px; gap: 12px; align-items: center"
            >
              <div class="pillar-label" :style="{ color: pillar.color }">
                {{ pillar.label }}
              </div>
              <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 999px; overflow: hidden">
                <div
                  class="pillar-fill"
                  :style="{
                    height: '100%',
                    width: pillar.score + '%',
                    background: pillar.color,
                    boxShadow: `0 0 10px ${pillar.color}55`,
                    borderRadius: 999,
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }"
                />
              </div>
              <div class="num" style="font-size: 14px; color: #fff; text-align: right">{{ pillar.score }}</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-2.5" style="min-width: 180px">
          <button class="btn btn-pink-ghost" style="justify-content: center; height: 40px" @click="emit('rescan')">
            Rescan site
          </button>
          <button class="btn btn-ghost" style="justify-content: center; height: 40px" @click="emit('viewAll')">
            See all {{ totalChecks }} checks
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div style="border-top: 1px solid var(--border); padding-top: 12px; margin-top: 4px">
            <div class="eyebrow" style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-faint); margin-bottom: 6px">Potential uplift</div>
            <div class="num" style="font-size: 28px; color: var(--p-security)">+{{ Math.round(potentialUplift) }} pts</div>
            <div style="font-size: 12px; color: var(--text-muted)">by fixing quick wins</div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.card-accent-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
}
.ghost-numeral {
  position: absolute;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.06em;
  color: rgba(255, 255, 255, 0.04);
  pointer-events: none;
  user-select: none;
  line-height: 0.8;
}
.pillar-label {
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 600;
}
</style>
