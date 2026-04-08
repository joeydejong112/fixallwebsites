<script setup lang="ts">
definePageMeta({ layout: 'tool' })
useSeoMeta({
  title: 'Free WCAG Color Contrast Checker — AA & AAA Ratio Tool',
  description: 'Check foreground/background color contrast ratios against WCAG 2.1 AA and AAA standards with live preview. Supports Hex, RGB, and HSL — free.',
  ogTitle: 'Free WCAG Color Contrast Checker',
  ogDescription: 'Test AA and AAA contrast ratios instantly with live color preview. Supports Hex, RGB, HSL.',
})
const _siteUrl = useRequestURL()
useHead({ link: [{ rel: 'canonical', href: _siteUrl.origin + _siteUrl.pathname }] })

const fg = ref('#ffffff')
const bg = ref('#1a1a2e')

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 3 && clean.length !== 6) return null
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function linearize(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function luminance(hex: string): number | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const [r, g, b] = rgb.map(linearize)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(hex1: string, hex2: string): number | null {
  const L1 = luminance(hex1)
  const L2 = luminance(hex2)
  if (L1 == null || L2 == null) return null
  const lighter = Math.max(L1, L2)
  const darker  = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

const ratio = computed(() => contrastRatio(fg.value, bg.value))
const ratioDisplay = computed(() => ratio.value != null ? ratio.value.toFixed(2) + ':1' : '—')

interface Check { label: string; threshold: number; size: string }
const checks: Check[] = [
  { label: 'AA Normal text',  threshold: 4.5,  size: '16px' },
  { label: 'AA Large text',   threshold: 3,    size: '24px bold' },
  { label: 'AAA Normal text', threshold: 7,    size: '16px' },
  { label: 'AAA Large text',  threshold: 4.5,  size: '24px bold' },
]

function pass(threshold: number) {
  return ratio.value != null && ratio.value >= threshold
}

function ratingLabel(): string {
  if (ratio.value == null) return '—'
  if (ratio.value >= 7)   return 'AAA'
  if (ratio.value >= 4.5) return 'AA'
  if (ratio.value >= 3)   return 'AA Large'
  return 'Fail'
}
function ratingColor(): string {
  if (ratio.value == null) return 'rgba(255,255,255,0.2)'
  if (ratio.value >= 4.5)  return '#00d4aa'
  if (ratio.value >= 3)    return '#ffaa00'
  return '#ff4757'
}
</script>

<template>
  <div class="page-bg">
    <div class="tool-shell">

      <div class="tool-header">
        <div class="tool-badge">Accessibility</div>
        <h1 class="tool-title">Color Contrast Checker</h1>
        <p class="tool-subtitle">Calculate WCAG 2.1 contrast ratios instantly. See pass/fail for AA and AAA at normal and large text sizes, with a live preview.</p>
      </div>

      <div class="checker-grid">

        <!-- Pickers -->
        <div class="pickers-card">
          <div class="card-section-label">
            <span class="section-dot"></span>
            Color pair
          </div>
          <div class="picker-row">
            <div class="picker-group">
              <label class="picker-label">Foreground (text)</label>
              <div class="picker-inputs">
                <input v-model="fg" type="color" class="color-swatch" />
                <input v-model="fg" type="text" class="hex-input" maxlength="7" placeholder="#ffffff" />
              </div>
            </div>
            <div class="picker-swap">
              <button class="swap-btn" @click="[fg, bg] = [bg, fg]" title="Swap colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/></svg>
              </button>
            </div>
            <div class="picker-group">
              <label class="picker-label">Background</label>
              <div class="picker-inputs">
                <input v-model="bg" type="color" class="color-swatch" />
                <input v-model="bg" type="text" class="hex-input" maxlength="7" placeholder="#1a1a2e" />
              </div>
            </div>
          </div>
        </div>

        <!-- Ratio display -->
        <div class="ratio-card" :style="{ background: bg }">
          <div class="ratio-inner">
            <p class="ratio-number" :style="{ color: fg }">{{ ratioDisplay }}</p>
            <p class="ratio-label" :style="{ color: fg, opacity: 0.5 }">contrast ratio</p>
            <div class="ratio-rating-pill" :style="{ color: ratingColor(), background: `${ratingColor()}18`, border: `1px solid ${ratingColor()}33` }">
              {{ ratingLabel() }}
            </div>
          </div>
        </div>

        <!-- Live preview -->
        <div class="preview-card" :style="{ background: bg }">
          <div class="preview-stack">
            <p class="preview-text" :style="{ color: fg, fontSize: '16px', lineHeight: '1.5' }">Normal text — The quick brown fox jumps over the lazy dog.</p>
            <p class="preview-text" :style="{ color: fg, fontSize: '24px', fontWeight: '700', lineHeight: '1.3' }">Large text (24px bold)</p>
            <p class="preview-text" :style="{ color: fg, fontSize: '12px', lineHeight: '1.5', opacity: 0.85 }">Small text 12px — harder to read at low contrast</p>
          </div>
        </div>

        <!-- WCAG checks -->
        <div class="checks-card">
          <div class="card-section-label">
            <span class="section-dot"></span>
            WCAG 2.1 Results
          </div>
          <div class="checks-list">
            <div v-for="check in checks" :key="check.label" class="check-row">
              <div class="check-info">
                <span class="check-label">{{ check.label }}</span>
                <span class="check-meta">
                  <span class="check-size">{{ check.size }}</span>
                  <span class="check-threshold">≥ {{ check.threshold }}:1</span>
                </span>
              </div>
              <span
                class="check-badge"
                :class="pass(check.threshold) ? 'check-badge--pass' : 'check-badge--fail'"
              >
                {{ pass(check.threshold) ? 'Pass' : 'Fail' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Pro features -->
        <div class="pro-section">
          <div class="pro-header">
            <div class="pro-header-left">
              <span class="section-dot section-dot--pink"></span>
              <span class="pro-label">Advanced</span>
            </div>
            <span class="pro-badge">Pro</span>
          </div>
          <ProGate feature="Auto color suggestions & colorblind simulation">
            <div class="pro-placeholder">
              <p class="pro-placeholder-text">Suggest closest passing color — auto-adjust lightness to meet AA. Simulate protanopia, deuteranopia, and tritanopia.</p>
            </div>
          </ProGate>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.page-bg { min-height: 100vh; background: #07070a; }
.tool-shell { max-width: 860px; margin: 0 auto; padding: 48px 28px 80px; }

/* Header */
.tool-header { margin-bottom: 32px; }
.tool-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 3px; margin-bottom: 12px;
  color: #a29bfe;
  background: rgba(162, 155, 254, 0.1);
  border: 1px solid rgba(162, 155, 254, 0.2);
}
.tool-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800; color: white; letter-spacing: -0.03em; margin-bottom: 10px;
}
.tool-subtitle {
  font-family: 'DM Sans', sans-serif; font-size: 15px;
  color: rgba(255,255,255,0.60); line-height: 1.6; max-width: 560px;
}

/* Section dot + label */
.card-section-label {
  display: flex; align-items: center; gap: 7px;
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.13em; text-transform: uppercase;
  color: rgba(255,255,255,0.45); margin-bottom: 16px;
}
.section-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #a29bfe; flex-shrink: 0;
}
.section-dot--pink { background: #ec3586; }

/* Grid */
.checker-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 640px) { .checker-grid { grid-template-columns: 1fr; } }

/* Pickers card */
.pickers-card {
  grid-column: 1 / -1;
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 20px 24px;
}
.picker-row {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
}
.picker-group { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 140px; }
.picker-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.45);
}
.picker-inputs { display: flex; align-items: center; gap: 10px; }
.color-swatch {
  width: 48px; height: 48px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.12); cursor: pointer; padding: 0;
  background: none; flex-shrink: 0;
}
.hex-input {
  flex: 1;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px; padding: 10px 12px;
  font-family: 'Fira Mono', monospace; font-size: 13px;
  color: rgba(255,255,255,0.7); outline: none;
}
.hex-input:focus { border-color: rgba(162,155,254,0.4); }

.picker-swap { display: flex; align-items: center; flex-shrink: 0; }
.swap-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(162,155,254,0.08);
  border: 1px solid rgba(162,155,254,0.2);
  color: #a29bfe; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.swap-btn:hover { background: rgba(162,155,254,0.18); }

/* Ratio card */
.ratio-card {
  border-radius: 12px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  min-height: 160px;
  border: 1px solid rgba(255,255,255,0.07);
  transition: background 0.15s;
  padding: 28px 20px;
}
.ratio-inner { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.ratio-number {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 3.2rem; font-weight: 800; letter-spacing: -0.04em;
  margin: 0; transition: color 0.15s; line-height: 1;
}
.ratio-label {
  font-family: 'DM Sans', sans-serif; font-size: 11px;
  margin: 0 0 8px; transition: color 0.15s;
}
.ratio-rating-pill {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 3px 12px; border-radius: 20px;
  transition: all 0.15s;
}

/* Preview card */
.preview-card {
  border-radius: 12px; padding: 24px;
  border: 1px solid rgba(255,255,255,0.07);
  transition: background 0.15s;
  display: flex; align-items: flex-start;
}
.preview-stack {
  display: flex; flex-direction: column; gap: 12px; width: 100%;
}
.preview-text {
  font-family: 'DM Sans', sans-serif; margin: 0;
  transition: color 0.15s;
}

/* WCAG checks */
.checks-card {
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; padding: 20px;
}
.checks-list { display: flex; flex-direction: column; gap: 10px; }
.check-row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.check-info { display: flex; flex-direction: column; gap: 3px; }
.check-label {
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  color: rgba(255,255,255,0.7);
}
.check-meta { display: flex; align-items: center; gap: 8px; }
.check-size {
  font-family: 'Fira Mono', monospace; font-size: 10px;
  color: rgba(255,255,255,0.50);
}
.check-threshold {
  font-family: 'Fira Mono', monospace; font-size: 10px;
  color: rgba(255,255,255,0.45);
}
.check-badge {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 3px 10px; border-radius: 20px; flex-shrink: 0;
}
.check-badge--pass {
  color: #00d4aa; background: rgba(0,212,170,0.1);
  border: 1px solid rgba(0,212,170,0.2);
}
.check-badge--fail {
  color: #ff4757; background: rgba(255,71,87,0.1);
  border: 1px solid rgba(255,71,87,0.2);
}

/* Pro */
.pro-section {
  grid-column: 1 / -1;
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; overflow: hidden;
}
.pro-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.pro-header-left { display: flex; align-items: center; gap: 7px; }
.pro-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.45);
}
.pro-badge {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #ec3586; background: rgba(236,53,134,0.1);
  border: 1px solid rgba(236,53,134,0.2); padding: 3px 8px; border-radius: 3px;
}
.pro-placeholder { padding: 20px; }
.pro-placeholder-text {
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.50); margin: 0; line-height: 1.5;
}
</style>
