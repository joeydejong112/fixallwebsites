<script setup lang="ts">
/**
 * ScanPulse Landing Page — B1
 * Ported from ScanPulse.html L1235–2039 (landing-jsx)
 * Uses sub-components from app/components/scanpulse/
 * No app layout (bespoke public chrome)
 */

// SEO meta — preserved from original index.vue
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
            { '@type': 'Question', name: 'What is ScanPulse?', acceptedAnswer: { '@type': 'Answer', text: 'ScanPulse is a free website health scanner that runs 94 checks across 7 pillars — security, performance, SEO, accessibility, AI readiness, DNS & email, and trust — returning an instant score with actionable fixes for every issue.' } },
            { '@type': 'Question', name: 'How long does a website scan take?', acceptedAnswer: { '@type': 'Answer', text: 'Most scans complete in under 30 seconds. Checks run in parallel covering HTTP headers, TLS certificates, DNS records, Core Web Vitals, and full HTML analysis.' } },
            { '@type': 'Question', name: 'Is ScanPulse free to use?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The free plan includes one complete scan across all 94 checks with no credit card required. Pro unlocks unlimited scans, automated monitoring, email alerts, bulk scanning of up to 50 URLs, and REST API access.' } },
            { '@type': 'Question', name: 'What security checks does ScanPulse run?', acceptedAnswer: { '@type': 'Answer', text: 'ScanPulse runs 21 security checks including HTTPS enforcement, HSTS quality, Content Security Policy, cookie flags (Secure/HttpOnly/SameSite), mixed content detection, subresource integrity, TLS 1.3, and sensitive file exposure.' } },
            { '@type': 'Question', name: 'Does ScanPulse check Core Web Vitals?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. ScanPulse measures LCP (Largest Contentful Paint), INP (Interaction to Next Paint), and CLS (Cumulative Layout Shift) as part of its 18 performance checks, alongside TTFB, compression, image formats, and cache headers.' } },
          ],
        },
      ],
    }),
  }],
})

// Redirect logged-in users to dashboard
const { isSignedIn } = useAuth()
const router = useRouter()
watchEffect(() => {
  if (isSignedIn.value) router.push('/dashboard')
})

// ── Section nav ─────────────────────────────────────────────
const SECTIONS = [
  { id: 'hero',     label: 'Hero' },
  { id: 'coverage', label: 'Coverage' },
  { id: 'how',      label: 'How it works' },
  { id: 'sample',   label: 'Sample result' },
  { id: 'pricing',  label: 'Pricing' },
  { id: 'love',     label: 'Testimonials' },
  { id: 'faq',      label: 'FAQ' },
]

const activeSection = ref(0)
const sectionRefs: HTMLElement[] = []

function setSectionRef(el: Element | ComponentPublicInstance | null, index: number) {
  if (el) sectionRefs[index] = (el as HTMLElement)
}

onMounted(() => {
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const i = sectionRefs.indexOf(e.target as HTMLElement)
          if (i >= 0) activeSection.value = i
        }
      })
    },
    { threshold: 0.4 },
  )
  sectionRefs.forEach(el => el && io.observe(el))
  return () => io.disconnect()
})

function scrollToSection(index: number) {
  sectionRefs[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Listen for scroll-to-section events from LandingTopbar
onMounted(() => {
  const handler = (e: Event) => {
    const idx = (e as CustomEvent).detail as number
    scrollToSection(idx)
  }
  document.addEventListener('scroll-to-section', handler)
  return () => document.removeEventListener('scroll-to-section', handler)
})

// ── Scroll container ref ────────────────────────────────────
const scrollContainer = ref<HTMLElement | null>(null)
</script>

<template>
  <div ref="scrollContainer" class="snap-container bg-[var(--canvas)]">

    <!-- Fixed top bar -->
    <LandingTopbar />

    <!-- Left section nav -->
    <LandingSectionNav
      :active="activeSection"
      :sections="SECTIONS"
      @go="scrollToSection"
    />

    <!-- ── Sections (no layout applied) ─────────────────────── -->

    <!-- 1. Hero -->
    <div :ref="el => setSectionRef(el, 0)">
      <HeroSection />
    </div>

    <!-- 2. Coverage -->
    <div :ref="el => setSectionRef(el, 1)">
      <CoverageSection />
    </div>

    <!-- 3. How it works -->
    <div :ref="el => setSectionRef(el, 2)">
      <HowSection />
    </div>

    <!-- 4. Sample result -->
    <div :ref="el => setSectionRef(el, 3)">
      <SampleSection />
    </div>

    <!-- 5. Pricing -->
    <div :ref="el => setSectionRef(el, 4)">
      <PricingSection />
    </div>

    <!-- 6. Testimonials -->
    <div :ref="el => setSectionRef(el, 5)">
      <TestimonialsSection />
    </div>

    <!-- 7. FAQ -->
    <div :ref="el => setSectionRef(el, 6)">
      <FaqSection />
    </div>

    <!-- Footer -->
    <footer
      class="flex items-center justify-between"
      style="padding:40px 80px 50px 140px;border-top:1px solid var(--border);background:var(--surface);"
    >
      <Logo :animate="false" size="20" />
      <div style="color:var(--text-muted);font-size:13px;">
        © 2026 ScanPulse · <a href="#" style="color:var(--text-muted);text-decoration:none;">Privacy</a> · <a href="#" style="color:var(--text-muted);text-decoration:none;">Terms</a>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* Snap scroll container */
.snap-container {
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}
.snap-container::-webkit-scrollbar { display: none; }
.snap-container { -ms-overflow-style: none; scrollbar-width: none; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .snap-container {
    scroll-snap-type: none;
  }
}
</style>