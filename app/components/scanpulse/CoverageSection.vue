<script setup lang="ts">
import { useScanpulseData } from '~/composables/useScanpulseData'

const { PILLARS } = useScanpulseData()

const checks: Record<string, string[]> = {
  security:      ['HTTPS & HSTS', 'CSP present', 'Secure cookies', 'CORS scoped', 'Mixed content'],
  performance:   ['LCP under 2.5s', 'CLS under 0.1', 'INP under 200ms', 'Image formats', 'Compression'],
  seo:           ['Canonical', 'Open Graph', 'JSON-LD', 'Meta description', 'Sitemap'],
  accessibility: ['Alt text', 'Contrast AA', 'Landmarks', 'Focus states', 'Form labels'],
  ai:            ['llms.txt', 'Consistent summaries', 'Structured data', 'Allowed bots', 'Entity schema'],
  dns:           ['SPF valid', 'DMARC ≥ quarantine', 'DKIM aligned', 'MX present', 'Reverse DNS'],
  trust:         ['Privacy policy', 'Terms of service', 'Contact page', 'Physical address', 'Disclosure'],
}
</script>

<template>
  <section class="relative grid-bg" style="padding:120px 80px 120px 140px;">
    <!-- Header block -->
    <div style="max-width:720px;margin-bottom:60px;">
      <div class="eyebrow">Coverage</div>
      <h2 class="display" style="font-size:64px;margin:20px 0 16px;">
        Seven pillars.<br/>
        Ninety-four checks.
      </h2>
      <p style="font-size:17px;color:var(--text-muted);max-width:520px;line-height:1.6;">
        Every ScanPulse report groups findings into seven canonical pillars. Each pillar owns a color. You'll see that color on the issue, the fix, and the score uplift — a visual map of your site's health.
      </p>
    </div>

    <!-- 4x2 bento grid -->
    <div
      class="grid gap-5"
      style="grid-template-columns:repeat(4,1fr);"
    >
      <div
        v-for="p in PILLARS"
        :key="p.key"
        class="card lift relative"
        style="padding:24px 22px 22px;min-height:260px;"
      >
        <!-- Top accent line -->
        <div
          class="absolute top-0 left-0 right-0 h-[2px]"
          :style="{ background: `linear-gradient(to right, ${p.color}, transparent)` }"
        />

        <!-- Ghost numeral -->
        <div
          class="ghost-numeral"
          style="font-size:120px;top:-10px;right:-10px;"
          :style="{ color: p.color + '12' }"
        >{{ String(p.count).padStart(2, '0') }}</div>

        <!-- Icon + label -->
        <div class="flex items-center gap-[10px] mb-[22px]">
          <div
            class="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center"
            :style="{ background: p.color + '1a', color: p.color }"
          >
            <!-- Pillar icon placeholder -->
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z"/>
            </svg>
          </div>
          <span class="eyebrow-pillar" :style="{ color: p.color }">
            <span style="width:28px;height:2px;display:inline-block;margin-right:4px;" :style="{ background: p.color }" />
            {{ p.label }}
          </span>
        </div>

        <!-- Count -->
        <div class="num relative" style="font-size:40px;margin-bottom:14px;" :style="{ color: p.color }">
          {{ p.count }}<span style="font-size:14px;color:var(--text-muted);margin-left:6px;">checks</span>
        </div>

        <!-- Check list -->
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:7px;">
          <li
            v-for="c in (checks[p.key] ?? [])"
            :key="c"
            class="flex items-center gap-2"
            style="font-size:13px;color:var(--text-muted);"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" :stroke="p.color" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 12l5 5L20 7"/>
            </svg>
            {{ c }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>