<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route  = useRoute()
const router = useRouter()
const { client, api } = useConvex()
const { userId } = useAuth()

const bulkScanId = route.params.id as string

const bulk  = ref<any>(null)
const scans = ref<any[]>([])
const loading = ref(true)
let pollInterval: ReturnType<typeof setInterval> | null = null

async function fetchData() {
  const result = await client.query(api.bulkScans.getBulkScanWithScans, { bulkScanId: bulkScanId as any })
  if (result) {
    bulk.value  = result.bulk
    scans.value = result.scans
  }
}

onMounted(async () => {
  await fetchData()
  loading.value = false

  if (bulk.value?.status === 'running' || bulk.value?.status === 'pending') {
    pollInterval = setInterval(async () => {
      await fetchData()
      if (bulk.value?.status === 'done' || bulk.value?.status === 'error') {
        clearInterval(pollInterval!)
      }
    }, 2500)
  }
})

onUnmounted(() => { if (pollInterval) clearInterval(pollInterval) })

// ── Sorting ────────────────────────────────────────────────────────────────────
type SortKey = 'url' | 'overallScore' | 'securityScore' | 'performanceScore' | 'seoScore' | 'accessibilityScore' | 'aiScore' | 'dnsScore' | 'trustScore' | 'status'
const sortKey = ref<SortKey>('overallScore')
const sortDir = ref<'asc' | 'desc'>('asc')

function setSort(key: SortKey) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

const sortedScans = computed(() => {
  const arr = [...scans.value]
  arr.sort((a, b) => {
    const av = a[sortKey.value] ?? (sortKey.value === 'url' ? '' : -1)
    const bv = b[sortKey.value] ?? (sortKey.value === 'url' ? '' : -1)
    if (av < bv) return sortDir.value === 'asc' ? -1 : 1
    if (av > bv) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
  return arr
})

// ── Score helpers ──────────────────────────────────────────────────────────────
function scoreColor(s?: number) {
  if (s == null) return 'text-white/25'
  if (s >= 80) return 'text-success'
  if (s >= 60) return 'text-warning'
  return 'text-danger'
}

function scoreBg(s?: number) {
  if (s == null) return 'transparent'
  if (s >= 80) return 'rgba(0,212,170,0.08)'
  if (s >= 60) return 'rgba(255,170,0,0.08)'
  return 'rgba(255,71,87,0.08)'
}

// ── Progress ──────────────────────────────────────────────────────────────────
const progress = computed(() => {
  if (!bulk.value) return 0
  return Math.round((bulk.value.completedUrls / bulk.value.totalUrls) * 100)
})

const startTime = ref(Date.now())
const elapsedSecs = ref(0)
let elapsedTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  elapsedTimer = setInterval(() => { elapsedSecs.value = Math.floor((Date.now() - startTime.value) / 1000) }, 1000)
})
onUnmounted(() => { if (elapsedTimer) clearInterval(elapsedTimer) })

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

const estRemaining = computed(() => {
  if (!bulk.value || bulk.value.completedUrls === 0) return null
  const rate = elapsedSecs.value / bulk.value.completedUrls
  const remaining = Math.round(rate * (bulk.value.totalUrls - bulk.value.completedUrls))
  return remaining > 0 ? fmtTime(remaining) : null
})

// ── CSV export ────────────────────────────────────────────────────────────────
import { exportBulkCsv } from '~/utils/exportBulkCsv'

function doExport() {
  const name = (bulk.value?.name ?? 'scanpulse-bulk').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  exportBulkCsv(scans.value, `${name}-${new Date().toISOString().slice(0, 10)}`)
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deleting = ref(false)
async function deleteScan() {
  if (!userId.value || !confirm('Delete this bulk scan? Child scan results are kept in your history.')) return
  deleting.value = true
  await client.mutation(api.bulkScans.deleteBulkScan, { bulkScanId: bulkScanId as any, userId: userId.value })
  router.push('/dashboard')
}

const columns: { key: SortKey; label: string; short: string }[] = [
  { key: 'url',               label: 'URL',           short: 'URL' },
  { key: 'overallScore',      label: 'Overall',       short: 'All' },
  { key: 'securityScore',     label: 'Security',      short: 'Sec' },
  { key: 'performanceScore',  label: 'Performance',   short: 'Perf' },
  { key: 'seoScore',          label: 'SEO',           short: 'SEO' },
  { key: 'accessibilityScore',label: 'A11y',          short: 'A11y' },
  { key: 'aiScore',           label: 'AI',            short: 'AI' },
  { key: 'dnsScore',          label: 'DNS',           short: 'DNS' },
  { key: 'trustScore',        label: 'Trust',         short: 'Trust' },
  { key: 'status',            label: 'Status',        short: 'Status' },
]
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />
    <div class="fixed inset-0 pointer-events-none z-0" style="background-image: linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px); background-size:64px 64px" />

    <div class="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-24">

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center min-h-64">
        <div class="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>

      <!-- Not found -->
      <div v-else-if="!bulk" class="text-center py-20 text-white/40 font-body">Bulk scan not found.</div>

      <template v-else>

        <!-- Header row -->
        <div class="flex items-start justify-between gap-6 mb-8 flex-wrap">
          <div>
            <NuxtLink to="/dashboard" class="inline-flex items-center gap-2 text-white/25 hover:text-white/55 transition-colors group mb-4">
              <svg class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              <span class="text-[10px] font-display font-semibold tracking-[0.16em] uppercase">Dashboard</span>
            </NuxtLink>
            <h1 class="font-display font-bold text-white text-2xl tracking-tight mb-1">{{ bulk.name }}</h1>
            <p class="text-white/40 font-body text-sm">{{ bulk.totalUrls }} URLs · {{ bulk.completedUrls }} complete<span v-if="bulk.errorCount"> · <span class="text-danger">{{ bulk.errorCount }} errors</span></span></p>
          </div>

          <div class="flex items-center gap-2.5 print:hidden">
            <button
              v-if="scans.some((s: any) => s.status === 'done')"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-colors text-white/50 hover:text-white text-xs font-display font-medium"
              @click="doExport"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Export CSV
            </button>
            <button
              class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-danger/8 hover:bg-danger/15 border border-danger/15 transition-colors text-danger/70 hover:text-danger text-xs font-display font-medium"
              :disabled="deleting"
              @click="deleteScan"
            >Delete</button>
          </div>
        </div>

        <!-- Progress section (while running) -->
        <div v-if="bulk.status === 'running' || bulk.status === 'pending'" class="mb-8 p-5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span class="text-white/70 font-display font-semibold text-sm">Scanning…</span>
            </div>
            <div class="flex items-center gap-4 text-[11px] font-body text-white/35">
              <span>{{ bulk.completedUrls }} / {{ bulk.totalUrls }}</span>
              <span>{{ fmtTime(elapsedSecs) }} elapsed</span>
              <span v-if="estRemaining">~{{ estRemaining }} remaining</span>
            </div>
          </div>
          <div class="h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              style="background: linear-gradient(90deg, #ec3586, #ff7675)"
              :style="{ width: progress + '%' }"
            />
          </div>
          <p class="text-white/25 font-body text-[11px] mt-2">{{ progress }}% complete</p>
        </div>

        <!-- Done summary strip -->
        <div v-if="bulk.status === 'done'" class="mb-8 flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/15">
          <svg class="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          <span class="text-success text-sm font-display font-semibold">Scan complete</span>
          <span class="text-white/35 text-xs font-body">· {{ bulk.totalUrls }} URLs scanned</span>
          <span v-if="bulk.errorCount" class="text-danger text-xs font-body">· {{ bulk.errorCount }} failed</span>
        </div>

        <!-- Results table -->
        <div class="overflow-x-auto rounded-xl border border-white/[0.05]">
          <table class="w-full min-w-[900px] border-collapse">
            <thead>
              <tr class="border-b border-white/[0.05]">
                <th
                  v-for="col in columns"
                  :key="col.key"
                  class="th"
                  :class="sortKey === col.key ? 'th--active' : ''"
                  @click="setSort(col.key)"
                >
                  <span class="hidden sm:inline">{{ col.label }}</span>
                  <span class="sm:hidden">{{ col.short }}</span>
                  <svg v-if="sortKey === col.key" class="w-3 h-3 inline ml-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"/>
                  </svg>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="scan in sortedScans"
                :key="scan._id"
                class="result-row"
                @click="scan.status === 'done' && $router.push(`/results?scanId=${scan._id}`)"
                :class="scan.status === 'done' ? 'cursor-pointer' : ''"
              >
                <!-- URL -->
                <td class="td td--url">
                  <span class="text-white/70 text-xs font-body truncate block max-w-[240px]">{{ scan.url }}</span>
                </td>

                <!-- Score cells -->
                <td
                  v-for="col in columns.slice(1, 9)"
                  :key="col.key"
                  class="td td--score"
                  :style="{ background: scoreBg(scan[col.key]) }"
                >
                  <span
                    v-if="scan.status === 'done' || scan.status === 'error'"
                    class="font-display font-bold text-sm"
                    :class="scoreColor(scan[col.key])"
                  >{{ scan[col.key] ?? (scan.status === 'error' ? '—' : '—') }}</span>
                  <div v-else class="skeleton" />
                </td>

                <!-- Status -->
                <td class="td">
                  <span class="status-badge" :class="`status-badge--${scan.status}`">{{ scan.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="bulk.status === 'done' || bulk.status === 'running'" class="text-white/25 text-xs font-body mt-3">
          Click any completed row to view the full report.
        </p>

      </template>
    </div>
  </div>
</template>

<style scoped>
.th {
  padding: 10px 14px;
  text-align: left;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.30);
  background: rgba(255,255,255,0.02);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition: color 0.12s;
}
.th:hover { color: rgba(255,255,255,0.55); }
.th--active { color: rgba(255,255,255,0.65); }

.td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  vertical-align: middle;
}
.td--url { min-width: 200px; }
.td--score { text-align: center; min-width: 52px; }

.result-row { transition: background 0.12s; }
.result-row:hover { background: rgba(255,255,255,0.025); }
.result-row:last-child td { border-bottom: none; }

.skeleton {
  height: 14px;
  width: 28px;
  border-radius: 4px;
  background: rgba(255,255,255,0.05);
  animation: pulse 1.6s ease-in-out infinite;
  margin: 0 auto;
}
@keyframes pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 0.9 } }

.status-badge {
  display: inline-block;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 20px;
}
.status-badge--done    { background: rgba(0,212,170,0.1);  color: #00d4aa; }
.status-badge--running { background: rgba(236,53,134,0.1); color: #ec3586; }
.status-badge--pending { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); }
.status-badge--error   { background: rgba(255,71,87,0.1);  color: #ff4757; }
</style>
