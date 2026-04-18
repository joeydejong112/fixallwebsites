<script setup lang="ts">
definePageMeta({ layout: false }) // Uses parent layout, not tool layout

const props = defineProps<{
  headerLine: string
  cspValue: string
  uplift: number
  securityScore: number
  overallScore: number
  hasUnsafe: boolean
  copied: boolean
}>()

const emit = defineEmits<{ copy: [] }>()

const animateScore = ref(false)
let animTimer: ReturnType<typeof setTimeout>

watch(() => props.uplift, () => {
  animateScore.value = false
  clearTimeout(animTimer)
  animTimer = setTimeout(() => animateScore.value = true, 100)
}, { immediate: true })

// Install accordion
const installOpen = ref('nginx')
const INSTALL_SNIPPETS: Record<string, { label: string; build: (h: string) => string }> = {
  nginx:      { label: 'Nginx',             build: h => `# /etc/nginx/conf.d/acme.conf\nadd_header Content-Security-Policy "${h}" always;` },
  apache:     { label: 'Apache',            build: h => `# .htaccess\n<IfModule mod_headers.c>\n  Header set Content-Security-Policy "${h}"\n</IfModule>` },
  cloudflare: { label: 'Cloudflare Workers', build: h => `// worker.js\nexport default {\n  async fetch(req) {\n    const res = await fetch(req);\n    const out = new Response(res.body, res);\n    out.headers.set("Content-Security-Policy", "${h}");\n    return out;\n  }\n}` },
  nextjs:     { label: 'Next.js',           build: h => `// next.config.js\nmodule.exports = {\n  async headers() {\n    return [{\n      source: "/:path*",\n      headers: [{ key: "Content-Security-Policy", value: "${h}" }]\n    }];\n  }\n};` },
  vercel:     { label: 'Vercel',            build: h => `// vercel.json\n{\n  "headers": [{\n    "source": "/(.*)",\n    "headers": [{ "key": "Content-Security-Policy", "value": "${h}" }]\n  }]\n}` },
}

const activeSnippet = computed(() => INSTALL_SNIPPETS[installOpen.value]?.build(props.cspValue) ?? '')
</script>

<template>
  <div class="output-panel">

    <!-- ── Live header output ──────────────────────────────── -->
    <div class="output-block">
      <div class="output-block-header">
        <div class="output-title-row">
          <span class="pulse-dot" />
          <span class="eyebrow-label">Generated header &middot; live</span>
        </div>
        <span class="chip chip--live">
          <span class="pulse-dot pulse-dot--sm" />
          Updating as you edit
        </span>
      </div>

      <div class="header-card">
        <button
          class="copy-btn"
          :class="{ 'copy-btn--done': copied }"
          @click="emit('copy')"
        >
          <svg v-if="!copied" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
        <div class="http-label">HTTP response header</div>
        <div class="header-text">
          <span class="csp-keyword">Content-Security-Policy:</span>
          <span class="csp-sep"> </span>
          <CspValueHighlight :csp-value="cspValue" />
        </div>
      </div>
    </div>

    <!-- ── Score impact ─────────────────────────────────── -->
    <div class="impact-card">
      <div class="card-accent-top" />
      <div class="eyebrow" style="margin-bottom: 16px">Projected score impact</div>

      <div class="score-grid">
        <div class="score-item">
          <div class="score-label">Security</div>
          <div class="score-row">
            <span class="num score-from">{{ 78 }}</span>
            <svg class="arrow" width="18" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
            <span class="num score-to" :style="animateScore ? `text-shadow: 0 0 20px ${'#00d4aa'}66` : ''">{{ securityScore }}</span>
            <span class="score-delta">+{{ uplift }}</span>
          </div>
        </div>
        <div class="score-item">
          <div class="score-label">Overall</div>
          <div class="score-row">
            <span class="num score-from">{{ 74 }}</span>
            <svg class="arrow" width="18" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
            <span class="num score-to" :style="animateScore ? `text-shadow: 0 0 20px ${'#ec3586'}66` : ''">{{ overallScore }}</span>
            <span class="score-delta">+{{ Math.round(uplift * 0.4) }}</span>
          </div>
        </div>
      </div>

      <div v-if="props.hasUnsafe" class="unsafe-warn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
        Remove 'unsafe-inline' from style-src to unlock the full +12 uplift.
      </div>

      <button class="btn btn-primary rescan-btn">
        Rescan your site to verify
        <svg class="arrow-animate" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
      </button>
    </div>

    <!-- ── Install accordion ──────────────────────────────── -->
    <div class="install-section">
      <div class="eyebrow" style="margin-bottom: 14px">How to install</div>
      <div class="accordion">
        <div
          v-for="(s, k) in INSTALL_SNIPPETS"
          :key="k"
          class="accordion-item"
        >
          <button
            class="accordion-trigger"
            :class="{ 'accordion-trigger--open': installOpen === k }"
            @click="installOpen = installOpen === k ? '' : k"
          >
            <span class="trigger-left">
              <span class="tab-dot" :class="{ 'tab-dot--active': installOpen === k }" />
              {{ s.label }}
            </span>
            <svg class="chevron" :class="{ 'chevron--open': installOpen === k }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <pre v-if="installOpen === k" class="accordion-body">{{ activeSnippet }}</pre>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.output-panel { display: flex; flex-direction: column; gap: 22px; }

/* ── Pulse dot ─────────────────────────────────────────────── */
:global(.pulse-dot) {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--p-security); color: var(--p-security);
  animation: pulse 1.5s ease-in-out infinite;
  position: relative;
}
:global(.pulse-dot)::after {
  content: ""; position: absolute; inset: -4px; border-radius: 50%;
  border: 2px solid currentColor; opacity: 0;
  animation: pulsering 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; } 50% { opacity: 0.5; }
}
@keyframes pulsering {
  0% { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}
.pulse-dot--sm { width: 6px; height: 6px; }

/* ── Live block ─────────────────────────────────────────────── */
.output-block-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}
.output-title-row { display: flex; align-items: center; gap: 8px; }
.eyebrow-label {
  font-family: var(--font-display); font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted);
}
.chip--live { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--p-security); }

.header-card {
  background: var(--elevated); border: 1px solid var(--border);
  border-left: 2px solid var(--p-security);
  border-radius: 10px; padding: 20px 22px;
  position: relative;
  font-family: var(--font-mono); font-size: 13px;
  line-height: 1.75; color: rgba(255,255,255,0.85); word-break: break-all;
}

.http-label { color: var(--text-faint); font-size: 11px; margin-bottom: 8px; font-family: var(--font-body); }
.header-text { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0; }
.csp-keyword { color: var(--p-security); }
.csp-sep { }

.copy-btn {
  position: absolute; top: 12px; right: 12px;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 7px;
  background: var(--brand); color: #fff; border: none;
  font-family: var(--font-display); font-size: 12px; font-weight: 600;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(236,53,134,0.3);
  transition: background 0.15s, box-shadow 0.15s;
}
.copy-btn--done { background: var(--p-security); box-shadow: 0 0 20px rgba(0,212,170,0.5); }

/* ── Impact card ────────────────────────────────────────────── */
.impact-card {
  background: var(--elevated); border: 1px solid rgba(0,212,170,0.25);
  border-radius: 16px; padding: 22px 24px; position: relative; overflow: hidden;
  background-image: linear-gradient(180deg, rgba(0,212,170,0.05), transparent 80%);
  box-shadow: 0 0 40px rgba(0,212,170,0.08);
}
.card-accent-top { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(to right, var(--p-security), transparent); }

.score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
.score-item { }
.score-label {
  font-family: var(--font-display); font-size: 11px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-muted); margin-bottom: 8px;
}
.score-row { display: flex; align-items: baseline; gap: 8px; }
.score-from { font-size: 28px; color: var(--text-muted); font-family: var(--font-display); font-weight: 700; letter-spacing: -0.05em; }
.score-to { font-size: 32px; color: var(--p-security); font-family: var(--font-display); font-weight: 700; letter-spacing: -0.05em; transition: text-shadow 0.4s; }
.score-delta { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--p-security); }

.arrow { color: var(--text-faint); flex-shrink: 0; }

.unsafe-warn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 8px;
  background: rgba(255,170,0,0.08); border: 1px solid rgba(255,170,0,0.2);
  color: var(--p-performance); font-size: 12px; font-family: var(--font-mono);
  margin-bottom: 16px;
}

.rescan-btn { width: 100%; justify-content: center; height: 44px; }
.arrow-animate { margin-left: 4px; display: inline-flex; transition: transform 0.25s; }

/* ── Install accordion ──────────────────────────────────────── */
.accordion { border-radius: 10px; overflow: hidden; border: 1px solid var(--border); }
.accordion-item { background: var(--elevated); }
.accordion-item:not(:last-child) { border-bottom: 1px solid var(--border); }

.accordion-trigger {
  width: 100%; padding: 14px 18px;
  background: transparent; border: none; color: var(--text);
  font-family: var(--font-display); font-size: 14px; font-weight: 600;
  text-align: left; cursor: pointer;
  display: flex; align-items: center; justify-content: space-between;
}
.accordion-trigger--open { border-bottom: 1px solid var(--border); }
.trigger-left { display: flex; align-items: center; gap: 10px; }
.tab-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-faint); }
.tab-dot--active { background: var(--brand); }

.chevron { transition: transform 0.2s; }
.chevron--open { transform: rotate(180deg); }

.accordion-body {
  margin: 0; padding: 16px 18px;
  background: var(--canvas);
  font-family: var(--font-mono); font-size: 12px;
  color: rgba(255,255,255,0.8); line-height: 1.65;
  overflow: auto; white-space: pre-wrap; word-break: break-all;
}

/* ── Buttons ─────────────────────────────────────────────────── */
:global(.btn) { display: inline-flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 9px; font-family: var(--font-display); font-weight: 600; font-size: 14px; letter-spacing: -0.01em; border: 1px solid transparent; cursor: pointer; transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease; text-decoration: none; }
:global(.btn:active) { transform: scale(0.98); }
:global(.btn-primary) { background: var(--brand); color: #fff; box-shadow: 0 0 24px rgba(236,53,134,0.28), inset 0 1px 0 rgba(255,255,255,0.2); }
:global(.btn-primary:hover) { background: #f14b95; }

@media (prefers-reduced-motion: reduce) {
  :global(.pulse-dot) { animation: none; }
  :global(.pulse-dot)::after { animation: none; }
  .copy-btn { transition: none; }
  .score-to { transition: none; }
  .arrow-animate { transition: none; }
  .chevron { transition: none; }
  .chevron--open { transform: none; }
}
</style>