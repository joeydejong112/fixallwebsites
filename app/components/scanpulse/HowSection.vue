<script setup lang="ts">
const router = useRouter()

const steps = [
  { n: '01', title: 'Diagnose', color: '#74b9ff',
    desc: 'Enter a URL. In under 12 seconds, ScanPulse runs 94 checks and assigns an overall score plus seven pillar scores.' },
  { n: '02', title: 'Fix',      color: '#ec3586',
    desc: 'Every fixable issue links directly to the tool that repairs it — CSP Builder, Image Optimizer, Schema Generator, and eight more.' },
  { n: '03', title: 'Verify',   color: '#00d4aa',
    desc: 'Rescan. The previously-failing checks turn green. The score ring fills. Monitoring keeps the win in place.' },
]

function handleScan() {
  router.push('/sign-up')
}
</script>

<template>
  <section class="relative grid-bg" style="padding:120px 80px 120px 140px;">
    <!-- Header -->
    <div style="max-width:720px;margin-bottom:72px;">
      <div class="eyebrow">The loop</div>
      <h2 class="display" style="font-size:64px;margin:20px 0 16px;">
        Diagnose. Fix. Verify.
      </h2>
      <p style="font-size:17px;color:var(--text-muted);max-width:560px;line-height:1.6;">
        Most tools stop at the report. ScanPulse closes the loop.
      </p>
    </div>

    <!-- Step cards -->
    <div class="grid gap-6" style="grid-template-columns:repeat(3,1fr);">
      <div
        v-for="(s, i) in steps"
        :key="s.n"
        class="card lift relative"
        style="padding:32px 28px;min-height:280px;"
      >
        <!-- Top accent -->
        <div
          class="absolute top-0 left-0 right-0 h-[2px]"
          :style="{ background: `linear-gradient(to right, ${s.color}, transparent)` }"
        />

        <!-- Ghost number -->
        <div
          class="ghost-numeral"
          style="font-size:160px;top:60px;right:10px;"
          :style="{ color: s.color + '10' }"
        >{{ s.n }}</div>

        <!-- Step label -->
        <div
          class="font-display font-bold uppercase"
          style="font-size:11px;letter-spacing:0.2em;margin-bottom:18px;"
          :style="{ color: s.color }"
        >
          Step {{ s.n }}
        </div>

        <!-- Title -->
        <h3 class="display" style="font-size:44px;margin:0 0 16px;" :style="{ color: s.color }">
          {{ s.title }}
        </h3>

        <!-- Description -->
        <p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0;">
          {{ s.desc }}
        </p>
      </div>
    </div>
  </section>
</template>