<script setup lang="ts">
definePageMeta({ layout: 'app' })

useSeoMeta({
  title: 'Free Web Tools — ScanPulse',
  description: 'Free tools to fix every issue ScanPulse flags. Generate security headers, build a CSP, check WCAG contrast, create robots.txt, generate schema markup, and more.',
  ogTitle: 'Free Web Tools — ScanPulse',
  ogDescription: 'Generate security headers, meta tags, robots.txt, schema markup, favicon, and more — all free.',
  ogType: 'website',
})
const _siteUrl = useRequestURL()
useHead({ link: [{ rel: 'canonical', href: _siteUrl.origin + _siteUrl.pathname }] })
</script>

<template>
  <div class="tools-page">
    <!-- Atmosphere glow -->
    <div class="atm-glow" />

    <!-- Hero -->
    <div class="hero">
      <p class="eyebrow">Tools &middot; the fix library</p>
      <h1 class="hero-title">
        Ten tools. One job:<br>
        <span class="brand-accent">close the loop.</span>
      </h1>
      <p class="hero-sub">
        Every tool generates a fix file you paste into your stack, then rescans to verify.
        Each shows the exact score uplift it&#8217;ll produce.
      </p>
    </div>

    <!-- Tools grid + filter tabs -->
    <ToolsGrid />

    <!-- Roadmap strip -->
    <div class="roadmap">
      <div class="roadmap-inner">
        <div class="roadmap-left">
          <p class="roadmap-eyebrow">Shipping next</p>
          <p class="roadmap-title">Cookie Policy Builder &middot; Sitemap Diff &middot; Core Web Vitals Fixer</p>
        </div>
        <a class="roadmap-cta" href="#vote" @click.prevent>
          Vote on next tools
          <Arrow :size="13" />
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tools-page {
  padding: 100px 64px 120px;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  min-height: 100vh;
}

/* ── Atmosphere ─────────────────────────────────────────────── */
.atm-glow {
  position: fixed;
  top: -100px;
  left: -100px;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(108, 92, 231, 0.08), transparent 60%);
  pointer-events: none;
  z-index: 0;
}

/* ── Hero ───────────────────────────────────────────────────── */
.hero {
  position: relative;
  z-index: 1;
  margin-bottom: 40px;
}

.eyebrow {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--brand);
  margin-bottom: 16px;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.8rem, 5vw, 4.5rem);
  font-weight: 900;
  color: white;
  letter-spacing: -0.045em;
  line-height: 1.0;
  margin: 0 0 16px;
}

.brand-accent {
  color: var(--brand);
}

.hero-sub {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--text-muted);
  max-width: 560px;
  line-height: 1.65;
  margin: 0;
}

/* ── Roadmap strip ──────────────────────────────────────────── */
.roadmap {
  position: relative;
  z-index: 1;
  margin-top: 32px;
  padding: 24px 28px;
  background: var(--elevated);
  border: 1px dashed var(--border-strong);
  border-radius: 14px;
}

.roadmap-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.roadmap-eyebrow {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin: 0 0 6px;
}

.roadmap-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
  letter-spacing: -0.01em;
}

.roadmap-cta {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  color: var(--brand);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  cursor: pointer;
  transition: gap 0.15s ease;
}

.roadmap-cta:hover {
  gap: 10px;
}

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 768px) {
  .tools-page {
    padding: 80px 20px 80px;
  }

  .roadmap-inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
