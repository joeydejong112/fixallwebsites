<script setup lang="ts">
import { PILLAR_COLORS, allTools, TOOL_LINKS } from '~/lib/dashboard/tools'
import { FIX_SNIPPETS } from '~/utils/fixSnippets'

type IssueTab = 'all' | 'security' | 'performance' | 'seo' | 'accessibility' | 'ai' | 'dns' | 'trust'

const props = defineProps<{
  issues: any[]
  activeTab: IssueTab
  severityGroups: { critical: any[]; warning: any[]; pass: any[] }
  collapsedGroups: Set<string>
  expandedIssues: Set<string>
  toolLinks: Record<string, string>
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', v: IssueTab): void
  (e: 'toggle-issue', title: string): void
  (e: 'toggle-group', key: string): void
}>()

const dashboardNavigate = inject<((href: string) => void) | null>('dashboardNavigate', null)

const navigate = (href: string) => {
  if (dashboardNavigate) dashboardNavigate(href)
}

const resultIssueTabs: IssueTab[] = ['all', 'security', 'performance', 'seo', 'accessibility', 'ai', 'dns', 'trust']

const pillarColor = (pillar: string) => {
  return { color: PILLAR_COLORS[pillar] ?? 'rgba(255,255,255,0.3)' }
}

const issueTabCount = (tab: IssueTab) => {
  const filtered = props.issues.filter((i: any) => {
    if (i.severity === 'pass') return false
    if (tab === 'all') return true
    return i.pillar === tab
  })
  return filtered.length
}
</script>

<template>
  <!-- Issues heading -->
  <div class="flex items-center gap-2.5 mb-1.5 px-1 py-0">
    <span class="font-display text-[11px] font-bold text-white/40 tracking-widest">ISSUES</span>
    <span class="font-display text-[11px] font-bold px-1.5 py-0.5 rounded bg-white/8 text-white/50">{{ issues.filter((i:any) => i.severity !== 'pass').length }}</span>
  </div>

  <!-- Filter row -->
  <div class="flex items-center gap-3.5 mb-3 mt-5">
    <span class="font-display text-[10px] font-bold tracking-[0.15em] text-white/25">FILTER</span>
    <div class="flex gap-1.5 flex-wrap">
      <button
        v-for="tab in resultIssueTabs" :key="tab"
        class="inline-flex items-center gap-[5px] font-display text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02] text-white/40 cursor-pointer transition-all duration-150 hover:text-white/70 hover:border-white/15 hover:bg-white/4"
        :class="{ '!bg-primary/12 !border-primary/30 !text-primary': activeTab === tab }"
        @click="emit('update:activeTab', tab)"
      >
        {{ tab === 'all' ? 'All' : tab === 'seo' ? 'SEO' : tab === 'ai' ? 'AI' : tab === 'dns' ? 'DNS' : tab.charAt(0).toUpperCase() + tab.slice(1) }}
        <span v-if="issueTabCount(tab)" class="text-[10px] bg-white/7 rounded px-1 py-0.5" :class="activeTab === tab ? '!bg-primary/15' : ''">{{ issueTabCount(tab) }}</span>
      </button>
    </div>
  </div>

  <!-- Severity groups -->
  <div class="flex flex-col gap-3">

    <!-- Critical -->
    <div v-if="severityGroups.critical.length" class="rounded-[12px] border border-white/6 bg-white/[0.01]">
      <button class="flex items-center gap-2.5 px-[18px] py-3.5 w-full border-none bg-transparent cursor-pointer transition-colors duration-150 hover:bg-white/2" @click="emit('toggle-group', 'critical')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff4757" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span class="font-display text-[13px] font-extrabold tracking-wide text-red-500">CRITICAL</span>
        <span class="font-display text-[10px] font-extrabold w-[18px] h-[18px] flex items-center justify-center rounded bg-red-500/15 text-red-500">{{ severityGroups.critical.length }}</span>
        <span class="font-body text-[12px] text-white/30 flex-1 text-left">Immediate action needed</span>
        <svg class="flex-shrink-0 text-white/30 transition-transform duration-200" :class="{ '!rotate-180 !text-white/60': !collapsedGroups.has('critical') }" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-if="!collapsedGroups.has('critical')" class="px-4 pb-4 flex flex-col gap-2">
        <div v-for="issue in severityGroups.critical" :key="issue.title" class="px-4 py-3.5 rounded-lg border border-transparent transition-all duration-150 hover:bg-white/2 hover:border-white/5">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[16px] leading-none text-red-500">•</span>
            <span class="font-display text-[13.5px] font-bold text-white/85">{{ issue.title }}</span>
            <span class="font-display text-[8px] font-extrabold tracking-widest px-1 py-0.5 rounded bg-red-500 text-white">CRITICAL</span>
            <span class="font-display text-[9px] font-bold tracking-widest ml-auto text-white/30" :style="pillarColor(issue.pillar)">{{ issue.pillar?.toUpperCase() }}</span>
          </div>
          <p class="font-body text-[12.5px] text-white/45 leading-relaxed my-0 mx-0 mb-2.5 ml-4.5">{{ issue.description }}</p>
          <template v-if="FIX_SNIPPETS[issue.title] || toolLinks[issue.title]">
            <button class="inline-flex items-center gap-1.5 ml-4.5 font-display text-[10px] font-bold tracking-widest text-white/30 bg-transparent border-none cursor-pointer px-1.5 py-1 rounded transition-all duration-150 hover:text-white/60 hover:bg-white/5" @click="emit('toggle-issue', issue.title)">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" class="transition-transform duration-200" :class="{ '!rotate-180': expandedIssues.has(issue.title) }">
                <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              HOW TO FIX
            </button>
            <div v-if="expandedIssues.has(issue.title)" class="mt-3 mx-0 mb-0 ml-4.5 flex flex-col gap-3 bg-white/[0.015] border border-white/4 rounded-lg p-4">
              <div v-if="FIX_SNIPPETS[issue.title]" class="bg-[#07070a] border border-white/8 rounded-[6px] overflow-hidden">
                <pre class="font-mono text-[11px] leading-relaxed text-white/65 p-3 m-0 overflow-x-auto whitespace-pre">{{ FIX_SNIPPETS[issue.title].generic }}</pre>
              </div>
              <button v-if="toolLinks[issue.title]" class="self-start inline-flex items-center gap-2 font-display text-[12px] font-bold text-primary bg-primary/8 border border-primary/25 rounded-[6px] px-3.5 py-2 cursor-pointer transition-colors duration-150 hover:bg-primary/15" @click="navigate(toolLinks[issue.title])">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                Build your {{ allTools.find(t => toolLinks[issue.title]?.endsWith(t.slug))?.title ?? 'tool' }} with our tool →
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Warning -->
    <div v-if="severityGroups.warning.length" class="rounded-[12px] border border-white/6 bg-white/[0.01]">
      <button class="flex items-center gap-2.5 px-[18px] py-3.5 w-full border-none bg-transparent cursor-pointer transition-colors duration-150 hover:bg-white/2" @click="emit('toggle-group', 'warning')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span class="font-display text-[13px] font-extrabold tracking-wide text-orange-400">WARNINGS</span>
        <span class="font-display text-[10px] font-extrabold w-[18px] h-[18px] flex items-center justify-center rounded bg-orange-400/15 text-orange-400">{{ severityGroups.warning.length }}</span>
        <span class="font-body text-[12px] text-white/30 flex-1 text-left">Review recommended</span>
        <svg class="flex-shrink-0 text-white/30 transition-transform duration-200" :class="{ '!rotate-180 !text-white/60': !collapsedGroups.has('warning') }" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-if="!collapsedGroups.has('warning')" class="px-4 pb-4 flex flex-col gap-2">
        <div v-for="issue in severityGroups.warning" :key="issue.title" class="px-4 py-3.5 rounded-lg border border-transparent transition-all duration-150 hover:bg-white/2 hover:border-white/5">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[12px] leading-none text-orange-400">•</span>
            <span class="font-display text-[13.5px] font-bold text-white/85">{{ issue.title }}</span>
            <span class="font-display text-[8px] font-extrabold tracking-widest px-1 py-0.5 rounded bg-orange-400 text-black">WARNING</span>
            <span class="font-display text-[9px] font-bold tracking-widest ml-auto text-white/30" :style="pillarColor(issue.pillar)">{{ issue.pillar?.toUpperCase() }}</span>
          </div>
          <p class="font-body text-[12.5px] text-white/45 leading-relaxed my-0 mx-0 mb-2.5 ml-4.5">{{ issue.description }}</p>
          <template v-if="FIX_SNIPPETS[issue.title] || toolLinks[issue.title]">
            <button class="inline-flex items-center gap-1.5 ml-4.5 font-display text-[10px] font-bold tracking-widest text-white/30 bg-transparent border-none cursor-pointer px-1.5 py-1 rounded transition-all duration-150 hover:text-white/60 hover:bg-white/5" @click="emit('toggle-issue', issue.title)">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" class="transition-transform duration-200" :class="{ '!rotate-180': expandedIssues.has(issue.title) }">
                <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              HOW TO FIX
            </button>
            <div v-if="expandedIssues.has(issue.title)" class="mt-3 mx-0 mb-0 ml-4.5 flex flex-col gap-3 bg-white/[0.015] border border-white/4 rounded-lg p-4">
              <div v-if="FIX_SNIPPETS[issue.title]" class="bg-[#07070a] border border-white/8 rounded-[6px] overflow-hidden">
                <pre class="font-mono text-[11px] leading-relaxed text-white/65 p-3 m-0 overflow-x-auto whitespace-pre">{{ FIX_SNIPPETS[issue.title].generic }}</pre>
              </div>
              <button v-if="toolLinks[issue.title]" class="self-start inline-flex items-center gap-2 font-display text-[12px] font-bold text-primary bg-primary/8 border border-primary/25 rounded-[6px] px-3.5 py-2 cursor-pointer transition-colors duration-150 hover:bg-primary/15" @click="navigate(toolLinks[issue.title])">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                Build your {{ allTools.find(t => toolLinks[issue.title]?.endsWith(t.slug))?.title ?? 'tool' }} with our tool →
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Passing -->
    <div v-if="severityGroups.pass.length" class="rounded-[12px] border border-white/6 bg-white/[0.01]">
      <button class="flex items-center gap-2.5 px-[18px] py-3.5 w-full border-none bg-transparent cursor-pointer transition-colors duration-150 hover:bg-white/2" @click="emit('toggle-group', 'pass')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span class="font-display text-[13px] font-extrabold tracking-wide text-green-400">PASSING</span>
        <span class="font-display text-[10px] font-extrabold w-[18px] h-[18px] flex items-center justify-center rounded bg-green-400/15 text-green-400">{{ severityGroups.pass.length }}</span>
        <span class="font-body text-[12px] text-white/30 flex-1 text-left">All checks passed</span>
        <svg class="flex-shrink-0 text-white/30 transition-transform duration-200" :class="{ '!rotate-180 !text-white/60': !collapsedGroups.has('pass') }" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-if="!collapsedGroups.has('pass')" class="px-4 pb-4 flex flex-col gap-2">
        <div v-for="issue in severityGroups.pass" :key="issue.title" class="px-4 py-3.5 rounded-lg border border-transparent transition-all duration-150 hover:bg-white/2 hover:border-white/5">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[12px] leading-none text-green-400">✓</span>
            <span class="font-display text-[13.5px] font-bold text-white/50">{{ issue.title }}</span>
            <span class="font-display text-[9px] font-bold tracking-widest ml-auto text-white/30" :style="pillarColor(issue.pillar)">{{ issue.pillar?.toUpperCase() }}</span>
          </div>
          <p class="font-body text-[12.5px] text-white/45 leading-relaxed my-0 mx-0 mb-2.5 ml-4.5">{{ issue.description }}</p>
        </div>
      </div>
    </div>

    <div v-if="!severityGroups.critical.length && !severityGroups.warning.length && !severityGroups.pass.length" class="flex items-center gap-2.5 p-5 rounded-[10px] bg-green-400/5 border border-green-400/15 font-display text-[13px] font-semibold text-green-400">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      All checks passed
    </div>

  </div>
</template>
