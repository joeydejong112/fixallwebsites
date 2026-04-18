<script setup lang="ts">
import { useScanpulseData } from '~/composables/useScanpulseData'

const { PILLARS, QUICK_WINS } = useScanpulseData()

const router = useRouter()

function handleScan() {
  router.push('/sign-up')
}

const ringCirc = 2 * Math.PI * 46
const overallScore = 81
const ringOffset = computed(() => ringCirc - (overallScore / 100) * ringCirc)
</script>

<template>
  <section class="relative grid-bg" style="padding:120px 80px 120px 140px;">
    <!-- Ambient radial -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="background:radial-gradient(ellipse at 50% 50%,rgba(236,53,134,0.08),transparent 60%);"
    />

    <!-- Header -->
    <div class="relative" style="max-width:720px;margin-bottom:60px;">
      <div class="eyebrow">Sample result</div>
      <h2 class="display" style="font-size:64px;margin:20px 0 16px;">
        The money shot.
      </h2>
      <p style="font-size:17px;color:var(--text-muted);max-width:560px;line-height:1.6;">
        This is exactly what you'll see after your first scan. Score ring, pillar breakdown, and an issue list where every fix is a click away.
      </p>
    </div>

    <!-- Browser mock -->
    <div
      class="relative rounded-2xl overflow-hidden"
      style="border:1px solid var(--border-strong);background:var(--elevated);box-shadow:0 60px 120px rgba(0,0,0,0.5),0 0 100px rgba(236,53,134,0.12);"
    >
      <!-- Browser chrome bar -->
      <div
        class="flex items-center gap-[10px] px-[14px]"
        style="height:40px;background:#0a0a10;border-bottom:1px solid var(--border);"
      >
        <div class="flex gap-[7px]">
          <div class="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
          <div class="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
          <div class="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
        </div>
        <div
          class="flex-1 flex items-center gap-2 mx-20 px-3 rounded-md"
          style="height:24px;background:rgba(255,255,255,0.04);border:1px solid var(--border);font-family:var(--font-mono);font-size:11px;color:var(--text-muted);"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2.5">
            <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/>
          </svg>
          app.scanpulse.io/scan/acme.design
        </div>
      </div>

      <!-- Dashboard interior -->
      <div
        class="flex gap-9 px-9 py-9"
        style="background:var(--canvas);display:grid;grid-template-columns:360px 1fr;"
      >
        <!-- LEFT: score ring + pillar bars -->
        <div>
          <div class="flex items-center gap-[10px] mb-5">
            <div class="w-6 h-6 rounded-lg flex items-center justify-center font-display font-bold text-white text-[10px]" style="background:#ec3586;">A</div>
            <span class="font-mono text-white" style="font-size:14px;">acme.design</span>
          </div>

          <!-- Score ring -->
          <div class="flex justify-center mb-6">
            <div class="relative">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8" />
                <circle
                  cx="55" cy="55" r="46" fill="none" stroke="#ec3586" stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="ringCirc"
                  :stroke-dashoffset="ringOffset"
                  transform="rotate(-90 55 55)"
                  style="filter:drop-shadow(0 0 6px rgba(236,53,134,0.5));transition:stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1);"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="font-display font-bold text-white leading-none" style="font-size:1.9rem;letter-spacing:-0.04em;">{{ overallScore }}</span>
                <span class="text-[9px] font-display uppercase tracking-[0.12em] text-white/40 mt-0.5">Overall</span>
              </div>
            </div>
          </div>

          <!-- Pillar score bars -->
          <div class="flex flex-col gap-[10px]">
            <div v-for="p in PILLARS" :key="p.key" class="flex items-center gap-3">
              <span class="font-display font-semibold uppercase tracking-wide" style="font-size:10px;width:110px;" :style="{ color: p.color }">{{ p.label }}</span>
              <div class="flex-1 h-[6px] rounded-full overflow-hidden" style="background:rgba(255,255,255,0.05);">
                <div class="h-full rounded-full" :style="{ width: p.score + '%', background: p.color, boxShadow: `0 0 10px ${p.color}55` }" />
              </div>
              <span class="num text-white" style="font-size:14px;width:34px;text-align:right;">{{ p.score }}</span>
            </div>
          </div>
        </div>

        <!-- RIGHT: issue list -->
        <div>
          <div class="eyebrow" style="margin-bottom:14px;">Top issues · ranked by impact</div>
          <div class="flex flex-col gap-3">
            <template v-for="(q, i) in QUICK_WINS" :key="i">
              <div
                class="rounded-xl px-[18px] py-4"
                style="background:var(--elevated);border:1px solid var(--border);"
              >
                <template v-if="PILLARS.find(p => p.key === q.pillar)">
                  <div
                    class="flex items-center gap-[10px] mb-2"
                    :style="{ borderLeft: `2px solid ${PILLARS.find(p => p.key === q.pillar)?.color}` }"
                    style="padding-left:10px;"
                  >
                    <span class="eyebrow-pillar" :style="{ color: PILLARS.find(p => p.key === q.pillar)?.color }">
                      <span style="width:22px;height:2px;display:inline-block;margin-right:6px;" :style="{ background: PILLARS.find(p => p.key === q.pillar)?.color }" />
                      {{ PILLARS.find(p => p.key === q.pillar)?.label }}
                    </span>
                    <span class="num ml-auto" style="font-size:13px;color:#00d4aa;">+{{ q.impact }} pts</span>
                  </div>
                  <div class="font-display font-semibold text-white mb-1" style="font-size:16px;">{{ q.title }}</div>
                  <div style="font-size:13px;color:var(--text-muted);line-height:1.5;margin-bottom:12px;">{{ q.blurb }}</div>
                  <button class="btn btn-pink-ghost" style="white-space:nowrap;">
                    {{ q.toolLabel }}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>