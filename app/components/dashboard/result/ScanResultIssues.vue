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
  <div class="rs2-issues-hdr">
    <span class="rs2-issues-title">ISSUES</span>
    <span class="rs2-issues-count">{{ issues.filter((i:any) => i.severity !== 'pass').length }}</span>
  </div>

  <!-- Filter row -->
  <div class="rs2-filter-row">
    <span class="rs2-filter-label">FILTER</span>
    <div class="rs2-filter-bar">
      <button
        v-for="tab in resultIssueTabs" :key="tab"
        class="rs2-chip"
        :class="{ 'rs2-chip--active': activeTab === tab }"
        @click="emit('update:activeTab', tab)"
      >
        {{ tab === 'all' ? 'All' : tab === 'seo' ? 'SEO' : tab === 'ai' ? 'AI' : tab === 'dns' ? 'DNS' : tab.charAt(0).toUpperCase() + tab.slice(1) }}
        <span v-if="issueTabCount(tab)" class="rs2-chip-count">{{ issueTabCount(tab) }}</span>
      </button>
    </div>
  </div>

  <!-- Severity groups -->
  <div class="rs2-groups">

    <!-- Critical -->
    <div v-if="severityGroups.critical.length" class="rs2-sev-group">
      <button class="rs2-sev-head rs2-sev-head--critical" @click="emit('toggle-group', 'critical')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff4757" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span class="rs2-sev-label">CRITICAL</span>
        <span class="rs2-sev-cnt rs2-sev-cnt--critical">{{ severityGroups.critical.length }}</span>
        <span class="rs2-sev-sub">Immediate action needed</span>
        <svg class="rs2-sev-chevron" :class="{ open: !collapsedGroups.has('critical') }" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-if="!collapsedGroups.has('critical')" class="rs2-issue-list">
        <div v-for="issue in severityGroups.critical" :key="issue.title" class="rs2-issue rs2-issue--critical">
          <div class="rs2-issue-title-row">
            <span class="rs2-issue-bullet rs2-issue-bullet--critical">•</span>
            <span class="rs2-issue-title">{{ issue.title }}</span>
            <span class="rs2-sev-badge rs2-sev-badge--critical">CRITICAL</span>
            <span class="rs2-issue-pillar" :style="pillarColor(issue.pillar)">{{ issue.pillar?.toUpperCase() }}</span>
          </div>
          <p class="rs2-issue-desc">{{ issue.description }}</p>
          <template v-if="FIX_SNIPPETS[issue.title] || toolLinks[issue.title]">
            <button class="rs2-how-toggle" @click="emit('toggle-issue', issue.title)">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" class="rs2-how-chevron" :class="{ open: expandedIssues.has(issue.title) }">
                <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              HOW TO FIX
            </button>
            <div v-if="expandedIssues.has(issue.title)" class="rs2-fix-expand">
              <div v-if="FIX_SNIPPETS[issue.title]" class="rs2-snippet">
                <pre class="rs2-pre">{{ FIX_SNIPPETS[issue.title].generic }}</pre>
              </div>
              <button v-if="toolLinks[issue.title]" class="rs2-open-tool" @click="navigate(toolLinks[issue.title])">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                Build your {{ allTools.find(t => toolLinks[issue.title]?.endsWith(t.slug))?.title ?? 'tool' }} with our tool →
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Warning -->
    <div v-if="severityGroups.warning.length" class="rs2-sev-group">
      <button class="rs2-sev-head rs2-sev-head--warning" @click="emit('toggle-group', 'warning')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span class="rs2-sev-label">WARNINGS</span>
        <span class="rs2-sev-cnt rs2-sev-cnt--warning">{{ severityGroups.warning.length }}</span>
        <span class="rs2-sev-sub">Review recommended</span>
        <svg class="rs2-sev-chevron" :class="{ open: !collapsedGroups.has('warning') }" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-if="!collapsedGroups.has('warning')" class="rs2-issue-list">
        <div v-for="issue in severityGroups.warning" :key="issue.title" class="rs2-issue rs2-issue--warning">
          <div class="rs2-issue-title-row">
            <span class="rs2-issue-bullet rs2-issue-bullet--warning">•</span>
            <span class="rs2-issue-title">{{ issue.title }}</span>
            <span class="rs2-sev-badge rs2-sev-badge--warning">WARNING</span>
            <span class="rs2-issue-pillar" :style="pillarColor(issue.pillar)">{{ issue.pillar?.toUpperCase() }}</span>
          </div>
          <p class="rs2-issue-desc">{{ issue.description }}</p>
          <template v-if="FIX_SNIPPETS[issue.title] || toolLinks[issue.title]">
            <button class="rs2-how-toggle" @click="emit('toggle-issue', issue.title)">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" class="rs2-how-chevron" :class="{ open: expandedIssues.has(issue.title) }">
                <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              HOW TO FIX
            </button>
            <div v-if="expandedIssues.has(issue.title)" class="rs2-fix-expand">
              <div v-if="FIX_SNIPPETS[issue.title]" class="rs2-snippet">
                <pre class="rs2-pre">{{ FIX_SNIPPETS[issue.title].generic }}</pre>
              </div>
              <button v-if="toolLinks[issue.title]" class="rs2-open-tool" @click="navigate(toolLinks[issue.title])">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                Build your {{ allTools.find(t => toolLinks[issue.title]?.endsWith(t.slug))?.title ?? 'tool' }} with our tool →
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Passing -->
    <div v-if="severityGroups.pass.length" class="rs2-sev-group">
      <button class="rs2-sev-head rs2-sev-head--pass" @click="emit('toggle-group', 'pass')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span class="rs2-sev-label">PASSING</span>
        <span class="rs2-sev-cnt rs2-sev-cnt--pass">{{ severityGroups.pass.length }}</span>
        <span class="rs2-sev-sub">All checks passed</span>
        <svg class="rs2-sev-chevron" :class="{ open: !collapsedGroups.has('pass') }" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-if="!collapsedGroups.has('pass')" class="rs2-issue-list">
        <div v-for="issue in severityGroups.pass" :key="issue.title" class="rs2-issue rs2-issue--pass">
          <div class="rs2-issue-title-row">
            <span class="rs2-issue-bullet rs2-issue-bullet--pass">✓</span>
            <span class="rs2-issue-title">{{ issue.title }}</span>
            <span class="rs2-issue-pillar" :style="pillarColor(issue.pillar)">{{ issue.pillar?.toUpperCase() }}</span>
          </div>
          <p class="rs2-issue-desc">{{ issue.description }}</p>
        </div>
      </div>
    </div>

    <div v-if="!severityGroups.critical.length && !severityGroups.warning.length && !severityGroups.pass.length" class="ds-empty-state">
      <p>No issues in this category</p>
    </div>

  </div>
</template>

<style scoped>
/* ── Result v2: issues heading ───────────────────────── */
.rs2-issues-hdr {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 6px; padding: 0 4px;
}
.rs2-issues-title { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); letter-spacing: 0.1em; }
.rs2-issues-count { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); }

/* ── Result v2: filter row ───────────────────────────── */
.rs2-filter-row { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; margin-top: 20px; }
.rs2-filter-label { font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: rgba(255,255,255,0.25); }
.rs2-filter-bar { display: flex; gap: 6px; flex-wrap: wrap; }
.rs2-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.12s;
}
.rs2-chip:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); }
.rs2-chip--active { background: rgba(236,53,134,0.12); border-color: rgba(236,53,134,0.3); color: #ec3586; }
.rs2-chip-count { font-size: 10px; background: rgba(255,255,255,0.07); border-radius: 4px; padding: 1px 5px; }
.rs2-chip--active .rs2-chip-count { background: rgba(236,53,134,0.15); }

/* ── Result v2: severity groups ──────────────────────── */
.rs2-groups { display: flex; flex-direction: column; gap: 12px; }
.rs2-sev-group { border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.01); }
.rs2-sev-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px; width: 100%; border: none; background: transparent;
  cursor: pointer; transition: background 0.12s;
}
.rs2-sev-head:hover { background: rgba(255,255,255,0.02); }

.rs2-sev-label { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.05em; color: rgba(255,255,255,0.8); }
.rs2-sev-head--critical .rs2-sev-label { color: #ff4757; }
.rs2-sev-cnt { font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 800; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
.rs2-sev-cnt--critical { background: rgba(255,71,87,0.15); color: #ff4757; }
.rs2-sev-cnt--warning { background: rgba(255,170,0,0.15); color: #ffaa00; }
.rs2-sev-cnt--pass { background: rgba(0,212,170,0.15); color: #00d4aa; }
.rs2-sev-sub { font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(255,255,255,0.3); flex: 1; text-align: left; }
.rs2-sev-chevron { flex-shrink: 0; color: rgba(255,255,255,0.3); transition: transform 0.2s; }
.rs2-sev-chevron.open { transform: rotate(180deg); color: rgba(255,255,255,0.6); }

.rs2-issue-list { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 8px; }
.rs2-issue {
  padding: 14px 16px; border-radius: 8px; border: 1px solid transparent; transition: background 0.15s, border-color 0.15s;
}
.rs2-issue:hover { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); }

.rs2-issue-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.rs2-issue-bullet { font-size: 16px; line-height: 1; }
.rs2-issue-bullet--critical { color: #ff4757; }
.rs2-issue-bullet--warning { color: #ffaa00; font-size: 12px; }
.rs2-issue-bullet--pass { color: #00d4aa; font-size: 12px; }

.rs2-issue-title { font-family: 'Space Grotesk', sans-serif; font-size: 13.5px; font-weight: 700; color: rgba(255,255,255,0.85); }
.rs2-issue--pass .rs2-issue-title { color: rgba(255,255,255,0.5); }
.rs2-sev-badge { font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 800; letter-spacing: 0.1em; padding: 2px 5px; border-radius: 4px; }
.rs2-sev-badge--critical { background: #ff4757; color: #fff; }
.rs2-sev-badge--warning { background: #ffaa00; color: #000; }
.rs2-issue-pillar { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.1em; margin-left: auto; color: rgba(255,255,255,0.3); }

.rs2-issue-desc { font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: rgba(255,255,255,0.45); line-height: 1.5; margin: 0 0 10px 18px; }

.rs2-how-toggle {
  display: inline-flex; align-items: center; gap: 6px; margin-left: 18px;
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: rgba(255,255,255,0.3);
  background: none; border: none; cursor: pointer; padding: 4px 6px; border-radius: 4px; transition: background 0.15s, color 0.15s;
}
.rs2-how-toggle:hover { color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.05); }
.rs2-how-chevron { transition: transform 0.2s; }
.rs2-how-chevron.open { transform: rotate(180deg); }

.rs2-fix-expand {
  margin: 12px 0 0 18px; display: flex; flex-direction: column; gap: 12px;
  background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 16px;
}
.rs2-snippet { background: #07070a; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden; }
.rs2-pre { font-family: 'Fira Mono','Cascadia Code',monospace; font-size: 11px; line-height: 1.6; color: rgba(255,255,255,0.65); padding: 12px; margin: 0; overflow-x: auto; white-space: pre; }
.rs2-open-tool {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 8px;
  font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700;
  color: #ec3586; background: rgba(236,53,134,0.08); border: 1px solid rgba(236,53,134,0.25);
  border-radius: 6px; padding: 8px 14px; cursor: pointer; transition: background 0.12s;
}
.rs2-open-tool:hover { background: rgba(236,53,134,0.15); }

/* ── Result v2: all-pass state ───────────────────────── */
.rs2-all-pass {
  display: flex; align-items: center; gap: 10px;
  padding: 20px; border-radius: 10px;
  background: rgba(0,212,170,0.05); border: 1px solid rgba(0,212,170,0.15);
  font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600;
  color: #00d4aa;
}
</style>
