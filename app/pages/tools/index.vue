<script setup lang="ts">
definePageMeta({ layout: 'app' })

useSeoMeta({
  title: 'Tools — ScanPulse',
  description: 'Free browser-based tools to fix every issue ScanPulse flags. CSP Builder, Security Headers, CORS Inspector, Image Optimizer, Meta Generator, and more.',
  ogTitle: 'Tools — ScanPulse',
  ogDescription: 'Ten tools. One job: close the loop.',
  ogType: 'website',
})

const activeFilter = ref('all')
</script>

<template>
  <div class="page">
    <!-- Background grid atmosphere -->
    <div class="bg-grid" aria-hidden="true" />

    <!-- Page header -->
    <div class="page-header">
      <div class="header-inner">
        <p class="eyebrow">Tools · the fix library</p>
        <h1 class="display-heading">
          Ten tools. One job:<br>
          <span class="brand-accent">close the loop.</span>
        </h1>
        <p class="header-sub">
          Every tool generates a fix file you paste into your stack, then rescans to verify.
          Each shows the exact score uplift it'll produce.
        </p>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="tabs-section">
      <div class="tabs-inner">
        <ToolFilterTabs v-model="activeFilter" />
      </div>
    </div>

    <!-- Tool grid + roadmap -->
    <div class="content-shell">
      <ToolGrid :filter="activeFilter" />
      <RoadmapStrip />
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--canvas);
  position: relative;
  padding-bottom: 80px;
}

.bg-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at 50% 0%, black 0%, transparent 70%);
}

.page-header {
  position: relative;
  z-index: 1;
  padding: 80px 64px 32px;
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
}

.eyebrow {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--brand);
  margin-bottom: 16px;
}

.display-heading {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 900;
  color: var(--text);
  letter-spacing: -0.04em;
  line-height: 1.0;
  margin: 0 0 16px;
}

.brand-accent {
  color: var(--brand);
}

.header-sub {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--text-muted);
  max-width: 580px;
  line-height: 1.65;
  margin: 0;
}

.tabs-section {
  position: relative;
  z-index: 1;
  border-bottom: 1px solid var(--border);
}

.tabs-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 64px;
}

.content-shell {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 64px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 768px) {
  .page-header,
  .tabs-inner,
  .content-shell {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>
