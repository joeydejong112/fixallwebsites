<script setup lang="ts">
useHead({
  title: 'Fix-It Tools — ScanPulse',
  meta: [
    { name: 'description', content: 'Free web tools to fix the exact issues ScanPulse flags. Generate meta tags, build CSP headers, check contrast, validate DNS, and more.' }
  ]
})

const tools = [
  // ── Security ─────────────────────────────────────────────────────────
  {
    slug: 'security-headers',
    title: 'Security Headers Generator',
    description: 'Generate HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy with one click.',
    pillar: 'Security',
    pillarColor: '#00d4aa',
    icon: `<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.88-2.67 7.52-6 8.93-3.33-1.41-6-5.05-6-8.93V7.67L12 5z"/>`,
    fixes: 'Fixes: HSTS, Clickjacking, MIME sniffing, Referrer leaks, Permissions',
    free: true,
  },
  {
    slug: 'csp-builder',
    title: 'CSP Header Builder',
    description: 'Build a Content-Security-Policy visually — add directives, get warnings about unsafe values, and copy the final header.',
    pillar: 'Security',
    pillarColor: '#00d4aa',
    icon: `<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>`,
    fixes: 'Fixes: Missing CSP, Weak CSP configuration',
    free: true,
  },
  // ── Performance ──────────────────────────────────────────────────────
  {
    slug: 'image-optimizer',
    title: 'Image Optimizer & Converter',
    description: 'Convert PNG/JPEG to WebP client-side with a live before/after preview. See exact file size savings instantly.',
    pillar: 'Performance',
    pillarColor: '#ffaa00',
    icon: `<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>`,
    fixes: 'Fixes: Unoptimized image formats, Missing lazy loading',
    free: true,
  },
  // ── SEO ──────────────────────────────────────────────────────────────
  {
    slug: 'meta-generator',
    title: 'Meta Tag Generator',
    description: 'Generate title, description, canonical, Open Graph, and Twitter Card tags with live Google preview.',
    pillar: 'SEO',
    pillarColor: '#6c5ce7',
    icon: `<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>`,
    fixes: 'Fixes: Missing title, meta description, OG tags, Twitter Card, viewport',
    free: true,
  },
  {
    slug: 'robots-txt',
    title: 'Robots.txt Generator',
    description: 'Build a valid robots.txt visually with user-agent rules, disallow paths, sitemaps, and crawl-delay.',
    pillar: 'SEO',
    pillarColor: '#6c5ce7',
    icon: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>`,
    fixes: 'Fixes: robots.txt not reachable',
    free: true,
  },
  {
    slug: 'favicon-generator',
    title: 'Favicon Generator',
    description: 'Upload any image and generate favicon.ico (16×16, 32×32) and apple-touch-icon (180×180) instantly.',
    pillar: 'SEO',
    pillarColor: '#6c5ce7',
    icon: `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`,
    fixes: 'Fixes: No favicon detected',
    free: true,
  },
  {
    slug: 'schema-generator',
    title: 'Schema Markup Generator',
    description: 'Generate valid JSON-LD for Article, Organization, and more — with a guided form and copy-ready output.',
    pillar: 'SEO',
    pillarColor: '#6c5ce7',
    icon: `<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>`,
    fixes: 'Fixes: No structured data, No author attribution, No publication dates',
    free: true,
  },
  // ── Accessibility ────────────────────────────────────────────────────
  {
    slug: 'contrast-checker',
    title: 'Color Contrast Checker',
    description: 'Check foreground/background contrast ratios against WCAG 2.1 AA and AAA — with live rendered previews.',
    pillar: 'Accessibility',
    pillarColor: '#a29bfe',
    icon: `<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>`,
    fixes: 'Fixes: WCAG contrast requirements',
    free: true,
  },
  // ── DNS & Email ──────────────────────────────────────────────────────
  {
    slug: 'email-auth',
    title: 'SPF / DKIM / DMARC Generator',
    description: 'Build SPF and DMARC TXT records visually with provider dropdowns, policy selectors, and copy-ready output.',
    pillar: 'DNS & Email',
    pillarColor: '#fd79a8',
    icon: `<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>`,
    fixes: 'Fixes: No SPF, DMARC not configured, No DKIM detected',
    free: true,
  },
]

const pillars = ['Security', 'Performance', 'SEO', 'Accessibility', 'DNS & Email']
</script>

<template>
  <div class="page-bg">
    <NavBar />

    <div class="tools-shell">

      <!-- Header -->
      <div class="tools-header">
        <p class="tools-eyebrow">Fix-It Tools</p>
        <h1 class="tools-title">Stop reading bugs.<br>Start fixing them.</h1>
        <p class="tools-subtitle">
          Free standalone tools that solve the exact issues ScanPulse flags.
          No account required — advanced features unlock with Pro.
        </p>
      </div>

      <!-- Tool grid, grouped by pillar -->
      <div class="tools-body">
        <template v-for="pillar in pillars" :key="pillar">
          <template v-if="tools.some(t => t.pillar === pillar)">

            <!-- Pillar heading -->
            <div class="pillar-heading">
              <span
                class="pillar-dot"
                :style="{ background: tools.find(t => t.pillar === pillar)?.pillarColor }"
              />
              <span class="pillar-label">{{ pillar }}</span>
            </div>

            <!-- Cards row -->
            <div class="tool-grid">
              <NuxtLink
                v-for="tool in tools.filter(t => t.pillar === pillar)"
                :key="tool.slug"
                :to="`/tools/${tool.slug}`"
                class="tool-card"
              >
                <!-- Icon -->
                <div class="tool-icon" :style="{ color: tool.pillarColor, background: `${tool.pillarColor}12` }">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" v-html="tool.icon" />
                </div>

                <!-- Body -->
                <div class="tool-body">
                  <div class="tool-top">
                    <h3 class="tool-name">{{ tool.title }}</h3>
                    <span class="badge-free">Free</span>
                  </div>
                  <p class="tool-desc">{{ tool.description }}</p>
                  <p class="tool-fixes">{{ tool.fixes }}</p>
                </div>

                <!-- Arrow -->
                <div class="tool-arrow">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7.5 4l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </NuxtLink>
            </div>

          </template>
        </template>
      </div>

      <!-- Bottom CTA -->
      <div class="tools-cta">
        <p class="tools-cta-text">Not sure where to start? Run a free scan first.</p>
        <NuxtLink to="/" class="btn-primary">Scan your site</NuxtLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
.page-bg {
  min-height: 100vh;
  background: #07070a;
}

.tools-shell {
  max-width: 960px;
  margin: 0 auto;
  padding: 120px 24px 80px;
}

/* ── Header ──────────────────────────────────────────────── */
.tools-header {
  text-align: center;
  margin-bottom: 64px;
}

.tools-eyebrow {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #ec3586;
  margin-bottom: 16px;
}

.tools-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 800;
  color: white;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
}

.tools-subtitle {
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.38);
  line-height: 1.6;
  max-width: 520px;
  margin: 0 auto;
}

/* ── Body ────────────────────────────────────────────────── */
.tools-body {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* ── Pillar heading ──────────────────────────────────────── */
.pillar-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: -16px;
}

.pillar-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pillar-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.28);
}

/* ── Tool grid ───────────────────────────────────────────── */
.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

/* ── Tool card ───────────────────────────────────────────── */
.tool-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  background: #0f0f14;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  text-decoration: none;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
  position: relative;
}

.tool-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  background: #16161e;
  transform: translateY(-2px);
}

.tool-card:hover .tool-arrow {
  color: rgba(255, 255, 255, 0.6);
  transform: translateX(3px);
}

.tool-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tool-body {
  flex: 1;
  min-width: 0;
}

.tool-top {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 5px;
}

.tool-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.88);
  flex: 1;
  line-height: 1.3;
  margin: 0;
}

.badge-free {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #00d4aa;
  background: rgba(0, 212, 170, 0.1);
  border: 1px solid rgba(0, 212, 170, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  margin-top: 1px;
}

.tool-desc {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  line-height: 1.5;
  margin: 0 0 6px;
}

.tool-fixes {
  font-family: 'DM Sans', sans-serif;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.2);
  line-height: 1.4;
  margin: 0;
}

.tool-arrow {
  color: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  margin-top: 2px;
  transition: color 0.15s ease, transform 0.15s ease;
}

/* ── Bottom CTA ──────────────────────────────────────────── */
.tools-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 64px;
  padding-top: 48px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
}

.tools-cta-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.3);
}
</style>
