<script setup lang="ts">
useHead({ title: 'Meta Tag Generator — ScanPulse Tools' })
useSeoMeta({ description: 'Generate title, meta description, canonical, Open Graph, and Twitter Card tags instantly. Live Google snippet preview included — free.' })

const { isSignedIn } = useAuth()

// ── Form state ─────────────────────────────────────────────────────────────
const form = reactive({
  title:       '',
  description: '',
  canonical:   '',
  viewport:    'width=device-width, initial-scale=1',
  charset:     'UTF-8',
  robots:      'index, follow',
  ogTitle:     '',
  ogDescription: '',
  ogImage:     '',
  twitterCard: 'summary_large_image',
})

const noindex = ref(false)
watch(noindex, v => { form.robots = v ? 'noindex, nofollow' : 'index, follow' })

// ── Counters ───────────────────────────────────────────────────────────────
const titleLen = computed(() => form.title.length)
const descLen  = computed(() => form.description.length)

function titleColor() {
  if (titleLen.value === 0) return 'counter--empty'
  if (titleLen.value < 30 || titleLen.value > 60) return 'counter--warn'
  return 'counter--good'
}
function descColor() {
  if (descLen.value === 0) return 'counter--empty'
  if (descLen.value < 70 || descLen.value > 160) return 'counter--warn'
  return 'counter--good'
}

// ── Generated HTML ─────────────────────────────────────────────────────────
const generatedHtml = computed(() => {
  const lines: string[] = []
  lines.push(`<meta charset="${form.charset}">`)
  lines.push(`<meta name="viewport" content="${form.viewport}">`)
  if (form.title) lines.push(`<title>${form.title}</title>`)
  if (form.description) lines.push(`<meta name="description" content="${form.description}">`)
  if (form.canonical) lines.push(`<link rel="canonical" href="${form.canonical}">`)
  lines.push(`<meta name="robots" content="${form.robots}">`)
  return lines.join('\n')
})

// ── Copy ───────────────────────────────────────────────────────────────────
const copied = ref(false)
async function copyAll() {
  await navigator.clipboard.writeText(generatedHtml.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

// ── Google preview helpers ─────────────────────────────────────────────────
const previewTitle = computed(() =>
  form.title || 'Page Title'
)
const previewDesc = computed(() =>
  form.description || 'Your meta description will appear here — aim for 70–160 characters.'
)
const previewUrl = computed(() =>
  form.canonical || 'https://yourwebsite.com/page'
)
const previewUrlDisplay = computed(() => {
  try {
    const u = new URL(previewUrl.value)
    return `${u.hostname}${u.pathname === '/' ? '' : u.pathname}`
  } catch {
    return previewUrl.value
  }
})

// ── OG image preview ──────────────────────────────────────────────────────
const ogImageValid = ref(false)
watch(() => form.ogImage, url => {
  if (!url) { ogImageValid.value = false; return }
  const img = new Image()
  img.onload  = () => ogImageValid.value = true
  img.onerror = () => ogImageValid.value = false
  img.src = url
})
</script>

<template>
  <div class="page-bg">
    <NavBar />

    <div class="tool-shell">

      <!-- Back -->
      <NuxtLink to="/tools" class="back-link">← All Tools</NuxtLink>

      <!-- Header -->
      <div class="tool-header">
        <div class="tool-badge" style="color:#6c5ce7;background:rgba(108,92,231,0.1)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
          SEO
        </div>
        <h1 class="tool-title">Meta Tag Generator</h1>
        <p class="tool-subtitle">Generate a complete <code>&lt;head&gt;</code> block with title, description, canonical, and viewport — plus a live Google preview.</p>
      </div>

      <!-- Two-column layout -->
      <div class="tool-columns">

        <!-- ── Left: form ──────────────────────────────────────────── -->
        <div class="tool-form-col">
          <div class="form-card">
            <h2 class="form-section-title">Page details</h2>

            <!-- Title -->
            <div class="field">
              <div class="field-label-row">
                <label class="field-label">Page title</label>
                <span class="counter" :class="titleColor()">{{ titleLen }} / 60</span>
              </div>
              <input v-model="form.title" class="field-input" type="text" placeholder="My Awesome Page Title" maxlength="120" />
              <p class="field-hint">Aim for 30–60 characters for best display in search results.</p>
              <div class="char-bar">
                <div
                  class="char-bar-fill"
                  :style="{
                    width: `${Math.min(100, (titleLen / 60) * 100)}%`,
                    background: titleLen >= 30 && titleLen <= 60 ? '#00d4aa' : titleLen > 60 ? '#ff4757' : '#ffaa00'
                  }"
                />
              </div>
            </div>

            <!-- Description -->
            <div class="field">
              <div class="field-label-row">
                <label class="field-label">Meta description</label>
                <span class="counter" :class="descColor()">{{ descLen }} / 160</span>
              </div>
              <textarea v-model="form.description" class="field-input field-textarea" placeholder="A concise summary of the page content that entices users to click." maxlength="320" rows="3" />
              <p class="field-hint">Aim for 70–160 characters.</p>
              <div class="char-bar">
                <div
                  class="char-bar-fill"
                  :style="{
                    width: `${Math.min(100, (descLen / 160) * 100)}%`,
                    background: descLen >= 70 && descLen <= 160 ? '#00d4aa' : descLen > 160 ? '#ff4757' : '#ffaa00'
                  }"
                />
              </div>
            </div>

            <!-- Canonical -->
            <div class="field">
              <label class="field-label">Canonical URL</label>
              <input v-model="form.canonical" class="field-input" type="url" placeholder="https://yourwebsite.com/page" />
              <p class="field-hint">Prevents duplicate content issues. Should be the preferred URL for this page.</p>
            </div>

            <!-- Viewport -->
            <div class="field">
              <label class="field-label">Viewport</label>
              <input v-model="form.viewport" class="field-input" type="text" />
            </div>

            <!-- Charset -->
            <div class="field">
              <label class="field-label">Charset</label>
              <input v-model="form.charset" class="field-input" type="text" />
            </div>

            <!-- Robots toggle -->
            <div class="field">
              <div class="field-label-row">
                <label class="field-label">Robots</label>
                <label class="toggle-label">
                  <input v-model="noindex" type="checkbox" class="toggle-input" />
                  <span class="toggle-track">
                    <span class="toggle-thumb" />
                  </span>
                  <span class="toggle-text">Noindex</span>
                </label>
              </div>
              <div
                class="robots-display"
                :class="noindex ? 'robots-display--noindex' : 'robots-display--index'"
              >
                <code>{{ form.robots }}</code>
              </div>
            </div>
          </div>

          <!-- Pro: OG / Twitter -->
          <div class="form-card" style="margin-top:16px">
            <div class="form-section-header">
              <h2 class="form-section-title" style="margin:0">Social sharing</h2>
              <span class="pro-badge">Pro</span>
            </div>

            <ProGate feature="Unlock OG & Twitter Card fields">
              <div class="field">
                <label class="field-label">OG Title</label>
                <input v-model="form.ogTitle" class="field-input" type="text" placeholder="Title for social shares" />
              </div>
              <div class="field">
                <label class="field-label">OG Description</label>
                <textarea v-model="form.ogDescription" class="field-input field-textarea" placeholder="Description for social shares" rows="2" />
              </div>
              <div class="field">
                <label class="field-label">OG Image URL</label>
                <input v-model="form.ogImage" class="field-input" type="url" placeholder="https://yoursite.com/og-image.jpg" />
                <div v-if="ogImageValid" class="og-thumb">
                  <img :src="form.ogImage" alt="OG preview" />
                </div>
              </div>
              <div class="field">
                <label class="field-label">Twitter Card type</label>
                <select v-model="form.twitterCard" class="field-input field-select">
                  <option value="summary">summary</option>
                  <option value="summary_large_image">summary_large_image</option>
                </select>
              </div>
            </ProGate>
          </div>
        </div>

        <!-- ── Right: output + preview ─────────────────────────────── -->
        <div class="tool-output-col">

          <!-- Google snippet preview -->
          <div class="preview-card">
            <p class="preview-label">Google search preview</p>
            <div class="google-snippet">
              <div class="snippet-site">
                <div class="snippet-favicon">G</div>
                <div>
                  <p class="snippet-domain">{{ previewUrlDisplay }}</p>
                </div>
              </div>
              <p class="snippet-title">{{ previewTitle }}</p>
              <p class="snippet-desc">{{ previewDesc }}</p>
            </div>
          </div>

          <!-- Generated HTML -->
          <div class="output-card">
            <div class="output-header">
              <p class="output-label">Generated HTML</p>
              <button class="copy-btn" @click="copyAll">
                <svg v-if="!copied" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                {{ copied ? 'Copied!' : 'Copy all' }}
              </button>
            </div>
            <pre class="output-code">{{ generatedHtml }}</pre>
          </div>

          <!-- Pro: Platform-specific tabs -->
          <div class="output-card" style="margin-top:16px">
            <div class="output-header">
              <p class="output-label">Platform-specific output</p>
              <span class="pro-badge">Pro</span>
            </div>
            <ProGate feature="Get Next.js, Nuxt & WordPress output">
              <div style="padding:20px">
                <p style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:rgba(255,255,255,0.3)">Next.js metadata, Nuxt useSeoMeta, WordPress Yoast formats...</p>
              </div>
            </ProGate>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-bg {
  min-height: 100vh;
  background: #07070a;
}

.tool-shell {
  max-width: 1080px;
  margin: 0 auto;
  padding: 100px 24px 80px;
}

/* ── Back link ───────────────────────────────────────────── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  text-decoration: none;
  margin-bottom: 32px;
  transition: color 0.15s ease;
}
.back-link:hover { color: rgba(255, 255, 255, 0.7); }

/* ── Tool header ─────────────────────────────────────────── */
.tool-header { margin-bottom: 36px; }

.tool-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 3px;
  margin-bottom: 12px;
}

.tool-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800;
  color: white;
  letter-spacing: -0.03em;
  margin-bottom: 10px;
}

.tool-subtitle {
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.38);
  line-height: 1.6;
  max-width: 580px;
}

.tool-subtitle code {
  font-family: monospace;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.07);
  padding: 1px 5px;
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.55);
}

/* ── Two-column layout ───────────────────────────────────── */
.tool-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 768px) {
  .tool-columns { grid-template-columns: 1fr; }
}

/* ── Form card ───────────────────────────────────────────── */
.form-card {
  background: #0f0f14;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.28);
  margin: 0;
}

.form-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

/* ── Fields ──────────────────────────────────────────────── */
.field { display: flex; flex-direction: column; gap: 6px; }

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
}

.field-input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 9px 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  outline: none;
  transition: border-color 0.15s ease;
  width: 100%;
  box-sizing: border-box;
}

.field-input:focus { border-color: rgba(236, 53, 134, 0.4); }
.field-input::placeholder { color: rgba(255, 255, 255, 0.18); }
.field-textarea { resize: vertical; min-height: 72px; }
.field-select { cursor: pointer; }

.field-hint {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.22);
  margin: 0;
}

/* ── Character bar ───────────────────────────────────────── */
.char-bar {
  height: 2px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}
.char-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.2s ease, background 0.2s ease;
}

/* ── Counter badge ───────────────────────────────────────── */
.counter {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
}
.counter--empty { color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
.counter--good  { color: #00d4aa; background: rgba(0,212,170,0.1); }
.counter--warn  { color: #ffaa00; background: rgba(255,170,0,0.1); }

/* ── Robots display ──────────────────────────────────────── */
.robots-display {
  font-family: monospace;
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid;
}
.robots-display--index  { color: #00d4aa; background: rgba(0,212,170,0.06); border-color: rgba(0,212,170,0.15); }
.robots-display--noindex { color: #ff4757; background: rgba(255,71,87,0.06); border-color: rgba(255,71,87,0.15); }

/* ── Toggle ──────────────────────────────────────────────── */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
}
.toggle-input { display: none; }
.toggle-track {
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: rgba(255,255,255,0.1);
  position: relative;
  transition: background 0.2s ease;
  flex-shrink: 0;
}
.toggle-input:checked + .toggle-track { background: #ec3586; }
.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s ease;
}
.toggle-input:checked + .toggle-track .toggle-thumb { transform: translateX(14px); }
.toggle-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* ── OG thumbnail ────────────────────────────────────────── */
.og-thumb {
  width: 100%;
  aspect-ratio: 1200 / 630;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
}
.og-thumb img { width: 100%; height: 100%; object-fit: cover; }

/* ── Google snippet preview ──────────────────────────────── */
.preview-card {
  background: #0f0f14;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
}

.preview-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  margin-bottom: 16px;
}

.google-snippet {
  background: #fff;
  border-radius: 8px;
  padding: 16px 18px;
  max-width: 100%;
}

.snippet-site {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.snippet-favicon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4285f4;
  color: white;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.snippet-domain {
  font-family: Arial, sans-serif;
  font-size: 12px;
  color: #202124;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snippet-title {
  font-family: Arial, sans-serif;
  font-size: 18px;
  color: #1a0dab;
  margin: 0 0 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.snippet-title:hover { text-decoration: underline; }

.snippet-desc {
  font-family: Arial, sans-serif;
  font-size: 13px;
  color: #4d5156;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Output card ─────────────────────────────────────────── */
.output-card {
  background: #0f0f14;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
}

.output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.output-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  margin: 0;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #ec3586;
  background: rgba(236, 53, 134, 0.08);
  border: 1px solid rgba(236, 53, 134, 0.2);
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.copy-btn:hover { background: rgba(236, 53, 134, 0.15); }

.output-code {
  font-family: 'Fira Mono', 'Cascadia Code', monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.7;
  padding: 18px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ── Pro badge ───────────────────────────────────────────── */
.pro-badge {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ec3586;
  background: rgba(236, 53, 134, 0.1);
  border: 1px solid rgba(236, 53, 134, 0.2);
  padding: 3px 8px;
  border-radius: 3px;
}
</style>
