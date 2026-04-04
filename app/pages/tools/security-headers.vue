<script setup lang="ts">
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
const copiedAll  = ref(false)
const copiedIdx  = ref<number | null>(null)

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

function severityColor(s: string) {
  if (s === 'critical') return '#ff4757'
  if (s === 'warning')  return '#ffaa00'
  return 'rgba(255,255,255,0.25)'
}

// ── Generated block ───────────────────────────────────────────────────────
const nginxOutput = computed(() =>
  allEnabled.value.map(h => `add_header ${h.name} "${h.value}";`).join('\n')
)
</script>

<template>
  <div class="page-bg">
    <NavBar />
    <div class="tool-shell">

      <!-- Back -->
      <NuxtLink to="/tools" class="back-link">← All Tools</NuxtLink>

      <!-- Header -->
      <div class="tool-header">
        <div class="tool-badge" style="color:#00d4aa;background:rgba(0,212,170,0.1)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.88-2.67 7.52-6 8.93-3.33-1.41-6-5.05-6-8.93V7.67L12 5z"/></svg>
          Security
        </div>
        <h1 class="tool-title">Security Headers Generator</h1>
        <p class="tool-subtitle">Toggle the headers you need, copy individual lines or the full block. Add to your server config to harden your site against common attacks.</p>
      </div>

      <div class="tool-columns">

        <!-- ── Left: header toggles ────────────────────────────────── -->
        <div class="headers-col">
          <div
            v-for="(header, i) in headers"
            :key="header.name"
            class="header-card"
            :class="{ 'header-card--disabled': !header.enabled }"
          >
            <div class="header-card-top">
              <!-- Toggle -->
              <label class="toggle-label">
                <input v-model="header.enabled" type="checkbox" class="toggle-input" />
                <span class="toggle-track">
                  <span class="toggle-thumb" />
                </span>
              </label>

              <!-- Name + severity dot -->
              <div class="header-name-row">
                <span
                  class="severity-dot"
                  :style="{ background: severityColor(header.severity) }"
                  :title="header.severity"
                />
                <span class="header-name">{{ header.name }}</span>
              </div>

              <!-- Copy single -->
              <button
                class="copy-one-btn"
                :disabled="!header.enabled"
                @click="copyOne(i)"
              >
                <svg v-if="copiedIdx !== i" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </button>
            </div>

            <!-- Value (editable) -->
            <input
              v-model="header.value"
              class="header-value-input"
              :disabled="!header.enabled"
              type="text"
            />

            <!-- Description -->
            <p class="header-desc">{{ header.description }}</p>
          </div>
        </div>

        <!-- ── Right: output ───────────────────────────────────────── -->
        <div class="output-col">

          <!-- All-headers copy block -->
          <div class="output-card">
            <div class="output-header">
              <p class="output-label">HTTP headers (raw)</p>
              <button class="copy-btn" @click="copyAll">
                <svg v-if="!copiedAll" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                {{ copiedAll ? 'Copied!' : 'Copy all' }}
              </button>
            </div>
            <pre class="output-code">{{ allEnabled.map(h => `${h.name}: ${h.value}`).join('\n') || '# Enable at least one header above' }}</pre>
          </div>

          <!-- Nginx snippet -->
          <div class="output-card" style="margin-top:16px">
            <div class="output-header">
              <p class="output-label">Nginx config snippet</p>
            </div>
            <pre class="output-code">{{ nginxOutput || '# Enable headers above' }}</pre>
          </div>

          <!-- Pro: platform tabs + site checker -->
          <div class="output-card pro-card" style="margin-top:16px">
            <div class="output-header">
              <p class="output-label">Platform install guides & site checker</p>
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
.page-bg { min-height: 100vh; background: #07070a; }
.tool-shell { max-width: 1080px; margin: 0 auto; padding: 100px 24px 80px; }

.back-link {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  color: rgba(255,255,255,0.3); text-decoration: none;
  margin-bottom: 32px; transition: color 0.15s;
}
.back-link:hover { color: rgba(255,255,255,0.7); }

.tool-header { margin-bottom: 36px; }
.tool-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 9px;
  font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 3px; margin-bottom: 12px;
}
.tool-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800; color: white; letter-spacing: -0.03em; margin-bottom: 10px;
}
.tool-subtitle {
  font-family: 'DM Sans', sans-serif; font-size: 15px;
  color: rgba(255,255,255,0.38); line-height: 1.6; max-width: 580px;
}

/* ── Layout ──────────────────────────────────────────────── */
.tool-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 768px) { .tool-columns { grid-template-columns: 1fr; } }

/* ── Header cards ────────────────────────────────────────── */
.headers-col { display: flex; flex-direction: column; gap: 10px; }

.header-card {
  background: #0f0f14;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s, opacity 0.15s;
}
.header-card--disabled { opacity: 0.45; }
.header-card:not(.header-card--disabled):hover { border-color: rgba(255,255,255,0.1); }

.header-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-name-row {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
  min-width: 0;
}

.severity-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.header-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255,255,255,0.75);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-value-input {
  font-family: 'Fira Mono', monospace;
  font-size: 11px;
  color: rgba(255,255,255,0.55);
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 5px;
  padding: 6px 10px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.header-value-input:focus { border-color: rgba(0,212,170,0.3); }
.header-value-input:disabled { opacity: 0.4; cursor: not-allowed; }

.header-desc {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  color: rgba(255,255,255,0.22);
  line-height: 1.5;
  margin: 0;
}

/* ── Toggle ──────────────────────────────────────────────── */
.toggle-label { display: flex; align-items: center; cursor: pointer; flex-shrink: 0; }
.toggle-input { display: none; }
.toggle-track {
  width: 32px; height: 18px; border-radius: 9px;
  background: rgba(255,255,255,0.1); position: relative;
  transition: background 0.2s; flex-shrink: 0;
}
.toggle-input:checked + .toggle-track { background: #00d4aa; }
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 12px; height: 12px; border-radius: 50%;
  background: white; transition: transform 0.2s;
}
.toggle-input:checked + .toggle-track .toggle-thumb { transform: translateX(14px); }

/* ── Copy one ────────────────────────────────────────────── */
.copy-one-btn {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.2); padding: 4px;
  transition: color 0.15s; flex-shrink: 0;
}
.copy-one-btn:hover:not(:disabled) { color: #ec3586; }
.copy-one-btn:disabled { cursor: not-allowed; opacity: 0.3; }

/* ── Output col ──────────────────────────────────────────── */
.output-col { display: flex; flex-direction: column; }

.output-card {
  background: #0f0f14;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
}

.output-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.output-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(255,255,255,0.25); margin: 0;
}

.copy-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px;
  font-weight: 700; color: #ec3586;
  background: rgba(236,53,134,0.08);
  border: 1px solid rgba(236,53,134,0.2);
  border-radius: 4px; padding: 5px 10px;
  cursor: pointer; transition: background 0.15s;
}
.copy-btn:hover { background: rgba(236,53,134,0.15); }

.output-code {
  font-family: 'Fira Mono', 'Cascadia Code', monospace;
  font-size: 11.5px; color: rgba(255,255,255,0.6);
  line-height: 1.75; padding: 16px 18px; margin: 0;
  white-space: pre-wrap; word-break: break-all;
  min-height: 60px;
}

/* ── Pro ─────────────────────────────────────────────────── */
.pro-badge {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px;
  font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  color: #ec3586; background: rgba(236,53,134,0.1);
  border: 1px solid rgba(236,53,134,0.2);
  padding: 3px 8px; border-radius: 3px;
}

.pro-placeholder { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.platform-tabs-mock { display: flex; gap: 4px; flex-wrap: wrap; }
.ptab {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  padding: 6px 12px; border-radius: 5px;
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.2);
}
.ptab--active { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
.pro-placeholder-text {
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.2); margin: 0;
}
</style>
