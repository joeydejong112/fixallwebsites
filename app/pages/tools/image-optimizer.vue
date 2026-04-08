<script setup lang="ts">
definePageMeta({ layout: 'tool' })
useSeoMeta({
  title: 'Free Image Optimizer & WebP Converter — ScanPulse Tools',
  description: 'Convert PNG, JPEG, BMP, and GIF to WebP in your browser. See exact file size savings, adjust quality with a live slider, and download — completely free.',
  ogTitle: 'Free Image Optimizer & WebP Converter',
  ogDescription: 'Convert images to WebP client-side. No uploads, no accounts — instant savings.',
})
const _siteUrl = useRequestURL()
useHead({ link: [{ rel: 'canonical', href: _siteUrl.origin + _siteUrl.pathname }] })

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
    <div class="tool-shell">

      <!-- Header -->
      <div class="tool-header">
        <div class="tool-badge" style="color:#ffaa00;background:rgba(255,170,0,0.1);border:1px solid rgba(255,170,0,0.2)">
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
        <div class="drop-icon-wrap" :class="{ 'drop-icon-wrap--active': dragging }">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
        </div>
        <p class="drop-title">{{ dragging ? 'Drop it!' : 'Drop an image here' }}</p>
        <p class="drop-sub">PNG, JPEG, BMP, GIF, TIFF &mdash; or click to browse</p>
      </div>

      <!-- Results -->
      <div v-if="original" class="results-area">

        <!-- Quality slider -->
        <div class="quality-card">
          <div class="quality-card-header">
            <span class="quality-dot" />
            <span class="quality-header-label">WebP Quality</span>
          </div>
          <div class="quality-row">
            <input v-model.number="quality" type="range" min="1" max="100" class="quality-slider" />
            <span class="quality-val">{{ quality }}<span class="quality-pct">%</span></span>
          </div>
          <p class="quality-hint">Higher values produce larger files with better detail. 75–85 is optimal for most images.</p>
        </div>

        <!-- Before / After -->
        <div class="ba-grid">

          <!-- Before -->
          <div class="ba-card">
            <div class="ba-tab-row">
              <span class="ba-tab-pill">Original</span>
              <span class="ba-format-pill">{{ original.file.type.split('/')[1].toUpperCase() }}</span>
            </div>
            <div class="ba-img-wrap">
              <img :src="original.url" alt="Original" class="ba-img" />
            </div>
            <div class="ba-meta">
              <span class="ba-size">{{ fmtSize(original.size) }}</span>
              <span class="ba-dims">{{ original.w }} &times; {{ original.h }}</span>
            </div>
          </div>

          <!-- Arrow -->
          <div class="ba-arrow">
            <div v-if="!converting" class="ba-arrow-circle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
            </div>
            <div v-else class="converting-spin" />
          </div>

          <!-- After -->
          <div class="ba-card" :class="{ 'ba-card--dim': !converted }">
            <div class="ba-tab-row">
              <span class="ba-tab-pill ba-tab-pill--webp">WebP</span>
              <span v-if="converted && savingPct() > 0" class="ba-saving ba-saving--good">{{ savingPct() }}% smaller</span>
              <span v-else-if="converted" class="ba-saving ba-saving--worse">{{ Math.abs(savingPct()) }}% larger</span>
              <span v-else class="ba-format-pill">—</span>
            </div>
            <div class="ba-img-wrap">
              <img v-if="converted" :src="converted.url" alt="Converted" class="ba-img" />
              <div v-else class="ba-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              </div>
            </div>
            <div v-if="converted" class="ba-meta">
              <span class="ba-size" style="color:#ffaa00">{{ fmtSize(converted.size) }}</span>
            </div>
            <div v-else class="ba-meta">
              <span class="ba-size" style="color:rgba(255,255,255,0.18)">—</span>
            </div>
          </div>
        </div>

        <!-- Savings banner -->
        <div v-if="converted" class="savings-banner">
          <div class="savings-banner-left">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="color:#00d4aa;flex-shrink:0"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span class="savings-text">
              <strong>{{ fmtSize(original!.size) }}</strong>
              <span class="savings-arrow">→</span>
              <strong>{{ fmtSize(converted.size) }}</strong>
              <template v-if="savingPct() > 0">
                &mdash; <strong class="savings-highlight">{{ savingPct() }}% smaller</strong>
              </template>
            </span>
          </div>
          <button class="download-btn" @click="download">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            Download .webp
          </button>
        </div>

        <!-- img snippet -->
        <div v-if="converted" class="snippet-card">
          <div class="snippet-header">
            <div class="snippet-header-left">
              <span class="snippet-dot" />
              <span class="snippet-label-text">&lt;img&gt; snippet with lazy loading</span>
            </div>
            <button class="copy-btn" @click="copySnippet">
              <svg v-if="!copiedSnip" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              {{ copiedSnip ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="snippet-code"><span class="sc-tag">&lt;img</span> <span class="sc-attr">src</span><span class="sc-eq">=</span><span class="sc-val">"image.webp"</span>
     <span class="sc-attr">width</span><span class="sc-eq">=</span><span class="sc-val">"{{ original!.w }}"</span> <span class="sc-attr">height</span><span class="sc-eq">=</span><span class="sc-val">"{{ original!.h }}"</span>
     <span class="sc-attr">loading</span><span class="sc-eq">=</span><span class="sc-val">"lazy"</span> <span class="sc-attr">alt</span><span class="sc-eq">=</span><span class="sc-val">""</span><span class="sc-tag">&gt;</span></pre>
        </div>

        <!-- Pro features -->
        <div class="pro-section">
          <div class="pro-section-header">
            <div class="pro-section-header-left">
              <span class="pro-dot" />
              <span class="pro-section-title">Advanced features</span>
            </div>
            <span class="pro-badge">Pro</span>
          </div>
          <ProGate feature="Unlock AVIF, batch convert & resize">
            <div class="pro-placeholder">
              <div class="pro-placeholder-row">
                <span class="pro-row-label">Output format</span>
                <span class="pro-fake-select">AVIF (smaller than WebP)</span>
              </div>
              <div class="pro-placeholder-row">
                <span class="pro-row-label">Max width</span>
                <span class="pro-fake-input">1920 px</span>
              </div>
              <div class="pro-placeholder-row">
                <span class="pro-row-label">Batch upload</span>
                <span class="pro-fake-btn">+ Add more images</span>
              </div>
            </div>
          </ProGate>
        </div>

      </div>

      <ToolSeoSection slug="image-optimizer" />
    </div>
  </div>
</template>

<style scoped>
.page-bg { min-height: 100vh; background: #07070a; }

.tool-shell {
  max-width: 100%;
  padding: 48px 28px 80px;
}

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
  color: rgba(255,255,255,0.60);
  line-height: 1.6;
  max-width: 560px;
}

/* ── Drop zone ───────────────────────────────────────────── */
.drop-zone {
  border: 2px dashed rgba(255,170,0,0.15);
  border-radius: 14px;
  padding: 52px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: rgba(255,170,0,0.01);
}
.drop-zone:hover, .drop-zone--active {
  border-color: rgba(255,170,0,0.45);
  background: rgba(255,170,0,0.04);
}
.drop-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(255,170,0,0.08);
  border: 1px solid rgba(255,170,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,170,0,0.5);
  transition: background 0.15s, color 0.15s;
}
.drop-icon-wrap--active,
.drop-zone:hover .drop-icon-wrap {
  background: rgba(255,170,0,0.14);
  color: #ffaa00;
}
.drop-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255,255,255,0.6);
  margin: 0;
}
.drop-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.50);
  margin: 0;
}
.hidden { display: none; }

/* ── Results ─────────────────────────────────────────────── */
.results-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 24px;
}

/* ── Quality card ────────────────────────────────────────── */
.quality-card {
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
}
.quality-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.quality-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffaa00;
  flex-shrink: 0;
}
.quality-header-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
}
.quality-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 18px 12px;
}
.quality-slider {
  flex: 1;
  accent-color: #ffaa00;
  cursor: pointer;
  height: 4px;
}
.quality-val {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #ffaa00;
  min-width: 52px;
  text-align: right;
  line-height: 1;
}
.quality-pct {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.7;
}
.quality-hint {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.50);
  padding: 0 18px 14px;
  margin: 0;
  line-height: 1.5;
}

/* ── Before / After grid ─────────────────────────────────── */
.ba-grid {
  display: grid;
  grid-template-columns: 1fr 48px 1fr;
  align-items: center;
  gap: 12px;
}
@media (max-width: 600px) {
  .ba-grid { grid-template-columns: 1fr; }
  .ba-arrow { transform: rotate(90deg); justify-self: center; }
}

.ba-card {
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
}
.ba-card--dim { opacity: 0.35; }

.ba-tab-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px 8px;
}
.ba-tab-pill {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 3px 8px;
  border-radius: 4px;
}
.ba-tab-pill--webp {
  color: #ffaa00;
  background: rgba(255,170,0,0.1);
  border-color: rgba(255,170,0,0.2);
}
.ba-format-pill {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  padding: 3px 8px;
  border-radius: 4px;
}

.ba-img-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: rgba(255,255,255,0.02);
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
  color: rgba(255,255,255,0.1);
}

.ba-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
}
.ba-size {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  font-weight: 600;
}
.ba-dims {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.50);
}
.ba-saving {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 20px;
}
.ba-saving--good  { color: #00d4aa; background: rgba(0,212,170,0.12); border: 1px solid rgba(0,212,170,0.2); }
.ba-saving--worse { color: #ff4757; background: rgba(255,71,87,0.1);   border: 1px solid rgba(255,71,87,0.18); }

.ba-arrow {
  display: flex;
  justify-content: center;
  align-items: center;
}
.ba-arrow-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255,170,0,0.08);
  border: 1px solid rgba(255,170,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffaa00;
}
.converting-spin {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(255,170,0,0.15);
  border-top-color: #ffaa00;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Savings banner ──────────────────────────────────────── */
.savings-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(0,212,170,0.04);
  border: 1px solid rgba(0,212,170,0.12);
  border-left: 3px solid #00d4aa;
  border-radius: 10px;
  flex-wrap: wrap;
}
.savings-banner-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.savings-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.savings-text strong { color: rgba(255,255,255,0.85); }
.savings-arrow { color: rgba(255,255,255,0.25); }
.savings-highlight { color: #00d4aa; }

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffaa00;
  color: #07070a;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 8px 16px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  flex-shrink: 0;
}
.download-btn:hover { background: #e09900; transform: translateY(-1px); }

/* ── Snippet card ────────────────────────────────────────── */
.snippet-card {
  background: #0c0c12;
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
.snippet-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.snippet-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffaa00;
  flex-shrink: 0;
}
.snippet-label-text {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
}
.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #ffaa00;
  background: rgba(255,170,0,0.08);
  border: 1px solid rgba(255,170,0,0.2);
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.copy-btn:hover { background: rgba(255,170,0,0.14); }

.snippet-code {
  font-family: 'Fira Mono', 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.75;
  padding: 18px 20px;
  margin: 0;
  white-space: pre;
  overflow-x: auto;
}
.sc-tag  { color: rgba(255,255,255,0.5); }
.sc-attr { color: #b39ddb; }
.sc-eq   { color: rgba(255,255,255,0.3); }
.sc-val  { color: #a5d6a7; }

/* ── Pro section ─────────────────────────────────────────── */
.pro-section {
  background: #0c0c12;
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
.pro-section-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pro-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ec3586;
  flex-shrink: 0;
}
.pro-section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
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
.pro-placeholder {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pro-placeholder-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 7px;
}
.pro-row-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.50);
}
.pro-fake-select, .pro-fake-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 5px;
  padding: 4px 10px;
  color: rgba(255,255,255,0.18);
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
}
.pro-fake-btn {
  color: rgba(236,53,134,0.3);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
</style>
