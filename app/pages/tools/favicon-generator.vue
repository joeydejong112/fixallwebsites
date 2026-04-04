<script setup lang="ts">
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
    <NavBar />
    <div class="tool-shell">

      <NuxtLink to="/tools" class="back-link">← All Tools</NuxtLink>

      <div class="tool-header">
        <div class="tool-badge" style="color:#6c5ce7;background:rgba(108,92,231,0.1)">SEO</div>
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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style="color:rgba(255,255,255,0.2)"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        <p class="drop-title">{{ dragging ? 'Drop it!' : 'Drop a source image' }}</p>
        <p class="drop-sub">SVG, PNG, JPEG — any size (square works best)</p>
      </div>

      <!-- Results -->
      <div v-if="sourceUrl" class="results-grid">

        <!-- Browser tab preview -->
        <div class="preview-card">
          <p class="card-label">Browser tab preview</p>
          <div class="browser-chrome">
            <div class="browser-topbar">
              <div class="browser-dots">
                <span /><span /><span />
              </div>
            </div>
            <div class="browser-tabs">
              <div class="browser-tab">
                <img v-if="preview16" :src="preview16" width="16" height="16" alt="" />
                <span class="browser-tab-title">{{ tabTitle }}</span>
                <span class="browser-tab-close">×</span>
              </div>
            </div>
          </div>
          <div class="tab-title-input-row">
            <label class="field-label">Tab title</label>
            <input v-model="tabTitle" class="tab-title-input" type="text" placeholder="My Website" />
          </div>
        </div>

        <!-- Size previews -->
        <div class="sizes-card">
          <p class="card-label">Generated sizes</p>
          <div class="size-rows">
            <div class="size-row">
              <div class="size-preview" style="width:48px;height:48px">
                <img v-if="preview32" :src="preview32" width="32" height="32" alt="32px" />
              </div>
              <div class="size-info">
                <span class="size-label">favicon.ico</span>
                <span class="size-dims">16×16 + 32×32 multi-size</span>
              </div>
              <button class="dl-btn" @click="downloadFavicon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                Download
              </button>
            </div>

            <div class="size-row">
              <div class="size-preview" style="width:48px;height:48px">
                <img v-if="preview180" :src="preview180" width="48" height="48" alt="180px" style="border-radius:10px" />
              </div>
              <div class="size-info">
                <span class="size-label">apple-touch-icon.png</span>
                <span class="size-dims">180×180</span>
              </div>
              <button class="dl-btn" @click="downloadAppleTouch">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                Download
              </button>
            </div>
          </div>

          <!-- HTML snippet -->
          <div class="snippet-box">
            <p class="snippet-label">&lt;head&gt; snippet</p>
            <pre class="snippet-code">{{ `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.ico" type="image/x-icon">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">` }}</pre>
          </div>
        </div>

        <!-- Pro -->
        <div class="pro-card">
          <div class="pro-header">
            <span class="pro-label">Full PWA icon set & OG image</span>
            <span class="pro-badge">Pro</span>
          </div>
          <ProGate feature="Generate 192px, 512px, OG image & ZIP download">
            <div class="pro-placeholder">
              <div class="pro-sizes">
                <div class="pro-size-chip">icon-192.png</div>
                <div class="pro-size-chip">icon-512.png</div>
                <div class="pro-size-chip">og-image.png (1200×630)</div>
                <div class="pro-size-chip">site.webmanifest</div>
              </div>
              <p class="pro-hint">Download all as a ZIP with ready-to-paste &lt;head&gt; snippet.</p>
            </div>
          </ProGate>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.page-bg { min-height: 100vh; background: #07070a; }
.tool-shell { max-width: 860px; margin: 0 auto; padding: 100px 24px 80px; }
.back-link {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  color: rgba(255,255,255,0.3); text-decoration: none;
  margin-bottom: 32px; transition: color 0.15s;
}
.back-link:hover { color: rgba(255,255,255,0.7); }
.tool-header { margin-bottom: 28px; }
.tool-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 3px; margin-bottom: 12px;
}
.tool-title {
  font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800; color: white; letter-spacing: -0.03em; margin-bottom: 10px;
}
.tool-subtitle {
  font-family: 'DM Sans', sans-serif; font-size: 15px;
  color: rgba(255,255,255,0.38); line-height: 1.6; max-width: 560px;
}
.tool-subtitle code {
  font-family: monospace; font-size: 13px;
  background: rgba(255,255,255,0.07); padding: 1px 5px; border-radius: 3px;
  color: rgba(255,255,255,0.55);
}
.drop-zone {
  border: 2px dashed rgba(255,255,255,0.1); border-radius: 14px;
  padding: 48px 24px; display: flex; flex-direction: column;
  align-items: center; gap: 10px; cursor: pointer; margin-bottom: 24px;
  transition: border-color 0.15s, background 0.15s;
}
.drop-zone:hover, .drop-zone--active {
  border-color: rgba(108,92,231,0.4); background: rgba(108,92,231,0.03);
}
.drop-title {
  font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700;
  color: rgba(255,255,255,0.55); margin: 0;
}
.drop-sub {
  font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(255,255,255,0.22); margin: 0;
}
.hidden { display: none; }

/* ── Results ─────────────────────────────────────────────── */
.results-grid { display: flex; flex-direction: column; gap: 16px; }

.card-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(255,255,255,0.25); margin-bottom: 14px;
}

/* ── Browser chrome ──────────────────────────────────────── */
.preview-card {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; padding: 20px;
}
.browser-chrome {
  background: #1a1a22; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px; overflow: hidden;
}
.browser-topbar {
  background: #111118; padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.browser-dots { display: flex; gap: 5px; }
.browser-dots span {
  width: 9px; height: 9px; border-radius: 50%;
  background: rgba(255,255,255,0.1);
}
.browser-tabs { padding: 6px 8px; }
.browser-tab {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 6px 12px; background: #07070a;
  border-radius: 6px 6px 0 0; max-width: 200px;
}
.browser-tab img { width: 16px; height: 16px; flex-shrink: 0; image-rendering: pixelated; }
.browser-tab-title {
  font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(255,255,255,0.6);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
}
.browser-tab-close {
  font-family: monospace; font-size: 13px; color: rgba(255,255,255,0.2);
}
.tab-title-input-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
.field-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3);
  white-space: nowrap;
}
.tab-title-input {
  flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 5px; padding: 6px 10px;
  font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(255,255,255,0.7);
  outline: none; transition: border-color 0.15s;
}
.tab-title-input:focus { border-color: rgba(108,92,231,0.4); }

/* ── Sizes ───────────────────────────────────────────────── */
.sizes-card {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; padding: 20px;
}
.size-rows { display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; }
.size-row {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 14px; background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04); border-radius: 8px;
}
.size-preview {
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.04); border-radius: 6px; flex-shrink: 0;
}
.size-preview img { image-rendering: pixelated; }
.size-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.size-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700;
  color: rgba(255,255,255,0.7);
}
.size-dims {
  font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.25);
}
.dl-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: #6c5ce7; background: rgba(108,92,231,0.1);
  border: 1px solid rgba(108,92,231,0.2);
  border-radius: 4px; padding: 6px 12px; cursor: pointer; transition: background 0.15s;
  flex-shrink: 0;
}
.dl-btn:hover { background: rgba(108,92,231,0.18); }

.snippet-box {
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px; overflow: hidden;
}
.snippet-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.2);
  padding: 9px 12px; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.snippet-code {
  font-family: 'Fira Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.55);
  padding: 12px; margin: 0; white-space: pre-wrap; line-height: 1.7;
}

/* ── Pro ─────────────────────────────────────────────────── */
.pro-card {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; overflow: hidden;
}
.pro-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.pro-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.25);
}
.pro-badge {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #ec3586; background: rgba(236,53,134,0.1);
  border: 1px solid rgba(236,53,134,0.2); padding: 3px 8px; border-radius: 3px;
}
.pro-placeholder { padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.pro-sizes { display: flex; flex-wrap: wrap; gap: 6px; }
.pro-size-chip {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06); padding: 4px 10px; border-radius: 4px;
}
.pro-hint {
  font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(255,255,255,0.2); margin: 0;
}
</style>
