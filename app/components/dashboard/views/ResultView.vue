<script setup lang="ts">
import { allTools, TOOL_LINKS } from '~/lib/dashboard/tools'

type IssueTab = 'all' | 'security' | 'performance' | 'seo' | 'accessibility' | 'ai' | 'dns' | 'trust'

const props = defineProps<{
  scan: any
  isMonitored: (url: string) => boolean
}>()

const emit = defineEmits<{
  (e: 'rescan', url: string): void
  (e: 'delete', scanId: string): void
  (e: 'open-tool', slug: string): void
}>()

const dashboardNavigate = inject<((href: string) => void) | null>('dashboardNavigate', null)

// ── Result-local state ──
const resultActiveTab = ref<IssueTab>('all')
const resultExpandedFix = ref<string | null>(null)
const resultCopied = ref(false)
const resultExpandedIssues = ref<Set<string>>(new Set())
const resultCollapsedGroups = ref<Set<string>>(new Set(['pass']))

function toggleResultIssue(title: string) {
  const s = new Set(resultExpandedIssues.value)
  if (s.has(title)) s.delete(title)
  else s.add(title)
  resultExpandedIssues.value = s
}

function toggleResultGroup(key: string) {
  const s = new Set(resultCollapsedGroups.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  resultCollapsedGroups.value = s
}

const resultSeverityGroups = computed(() => {
  const issues = (props.scan?.issues ?? []).filter((i: any) => resultActiveTab.value === 'all' || i.pillar === resultActiveTab.value)
  return {
    critical: issues.filter((i: any) => i.severity === 'critical'),
    warning: issues.filter((i: any) => i.severity === 'warning'),
    pass: issues.filter((i: any) => i.severity === 'pass')
  }
})

const resultToolCards = computed(() => {
  if (!props.scan?.issues) return []
  const map = new Map<string, { count: number; hasCritical: boolean }>()
  for (const issue of props.scan.issues) {
    if (issue.severity === 'pass') continue
    const toolPath = TOOL_LINKS[issue.title as string]
    if (!toolPath) continue
    const tool = allTools.find(t => toolPath.endsWith(t.slug))
    if (!tool) continue
    const entry = map.get(tool.slug) ?? { count: 0, hasCritical: false }
    entry.count++
    if (issue.severity === 'critical') entry.hasCritical = true
    map.set(tool.slug, entry)
  }
  return [...map.entries()].map(([slug, data]) => ({ tool: allTools.find(t => t.slug === slug)!, ...data })).sort((a, b) => (b.hasCritical ? 1 : 0) - (a.hasCritical ? 1 : 0) || b.count - a.count)
})

watch(resultActiveTab, () => { resultExpandedIssues.value = new Set() })

const resultIssues = computed(() => {
  if (!props.scan?.issues) return []
  if (resultActiveTab.value === 'all') return props.scan.issues
  return props.scan.issues.filter((i: any) => i.pillar === resultActiveTab.value)
})

function shareResult() {
  if (!props.scan?._id) return
  navigator.clipboard.writeText(`${window.location.origin}/share/${props.scan._id}`)
  resultCopied.value = true
  setTimeout(() => { resultCopied.value = false }, 2000)
}

const relativeTime = (ts: number) => {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

const scoreBg = (score: any) => {
  const s = Number(score) || 0
  if (s >= 80) return '#00d4aa'
  if (s >= 60) return '#ffaa00'
  return '#ec3586'
}
</script>

<template>
  <!-- ── Scanning state ───────────────────────── -->
  <div v-if="scan.status === 'pending' || scan.status === 'running'" class="rs-scanning">
    <div class="rs-scan-rings">
      <div class="rs-ring rs-ring-1"/>
      <div class="rs-ring rs-ring-2"/>
      <div class="rs-ring rs-ring-3"/>
      <div class="rs-ring rs-ring-spin"/>
      <div class="rs-ring-dot"/>
    </div>
    <div class="rs-scan-label">{{ scan.status === 'running' ? 'Scanning…' : 'Initialising…' }}</div>
    <div class="rs-scan-url">{{ scan.url }}</div>
    <div class="rs-scan-sub">Running 94 checks across security, performance, SEO, accessibility, AI readiness, DNS & trust</div>
    <div class="rs-scan-dots">
      <div class="rs-scan-dot" style="animation-delay:0s"/>
      <div class="rs-scan-dot" style="animation-delay:0.2s"/>
      <div class="rs-scan-dot" style="animation-delay:0.4s"/>
    </div>
  </div>

  <!-- ── Error state ──────────────────────────── -->
  <div v-else-if="scan.status === 'error'" class="rs-error">
    <div class="rs-error-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </div>
    <div class="rs-error-title">Scan failed</div>
    <div class="rs-error-msg">{{ scan.errorMessage ?? 'Something went wrong.' }}</div>
    <button class="rs-retry-btn" @click="emit('rescan', scan.url)">Try again</button>
  </div>

  <!-- ── Done state ───────────────────────────── -->
  <div v-else class="ds-result-layout">
    <ScanResultHeader
      :scan="scan"
      :is-monitored="isMonitored"
      @rescan="emit('rescan', scan.url)"
      @delete="emit('delete', scan._id)"
      @share="shareResult"
      @toggle-monitor="emit('toggle-monitor', scan.url)"
    />

    <ScanResultScores :scan="scan" />

    <!-- ══ ISSUES ══ -->
    <template v-if="scan.issues?.length">
      <ScanResultToolCards
        v-if="resultToolCards.length"
        :tool-cards="resultToolCards"
        @open-tool="emit('open-tool', $event)"
      />

      <ScanResultIssues
        :issues="scan.issues"
        :active-tab="resultActiveTab"
        :severity-groups="resultSeverityGroups"
        :collapsed-groups="resultCollapsedGroups"
        :expanded-issues="resultExpandedIssues"
        :tool-links="TOOL_LINKS"
        @update:activeTab="resultActiveTab = $event"
        @toggle-issue="toggleResultIssue"
        @toggle-group="toggleResultGroup"
      />
    </template>

    <!-- No issues -->
    <div v-else-if="scan.status === 'done'" class="rs2-all-pass">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      No issues found — everything looks great
    </div>
  </div>
</template>

<style scoped>
/* ── Result: scanning state ──────────────────────────── */
.rs-scanning {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 0; gap: 10px;
}
.rs-scan-rings { position: relative; width: 100px; height: 100px; margin-bottom: 24px; }
.rs-ring { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.05); }
.rs-ring-1 { inset: 0; }
.rs-ring-2 { inset: 14px; border-color: rgba(255,255,255,0.07); }
.rs-ring-3 { inset: 28px; border-color: rgba(255,255,255,0.09); }
.rs-ring-spin { inset: 0; border: 2px solid transparent; border-top-color: #ec3586; border-radius: 50%; animation: rs-spin 1.4s linear infinite; }
@keyframes rs-spin { to { transform: rotate(360deg); } }
.rs-ring-dot { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 10px; height: 10px; border-radius: 50%; background: #ec3586; animation: rs-pulse 1.4s ease-in-out infinite; }
@keyframes rs-pulse { 0%,100%{opacity:1;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.4;transform:translate(-50%,-50%) scale(0.8)} }
.rs-scan-label { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.9); }
.rs-scan-url   { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.5); }
.rs-scan-sub   { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.3); max-width: 360px; text-align: center; }
.rs-scan-dots  { display: flex; gap: 5px; margin-top: 8px; }
.rs-scan-dot   { width: 5px; height: 5px; border-radius: 50%; background: rgba(236,53,134,0.5); animation: rs-pulse 1.4s ease-in-out infinite; }

/* ── Result: error state ─────────────────────────────── */
.rs-error { display: flex; flex-direction: column; align-items: center; padding: 80px 0; gap: 10px; }
.rs-error-icon { width: 52px; height: 52px; border-radius: 50%; background: rgba(255,71,87,0.08); border: 1px solid rgba(255,71,87,0.15); display: flex; align-items: center; justify-content: center; color: #ff4757; margin-bottom: 6px; }
.rs-error-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.88); }
.rs-error-msg { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.45); max-width: 300px; text-align: center; }
.rs-retry-btn { margin-top: 8px; font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; padding: 8px 16px; cursor: pointer; transition: background 0.15s; }
.rs-retry-btn:hover { background: rgba(255,255,255,0.1); }

/* ── Result v2: all-pass state ───────────────────────── */
.rs2-all-pass {
  display: flex; align-items: center; gap: 10px;
  padding: 20px; border-radius: 10px;
  background: rgba(0,212,170,0.05); border: 1px solid rgba(0,212,170,0.15);
  font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600;
  color: #00d4aa;
}
</style>
