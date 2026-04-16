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
  <div v-if="scan.status === 'pending' || scan.status === 'running'" class="flex flex-col items-center justify-center py-20 px-0 gap-2.5">
    <!-- Spinning rings -->
    <div class="relative w-[100px] h-[100px] mb-6">
      <div class="absolute inset-0 rounded-full border border-white/5"/>
      <div class="absolute inset-[14px] rounded-full border border-white/7"/>
      <div class="absolute inset-[28px] rounded-full border border-white/9"/>
      <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" style="animation: linear 1.4s infinite"/>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style="animation: 1.4s ease-in-out infinite"/>
    </div>
    <div class="font-display text-lg font-bold text-white/90">Scanning…</div>
    <div class="font-body text-[13px] text-white/50">{{ scan.url }}</div>
    <div class="font-body text-[11px] text-white/30 max-w-[360px] text-center">Running 94 checks across security, performance, SEO, accessibility, AI readiness, DNS & trust</div>
    <!-- Animated dots -->
    <div class="flex gap-1.5 mt-2">
      <div class="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style="animation-delay:0s"/>
      <div class="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style="animation-delay:0.2s"/>
      <div class="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style="animation-delay:0.4s"/>
    </div>
  </div>

  <!-- ── Error state ──────────────────────────── -->
  <div v-else-if="scan.status === 'error'" class="flex flex-col items-center py-20 px-0 gap-2.5">
    <div class="w-[52px] h-[52px] rounded-full bg-red-500/8 border border-red-500/15 flex items-center justify-center text-red-500 mb-1.5">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </div>
    <div class="font-display text-lg font-bold text-white/88">Scan failed</div>
    <div class="font-body text-[13px] text-white/45 max-w-[300px] text-center">{{ scan.errorMessage ?? 'Something went wrong.' }}</div>
    <button class="mt-2 font-display text-[12px] font-semibold text-white/60 bg-white/5 border border-white/10 rounded-lg px-4 py-2 cursor-pointer transition-colors duration-150 hover:bg-white/10" @click="emit('rescan', scan.url)">Try again</button>
  </div>

  <!-- ── Done state ───────────────────────────── -->
  <div v-else class="flex flex-col gap-4">
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
    <div v-else-if="scan.status === 'done'" class="flex items-center gap-2.5 p-5 rounded-[10px] bg-green-400/5 border border-green-400/15 font-display text-[13px] font-semibold text-green-400">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      No issues found — everything looks great
    </div>
  </div>
</template>
