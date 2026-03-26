<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Dashboard — ScanPulse' })

const { userId } = useAuth()
const { client, api } = useConvex()

const scans       = ref<any[]>([])
const convexUser  = ref<{ plan: 'free' | 'pro'; scanCount: number } | null>(null)
const loading     = ref(true)
const scanning    = ref(false)
const router      = useRouter()

async function loadUserData(id: string) {
  loading.value = true
  try {
    const [userScans, user] = await Promise.allSettled([
      client.query(api.scans.getScansByUser, { userId: id }),
      client.query(api.users.getUserByClerkId, { clerkId: id }),
    ])
    scans.value      = userScans.status === 'fulfilled' ? userScans.value : []
    convexUser.value = user.status === 'fulfilled' ? user.value : null
  } finally {
    loading.value = false
  }
}

// Watch userId so we load correctly even if Clerk hydrates after mount
watch(userId, id => { if (id) loadUserData(id) }, { immediate: true })

async function handleScan(url: string) {
  scanning.value = true
  await router.push(`/results?url=${encodeURIComponent(url)}`)
}

// ── Derived stats ──────────────────────────────────────
const doneScans    = computed(() => scans.value.filter(s => s.status === 'done'))
const avgScore     = computed(() => {
  if (!doneScans.value.length) return null
  const total = doneScans.value.reduce((sum, s) => sum + (s.overallScore ?? 0), 0)
  return Math.round(total / doneScans.value.length)
})
const bestScore    = computed(() => doneScans.value.length
  ? Math.max(...doneScans.value.map(s => s.overallScore ?? 0))
  : null
)

// ── Helpers ────────────────────────────────────────────
function scoreColor(score?: number) {
  if (score == null) return 'text-white/20'
  if (score >= 80)   return 'text-success'
  if (score >= 60)   return 'text-warning'
  return 'text-danger'
}

function scoreBg(score?: number) {
  if (score == null) return '#ffffff15'
  if (score >= 80)   return '#00d4aa'
  if (score >= 60)   return '#ffaa00'
  return '#ff4757'
}

function statusLabel(status: string) {
  return { pending: 'Queued', running: 'Scanning…', done: 'Complete', error: 'Failed' }[status] ?? status
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />

    <!-- Grid bg -->
    <div
      class="fixed inset-0 pointer-events-none z-0"
      style="background-image:
        linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),
        linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px);
        background-size:64px 64px"
    />

    <div class="relative z-10 max-w-5xl mx-auto px-8 pt-28 pb-24">

      <!-- ── Header ──────────────────────────────────────────── -->
      <div class="mb-12">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-7 h-px bg-primary" />
          <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">Overview</span>
        </div>

        <div class="flex items-end justify-between gap-8">
          <div class="flex items-center gap-4">
            <h1
              class="font-display font-bold text-white leading-none tracking-[-0.04em]"
              style="font-size: clamp(2.8rem, 5vw, 4rem)"
            >Dashboard</h1>

            <!-- Plan badge -->
            <div
              v-if="convexUser"
              class="plan-badge"
              :class="convexUser.plan === 'pro' ? 'plan-badge--pro' : 'plan-badge--free'"
            >
              <span v-if="convexUser.plan === 'pro'">Pro</span>
              <span v-else>{{ convexUser.scanCount }} / 10 free</span>
            </div>
          </div>

          <!-- Stat strip -->
          <div v-if="!loading" class="flex items-center gap-0 flex-shrink-0">
            <div class="stat-chip">
              <span class="stat-chip__value">{{ scans.length }}</span>
              <span class="stat-chip__label">Total scans</span>
            </div>
            <div class="w-px h-10 bg-white/[0.05]" />
            <div class="stat-chip">
              <span class="stat-chip__value" :class="avgScore != null ? scoreColor(avgScore) : 'text-white/20'">
                {{ avgScore ?? '—' }}
              </span>
              <span class="stat-chip__label">Avg score</span>
            </div>
            <div class="w-px h-10 bg-white/[0.05]" />
            <div class="stat-chip">
              <span class="stat-chip__value" :class="bestScore != null ? scoreColor(bestScore) : 'text-white/20'">
                {{ bestScore ?? '—' }}
              </span>
              <span class="stat-chip__label">Best score</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Scan input ──────────────────────────────────────── -->
      <div class="mb-12">
        <div class="scan-input-wrapper">
          <div class="absolute inset-0 rounded-2xl pointer-events-none" style="background: radial-gradient(ellipse at 50% 0%, rgba(236,53,134,0.05) 0%, transparent 70%)" />
          <div class="absolute top-0 left-0 right-0 h-px rounded-t-2xl" style="background: linear-gradient(90deg, transparent, rgba(236,53,134,0.4), transparent)" />

          <div class="relative z-10 px-8 pt-6 pb-7">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-1.5 h-1.5 rounded-full bg-primary" />
              <span class="text-[10px] font-display font-semibold tracking-[0.2em] uppercase text-primary">New scan</span>
            </div>
            <ScanInput @scan="handleScan" />
          </div>
        </div>
      </div>

      <!-- ── Scan history ────────────────────────────────────── -->
      <div>
        <!-- Section label -->
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <span class="text-[11px] font-display font-semibold tracking-[0.18em] uppercase text-white/30">Recent scans</span>
          </div>
          <span v-if="scans.length" class="text-[11px] font-body text-white/20">
            {{ scans.length }} scan{{ scans.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-[72px] rounded-xl bg-dark-surface animate-pulse" />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!scans.length"
          class="flex flex-col items-center justify-center py-24 border border-dashed border-white/[0.06] rounded-2xl"
          style="background: rgba(255,255,255,0.01)"
        >
          <Logo :animate="false" class="w-12 h-12 mb-5 opacity-20" />
          <p class="font-display font-semibold text-white/30 mb-1.5">No scans yet</p>
          <p class="text-white/20 text-sm font-body">Enter a URL above to scan your first site.</p>
        </div>

        <!-- Scan rows -->
        <div v-else class="space-y-2">
          <NuxtLink
            v-for="scan in scans"
            :key="scan._id"
            :to="`/results?scanId=${scan._id}`"
            class="scan-row group"
          >
            <!-- Left: status + domain -->
            <div class="flex items-center gap-4 min-w-0 flex-1">
              <!-- Status indicator -->
              <div class="flex-shrink-0 relative">
                <div
                  class="w-2 h-2 rounded-full"
                  :class="{
                    'bg-white/15':             scan.status === 'pending',
                    'bg-primary animate-pulse': scan.status === 'running',
                    'bg-success':              scan.status === 'done',
                    'bg-danger':               scan.status === 'error',
                  }"
                />
              </div>

              <!-- URL + meta -->
              <div class="min-w-0">
                <p class="font-display font-semibold text-[14px] text-white/75 group-hover:text-white transition-colors truncate">
                  {{ scan.url }}
                </p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span
                    class="text-[9px] font-display font-bold tracking-[0.14em] uppercase"
                    :class="{
                      'text-white/20':   scan.status === 'pending',
                      'text-primary':    scan.status === 'running',
                      'text-success/70': scan.status === 'done',
                      'text-danger/70':  scan.status === 'error',
                    }"
                  >{{ statusLabel(scan.status) }}</span>
                  <span v-if="scan._creationTime" class="text-white/20 text-[11px] font-body">
                    · {{ relativeTime(scan._creationTime) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: pillar scores + overall -->
            <div class="flex items-center gap-6 flex-shrink-0">
              <!-- Pillar scores -->
              <div v-if="scan.status === 'done'" class="hidden sm:flex items-center gap-5">
                <div v-for="[label, val, color] in [
                  ['SEC', scan.securityScore,    '#00d4aa'],
                  ['PRF', scan.performanceScore, '#ffaa00'],
                  ['SEO', scan.seoScore,         '#6c5ce7'],
                ]" :key="label" class="flex flex-col items-center gap-1.5">
                  <div class="pillar-bar-track">
                    <div class="pillar-bar-fill" :style="{ height: `${val ?? 0}%`, background: color }" />
                  </div>
                  <span class="text-[8px] font-display font-bold tracking-[0.12em] uppercase" :style="{ color }">{{ label }}</span>
                </div>
              </div>

              <!-- Overall score ring -->
              <div class="score-ring" :style="{ '--score-color': scoreBg(scan.overallScore) }">
                <svg viewBox="0 0 36 36" class="score-ring__svg">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2.5" />
                  <circle
                    v-if="scan.status === 'done' && scan.overallScore"
                    cx="18" cy="18" r="15"
                    fill="none"
                    :stroke="scoreBg(scan.overallScore)"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    :stroke-dasharray="`${(scan.overallScore / 100) * 94.25} 94.25`"
                    stroke-dashoffset="23.6"
                    style="transform: rotate(-90deg); transform-origin: 50% 50%"
                  />
                </svg>
                <span
                  class="score-ring__value"
                  :class="scan.status === 'done' ? scoreColor(scan.overallScore) : 'text-white/15'"
                >{{ scan.status === 'done' ? (scan.overallScore ?? '—') : '—' }}</span>
              </div>

              <!-- Chevron -->
              <svg class="w-3.5 h-3.5 text-white/15 group-hover:text-white/35 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Plan badge ──────────────────────────────────────── */
.plan-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 2px;
}
.plan-badge--free {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
}
.plan-badge--pro {
  background: rgba(236, 53, 134, 0.12);
  border: 1px solid rgba(236, 53, 134, 0.3);
  color: #ec3586;
}

/* ── Stat chips ──────────────────────────────────────── */
.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0 28px;
}
.stat-chip__value {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.6rem;
  line-height: 1;
  letter-spacing: -0.04em;
  color: white;
}
.stat-chip__label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
}

/* ── Scan input wrapper ───────────────────────────────── */
.scan-input-wrapper {
  position: relative;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  background: rgba(255,255,255,0.02);
  transition: border-color 0.2s ease;
}
.scan-input-wrapper:focus-within {
  border-color: rgba(236,53,134,0.25);
}

/* ── Scan rows ───────────────────────────────────────── */
.scan-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 14px;
  text-decoration: none;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.scan-row:hover {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.08);
}

/* ── Pillar mini bars ────────────────────────────────── */
.pillar-bar-track {
  width: 3px;
  height: 28px;
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.pillar-bar-fill {
  width: 100%;
  border-radius: 2px;
  transition: height 0.4s cubic-bezier(0.4,0,0.2,1);
}

/* ── Score ring ──────────────────────────────────────── */
.score-ring {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.score-ring__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.score-ring__value {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: -0.02em;
  position: relative;
  z-index: 1;
}
</style>
