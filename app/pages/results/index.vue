<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useSeoMeta({ title: 'Scan Results — ScanPulse' })

const route = useRoute()
const { userId } = useAuth()
const { client, api } = useConvex()

const scan = ref<any>(null)
const loading = ref(true)
const error = ref('')
let pollInterval: ReturnType<typeof setInterval> | null = null

async function fetchScan(id: string) {
  scan.value = await client.query(api.scans.getScan, { scanId: id })
}

onMounted(async () => {
  const url = route.query.url as string
  const scanId = route.query.scanId as string

  // Load existing scan
  if (scanId) {
    await fetchScan(scanId)
    loading.value = false
    return
  }

  // Kick off new scan
  if (!url || !userId.value) {
    error.value = 'No URL provided.'
    loading.value = false
    return
  }

  try {
    const newScanId = await client.mutation(api.scans.createScan, { userId: userId.value, url })
    // Fire-and-forget the action — poll for results
    client.action(api.scanAction.runScan, { scanId: newScanId, url }).catch(() => {})

    // Poll every 2s until done or error
    pollInterval = setInterval(async () => {
      await fetchScan(newScanId)
      if (scan.value?.status === 'done' || scan.value?.status === 'error') {
        clearInterval(pollInterval!)
        loading.value = false
      }
    }, 2000)

    // Initial fetch
    await fetchScan(newScanId)
    if (scan.value?.status === 'done' || scan.value?.status === 'error') {
      clearInterval(pollInterval!)
      loading.value = false
    }
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong.'
    loading.value = false
  }
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

function scoreColor(score?: number) {
  if (score === undefined) return 'text-white/30'
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-warning'
  return 'text-danger'
}

function barColor(score?: number) {
  if (score === undefined) return '#2a2a3a'
  if (score >= 80) return '#00d4aa'
  if (score >= 60) return '#ffaa00'
  return '#ff4757'
}

function severityDot(sev: string) {
  return { critical: 'bg-danger', warning: 'bg-warning', pass: 'bg-success' }[sev] ?? 'bg-white/20'
}

const pillars = computed(() => [
  { key: 'security',    label: 'Security',    color: '#00d4aa', score: scan.value?.securityScore },
  { key: 'performance', label: 'Performance', color: '#ffaa00', score: scan.value?.performanceScore },
  { key: 'seo',         label: 'SEO',         color: '#6c5ce7', score: scan.value?.seoScore },
])

const groupedIssues = computed(() => {
  if (!scan.value?.issues) return {}
  return scan.value.issues.reduce((acc: Record<string, any[]>, issue: any) => {
    ;(acc[issue.pillar] ??= []).push(issue)
    return acc
  }, {})
})

const activeTab = ref<'security' | 'performance' | 'seo' | 'all'>('all')
const displayIssues = computed(() => {
  if (!scan.value?.issues) return []
  if (activeTab.value === 'all') return scan.value.issues
  return scan.value.issues.filter((i: any) => i.pillar === activeTab.value)
})
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />

    <div class="max-w-4xl mx-auto px-6 pt-28 pb-20">

      <!-- Scanning / loading state -->
      <div v-if="loading || scan?.status === 'pending' || scan?.status === 'running'" class="py-24">
        <div class="flex flex-col items-center text-center">
          <!-- Animated radar -->
          <div class="relative w-28 h-28 mb-8">
            <div class="absolute inset-0 rounded-full border border-white/5" />
            <div class="absolute inset-4 rounded-full border border-white/5" />
            <div class="absolute inset-8 rounded-full border border-white/5" />
            <div
              class="absolute inset-0 rounded-full border-t-2 border-primary"
              style="animation: spin 1.5s linear infinite"
            />
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-2 h-2 rounded-full bg-primary" style="animation: pulse 1.5s ease-in-out infinite" />
            </div>
          </div>

          <p class="font-display font-semibold text-white text-lg mb-2">
            {{ scan?.status === 'running' ? 'Scanning…' : 'Initialising scan…' }}
          </p>
          <p class="text-white/35 font-body text-sm mb-1">{{ scan?.url }}</p>
          <p class="text-white/20 font-body text-xs">Running security, performance & SEO checks</p>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error || scan?.status === 'error'" class="py-16 text-center">
        <div class="w-12 h-12 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-4">
          <svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p class="font-display font-medium text-white mb-2">Scan failed</p>
        <p class="text-white/40 text-sm font-body mb-6">{{ error || scan?.errorMessage }}</p>
        <NuxtLink to="/dashboard" class="btn-secondary text-sm">← Back to dashboard</NuxtLink>
      </div>

      <!-- Results -->
      <div v-else-if="scan?.status === 'done'">

        <!-- URL + back -->
        <div class="flex items-start justify-between gap-4 mb-10">
          <div>
            <NuxtLink to="/dashboard" class="text-white/25 text-xs font-body hover:text-white/50 transition-colors mb-3 inline-flex items-center gap-1.5">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </NuxtLink>
            <p class="text-white/30 text-xs font-body mb-1">Results for</p>
            <h1 class="font-display font-bold text-white break-all" style="font-size: clamp(1.1rem, 2vw, 1.4rem)">{{ scan.url }}</h1>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-white/25 text-xs font-body mb-1">Overall</p>
            <p class="font-display font-bold" :class="scoreColor(scan.overallScore)" style="font-size: 3rem; line-height: 1">
              {{ scan.overallScore }}
            </p>
          </div>
        </div>

        <!-- Score bars -->
        <div class="grid sm:grid-cols-3 gap-4 mb-10">
          <div
            v-for="p in pillars"
            :key="p.key"
            class="bg-dark-surface border border-dark-border rounded-card p-5"
          >
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-display uppercase tracking-widest" :style="{ color: p.color }">{{ p.label }}</span>
              <span class="font-display font-bold text-2xl" :class="scoreColor(p.score)">{{ p.score ?? '—' }}</span>
            </div>
            <div class="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :style="{ width: (p.score ?? 0) + '%', background: barColor(p.score) }"
              />
            </div>
          </div>
        </div>

        <!-- Issues -->
        <div>
          <!-- Tab bar -->
          <div class="flex items-center gap-1 mb-6 border-b border-dark-border pb-0">
            <button
              v-for="tab in ['all', 'security', 'performance', 'seo']"
              :key="tab"
              class="px-4 py-2.5 text-xs font-display capitalize transition-colors border-b-2 -mb-px"
              :class="activeTab === tab
                ? 'text-white border-primary'
                : 'text-white/35 border-transparent hover:text-white/60'"
              @click="activeTab = tab as any"
            >
              {{ tab === 'all' ? `All (${scan.issues?.length ?? 0})` : tab }}
            </button>
          </div>

          <!-- Issue list -->
          <div class="space-y-2">
            <div
              v-for="(issue, i) in displayIssues"
              :key="i"
              class="flex items-start gap-4 px-5 py-4 bg-dark-surface border border-dark-border rounded-xl hover:border-white/10 transition-colors"
            >
              <div class="mt-1.5 flex-shrink-0">
                <div class="w-2 h-2 rounded-full" :class="severityDot(issue.severity)" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 flex-wrap mb-1">
                  <p class="font-display font-medium text-white text-sm">{{ issue.title }}</p>
                  <span
                    class="text-[10px] font-display uppercase tracking-wider px-2 py-0.5 rounded-full border"
                    :class="{
                      'text-danger border-danger/20 bg-danger/5': issue.severity === 'critical',
                      'text-warning border-warning/20 bg-warning/5': issue.severity === 'warning',
                      'text-success border-success/20 bg-success/5': issue.severity === 'pass',
                    }"
                  >{{ issue.severity }}</span>
                </div>
                <p class="text-white/40 text-xs font-body leading-relaxed">{{ issue.description }}</p>
              </div>
              <div class="flex-shrink-0 ml-2">
                <span
                  class="text-[10px] font-display uppercase tracking-wider px-2 py-0.5 rounded text-white/25"
                  :style="{ background: 'rgba(255,255,255,0.04)' }"
                >{{ issue.pillar }}</span>
              </div>
            </div>

            <div v-if="!displayIssues.length" class="text-center py-12 text-white/25 text-sm font-body">
              No {{ activeTab === 'all' ? '' : activeTab }} issues found.
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-10 flex items-center gap-4 pt-8 border-t border-dark-border">
          <NuxtLink to="/dashboard" class="btn-secondary text-sm">← Back</NuxtLink>
          <button class="btn-ghost text-sm text-white/40" @click="$router.push(`/?url=${encodeURIComponent(scan.url)}`)">
            Scan again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}
</style>
