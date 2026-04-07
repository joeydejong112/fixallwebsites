<script setup lang="ts">
useHead({
  title: 'Fix-It Tools — ScanPulse',
  meta: [
    { name: 'description', content: 'Free web tools to fix the exact issues ScanPulse flags. Generate meta tags, build CSP headers, check contrast, validate DNS, and more.' }
  ]
})

const TOOLS = [
  { slug: 'security-headers', title: 'Security Headers Generator', subtitle: 'Generator', desc: 'Generate HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy with a single click. Copy individual headers or the full block.', short: 'HSTS · X-Frame · Referrer · Permissions', pillar: 'Security', color: '#00d4aa', fixes: 5, icon: `<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.88-2.67 7.52-6 8.93-3.33-1.41-6-5.05-6-8.93V7.67L12 5z"/>` },
  { slug: 'csp-builder', title: 'CSP Header Builder', subtitle: 'Builder', desc: 'Visual Content-Security-Policy editor. Add sources per directive, get real-time warnings for unsafe-inline, unsafe-eval, and wildcard values, then copy the final header.', short: 'Directives · unsafe warnings · live output', pillar: 'Security', color: '#00d4aa', fixes: 2, icon: `<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>` },
  { slug: 'image-optimizer', title: 'Image Optimizer & Converter', subtitle: 'Optimizer', desc: 'Drag and drop PNG or JPEG files and convert them to WebP entirely in your browser. Adjust quality with a live slider and see exact file size savings before downloading.', short: 'PNG/JPEG → WebP · quality slider · savings', pillar: 'Performance', color: '#ffaa00', fixes: 2, icon: `<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>` },
  { slug: 'meta-generator', title: 'Meta Tag Generator', subtitle: 'Generator', desc: 'Build a complete head block with title, description, canonical URL, viewport, Open Graph, and Twitter Card tags. Live Google SERP preview updates in real time.', short: 'title · OG · Twitter · canonical · preview', pillar: 'SEO', color: '#6c5ce7', fixes: 7, icon: `<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>` },
  { slug: 'robots-txt', title: 'Robots.txt Generator', subtitle: 'Generator', desc: 'Visual editor for robots.txt. Add user-agent blocks, set allow and disallow rules, add a sitemap URL, and apply presets — download or copy the file.', short: 'user-agents · rules · presets · download', pillar: 'SEO', color: '#6c5ce7', fixes: 1, icon: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>` },
  { slug: 'favicon-generator', title: 'Favicon Generator', subtitle: 'Generator', desc: 'Upload any source image and generate a favicon.ico and apple-touch-icon.png entirely client-side. Preview on a mock browser tab before downloading.', short: 'upload → ico · apple-touch · browser preview', pillar: 'SEO', color: '#6c5ce7', fixes: 1, icon: `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>` },
  { slug: 'schema-generator', title: 'Schema Markup Generator', subtitle: 'JSON-LD', desc: 'Guided form for Article, BlogPosting, and Organization JSON-LD structured data. Live script block preview, copy to clipboard or download as .json.', short: 'Article · Organization · JSON-LD · copy/download', pillar: 'SEO', color: '#6c5ce7', fixes: 3, icon: `<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>` },
  { slug: 'contrast-checker', title: 'Color Contrast Checker', subtitle: 'Checker', desc: 'Pick foreground and background colors to get WCAG 2.1 contrast ratio with pass/fail badges for AA Normal, AA Large, AAA Normal, and AAA Large.', short: 'WCAG AA · AAA · ratio · live preview', pillar: 'Accessibility', color: '#a29bfe', fixes: 0, icon: `<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>` },
  { slug: 'email-auth', title: 'SPF / DKIM / DMARC Generator', subtitle: 'Generator', desc: 'Build SPF and DMARC TXT records with provider dropdowns, policy selectors, and reporting email. Get per-provider DKIM setup instructions.', short: 'providers · policy · TXT records · DKIM guide', pillar: 'DNS & Email', color: '#fd79a8', fixes: 3, icon: `<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>` },
  { slug: 'ai-optimizer', title: 'AI Optimizer & llms.txt Generator', subtitle: 'Generator', desc: 'Generate a valid llms.txt file for LLM ingestion, build AI-friendly robots.txt rules, and test how well your content is structured for answer engines like ChatGPT and Perplexity.', short: 'llms.txt · AI crawlers · robots.txt snippets', pillar: 'AI Readiness', color: '#ff7675', fixes: 3, icon: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/><path d="M21 3L3 21"/>` },
]

const PILLARS = [
  { key: 'all', label: 'All tools', color: '#ec3586' },
  { key: 'Security', label: 'Security', color: '#00d4aa' },
  { key: 'Performance', label: 'Performance', color: '#ffaa00' },
  { key: 'SEO', label: 'SEO', color: '#6c5ce7' },
  { key: 'Accessibility', label: 'Accessibility', color: '#a29bfe' },
  { key: 'DNS & Email', label: 'DNS & Email', color: '#fd79a8' },
  { key: 'AI Readiness', label: 'AI Readiness', color: '#ff7675' },
]

const active      = ref('all')
const filtered    = computed(() => active.value === 'all' ? TOOLS : TOOLS.filter(t => t.pillar === active.value))
const featured    = computed(() => filtered.value[0] ?? null)
const rest        = computed(() => filtered.value.slice(1))
const pillarCount = (key: string) => key === 'all' ? TOOLS.length : TOOLS.filter(t => t.pillar === key).length
</script>

<template>
  <div class="page">
    <div class="page-grid" aria-hidden="true" />
    <NavBar />

    <!-- Hero -->
    <div class="hero">
      <div class="hero-inner">
        <p class="eyebrow">Fix-It Toolbox</p>
        <h1 class="title">
          <span class="title-num">10</span> tools.<br>
          Every issue<br>covered.
        </h1>
        <p class="subtitle">Free browser-based tools that solve the exact issues ScanPulse flags — no account required.</p>

        <div class="stat-strip">
          <div class="stat">
            <span class="stat-n">10</span>
            <span class="stat-l">Free tools</span>
          </div>
          <div class="stat-div" />
          <div class="stat">
            <span class="stat-n">94</span>
            <span class="stat-l">Checks covered</span>
          </div>
          <div class="stat-div" />
          <div class="stat">
            <span class="stat-n">6</span>
            <span class="stat-l">Pillars</span>
          </div>
          <div class="stat-div" />
          <div class="stat">
            <span class="stat-n">0</span>
            <span class="stat-l">Sign-ups needed</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="tabs-bar">
      <div class="tabs-inner">
        <button
          v-for="p in PILLARS" :key="p.key"
          class="tab"
          :class="{ 'tab--active': active === p.key }"
          :style="active === p.key ? `--tc:${p.color}` : ''"
          @click="active = p.key"
        >
          <span v-if="p.key !== 'all'" class="tdot" :style="`background:${p.color}`"/>
          {{ p.label }}
          <span class="tcount">{{ pillarCount(p.key) }}</span>
        </button>
      </div>
    </div>

    <div class="content-shell">
      <TransitionGroup name="fade">

        <!-- Featured card -->
        <NuxtLink
          v-if="featured"
          :key="'feat-' + featured.slug"
          :to="`/tools/${featured.slug}`"
          class="feat"
          :style="`--pc:${featured.color}`"
        >
          <div class="feat-shimmer" />
          <div class="feat-glow" :style="`background:radial-gradient(ellipse at 75% 50%, ${featured.color}1a 0%, transparent 65%)`" />
          <div class="feat-deco-icon" :style="`color:${featured.color}`">
            <svg width="140" height="140" viewBox="0 0 24 24" fill="currentColor" v-html="featured.icon"/>
          </div>

          <div class="feat-body">
            <div class="feat-top">
              <div class="feat-icon-ring" :style="`color:${featured.color};background:${featured.color}15;border-color:${featured.color}30;box-shadow:0 0 20px ${featured.color}20`">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" v-html="featured.icon"/>
              </div>
              <div class="feat-badges">
                <span class="fbadge" :style="`color:${featured.color};background:${featured.color}12;border-color:${featured.color}30`">{{ featured.pillar }}</span>
                <span class="fbadge fbadge--free">Free</span>
                <span class="fbadge fbadge--feat">Featured</span>
              </div>
            </div>

            <h2 class="feat-title">{{ featured.title }}</h2>
            <p class="feat-desc">{{ featured.desc }}</p>

            <div class="feat-foot">
              <div class="feat-meta">
                <span class="feat-checks" v-if="featured.fixes" :style="`color:${featured.color}`">
                  ✓ Fixes {{ featured.fixes }} scan checks
                </span>
                <span class="feat-checks" v-else :style="`color:${featured.color}`">
                  ✓ WCAG accessibility
                </span>
              </div>
              <span class="feat-cta" :style="`background:${featured.color};color:#07070a`">
                Open tool →
              </span>
            </div>
          </div>
        </NuxtLink>

        <!-- Rest grid -->
        <div v-if="rest.length" key="rest-grid" class="rest-grid">
          <NuxtLink
            v-for="(t, i) in rest"
            :key="t.slug"
            :to="`/tools/${t.slug}`"
            class="rcard"
            :style="`--pc:${t.color};--i:${i}`"
          >
            <div class="rcard-accent" :style="`background:${t.color}`" />
            <div class="rcard-inner">
              <div class="rcard-head">
                <div class="rcard-icon" :style="`color:${t.color};background:${t.color}12;border:1px solid ${t.color}25`">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" v-html="t.icon"/>
                </div>
                <span class="rcard-pillar" :style="`color:${t.color}`">{{ t.pillar }}</span>
                <span class="rcard-free">Free</span>
              </div>
              <h3 class="rcard-title">{{ t.title }}</h3>
              <p class="rcard-desc">{{ t.short }}</p>
              <div class="rcard-foot">
                <span class="rcard-checks" v-if="t.fixes" :style="`color:${t.color};background:${t.color}10;border:1px solid ${t.color}20`">
                  {{ t.fixes }} checks
                </span>
                <span class="rcard-checks" v-else :style="`color:${t.color};background:${t.color}10;border:1px solid ${t.color}20`">
                  WCAG
                </span>
                <span class="rcard-cta">Open →</span>
              </div>
            </div>
          </NuxtLink>
        </div>

      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/* ── Base ────────────────────────────────────────── */
.page { min-height: 100vh; background: #07070a; position: relative; }

.page-grid {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at 50% 0%, black 0%, transparent 70%);
}

/* ── Hero ─────────────────────────────────────────── */
.hero { padding: 110px 0 48px; position: relative; z-index: 1; }
.hero-inner { max-width: 1400px; margin: 0 auto; padding: 0 64px; }

.eyebrow {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.22em; text-transform: uppercase; color: #ec3586;
  margin-bottom: 16px;
}
.title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(3rem, 7vw, 6rem);
  font-weight: 900; color: white; letter-spacing: -0.045em;
  line-height: 0.9; margin: 0 0 20px;
}
.title-num {
  background: linear-gradient(135deg, #ec3586 0%, #ff7675 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.subtitle {
  font-family: 'DM Sans', sans-serif; font-size: 15px;
  color: rgba(255,255,255,0.3); line-height: 1.6; max-width: 480px; margin-bottom: 36px;
}

/* Stat strip */
.stat-strip {
  display: flex; align-items: center; gap: 0;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; width: fit-content; overflow: hidden;
}
.stat { padding: 16px 28px; display: flex; flex-direction: column; gap: 2px; }
.stat-n {
  font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem;
  font-weight: 900; color: white; letter-spacing: -0.03em; line-height: 1;
}
.stat-l { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.25); }
.stat-div { width: 1px; height: 40px; background: rgba(255,255,255,0.06); }

/* ── Tabs ─────────────────────────────────────────── */
.tabs-bar {
  border-bottom: 1px solid rgba(255,255,255,0.05);
  position: relative; z-index: 1;
}
.tabs-inner {
  max-width: 1400px; margin: 0 auto; padding: 0 64px;
  display: flex; gap: 0; overflow-x: auto;
  scrollbar-width: none;
}
.tabs-inner::-webkit-scrollbar { display: none; }
.tab {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700;
  padding: 14px 16px; color: rgba(255,255,255,0.28);
  background: none; border: none; cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s; white-space: nowrap;
}
.tab:hover { color: rgba(255,255,255,0.6); }
.tab--active { color: var(--tc); border-bottom-color: var(--tc); }
.tdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.tcount {
  font-family: 'Fira Mono', monospace; font-size: 9px;
  background: rgba(255,255,255,0.06); border-radius: 4px;
  padding: 1px 5px; color: rgba(255,255,255,0.22);
}
.tab--active .tcount { background: color-mix(in srgb, var(--tc) 15%, transparent); color: var(--tc); }

/* ── Content shell ────────────────────────────────── */
.content-shell {
  max-width: 1400px; margin: 0 auto; padding: 32px 64px 120px;
  display: flex; flex-direction: column; gap: 20px;
  position: relative; z-index: 1;
}

/* ── Featured card ────────────────────────────────── */
.feat {
  position: relative; overflow: hidden;
  display: flex; align-items: stretch;
  border-radius: 18px; background: #0e0e13;
  border: 1px solid rgba(255,255,255,0.07);
  text-decoration: none; min-height: 240px;
  transition: border-color 0.25s, transform 0.2s, box-shadow 0.25s;
}
.feat:hover {
  border-color: var(--pc); transform: translateY(-3px);
  box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px var(--pc);
}
.feat-shimmer {
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--pc), transparent);
  opacity: 0; transition: opacity 0.3s;
}
.feat:hover .feat-shimmer { opacity: 1; }
.feat-glow { position: absolute; inset: 0; pointer-events: none; }
.feat-deco-icon {
  position: absolute; right: -24px; bottom: -24px;
  opacity: 0.045; pointer-events: none; transition: opacity 0.3s;
}
.feat:hover .feat-deco-icon { opacity: 0.07; }
.feat-body {
  position: relative; z-index: 1; padding: 36px 40px;
  display: flex; flex-direction: column; gap: 16px; flex: 1;
}
.feat-top { display: flex; align-items: center; gap: 14px; }
.feat-icon-ring {
  width: 56px; height: 56px; border-radius: 14px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid; transition: box-shadow 0.2s;
}
.feat-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.fbadge {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  padding: 3px 9px; border-radius: 4px; border: 1px solid;
}
.fbadge--free { color: #00d4aa; background: rgba(0,212,170,0.08); border-color: rgba(0,212,170,0.22); }
.fbadge--feat { color: #ec3586; background: rgba(236,53,134,0.08); border-color: rgba(236,53,134,0.22); }
.feat-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  font-weight: 800; color: white; letter-spacing: -0.03em; margin: 0; line-height: 1.1;
}
.feat-desc {
  font-family: 'DM Sans', sans-serif; font-size: 14px;
  color: rgba(255,255,255,0.36); line-height: 1.65; margin: 0; max-width: 580px; flex: 1;
}
.feat-foot { display: flex; align-items: center; gap: 20px; margin-top: auto; padding-top: 4px; }
.feat-meta { flex: 1; }
.feat-checks { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; }
.feat-cta {
  display: inline-flex; align-items: center;
  font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 800;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 10px 22px; border-radius: 6px;
  transition: filter 0.15s, transform 0.15s; flex-shrink: 0;
}
.feat:hover .feat-cta { filter: brightness(1.1); transform: translateX(2px); }

/* ── Rest grid ────────────────────────────────────── */
.rest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 14px;
}
.rcard {
  display: flex; position: relative; overflow: hidden;
  border-radius: 14px; background: #0e0e13;
  border: 1px solid rgba(255,255,255,0.055);
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  animation: card-in 0.3s ease both;
  animation-delay: calc(var(--i) * 40ms);
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.rcard:hover {
  border-color: var(--pc); transform: translateY(-3px);
  box-shadow: 0 12px 36px rgba(0,0,0,0.4), 0 0 0 1px var(--pc);
}
.rcard-accent { width: 3px; flex-shrink: 0; opacity: 0.5; transition: opacity 0.2s; }
.rcard:hover .rcard-accent { opacity: 1; }
.rcard-inner {
  display: flex; flex-direction: column; gap: 10px;
  padding: 20px 20px 20px 18px; flex: 1;
}
.rcard-head { display: flex; align-items: center; gap: 8px; }
.rcard-icon {
  width: 30px; height: 30px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rcard-pillar {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; flex: 1;
}
.rcard-free {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; padding: 2px 6px;
}
.rcard-title {
  font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700;
  color: rgba(255,255,255,0.88); margin: 0; line-height: 1.3; transition: color 0.15s;
}
.rcard:hover .rcard-title { color: white; }
.rcard-desc {
  font-family: 'DM Sans', sans-serif; font-size: 11.5px;
  color: rgba(255,255,255,0.26); line-height: 1.55; margin: 0; flex: 1;
}
.rcard-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.rcard-checks { font-family: 'Fira Mono', monospace; font-size: 10px; padding: 3px 8px; border-radius: 4px; }
.rcard-cta {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: var(--pc); letter-spacing: 0.04em; transition: letter-spacing 0.15s;
}
.rcard:hover .rcard-cta { letter-spacing: 0.08em; }

/* ── Transitions ──────────────────────────────────── */
.fade-enter-active { transition: opacity 0.2s, transform 0.2s; }
.fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from { opacity: 0; transform: translateY(6px); }
.fade-leave-to   { opacity: 0; }

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 768px) {
  .hero-inner, .tabs-inner, .content-shell { padding-left: 20px; padding-right: 20px; }
  .feat-body { padding: 24px; }
  .stat-strip { flex-wrap: wrap; }
}
</style>
