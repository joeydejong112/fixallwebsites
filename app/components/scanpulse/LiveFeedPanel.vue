<script setup lang="ts">
import { useScanpulseData } from '~/composables/useScanpulseData'

const { FEED } = useScanpulseData()

// Triple for seamless loop
const feedItems = [...FEED, ...FEED, ...FEED]

const pillarMap: Record<string, { label: string; color: string }> = {
  security:      { label: 'Security',       color: '#00d4aa' },
  performance:  { label: 'Performance',    color: '#ffaa00' },
  seo:          { label: 'SEO',            color: '#6c5ce7' },
  accessibility: { label: 'Accessibility', color: '#a29bfe' },
  ai:           { label: 'AI Readiness',   color: '#ff7675' },
  dns:          { label: 'DNS & Email',    color: '#74b9ff' },
  trust:        { label: 'Trust',          color: '#fd79a8' },
}

const statusColor = (status: string) =>
  status === 'pass' ? '#00d4aa' : status === 'warn' ? '#ffaa00' : '#ff4757'
</script>

<template>
  <div class="relative">
    <div
      class="card overflow-hidden"
      style="height: 560px; border-radius: 20px; box-shadow: 0 40px 80px rgba(0,0,0,0.4);"
    >
      <!-- Accent top line -->
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(to right,#ec3586,transparent);" />

      <!-- Header -->
      <div
        class="flex items-center justify-between px-[22px] py-[18px]"
        style="border-bottom: 1px solid var(--border);"
      >
        <div class="flex items-center gap-[10px]">
          <!-- Pulse dot -->
          <div
            style="width:8px;height:8px;border-radius:50%;background:#ec3586;position:relative;"
            class="live-pulse"
          />
          <span class="eyebrow" style="font-size:10px;">Live feed</span>
        </div>
        <span class="font-display font-semibold text-white" style="font-size:13px;">
          <span style="color:#ec3586">3,847</span> scans today
        </span>
      </div>

      <!-- Scroll content -->
      <div class="overflow-hidden" style="height:calc(100% - 57px);">
        <!-- Fade masks -->
        <div
          style="position:absolute;top:0;left:0;right:0;height:60px;background:linear-gradient(to bottom,var(--elevated),transparent);z-index:2;pointer-events:none;"
        />
        <div
          style="position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(to top,var(--elevated),transparent);z-index:2;pointer-events:none;"
        />

        <!-- Marquee -->
        <div class="marquee-container">
          <div
            v-for="(f, i) in feedItems"
            :key="i"
            class="flex items-center gap-3 px-[22px] py-[14px]"
            style="border-bottom:1px solid var(--border);border-left:2px solid"
            :style="{ borderLeftColor: pillarMap[f.pillar]?.color ?? '#fff' }"
          >
            <!-- Favicon placeholder -->
            <div
              class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-white text-[10px]"
              style="background: rgba(255,255,255,0.05);"
            >
              {{ f.host[0].toUpperCase() }}
            </div>

            <div class="flex-1 min-w-0">
              <div class="font-mono text-white font-medium" style="font-size:13px;margin-bottom:2px;">
                {{ f.host }}
              </div>
              <div class="flex items-center gap-2 text-[12px]" style="color:var(--text-muted);">
                <span
                  class="font-display font-semibold uppercase tracking-wide"
                  style="font-size:10px;"
                  :style="{ color: pillarMap[f.pillar]?.color }"
                >
                  {{ pillarMap[f.pillar]?.label }}
                </span>
                <span> · </span>
                <span>{{ f.msg }}</span>
              </div>
            </div>

            <!-- Status dot -->
            <div
              class="w-2 h-2 rounded-full shrink-0"
              :style="{ background: statusColor(f.status) }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes marquee-up {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

.marquee-container {
  animation: marquee-up 28s linear infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.85); }
}

.live-pulse {
  animation: livePulse 1.5s ease-in-out infinite;
}
</style>