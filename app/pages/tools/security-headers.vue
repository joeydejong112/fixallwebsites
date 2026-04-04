<script setup lang="ts">
definePageMeta({ layout: 'tool' })
useHead({ title: 'Security Headers Generator — ScanPulse Tools' })
useSeoMeta({ description: 'Generate HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy, and more in seconds. Copy individual headers or all at once — free.' })

// ── Header definitions ────────────────────────────────────────────────────
const headers = reactive([
  {
    name: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
    enabled: true,
    description: 'Forces HTTPS for 1 year, including all subdomains. Enables browser preload list eligibility.',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
    severity: 'critical',
  },
  {
    name: 'X-Content-Type-Options',
    value: 'nosniff',
    enabled: true,
    description: 'Prevents browsers from MIME-sniffing a response. Stops XSS attacks via content-type confusion.',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options',
    severity: 'warning',
  },
  {
    name: 'X-Frame-Options',
    value: 'DENY',
    enabled: true,
    description: 'Prevents your page from being embedded in iframes. Stops clickjacking attacks.',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options',
    severity: 'warning',
  },
  {
    name: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
    enabled: true,
    description: 'Controls how much referrer info is sent. Prevents leaking full URLs to third parties.',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy',
    severity: 'warning',
  },
  {
    name: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    enabled: true,
    description: 'Restricts browser features your site doesn\'t need. Reduces attack surface.',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy',
    severity: 'warning',
  },
  {
    name: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp',
    enabled: false,
    description: 'Required for SharedArrayBuffer and high-resolution timers. May break third-party embeds.',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy',
    severity: 'info',
  },
  {
    name: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
    enabled: false,
    description: 'Process-isolates your page from other origins. Pairs with COEP for full isolation.',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy',
    severity: 'info',
  },
])

// ── Copy state ────────────────────────────────────────────────────────────
const copiedAll = ref(false)
const copiedIdx = ref<number | null>(null)

async function copyOne(i: number) {
  const h = headers[i]
  await navigator.clipboard.writeText(`${h.name}: ${h.value}`)
  copiedIdx.value = i
  setTimeout(() => copiedIdx.value = null, 2000)
}

const allEnabled = computed(() => headers.filter(h => h.enabled))

async function copyAll() {
  const text = allEnabled.value.map(h => `${h.name}: ${h.value}`).join('\n')
  await navigator.clipboard.writeText(text)
  copiedAll.value = true
  setTimeout(() => copiedAll.value = false, 2000)
}

function severityLabel(s: string) {
  if (s === 'critical') return 'Critical'
  if (s === 'warning')  return 'Important'
  return 'Optional'
}

// ── Generated nginx block ─────────────────────────────────────────────────
const nginxOutput = computed(() =>
  allEnabled.value.map(h => `add_header ${h.name} "${h.value}";`).join('\n')
)
</script>

<template>
  <div class="page-bg">
    <div class="tool-shell">

      <!-- ── Page header ───────────────────────────────────────── -->
      <div class="tool-header">
        <div class="tool-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.88-2.67 7.52-6 8.93-3.33-1.41-6-5.05-6-8.93V7.67L12 5z"/>
          </svg>
          Security
        </div>
        <h1 class="tool-title">Security Headers Generator</h1>
        <p class="tool-subtitle">Toggle the headers you need, edit values, then copy the full block into your server config to harden your site against common attacks.</p>
      </div>

      <!-- ── Stats strip ───────────────────────────────────────── -->
      <div class="stats-strip">
        <div class="stat-pill">
          <span class="stat-num">{{ allEnabled.length }}</span>
          <span class="stat-sep">/</span>
          <span class="stat-denom">{{ headers.length }}</span>
          <span class="stat-label">headers enabled</span>
        </div>
        <div class="stat-divider" />
        <div class="sev-count">
          <span class="sev-pip sev-pip--critical" />
          <span class="sev-text">{{ headers.filter(h => h.severity === 'critical').length }} critical</span>
        </div>
        <div class="sev-count">
          <span class="sev-pip sev-pip--warning" />
          <span class="sev-text">{{ headers.filter(h => h.severity === 'warning').length }} important</span>
        </div>
        <div class="sev-count">
          <span class="sev-pip sev-pip--info" />
          <span class="sev-text">{{ headers.filter(h => h.severity === 'info').length }} optional</span>
        </div>
      </div>

      <!-- ── Two-column layout ─────────────────────────────────── -->
      <div class="tool-columns">

        <!-- ── Left: header toggles ─────────────────────────────── -->
        <div class="headers-col">
          <div
            v-for="(header, i) in headers"
            :key="header.name"
            class="header-card"
            :class="[`header-card--${header.severity}`, { 'header-card--off': !header.enabled }]"
          >
            <!-- Top row -->
            <div class="card-top">
              <!-- Toggle -->
              <label class="toggle-label">
                <input v-model="header.enabled" type="checkbox" class="toggle-input" />
                <span class="toggle-track"><span class="toggle-thumb" /></span>
              </label>

              <!-- Name + severity badge -->
              <div class="name-group">
                <span class="header-name">{{ header.name }}</span>
                <span class="sev-badge" :class="`sev-badge--${header.severity}`">
                  {{ severityLabel(header.severity) }}
                </span>
              </div>

              <!-- Actions -->
              <div class="card-actions">
                <a :href="header.docs" target="_blank" rel="noopener" class="docs-btn" title="MDN documentation">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
                <button
                  class="copy-one-btn"
                  :disabled="!header.enabled"
                  :class="{ 'copy-one-btn--copied': copiedIdx === i }"
                  :title="copiedIdx === i ? 'Copied!' : 'Copy header'"
                  @click="copyOne(i)"
                >
                  <svg v-if="copiedIdx !== i" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Value input -->
            <div class="value-row">
              <span class="value-label">Value</span>
              <input
                v-model="header.value"
                class="header-value-input"
                :disabled="!header.enabled"
                type="text"
                spellcheck="false"
              />
            </div>

            <!-- Description -->
            <p class="header-desc">{{ header.description }}</p>
          </div>
        </div>

        <!-- ── Right: output ─────────────────────────────────────── -->
        <div class="output-col">

          <!-- HTTP raw headers -->
          <div class="output-card">
            <div class="output-header">
              <div class="output-title-row">
                <div class="output-dot output-dot--http" />
                <p class="output-label">HTTP Headers</p>
              </div>
              <button class="copy-btn" @click="copyAll">
                <svg v-if="!copiedAll" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                {{ copiedAll ? 'Copied!' : 'Copy all' }}
              </button>
            </div>
            <div class="code-block">
              <template v-if="allEnabled.length">
                <div v-for="h in allEnabled" :key="h.name" class="code-line">
                  <span class="code-name">{{ h.name }}</span><span class="code-sep">: </span><span class="code-val">{{ h.value }}</span>
                </div>
              </template>
              <p v-else class="code-empty">Enable at least one header above</p>
            </div>
          </div>

          <!-- Nginx snippet -->
          <div class="output-card">
            <div class="output-header">
              <div class="output-title-row">
                <div class="output-dot output-dot--nginx" />
                <p class="output-label">Nginx Config</p>
              </div>
            </div>
            <div class="code-block">
              <template v-if="allEnabled.length">
                <div v-for="h in allEnabled" :key="h.name" class="code-line">
                  <span class="code-kw">add_header</span>
                  <span class="code-name"> {{ h.name }}</span>
                  <span class="code-sep"> "</span><span class="code-val">{{ h.value }}</span><span class="code-sep">"</span><span class="code-punct">;</span>
                </div>
              </template>
              <p v-else class="code-empty"># Enable headers above</p>
            </div>
          </div>

          <!-- Pro: platform guides -->
          <div class="output-card pro-card">
            <div class="output-header">
              <div class="output-title-row">
                <div class="output-dot output-dot--pro" />
                <p class="output-label">Platform Guides & Site Checker</p>
              </div>
              <span class="pro-badge">Pro</span>
            </div>
            <ProGate feature="Apache, Cloudflare, Vercel & site checker">
              <div class="pro-placeholder">
                <div class="platform-tabs-mock">
                  <span class="ptab ptab--active">Nginx</span>
                  <span class="ptab">Apache</span>
                  <span class="ptab">Cloudflare</span>
                  <span class="ptab">Vercel</span>
                  <span class="ptab">Next.js</span>
                </div>
                <p class="pro-placeholder-text">Enter a URL → fetch live headers → compare against recommended</p>
              </div>
            </ProGate>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Base ────────────────────────────────────────────────── */
.page-bg { min-height: 100vh; background: #07070a; }
.tool-shell { max-width: 1100px; margin: 0 auto; padding: 48px 28px 80px; }

/* ── Page header ─────────────────────────────────────────── */
.tool-header { margin-bottom: 28px; }

.tool-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Space Grotesk', sans-serif; font-size: 9px;
  font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
  color: #00d4aa; background: rgba(0,212,170,0.08);
  border: 1px solid rgba(0,212,170,0.2);
  padding: 5px 11px; border-radius: 4px; margin-bottom: 14px;
}

.tool-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.75rem, 3.5vw, 2.4rem);
  font-weight: 800; color: white; letter-spacing: -0.03em;
  margin: 0 0 10px;
}

.tool-subtitle {
  font-family: 'DM Sans', sans-serif; font-size: 14.5px;
  color: rgba(255,255,255,0.60); line-height: 1.65; max-width: 560px; margin: 0;
}

/* ── Stats strip ─────────────────────────────────────────── */
.stats-strip {
  display: flex; align-items: center; gap: 16px;
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  padding: 10px 18px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.stat-pill {
  display: flex; align-items: baseline; gap: 3px;
  font-family: 'Space Grotesk', sans-serif;
}
.stat-num { font-size: 18px; font-weight: 800; color: #00d4aa; line-height: 1; }
.stat-sep { font-size: 13px; color: rgba(255,255,255,0.50); }
.stat-denom { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.50); }
.stat-label { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; color: rgba(255,255,255,0.50); margin-left: 4px; }

.stat-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.08); flex-shrink: 0; }

.sev-count { display: flex; align-items: center; gap: 6px; }
.sev-pip { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.sev-pip--critical { background: #ff4757; box-shadow: 0 0 6px rgba(255,71,87,0.5); }
.sev-pip--warning  { background: #ffaa00; box-shadow: 0 0 6px rgba(255,170,0,0.4); }
.sev-pip--info     { background: rgba(255,255,255,0.25); }
.sev-text {
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.50);
}

/* ── Layout ──────────────────────────────────────────────── */
.tool-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) { .tool-columns { grid-template-columns: 1fr; } }

/* ── Header cards ────────────────────────────────────────── */
.headers-col { display: flex; flex-direction: column; gap: 8px; }

.header-card {
  background: #0f0f16;
  border: 1px solid rgba(255,255,255,0.07);
  border-left: 3px solid transparent;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex; flex-direction: column; gap: 10px;
  transition: border-color 0.15s, opacity 0.2s, background 0.15s;
}
.header-card--critical { border-left-color: #ff4757; }
.header-card--warning  { border-left-color: #ffaa00; }
.header-card--info     { border-left-color: rgba(255,255,255,0.15); }
.header-card--off { opacity: 0.42; }
.header-card:not(.header-card--off):hover { background: #12121a; border-color: rgba(255,255,255,0.11); }
.header-card--critical:not(.header-card--off):hover { border-left-color: #ff4757; }
.header-card--warning:not(.header-card--off):hover  { border-left-color: #ffaa00; }

/* ── Card top row ────────────────────────────────────────── */
.card-top {
  display: flex; align-items: center; gap: 10px;
}

.name-group {
  flex: 1; min-width: 0;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}

.header-name {
  font-family: 'Fira Mono', 'Cascadia Code', monospace;
  font-size: 12px; font-weight: 500;
  color: rgba(255,255,255,0.85);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.sev-badge {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 8px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 3px; flex-shrink: 0;
}
.sev-badge--critical { color: #ff4757; background: rgba(255,71,87,0.1); border: 1px solid rgba(255,71,87,0.2); }
.sev-badge--warning  { color: #ffaa00; background: rgba(255,170,0,0.1); border: 1px solid rgba(255,170,0,0.2); }
.sev-badge--info     { color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }

/* ── Card actions ────────────────────────────────────────── */
.card-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

.docs-btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  color: rgba(255,255,255,0.2);
  transition: color 0.15s, background 0.15s;
}
.docs-btn:hover { color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.06); }

.copy-one-btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.2);
  transition: color 0.15s, background 0.15s;
}
.copy-one-btn:hover:not(:disabled) { color: #00d4aa; background: rgba(0,212,170,0.08); }
.copy-one-btn--copied { color: #00d4aa !important; }
.copy-one-btn:disabled { cursor: not-allowed; opacity: 0.25; }

/* ── Toggle ──────────────────────────────────────────────── */
.toggle-label { display: flex; align-items: center; cursor: pointer; flex-shrink: 0; }
.toggle-input { display: none; }
.toggle-track {
  width: 34px; height: 19px; border-radius: 10px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  position: relative; transition: background 0.2s, border-color 0.2s; flex-shrink: 0;
}
.toggle-input:checked + .toggle-track { background: #00d4aa; border-color: #00d4aa; }
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 11px; height: 11px; border-radius: 50%;
  background: white; transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.toggle-input:checked + .toggle-track .toggle-thumb { transform: translateX(15px); }

/* ── Value row ───────────────────────────────────────────── */
.value-row {
  display: flex; align-items: center; gap: 10px;
}
.value-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: rgba(255,255,255,0.45); flex-shrink: 0; width: 36px;
}
.header-value-input {
  flex: 1; min-width: 0;
  font-family: 'Fira Mono', 'Cascadia Code', monospace;
  font-size: 11px; color: rgba(255,255,255,0.65);
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 6px;
  padding: 7px 11px;
  outline: none; transition: border-color 0.15s, color 0.15s;
  box-sizing: border-box;
}
.header-value-input:focus { border-color: rgba(0,212,170,0.35); color: rgba(255,255,255,0.85); }
.header-value-input:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Description ─────────────────────────────────────────── */
.header-desc {
  font-family: 'DM Sans', sans-serif; font-size: 12.5px;
  color: rgba(255,255,255,0.50); line-height: 1.55; margin: 0;
}

/* ── Output column ───────────────────────────────────────── */
.output-col {
  display: flex; flex-direction: column; gap: 12px;
  position: sticky; top: 88px;
  max-height: calc(100vh - 104px); overflow-y: auto;
  scrollbar-width: none;
}
.output-col::-webkit-scrollbar { display: none; }

.output-card {
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  overflow: hidden;
}
.pro-card { /* no extra styles needed */ }

/* ── Output header ───────────────────────────────────────── */
.output-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.02);
}

.output-title-row {
  display: flex; align-items: center; gap: 8px;
}

.output-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.output-dot--http  { background: #00d4aa; box-shadow: 0 0 6px rgba(0,212,170,0.5); }
.output-dot--nginx { background: #6c5ce7; box-shadow: 0 0 6px rgba(108,92,231,0.5); }
.output-dot--pro   { background: #ec3586; box-shadow: 0 0 6px rgba(236,53,134,0.5); }

.output-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(255,255,255,0.45); margin: 0;
}

.copy-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.06em;
  color: #00d4aa; background: rgba(0,212,170,0.08);
  border: 1px solid rgba(0,212,170,0.2);
  border-radius: 5px; padding: 5px 11px;
  cursor: pointer; transition: background 0.15s;
}
.copy-btn:hover { background: rgba(0,212,170,0.15); }

/* ── Code block ──────────────────────────────────────────── */
.code-block {
  padding: 14px 16px;
  display: flex; flex-direction: column; gap: 4px;
  min-height: 60px;
}

.code-line {
  font-family: 'Fira Mono', 'Cascadia Code', monospace;
  font-size: 11px; line-height: 1.7;
  display: flex; flex-wrap: wrap; align-items: baseline;
}
.code-kw   { color: #c792ea; }
.code-name { color: #82aaff; }
.code-sep  { color: rgba(255,255,255,0.25); }
.code-val  { color: #c3e88d; word-break: break-all; }
.code-punct { color: rgba(255,255,255,0.3); }

.code-empty {
  font-family: 'Fira Mono', monospace; font-size: 11px;
  color: rgba(255,255,255,0.2); margin: 0; font-style: italic;
}

/* ── Pro section ─────────────────────────────────────────── */
.pro-badge {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px;
  font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: #ec3586; background: rgba(236,53,134,0.1);
  border: 1px solid rgba(236,53,134,0.2);
  padding: 3px 8px; border-radius: 3px;
}

.pro-placeholder { padding: 20px 16px; display: flex; flex-direction: column; gap: 14px; }
.platform-tabs-mock { display: flex; gap: 4px; flex-wrap: wrap; }
.ptab {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  padding: 5px 11px; border-radius: 5px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.2);
}
.ptab--active { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.4); }
.pro-placeholder-text {
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.22); margin: 0; line-height: 1.5;
}
</style>
