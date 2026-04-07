<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Competitor Scan — ScanPulse' })

const { userId } = useAuth()
const { client, api } = useConvex()
const router = useRouter()

const urlA     = ref('')
const urlB     = ref('')
const scanning = ref(false)
const error    = ref('')

// Recent comparisons from localStorage
const STORAGE_KEY = 'sp_recent_comparisons'
const recent = ref<{ urlA: string; urlB: string; scanIdA: string; scanIdB: string }[]>([])

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) recent.value = JSON.parse(raw)
  } catch {}
})

function saveRecent(urlA: string, urlB: string, scanIdA: string, scanIdB: string) {
  const entry = { urlA, urlB, scanIdA, scanIdB }
  const filtered = recent.value.filter(r => !(r.urlA === urlA && r.urlB === urlB))
  const updated = [entry, ...filtered].slice(0, 5)
  recent.value = updated
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
}

function swapUrls() {
  const tmp = urlA.value
  urlA.value = urlB.value
  urlB.value = tmp
}

function normalise(url: string): string {
  let u = url.trim()
  if (!u) return u
  if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u
  return u
}

async function startCompare() {
  error.value = ''
  const a = normalise(urlA.value)
  const b = normalise(urlB.value)

  if (!a || !b) { error.value = 'Both URLs are required.'; return }
  if (a === b)  { error.value = 'URLs must be different.'; return }

  try { new URL(a); new URL(b) }
  catch { error.value = 'One or both URLs are invalid.'; return }

  if (!userId.value) return
  scanning.value = true
  try {
    const { scanIdA, scanIdB } = await client.action(api.compare.compareScans, {
      userId: userId.value,
      urlA: a,
      urlB: b,
    }) as { scanIdA: string; scanIdB: string }

    saveRecent(a, b, scanIdA, scanIdB)
    await router.push(`/compare/${scanIdA}/${scanIdB}`)
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to start comparison'
    scanning.value = false
  }
}

function hostname(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />

    <main class="max-w-2xl mx-auto px-4 py-16">
      <!-- Header -->
      <div class="mb-10">
        <NuxtLink to="/dashboard" class="text-sm text-muted hover:text-white transition-colors mb-4 inline-flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </NuxtLink>
        <h1 class="text-3xl font-display font-bold text-white mb-2">Competitor Scan</h1>
        <p class="text-muted">Compare your site against a competitor across all 6 pillars.</p>
      </div>

      <ProGate feature="Competitor Scan — side-by-side pillar comparison">

        <!-- URL inputs -->
        <div class="card p-6 mb-4">
          <div class="space-y-4">
            <!-- Your site -->
            <div>
              <label class="block text-[10px] font-display font-bold tracking-[0.14em] uppercase text-white/40 mb-2">
                Your site
              </label>
              <input
                v-model="urlA"
                type="url"
                placeholder="https://yoursite.com"
                class="input-field w-full"
                :disabled="scanning"
                @keydown.enter="startCompare"
              />
            </div>

            <!-- Swap button -->
            <div class="flex justify-center">
              <button
                class="flex items-center gap-2 text-xs text-muted hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                :disabled="scanning"
                @click="swapUrls"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Swap
              </button>
            </div>

            <!-- Competitor -->
            <div>
              <label class="block text-[10px] font-display font-bold tracking-[0.14em] uppercase text-white/40 mb-2">
                Competitor
              </label>
              <input
                v-model="urlB"
                type="url"
                placeholder="https://competitor.com"
                class="input-field w-full"
                :disabled="scanning"
                @keydown.enter="startCompare"
              />
            </div>
          </div>

          <!-- Error -->
          <p v-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>

          <!-- CTA -->
          <button
            class="btn-primary w-full mt-5 flex items-center justify-center gap-2"
            :disabled="scanning || !urlA || !urlB"
            @click="startCompare"
          >
            <svg v-if="scanning" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {{ scanning ? 'Starting scans…' : 'Compare Sites' }}
          </button>
        </div>

        <!-- Recent comparisons -->
        <div v-if="recent.length" class="mt-8">
          <h2 class="text-[10px] font-display font-bold tracking-[0.14em] uppercase text-muted mb-3">Recent comparisons</h2>
          <div class="space-y-2">
            <NuxtLink
              v-for="r in recent"
              :key="`${r.scanIdA}-${r.scanIdB}`"
              :to="`/compare/${r.scanIdA}/${r.scanIdB}`"
              class="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] hover:bg-white/[0.035] transition-all group"
            >
              <div class="flex-1 min-w-0">
                <span class="text-white/70 text-sm font-display truncate">{{ hostname(r.urlA) }}</span>
                <span class="text-muted text-sm mx-2">vs</span>
                <span class="text-white/50 text-sm font-display truncate">{{ hostname(r.urlB) }}</span>
              </div>
              <svg class="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>
        </div>

      </ProGate>
    </main>
  </div>
</template>
