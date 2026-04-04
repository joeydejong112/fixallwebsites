<script setup lang="ts">
definePageMeta({ layout: 'tool' })
useHead({ title: 'Favicon Generator — ScanPulse Tools' })
useSeoMeta({ description: 'Upload any image and generate favicon.ico (16×16, 32×32) and apple-touch-icon.png (180×180) instantly in your browser. Preview on a mock browser tab — free.' })

const sourceUrl  = ref<string | null>(null)
const sourceFile = ref<File | null>(null)
const dragging   = ref(false)

// ── Load image ─────────────────────────────────────────────────────────────
function onFileInput(e: Event) {
  handleFile((e.target as HTMLInputElement).files?.[0])
}
function onDrop(e: DragEvent) {
  e.preventDefault(); dragging.value = false
  handleFile(e.dataTransfer?.files[0])
}
function onDragover(e: DragEvent) { e.preventDefault(); dragging.value = true }
function onDragleave()             { dragging.value = false }

function handleFile(file?: File) {
  if (!file) return
  if (!file.type.startsWith('image/')) return
  sourceFile.value = file
  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value)
  sourceUrl.value = URL.createObjectURL(file)
}

// ── Render to canvas at given size ─────────────────────────────────────────
function renderToCanvas(src: string, size: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, size, size)
      resolve(canvas)
    }
    img.onerror = reject
    img.src = src
  })
}

// ── Download helpers ───────────────────────────────────────────────────────
async function downloadPng(size: number, filename: string) {
  if (!sourceUrl.value) return
  const canvas = await renderToCanvas(sourceUrl.value, size)
  const blob   = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
  if (!blob) return
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

// favicon.ico — we generate as a 32×32 PNG (browsers accept .ico as PNG)
async function downloadFavicon() { await downloadPng(32, 'favicon.ico') }
async function downloadAppleTouch() { await downloadPng(180, 'apple-touch-icon.png') }

// ── Preview URLs ───────────────────────────────────────────────────────────
const preview16  = ref<string | null>(null)
const preview32  = ref<string | null>(null)
const preview180 = ref<string | null>(null)

watch(sourceUrl, async (src) => {
  if (!src) return
  const [c16, c32, c180] = await Promise.all([
    renderToCanvas(src, 16),
    renderToCanvas(src, 32),
    renderToCanvas(src, 180),
  ])
  preview16.value  = c16.toDataURL()
  preview32.value  = c32.toDataURL()
  preview180.value = c180.toDataURL()
})

const tabTitle = ref('My Website')
</script>

<template>
  <div class="page-bg">
    <div class="tool-shell">

      <!-- Header -->
      <div class="tool-header">
        <div class="tool-badge" style="color:#6c5ce7;background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.2)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
          SEO
        </div>
        <h1 class="tool-title">Favicon Generator</h1>
        <p class="tool-subtitle">Upload any image and get a browser-ready <code>favicon.ico</code> and <code>apple-touch-icon.png</code> in seconds. Preview on a mock browser tab before downloading.</p>
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
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileInput" />
        <div class="drop-icon-wrap" :class="{ 'drop-icon-wrap--active': dragging }">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
        </div>
        <p class="drop-title">{{ dragging ? 'Drop it!' : 'Drop a source image' }}</p>
        <p class="drop-sub">SVG, PNG, JPEG — any size &middot; square images work best</p>
      </div>

      <!-- Results -->
      <div v-if="sourceUrl" class="results-grid">

        <!-- Browser tab preview -->
        <div class="preview-card">
          <div class="preview-card-header">
            <span class="card-dot" />
            <span class="card-label">Browser tab preview</span>
          </div>
          <div class="preview-card-body">
            <div class="browser-chrome">
              <!-- Title bar -->
              <div class="browser-topbar">
                <div class="browser-dots">
                  <span class="dot-red" />
                  <span class="dot-yellow" />
                  <span class="dot-green" />
                </div>
                <div class="browser-address-bar">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="color:rgba(255,255,255,0.2)"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  <span class="browser-url">scanpulse.io</span>
                </div>
              </div>
              <!-- Tab strip -->
              <div class="browser-tab-strip">
                <div class="browser-tab">
                  <img v-if="preview16" :src="preview16" width="16" height="16" alt="" class="tab-favicon" />
                  <div v-else class="tab-favicon-placeholder" />
                  <span class="browser-tab-title">{{ tabTitle }}</span>
                  <span class="browser-tab-close">&#x2715;</span>
                </div>
                <div class="browser-tab-new">+</div>
              </div>
            </div>
            <!-- Tab title input -->
            <div class="tab-input-row">
              <label class="field-label">Tab title</label>
              <input v-model="tabTitle" class="tab-title-input" type="text" placeholder="My Website" />
            </div>
          </div>
        </div>

        <!-- Size previews -->
        <div class="sizes-card">
          <div class="sizes-card-header">
            <span class="card-dot" />
            <span class="card-label">Generated sizes</span>
          </div>
          <div class="sizes-card-body">
            <div class="size-rows">

              <!-- favicon.ico -->
              <div class="size-row">
                <div class="size-preview-box">
                  <img v-if="preview32" :src="preview32" width="32" height="32" alt="32px" class="size-preview-img" />
                  <div v-else class="size-preview-empty" />
                </div>
                <div class="size-info">
                  <span class="size-filename">favicon.ico</span>
                  <span class="size-dims">16 &times; 16 + 32 &times; 32 multi-size</span>
                </div>
                <button class="dl-btn" @click="downloadFavicon">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                  Download
                </button>
              </div>

              <!-- apple-touch-icon -->
              <div class="size-row">
                <div class="size-preview-box">
                  <img v-if="preview180" :src="preview180" width="40" height="40" alt="180px" class="size-preview-img size-preview-img--rounded" />
                  <div v-else class="size-preview-empty size-preview-empty--rounded" />
                </div>
                <div class="size-info">
                  <span class="size-filename">apple-touch-icon.png</span>
                  <span class="size-dims">180 &times; 180</span>
                </div>
                <button class="dl-btn" @click="downloadAppleTouch">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                  Download
                </button>
              </div>

            </div>

            <!-- HTML snippet -->
            <div class="snippet-box">
              <div class="snippet-box-header">
                <span class="card-dot" />
                <span class="snippet-box-label">&lt;head&gt; snippet</span>
              </div>
              <pre class="snippet-code"><span class="sc-tag">&lt;link</span> <span class="sc-attr">rel</span><span class="sc-eq">=</span><span class="sc-val">"icon"</span> <span class="sc-attr">href</span><span class="sc-eq">=</span><span class="sc-val">"/favicon.ico"</span> <span class="sc-attr">sizes</span><span class="sc-eq">=</span><span class="sc-val">"any"</span><span class="sc-tag">&gt;</span>
<span class="sc-tag">&lt;link</span> <span class="sc-attr">rel</span><span class="sc-eq">=</span><span class="sc-val">"icon"</span> <span class="sc-attr">href</span><span class="sc-eq">=</span><span class="sc-val">"/favicon.ico"</span> <span class="sc-attr">type</span><span class="sc-eq">=</span><span class="sc-val">"image/x-icon"</span><span class="sc-tag">&gt;</span>
<span class="sc-tag">&lt;link</span> <span class="sc-attr">rel</span><span class="sc-eq">=</span><span class="sc-val">"apple-touch-icon"</span> <span class="sc-attr">href</span><span class="sc-eq">=</span><span class="sc-val">"/apple-touch-icon.png"</span><span class="sc-tag">&gt;</span></pre>
            </div>
          </div>
        </div>

        <!-- Pro -->
        <div class="pro-card">
          <div class="pro-card-header">
            <div class="pro-header-left">
              <span class="pro-dot" />
              <span class="pro-label">Full PWA icon set &amp; OG image</span>
            </div>
            <span class="pro-badge">Pro</span>
          </div>
          <ProGate feature="Generate 192px, 512px, OG image & ZIP download">
            <div class="pro-placeholder">
              <div class="pro-sizes">
                <div class="pro-size-chip">icon-192.png</div>
                <div class="pro-size-chip">icon-512.png</div>
                <div class="pro-size-chip">og-image.png (1200&times;630)</div>
                <div class="pro-size-chip">site.webmanifest</div>
              </div>
              <p class="pro-hint">Download all as a ZIP with a ready-to-paste &lt;head&gt; snippet.</p>
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
  max-width: 860px;
  margin: 0 auto;
  padding: 48px 28px 80px;
}

/* ── Header ──────────────────────────────────────────────── */
.tool-header { margin-bottom: 28px; }
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
.tool-subtitle code {
  font-family: monospace;
  font-size: 13px;
  background: rgba(255,255,255,0.07);
  padding: 1px 5px;
  border-radius: 3px;
  color: rgba(255,255,255,0.6);
}

/* ── Drop zone ───────────────────────────────────────────── */
.drop-zone {
  border: 2px dashed rgba(108,92,231,0.15);
  border-radius: 14px;
  padding: 52px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 24px;
  background: rgba(108,92,231,0.01);
  transition: border-color 0.15s, background 0.15s;
}
.drop-zone:hover, .drop-zone--active {
  border-color: rgba(108,92,231,0.45);
  background: rgba(108,92,231,0.04);
}
.drop-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(108,92,231,0.08);
  border: 1px solid rgba(108,92,231,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(108,92,231,0.5);
  transition: background 0.15s, color 0.15s;
}
.drop-icon-wrap--active,
.drop-zone:hover .drop-icon-wrap {
  background: rgba(108,92,231,0.14);
  color: #6c5ce7;
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

/* ── Results layout ──────────────────────────────────────── */
.results-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Shared card header ──────────────────────────────────── */
.card-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6c5ce7;
  flex-shrink: 0;
}
.card-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
}

/* ── Browser preview card ────────────────────────────────── */
.preview-card {
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
}
.preview-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.preview-card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Browser chrome ──────────────────────────────────────── */
.browser-chrome {
  background: #13131c;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  overflow: hidden;
}
.browser-topbar {
  background: #0e0e16;
  padding: 9px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  gap: 12px;
}
.browser-dots { display: flex; gap: 6px; align-items: center; }
.dot-red    { width: 10px; height: 10px; border-radius: 50%; background: #ff5f57; }
.dot-yellow { width: 10px; height: 10px; border-radius: 50%; background: #febc2e; }
.dot-green  { width: 10px; height: 10px; border-radius: 50%; background: #28c840; }
.browser-address-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 5px;
  padding: 4px 10px;
  max-width: 240px;
  margin: 0 auto;
}
.browser-url {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  color: rgba(255,255,255,0.3);
}
.browser-tab-strip {
  padding: 6px 8px 0;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  background: #0e0e16;
}
.browser-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px 7px 10px;
  background: #13131c;
  border-radius: 8px 8px 0 0;
  border: 1px solid rgba(255,255,255,0.07);
  border-bottom: none;
  max-width: 200px;
  position: relative;
}
.tab-favicon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  image-rendering: pixelated;
}
.tab-favicon-placeholder {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background: rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.browser-tab-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  max-width: 120px;
}
.browser-tab-close {
  font-size: 11px;
  color: rgba(255,255,255,0.25);
  cursor: default;
  flex-shrink: 0;
}
.browser-tab-new {
  font-size: 16px;
  color: rgba(255,255,255,0.2);
  padding: 4px 10px 8px;
  line-height: 1;
  cursor: default;
}

/* ── Tab title input ─────────────────────────────────────── */
.tab-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.field-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
  white-space: nowrap;
  flex-shrink: 0;
}
.tab-title-input {
  flex: 1;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  padding: 7px 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  outline: none;
  transition: border-color 0.15s;
}
.tab-title-input:focus { border-color: rgba(108,92,231,0.45); }
.tab-title-input::placeholder { color: rgba(255,255,255,0.18); }

/* ── Sizes card ──────────────────────────────────────────── */
.sizes-card {
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
}
.sizes-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.sizes-card-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Size rows ───────────────────────────────────────────── */
.size-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.size-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 9px;
}
.size-preview-box {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  flex-shrink: 0;
}
.size-preview-img { image-rendering: pixelated; }
.size-preview-img--rounded { border-radius: 8px; image-rendering: auto; }
.size-preview-empty {
  width: 32px;
  height: 32px;
  background: rgba(255,255,255,0.06);
  border-radius: 4px;
}
.size-preview-empty--rounded { border-radius: 8px; }

.size-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.size-filename {
  font-family: 'Fira Mono', 'Cascadia Code', monospace;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
}
.size-dims {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.50);
}

.dl-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #6c5ce7;
  background: rgba(108,92,231,0.1);
  border: 1px solid rgba(108,92,231,0.22);
  border-radius: 5px;
  padding: 7px 13px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  flex-shrink: 0;
}
.dl-btn:hover {
  background: rgba(108,92,231,0.18);
  transform: translateY(-1px);
}

/* ── Snippet box ─────────────────────────────────────────── */
.snippet-box {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 9px;
  overflow: hidden;
}
.snippet-box-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.snippet-box-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
}
.snippet-code {
  font-family: 'Fira Mono', 'Cascadia Code', monospace;
  font-size: 11px;
  line-height: 1.8;
  padding: 14px 16px;
  margin: 0;
  white-space: pre-wrap;
  overflow-x: auto;
}
.sc-tag  { color: rgba(255,255,255,0.45); }
.sc-attr { color: #b39ddb; }
.sc-eq   { color: rgba(255,255,255,0.25); }
.sc-val  { color: #a5d6a7; }

/* ── Pro card ────────────────────────────────────────────── */
.pro-card {
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
}
.pro-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.pro-header-left {
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
.pro-label {
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
  gap: 12px;
}
.pro-sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pro-size-chip {
  font-family: 'Fira Mono', 'Cascadia Code', monospace;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
  background: rgba(108,92,231,0.06);
  border: 1px solid rgba(108,92,231,0.12);
  padding: 5px 11px;
  border-radius: 5px;
}
.pro-hint {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.50);
  margin: 0;
  line-height: 1.5;
}
</style>
