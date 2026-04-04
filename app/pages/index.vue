<script setup lang="ts">
useSeoMeta({
  title: 'ScanPulse — Website Health Scanner',
  description: 'Instant security, performance, and SEO analysis for any website. Free scans, actionable fixes.',
})

const { isSignedIn } = useAuth()
const router = useRouter()

function handleScan() {
  router.push(isSignedIn.value ? '/dashboard' : '/sign-up')
}

// ── Section navigation ─────────────────────────────────
const scrollContainer = ref<HTMLElement | null>(null)
const currentSection = ref(0)

const sections = [
  { index: 0, label: 'Live Feed',   num: '01' },
  { index: 1, label: 'Coverage',    num: '02' },
  { index: 2, label: 'How It Works',num: '03' },
  { index: 3, label: 'Results',     num: '04' },
  { index: 4, label: 'Pricing',     num: '05' },
]

const steps = [
  {
    num: '01',
    title: 'Paste your URL',
    desc: 'Drop any public URL into the scanner. No install, no setup, no waiting.',
    color: '#ec3586',
  },
  {
    num: '02',
    title: 'We scan in seconds',
    desc: '84 checks fire simultaneously across security, performance, SEO, accessibility, DNS, and trust pillars.',
    color: '#ffaa00',
  },
  {
    num: '03',
    title: 'Get exact fixes',
    desc: 'Every failed check comes with a plain-English explanation and a concrete fix.',
    color: '#00d4aa',
  },
]

const sampleIssues = [
  { title: 'CSP header missing',         pillar: 'SECURITY',    status: 'CRITICAL', color: '#ff4757', fix: 'Add Content-Security-Policy header to your server config.' },
  { title: 'HTTPS enforced',             pillar: 'SECURITY',    status: 'PASS',     color: '#00d4aa', fix: null },
  { title: 'TTFB 420ms',                 pillar: 'PERFORMANCE', status: 'WARNING',  color: '#ffaa00', fix: 'Reduce server response time — target under 200ms.' },
  { title: 'Gzip compression on',        pillar: 'PERFORMANCE', status: 'PASS',     color: '#00d4aa', fix: null },
  { title: 'Image dimensions missing',   pillar: 'PERFORMANCE', status: 'CRITICAL', color: '#ff4757', fix: 'Add width/height attributes to all <img> tags.' },
  { title: 'No canonical URL',           pillar: 'SEO',         status: 'CRITICAL', color: '#ff4757', fix: 'Add <link rel="canonical"> to prevent duplicate content.' },
  { title: 'Title tag present',          pillar: 'SEO',         status: 'PASS',     color: '#00d4aa', fix: null },
  { title: 'Multiple H1 tags',           pillar: 'SEO',         status: 'WARNING',  color: '#ffaa00', fix: 'Use a single H1 per page for clear document hierarchy.' },
]

const plans = [
  {
    name: 'Hobby',
    price: '$0',
    period: 'forever',
    color: 'rgba(255,255,255,0.12)',
    accent: 'rgba(255,255,255,0.3)',
    scans: '1 free scan',
    features: ['All 6 pillars · 84 checks', 'Standard PDF report', 'Shareable result links'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$15',
    period: '/ month',
    color: '#ec3586',
    accent: '#ec3586',
    scans: 'Unlimited scans',
    features: ['Unlimited manual scans', 'Automated monitoring (Hourly, Daily, Weekly)', 'Email alerts on score regression', 'Instant specific fix recommendations', 'API access'],
    cta: 'Get Pro',
    highlight: true,
  },
]

const billingPeriod = ref<'monthly' | 'annual'>('monthly')

const displayedPlans = computed(() => plans.map(p => {
  if (billingPeriod.value === 'annual' && p.price !== '$0') {
    const monthly = parseFloat(p.price.replace('$', ''))
    const discounted = (monthly * 0.9).toFixed(2).replace('.00', '')
    return { ...p, price: `$${discounted}`, period: '/ mo · billed annually' }
  }
  return p
}))

function scrollToSection(index: number) {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollTo({
    top: index * window.innerHeight,
    behavior: 'smooth',
  })
}

onMounted(() => {
  const el = scrollContainer.value
  if (!el) return

  let timer: ReturnType<typeof setTimeout> | null = null

  el.addEventListener('scroll', () => {
    // update immediately for live tracking
    currentSection.value = Math.round(el.scrollTop / window.innerHeight)
    // also debounce to catch snap settle
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      currentSection.value = Math.round(el.scrollTop / window.innerHeight)
    }, 80)
  }, { passive: true })
})

const feedItems = [
  { title: 'HTTPS enforced',          pillar: 'SECURITY',    color: '#00d4aa', status: 'PASS',     url: 'stripe.com'   },
  { title: 'HSTS header present',     pillar: 'SECURITY',    color: '#00d4aa', status: 'PASS',     url: 'vercel.com'   },
  { title: 'CSP header missing',      pillar: 'SECURITY',    color: '#ff4757', status: 'CRITICAL', url: 'notion.so'    },
  { title: 'X-Frame-Options set',     pillar: 'SECURITY',    color: '#00d4aa', status: 'PASS',     url: 'linear.app'   },
  { title: 'X-Content-Type-Options',  pillar: 'SECURITY',    color: '#ffaa00', status: 'WARNING',  url: 'github.com'   },
  { title: 'TTFB 420ms',              pillar: 'PERFORMANCE', color: '#ffaa00', status: 'WARNING',  url: 'figma.com'    },
  { title: 'Gzip compression on',     pillar: 'PERFORMANCE', color: '#00d4aa', status: 'PASS',     url: 'shopify.com'  },
  { title: 'Image dimensions missing',pillar: 'PERFORMANCE', color: '#ff4757', status: 'CRITICAL', url: 'airbnb.com'   },
  { title: 'Title tag present',       pillar: 'SEO',         color: '#00d4aa', status: 'PASS',     url: 'stripe.com'   },
  { title: 'Meta description set',    pillar: 'SEO',         color: '#00d4aa', status: 'PASS',     url: 'atlassian.com'},
  { title: 'Multiple H1 tags',        pillar: 'SEO',         color: '#ffaa00', status: 'WARNING',  url: 'github.com'   },
  { title: 'No canonical URL',        pillar: 'SEO',         color: '#ff4757', status: 'CRITICAL', url: 'typeform.com' },
  { title: 'Open Graph tags missing', pillar: 'SEO',         color: '#ffaa00', status: 'WARNING',  url: 'figma.com'    },
  { title: 'SSL certificate valid',   pillar: 'SECURITY',    color: '#00d4aa', status: 'PASS',     url: 'linear.app'   },
  { title: 'Transfer size 4.2MB',     pillar: 'PERFORMANCE', color: '#ff4757', status: 'CRITICAL', url: 'shopify.com'  },
  { title: 'Cache headers missing',   pillar: 'PERFORMANCE', color: '#ffaa00', status: 'WARNING',  url: 'notion.so'    },
]

const feedLoop = [...feedItems, ...feedItems, ...feedItems]

const pillars = [
  {
    id: 'security',
    color: '#00d4aa',
    label: 'Security',
    count: 21,
    desc: 'Spot vulnerabilities before attackers do.',
    checks: ['HTTPS & TLS 1.3', 'HSTS + CSP headers', 'Cookie flags audit', 'SRI on external scripts', 'Sensitive file exposure'],
  },
  {
    id: 'performance',
    color: '#ffaa00',
    label: 'Performance',
    count: 18,
    desc: 'Every millisecond affects your conversion rate.',
    checks: ['Core Web Vitals (LCP, INP, CLS)', 'Gzip / Brotli compression', 'Image format audit (WebP/AVIF)', 'Cache-Control headers', 'Carbon footprint estimate'],
  },
  {
    id: 'seo',
    color: '#6c5ce7',
    label: 'SEO',
    count: 19,
    desc: 'Rank higher with signals search engines reward.',
    checks: ['Title & meta description', 'Open Graph + Twitter Card', 'JSON-LD structured data', 'Canonical + sitemap.xml', 'E-E-A-T signals'],
  },
  {
    id: 'accessibility',
    color: '#a29bfe',
    label: 'Accessibility',
    count: 12,
    desc: 'Reach every user — and pass WCAG audits.',
    checks: ['Alt text coverage', 'Form labels & ARIA', 'Heading hierarchy', 'Skip-nav & landmarks', 'Focus visibility'],
  },
  {
    id: 'dns',
    color: '#74b9ff',
    label: 'DNS & Email',
    count: 8,
    desc: 'Protect your domain and email reputation.',
    checks: ['SPF, DKIM & DMARC', 'MX records present', 'DNSSEC enabled', 'Domain expiry warning', 'IPv6 support'],
  },
  {
    id: 'trust',
    color: '#fd79a8',
    label: 'Trust',
    count: 6,
    desc: 'Build credibility and meet legal requirements.',
    checks: ['Privacy policy link', 'Cookie consent (GDPR)', 'Contact information', 'GPC support', 'Custom 404 page'],
  },
]
</script>

<template>
  <!-- Scroll snap container -->
  <div ref="scrollContainer" class="h-screen overflow-y-scroll snap-container bg-[#07070a]">
    <NavBar />

    <!-- ── Left timeline nav ────────────────────────────────────── -->
    <nav class="fixed left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center" style="gap:0">
      <template v-for="(sec, i) in sections" :key="sec.index">

        <!-- Section entry -->
        <button
          class="timeline-entry group flex items-center gap-3"
          :class="{ active: currentSection === sec.index }"
          @click="scrollToSection(sec.index)"
          :aria-label="`Go to ${sec.label}`"
        >
          <!-- Dot -->
          <div class="timeline-dot" :class="currentSection === sec.index ? 'is-active' : ''" />

        </button>

        <!-- Connector line between entries -->
        <div v-if="i < sections.length - 1" class="timeline-line">
          <div class="timeline-line-fill" :style="{ height: currentSection > i ? '100%' : '0%' }" />
        </div>

      </template>
    </nav>

    <!-- ── Section 1: Hero ──────────────────────────────────────── -->
    <section class="h-screen snap-section flex overflow-hidden">

      <!-- LEFT: Editorial text -->
      <div class="relative z-10 flex flex-col justify-center px-16 xl:px-24 shrink-0" style="width: 44%">

        <!-- Grid lines bg -->
        <div
          class="absolute inset-0 pointer-events-none"
          style="background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px); background-size:64px 64px"
        />

        <!-- Eyebrow -->
        <div class="relative flex items-center gap-3 mb-8">
          <div class="w-7 h-px bg-primary" />
          <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">
            ScanPulse — Website Health
          </span>
        </div>

        <!-- H1 -->
        <h1
          class="font-display font-bold leading-[0.88] tracking-[-0.04em] text-white mb-9"
          style="font-size: clamp(3.4rem, 5.5vw, 5.6rem)"
        >
          Your site's<br />
          <span style="color:#ec3586">vital signs,</span><br />
          live.
        </h1>

        <!-- Subtext -->
        <p
          class="font-body text-white/55 leading-relaxed mb-12"
          style="font-size:clamp(0.9rem,1.2vw,1.05rem); max-width:38ch"
        >
          Security, performance, and SEO — scanned in seconds.
          Know exactly what needs fixing.
        </p>

        <!-- Stats -->
        <div class="flex gap-8 mb-12 flex-wrap">
          <div>
            <div class="font-display font-bold leading-none mb-1.5" style="font-size:2.6rem; color:#00d4aa">84</div>
            <div class="text-[10px] font-display uppercase tracking-[0.12em] text-white/45">Total checks</div>
          </div>
          <div>
            <div class="font-display font-bold leading-none mb-1.5" style="font-size:2.6rem; color:#ffaa00">6</div>
            <div class="text-[10px] font-display uppercase tracking-[0.12em] text-white/45">Categories</div>
          </div>
          <div>
            <div class="font-display font-bold leading-none mb-1.5" style="font-size:2.6rem; color:#6c5ce7">~10s</div>
            <div class="text-[10px] font-display uppercase tracking-[0.12em] text-white/45">Per scan</div>
          </div>
        </div>

        <!-- CTA -->
        <button
          class="self-start bg-primary text-white font-display font-semibold rounded-[9px] transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
          style="padding:17px 40px; font-size:15px; letter-spacing:0.02em"
          @click="handleScan"
        >
          Run free scan →
        </button>

        <!-- Trust chips -->
        <div class="flex items-center gap-5 mt-8 flex-wrap">
          <div v-for="s in ['Free forever', '~10s results', '84 checks']" :key="s" class="flex items-center gap-1.5">
            <div class="w-1 h-1 rounded-full bg-success" />
            <span class="text-white/48 text-[11px] font-body">{{ s }}</span>
          </div>
        </div>

        <!-- Scroll hint -->
        <div class="absolute bottom-8 left-16 xl:left-24 flex items-center gap-3 scroll-hint">
          <div class="scroll-chevron">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 5l4 4 4-4" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="text-[10px] font-display uppercase tracking-[0.16em] text-white/42">What we check</span>
        </div>
      </div>

      <!-- RIGHT: Live feed -->
      <div class="flex-1 relative overflow-hidden border-l border-white/[0.04]">

        <!-- Feed header -->
        <div class="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-7 py-5 border-b border-white/[0.04]" style="background: linear-gradient(to bottom, #07070a 70%, transparent)">
          <span class="text-[10px] font-display font-semibold tracking-[0.18em] uppercase text-white/48">
            Live Scan Results
          </span>
          <div class="flex items-center gap-2 rounded-full border px-3 py-1" style="background:rgba(0,212,170,0.06); border-color:rgba(0,212,170,0.15)">
            <div class="w-1.5 h-1.5 rounded-full bg-[#00d4aa] feed-pulse" />
            <span class="text-[9px] font-display font-semibold tracking-[0.14em] uppercase text-[#00d4aa]">3,847 scans today</span>
          </div>
        </div>

        <!-- Scrolling feed items -->
        <div class="absolute inset-0 overflow-hidden pt-14">
          <div class="feed-scroll flex flex-col gap-1.5 px-5 py-4">
            <div
              v-for="(item, i) in feedLoop"
              :key="i"
              class="rounded-lg px-4 py-3 flex items-center gap-3"
              style="background: rgba(255,255,255,0.022); border-left: 2px solid"
              :style="{ borderLeftColor: item.color }"
            >
              <div class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: item.color }" />
              <div class="flex-1 min-w-0">
                <div class="text-[12px] font-display font-medium text-white/70 truncate">{{ item.title }}</div>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[8px] font-display uppercase tracking-[0.14em] text-white/45">{{ item.pillar }}</span>
                  <span class="text-[9px] font-display font-bold tracking-[0.08em]" :style="{ color: item.color }">{{ item.status }}</span>
                </div>
              </div>
              <div class="text-[9px] font-body shrink-0 text-white/40">{{ item.url }}</div>
            </div>
          </div>
        </div>

        <!-- Fade overlays -->
        <div class="absolute top-14 left-0 right-0 h-12 pointer-events-none z-20" style="background: linear-gradient(to bottom, #07070a, transparent)" />
        <div class="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-20" style="background: linear-gradient(to top, #07070a, transparent)" />
      </div>
    </section>

    <!-- ── Section 2: What we check ─────────────────────────────── -->
    <section class="h-screen snap-section flex overflow-hidden">

      <!-- LEFT: Section intro -->
      <div class="relative flex flex-col justify-center px-16 xl:px-24 shrink-0 border-r border-white/[0.04]" style="width: 44%">

        <!-- Grid lines bg -->
        <div
          class="absolute inset-0 pointer-events-none"
          style="background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px); background-size:64px 64px"
        />

        <div class="relative">
          <p class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary mb-6 flex items-center gap-3">
            <span class="w-7 h-px bg-primary inline-block" />
            Coverage
          </p>
          <h2
            class="font-display font-bold text-white leading-[0.9] tracking-[-0.03em] mb-8"
            style="font-size: clamp(2.8rem, 4.5vw, 4.2rem)"
          >
            84 checks.<br />
            <span class="text-white/50">Six pillars.</span><br />
            One score.
          </h2>
          <p class="font-body text-white/55 leading-relaxed mb-12" style="max-width: 36ch; font-size: 0.95rem">
            Every check maps to a real-world impact — a vulnerability, a lost conversion, or a missed ranking.
          </p>
          <button
            class="inline-flex items-center gap-2 bg-primary text-white font-display font-semibold rounded-[9px] transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02]"
            style="padding:15px 36px; font-size:14px; letter-spacing:0.02em"
            @click="handleScan"
          >
            Start scanning free →
          </button>
        </div>

        <!-- Scroll hint down -->
        <div class="absolute bottom-8 left-16 xl:left-24 flex items-center gap-3 scroll-hint">
          <div class="scroll-chevron">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 5l4 4 4-4" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="text-[10px] font-display uppercase tracking-[0.16em] text-white/42">How it works</span>
        </div>
      </div>

      <!-- RIGHT: Six pillar grid (2 rows × 3 cols) -->
      <div class="flex-1 grid grid-cols-3 grid-rows-2 overflow-hidden">
        <div
          v-for="(pillar, i) in pillars"
          :key="pillar.id"
          class="flex flex-col justify-center px-8 py-10 relative border-white/[0.04]"
          :class="{
            'border-r': i % 3 < 2,
            'border-b': i < 3,
          }"
        >
          <!-- Pillar number -->
          <div
            class="font-display font-bold leading-none mb-1"
            style="font-size: clamp(2.6rem, 4vw, 4rem); letter-spacing: -0.05em;"
            :style="{ color: pillar.color }"
          >
            {{ pillar.count }}
          </div>

          <!-- Label -->
          <div class="font-display font-bold text-white mb-2" style="font-size:1.05rem; letter-spacing:-0.02em">
            {{ pillar.label }}
          </div>

          <!-- Desc -->
          <p class="font-body text-white/50 text-[12px] leading-relaxed mb-4" style="max-width: 22ch">
            {{ pillar.desc }}
          </p>

          <!-- Check list -->
          <ul class="space-y-2">
            <li
              v-for="check in pillar.checks"
              :key="check"
              class="flex items-center gap-2.5"
            >
              <div class="w-1 h-1 rounded-full shrink-0" :style="{ background: pillar.color }" />
              <span class="text-[12px] font-body text-white/55">{{ check }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ── Section 3: How It Works ─────────────────────────────── -->
    <section class="h-screen snap-section relative overflow-hidden flex flex-col">

      <!-- Grid bg -->
      <div class="absolute inset-0 pointer-events-none" style="background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px); background-size:64px 64px" />

      <!-- Header strip -->
      <div class="relative z-10 shrink-0 flex items-center justify-between px-16 xl:px-24 pt-10 pb-8">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-7 h-px bg-primary" />
            <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">How it works</span>
          </div>
          <h2 class="font-display font-bold text-white leading-[0.88] tracking-[-0.04em]" style="font-size: clamp(2.2rem, 3.5vw, 3.2rem)">
            Up and running<br /><span class="text-white/45">in three steps.</span>
          </h2>
        </div>
        <button
          class="shrink-0 bg-primary text-white font-display font-semibold rounded-[9px] transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02]"
          style="padding:14px 32px; font-size:13px; letter-spacing:0.02em"
          @click="handleScan"
        >Try it free →</button>
      </div>

      <!-- Divider -->
      <div class="relative z-10 shrink-0 h-px mx-0 bg-white/[0.04]" />

      <!-- Step columns — fill remaining height -->
      <div class="relative z-10 flex-1 grid grid-cols-3 min-h-0">
        <div
          v-for="(step, i) in steps"
          :key="step.num"
          class="hiw-step relative flex flex-col justify-start px-16 xl:px-20 pt-10 pb-12 overflow-hidden"
          :class="i < steps.length - 1 ? 'border-r border-white/[0.04]' : ''"
        >
          <!-- Radial glow -->
          <div class="absolute inset-0 pointer-events-none" :style="{ background: `radial-gradient(ellipse at 20% 50%, ${step.color}12 0%, transparent 65%)` }" />

          <!-- Ghost number -->
          <div
            class="absolute left-10 bottom-4 font-display font-bold leading-none pointer-events-none select-none"
            style="font-size: 16rem; letter-spacing: -0.06em; opacity: 0.04; line-height: 0.85"
            :style="{ color: step.color }"
          >{{ step.num }}</div>

          <!-- Dot -->
          <div class="flex items-center gap-4 mb-8">
            <div class="hiw-dot w-3 h-3 rounded-full shrink-0" :style="{ background: step.color, boxShadow: `0 0 14px ${step.color}90` }" />
            <div class="flex-1 h-px" style="background: rgba(255,255,255,0.05)" />
          </div>

          <!-- Step label -->
          <div class="font-display font-semibold mb-4 leading-none" style="font-size: 0.7rem; letter-spacing: 0.2em" :style="{ color: step.color }">
            STEP {{ step.num }}
          </div>

          <!-- Title -->
          <div class="font-display font-bold text-white mb-4 leading-[1.1]" style="font-size: clamp(1.4rem, 2vw, 1.85rem); letter-spacing: -0.025em">
            {{ step.title }}
          </div>

          <!-- Desc -->
          <p class="font-body text-white/55 leading-relaxed" style="font-size: 0.93rem; max-width: 26ch">
            {{ step.desc }}
          </p>

          <!-- Bottom accent -->
          <div class="absolute bottom-0 left-0 right-0 h-[1px]" :style="{ background: `linear-gradient(to right, ${step.color}50, transparent 60%)` }" />
        </div>
      </div>

      <!-- Scroll hint -->
      <div class="absolute bottom-6 left-16 xl:left-24 z-20 flex items-center gap-3 scroll-hint">
        <div class="scroll-chevron">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="text-[10px] font-display uppercase tracking-[0.16em] text-white/42">See a result</span>
      </div>
    </section>

    <!-- ── Section 4: Sample Result ──────────────────────────────── -->
    <section class="h-screen snap-section flex overflow-hidden relative">
      <div
        class="absolute inset-0 pointer-events-none"
        style="background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px); background-size:64px 64px"
      />

      <!-- LEFT: context -->
      <div class="relative z-10 flex flex-col justify-center px-16 xl:px-24 shrink-0" style="width: 38%">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-7 h-px bg-primary" />
          <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">Sample result</span>
        </div>

        <h2
          class="font-display font-bold text-white leading-[0.9] tracking-[-0.03em] mb-8"
          style="font-size: clamp(2.2rem, 3.8vw, 3.4rem)"
        >
          Every issue.<br />
          <span class="text-white/50">Exact fix.</span>
        </h2>

        <p class="font-body text-white/55 leading-relaxed mb-12" style="font-size: 0.95rem; max-width: 34ch">
          Each failed check comes with a plain-English explanation so you know exactly what to do.
        </p>

        <!-- Score summary -->
        <div class="flex gap-8 mb-10">
          <div>
            <div class="font-display font-bold leading-none mb-1" style="font-size: 2.8rem; letter-spacing: -0.04em; color: #ec3586">81</div>
            <div class="text-[10px] font-display uppercase tracking-[0.12em] text-white/45">Overall</div>
          </div>
          <div>
            <div class="font-display font-bold leading-none mb-1" style="font-size: 2.8rem; letter-spacing: -0.04em; color: #00d4aa">94</div>
            <div class="text-[10px] font-display uppercase tracking-[0.12em] text-white/45">Security</div>
          </div>
          <div>
            <div class="font-display font-bold leading-none mb-1" style="font-size: 2.8rem; letter-spacing: -0.04em; color: #ffaa00">71</div>
            <div class="text-[10px] font-display uppercase tracking-[0.12em] text-white/45">Perf</div>
          </div>
          <div>
            <div class="font-display font-bold leading-none mb-1" style="font-size: 2.8rem; letter-spacing: -0.04em; color: #6c5ce7">78</div>
            <div class="text-[10px] font-display uppercase tracking-[0.12em] text-white/45">SEO</div>
          </div>
        </div>

        <button
          class="self-start bg-primary text-white font-display font-semibold rounded-[9px] transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02]"
          style="padding:15px 36px; font-size:14px; letter-spacing:0.02em"
          @click="handleScan"
        >
          Scan your site →
        </button>

        <!-- Scroll hint -->
        <div class="absolute bottom-8 left-16 xl:left-24 flex items-center gap-3 scroll-hint">
          <div class="scroll-chevron">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 5l4 4 4-4" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="text-[10px] font-display uppercase tracking-[0.16em] text-white/42">Pricing</span>
        </div>
      </div>

      <!-- RIGHT: issue list -->
      <div class="flex-1 relative border-l border-white/[0.04] flex flex-col justify-center px-10 gap-2 overflow-hidden">
        <!-- URL bar -->
        <div class="flex items-center gap-3 mb-6 px-4 py-3 rounded-lg border border-white/[0.06]" style="background:rgba(255,255,255,0.02)">
          <div class="w-2 h-2 rounded-full bg-[#00d4aa]" />
          <span class="font-body text-white/50 text-sm">stripe.com</span>
          <span class="ml-auto font-display font-semibold text-xs tracking-widest text-white/42">SCAN COMPLETE</span>
        </div>

        <div
          v-for="issue in sampleIssues"
          :key="issue.title"
          class="result-row rounded-lg px-4 py-3.5 border border-transparent"
          :style="issue.status !== 'PASS' ? `border-left-color: ${issue.color}` : ''"
          style="background: rgba(255,255,255,0.02); border-left-width: 2px"
        >
          <div class="flex items-center gap-3">
            <div class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: issue.color }" />
            <span class="font-body text-white/70 text-sm flex-1">{{ issue.title }}</span>
            <span class="text-[9px] font-display font-semibold tracking-[0.12em] uppercase text-white/42 mr-3">{{ issue.pillar }}</span>
            <span
              class="text-[9px] font-display font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded"
              :style="{ color: issue.color, background: `${issue.color}15` }"
            >{{ issue.status }}</span>
          </div>
          <div v-if="issue.fix" class="mt-2 ml-[21px] text-[12px] font-body text-white/48 leading-relaxed">
            {{ issue.fix }}
          </div>
        </div>
      </div>
    </section>

    <!-- ── Section 5: Pricing ───────────────────────────────────── -->
    <section class="h-screen snap-section relative overflow-hidden flex flex-col">

      <!-- Grid bg -->
      <div class="absolute inset-0 pointer-events-none" style="background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px); background-size:64px 64px" />

      <!-- Pro glow — ambient light behind the highlight card -->
      <div class="absolute pointer-events-none" style="top: 10%; left: 33%; width: 34%; height: 80%; background: radial-gradient(ellipse at 50% 30%, rgba(236,53,134,0.07) 0%, transparent 70%)" />

      <!-- Header -->
      <div class="relative z-10 shrink-0 flex items-center justify-between px-16 xl:px-24 pt-10 pb-8">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-7 h-px bg-primary" />
            <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">Pricing</span>
          </div>
          <h2 class="font-display font-bold text-white leading-[0.88] tracking-[-0.04em]" style="font-size: clamp(2.2rem, 3.5vw, 3.2rem)">
            Simple pricing.<br /><span class="text-white/45">No surprises.</span>
          </h2>
        </div>
        <!-- Billing toggle -->
        <button
          class="flex items-center gap-0 rounded-full border border-white/[0.1] overflow-hidden transition-colors"
          style="background: rgba(255,255,255,0.03)"
          @click="billingPeriod = billingPeriod === 'monthly' ? 'annual' : 'monthly'"
        >
          <span
            class="text-[11px] font-display font-semibold tracking-[0.14em] uppercase px-4 py-2 transition-colors"
            :class="billingPeriod === 'monthly' ? 'text-white bg-white/[0.08]' : 'text-white/40'"
          >Monthly</span>
          <span
            class="text-[11px] font-display font-semibold tracking-[0.14em] uppercase px-4 py-2 transition-colors flex items-center gap-2"
            :class="billingPeriod === 'annual' ? 'text-white bg-white/[0.08]' : 'text-white/40'"
          >Annual <span class="text-[9px] font-bold tracking-[0.06em] px-1.5 py-0.5 rounded-full bg-success/15 text-success">−10%</span></span>
        </button>
      </div>

      <!-- Divider -->
      <div class="relative z-10 shrink-0 h-px bg-white/[0.04]" />

      <!-- Plan columns — fill remaining height -->
      <div class="relative z-10 flex-1 grid grid-cols-2 min-h-0">
        <div
          v-for="(plan, i) in displayedPlans"
          :key="plan.name"
          class="pricing-col relative flex flex-col px-12 xl:px-16 pt-10 pb-12 overflow-hidden"
          :class="[i < plans.length - 1 ? 'border-r border-white/[0.04]' : '', plan.highlight ? 'pricing-col--highlight' : '']"
        >
          <!-- Per-column accent glow -->
          <div class="absolute inset-0 pointer-events-none" :style="{ background: `radial-gradient(ellipse at 50% 0%, ${plan.accent}10 0%, transparent 60%)` }" />

          <!-- Top accent line -->
          <div class="absolute top-0 left-0 right-0 h-[2px]" :style="{ background: plan.highlight ? plan.accent : `${plan.accent}30` }" />

          <!-- Plan name + badge -->
          <div class="flex items-center gap-3 mb-8">
            <div class="w-1.5 h-1.5 rounded-full" :style="{ background: plan.accent }" />
            <span class="text-[11px] font-display font-bold tracking-[0.18em] uppercase" :style="{ color: plan.accent }">{{ plan.name }}</span>
            <span v-if="plan.highlight" class="ml-auto text-[9px] font-display font-bold tracking-[0.14em] uppercase px-2 py-0.5 rounded-full" style="background: rgba(236,53,134,0.15); color: #ec3586">Most popular</span>
          </div>

          <!-- Price block -->
          <div class="mb-2">
            <div class="flex items-end gap-2 leading-none">
              <span class="font-display font-bold text-white" style="font-size: 3.8rem; letter-spacing: -0.05em; line-height: 1">{{ plan.price }}</span>
              <span class="font-body text-white/50 text-sm pb-1.5">{{ plan.period }}</span>
            </div>
            <p v-if="billingPeriod === 'annual' && plan.highlight" class="font-body text-white/50 text-[11px] mt-1.5">
              $162 billed annually · <span class="text-success">save $18</span>
            </p>
          </div>

          <!-- Scan limit -->
          <div class="text-[11px] font-display tracking-[0.1em] uppercase mb-8 pb-8 border-b border-white/[0.05]" :style="{ color: plan.accent }">
            {{ plan.scans }}
          </div>

          <!-- Features -->
          <ul class="space-y-4 flex-1">
            <li v-for="f in plan.features" :key="f" class="flex items-start gap-3">
              <svg class="shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2.5 6.5L5 9l5.5-5.5" :stroke="plan.accent" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="text-[13px] font-body text-white/65 leading-snug">{{ f }}</span>
            </li>
          </ul>

          <!-- CTA -->
          <button
            class="w-full rounded-[10px] font-display font-semibold text-[13px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-8"
            :class="plan.highlight ? 'text-white' : 'border text-white/55 hover:text-white/80'"
            :style="plan.highlight
              ? 'background: #ec3586; padding: 14px 0; letter-spacing: 0.02em'
              : `border-color: ${plan.accent}25; padding: 14px 0; letter-spacing: 0.02em`"
            @click="handleScan"
          >{{ plan.cta }}</button>
        </div>
      </div>

      <!-- Back hint -->
      <div class="absolute bottom-6 left-16 xl:left-24 z-20 flex items-center gap-3 opacity-20">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="transform:rotate(180deg)">
          <path d="M3 5l4 4 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="text-[10px] font-display uppercase tracking-[0.16em] text-white">Back to top</span>
      </div>
    </section>

  </div>
</template>

<style scoped>
/* ── Scroll snap ──────────────────────────────────────── */
.snap-container {
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}
/* Hide scrollbar but keep scrolling */
.snap-container::-webkit-scrollbar { display: none; }
.snap-container { -ms-overflow-style: none; scrollbar-width: none; }

.snap-section {
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

/* ── Feed scroll ──────────────────────────────────────── */
@keyframes feedScroll {
  from { transform: translateY(0); }
  to   { transform: translateY(-33.333%); }
}
.feed-scroll {
  animation: feedScroll 28s linear infinite;
}

/* Live pulse dot */
@keyframes feedPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.8); }
}
.feed-pulse {
  animation: feedPulse 1.5s ease-in-out infinite;
}

/* ── Left timeline nav ───────────────────────────────── */
.timeline-entry {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.timeline-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.timeline-dot.is-active {
  width: 10px;
  height: 10px;
  background: #ec3586;
  box-shadow: 0 0 12px rgba(236, 53, 134, 0.6);
}
.timeline-entry:hover .timeline-dot:not(.is-active) {
  background: rgba(255, 255, 255, 0.45);
  width: 7px;
  height: 7px;
}


/* Connector line */
.timeline-line {
  width: 1px;
  height: 120px;
  background: rgba(255, 255, 255, 0.07);
  position: relative;
  overflow: hidden;
  margin: 6px 0;
  align-self: flex-start;
  transform: translateX(4px);
}
.timeline-line-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: #ec3586;
  transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 6px rgba(236, 53, 134, 0.5);
}

/* ── How it works ─────────────────────────────────────── */
@keyframes hiwPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.5); opacity: 0.5; }
}
.hiw-dot {
  animation: hiwPulse 2.4s ease-in-out infinite;
}
.hiw-step:nth-child(2) .hiw-dot { animation-delay: 0.8s; }
.hiw-step:nth-child(3) .hiw-dot { animation-delay: 1.6s; }

/* ── Pricing columns ──────────────────────────────────── */
.pricing-col {
  transition: background 0.2s ease;
}
.pricing-col:hover {
  background: rgba(255, 255, 255, 0.015);
}
.pricing-col--highlight {
  background: rgba(236, 53, 134, 0.03);
}
.pricing-col--highlight:hover {
  background: rgba(236, 53, 134, 0.055);
}

/* ── Scroll hint bounce ───────────────────────────────── */
@keyframes hintBounce {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50%       { transform: translateY(4px); opacity: 0.7; }
}
.scroll-hint {
  animation: hintBounce 2s ease-in-out infinite;
}
.scroll-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.1);
}
</style>
