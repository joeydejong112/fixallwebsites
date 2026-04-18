<script setup lang="ts">
definePageMeta({ layout: 'tool' })
useSeoMeta({
  title: 'CSP Header Builder — Content-Security-Policy Generator',
  description: 'Build a Content-Security-Policy header visually. Add sources per directive, get unsafe-inline and wildcard warnings, then copy the complete CSP header — free.',
  ogTitle: 'Free CSP Header Builder — Content-Security-Policy Generator',
  ogDescription: 'Create a valid Content-Security-Policy header with a visual editor. Get real-time warnings for unsafe directives.',
})
const _siteUrl = useRequestURL()
useHead({ link: [{ rel: 'canonical', href: _siteUrl.origin + _siteUrl.pathname }] })

// ── State ────────────────────────────────────────────────────────────────────
interface Directive {
  name: string
  description: string
  sources: string[]
  newSource: string
  _animKey?: number
}

const directives = reactive<Directive[]>([
  { name: 'default-src',      description: 'Fallback for all resource types not covered by a specific directive.', sources: ["'self'"],         newSource: '', _animKey: 0 },
  { name: 'script-src',       description: 'Controls JavaScript sources.',                                        sources: ["'self'"],         newSource: '', _animKey: 0 },
  { name: 'style-src',        description: 'Controls CSS sources.',                                                sources: ["'self'"],         newSource: '', _animKey: 0 },
  { name: 'img-src',          description: 'Controls image sources.',                                              sources: ["'self'", 'data:'],newSource: '', _animKey: 0 },
  { name: 'font-src',         description: 'Controls font file sources.',                                           sources: ["'self'"],         newSource: '', _animKey: 0 },
  { name: 'connect-src',      description: 'Controls URLs for fetch, XHR, WebSocket.',                              sources: ["'self'"],         newSource: '', _animKey: 0 },
  { name: 'frame-src',        description: 'Controls sources for <frame> and <iframe>.',                          sources: ["'none'"],         newSource: '', _animKey: 0 },
  { name: 'media-src',        description: 'Controls sources for <audio> and <video>.',                            sources: ["'self'"],         newSource: '', _animKey: 0 },
  { name: 'object-src',       description: 'Controls sources for <object>, <embed>, <applet>.',                    sources: ["'none'"],         newSource: '', _animKey: 0 },
  { name: 'base-uri',         description: 'Restricts URLs in <base> elements.',                                   sources: ["'self'"],         newSource: '', _animKey: 0 },
  { name: 'form-action',      description: 'Restricts URLs for form submissions.',                                 sources: ["'self'"],         newSource: '', _animKey: 0 },
  { name: 'frame-ancestors',  description: 'Controls which origins may embed this page (replaces X-Frame-Options).', sources: ["'none'"],         newSource: '', _animKey: 0 },
])

// ── Logic ────────────────────────────────────────────────────────────────────
const UNSAFE = ["'unsafe-inline'", "'unsafe-eval'", '*', 'data:']

function addSource(dir: Directive) {
  const src = dir.newSource.trim()
  if (!src || dir.sources.includes(src)) return
  dir.sources.push(src)
  dir.newSource = ''
  dir._animKey = (dir._animKey ?? 0) + 1
}

function removeSource(dir: Directive, src: string) {
  dir.sources = dir.sources.filter(s => s !== src)
}

function warnings(dir: Directive): string[] {
  return dir.sources
    .filter(s => UNSAFE.includes(s))
    .map(s => s === '*'
      ? `${dir.name}: wildcard '*' allows any origin`
      : `${dir.name}: ${s} weakens XSS protection`
    )
}

const allWarnings = computed(() => directives.flatMap(warnings))

const cspValue = computed(() =>
  directives
    .filter(d => d.sources.length > 0)
    .map(d => `${d.name} ${d.sources.join(' ')}`)
    .join('; ')
)

const headerLine = computed(() => `Content-Security-Policy: ${cspValue.value}`)

// Score uplift
const hasUnsafe = computed(() => directives.some(d => d.sources.some(s => UNSAFE.includes(s))))
const uplift = computed(() => hasUnsafe.value ? 9 : 12)
const securityScore = computed(() => 78 + uplift.value)
const overallScore  = computed(() => 74 + Math.round(uplift.value * 0.4))

// Copy
const copied = ref(false)
async function copy() {
  await navigator.clipboard.writeText(headerLine.value)
  copied.value = true
  setTimeout(() => copied.value = false, 1600)
}

function isUnsafe(src: string) { return UNSAFE.includes(src) }
</script>

<template>
  <div class="page-bg">
    <div class="grid-bg" />
    <div class="atm-security" />

    <div class="tool-shell">

      <!-- ── Header strip ──────────────────────────────────── -->
      <div class="header-strip">
        <div class="card-accent-top" />
        <div class="header-inner">
          <div class="header-left">
            <div class="breadcrumb">
              <NuxtLink to="/dashboard" class="bc-link">Dashboard</NuxtLink>
              <span class="bc-sep">/</span>
              <NuxtLink to="/tools" class="bc-link">Tools</NuxtLink>
              <span class="bc-sep">/</span>
              <span class="bc-here">CSP Builder</span>
            </div>
            <div class="header-title-row">
              <div class="pillar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <div class="eyebrow-pillar">
                  <span class="eyebrow-swatch" />
                  Security &middot; Builder
                </div>
                <h1 class="display header-title">Content Security Policy</h1>
                <p class="header-sub">Construct the CSP header that tells browsers which sources are allowed to load your scripts, styles, images and frames.</p>
              </div>
            </div>
          </div>
          <div class="header-right">
            <div class="uplift-block">
              <div class="uplift-label">Score uplift</div>
              <div class="num uplift-num">+{{ uplift }}</div>
            </div>
            <button class="btn btn-ghost header-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Reset
            </button>
            <button class="btn btn-primary header-btn">
              Save &amp; rescan
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ── Warnings ──────────────────────────────────────── -->
      <div v-if="allWarnings.length" class="warn-banner">
        <svg class="warn-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
        <div>
          <p v-for="w in allWarnings" :key="w" class="warn-line">{{ w }}</p>
        </div>
      </div>

      <!-- ── Two-column layout ─────────────────────────────── -->
      <div class="tool-columns">

        <!-- LEFT: Directive editor -->
        <div class="directives-col">
          <div class="eyebrow" style="margin-bottom: 10px">Directive editor</div>
          <p class="directives-hint">
            Add allowed sources per directive. Tags with a warning icon weaken protection &mdash; remove them where possible.
          </p>
          <CspDirectivePanel
            :directives="directives"
            @add-source="addSource"
            @remove-source="removeSource"
          />
        </div>

        <!-- RIGHT: Output + Impact + Install -->
        <div class="output-col">
          <CspOutputPanel
            :header-line="headerLine"
            :csp-value="cspValue"
            :uplift="uplift"
            :security-score="securityScore"
            :overall-score="overallScore"
            :has-unsafe="hasUnsafe"
            :copied="copied"
            @copy="copy"
          />
        </div>

      </div>

      <ToolSeoSection slug="csp-builder" />
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────── */
.page-bg { min-height: 100vh; background: var(--canvas); position: relative; overflow: hidden; }
.grid-bg { position: absolute; inset: 0; opacity: 0.35; }
.atm-security { position: absolute; top: -100px; right: -100px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(0,212,170,0.06), transparent 60%); pointer-events: none; }

.tool-shell { position: relative; max-width: 100%; padding: 0 32px 80px; }

/* ── Header strip ────────────────────────────────────────────── */
.header-strip { position: relative; padding: 22px 0; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
.card-accent-top { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(to right, var(--p-security), transparent); }
.header-inner { display: flex; justify-content: space-between; align-items: center; gap: 16px; }

.header-left { display: flex; flex-direction: column; gap: 0; }

.breadcrumb { display: flex; align-items: center; gap: 6px; font-family: var(--font-display); font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
.bc-link { color: var(--text-muted); text-decoration: none; cursor: pointer; transition: color 0.15s; }
.bc-link:hover { color: var(--text); }
.bc-sep { opacity: 0.4; }
.bc-here { color: var(--text); }

.header-title-row { display: flex; align-items: center; gap: 16px; }

.pillar-icon {
  width: 42px; height: 42px; border-radius: 10px;
  background: rgba(0,212,170,0.15);
  display: flex; align-items: center; justify-content: center;
  color: var(--p-security); flex-shrink: 0;
}

.eyebrow-pillar {
  font-family: var(--font-display); font-size: 11px; letter-spacing: 0.2em;
  text-transform: uppercase; font-weight: 600;
  color: var(--p-security); margin-bottom: 3px;
  display: inline-flex; align-items: center; gap: 8px;
}
.eyebrow-swatch { width: 22px; height: 2px; background: var(--p-security); display: inline-block; }

.header-title { font-family: var(--font-display); font-size: 30px; font-weight: 700; letter-spacing: -0.03em; margin: 0 0 4px; color: var(--text); line-height: 1; }
.header-sub { font-family: var(--font-body); font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.55; max-width: 540px; }

.header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.uplift-block { text-align: right; }
.uplift-label { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-faint); margin-bottom: 4px; font-family: var(--font-display); font-weight: 600; }
.uplift-num { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.05em; font-size: 30px; color: var(--p-security); line-height: 1; }
.header-btn { height: 40px; }

/* ── Warning banner ──────────────────────────────────────────── */
.warn-banner { display: flex; align-items: flex-start; gap: 10px; padding: 14px 18px; margin-bottom: 20px; background: rgba(255,71,87,0.06); border: 1px solid rgba(255,71,87,0.18); border-left: 3px solid #ff4757; border-radius: 8px; }
.warn-icon { color: #ff4757; flex-shrink: 0; margin-top: 1px; }
.warn-line { font-family: var(--font-body); font-size: 12px; color: rgba(255,100,110,0.9); margin: 0; line-height: 1.6; }

/* ── Two-column ───────────────────────────────────────────────── */
.tool-columns { display: grid; grid-template-columns: 40% 60%; gap: 0; border-top: 1px solid var(--border); }
@media (max-width: 900px) { .tool-columns { grid-template-columns: 1fr; } }

.directives-col { padding: 32px 32px 60px; border-right: 1px solid var(--border); }
.directives-hint { font-family: var(--font-body); font-size: 14px; color: var(--text-muted); margin: 10px 0 24px; line-height: 1.55; }
.directives-hint::before { content: ''; }

.output-col { padding: 32px 32px 60px; display: flex; flex-direction: column; gap: 22px; }

/* ── Buttons (override tool layout) ──────────────────────────── */
:global(.btn) { display: inline-flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 9px; font-family: var(--font-display); font-weight: 600; font-size: 14px; letter-spacing: -0.01em; border: 1px solid transparent; cursor: pointer; transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease; text-decoration: none; }
:global(.btn:active) { transform: scale(0.98); }
:global(.btn-primary) { background: var(--brand); color: #fff; box-shadow: 0 0 24px rgba(236,53,134,0.28), inset 0 1px 0 rgba(255,255,255,0.2); }
:global(.btn-primary:hover) { background: #f14b95; }
:global(.btn-ghost) { background: transparent; color: var(--text); border-color: var(--border-strong); }
:global(.btn-ghost:hover) { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.03); }

@media (prefers-reduced-motion: reduce) {
  .bc-link { transition: none; }
  :global(.btn) { transition: none; }
  :global(.btn:active) { transform: none; }
  .input-field { transition: none; }
  .copy-btn { transition: none; }
  .download-btn { transition: none; }
  .policy-btn { transition: none; }
}
</style>