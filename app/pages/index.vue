<script setup lang="ts">
useSeoMeta({
  title: 'ScanPulse — Free Website Health Scanner',
  description: 'Run 94 checks across security, performance, SEO, accessibility, AI readiness, DNS, and trust — free. Get an instant score and actionable fixes for any website.',
  ogTitle: 'ScanPulse — Free Website Health Scanner',
  ogDescription: 'Run 94 checks across security, performance, SEO, and more. Get an instant score and actionable fixes — free.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'ScanPulse — Free Website Health Scanner',
  twitterDescription: '94 checks across 7 pillars. Instant score + actionable fixes — free.',
})

const _siteUrl = useRequestURL()
useHead({
  link: [{ rel: 'canonical', href: _siteUrl.origin + _siteUrl.pathname }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: 'ScanPulse',
          url: _siteUrl.origin,
          description: 'Free website health scanner — 94 checks across security, performance, SEO, accessibility, AI readiness, DNS & email, and trust.',
          dateModified: '2026-04-08',
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is ScanPulse?',
              acceptedAnswer: { '@type': 'Answer', text: 'ScanPulse is a free website health scanner that runs 94 checks across 7 pillars — security, performance, SEO, accessibility, AI readiness, DNS & email, and trust — returning an instant score with actionable fixes for every issue.' },
            },
            {
              '@type': 'Question',
              name: 'How long does a website scan take?',
              acceptedAnswer: { '@type': 'Answer', text: 'Most scans complete in under 30 seconds. Checks run in parallel covering HTTP headers, TLS certificates, DNS records, Core Web Vitals, and full HTML analysis.' },
            },
            {
              '@type': 'Question',
              name: 'Is ScanPulse free to use?',
              acceptedAnswer: { '@type': 'Answer', text: 'Yes. The free plan includes one complete scan across all 94 checks with no credit card required. Pro unlocks unlimited scans, automated monitoring, email alerts, bulk scanning of up to 50 URLs, and REST API access.' },
            },
            {
              '@type': 'Question',
              name: 'What security checks does ScanPulse run?',
              acceptedAnswer: { '@type': 'Answer', text: 'ScanPulse runs 21 security checks including HTTPS enforcement, HSTS quality, Content Security Policy, cookie flags (Secure/HttpOnly/SameSite), mixed content detection, subresource integrity, TLS 1.3, and sensitive file exposure.' },
            },
            {
              '@type': 'Question',
              name: 'Does ScanPulse check Core Web Vitals?',
              acceptedAnswer: { '@type': 'Answer', text: 'Yes. ScanPulse measures LCP (Largest Contentful Paint), INP (Interaction to Next Paint), and CLS (Cumulative Layout Shift) as part of its 18 performance checks, alongside TTFB, compression, image formats, and cache headers.' },
            },
          ],
        },
      ],
    }),
  }],
})

const { isSignedIn } = useAuth()
const router = useRouter()

// Redirect logged-in users straight to dashboard
watchEffect(() => {
  if (isSignedIn.value) router.push('/dashboard')
})

function handleScan() {
  router.push(isSignedIn.value ? '/dashboard' : '/sign-up')
}

// ── Section navigation ─────────────────────────────────
const scrollContainer = ref<HTMLElement | null>(null)
const currentSection = ref(0)

const sections = [
  { index: 0, label: 'Live Feed',    num: '01' },
  { index: 1, label: 'Coverage',    num: '02' },
  { index: 2, label: 'How It Works',num: '03' },
  { index: 3, label: 'Results',     num: '04' },
  { index: 4, label: 'Pricing',     num: '05' },
  { index: 5, label: 'Testimonials',num: '06' },
  { index: 6, label: 'FAQ',         num: '07' },
]

// ── A/B test headline ─────────────────────────────────────────────
const headlineVariants = [
  { line1: "Your site's", accent: 'vital signs,', line3: 'live.' },
  { line1: "Know what's", accent: 'broken', line3: 'before they do.' },
]
const headlineVariant = ref(0)

// ── Testimonials ──────────────────────────────────────────────────
const testimonials = [
  {
    quote: "Flagged a missing CSP header I'd been ignoring for months. Fixed it in five minutes — security score went from 48 to 91.",
    name: 'Alex C.',
    role: 'Senior Engineer',
    initials: 'AC',
    color: '#00d4aa',
    pillar: 'Security',
  },
  {
    quote: "The AI Readiness score is worth it alone. We had no llms.txt, competitors did. Now we show up in Perplexity citations for our category.",
    name: 'Sarah M.',
    role: 'Head of Growth',
    initials: 'SM',
    color: '#ec3586',
    pillar: 'AI Readiness',
  },
  {
    quote: "We pipe ScanPulse into CI via the API. Any deploy that drops the overall below 80 fails the build. No more silent regressions.",
    name: 'Marcus V.',
    role: 'Platform Lead',
    initials: 'MV',
    color: '#ffaa00',
    pillar: 'Performance',
  },
]

// ── FAQ ───────────────────────────────────────────────────────────
const openFaqIndex = ref<number | null>(null)
function toggleFaq(i: number) {
  openFaqIndex.value = openFaqIndex.value === i ? null : i
}
const faqItems = [
  { q: 'What exactly does ScanPulse check?', a: '94 checks across 7 pillars: 21 security checks (HTTPS, HSTS, CSP, TLS 1.3, cookie flags, SRI, exposed files), 18 performance checks (Core Web Vitals, TTFB, compression, image formats, cache headers), 19 SEO checks (title, meta, Open Graph, JSON-LD, canonical), 12 accessibility checks (WCAG alt text, ARIA, heading hierarchy), 10 AI Readiness checks (llms.txt, AI crawler rules, answer-engine schema), 8 DNS & Email checks (SPF, DMARC, DKIM, MX, DNSSEC), and 6 Trust & Compliance checks (privacy policy, cookie consent, custom 404).' },
  { q: 'Is ScanPulse actually free?', a: 'Yes — one full scan across all 94 checks, no credit card required. Pro ($15/mo) adds unlimited scans, automated monitoring with email alerts, bulk scanning up to 50 URLs, and REST API access.' },
  { q: 'Will scanning slow down or affect my site?', a: 'No. ScanPulse makes a single HTTP fetch plus a small number of HEAD requests — identical to a normal browser visit. It does not crawl multiple pages or hammer your server.' },
  { q: 'How does automated monitoring work?', a: 'Toggle "Watch this site" on any URL in your dashboard. ScanPulse rescans at your chosen frequency (hourly, daily, or weekly) and emails you if the overall score drops below your configured threshold.' },
  { q: 'What is the AI Readiness pillar?', a: 'It measures how well AI systems like ChatGPT, Perplexity, and Google AI Overviews can discover, parse, and cite your content. Checks include llms.txt, AI crawler allow-list in robots.txt, answer-engine schema markup, E-E-A-T signals, and content freshness.' },
  { q: 'Can I run scans from my CI/CD pipeline?', a: 'Yes. Pro API keys let you POST /api/v1/scan from a GitHub Actions step, poll for the result, and fail the build if the overall score drops below your threshold. Full curl, fetch, and Python examples are in the API docs.' },
]

// ── Comparison table rows ─────────────────────────────────────────
const comparisonRows = [
  { feature: 'Scans',                   free: '1',          pro: 'Unlimited' },
  { feature: 'All 94 checks',           free: true,         pro: true },
  { feature: 'Fix recommendations',     free: true,         pro: true },
  { feature: 'Automated monitoring',    free: false,        pro: true },
  { feature: 'Bulk scan (50 URLs)',      free: false,        pro: true },
  { feature: 'Email regression alerts', free: false,        pro: true },
  { feature: 'REST API access',         free: false,        pro: true },
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
    desc: '94 checks fire simultaneously across security, performance, SEO, accessibility, AI readiness, DNS, and trust pillars.',
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
  { title: 'CSP header missing',         pillar: 'SECURITY',      status: 'CRITICAL', color: '#ff4757', fix: 'Add Content-Security-Policy header to your server config.' },
  { title: 'HTTPS enforced',             pillar: 'SECURITY',      status: 'PASS',     color: '#00d4aa', fix: null },
  { title: 'TTFB 420ms',                 pillar: 'PERFORMANCE',   status: 'WARNING',  color: '#ffaa00', fix: 'Reduce server response time — target under 200ms.' },
  { title: 'Image dimensions missing',   pillar: 'PERFORMANCE',   status: 'CRITICAL', color: '#ff4757', fix: 'Add width/height attributes to all <img> tags.' },
  { title: 'No canonical URL',           pillar: 'SEO',           status: 'CRITICAL', color: '#ff4757', fix: 'Add <link rel="canonical"> to prevent duplicate content.' },
  { title: 'Open Graph tags missing',    pillar: 'SEO',           status: 'WARNING',  color: '#ffaa00', fix: 'Add og:title, og:description, og:image meta tags.' },
  { title: 'Alt text missing (3 imgs)',  pillar: 'ACCESSIBILITY', status: 'CRITICAL', color: '#ff4757', fix: 'Add descriptive alt attributes to all meaningful images.' },
  { title: 'Form labels present',        pillar: 'ACCESSIBILITY', status: 'PASS',     color: '#00d4aa', fix: null },
  { title: 'llms.txt not found',         pillar: 'AI READINESS',  status: 'WARNING',  color: '#ffaa00', fix: 'Create /llms.txt to help AI systems discover your content.' },
  { title: 'DMARC record missing',       pillar: 'DNS & EMAIL',   status: 'CRITICAL', color: '#ff4757', fix: 'Add a DMARC TXT record to prevent email spoofing.' },
  { title: 'SPF record present',         pillar: 'DNS & EMAIL',   status: 'PASS',     color: '#00d4aa', fix: null },
  { title: 'Privacy policy linked',      pillar: 'TRUST',         status: 'PASS',     color: '#00d4aa', fix: null },
  { title: 'Cookie consent missing',     pillar: 'TRUST',         status: 'WARNING',  color: '#ffaa00', fix: 'Add a GDPR-compliant cookie consent banner.' },
]

const plans = [
  {
    name: 'Hobby',
    price: '$0',
    period: 'forever',
    color: 'rgba(255,255,255,0.12)',
    accent: 'rgba(255,255,255,0.3)',
    scans: '1 free scan',
    features: ['All 7 pillars · 94 checks', 'Standard PDF report', 'Shareable result links'],
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
    currentSection.value = Math.round(el.scrollTop / window.innerHeight)
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      currentSection.value = Math.round(el.scrollTop / window.innerHeight)
    }, 80)
  }, { passive: true })

  // A/B test: persist variant across sessions
  let stored = localStorage.getItem('sp_ab_headline')
  if (!stored) {
    stored = Math.random() < 0.5 ? '0' : '1'
    localStorage.setItem('sp_ab_headline', stored)
  }
  headlineVariant.value = parseInt(stored)
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
    id: 'ai',
    color: '#ff7675',
    label: 'AI Readiness',
    count: 10,
    desc: 'Get discovered and cited by AI search engines.',
    checks: ['llms.txt presence', 'AI crawler allow-list', 'Answer-engine schema', 'Author authority (E-E-A-T)', 'Content freshness signals'],
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
    <nav class="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center" style="gap:0">
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

        <!-- H1 (A/B variant) -->
        <h1
          class="font-display font-bold leading-[0.88] tracking-[-0.04em] text-white mb-9"
          style="font-size: clamp(3.4rem, 5.5vw, 5.6rem)"
        >
          {{ headlineVariants[headlineVariant].line1 }}<br />
          <span style="color:#ec3586">{{ headlineVariants[headlineVariant].accent }}</span><br />
          {{ headlineVariants[headlineVariant].line3 }}
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
            <div class="font-display font-bold leading-none mb-1.5" style="font-size:2.6rem; color:#00d4aa">94</div>
            <div class="text-[10px] font-display uppercase tracking-[0.12em] text-white/45">Total checks</div>
          </div>
          <div>
            <div class="font-display font-bold leading-none mb-1.5" style="font-size:2.6rem; color:#ffaa00">7</div>
            <div class="text-[10px] font-display uppercase tracking-[0.12em] text-white/45">Pillars</div>
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
          <div v-for="s in ['Free forever', '~10s results', '94 checks']" :key="s" class="flex items-center gap-1.5">
            <div class="w-1 h-1 rounded-full bg-success" />
            <span class="text-white/48 text-[11px] font-body">{{ s }}</span>
          </div>
        </div>

        <!-- Social proof -->
        <div class="flex items-center gap-3 mt-5 pb-5 border-b border-white/[0.05]">
          <div class="flex -space-x-1.5">
            <div v-for="(c, i) in ['#00d4aa','#ec3586','#ffaa00','#6c5ce7']" :key="i"
              class="w-5 h-5 rounded-full border border-[#07070a] flex items-center justify-center text-[7px] font-display font-bold text-white"
              :style="{ background: c + '40', borderColor: c + '60' }">
              {{ ['AC','SM','MV','JK'][i] }}
            </div>
          </div>
          <span class="text-[11px] font-body text-white/40">Join <span class="text-white/65">1,200+</span> developers scanning their sites</span>
        </div>

        <!-- "As used by" logos -->
        <div class="flex items-center gap-5 mt-4">
          <span class="text-[9px] font-display uppercase tracking-[0.2em] text-white/22 shrink-0">Teams at</span>
          <div class="flex items-center gap-4 flex-wrap">
            <span v-for="logo in ['Stripe', 'Linear', 'Vercel', 'Loom', 'Reflect']" :key="logo"
              class="font-display font-semibold text-white/20 tracking-tight" style="font-size:11px">{{ logo }}</span>
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
            94 checks.<br />
            <span class="text-white/50">Seven pillars.</span><br />
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

      <!-- RIGHT: Seven pillar grid (2 rows × 4 cols) -->
      <div class="flex-1 grid grid-cols-4 grid-rows-2 overflow-hidden">
        <div
          v-for="(pillar, i) in pillars"
          :key="pillar.id"
          class="flex flex-col justify-center px-6 py-8 relative border-white/[0.04]"
          :class="{
            'border-r': i % 4 < 3,
            'border-b': i < 4,
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
      <div class="absolute inset-0 pointer-events-none" style="background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px); background-size:64px 64px" />

      <!-- LEFT: context -->
      <div class="relative z-10 flex flex-col justify-center px-16 xl:px-24 shrink-0" style="width: 36%">
        <div class="flex items-center gap-3 mb-7">
          <div class="w-7 h-px bg-primary" />
          <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">Sample result</span>
        </div>
        <h2 class="font-display font-bold text-white leading-[0.9] tracking-[-0.03em] mb-6" style="font-size: clamp(2.2rem, 3.8vw, 3.4rem)">
          Every issue.<br /><span class="text-white/50">Exact fix.</span>
        </h2>
        <p class="font-body text-white/55 leading-relaxed mb-10" style="font-size: 0.95rem; max-width: 34ch">
          Each failed check comes with a plain-English explanation and a concrete fix — no guesswork.
        </p>
        <button
          class="self-start bg-primary text-white font-display font-semibold rounded-[9px] transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02]"
          style="padding:15px 36px; font-size:14px; letter-spacing:0.02em"
          @click="handleScan"
        >Scan your site →</button>

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

      <!-- RIGHT: fake result page -->
      <div class="flex-1 relative border-l border-white/[0.04] overflow-hidden flex flex-col" style="background: rgba(255,255,255,0.012)">

        <!-- App chrome: top bar -->
        <div class="shrink-0 flex items-center gap-3 px-6 py-3.5 border-b border-white/[0.05]" style="background: rgba(255,255,255,0.02)">
          <div class="flex gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div class="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div class="w-2.5 h-2.5 rounded-full bg-white/10" />
          </div>
          <div class="flex-1 flex items-center gap-2 mx-4 px-3 py-1.5 rounded-md" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06)">
            <div class="w-1.5 h-1.5 rounded-full bg-[#00d4aa]" />
            <span class="font-body text-white/45 text-xs">scanpulse.io/results/stripe.com</span>
          </div>
          <span class="text-[9px] font-display font-bold tracking-[0.14em] uppercase px-2.5 py-1 rounded-full" style="background:rgba(0,212,170,0.12); color:#00d4aa">Scan complete</span>
        </div>

        <!-- Result content -->
        <div class="flex-1 overflow-hidden flex gap-0">

          <!-- Score panel -->
          <div class="shrink-0 flex flex-col items-center justify-center px-8 py-6 border-r border-white/[0.05]" style="width:200px">
            <!-- Score ring (SVG) -->
            <div class="relative mb-5">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8" />
                <circle cx="55" cy="55" r="46" fill="none" stroke="#ec3586" stroke-width="8"
                  stroke-linecap="round"
                  stroke-dasharray="289"
                  stroke-dashoffset="55"
                  transform="rotate(-90 55 55)"
                  style="filter: drop-shadow(0 0 6px rgba(236,53,134,0.5))"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="font-display font-bold text-white leading-none" style="font-size:1.9rem; letter-spacing:-0.04em">81</span>
                <span class="text-[9px] font-display uppercase tracking-[0.12em] text-white/40 mt-0.5">Overall</span>
              </div>
            </div>

            <!-- Pillar scores -->
            <div class="w-full space-y-2.5">
              <div v-for="s in [
                { label:'Security',    score:94, color:'#00d4aa' },
                { label:'Performance', score:71, color:'#ffaa00' },
                { label:'SEO',         score:78, color:'#6c5ce7' },
                { label:'Accessibility',score:85,color:'#a29bfe' },
                { label:'AI Readiness',score:60, color:'#ff7675' },
                { label:'DNS & Email', score:67, color:'#74b9ff' },
                { label:'Trust',       score:83, color:'#fd79a8' },
              ]" :key="s.label" class="w-full">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[9px] font-display text-white/45 tracking-wide">{{ s.label }}</span>
                  <span class="text-[9px] font-display font-bold" :style="{ color: s.color }">{{ s.score }}</span>
                </div>
                <div class="h-1 rounded-full w-full" style="background:rgba(255,255,255,0.06)">
                  <div class="h-1 rounded-full" :style="{ width: s.score + '%', background: s.color, opacity: 0.8 }" />
                </div>
              </div>
            </div>
          </div>

          <!-- Issues list -->
          <div class="flex-1 overflow-y-auto px-5 py-4" style="scrollbar-width:none">
            <div class="text-[9px] font-display uppercase tracking-[0.18em] text-white/30 mb-3 px-1">
              {{ sampleIssues.filter(i => i.status !== 'PASS').length }} issues found · {{ sampleIssues.filter(i => i.status === 'PASS').length }} passed
            </div>
            <div
              v-for="issue in sampleIssues"
              :key="issue.title"
              class="mb-2 rounded-lg px-4 py-3"
              :style="{ background: 'rgba(255,255,255,0.025)', borderLeft: `2px solid ${issue.color}` }"
            >
              <div class="flex items-center gap-2.5 mb-1">
                <div class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: issue.color }" />
                <span class="font-body text-white/75 text-[12px] flex-1 font-medium">{{ issue.title }}</span>
                <span class="text-[8px] font-display uppercase tracking-[0.12em] text-white/35">{{ issue.pillar }}</span>
                <span class="text-[8px] font-display font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded ml-1" :style="{ color: issue.color, background: `${issue.color}18` }">{{ issue.status }}</span>
              </div>
              <div v-if="issue.fix" class="text-[11px] font-body leading-relaxed pl-[22px]" style="color:rgba(255,255,255,0.42)">
                {{ issue.fix }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Section 5: Pricing ───────────────────────────────────── -->
    <section class="h-screen snap-section relative overflow-hidden flex flex-col items-center justify-center">

      <!-- Grid bg -->
      <div class="absolute inset-0 pointer-events-none" style="background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px); background-size:64px 64px" />

      <!-- Pro glow -->
      <div class="absolute pointer-events-none" style="top:20%; left:40%; width:40%; height:60%; background: radial-gradient(ellipse at 50% 40%, rgba(236,53,134,0.08) 0%, transparent 70%)" />

      <!-- Inner container — constrained width, centred -->
      <div class="relative z-10 w-full max-w-4xl px-8">

        <!-- Header row -->
        <div class="flex items-end justify-between mb-10">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-7 h-px bg-primary" />
              <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">Pricing</span>
            </div>
            <h2 class="font-display font-bold text-white leading-[0.9] tracking-[-0.04em]" style="font-size: clamp(2rem, 3vw, 2.8rem)">
              Simple pricing.<br /><span class="text-white/40">No surprises.</span>
            </h2>
          </div>

          <!-- Billing toggle -->
          <div
            class="flex items-center rounded-full border border-white/[0.1] overflow-hidden"
            style="background: rgba(255,255,255,0.03)"
          >
            <button
              class="text-[11px] font-display font-semibold tracking-[0.14em] uppercase px-4 py-2 transition-colors"
              :class="billingPeriod === 'monthly' ? 'text-white bg-white/[0.08]' : 'text-white/40'"
              @click="billingPeriod = 'monthly'"
            >Monthly</button>
            <button
              class="text-[11px] font-display font-semibold tracking-[0.14em] uppercase px-4 py-2 transition-colors flex items-center gap-2"
              :class="billingPeriod === 'annual' ? 'text-white bg-white/[0.08]' : 'text-white/40'"
              @click="billingPeriod = 'annual'"
            >Annual <span class="text-[9px] font-bold tracking-[0.06em] px-1.5 py-0.5 rounded-full bg-success/15 text-success">−10%</span></button>
          </div>
        </div>

        <!-- Plan cards -->
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="(plan, i) in displayedPlans"
            :key="plan.name"
            class="relative rounded-2xl flex flex-col p-8 overflow-hidden"
            :style="plan.highlight
              ? 'background: rgba(236,53,134,0.06); border: 1px solid rgba(236,53,134,0.25)'
              : 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)'"
          >
            <!-- Top accent line -->
            <div class="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" :style="{ background: plan.highlight ? '#ec3586' : 'rgba(255,255,255,0.08)' }" />

            <!-- Glow -->
            <div class="absolute inset-0 pointer-events-none rounded-2xl" :style="{ background: `radial-gradient(ellipse at 50% 0%, ${plan.accent}12 0%, transparent 65%)` }" />

            <!-- Plan name + badge -->
            <div class="relative flex items-center gap-2.5 mb-6">
              <div class="w-1.5 h-1.5 rounded-full" :style="{ background: plan.accent }" />
              <span class="text-[11px] font-display font-bold tracking-[0.18em] uppercase" :style="{ color: plan.accent }">{{ plan.name }}</span>
              <span v-if="plan.highlight" class="ml-auto text-[9px] font-display font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full" style="background: rgba(236,53,134,0.15); color: #ec3586">Most popular</span>
            </div>

            <!-- Price -->
            <div class="relative mb-1">
              <div class="flex items-end gap-2 leading-none">
                <span class="font-display font-bold text-white" style="font-size: 3.4rem; letter-spacing: -0.05em; line-height: 1">{{ plan.price }}</span>
                <span class="font-body text-white/45 text-sm pb-1.5">{{ plan.period }}</span>
              </div>
              <p v-if="billingPeriod === 'annual' && plan.highlight" class="font-body text-white/45 text-[11px] mt-1.5">
                $162 billed annually · <span class="text-success">save $18</span>
              </p>
            </div>

            <!-- Scan limit -->
            <div class="relative text-[10px] font-display tracking-[0.1em] uppercase mt-3 mb-5 pb-5 border-b border-white/[0.06]" :style="{ color: plan.accent }">
              {{ plan.scans }}
            </div>

            <!-- Features -->
            <ul class="relative space-y-3 flex-1">
              <li v-for="f in plan.features" :key="f" class="flex items-start gap-3">
                <svg class="shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2.5 6.5L5 9l5.5-5.5" :stroke="plan.accent" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="text-[13px] font-body text-white/60 leading-snug">{{ f }}</span>
              </li>
            </ul>

            <!-- CTA -->
            <button
              class="relative w-full rounded-xl font-display font-semibold text-[13px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-7"
              :class="plan.highlight ? 'text-white' : 'text-white/55 hover:text-white/80'"
              :style="plan.highlight
                ? 'background: #ec3586; padding: 13px 0; letter-spacing: 0.02em'
                : 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 13px 0; letter-spacing: 0.02em'"
              @click="handleScan"
            >{{ plan.cta }}</button>
          </div>
        </div>

        <!-- Comparison link -->
        <p class="text-center mt-6 text-[11px] font-body text-white/30">
          All plans include all 94 checks across 7 pillars · <span class="text-white/50 cursor-pointer hover:text-white/70 transition-colors" @click="scrollToSection(3)">See full results →</span>
        </p>
      </div>

      <!-- Scroll hint -->
      <div class="absolute bottom-6 left-16 xl:left-24 z-20 flex items-center gap-3 scroll-hint">
        <div class="scroll-chevron">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="text-[10px] font-display uppercase tracking-[0.16em] text-white/42">What people say</span>
      </div>
    </section>

    <!-- ── Section 6: Testimonials ──────────────────────────────── -->
    <section class="h-screen snap-section relative overflow-hidden flex flex-col items-center justify-center">

      <!-- Grid bg -->
      <div class="absolute inset-0 pointer-events-none" style="background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px); background-size:64px 64px" />

      <!-- Ambient glow -->
      <div class="absolute pointer-events-none" style="top:0;left:15%;width:70%;height:50%;background:radial-gradient(ellipse at 50% 0%,rgba(236,53,134,0.05) 0%,transparent 70%)" />

      <div class="relative z-10 w-full max-w-5xl px-8">

        <!-- Header -->
        <div class="flex items-end justify-between mb-12">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-7 h-px bg-primary" />
              <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">What people say</span>
            </div>
            <h2 class="font-display font-bold text-white leading-[0.9] tracking-[-0.04em]" style="font-size: clamp(2rem, 3vw, 2.8rem)">
              Trusted by teams<br /><span class="text-white/40">who care about quality.</span>
            </h2>
          </div>
          <button
            class="shrink-0 bg-primary text-white font-display font-semibold rounded-[9px] transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02]"
            style="padding:13px 30px; font-size:13px; letter-spacing:0.02em"
            @click="handleScan"
          >Start free →</button>
        </div>

        <!-- Cards -->
        <div class="grid grid-cols-3 gap-4">
          <div
            v-for="(t, i) in testimonials"
            :key="t.name"
            class="relative rounded-2xl p-7 flex flex-col overflow-hidden"
            style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)"
          >
            <!-- Top accent -->
            <div class="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" :style="{ background: `linear-gradient(to right, ${t.color}, transparent)` }" />

            <!-- Pillar tag -->
            <div class="flex items-center gap-2 mb-5">
              <div class="w-1.5 h-1.5 rounded-full" :style="{ background: t.color }" />
              <span class="text-[9px] font-display font-bold tracking-[0.16em] uppercase" :style="{ color: t.color }">{{ t.pillar }}</span>
            </div>

            <!-- Quote -->
            <p class="font-body leading-relaxed flex-1 text-white/70" style="font-size:0.93rem">
              "{{ t.quote }}"
            </p>

            <!-- Author -->
            <div class="flex items-center gap-3 mt-6 pt-5 border-t border-white/[0.06]">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-display font-bold text-white shrink-0"
                :style="{ background: t.color + '18', border: `1px solid ${t.color}30` }"
              >{{ t.initials }}</div>
              <div>
                <div class="font-display font-semibold text-white/80 leading-none mb-0.5" style="font-size:0.85rem">{{ t.name }}</div>
                <div class="font-body text-white/35 text-[11px]">{{ t.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll hint -->
      <div class="absolute bottom-6 left-16 xl:left-24 z-20 flex items-center gap-3 scroll-hint">
        <div class="scroll-chevron">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="text-[10px] font-display uppercase tracking-[0.16em] text-white/42">Common questions</span>
      </div>
    </section>

    <!-- ── Section 7: FAQ ─────────────────────────────────────────── -->
    <section class="h-screen snap-section flex overflow-hidden relative">

      <div class="absolute inset-0 pointer-events-none" style="background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px); background-size:64px 64px" />

      <!-- LEFT: heading + CTA -->
      <div class="relative z-10 flex flex-col justify-center px-16 xl:px-24 shrink-0 border-r border-white/[0.04]" style="width: 38%">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-7 h-px bg-primary" />
          <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">FAQ</span>
        </div>

        <h2
          class="font-display font-bold text-white leading-[0.9] tracking-[-0.03em] mb-8"
          style="font-size: clamp(2.2rem, 3.8vw, 3.4rem)"
        >
          Common<br />
          <span class="text-white/45">questions.</span>
        </h2>

        <p class="font-body text-white/50 leading-relaxed mb-12" style="font-size:0.95rem;max-width:30ch">
          Still have questions? Run a free scan and see the results for your own site.
        </p>

        <button
          class="self-start bg-primary text-white font-display font-semibold rounded-[9px] transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02]"
          style="padding:15px 36px; font-size:14px; letter-spacing:0.02em"
          @click="handleScan"
        >
          Scan your site free →
        </button>

        <!-- Back hint -->
        <div class="absolute bottom-8 left-16 xl:left-24 flex items-center gap-3 opacity-20">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="transform:rotate(180deg)">
            <path d="M3 5l4 4 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="text-[10px] font-display uppercase tracking-[0.16em] text-white">Back to top</span>
        </div>
      </div>

      <!-- RIGHT: accordion -->
      <div class="flex-1 relative z-10 flex flex-col justify-center px-10 xl:px-16 gap-1 overflow-hidden">
        <div
          v-for="(item, i) in faqItems"
          :key="i"
          class="faq-item border-b border-white/[0.05] cursor-pointer"
          @click="toggleFaq(i)"
        >
          <!-- Question row -->
          <div class="flex items-center justify-between py-5 gap-6">
            <span class="font-display font-semibold text-white/85 leading-snug" style="font-size:0.93rem">{{ item.q }}</span>
            <div
              class="shrink-0 w-5 h-5 rounded-full border border-white/[0.12] flex items-center justify-center transition-all duration-200"
              :class="openFaqIndex === i ? 'bg-primary/20 border-primary/40' : ''"
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" class="transition-transform duration-200" :class="openFaqIndex === i ? 'rotate-180' : ''">
                <path d="M1.5 3l3 3 3-3" :stroke="openFaqIndex === i ? '#ec3586' : 'rgba(255,255,255,0.3)'" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- Answer -->
          <div
            class="overflow-hidden transition-all duration-300"
            :style="openFaqIndex === i ? 'max-height:200px;opacity:1;padding-bottom:20px' : 'max-height:0;opacity:0'"
          >
            <p class="font-body text-white/50 leading-relaxed" style="font-size:0.87rem">{{ item.a }}</p>
          </div>
        </div>
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
  padding: 3px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.timeline-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.timeline-dot.is-active {
  width: 8px;
  height: 8px;
  background: #ec3586;
  box-shadow: 0 0 10px rgba(236, 53, 134, 0.6);
}
.timeline-entry:hover .timeline-dot:not(.is-active) {
  background: rgba(255, 255, 255, 0.45);
  width: 6px;
  height: 6px;
}


/* Connector line */
.timeline-line {
  width: 1px;
  height: 80px;
  background: rgba(255, 255, 255, 0.07);
  position: relative;
  overflow: hidden;
  margin: 4px 0;
  align-self: flex-start;
  transform: translateX(3px);
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
