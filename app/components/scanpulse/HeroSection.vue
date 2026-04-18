<script setup lang="ts">
const router = useRouter()

const counts = reactive({ checks: 0, scans: 0, pillars: 0 })

onMounted(() => {
  const targets = { checks: 94, scans: 3847, pillars: 7 }
  const dur = 1100
  const start = performance.now()
  let raf: number

  const tick = (t: number) => {
    const p = Math.min(1, (t - start) / dur)
    const e = 1 - Math.pow(1 - p, 3) // cubic ease-out
    counts.checks = Math.round(targets.checks * e)
    counts.scans  = Math.round(targets.scans * e)
    counts.pillars = Math.round(targets.pillars * e)
    if (p < 1) raf = requestAnimationFrame(tick)
  }

  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
})

function handleScan() {
  router.push('/sign-up')
}
</script>

<template>
  <section
    class="relative flex items-center overflow-hidden"
    style="min-height:100vh;padding:90px 80px 60px 140px;gap:48px;grid-template-columns:44% 56%;"
  >
    <!-- Grid bg overlay -->
    <div
      class="absolute inset-0 pointer-events-none grid-bg"
    />

    <!-- Brand radial glow -->
    <div
      class="absolute pointer-events-none"
      style="inset:0;background:radial-gradient(ellipse at 75% 35%,rgba(236,53,134,0.14),transparent 60%);"
    />

    <!-- Left editorial column -->
    <div class="relative z-10 flex flex-col">
      <!-- Ghost numeral -->
      <div
        class="ghost-numeral"
        style="font-size:220px;top:-40px;left:-20px;"
      >94</div>

      <!-- Eyebrow -->
      <div class="eyebrow">94 checks · 7 pillars</div>

      <!-- Headline -->
      <h1
        class="display"
        style="font-size:clamp(3.4rem,5.5vw,5.6rem);margin:28px 0 20px;"
      >
        Every flaw on<br/>your site,<br/>
        <span style="color:var(--brand)">one click</span> from fixed.
      </h1>

      <!-- Subtext -->
      <p
        style="font-size:18px;color:var(--text-muted);line-height:1.55;max-width:460px;margin:0 0 36px;"
      >
        ScanPulse audits any URL across 94 checks. Each issue links straight to the tool that repairs it — and shows the exact points you'll unlock on your next scan.
      </p>

      <!-- Stats row -->
      <div class="flex gap-[42px] mb-10">
        <div>
          <div class="num" style="font-size:42px;color:#fff;margin-bottom:4px;">{{ counts.checks }}</div>
          <div style="font-size:12px;color:var(--text-muted);letter-spacing:0.02em;max-width:110px;">Checks run per scan</div>
        </div>
        <div>
          <div class="num" style="font-size:42px;color:#fff;margin-bottom:4px;">{{ counts.pillars }}</div>
          <div style="font-size:12px;color:var(--text-muted);letter-spacing:0.02em;max-width:110px;">Pillars of health</div>
        </div>
        <div>
          <div class="num" style="font-size:42px;color:var(--brand);margin-bottom:4px;">{{ counts.scans.toLocaleString() }}</div>
          <div style="font-size:12px;color:var(--text-muted);letter-spacing:0.02em;max-width:110px;">Scans today</div>
        </div>
      </div>

      <!-- CTA buttons -->
      <div class="flex gap-3 items-center mb-8">
        <button
          class="btn btn-primary"
          style="height:48px;padding:0 24px;font-size:15px;"
          @click="handleScan"
        >
          Scan your site free
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        <button
          class="btn btn-ghost"
          style="height:48px;padding:0 20px;font-size:14px;"
          @click="handleScan"
        >
          See a sample report
        </button>
      </div>

      <!-- Social proof -->
      <div class="flex items-center gap-4">
        <div class="flex -space-x-2">
          <div
            v-for="(av, i) in [{i:'KM',c:'#ec3586'},{i:'AO',c:'#74b9ff'},{i:'SR',c:'#ffaa00'},{i:'JT',c:'#00d4aa'}]"
            :key="i"
            class="w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center font-display font-bold text-white text-[11px]"
            :style="{ background: av.c + '40', borderColor: 'var(--canvas)', marginLeft: i === 0 ? '0' : '-10px' }"
          >{{ av.i }}</div>
        </div>
        <div style="font-size:13px;color:var(--text-muted);">
          <strong style="color:#fff;font-family:var(--font-display);">1,284</strong> teams scanning this week
        </div>
      </div>
    </div>

    <!-- Right: Live feed panel -->
    <div class="relative z-10">
      <LiveFeedPanel />
    </div>

    <!-- Scroll chevron -->
    <div
      class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      style="animation: chev-bounce 2s infinite ease-in-out;color:var(--text-faint);"
    >
      <span class="font-display text-[10px] uppercase tracking-[0.2em]">Scroll</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </div>
  </section>
</template>

<style scoped>
@keyframes chev-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%       { transform: translateX(-50%) translateY(6px); }
}
</style>