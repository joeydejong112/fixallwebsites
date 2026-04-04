<script setup lang="ts">
useHead({ title: 'Image Optimizer & Converter — ScanPulse Tools' })
useSeoMeta({ description: 'Convert PNG, JPEG, BMP, and GIF to WebP instantly in your browser. See file size savings, download the result, and get a lazy-load img snippet — free.' })

// ── State ──────────────────────────────────────────────────────────────────
const dragging    = ref(false)
const original    = ref<{ file: File; url: string; size: number; w: number; h: number } | null>(null)
const converted   = ref<{ url: string; size: number } | null>(null)
const converting  = ref(false)
const quality     = ref(82)
const imgSnippet  = ref('')
const copiedSnip  = ref(false)

// ── Drop zone ──────────────────────────────────────────────────────────────
function onDragover(e: DragEvent) { e.preventDefault(); dragging.value = true }
function onDragleave()             { dragging.value = false }
function onDrop(e: DragEvent)      { e.preventDefault(); dragging.value = false; handleFile(e.dataTransfer?.files[0]) }
function onFileInput(e: Event)     { handleFile((e.target as HTMLInputElement).files?.[0]) }

async function handleFile(file?: File) {
  if (!file) return
  const allowed = ['image/png','image/jpeg','image/bmp','image/gif','image/tiff','image/webp']
  if (!allowed.includes(file.type)) return

  const url = URL.createObjectURL(file)
  const img  = await loadImage(url)

  original.value  = { file, url, size: file.size, w: img.naturalWidth, h: img.naturalHeight }
  converted.value = null
  await convert()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src     = src
  })
}

// ── Convert ────────────────────────────────────────────────────────────────
async function convert() {
  if (!original.value) return
  converting.value = true

  const img    = await loadImage(original.value.url)
  const canvas = document.createElement('canvas')
  canvas.width  = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, 'image/webp', quality.value / 100)
  )

  if (blob) {
    if (converted.value?.url) URL.revokeObjectURL(converted.value.url)
    converted.value = { url: URL.createObjectURL(blob), size: blob.size }
    imgSnippet.value =
      `<img src="image.webp"\n` +
      `     width="${original.value.w}" height="${original.value.h}"\n` +
      `     loading="lazy" alt="">`
  }
  converting.value = false
}

// Re-convert when quality changes (debounced)
let debTimer: ReturnType<typeof setTimeout>
watch(quality, () => {
  clearTimeout(debTimer)
  debTimer = setTimeout(convert, 300)
})

// ── Download ───────────────────────────────────────────────────────────────
function download() {
  if (!converted.value) return
  const a = document.createElement('a')
  a.href     = converted.value.url
  a.download = (original.value?.file.name.replace(/\.[^.]+$/, '') ?? 'image') + '.webp'
  a.click()
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function savingPct(): number {
  if (!original.value || !converted.value) return 0
  return Math.round((1 - converted.value.size / original.value.size) * 100)
}

async function copySnippet() {
  await navigator.clipboard.writeText(imgSnippet.value)
  copiedSnip.value = true
  setTimeout(() => copiedSnip.value = false, 2000)
}
</script>

<template>
  <div class="page-bg">
    <NavBar />

    <div class="tool-shell">

      <!-- Back -->
      <NuxtLink to="/tools" class="back-link">← All Tools</NuxtLink>

      <!-- Header -->
      <div class="tool-header">
        <div class="tool-badge" style="color:#ffaa00;background:rgba(255,170,0,0.1)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          Performance
        </div>
        <h1 class="tool-title">Image Optimizer &amp; Converter</h1>
        <p class="tool-subtitle">Convert any image to WebP in your browser — no upload, no server. Adjust quality, preview savings, and get a lazy-load snippet.</p>
      </div>

      <!-- Drop zone -->
      <div
        class="drop-zone"
        :class="{ 'drop-zone--active': dragging }"
        @dragover="onDragover"
        @dragleave="onDragleave"
        @drop="onDrop"
        @click="($refs.fileInput as HTMLInputElement).click()"
      >
        <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/bmp,image/gif,image/tiff,image/webp" class="hidden" @change="onFileInput" />
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" class="drop-icon"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        <p class="drop-title">{{ dragging ? 'Drop it!' : 'Drop an image here' }}</p>
        <p class="drop-sub">PNG, JPEG, BMP, GIF, TIFF &mdash; or click to browse</p>
      </div>

      <!-- Results -->
      <div v-if="original" class="results-area">

        <!-- Quality slider -->
        <div class="quality-row">
          <label class="quality-label">WebP quality</label>
          <input v-model.number="quality" type="range" min="1" max="100" class="quality-slider" />
          <span class="quality-val">{{ quality }}%</span>
        </div>

        <!-- Before / After -->
        <div class="ba-grid">

          <!-- Before -->
          <div class="ba-card">
            <p class="ba-label">Original</p>
            <div class="ba-img-wrap">
              <img :src="original.url" alt="Original" class="ba-img" />
            </div>
            <div class="ba-meta">
              <span class="ba-format">{{ original.file.type.split('/')[1].toUpperCase() }}</span>
              <span class="ba-size">{{ fmtSize(original.size) }}</span>
              <span class="ba-dims">{{ original.w }} × {{ original.h }}</span>
            </div>
          </div>

          <!-- Arrow -->
          <div class="ba-arrow">
            <svg v-if="!converting" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
            <div v-else class="converting-spin" />
          </div>

          <!-- After -->
          <div class="ba-card" :class="{ 'ba-card--dim': !converted }">
            <p class="ba-label">WebP</p>
            <div class="ba-img-wrap">
              <img v-if="converted" :src="converted.url" alt="Converted" class="ba-img" />
              <div v-else class="ba-placeholder">...</div>
            </div>
            <div v-if="converted" class="ba-meta">
              <span class="ba-format" style="color:#ffaa00">WEBP</span>
              <span class="ba-size">{{ fmtSize(converted.size) }}</span>
              <span
                class="ba-saving"
                :class="savingPct() > 0 ? 'ba-saving--good' : 'ba-saving--worse'"
              >
                {{ savingPct() > 0 ? `${savingPct()}% smaller` : `${Math.abs(savingPct())}% larger` }}
              </span>
            </div>
          </div>
        </div>

        <!-- Savings banner -->
        <div v-if="converted" class="savings-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:#00d4aa;flex-shrink:0"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          <span>
            <strong>{{ fmtSize(original!.size) }}</strong>
            → WebP:
            <strong>{{ fmtSize(converted.size) }}</strong>
            <template v-if="savingPct() > 0">
              — <strong style="color:#00d4aa">{{ savingPct() }}% smaller</strong>
            </template>
          </span>
          <button class="download-btn" @click="download">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            Download .webp
          </button>
        </div>

        <!-- img snippet -->
        <div v-if="converted" class="snippet-card">
          <div class="snippet-header">
            <p class="snippet-label">
              <code>&lt;img&gt;</code> snippet with <code>loading="lazy"</code>
            </p>
            <button class="copy-btn" @click="copySnippet">
              <svg v-if="!copiedSnip" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              {{ copiedSnip ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="snippet-code">{{ imgSnippet }}</pre>
        </div>

        <!-- Pro features -->
        <div class="pro-section">
          <div class="pro-section-header">
            <span class="pro-section-title">Advanced features</span>
            <span class="pro-badge">Pro</span>
          </div>
          <ProGate feature="Unlock AVIF, batch convert & resize">
            <div class="pro-placeholder">
              <div class="pro-placeholder-row">
                <span>Output format:</span>
                <span class="pro-fake-select">AVIF (smaller than WebP)</span>
              </div>
              <div class="pro-placeholder-row">
                <span>Max width:</span>
                <span class="pro-fake-input">1920 px</span>
              </div>
              <div class="pro-placeholder-row">
                <span>Batch upload:</span>
                <span class="pro-fake-btn">+ Add more images</span>
              </div>
            </div>
          </ProGate>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.page-bg { min-height: 100vh; background: #07070a; }

.tool-shell {
  max-width: 900px;
  margin: 0 auto;
  padding: 100px 24px 80px;
}

/* ── Back ────────────────────────────────────────────────── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: rgba(255,255,255,0.3);
  text-decoration: none;
  margin-bottom: 32px;
  transition: color 0.15s;
}
.back-link:hover { color: rgba(255,255,255,0.7); }

/* ── Header ──────────────────────────────────────────────── */
.tool-header { margin-bottom: 32px; }
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
  color: rgba(255,255,255,0.38);
  line-height: 1.6;
  max-width: 560px;
}

/* ── Drop zone ───────────────────────────────────────────── */
.drop-zone {
  border: 2px dashed rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.drop-zone:hover, .drop-zone--active {
  border-color: rgba(255,170,0,0.4);
  background: rgba(255,170,0,0.03);
}
.drop-icon { color: rgba(255,255,255,0.18); }
.drop-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255,255,255,0.55);
  margin: 0;
}
.drop-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.22);
  margin: 0;
}
.hidden { display: none; }

/* ── Results ─────────────────────────────────────────────── */
.results-area {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Quality slider ──────────────────────────────────────── */
.quality-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #0f0f14;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
}
.quality-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  flex-shrink: 0;
}
.quality-slider {
  flex: 1;
  accent-color: #ffaa00;
  cursor: pointer;
}
.quality-val {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #ffaa00;
  min-width: 36px;
  text-align: right;
}

/* ── Before / After grid ─────────────────────────────────── */
.ba-grid {
  display: grid;
  grid-template-columns: 1fr 40px 1fr;
  align-items: center;
  gap: 12px;
}
@media (max-width: 600px) {
  .ba-grid { grid-template-columns: 1fr; }
  .ba-arrow { transform: rotate(90deg); justify-self: center; }
}

.ba-card {
  background: #0f0f14;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
}
.ba-card--dim { opacity: 0.4; }

.ba-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  padding: 12px 14px 8px;
  margin: 0;
}

.ba-img-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: rgba(255,255,255,0.03);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ba-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.ba-placeholder {
  font-family: monospace;
  color: rgba(255,255,255,0.15);
  font-size: 20px;
}

.ba-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  flex-wrap: wrap;
}
.ba-format {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.4);
  background: rgba(255,255,255,0.06);
  padding: 2px 6px;
  border-radius: 3px;
}
.ba-size {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}
.ba-dims {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  color: rgba(255,255,255,0.22);
}
.ba-saving {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
}
.ba-saving--good  { color: #00d4aa; background: rgba(0,212,170,0.1); }
.ba-saving--worse { color: #ff4757; background: rgba(255,71,87,0.1); }

.ba-arrow {
  display: flex;
  justify-content: center;
  color: rgba(255,255,255,0.2);
}
.converting-spin {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.1);
  border-top-color: #ffaa00;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Savings banner ──────────────────────────────────────── */
.savings-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: rgba(0,212,170,0.05);
  border: 1px solid rgba(0,212,170,0.15);
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  flex-wrap: wrap;
}
.savings-banner strong { color: rgba(255,255,255,0.8); }

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  background: #ffaa00;
  color: #07070a;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 7px 14px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}
.download-btn:hover { background: #e09900; transform: translateY(-1px); }

/* ── Snippet card ────────────────────────────────────────── */
.snippet-card {
  background: #0f0f14;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
}
.snippet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.snippet-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  margin: 0;
}
.snippet-label code {
  font-family: monospace;
  background: rgba(255,255,255,0.06);
  padding: 1px 5px;
  border-radius: 3px;
  color: rgba(255,255,255,0.4);
  text-transform: none;
  letter-spacing: 0;
}
.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #ec3586;
  background: rgba(236,53,134,0.08);
  border: 1px solid rgba(236,53,134,0.2);
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.copy-btn:hover { background: rgba(236,53,134,0.15); }

.snippet-code {
  font-family: 'Fira Mono', 'Cascadia Code', monospace;
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  line-height: 1.7;
  padding: 16px 18px;
  margin: 0;
  white-space: pre;
}

/* ── Pro section ─────────────────────────────────────────── */
.pro-section {
  background: #0f0f14;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
}
.pro-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.pro-section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
}
.pro-badge {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ec3586;
  background: rgba(236,53,134,0.1);
  border: 1px solid rgba(236,53,134,0.2);
  padding: 3px 8px;
  border-radius: 3px;
}
.pro-placeholder { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.pro-placeholder-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.3);
}
.pro-fake-select, .pro-fake-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 5px;
  padding: 5px 10px;
  color: rgba(255,255,255,0.2);
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
}
.pro-fake-btn {
  color: rgba(236,53,134,0.3);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
}
</style>
