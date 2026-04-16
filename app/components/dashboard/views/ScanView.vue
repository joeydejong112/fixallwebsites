<script setup lang="ts">
defineProps<{
  scanning: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', url: string): void
  (e: 'open-scan', scan: any): void
}>()

const scanUrl = ref('')

function normalise(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function submit() {
  const url = normalise(scanUrl.value)
  if (!url) return
  emit('submit', url)
}

const hostname = (url: string) => {
  try { return new URL(url).hostname } catch { return url }
}

const relativeTime = (ts: number) => {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

const scoreBg = (score?: number) => {
  if (score == null) return 'rgba(255,255,255,0.2)'
  if (score >= 80) return '#00d4aa'
  if (score >= 60) return '#ffaa00'
  return '#ff4757'
}

const faviconUrl = (url: string) => {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32` } catch { return null }
}
</script>

<template>
  <div>
    <div class="ds-scan-hero">
      <div class="ds-scan-hero-inner">
        <div class="ds-scan-hero-title">What site do you want to audit?</div>
        <div class="ds-scan-hero-sub">Analyze across Security, Performance, SEO, Accessibility, AI Readiness, DNS & Email, and Trust</div>
        <form class="ds-scan-hero-form" @submit.prevent="submit">
          <input
            v-model="scanUrl"
            class="ds-scan-hero-input"
            placeholder="https://example.com"
            :disabled="scanning"
          />
          <button type="submit" class="ds-scan-hero-btn" :disabled="scanning || !scanUrl.trim()">
            <svg v-if="!scanning" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
            <svg v-else class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-dashoffset="12" />
            </svg>
            {{ scanning ? 'Scanning…' : 'Run Full Audit' }}
          </button>
        </form>
        <div class="ds-pillar-chips">
          <div v-for="[n, c] in [['Security','#00d4aa'],['Performance','#ffaa00'],['SEO','#6c5ce7'],['Accessibility','#a29bfe'],['AI Readiness','#ff7675'],['DNS & Email','#74b9ff'],['Trust','#fd79a8']]" :key="String(n)" class="ds-pillar-chip" :style="{ borderColor: String(c), color: String(c) }">{{ n }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Scan view ────────────────────────────────────────── */
.ds-scan-hero { background: linear-gradient(135deg, rgba(236,53,134,0.06) 0%, rgba(108,92,231,0.06) 100%); border: 1px solid rgba(236,53,134,0.15); border-radius: 14px; padding: 40px 24px; display: flex; justify-content: center; }
.ds-scan-hero-inner { max-width: 560px; width: 100%; text-align: center; }
.ds-scan-hero-title { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; color: #e8e8f0; margin-bottom: 8px; }
.ds-scan-hero-sub { font-size: 13px; color: #6b7280; margin-bottom: 22px; line-height: 1.5; }
.ds-scan-hero-form { display: flex; gap: 8px; }
.ds-scan-hero-input { flex: 1; background: #0f0f14; border: 1px solid #1e1e28; border-radius: 10px; padding: 11px 16px; color: #e8e8f0; font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s; }
.ds-scan-hero-input::placeholder { color: #6b7280; }
.ds-scan-hero-input:focus { border-color: rgba(236,53,134,0.4); }
.ds-scan-hero-input:disabled { opacity: 0.5; cursor: not-allowed; }
.ds-scan-hero-btn { background: #ec3586; color: white; border: none; border-radius: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: 'Space Grotesk', sans-serif; white-space: nowrap; transition: opacity 0.15s; }
.ds-scan-hero-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ds-scan-hero-btn:hover:not(:disabled) { opacity: 0.88; }
.ds-pillar-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 16px; }
.ds-pillar-chip { font-size: 10px; font-weight: 600; font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.06em; padding: 3px 10px; border-radius: 20px; border: 1px solid; background: transparent; text-transform: uppercase; }
</style>
