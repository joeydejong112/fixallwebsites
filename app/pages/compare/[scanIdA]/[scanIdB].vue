<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Compare Results — ScanPulse' })

const route  = useRoute()
const router = useRouter()
const { client, api } = useConvex()

const scanIdA = computed(() => route.params.scanIdA as string)
const scanIdB = computed(() => route.params.scanIdB as string)

const scanA = ref<any>(null)
const scanB = ref<any>(null)
const loading = ref(true)
let pollInterval: ReturnType<typeof setInterval> | null = null

async function fetchBoth() {
  const [a, b] = await Promise.all([
    client.query(api.scans.getScan, { scanId: scanIdA.value as any }),
    client.query(api.scans.getScan, { scanId: scanIdB.value as any }),
  ])
  scanA.value = a
  scanB.value = b
  loading.value = false
}

const bothDone = computed(() => {
  const doneOrError = (s: any) => s?.status === 'done' || s?.status === 'error'
  return doneOrError(scanA.value) && doneOrError(scanB.value)
})

onMounted(() => {
  fetchBoth()
  pollInterval = setInterval(() => {
    if (bothDone.value) { clearInterval(pollInterval!); return }
    fetchBoth()
  }, 2500)
})

onUnmounted(() => { if (pollInterval) clearInterval(pollInterval) })

// ── Pillar definitions ───────────────────────────────────
const PILLARS = [
  { key: 'overallScore',       label: 'Overall',       color: '#ec3586' },
  { key: 'securityScore',      label: 'Security',      color: '#00d4aa' },
  { key: 'performanceScore',   label: 'Performance',   color: '#ffaa00' },
  { key: 'seoScore',           label: 'SEO',           color: '#6c5ce7' },
  { key: 'accessibilityScore', label: 'Accessibility', color: '#74b9ff' },
  { key: 'aiScore',            label: 'AI Readiness',  color: '#ff7675' },
  { key: 'dnsScore',           label: 'DNS',           color: '#a29bfe' },
  { key: 'trustScore',         label: 'Trust',         color: '#fd79a8' },
]

// Sorted by absolute delta descending (biggest gap = most opportunity)
const pillarRows = computed(() => {
  return PILLARS.map(p => {
    const a = scanA.value?.[p.key] ?? null
    const b = scanB.value?.[p.key] ?? null
    const delta = (a != null && b != null) ? a - b : null
    return { ...p, a, b, delta }
  })
    .filter(r => r.a != null || r.b != null)
    .sort((x, y) => Math.abs(y.delta ?? 0) - Math.abs(x.delta ?? 0))
})

// Overall delta
const overallDelta = computed(() => {
  const a = scanA.value?.overallScore
  const b = scanB.value?.overallScore
  if (a == null || b == null) return null
  return a - b
})

// ── Issue diff ───────────────────────────────────────────
function issueKey(issue: any) { return issue.pillar + ':' + issue.title }

const issuesBehind = computed(() => {
  if (!scanA.value?.issues || !scanB.value?.issues) return []
  const bSet = new Set(scanB.value.issues.map(issueKey))
  return scanA.value.issues.filter(
    (i: any) => (i.severity === 'critical' || i.severity === 'warning') && !bSet.has(issueKey(i))
  )
})

const issuesAhead = computed(() => {
  if (!scanA.value?.issues || !scanB.value?.issues) return []
  const aSet = new Set(scanA.value.issues.map(issueKey))
  return scanB.value.issues.filter(
    (i: any) => (i.severity === 'critical' || i.severity === 'warning') && !aSet.has(issueKey(i))
  )
})

// ── Helpers ──────────────────────────────────────────────
function scoreColor(v: number | null): string {
  if (v == null) return '#4a4a6a'
  if (v >= 80) return '#00d4aa'
  if (v >= 60) return '#ffaa00'
  return '#ff4757'
}

function deltaLabel(d: number | null): string {
  if (d == null) return '—'
  if (d > 0) return `+${d}`
  return `${d}`
}

function deltaClass(d: number | null): string {
  if (d == null) return 'text-muted'
  if (d > 0) return 'text-success'
  if (d < 0) return 'text-danger'
  return 'text-muted'
}

function hostname(url: string | undefined): string {
  if (!url) return '—'
  try { return new URL(url).hostname } catch { return url }
}

function statusLabel(s: any): string {
  if (!s) return 'Waiting…'
  return { pending: 'Queued', running: 'Scanning…', done: 'Done', error: 'Error' }[s.status as string] ?? s.status
}

function isRunning(s: any): boolean {
  return s?.status === 'pending' || s?.status === 'running'
}

function copyShareLink() {
  navigator.clipboard.writeText(window.location.href)
}

function printPdf() { window.print() }
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />

    <main class="max-w-4xl mx-auto px-4 py-12">
      <!-- Back link -->
      <NuxtLink to="/compare" class="text-sm text-muted hover:text-white transition-colors mb-6 inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        New comparison
      </NuxtLink>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>

      <template v-else>
        <!-- ── Hero: two score rings + delta ────────────────── -->
        <div class="card p-8 mb-6">
          <div class="flex items-center justify-between gap-4 flex-wrap">

            <!-- Site A -->
            <div class="flex flex-col items-center gap-3 flex-1 min-w-[140px]">
              <div class="text-xs text-muted font-mono truncate max-w-[160px]">{{ hostname(scanA?.url) }}</div>
              <div class="relative w-24 h-24">
                <svg viewBox="0 0 36 36" class="w-full h-full">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2.5" />
                  <circle
                    v-if="scanA?.status === 'done' && scanA?.overallScore"
                    cx="18" cy="18" r="15" fill="none"
                    :stroke="scoreColor(scanA.overallScore)"
                    stroke-width="2.5" stroke-linecap="round"
                    :stroke-dasharray="`${(scanA.overallScore / 100) * 94.25} 94.25`"
                    stroke-dashoffset="23.6"
                    style="transform: rotate(-90deg); transform-origin: 50% 50%"
                  />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    class="text-2xl font-display font-bold leading-none"
                    :style="{ color: scoreColor(scanA?.overallScore) }"
                  >{{ scanA?.status === 'done' ? (scanA?.overallScore ?? '—') : '—' }}</span>
                </div>
              </div>
              <span class="text-[9px] font-display font-bold tracking-[0.12em] uppercase px-2 py-1 rounded-full"
                :class="isRunning(scanA) ? 'bg-primary/10 text-primary animate-pulse' : scanA?.status === 'done' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'"
              >{{ statusLabel(scanA) }}</span>
              <span class="text-xs font-display font-semibold text-white/60">Your Site</span>
            </div>

            <!-- Delta badge (center) -->
            <div class="flex flex-col items-center gap-2">
              <div
                class="text-3xl font-display font-bold px-4 py-2 rounded-xl"
                :class="{
                  'bg-success/10 text-success': (overallDelta ?? 0) > 0,
                  'bg-danger/10 text-danger':   (overallDelta ?? 0) < 0,
                  'bg-white/5 text-muted':      overallDelta === 0 || overallDelta == null,
                }"
              >{{ deltaLabel(overallDelta) }}</div>
              <span class="text-[9px] text-muted tracking-widest uppercase">Overall</span>
            </div>

            <!-- Site B -->
            <div class="flex flex-col items-center gap-3 flex-1 min-w-[140px]">
              <div class="text-xs text-muted font-mono truncate max-w-[160px]">{{ hostname(scanB?.url) }}</div>
              <div class="relative w-24 h-24">
                <svg viewBox="0 0 36 36" class="w-full h-full">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2.5" />
                  <circle
                    v-if="scanB?.status === 'done' && scanB?.overallScore"
                    cx="18" cy="18" r="15" fill="none"
                    :stroke="scoreColor(scanB.overallScore)"
                    stroke-width="2.5" stroke-linecap="round"
                    :stroke-dasharray="`${(scanB.overallScore / 100) * 94.25} 94.25`"
                    stroke-dashoffset="23.6"
                    style="transform: rotate(-90deg); transform-origin: 50% 50%"
                  />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    class="text-2xl font-display font-bold leading-none"
                    :style="{ color: scoreColor(scanB?.overallScore) }"
                  >{{ scanB?.status === 'done' ? (scanB?.overallScore ?? '—') : '—' }}</span>
                </div>
              </div>
              <span class="text-[9px] font-display font-bold tracking-[0.12em] uppercase px-2 py-1 rounded-full"
                :class="isRunning(scanB) ? 'bg-primary/10 text-primary animate-pulse' : scanB?.status === 'done' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'"
              >{{ statusLabel(scanB) }}</span>
              <span class="text-xs font-display font-semibold text-white/40">Competitor</span>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="bothDone" class="flex items-center gap-3 mt-6 pt-5 border-t border-dark-border">
            <button @click="copyShareLink" class="btn-secondary text-sm flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Share
            </button>
            <button @click="printPdf" class="btn-ghost text-sm flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        <!-- ── Pillar comparison table ────────────────────── -->
        <div class="card overflow-hidden mb-6">
          <div class="px-6 py-4 border-b border-dark-border">
            <h2 class="text-sm font-semibold text-white">Pillar Comparison</h2>
            <p class="text-xs text-muted mt-0.5">Sorted by biggest gap — highest opportunity first</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-dark-border">
                  <th class="text-left px-5 py-3 text-xs text-muted font-medium">Pillar</th>
                  <th class="text-right px-4 py-3 text-xs text-muted font-medium">Your Site</th>
                  <th class="text-right px-4 py-3 text-xs text-muted font-medium">Competitor</th>
                  <th class="text-center px-4 py-3 text-xs text-muted font-medium">Delta</th>
                  <th class="text-center px-4 py-3 text-xs text-muted font-medium">Winner</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in pillarRows"
                  :key="row.key"
                  class="border-b border-dark-border last:border-0"
                >
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: row.color }" />
                      <span class="text-white/80 font-medium">{{ row.label }}</span>
                    </div>
                  </td>
                  <td class="text-right px-4 py-3">
                    <span class="font-mono font-semibold" :style="{ color: scoreColor(row.a) }">
                      {{ row.a ?? '—' }}
                    </span>
                  </td>
                  <td class="text-right px-4 py-3">
                    <span class="font-mono text-muted">{{ row.b ?? '—' }}</span>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span class="font-mono font-semibold text-sm" :class="deltaClass(row.delta)">
                      {{ deltaLabel(row.delta) }}
                    </span>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span
                      v-if="row.delta != null && row.delta !== 0"
                      class="text-[9px] font-display font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full"
                      :class="row.delta > 0 ? 'bg-success/10 text-success' : 'bg-white/5 text-muted'"
                    >{{ row.delta > 0 ? 'You' : 'Them' }}</span>
                    <span v-else-if="row.delta === 0" class="text-[9px] text-muted">Tie</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <template v-if="bothDone && scanA?.status === 'done' && scanB?.status === 'done'">

          <!-- ── Fix to catch up ──────────────────────────── -->
          <div v-if="issuesBehind.length" class="card p-6 mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 class="text-sm font-semibold text-white">Fix to catch up</h2>
                <p class="text-xs text-muted">Your site has these issues — competitor doesn't</p>
              </div>
            </div>
            <div class="space-y-2">
              <div
                v-for="issue in issuesBehind"
                :key="issue.pillar + issue.title"
                class="flex items-start gap-3 px-4 py-3 rounded-lg bg-danger/[0.04] border border-danger/[0.12]"
              >
                <span
                  class="text-[8px] font-display font-bold tracking-[0.12em] uppercase px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                  :class="issue.severity === 'critical' ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'"
                >{{ issue.severity }}</span>
                <div>
                  <p class="text-sm font-medium text-white/80">{{ issue.title }}</p>
                  <p class="text-xs text-muted mt-0.5">{{ issue.pillar }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Strengths (ahead) ────────────────────────── -->
          <div v-if="issuesAhead.length" class="card p-6 mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 class="text-sm font-semibold text-white">You're ahead here</h2>
                <p class="text-xs text-muted">Competitor has these issues — you don't</p>
              </div>
            </div>
            <div class="space-y-2">
              <div
                v-for="issue in issuesAhead"
                :key="issue.pillar + issue.title"
                class="flex items-start gap-3 px-4 py-3 rounded-lg bg-success/[0.04] border border-success/[0.12]"
              >
                <span
                  class="text-[8px] font-display font-bold tracking-[0.12em] uppercase px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                  :class="issue.severity === 'critical' ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'"
                >{{ issue.severity }}</span>
                <div>
                  <p class="text-sm font-medium text-white/80">{{ issue.title }}</p>
                  <p class="text-xs text-muted mt-0.5">{{ issue.pillar }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- No issues diff -->
          <div v-if="!issuesBehind.length && !issuesAhead.length" class="card p-8 text-center">
            <p class="text-white/60 text-sm">Both sites have similar issue profiles — no significant gaps found.</p>
          </div>

        </template>

        <!-- Still scanning -->
        <div v-else-if="!bothDone" class="card p-8 text-center">
          <div class="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
          <p class="text-white/60 text-sm">Scanning both sites simultaneously…</p>
        </div>

      </template>
    </main>
  </div>
</template>
