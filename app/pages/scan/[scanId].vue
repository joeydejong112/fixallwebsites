<script setup lang="ts">
import { useScanpulseData } from '~/composables/useScanpulseData'
const { PILLARS } = useScanpulseData()
import { allTools, TOOL_LINKS } from '~/lib/dashboard/tools'
import { useScoreFormat } from '~/composables/dashboard/useScoreFormat'
import ScoreRing from '~/components/scanpulse/ScoreRing.vue'
import Eyebrow from '~/components/scanpulse/Eyebrow.vue'
import Favicon from '~/components/scanpulse/Favicon.vue'
import PillarGroupSection from '~/components/scanpulse/PillarGroupSection.vue'

definePageMeta({ middleware: 'auth', layout: 'app' })
useSeoMeta({ title: 'Scan Result — ScanPulse' })

const route = useRoute()
const scanId = route.params.scanId as string
const { api } = useConvex()

// ── Fetch scan ──
const scan = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function loadScan() {
  loading.value = true
  error.value = null
  try {
    scan.value = await api.query(api.scans.get, { scanId })
    if (!scan.value) error.value = 'Scan not found'
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load scan'
  } finally {
    loading.value = false
  }
}

loadScan()

const { relativeTime } = useScoreFormat()

// ── Filter state ──
type StatusFilter = 'all' | 'crit' | 'warn' | 'pass'
const statusFilter = ref<StatusFilter>('all')
const pillarFilter = ref<PillarKey | null>(null)

// ── Issue helpers ──
interface IssueRecord {
  id?: string
  pillar: PillarKey
  severity: 'crit' | 'warn' | 'pass'
  title: string
  blurb: string
  toolId?: string | null
}

const issues = computed<IssueRecord[]>(() => {
  if (!scan.value?.issues) return []
  return scan.value.issues.map((i: any) => ({
    id: i.id ?? i.title,
    pillar: (i.pillar || 'security') as PillarKey,
    severity: i.severity === 'critical' ? 'crit' : i.severity === 'warning' ? 'warn' : 'pass',
    title: i.title,
    blurb: i.description ?? i.blurb ?? '',
    toolId: i.toolId ?? null,
  }))
})

const critCount = computed(() => issues.value.filter(i => i.severity === 'crit').length)
const warnCount = computed(() => issues.value.filter(i => i.severity === 'warn').length)
const passCount = computed(() => issues.value.filter(i => i.severity === 'pass').length)

function pillarScore(key: string): number | null {
  const field = `${key}Score` as keyof typeof scan.value
  return (scan.value?.[field] as number) ?? null
}

const activePillars = computed(() =>
  pillarFilter.value ? PILLARS.filter(p => p.key === pillarFilter.value) : [...PILLARS]
)

const filteredIssues = computed(() => {
  let list = issues.value
  if (statusFilter.value !== 'all') list = list.filter(i => i.severity === statusFilter.value)
  if (pillarFilter.value) list = list.filter(i => i.pillar === pillarFilter.value)
  return list
})

const pillarGroups = computed(() =>
  activePillars.value.map(p => {
    const pillarIssues = filteredIssues.value.filter(i => i.pillar === p.key)
    if (!pillarIssues.length) return null
    return {
      pillarKey: p.key,
      pillarColor: p.color,
      pillarLabel: p.label,
      issues: pillarIssues,
      pillarScore: pillarScore(p.key),
    }
  }).filter(Boolean)
)

const statusOptions: { key: StatusFilter; label: string; color: string | null }[] = [
  { key: 'all', label: 'All checks', color: null },
  { key: 'crit', label: 'Critical', color: 'var(--s-crit)' },
  { key: 'warn', label: 'Warning', color: 'var(--s-warn)' },
  { key: 'pass', label: 'Pass', color: 'var(--s-pass)' },
]

function pillarBubbleStyle(color: string) {
  return `background: ${color}10; border: 1px solid ${color}26;`
}

function pillarBubbleTextStyle(color: string) {
  return `font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: ${color}; font-family: var(--font-display); font-weight: 700;`
}

function pillarPillStyle(p: (typeof PILLARS)[number], active: boolean) {
  return `padding: 6px 12px; border-radius: 999px; border: 1px solid ${active ? p.color : p.color + '26'}; background: ${active ? p.color + '22' : p.color + '0a'}; color: ${p.color}; font-family: var(--font-display); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 6px;`
}

async function handleRescan() {
  if (!scan.value?.url) return
  const { useScanActions } = await import('~/composables/dashboard/useScanActions')
  const { rescan } = useScanActions({ scans: ref([]), monitors: ref([]) }, {})
  await rescan(scan.value.url)
}

function handleShare() {
  if (!scan.value?._id) return
  navigator.clipboard.writeText(`${window.location.origin}/share/${scan.value._id}`)
}
</script>

<template>
  <div class="min-h-screen bg-canvas text-white">
    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-screen gap-3">
      <div class="relative w-[100px] h-[100px]">
        <div class="absolute inset-0 rounded-full border border-white/5"/>
        <div class="absolute inset-[14px] rounded-full border border-white/7"/>
        <div class="absolute inset-[28px] rounded-full border border-white/9"/>
        <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" style="animation: linear 1.4s infinite"/>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary animate-pulse"/>
      </div>
      <div class="font-display text-lg font-bold text-white/90">Scanning…</div>
      <div class="font-body text-[13px] text-white/50">Loading scan results</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-screen gap-3">
      <div class="w-[52px] h-[52px] rounded-full bg-danger/8 border border-danger/15 flex items-center justify-center text-danger">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </div>
      <div class="font-display text-lg font-bold text-white/88">{{ error }}</div>
      <button class="font-display text-[12px] font-semibold text-white/60 bg-white/5 border border-white/10 rounded-lg px-4 py-2 cursor-pointer transition-colors hover:bg-white/10" @click="loadScan">Try again</button>
    </div>

    <!-- Scan result -->
    <div v-else-if="scan" class="relative" style="padding: 32px 40px 60px; background: var(--canvas); overflow: hidden; min-height: 100vh;">
      <div style="position: absolute; inset: 0; opacity: 0.4;" class="grid-bg" />

      <div style="position: relative; display: flex; flex-direction: column; gap: 24;">

        <!-- ResultHero -->
        <div class="card" style="padding: 28px 32px; position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(to right, var(--brand), transparent); border-radius: 2px 2px 0 0;" />

          <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 36px; align-items: center;">

            <!-- Left: ScoreRing + URL + stats -->
            <div style="display: flex; align-items: center; gap: 18px;">
              <ScoreRing :score="scan.overallScore ?? 0" :size="140" :stroke="10" color="#ec3586" label="Overall" />
              <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                  <Favicon :host="scan.url" :size="24" bg="#ec3586" />
                  <div style="font-family: var(--font-mono); font-size: 18px; color: #fff;">{{ scan.url }}</div>
                </div>
                <Eyebrow label="" style="font-size: 10px; color: var(--text-muted);">Scanned {{ relativeTime(scan._creationTime) }} · {{ issues.length }} checks</Eyebrow>
                <div style="margin-top: 16px; display: flex; gap: 18px;">
                  <div>
                    <div class="num" style="font-size: 22px; color: var(--s-crit);">{{ critCount }}</div>
                    <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-top: 2px;">Critical</div>
                  </div>
                  <div>
                    <div class="num" style="font-size: 22px; color: var(--s-warn);">{{ warnCount }}</div>
                    <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-top: 2px;">Warning</div>
                  </div>
                  <div>
                    <div class="num" style="font-size: 22px; color: var(--s-pass);">{{ passCount }}</div>
                    <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-top: 2px;">Pass</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Center: Pillar score bubbles -->
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              <div
                v-for="p in PILLARS"
                :key="p.key"
                :style="pillarBubbleStyle(p.color) + 'border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 82px; padding: 10px 14px;'"
              >
                <div :style="pillarBubbleTextStyle(p.color)">
                  {{ p.label.split(' ')[0] }}
                </div>
                <div class="num" :style="`font-size: 22px; color: ${p.color};`">
                  {{ pillarScore(p.key) ?? '—' }}
                </div>
              </div>
            </div>

            <!-- Right: Actions -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button class="btn btn-primary" @click="handleRescan">
                Rescan now
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </button>
              <button class="btn btn-ghost" style="justify-content: center;" @click="handleShare">
                Share report
              </button>
              <button class="btn btn-ghost" style="justify-content: center;">
                Export PDF
              </button>
            </div>
          </div>
        </div>

        <!-- FilterToolbar -->
        <div style="
          display: flex; justify-content: space-between; align-items: center; gap: 20px;
          padding: 16px 20px; background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; position: sticky; top: 68px; z-index: 5; backdrop-filter: blur(16px);
        ">
          <!-- Status filters -->
          <div style="display: flex; gap: 4px;">
            <button
              v-for="s in statusOptions"
              :key="s.key"
              @click="statusFilter = s.key"
              :style="`padding: 8px 14px; border-radius: 7px; border: none; background: ${statusFilter === s.key ? 'var(--elevated-2)' : 'transparent'}; color: ${statusFilter === s.key ? (s.color || '#fff') : 'var(--text-muted)'}; font-family: var(--font-display); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;`"
            >
              <span v-if="s.color" :style="{ width: 7, height: 7, borderRadius: '50%', background: s.color }" />
              {{ s.label }}
            </button>
          </div>

          <div style="width: 1px; height: 20px; background: var(--border);" />

          <!-- Pillar pills -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; flex: 1;">
            <button
              v-for="p in PILLARS"
              :key="p.key"
              @click="pillarFilter = pillarFilter === p.key ? null : p.key"
              :style="pillarPillStyle(p, pillarFilter === p.key)"
            >
              <span :style="{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }" />
              {{ p.label.split(' ')[0] }}
            </button>
          </div>

          <div style="color: var(--text-muted); font-size: 12px; font-family: var(--font-mono);">
            {{ issues.length }} checks total
          </div>
        </div>

        <!-- IssueList -->
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <PillarGroupSection
            v-for="group in pillarGroups"
            :key="group!.pillarKey"
            :pillar-key="group!.pillarKey"
            :pillar-color="group!.pillarColor"
            :pillar-label="group!.pillarLabel"
            :issues="group!.issues"
            :pillar-score="group!.pillarScore"
          />

          <div v-if="!pillarGroups.length" class="flex items-center gap-2.5 p-5 rounded-[10px] bg-success/5 border border-success/15 font-display text-[13px] font-semibold text-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--s-pass)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            No issues found — everything looks great
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
