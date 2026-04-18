<script setup lang="ts">
import type { Scan } from '~/types/scanpulse'

interface Props {
  scan: Scan
  totalChecks?: number
  criticalCount?: number
  warnCount?: number
  passCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  totalChecks: 94,
  criticalCount: 0,
  warnCount: 0,
  passCount: 0,
})

const emit = defineEmits<{
  (e: 'rescan'): void
  (e: 'share'): void
  (e: 'export'): void
}>()
</script>

<template>
  <div class="card" style="padding: 28px 32px; position: relative;">
    <div class="card-accent-top" style="background: linear-gradient(to right, var(--brand), transparent);" />

    <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 36px; align-items: center;">
      <!-- Left: score ring + host info -->
      <div style="display: flex; align-items: center; gap: 18px;">
        <ScoreRing
          :score="scan.overall"
          :size="140"
          :stroke="10"
          color="#ec3586"
          label="Overall"
          :delta="scan.trend"
        />
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <Favicon :host="scan.host" :size="24" :bg="scan.faviconBg" />
            <div style="font-family: var(--font-mono); font-size: 18px; color: #fff;">{{ scan.host }}</div>
          </div>
          <div class="eyebrow" style="font-size: 10px;">Scanned {{ scan.when }} · {{ totalChecks }} checks</div>
          <div style="margin-top: 16px; display: flex; gap: 18px;">
            <!-- Stat2 inlined -->
            <div>
              <div class="num" style="font-size: 22px; color: #ff4757;">{{ criticalCount }}</div>
              <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-top: 2px;">Critical</div>
            </div>
            <div>
              <div class="num" style="font-size: 22px; color: #ffaa00;">{{ warnCount }}</div>
              <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-top: 2px;">Warning</div>
            </div>
            <div>
              <div class="num" style="font-size: 22px; color: #00d4aa;">{{ passCount }}</div>
              <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-top: 2px;">Pass</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Center: pillar score bubbles -->
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <div
          v-for="p in scan.pillars"
          :key="p.key"
          :style="{
            padding: '10px 14px',
            background: `${p.color}10`,
            border: `1px solid ${p.color}26`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            minWidth: 82,
          }"
        >
          <div :style="{
            fontSize: 9,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: p.color,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
          }">
            {{ p.label.split(' ')[0] }}
          </div>
          <div class="num" style="font-size: 22px; color: p.color;">{{ p.score }}</div>
        </div>
      </div>

      <!-- Right: CTAs -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn btn-primary" @click="emit('rescan')">
          Rescan now <Arrow :size="13" />
        </button>
        <button class="btn btn-ghost" style="justify-content: center;" @click="emit('share')">
          Share report
        </button>
        <button class="btn btn-ghost" style="justify-content: center;" @click="emit('export')">
          Export PDF
        </button>
      </div>
    </div>
  </div>
</template>
