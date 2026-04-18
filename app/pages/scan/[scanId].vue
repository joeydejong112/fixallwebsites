<script setup lang="ts">
import type { PillarKey } from '~/types/scanpulse'
import { useConvex } from '~/composables/useConvex'
import { adaptScan } from '~/composables/adapters/adaptScan'
import { STATIC_PILLARS } from '~/types/scanpulse'
import type { Scan } from '~/types/scanpulse'

definePageMeta({ layout: 'app' })
useSeoMeta({ title: 'Scan Result — ScanPulse' })

const route = useRoute()
const router = useRouter()
const scanId = computed(() => route.params.scanId as string)

// ─── Filter state ─────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'crit' | 'warn' | 'pass'
const filter = ref<StatusFilter>('all')
const pillarFilter = ref<PillarKey | null>(null)

// ─── Data layer ────────────────────────────────────────────────────────────
const pillars = useScanpulsePillars()
const scanIdRef = ref<string | null>(scanId.value)
const issuesData = useScanpulseIssues(scanIdRef)
const { client, api } = useConvex()

// ─── Local scan state (for polling) ───────────────────────────────────────
const localScan = ref<Scan | null>(null)
const scanStatus = ref<'pending' | 'running' | 'done' | 'error'>('pending')
const errorMessage = ref<string | null>(null)

// ─── Derived issue counts ─────────────────────────────────────────────────
const issueCounts = computed(() => {
  const issues = issuesData.value
  let critical = 0, warn = 0, pass = 0
  for (const key of Object.keys(issues) as PillarKey[]) {
    for (const iss of issues[key]) {
      if (iss.status === 'crit') critical++
      else if (iss.status === 'warn') warn++
      else pass++
    }
  }
  return { critical, warn, pass }
})

const totalChecks = computed(() =>
  issueCounts.value.critical + issueCounts.value.warn + issueCounts.value.pass
)

// ─── Polling ──────────────────────────────────────────────────────────────
let pollInterval: ReturnType<typeof setInterval> | null = null

async function fetchScanStatus() {
  if (!client) return
  try {
    const row = await client.query(api.scans.getScan, { scanId: scanId.value as any })
    if (!row) return

    scanStatus.value = row.status as typeof scanStatus.value
    errorMessage.value = row.errorMessage ?? null

    if (row.status === 'done') {
      localScan.value = adaptScan(row as any)
      stopPolling()
    } else if (row.status === 'error') {
      stopPolling()
    }
  } catch (e) {
    console.error('Poll error', e)
  }
}

function startPolling() {
  stopPolling()
  pollInterval = setInterval(fetchScanStatus, 2000)
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onMounted(() => {
  scanIdRef.value = scanId.value
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

// ─── Actions ──────────────────────────────────────────────────────────────
function handleRescan() {
  router.push('/')
}

function handleShare() {
  const url = `${window.location.origin}/share/${scanId.value}`
  navigator.clipboard.writeText(url)
}

function handleExport() {
  // PDF export — TODO
}

function handleOpenTool(toolId: string) {
  router.push(`/tools/${toolId}`)
}

// ─── Skeleton animation ────────────────────────────────────────────────────
const skeletonProgress = ref(0)
onMounted(async () => {
  const anime = (await import('animejs')).default
  anime({
    targets: skeletonProgress,
    value: [0, 100],
    duration: 2000,
    easing: 'easeInOutQuad',
    loop: true,
    direction: 'alternate',
  })
})
</script>

<template>
  <main
    :style="{
      flex: 1,
      padding: '32px 40px 60px',
      background: 'var(--canvas)',
      overflow: 'hidden',
      position: 'relative',
    }"
  >
    <!-- Grid background -->
    <div class="grid-bg" :style="{ position: 'absolute', inset: 0, opacity: 0.4 }" />

    <div style="position: relative; display: flex; flex-direction: column; gap: 24px;">

      <!-- ── PENDING / RUNNING SKELETON ─────────────────────────────── -->
      <template v-if="scanStatus === 'pending' || scanStatus === 'running'">
        <div class="card" style="padding: 28px 32px; position: relative;">
          <div class="card-accent-top" style="background: linear-gradient(to right, var(--brand), transparent);" />

          <div style="display: flex; align-items: center; gap: 32px;">
            <!-- Spinning ring -->
            <div
              style="
                width: 140px;
                height: 140px;
                border-radius: 50%;
                border: 10px solid var(--elevated-2);
                border-top-color: var(--brand);
                animation: spin 1.2s linear infinite;
                flex-shrink: 0;
              "
            />
            <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
              <div class="skeleton-line" style="width: 200px; height: 20px;" />
              <div class="skeleton-line" style="width: 120px; height: 14px;" />
              <div style="display: flex; gap: 24px; margin-top: 8px;">
                <div class="skeleton-line" style="width: 60px; height: 40px;" />
                <div class="skeleton-line" style="width: 60px; height: 40px;" />
                <div class="skeleton-line" style="width: 60px; height: 40px;" />
              </div>
            </div>
          </div>

          <!-- Pillar progress bars -->
          <div style="display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap;">
            <div
              v-for="p in STATIC_PILLARS"
              :key="p.key"
              style="flex: 1; min-width: 80px;"
            >
              <div
                :style="{
                  fontSize: 9,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                }"
              >
                {{ p.label.split(' ')[0] }}
              </div>
              <div
                style="
                  height: 6px;
                  background: var(--elevated-2);
                  border-radius: 999px;
                  overflow: hidden;
                "
              >
                <div
                  :style="{
                    height: '100%',
                    width: skeletonProgress + '%',
                    background: p.color,
                    borderRadius: 999,
                    transition: 'background 0.2s',
                  }"
                />
              </div>
            </div>
          </div>

          <div style="margin-top: 16px; text-align: center;">
            <div style="font-family: var(--font-display); font-size: 14px; color: var(--text-muted);">
              {{ scanStatus === 'pending' ? 'Waiting in queue...' : 'Running 94 checks...' }}
            </div>
          </div>
        </div>
      </template>

      <!-- ── ERROR STATE ───────────────────────────────────────────── -->
      <template v-else-if="scanStatus === 'error'">
        <div
          class="card"
          style="
            padding: 48px 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            text-align: center;
          "
        >
          <div
            style="
              width: 52px;
              height: 52px;
              border-radius: 50%;
              background: rgba(255, 71, 87, 0.08);
              border: 1px solid rgba(255, 71, 87, 0.15);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ff4757;
            "
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div style="font-family: var(--font-display); font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.88);">
            Scan failed
          </div>
          <div style="font-size: 13px; color: var(--text-muted); max-width: 300px;">
            {{ errorMessage ?? 'Something went wrong. Please try again.' }}
          </div>
          <button class="btn btn-ghost" @click="handleRescan">
            Try again
          </button>
        </div>
      </template>

      <!-- ── DONE ─────────────────────────────────────────────────── -->
      <template v-else-if="scanStatus === 'done' && localScan">
        <ResultHero
          :scan="localScan"
          :total-checks="totalChecks"
          :critical-count="issueCounts.critical"
          :warn-count="issueCounts.warn"
          :pass-count="issueCounts.pass"
          @rescan="handleRescan"
          @share="handleShare"
          @export="handleExport"
        />

        <FilterToolbar
          v-model:filter="filter"
          v-model:pillar-filter="pillarFilter"
          :pillars="pillars"
          :total-checks="totalChecks"
        />

        <IssueList
          :issues="issuesData"
          :pillars="pillars"
          :filter="filter"
          :pillar-filter="pillarFilter"
          @open-tool="handleOpenTool"
        />
      </template>

      <!-- ── NO SCAN DATA YET (initial load) ────────────────────────── -->
      <template v-else>
        <div
          class="card"
          style="padding: 48px 32px; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center;"
        >
          <div style="font-family: var(--font-display); font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.88);">
            Loading scan...
          </div>
        </div>
      </template>

    </div>
  </main>
</template>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    var(--elevated-2) 0%,
    var(--elevated) 50%,
    var(--elevated-2) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
