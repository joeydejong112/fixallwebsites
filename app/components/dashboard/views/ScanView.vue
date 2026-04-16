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
    <div class="bg-gradient-to-br from-primary/10 to-[#6c5ce7]/10 border border-primary/15 rounded-card p-10 py-10 px-6 flex justify-center">
      <div class="max-w-[560px] w-full text-center">
        <div class="font-display font-bold text-[20px] text-[#e8e8f0] mb-2">What site do you want to audit?</div>
        <div class="text-[13px] text-[#6b7280] mb-5 leading-relaxed">Analyze across Security, Performance, SEO, Accessibility, AI Readiness, DNS & Email, and Trust</div>
        <form class="flex gap-2" @submit.prevent="submit">
          <input
            v-model="scanUrl"
            class="flex-1 bg-[#0f0f14] border border-[#1e1e28] rounded-[10px] py-2.5 px-4 text-[#e8e8f0] text-[14px] outline-none font-body transition-colors duration-150 placeholder:text-[#6b7280] focus:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="https://example.com"
            :disabled="scanning"
          />
          <button type="submit" class="bg-primary text-white border-none rounded-[10px] py-2.5 px-5 text-[13px] font-semibold flex items-center gap-2 font-display whitespace-nowrap transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:not(:disabled):opacity-80" :disabled="scanning || !scanUrl.trim()">
            <svg v-if="!scanning" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
            <svg v-else class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-dashoffset="12" />
            </svg>
            {{ scanning ? 'Scanning…' : 'Run Full Audit' }}
          </button>
        </form>
        <div class="flex flex-wrap gap-1.5 justify-center mt-4">
          <div v-for="[n, c] in [['Security','#00d4aa'],['Performance','#ffaa00'],['SEO','#6c5ce7'],['Accessibility','#a29bfe'],['AI Readiness','#ff7675'],['DNS & Email','#74b9ff'],['Trust','#fd79a8']]" :key="String(n)" class="text-[10px] font-semibold font-display tracking-widest px-2.5 py-px rounded-full border bg-transparent uppercase" :style="{ borderColor: String(c), color: String(c) }">{{ n }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
