<script setup lang="ts">
import type { Id } from '~~/convex/_generated/dataModel'
import { useAppToast } from '~/composables/useAppToast'
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Dashboard — ScanPulse' })

const { userId } = useAuth()
const { client, api } = useConvex()
const { client: wsClient } = useConvexWs()
const { toast, confirm } = useAppToast()

const scans       = ref<any[]>([])
const monitors    = ref<any[]>([])
const convexUser  = ref<{ plan: 'free' | 'pro'; scanCount: number } | null>(null)
const loading     = ref(true)
const scanning    = ref(false)
const filterStatus = ref<'all' | 'pass' | 'warning' | 'critical'>('all')
const router      = useRouter()
let unsubscribeScans: (() => void) | null = null
let unsubscribeMonitors: (() => void) | null = null

async function loadUserData(id: string) {
  loading.value = true
  try {
    const [userScans, user, userMonitors] = await Promise.allSettled([
      client.query(api.scans.getScansByUser, { userId: id }),
      client.query(api.users.getUserByClerkId, { clerkId: id }),
      client.query(api.monitors.getMonitors, { userId: id })
    ])
    scans.value      = userScans.status === 'fulfilled' ? userScans.value : []
    convexUser.value = user.status === 'fulfilled' ? user.value : null
    monitors.value   = userMonitors.status === 'fulfilled' ? userMonitors.value : []

    if (wsClient) {
      if (unsubscribeScans) unsubscribeScans()
      if (unsubscribeMonitors) unsubscribeMonitors()
      
      unsubscribeScans = wsClient.onUpdate(
        api.scans.getScansByUser,
        { userId: id },
        (updatedScans) => { scans.value = updatedScans }
      )
      
      unsubscribeMonitors = wsClient.onUpdate(
        api.monitors.getMonitors,
        { userId: id },
        (updated) => { monitors.value = updated }
      )
    }
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (unsubscribeScans) unsubscribeScans()
  if (unsubscribeMonitors) unsubscribeMonitors()
})

// Watch userId so we load correctly even if Clerk hydrates after mount
watch(userId, id => { if (id) loadUserData(id) }, { immediate: true })

async function handleScan(url: string) {
  scanning.value = true
  await router.push(`/results?url=${encodeURIComponent(url)}`)
}

async function deleteScan(scanId: Id<'scans'>, e: Event) {
  e.preventDefault()
  const ok = await confirm({ message: 'This scan will be permanently removed from your history.', confirmLabel: 'Delete', cancelLabel: 'Keep' })
  if (!ok) return
  await client.mutation(api.scans.deleteScan, { scanId, userId: userId.value! })
  if (!wsClient) {
    scans.value = scans.value.filter(s => s._id !== scanId)
  }
}

async function reScan(url: string, e: Event) {
  e.preventDefault()
  await handleScan(url)
}

async function toggleMonitor(url: string, e: Event) {
  e.preventDefault()
  if (convexUser.value?.plan !== 'pro') {
    toast.warning('Monitoring is a Pro feature. Upgrade to watch your sites automatically.')
    return
  }
  
  const existing = monitors.value.find(m => m.url === url)
  if (existing) {
    const ok = await confirm({ message: `Stop monitoring ${url}?`, confirmLabel: 'Stop', cancelLabel: 'Keep' })
    if (ok) {
      await client.mutation(api.monitors.removeMonitor, { monitorId: existing._id, userId: userId.value! })
      toast.info(`Stopped monitoring ${url}`)
    }
  } else {
    await client.mutation(api.monitors.addMonitor, { userId: userId.value!, url, frequency: 'daily' })
    toast.success(`Started monitoring ${url} daily!`)
  }
}

function isMonitored(url: string) {
  return monitors.value.some(m => m.url === url && m.isActive)
}

// ── Monitored sites helpers ────────────────────────────
function scoreTrend(url: string): '↑' | '↓' | '→' | null {
  const urlScans = scans.value
    .filter(s => s.url === url && s.status === 'done' && s.overallScore != null)
    .sort((a, b) => b._creationTime - a._creationTime)
  if (urlScans.length < 2) return null
  const diff = urlScans[0].overallScore - urlScans[1].overallScore
  if (diff > 2) return '↑'
  if (diff < -2) return '↓'
  return '→'
}

function trendColor(trend: string | null) {
  if (trend === '↑') return '#00d4aa'
  if (trend === '↓') return '#ff4757'
  return 'rgba(255,255,255,0.3)'
}

function faviconUrl(url: string) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch { return null }
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

const filteredScans = computed(() => {
  if (filterStatus.value === 'all') return scans.value
  return scans.value.filter(s => {
    const score = s.overallScore ?? 0
    if (filterStatus.value === 'pass') return s.status === 'done' && score >= 80
    if (filterStatus.value === 'warning') return s.status === 'done' && score >= 60 && score < 80
    if (filterStatus.value === 'critical') return s.status === 'error' || (s.status === 'done' && score < 60)
    return true
  })
})

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
              <span v-else>{{ convexUser.scanCount }} / 1 free</span>
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

      <!-- ── Monitored Sites Widget ───────────────────────────── -->
      <div class="mb-12">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <div class="w-7 h-px bg-primary" />
            <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">Monitored Sites</span>
          </div>
          <span class="font-body text-white/42 text-[12px]">{{ monitors.length }} active</span>
        </div>

        <!-- Empty state -->
        <div
          v-if="!monitors.length"
          class="flex flex-col items-center justify-center py-12 border border-dashed border-white/[0.06] rounded-2xl"
          style="background:rgba(255,255,255,0.01)"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          <p class="font-display font-semibold text-white/48 text-[14px] mb-1">No sites monitored yet</p>
          <p class="font-body text-white/38 text-[13px]">Scan a site and toggle the Watch button to start monitoring.</p>
        </div>

        <!-- Monitor cards -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="m in monitors"
            :key="m._id"
            class="monitor-card group"
          >
            <!-- Top accent line in score color -->
            <div class="h-[2px] rounded-t-xl mb-4 -mx-5 -mt-5 px-5 pt-5"
              :style="{ background: scoreBg(m.lastScore) }" />

            <!-- URL row -->
            <div class="flex items-center gap-3 mb-4">
              <img
                v-if="faviconUrl(m.url)"
                :src="faviconUrl(m.url)!"
                class="w-5 h-5 rounded shrink-0 opacity-80"
                :alt="m.url"
                @error="($event.target as HTMLImageElement).style.display='none'"
              />
              <span class="font-display font-semibold text-white/85 text-[13px] truncate flex-1">{{ m.url }}</span>
            </div>

            <!-- Score + trend -->
            <div class="flex items-end justify-between mb-4">
              <div>
                <div class="font-body text-white/45 text-[10px] uppercase tracking-[0.14em] mb-1">Overall score</div>
                <div class="flex items-baseline gap-2">
                  <span
                    class="font-display font-bold leading-none"
                    style="font-size:2rem;letter-spacing:-0.04em"
                    :class="scoreColor(m.lastScore)"
                  >{{ m.lastScore ?? '—' }}</span>
                  <span
                    v-if="scoreTrend(m.url)"
                    class="font-display font-bold text-lg"
                    :style="{ color: trendColor(scoreTrend(m.url)) }"
                  >{{ scoreTrend(m.url) }}</span>
                </div>
              </div>

              <!-- Frequency badge -->
              <span class="px-2.5 py-1 rounded-full font-display font-semibold text-[10px] tracking-[0.1em] uppercase bg-white/[0.05] text-white/35 border border-white/[0.07]">
                {{ m.frequency }}
              </span>
            </div>

            <!-- Last checked + actions -->
            <div class="flex items-center justify-between pt-3 border-t border-white/[0.05]">
              <span class="font-body text-white/45 text-[12px]">
                {{ m.lastRunTime ? 'Checked ' + relativeTime(m.lastRunTime) : 'Not yet checked' }}
              </span>
              <div class="flex items-center gap-2">
                <NuxtLink
                  :to="`/results?url=${encodeURIComponent(m.url)}`"
                  class="font-body text-white/52 hover:text-white/80 text-[12px] transition-colors"
                >View →</NuxtLink>
                <button
                  class="font-body text-white/20 hover:text-danger text-[12px] transition-colors opacity-0 group-hover:opacity-100"
                  @click.prevent="(e) => toggleMonitor(m.url, e)"
                >Stop</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Scan history ────────────────────────────────────── -->
      <div>
        <!-- Section label & Filter -->
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <span class="text-[11px] font-display font-semibold tracking-[0.18em] uppercase text-white/50 hidden sm:inline-block">Recent scans</span>
          </div>
          
          <div class="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.04]">
            <button
              v-for="f in ['all', 'pass', 'warning', 'critical']"
              :key="f"
              @click="filterStatus = f as any"
              class="px-3 py-1.5 rounded-md text-[11px] font-display font-semibold tracking-[0.1em] uppercase transition-colors"
              :class="filterStatus === f ? 'bg-primary text-white shadow-sm' : 'text-white/55 hover:text-white/85'"
            >
              {{ f }}
            </button>
          </div>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-[72px] rounded-xl bg-dark-surface animate-pulse" />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!filteredScans.length"
          class="flex flex-col items-center justify-center py-24 border border-dashed border-white/[0.06] rounded-2xl"
          style="background: rgba(255,255,255,0.01)"
        >
          <Logo :animate="false" class="w-12 h-12 mb-5 opacity-20" />
          <p class="font-display font-semibold text-white/50 mb-1.5">No scans found</p>
          <p v-if="scans.length" class="text-white/40 text-sm font-body">No scans match the current filter.</p>
          <p v-else class="text-white/40 text-sm font-body">Enter a URL above to scan your first site.</p>
          <button v-if="scans.length" @click="filterStatus = 'all'" class="mt-4 text-[12px] font-display text-primary hover:text-primary-hover">
            Clear filter
          </button>
        </div>

        <!-- Scan rows -->
        <div v-else class="space-y-2">
          <NuxtLink
            v-for="scan in filteredScans"
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
                  <span v-if="scan._creationTime" class="text-white/40 text-[11px] font-body">
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

              <!-- Hover Actions -->
              <div class="hidden group-hover:flex items-center gap-2 mr-2">
                <button
                  v-if="scan.status === 'done'"
                  @click.prevent="(e) => toggleMonitor(scan.url, e)"
                  class="p-2 rounded-md transition-colors group/btn relative"
                  :class="isMonitored(scan.url) ? 'text-primary hover:bg-primary/20' : 'text-white/40 hover:text-white hover:bg-white/10'"
                  :title="isMonitored(scan.url) ? 'Stop watching' : 'Watch this site'"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-if="!isMonitored(scan.url)">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" v-else>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.88-11.71L10 14.17l-1.88-1.88a.996.996 0 10-1.41 1.41l2.59 2.59c.39.39 1.02.39 1.41 0L17.3 9.7a.996.996 0 10-1.41-1.41z"/>
                  </svg>
                </button>
                <button
                  @click.prevent="(e) => reScan(scan.url, e)"
                  class="p-2 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors group/btn relative"
                  title="Scan again"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  @click.prevent="(e) => deleteScan(scan._id, e)"
                  class="p-2 rounded-md hover:bg-danger/20 text-white/40 hover:text-danger transition-colors group/btn relative"
                  title="Delete scan"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <!-- Chevron -->
              <svg class="w-3.5 h-3.5 text-white/15 group-hover:text-white/35 transition-colors hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  color: rgba(255,255,255,0.45);
}

/* ── Monitor card ────────────────────────────────────── */
.monitor-card {
  padding: 20px;
  border-radius: 14px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  transition: border-color 0.15s ease, background 0.15s ease;
  overflow: hidden;
}
.monitor-card:hover {
  background: rgba(255,255,255,0.035);
  border-color: rgba(255,255,255,0.09);
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
