<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Bulk Scan — ScanPulse', description: 'Scan up to 50 URLs at once. Upload a CSV or paste URLs and get a full report across all 7 pillars.' })

const { userId } = useAuth()
const { client, api } = useConvex()
const router = useRouter()

// ── Input state ───────────────────────────────────────────────────────────────
type InputMode = 'paste' | 'csv'
const mode      = ref<InputMode>('paste')
const rawText   = ref('')
const scanName  = ref(`Bulk scan ${new Date().toISOString().slice(0, 10)}`)
const submitting = ref(false)
const error      = ref('')

// ── CSV upload ────────────────────────────────────────────────────────────────
const csvInput = ref<HTMLInputElement | null>(null)
const dragging = ref(false)

function handleFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    // Extract first column from each non-empty row, skip header if it's not a URL
    const rows = text.split(/\r?\n/).map(r => r.split(',')[0].trim().replace(/^["']|["']$/g, ''))
    const urls = rows.filter(r => r.startsWith('http'))
    rawText.value = urls.join('\n')
    mode.value = 'paste'
  }
  reader.readAsText(file)
}

function onFileInput(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

// ── URL parsing & validation ──────────────────────────────────────────────────
interface ParsedUrl {
  raw: string
  valid: boolean
  reason?: string
}

const MAX = 50

const parsed = computed((): ParsedUrl[] => {
  const lines = rawText.value
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  return lines.map(raw => {
    if (seen.has(raw)) return { raw, valid: false, reason: 'duplicate' }
    seen.add(raw)
    if (!raw.startsWith('http://') && !raw.startsWith('https://'))
      return { raw, valid: false, reason: 'must start with http:// or https://' }
    try { new URL(raw) } catch { return { raw, valid: false, reason: 'invalid URL' } }
    return { raw, valid: true }
  })
})

const validUrls   = computed(() => parsed.value.filter(p => p.valid).map(p => p.raw))
const invalidUrls = computed(() => parsed.value.filter(p => !p.valid))
const overLimit   = computed(() => validUrls.value.length > MAX)

// ── Submit ────────────────────────────────────────────────────────────────────
async function submit() {
  if (!userId.value || validUrls.value.length === 0 || overLimit.value) return
  submitting.value = true
  error.value = ''
  try {
    const bulkScanId = await client.mutation(api.bulkScans.createBulkScan, {
      userId:  userId.value,
      name:    scanName.value || `Bulk scan ${new Date().toISOString().slice(0, 10)}`,
      urls:    validUrls.value,
    })
    await client.action(api.bulkScanAction.startBulkScan, { bulkScanId })
    router.push(`/bulk-scan/${bulkScanId}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong.'
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />
    <div class="fixed inset-0 pointer-events-none z-0" style="background-image: linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px); background-size:64px 64px" />

    <div class="relative z-10 max-w-3xl mx-auto px-6 pt-28 pb-24">

      <!-- Header -->
      <div class="mb-10">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-7 h-px bg-primary" />
          <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">Pro feature</span>
        </div>
        <h1 class="font-display font-bold text-white tracking-tight mb-2" style="font-size: clamp(1.8rem, 3vw, 2.4rem); letter-spacing: -0.03em">Bulk Scan</h1>
        <p class="text-white/45 font-body text-sm">Scan up to 50 URLs in one job. Upload a CSV or paste URLs — results populate in real time.</p>
      </div>

      <ProGate feature="Bulk Scan — scan up to 50 URLs at once">

        <!-- Scan name -->
        <div class="mb-6">
          <label class="block text-[10px] font-display font-bold tracking-[0.14em] uppercase text-white/40 mb-2">Scan name</label>
          <input v-model="scanName" type="text" class="input-field w-full" placeholder="Bulk scan 2026-04-07" />
        </div>

        <!-- Mode tabs -->
        <div class="flex gap-1 mb-4 border-b border-white/[0.05] pb-0">
          <button
            v-for="m in (['paste', 'csv'] as InputMode[])"
            :key="m"
            class="tab-btn"
            :class="mode === m ? 'tab-btn--active' : ''"
            @click="mode = m"
          >
            {{ m === 'paste' ? 'Paste URLs' : 'Upload CSV' }}
          </button>
        </div>

        <!-- Paste input -->
        <div v-if="mode === 'paste'" class="mb-5">
          <textarea
            v-model="rawText"
            class="input-field w-full font-mono text-xs"
            rows="12"
            placeholder="https://example.com&#10;https://another.com&#10;https://client-site.com"
          />
          <p class="text-white/30 text-[11px] font-body mt-1.5">One URL per line. Must start with http:// or https://</p>
        </div>

        <!-- CSV upload -->
        <div
          v-else
          class="mb-5 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors py-14"
          :class="dragging ? 'border-primary/60 bg-primary/5' : 'border-white/10 hover:border-white/20'"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
          @click="csvInput?.click()"
        >
          <svg class="w-8 h-8 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-white/45 font-body text-sm">Drop a CSV file here or <span class="text-primary">browse</span></p>
          <p class="text-white/25 font-body text-xs">First column is used as the URL. Header row auto-skipped.</p>
          <input ref="csvInput" type="file" accept=".csv,text/csv" class="hidden" @change="onFileInput" />
        </div>

        <!-- URL counter + validation summary -->
        <div v-if="parsed.length" class="mb-5 space-y-2">
          <div class="flex items-center gap-3 flex-wrap">
            <span
              class="text-[12px] font-display font-bold"
              :class="overLimit ? 'text-danger' : 'text-success'"
            >{{ validUrls.length }} valid URL{{ validUrls.length !== 1 ? 's' : '' }}</span>
            <span class="text-white/30 text-[11px] font-body">/ {{ MAX }} max</span>
            <span v-if="invalidUrls.length" class="text-warning text-[11px] font-body">· {{ invalidUrls.length }} invalid</span>
          </div>

          <!-- Progress bar -->
          <div class="h-1 bg-white/[0.05] rounded-full overflow-hidden w-full">
            <div
              class="h-full rounded-full transition-all duration-300"
              :style="{ width: Math.min((validUrls.length / MAX) * 100, 100) + '%', background: overLimit ? '#ff4757' : '#00d4aa' }"
            />
          </div>

          <!-- Invalid URL list -->
          <div v-if="invalidUrls.length" class="space-y-1 max-h-32 overflow-y-auto">
            <div v-for="(u, i) in invalidUrls" :key="i" class="flex items-center gap-2 text-[11px] font-body">
              <span class="text-danger/70">✕</span>
              <span class="text-white/45 truncate max-w-xs">{{ u.raw }}</span>
              <span class="text-white/25">{{ u.reason }}</span>
            </div>
          </div>
        </div>

        <!-- Error -->
        <p v-if="error" class="text-danger text-sm font-body mb-4">{{ error }}</p>

        <!-- Submit -->
        <div class="flex items-center gap-4">
          <button
            class="btn-primary"
            :disabled="submitting || validUrls.length === 0 || overLimit"
            @click="submit"
          >
            <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ submitting ? 'Starting…' : `Scan ${validUrls.length || ''} URL${validUrls.length !== 1 ? 's' : ''}` }}
          </button>
          <NuxtLink to="/dashboard" class="btn-ghost text-sm text-white/35">Cancel</NuxtLink>
        </div>

      </ProGate>
    </div>
  </div>
</template>

<style scoped>
.input-field {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  padding: 9px 12px;
  color: rgba(255,255,255,0.85);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
  resize: vertical;
}
.input-field:focus { border-color: rgba(236,53,134,0.4); }

.tab-btn {
  padding: 8px 14px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.45);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: none;
  border-left: none; border-right: none; border-top: none;
  cursor: pointer;
  transition: color 0.15s;
}
.tab-btn:hover { color: rgba(255,255,255,0.7); }
.tab-btn--active { color: white; border-bottom-color: #ec3586; }
</style>
