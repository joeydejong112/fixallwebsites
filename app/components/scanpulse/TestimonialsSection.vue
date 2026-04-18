<script setup lang="ts">
const router = useRouter()

const quotes = [
  { by: 'Kira M.', role: 'Head of Platform, orbital.studio', color: '#ec3586',
    q: 'We fixed 38 points of security score in a Wednesday afternoon. The CSP Builder alone paid for the year.' },
  { by: 'Ana O.',  role: 'Staff Engineer, harbor.build',      color: '#74b9ff',
    q: 'Every other audit tool hands me a PDF to cry over. ScanPulse hands me the file I paste into nginx.' },
  { by: 'Sam R.',  role: 'SEO Lead, meridian.work',            color: '#6c5ce7',
    q: 'The per-pillar color coding is the actual product. I can scan a client in 10 seconds and know exactly who to loop in.' },
  { by: 'Jess T.', role: 'Founder, kindred.studio',            color: '#00d4aa',
    q: 'Monitoring emailed me about a regressed HSTS header before the deploy finished rolling out. Saved us a week.' },
]

function handleScan() {
  router.push('/sign-up')
}
</script>

<template>
  <section class="relative grid-bg" style="padding:120px 80px 120px 140px;">
    <!-- Header -->
    <div style="max-width:720px;margin-bottom:60px;">
      <div class="eyebrow">Teams on ScanPulse</div>
      <h2 class="display" style="font-size:64px;margin:20px 0 16px;">
        Scores, up and to the right.
      </h2>
    </div>

    <!-- Quote cards -->
    <div class="grid gap-5" style="grid-template-columns:repeat(2,1fr);">
      <div
        v-for="(q, i) in quotes"
        :key="i"
        class="card lift relative"
        style="padding:30px 30px 28px;border-left:2px solid"
        :style="{ borderLeftColor: q.color }"
      >
        <!-- Quote mark watermark -->
        <svg
          class="absolute top-[22px] right-6"
          width="28" height="28" viewBox="0 0 24 24"
          :fill="q.color"
          style="opacity:0.15;"
        >
          <path d="M8 6C5 6 3 8 3 11v7h7v-7H7c0-1.5 1-2.5 2.5-3L8 6zm9 0c-3 0-5 2-5 5v7h7v-7h-3c0-1.5 1-2.5 2.5-3L17 6z"/>
        </svg>

        <!-- Quote text -->
        <p
          class="font-display font-medium"
          style="font-size:20px;line-height:1.45;margin:0 0 22px;letter-spacing:-0.02em;"
        >
          "{{ q.q }}"
        </p>

        <!-- Author -->
        <div class="flex items-center gap-3">
          <div
            class="w-[34px] h-[34px] rounded-full flex items-center justify-center font-display font-bold text-white text-[12px]"
            :style="{ background: q.color }"
          >{{ q.by.split(' ').map((s: string) => s[0]).join('') }}</div>
          <div>
            <div class="font-display font-semibold text-white" style="font-size:14px;">{{ q.by }}</div>
            <div style="font-size:12px;color:var(--text-muted);">{{ q.role }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>