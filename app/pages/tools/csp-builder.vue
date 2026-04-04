<script setup lang="ts">
definePageMeta({ layout: 'tool' })
useHead({ title: 'CSP Header Builder — ScanPulse Tools' })
useSeoMeta({ description: 'Build a Content-Security-Policy header visually. Add sources per directive, get unsafe-inline warnings, and copy the full CSP value — free.' })

interface Directive {
  name: string
  description: string
  sources: string[]
  newSource: string
}

const directives = reactive<Directive[]>([
  { name: 'default-src',     description: 'Fallback for all resource types not covered by a specific directive.', sources: ["'self'"], newSource: '' },
  { name: 'script-src',      description: 'Controls JavaScript sources.', sources: ["'self'"], newSource: '' },
  { name: 'style-src',       description: 'Controls CSS sources.', sources: ["'self'"], newSource: '' },
  { name: 'img-src',         description: 'Controls image sources.', sources: ["'self'", 'data:'], newSource: '' },
  { name: 'font-src',        description: 'Controls font file sources.', sources: ["'self'"], newSource: '' },
  { name: 'connect-src',     description: 'Controls URLs for fetch, XHR, WebSocket.', sources: ["'self'"], newSource: '' },
  { name: 'frame-src',       description: 'Controls sources for <frame> and <iframe>.', sources: ["'none'"], newSource: '' },
  { name: 'media-src',       description: 'Controls sources for <audio> and <video>.', sources: ["'self'"], newSource: '' },
  { name: 'object-src',      description: 'Controls sources for <object>, <embed>, <applet>.', sources: ["'none'"], newSource: '' },
  { name: 'base-uri',        description: 'Restricts URLs in <base> elements.', sources: ["'self'"], newSource: '' },
  { name: 'form-action',     description: 'Restricts URLs for form submissions.', sources: ["'self'"], newSource: '' },
  { name: 'frame-ancestors', description: 'Controls which origins may embed this page (replaces X-Frame-Options).', sources: ["'none'"], newSource: '' },
])

function addSource(dir: Directive) {
  const src = dir.newSource.trim()
  if (!src || dir.sources.includes(src)) return
  dir.sources.push(src)
  dir.newSource = ''
}

function removeSource(dir: Directive, src: string) {
  dir.sources = dir.sources.filter(s => s !== src)
}

const UNSAFE = ["'unsafe-inline'", "'unsafe-eval'", '*']

function warnings(dir: Directive): string[] {
  return dir.sources.filter(s => UNSAFE.includes(s)).map(s =>
    s === '*' ? `${dir.name}: wildcard '*' allows any origin` : `${dir.name}: ${s} weakens XSS protection`
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

const copied = ref(false)
async function copy() {
  await navigator.clipboard.writeText(headerLine.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

function isBad(src: string) { return UNSAFE.includes(src) }
</script>

<template>
  <div class="page-bg">
    <div class="tool-shell">

      <div class="tool-header">
        <div class="tool-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          Security
        </div>
        <h1 class="tool-title">CSP Header Builder</h1>
        <p class="tool-subtitle">Build a <code>Content-Security-Policy</code> header visually. Add trusted sources per directive, see warnings for dangerous values, then copy the final header.</p>
      </div>

      <!-- Warnings -->
      <div v-if="allWarnings.length" class="warn-banner">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="warn-icon"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
        <div>
          <p v-for="w in allWarnings" :key="w" class="warn-line">{{ w }}</p>
        </div>
      </div>

      <div class="tool-columns">

        <!-- Directive editor -->
        <div class="directives-col">
          <div v-for="dir in directives" :key="dir.name" class="dir-card">
            <div class="dir-header">
              <code class="dir-name">{{ dir.name }}</code>
              <p class="dir-desc">{{ dir.description }}</p>
            </div>

            <!-- Source chips -->
            <div class="source-chips">
              <span
                v-for="src in dir.sources"
                :key="src"
                class="chip"
                :class="{ 'chip--bad': isBad(src) }"
              >
                {{ src }}
                <button class="chip-remove" @click="removeSource(dir, src)">×</button>
              </span>
            </div>

            <!-- Add source -->
            <div class="add-source-row">
              <input
                v-model="dir.newSource"
                class="add-input"
                type="text"
                placeholder="e.g. https://cdn.example.com"
                @keydown.enter="addSource(dir)"
              />
              <button class="add-btn" @click="addSource(dir)">Add</button>
            </div>
          </div>
        </div>

        <!-- Output -->
        <div class="output-col">

          <div class="output-card">
            <div class="output-header">
              <div class="output-title-row">
                <span class="output-dot"></span>
                <p class="output-label">Content-Security-Policy header</p>
              </div>
              <button class="copy-btn" @click="copy">
                <svg v-if="!copied" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                {{ copied ? 'Copied!' : 'Copy header' }}
              </button>
            </div>
            <pre class="output-code">{{ headerLine }}</pre>
          </div>

          <div class="output-card">
            <div class="output-header">
              <div class="output-title-row">
                <span class="output-dot output-dot--dim"></span>
                <p class="output-label">Value only</p>
              </div>
            </div>
            <pre class="output-code output-code--dim">{{ cspValue }}</pre>
          </div>

          <!-- Pro -->
          <div class="output-card pro-card">
            <div class="output-header">
              <div class="output-title-row">
                <span class="output-dot output-dot--pro"></span>
                <p class="output-label">Presets &amp; platform install</p>
              </div>
              <span class="pro-badge">Pro</span>
            </div>
            <ProGate feature="Unlock presets & platform guides">
              <div class="pro-placeholder">
                <div class="preset-row">
                  <button class="preset-btn">Strict</button>
                  <button class="preset-btn">Google Analytics</button>
                  <button class="preset-btn">Cloudflare</button>
                </div>
                <div class="platform-tabs-mock">
                  <span class="ptab ptab--active">Nginx</span>
                  <span class="ptab">Apache</span>
                  <span class="ptab">Next.js</span>
                  <span class="ptab">&lt;meta&gt;</span>
                </div>
              </div>
            </ProGate>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-bg { min-height: 100vh; background: #07070a; }
.tool-shell { max-width: 1080px; margin: 0 auto; padding: 48px 28px 80px; }

/* ── Header ──────────────────────────────────────────────── */
.tool-header { margin-bottom: 24px; }
.tool-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 3px; margin-bottom: 12px;
  color: #00d4aa;
  background: rgba(0,212,170,0.1);
  border: 1px solid rgba(0,212,170,0.2);
}
.tool-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800; color: white; letter-spacing: -0.03em; margin-bottom: 10px;
}
.tool-subtitle {
  font-family: 'DM Sans', sans-serif; font-size: 15px;
  color: rgba(255,255,255,0.60); line-height: 1.6; max-width: 580px;
}
.tool-subtitle code {
  font-family: monospace; font-size: 13px;
  background: rgba(255,255,255,0.07); padding: 1px 5px; border-radius: 3px;
  color: rgba(255,255,255,0.55);
}

/* ── Warning banner ──────────────────────────────────────── */
.warn-banner {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px 18px; margin-bottom: 20px;
  background: rgba(255,71,87,0.06);
  border: 1px solid rgba(255,71,87,0.18);
  border-left: 3px solid #ff4757;
  border-radius: 8px;
}
.warn-icon { color: #ff4757; flex-shrink: 0; margin-top: 1px; }
.warn-line {
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,100,110,0.9); margin: 0; line-height: 1.6;
}

/* ── Columns ─────────────────────────────────────────────── */
.tool-columns {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 20px; align-items: start;
}
@media (max-width: 768px) { .tool-columns { grid-template-columns: 1fr; } }

/* ── Directive cards ─────────────────────────────────────── */
.directives-col { display: flex; flex-direction: column; gap: 8px; }

.dir-card {
  background: #0c0c12; border: 1px solid rgba(255,255,255,0.06);
  border-left: 3px solid rgba(0,212,170,0.3);
  border-radius: 10px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 10px;
  transition: border-left-color 0.2s;
}
.dir-card:hover { border-left-color: #00d4aa; }

.dir-header { display: flex; flex-direction: column; gap: 4px; }
.dir-name {
  font-family: 'Fira Mono', monospace; font-size: 11px; font-weight: 600;
  color: #00d4aa; background: rgba(0,212,170,0.1);
  border: 1px solid rgba(0,212,170,0.18);
  padding: 3px 8px; border-radius: 4px; align-self: flex-start;
}
.dir-desc {
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.50); margin: 0;
}

/* ── Chips ───────────────────────────────────────────────── */
.source-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: 'Fira Mono', monospace; font-size: 11px;
  color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 3px 8px; border-radius: 4px;
}
.chip--bad { color: #ff6b78; background: rgba(255,71,87,0.08); border-color: rgba(255,71,87,0.2); }
.chip-remove {
  background: none; border: none; cursor: pointer;
  color: inherit; opacity: 0.45; padding: 0; font-size: 13px; line-height: 1;
  transition: opacity 0.15s;
}
.chip-remove:hover { opacity: 1; }

/* ── Add source ──────────────────────────────────────────── */
.add-source-row { display: flex; gap: 6px; }
.add-input {
  flex: 1; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 5px; padding: 6px 10px;
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.7); outline: none;
  transition: border-color 0.15s;
}
.add-input:focus { border-color: rgba(0,212,170,0.35); }
.add-input::placeholder { color: rgba(255,255,255,0.15); }
.add-btn {
  background: rgba(0,212,170,0.1); border: 1px solid rgba(0,212,170,0.2);
  border-radius: 5px; padding: 6px 12px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: #00d4aa; cursor: pointer; transition: background 0.15s;
}
.add-btn:hover { background: rgba(0,212,170,0.18); }

/* ── Output column ───────────────────────────────────────── */
.output-col {
  position: sticky;
  top: 88px;
  max-height: calc(100vh - 104px);
  overflow-y: auto;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.output-col::-webkit-scrollbar { display: none; }

.output-card {
  background: #0c0c12; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; overflow: hidden;
}
.output-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.04);
}

/* Output title row with colored dot */
.output-title-row {
  display: flex; align-items: center; gap: 8px;
}
.output-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #00d4aa;
  box-shadow: 0 0 6px rgba(0,212,170,0.5);
  flex-shrink: 0;
}
.output-dot--dim {
  background: rgba(0,212,170,0.35);
  box-shadow: none;
}
.output-dot--pro {
  background: #ec3586;
  box-shadow: 0 0 6px rgba(236,53,134,0.4);
}

.output-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(255,255,255,0.45); margin: 0;
}
.output-code {
  font-family: 'Fira Mono', monospace; font-size: 11px;
  color: rgba(255,255,255,0.7); line-height: 1.7;
  padding: 16px 18px; margin: 0; white-space: pre-wrap; word-break: break-all;
}
.output-code--dim { color: rgba(255,255,255,0.4); }

.copy-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: #00d4aa; background: rgba(0,212,170,0.08);
  border: 1px solid rgba(0,212,170,0.2);
  border-radius: 4px; padding: 5px 10px; cursor: pointer; transition: background 0.15s;
}
.copy-btn:hover { background: rgba(0,212,170,0.16); }

.pro-badge {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #ec3586; background: rgba(236,53,134,0.1);
  border: 1px solid rgba(236,53,134,0.2); padding: 3px 8px; border-radius: 3px;
}

.pro-placeholder { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.preset-row { display: flex; gap: 8px; flex-wrap: wrap; }
.preset-btn {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  padding: 6px 14px; border-radius: 5px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.25); cursor: default;
}
.platform-tabs-mock { display: flex; gap: 4px; flex-wrap: wrap; }
.ptab {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  padding: 6px 12px; border-radius: 5px;
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.2);
}
.ptab--active { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
</style>
