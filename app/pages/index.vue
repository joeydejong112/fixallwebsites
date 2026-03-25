<script setup lang="ts">
useSeoMeta({
  title: 'ScanPulse — Website Health Scanner',
  description: 'Instant security, performance, and SEO analysis for any website. Free scans, actionable fixes.',
})

const { isSignedIn } = useAuth()
const router = useRouter()

const openFaq = ref<number | null>(null)
const heroUrl = ref('')

const faqs = [
  { q: 'How accurate are the security checks?', a: 'We detect publicly visible vulnerabilities — SSL/TLS, security headers, HTTPS enforcement, and known misconfigurations. For production apps handling sensitive data, pair ScanPulse with a full penetration test.' },
  { q: 'Is ScanPulse free?', a: 'Basic scans are completely free with no account required. Sign up for scan history, monitoring alerts, PDF reports, and scheduled scans.' },
  { q: 'Do you need to install anything on my site?', a: 'Nothing. ScanPulse scans entirely from the outside — the same way search engines and attackers see your site.' },
  { q: 'How is the performance score calculated?', a: 'We measure time-to-first-byte, compression, image optimisation, and caching headers — signals that directly affect Core Web Vitals and user experience.' },
  { q: 'Can I scan any website?', a: 'Any publicly accessible site. Many users scan competitor sites to benchmark their own performance.' },
]

function handleScan(url: string) {
  if (isSignedIn.value) {
    router.push(`/results?url=${encodeURIComponent(url)}`)
  } else {
    router.push(`/sign-up`)
  }
}

const checks = [
  { pillar: 'security', color: '#00d4aa', label: 'Security', items: ['HTTPS & SSL', 'Security headers', 'X-Frame-Options', 'Content-Security-Policy', 'HSTS enforcement'] },
  { pillar: 'performance', color: '#ffaa00', label: 'Performance', items: ['Time to first byte', 'Compression (gzip/br)', 'Image dimensions', 'Cache headers', 'Transfer size'] },
  { pillar: 'seo', color: '#6c5ce7', label: 'SEO', items: ['Title & meta tags', 'H1 structure', 'Canonical URLs', 'Open Graph tags', 'Robots meta'] },
]
</script>

<template>
  <div class="min-h-screen bg-dark overflow-x-hidden">
    <NavBar />

    <!-- ── Hero ───────────────────────────────────────────────── -->
    <section class="relative min-h-screen flex items-center">

      <!-- Background orb -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          class="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full"
          style="background: radial-gradient(circle, rgba(236,53,134,0.12) 0%, rgba(108,92,231,0.06) 45%, transparent 70%)"
        />
        <div
          class="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
          style="background: radial-gradient(circle, rgba(0,212,170,0.07) 0%, transparent 65%)"
        />
        <!-- Grid lines -->
        <div class="absolute inset-0" style="background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 60px 60px;" />
      </div>

      <div class="relative z-10 w-full max-w-7xl mx-auto px-6 pt-28 pb-16 grid lg:grid-cols-2 gap-16 items-center">

        <!-- Left: copy + input -->
        <div>
          <div class="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span class="text-white/50 text-xs font-display tracking-wide">Live scanning · No install required</span>
          </div>

          <h1 class="font-display font-bold leading-[0.9] mb-8" style="font-size: clamp(3.6rem, 7.5vw, 6.2rem)">
            Your site's<br />health,<br />
            <em class="not-italic" style="color: #ec3586; font-size: 1.08em; letter-spacing: -0.02em">revealed.</em>
          </h1>

          <p class="text-white/40 font-body leading-relaxed mb-10" style="font-size: clamp(1rem, 1.4vw, 1.1rem); max-width: 44ch">
            Security vulnerabilities, performance bottlenecks, and SEO gaps —
            surfaced with actionable fixes, not just scores.
          </p>

          <div>
            <div class="flex items-center gap-2 mb-3">
              <div class="w-0.5 h-4 bg-primary rounded-full" />
              <span class="text-white/30 text-[10px] font-display uppercase tracking-[0.18em]">Target URL</span>
            </div>
            <ScanInput size="lg" @scan="handleScan" />
          </div>

          <!-- Trust signals -->
          <div class="mt-8 flex items-center gap-5 flex-wrap">
            <div v-for="sig in ['Free forever', '~10s results', '15+ checks']" :key="sig" class="flex items-center gap-1.5">
              <div class="w-1 h-1 rounded-full bg-success" />
              <span class="text-white/30 text-xs font-body">{{ sig }}</span>
            </div>
          </div>
        </div>

        <!-- Right: radar visualisation -->
        <div class="hidden lg:flex items-center justify-center relative">
          <div class="relative w-[560px] h-[560px]">
            <!-- Outer glow — stronger -->
            <div class="absolute inset-[-40px] rounded-full" style="background: radial-gradient(circle, rgba(236,53,134,0.13) 0%, rgba(108,92,231,0.05) 45%, transparent 70%)" />

            <!-- Animated radar SVG -->
            <svg viewBox="0 0 480 480" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#16161e" />
                  <stop offset="100%" stop-color="#07070a" />
                </radialGradient>
                <linearGradient id="sweepFill" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#ec3586" stop-opacity="0" />
                  <stop offset="70%" stop-color="#ec3586" stop-opacity="0.18" />
                  <stop offset="100%" stop-color="#ec3586" stop-opacity="0" />
                </linearGradient>
              </defs>

              <!-- Background circle -->
              <circle cx="240" cy="240" r="235" fill="url(#radarBg)" stroke="rgba(255,255,255,0.05)" stroke-width="1" />

              <!-- Concentric rings -->
              <circle cx="240" cy="240" r="60"  fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
              <circle cx="240" cy="240" r="110" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
              <circle cx="240" cy="240" r="165" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
              <circle cx="240" cy="240" r="220" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />

              <!-- Crosshairs -->
              <line x1="240" y1="10"  x2="240" y2="470" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
              <line x1="10"  y1="240" x2="470" y2="240" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
              <line x1="70"  y1="70"  x2="410" y2="410" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
              <line x1="410" y1="70"  x2="70"  y2="410" stroke="rgba(255,255,255,0.03)" stroke-width="1" />

              <!-- Radar sweep (CSS animated) -->
              <g style="transform-origin: 240px 240px; animation: radarSpin 5s linear infinite">
                <path d="M240 240 L240 25 A215 215 0 0 1 455 240 Z" fill="url(#sweepFill)" />
                <line x1="240" y1="240" x2="240" y2="25" stroke="#ec3586" stroke-width="1.5" stroke-opacity="0.7" />
              </g>

              <!-- Security hits — teal -->
              <circle cx="310" cy="130" r="5" fill="#00d4aa" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="3s" begin="0s" repeatCount="indefinite" />
              </circle>
              <circle cx="310" cy="130" r="12" fill="none" stroke="#00d4aa" stroke-width="1" opacity="0.4">
                <animate attributeName="r" values="8;18;8" dur="3s" begin="0s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" begin="0s" repeatCount="indefinite" />
              </circle>

              <!-- Performance hits — amber -->
              <circle cx="160" cy="300" r="4" fill="#ffaa00" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="4s" begin="1.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="160" cy="300" r="10" fill="none" stroke="#ffaa00" stroke-width="1" opacity="0.4">
                <animate attributeName="r" values="6;16;6" dur="4s" begin="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="4s" begin="1.2s" repeatCount="indefinite" />
              </circle>

              <!-- SEO hits — purple -->
              <circle cx="355" cy="320" r="4" fill="#6c5ce7" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="3.5s" begin="0.7s" repeatCount="indefinite" />
              </circle>
              <circle cx="355" cy="320" r="10" fill="none" stroke="#6c5ce7" stroke-width="1" opacity="0.4">
                <animate attributeName="r" values="6;16;6" dur="3.5s" begin="0.7s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="3.5s" begin="0.7s" repeatCount="indefinite" />
              </circle>

              <!-- Center dot -->
              <circle cx="240" cy="240" r="5" fill="#ec3586">
                <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="240" cy="240" r="14" fill="none" stroke="#ec3586" stroke-width="1" opacity="0.3">
                <animate attributeName="r" values="10;20;10" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>

            <!-- Floating score cards — more dramatic -->
            <div class="absolute top-6 left-[-16px] bg-dark-elevated border border-white/8 rounded-xl px-5 py-3.5 shadow-elevation-lg">
              <p class="text-[9px] font-display uppercase tracking-[0.16em] text-security mb-2">Security</p>
              <p class="text-4xl font-display font-bold text-white leading-none">94</p>
            </div>
            <div class="absolute bottom-24 left-[-8px] bg-dark-elevated border border-white/8 rounded-xl px-5 py-3.5 shadow-elevation-lg">
              <p class="text-[9px] font-display uppercase tracking-[0.16em] text-performance mb-2">Performance</p>
              <p class="text-4xl font-display font-bold text-white leading-none">71</p>
            </div>
            <div class="absolute bottom-6 right-[-8px] bg-dark-elevated border border-white/8 rounded-xl px-5 py-3.5 shadow-elevation-lg">
              <p class="text-[9px] font-display uppercase tracking-[0.16em] text-seo mb-2">SEO</p>
              <p class="text-4xl font-display font-bold text-white leading-none">88</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
        <span class="text-[10px] font-display tracking-widest text-white uppercase">Scroll</span>
        <div class="w-px h-8 bg-white/30" style="animation: float 2s ease-in-out infinite" />
      </div>
    </section>

    <!-- ── Stats ticker ────────────────────────────────────────── -->
    <div class="border-y border-dark-border bg-dark-surface/60 py-4 px-6 overflow-x-auto">
      <div class="max-w-6xl mx-auto flex items-center gap-0">
        <div
          v-for="(stat, i) in [
            { value: '15+', label: 'checks per scan' },
            { value: '3', label: 'analysis pillars' },
            { value: '~10s', label: 'average scan time' },
            { value: 'Free', label: 'no card required' },
          ]"
          :key="i"
          class="flex items-center gap-3 flex-shrink-0"
        >
          <span class="font-display font-bold text-white text-sm">{{ stat.value }}</span>
          <span class="text-white/25 text-xs font-body">{{ stat.label }}</span>
          <div v-if="i < 3" class="w-px h-3 bg-white/10 mx-5" />
        </div>
      </div>
    </div>

    <!-- ── What we check ──────────────────────────────────────── -->
    <section class="py-24 px-6 border-b border-dark-border">
      <div class="max-w-6xl mx-auto">
        <div class="mb-16">
          <p class="text-primary text-[10px] font-display uppercase tracking-[0.18em] mb-4">Coverage</p>
          <h2 class="font-display font-bold text-white mb-4" style="font-size: clamp(2.2rem, 3.5vw, 3rem)">15+ checks across three pillars</h2>
          <p class="text-white/35 font-body" style="max-width: 44ch">Every check maps to a real-world impact — vulnerability, user experience, or search ranking.</p>
        </div>

        <!-- Horizontal strips — one per pillar -->
        <div class="divide-y divide-dark-border">
          <div
            v-for="check in checks"
            :key="check.pillar"
            class="flex items-start gap-8 md:gap-20 py-10 group hover:bg-dark-surface/40 transition-colors duration-300 -mx-4 px-4 rounded-lg"
          >
            <!-- Pillar name — left, large -->
            <div class="flex-shrink-0 w-32 md:w-44">
              <div class="w-2 h-2 rounded-full mb-3" :style="{ background: check.color }" />
              <h3
                class="font-display font-bold text-white leading-[1.05]"
                style="font-size: clamp(1.4rem, 2.5vw, 2rem)"
              >{{ check.label }}</h3>
            </div>
            <!-- Check items — pill list -->
            <ul class="flex flex-wrap gap-2 pt-1 flex-1">
              <li
                v-for="item in check.items"
                :key="item"
                class="text-sm font-body text-white/40 px-3 py-1.5 border border-white/[0.07] rounded-full transition-colors group-hover:text-white/60 group-hover:border-white/[0.14]"
              >{{ item }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Example result ─────────────────────────────────────── -->
    <section class="py-24 px-6">
      <div class="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <p class="text-primary text-[10px] font-display uppercase tracking-[0.18em] mb-4">What you get</p>
          <h2 class="font-display font-bold text-white mb-6" style="font-size: clamp(2.2rem, 3.5vw, 3rem); line-height: 1.05">
            Scores you can act on,<br />not just look at.
          </h2>
          <p class="text-white/45 font-body leading-relaxed mb-8" style="max-width: 42ch">
            Every finding includes a plain-English explanation and a specific
            fix — so you know exactly what to do next, not just what's broken.
          </p>
          <NuxtLink to="/sign-up" class="btn-primary inline-flex">Start scanning free →</NuxtLink>
        </div>

        <!-- Mock result card -->
        <div class="bg-dark-surface border border-dark-border rounded-card p-6 shadow-elevation-lg">
          <div class="flex items-center justify-between mb-6 pb-5 border-b border-dark-border">
            <div>
              <p class="text-white/30 text-xs font-body mb-1">Scan result</p>
              <p class="text-white font-display font-medium text-sm">example.com</p>
            </div>
            <div class="text-right">
              <p class="text-white/30 text-xs font-body mb-1">Overall</p>
              <p class="text-3xl font-display font-bold text-warning">74</p>
            </div>
          </div>

          <!-- Score bars -->
          <div class="space-y-4 mb-6">
            <div v-for="s in [{ label: 'Security', score: 60, color: '#00d4aa' }, { label: 'Performance', score: 80, color: '#ffaa00' }, { label: 'SEO', score: 75, color: '#6c5ce7' }]" :key="s.label">
              <div class="flex justify-between mb-1.5">
                <span class="text-xs font-display text-white/50">{{ s.label }}</span>
                <span class="text-xs font-display font-semibold text-white">{{ s.score }}</span>
              </div>
              <div class="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all" :style="{ width: s.score + '%', background: s.color }" />
              </div>
            </div>
          </div>

          <!-- Sample issues -->
          <div class="space-y-2">
            <div class="flex items-start gap-3 p-3 rounded-lg bg-dark-elevated">
              <span class="mt-0.5 w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
              <div>
                <p class="text-white text-xs font-display font-medium">Missing Content-Security-Policy</p>
                <p class="text-white/35 text-xs font-body mt-0.5">Add a CSP header to prevent XSS attacks.</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3 rounded-lg bg-dark-elevated">
              <span class="mt-0.5 w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
              <div>
                <p class="text-white text-xs font-display font-medium">No compression detected</p>
                <p class="text-white/35 text-xs font-body mt-0.5">Enable gzip or Brotli to reduce transfer size.</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3 rounded-lg bg-dark-elevated">
              <span class="mt-0.5 w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
              <div>
                <p class="text-white text-xs font-display font-medium">HTTPS enforced</p>
                <p class="text-white/35 text-xs font-body mt-0.5">SSL certificate is valid and HTTPS is active.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FAQ ────────────────────────────────────────────────── -->
    <section class="py-24 px-6 border-t border-dark-border">
      <div class="max-w-3xl mx-auto">
        <p class="text-primary text-xs font-display uppercase tracking-widest mb-3">FAQ</p>
        <h2 class="font-display font-bold text-white mb-12" style="font-size: clamp(1.8rem, 3vw, 2.4rem)">Common questions</h2>

        <div class="divide-y divide-dark-border">
          <div
            v-for="(faq, i) in faqs"
            :key="i"
            class="py-5 cursor-pointer group"
            @click="openFaq = openFaq === i ? null : i"
          >
            <div class="flex items-center justify-between gap-4">
              <span
                class="font-display font-medium text-white/70 group-hover:text-white transition-colors"
                style="font-size: 0.95rem"
              >{{ faq.q }}</span>
              <div
                class="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                :class="openFaq === i ? 'border-primary bg-primary/10' : ''"
              >
                <svg
                  class="w-2.5 h-2.5 text-white/40 transition-transform duration-200"
                  :class="openFaq === i ? 'rotate-45 text-primary' : ''"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16M4 12h16" />
                </svg>
              </div>
            </div>
            <div
              class="overflow-hidden transition-all duration-300"
              :style="{ maxHeight: openFaq === i ? '200px' : '0', opacity: openFaq === i ? 1 : 0 }"
            >
              <p class="text-white/45 font-body text-sm leading-relaxed pt-3" style="max-width: 56ch">{{ faq.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Footer ─────────────────────────────────────────────── -->
    <footer class="border-t border-dark-border py-10 px-6">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <Logo :animate="false" class="w-7 h-7 opacity-60" />
          <span class="font-display text-white/30 text-sm">ScanPulse</span>
        </div>
        <p class="text-white/20 text-xs font-body">© 2026 ScanPulse. Free website health scanning.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes radarSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes float {
  0%, 100% { transform: scaleY(1); opacity: 0.3; }
  50% { transform: scaleY(1.5); opacity: 0.6; }
}
</style>
