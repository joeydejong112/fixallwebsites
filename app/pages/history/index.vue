<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Score History — ScanPulse' })

const route  = useRoute()
const router = useRouter()
const { userId } = useAuth()
const { client, api } = useConvex()

const url     = computed(() => (route.query.url as string) || '')
const history = ref<any[]>([])
const loading = ref(true)
const error   = ref('')

const PILLAR_COLORS: Record<string, string> = {
  overall:       '#ec3586',
  security:      '#00d4aa',
  performance:   '#ffaa00',
  seo:           '#6c5ce7',
  accessibility: '#74b9ff',
  ai:            '#ff7675',
}

const PILLAR_LABELS: Record<string, string> = {
  overall:       'Overall',
  security:      'Security',
  performance:   'Performance',
  seo:           'SEO',
  accessibility: 'Accessibility',
  ai:            'AI Readiness',
}

const pillars = ['overall', 'security', 'performance', 'seo', 'accessibility', 'ai'] as const

type Pillar = typeof pillars[number]

async function load() {
  if (!userId.value || !url.value) return
  loading.value = true
  error.value = ''
  try {
    history.value = await client.query(api.scoreHistory.getHistory, {
      userId: userId.value,
      url: url.value,
    })
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load history'
  } finally {
    loading.value = false
  }
}

watch([userId, url], () => load(), { immediate: true })

// Extract score series per pillar
function series(pillar: Pillar): number[] {
  return history.value
    .map(r => {
      if (pillar === 'overall') return r.overallScore
      if (pillar === 'security') return r.securityScore
      if (pillar === 'performance') return r.performanceScore
      if (pillar === 'seo') return r.seoScore
      if (pillar === 'accessibility') return r.accessibilityScore
      if (pillar === 'ai') return r.aiScore
      return null
    })
    .filter((v): v is number => v != null)
}

function lastScore(pillar: Pillar): number | null {
  const s = series(pillar)
  return s.length ? s[s.length - 1] : null
}

function trend(pillar: Pillar): number | null {
  const s = series(pillar)
  if (s.length < 2) return null
  return s[s.length - 1] - s[s.length - 2]
}

function trendLabel(pillar: Pillar): string {
  const t = trend(pillar)
  if (t === null) return '—'
  if (t > 0) return `+${t}`
  return `${t}`
}

function trendClass(pillar: Pillar): string {
  const t = trend(pillar)
  if (t === null) return 'text-muted'
  if (t > 0) return 'text-success'
  if (t < -9) return 'text-danger'
  return 'text-warning'
}

function scoreColor(score: number | null): string {
  if (score == null) return '#4a4a6a'
  if (score >= 80) return '#00d4aa'
  if (score >= 50) return '#ffaa00'
  return '#ff4757'
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// Pro gate: only show full chart; free users see last 10
const { userId: uid } = useAuth()
// We don't have plan info here easily, so just show all data (Pro gating enforced server-side by take(90))

function goToScan(scanId: string) {
  router.push(`/results?id=${scanId}`)
}
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />

    <main class="max-w-5xl mx-auto px-4 py-12">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink to="/dashboard" class="text-sm text-muted hover:text-white transition-colors mb-3 inline-flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </NuxtLink>
        <h1 class="text-2xl font-display font-bold text-white mb-1">Score History</h1>
        <p class="text-sm text-muted font-mono truncate max-w-xl">{{ url || 'No URL specified' }}</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="card p-6 text-center">
        <p class="text-danger">{{ error }}</p>
      </div>

      <!-- No data -->
      <div v-else-if="!history.length" class="card p-12 text-center">
        <div class="text-4xl mb-4">📊</div>
        <p class="text-white font-semibold mb-2">No history yet</p>
        <p class="text-muted text-sm mb-6">Run a scan for this URL to start tracking score trends.</p>
        <NuxtLink to="/" class="btn-primary text-sm px-5 py-2">Scan Now</NuxtLink>
      </div>

      <template v-else>
        <!-- Pillar summary cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div
            v-for="pillar in pillars"
            :key="pillar"
            class="card p-3 text-center"
          >
            <div class="text-xs text-muted mb-1">{{ PILLAR_LABELS[pillar] }}</div>
            <div
              class="text-2xl font-display font-bold mb-1"
              :style="{ color: scoreColor(lastScore(pillar)) }"
            >
              {{ lastScore(pillar) ?? '—' }}
            </div>
            <div class="text-xs font-mono" :class="trendClass(pillar)">{{ trendLabel(pillar) }}</div>
            <TrendChart
              :data="series(pillar)"
              :color="PILLAR_COLORS[pillar]"
              :width="100"
              :height="28"
              class="mt-2 mx-auto"
            />
          </div>
        </div>

        <!-- Full overall trend chart -->
        <div class="card p-6 mb-8">
          <h2 class="text-sm font-semibold text-white mb-4">Overall Score — {{ history.length }} scans</h2>
          <TrendChart
            :data="series('overall')"
            color="#ec3586"
            :width="860"
            :height="80"
            :show-dots="true"
            :show-tooltip="true"
            class="w-full"
            style="width: 100%; height: 80px;"
          />
          <!-- X-axis labels -->
          <div class="flex justify-between mt-1 text-xs text-muted">
            <span>{{ formatDate(history[0].ts) }}</span>
            <span>{{ formatDate(history[history.length - 1].ts) }}</span>
          </div>
        </div>

        <!-- Per-pillar sparkline row -->
        <div class="card p-6 mb-8">
          <h2 class="text-sm font-semibold text-white mb-5">Pillar Trends</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="pillar in pillars.filter(p => p !== 'overall')"
              :key="`spark-${pillar}`"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-muted">{{ PILLAR_LABELS[pillar] }}</span>
                <span class="text-xs font-mono" :class="trendClass(pillar as Pillar)">{{ trendLabel(pillar as Pillar) }}</span>
              </div>
              <TrendChart
                :data="series(pillar as Pillar)"
                :color="PILLAR_COLORS[pillar]"
                :width="260"
                :height="40"
                style="width: 100%; height: 40px;"
              />
            </div>
          </div>
        </div>

        <!-- History table -->
        <div class="card overflow-hidden">
          <div class="px-6 py-4 border-b border-dark-border">
            <h2 class="text-sm font-semibold text-white">Scan Log</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-dark-border">
                  <th class="text-left px-4 py-3 text-xs text-muted font-medium">Date</th>
                  <th class="text-right px-3 py-3 text-xs text-muted font-medium">Overall</th>
                  <th class="text-right px-3 py-3 text-xs text-muted font-medium">Sec</th>
                  <th class="text-right px-3 py-3 text-xs text-muted font-medium">Perf</th>
                  <th class="text-right px-3 py-3 text-xs text-muted font-medium">SEO</th>
                  <th class="text-right px-3 py-3 text-xs text-muted font-medium">A11y</th>
                  <th class="text-right px-3 py-3 text-xs text-muted font-medium">AI</th>
                  <th class="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in [...history].reverse()"
                  :key="row._id"
                  class="border-b border-dark-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  @click="goToScan(row.scanId)"
                >
                  <td class="px-4 py-3">
                    <div class="text-white">{{ formatDate(row.ts) }}</div>
                    <div class="text-xs text-muted">{{ formatTime(row.ts) }}</div>
                  </td>
                  <td class="text-right px-3 py-3">
                    <span
                      class="font-mono font-semibold"
                      :style="{ color: scoreColor(row.overallScore) }"
                    >{{ row.overallScore ?? '—' }}</span>
                  </td>
                  <td class="text-right px-3 py-3 text-muted font-mono">{{ row.securityScore ?? '—' }}</td>
                  <td class="text-right px-3 py-3 text-muted font-mono">{{ row.performanceScore ?? '—' }}</td>
                  <td class="text-right px-3 py-3 text-muted font-mono">{{ row.seoScore ?? '—' }}</td>
                  <td class="text-right px-3 py-3 text-muted font-mono">{{ row.accessibilityScore ?? '—' }}</td>
                  <td class="text-right px-3 py-3 text-muted font-mono">{{ row.aiScore ?? '—' }}</td>
                  <td class="px-4 py-3 text-right">
                    <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
