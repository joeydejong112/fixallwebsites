<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useSeoMeta({ title: 'Dashboard — ScanPulse' })

const { userId } = useAuth()
const { client, api } = useConvex()

const scans = ref<any[]>([])
const loading = ref(true)
const scanning = ref(false)

onMounted(async () => {
  if (!userId.value) return
  try {
    scans.value = await client.query(api.scans.getScansByUser, { userId: userId.value })
  }
  catch {
    scans.value = []
  }
  finally {
    loading.value = false
  }
})

const router = useRouter()

async function handleScan(url: string) {
  scanning.value = true
  await router.push(`/results?url=${encodeURIComponent(url)}`)
}

function scoreColor(score?: number) {
  if (score === undefined) return 'text-white/30'
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-warning'
  return 'text-danger'
}

function statusLabel(status: string) {
  return { pending: 'Queued', running: 'Scanning…', done: 'Complete', error: 'Failed' }[status] ?? status
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />

    <div class="max-w-5xl mx-auto px-6 pt-28 pb-20">

      <!-- Header -->
      <div class="mb-12 pb-8 border-b border-dark-border">
        <p class="text-primary text-[10px] font-display uppercase tracking-[0.18em] mb-3">Overview</p>
        <h1 class="font-display font-bold text-white leading-none mb-2" style="font-size: clamp(2.8rem, 6vw, 4.5rem)">Dashboard</h1>
        <p class="text-white/30 font-body text-sm">Your scan history and results</p>
      </div>

      <!-- Scan input -->
      <div class="mb-12">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-0.5 h-4 bg-primary rounded-full" />
          <span class="text-white/30 text-[10px] font-display uppercase tracking-[0.18em]">New scan</span>
        </div>
        <ScanInput @scan="handleScan" />
      </div>

      <!-- Scans list -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <p class="text-white/50 text-xs font-display uppercase tracking-widest">Recent scans</p>
          <p v-if="scans.length" class="text-white/25 text-xs font-body">{{ scans.length }} scan{{ scans.length !== 1 ? 's' : '' }}</p>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 3" :key="i" class="h-16 rounded-xl bg-dark-surface animate-pulse" />
        </div>

        <!-- Empty state -->
        <div v-else-if="!scans.length" class="py-20 text-center border border-dark-border border-dashed rounded-card">
          <Logo :animate="false" class="w-10 h-10 mx-auto mb-4 opacity-30" />
          <p class="font-display font-medium text-white/40 mb-1">No scans yet</p>
          <p class="text-white/25 text-sm font-body">Enter a URL above to scan your first site.</p>
        </div>

        <!-- Table -->
        <div v-else class="divide-y divide-dark-border border border-dark-border rounded-card overflow-hidden">
          <NuxtLink
            v-for="scan in scans"
            :key="scan._id"
            :to="`/results?scanId=${scan._id}`"
            class="flex items-center justify-between px-5 py-4 bg-dark-surface hover:bg-dark-elevated transition-colors group"
          >
            <div class="flex items-center gap-4 min-w-0">
              <!-- Status dot -->
              <div
                class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                :class="{
                  'bg-white/20': scan.status === 'pending',
                  'bg-primary animate-pulse': scan.status === 'running',
                  'bg-success': scan.status === 'done',
                  'bg-danger': scan.status === 'error',
                }"
              />
              <div class="min-w-0">
                <p class="font-display font-medium text-white/80 group-hover:text-white text-sm truncate transition-colors">
                  {{ scan.url }}
                </p>
                <p class="text-white/25 text-xs font-body mt-0.5">
                  {{ statusLabel(scan.status) }}
                  <template v-if="scan._creationTime"> · {{ relativeTime(scan._creationTime) }}</template>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-6 flex-shrink-0 ml-4">
              <div v-if="scan.status === 'done'" class="hidden sm:flex items-center gap-5">
                <div class="text-right">
                  <p class="text-[9px] font-display uppercase tracking-[0.14em] text-security/50 mb-1">Sec</p>
                  <p class="font-display font-bold text-base leading-none" :class="scoreColor(scan.securityScore)">{{ scan.securityScore ?? '—' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[9px] font-display uppercase tracking-[0.14em] text-performance/50 mb-1">Perf</p>
                  <p class="font-display font-bold text-base leading-none" :class="scoreColor(scan.performanceScore)">{{ scan.performanceScore ?? '—' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[9px] font-display uppercase tracking-[0.14em] text-seo/50 mb-1">SEO</p>
                  <p class="font-display font-bold text-base leading-none" :class="scoreColor(scan.seoScore)">{{ scan.seoScore ?? '—' }}</p>
                </div>
              </div>
              <div class="text-right w-12">
                <p class="text-[9px] font-display uppercase tracking-[0.14em] text-white/20 mb-1">Score</p>
                <p
                  class="font-display font-bold leading-none"
                  style="font-size: 1.6rem"
                  :class="scan.status === 'done' ? scoreColor(scan.overallScore) : 'text-white/15'"
                >{{ scan.status === 'done' ? (scan.overallScore ?? '—') : '—' }}</p>
              </div>
              <svg class="w-4 h-4 text-white/15 group-hover:text-white/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
