<script setup lang="ts">
import { PILLARS } from '~/lib/dashboard/pillars'
import { allTools, TOOL_LINKS } from '~/lib/dashboard/tools'
import StatusIcon from '~/components/scanpulse/StatusIcon.vue'
import Eyebrow from '~/components/scanpulse/Eyebrow.vue'
import Arrow from '~/components/scanpulse/Arrow.vue'

const props = defineProps<{
  pillarKey: string
  pillarColor: string
  pillarLabel: string
  issues: any[]
  pillarScore: number | null
}>()

const open = ref(true)

const critCount = computed(() => props.issues.filter(i => i.severity === 'crit').length)
const warnCount = computed(() => props.issues.filter(i => i.severity === 'warn').length)
const passCount = computed(() => props.issues.filter(i => i.severity === 'pass').length)

function getIssueCTA(issue: any) {
  const toolLink = TOOL_LINKS[issue.title]
  if (issue.severity === 'pass') return { type: 'pass' as const }
  if (toolLink) {
    const tool = allTools.find(t => toolLink.endsWith(t.slug))
    return { type: 'tool' as const, tool, toolLink }
  }
  return { type: 'learn' as const }
}

function goTool(slug: string) {
  navigateTo(`/tools/${slug}`)
}

function statusColor(severity: string) {
  return severity === 'crit' ? 'var(--s-crit)' : severity === 'warn' ? 'var(--s-warn)' : 'var(--s-pass)'
}
function statusLabel(severity: string) {
  return severity === 'crit' ? 'CRITICAL' : severity === 'warn' ? 'WARNING' : 'PASS'
}
</script>

<template>
  <div style="position: relative;">
    <!-- Colored left rail running down -->
    <div :style="{
      position: 'absolute', top: 44, bottom: 0, left: 0, width: 2,
      background: pillarColor, borderRadius: 2,
      opacity: open ? 0.6 : 0.2,
    }" />

    <!-- Group header row -->
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px 12px 20px; margin-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <button
          @click="open = !open"
          style="width: 22px; height: 22px; border: none; background: transparent; cursor: pointer; transition: transform 0.2s; display: flex; align-items: center; justify-content: center;"
          :style="{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', color: pillarColor }"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>
        </button>

        <Eyebrow :label="pillarLabel" />

        <div class="num" :style="`font-size: 22px; color: ${pillarColor}`">
          {{ pillarScore ?? '—' }}
        </div>

        <div style="color: var(--text-muted); font-size: 12px; font-family: var(--font-mono);">
          {{ critCount }} critical · {{ warnCount }} warning · {{ passCount }} pass
        </div>
      </div>
    </div>

    <!-- Issue rows -->
    <div v-if="open" style="display: flex; flex-direction: column; gap: 8px; margin-left: 20px;">
      <div
        v-for="issue in issues"
        :key="issue.id ?? issue.title"
        class="card"
        :style="`padding: 18px 22px; display: grid; grid-template-columns: 110px 1fr auto; gap: 20px; align-items: center; border-left: 2px solid ${statusColor(issue.severity)}; border-radius: 10px;`"
      >
        <!-- Status badge -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <StatusIcon :status="issue.severity" :size="14" />
          <span :style="`font-family: var(--font-display); font-size: 11px; letter-spacing: 0.12em; font-weight: 700; color: ${statusColor(issue.severity)}`">
            {{ statusLabel(issue.severity) }}
          </span>
        </div>

        <!-- Title + blurb -->
        <div>
          <div style="font-family: var(--font-display); font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 3px;">
            {{ issue.title }}
          </div>
          <div style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">
            {{ issue.blurb }}
          </div>
        </div>

        <!-- CTA -->
        <div>
          <template v-if="getIssueCTA(issue).type === 'tool'">
            <button
              class="btn btn-pink-ghost"
              @click="goTool(getIssueCTA(issue).toolLink!.replace('/tools/', ''))"
            >
              Open in {{ getIssueCTA(issue).tool!.name }} <Arrow :size="13" />
            </button>
          </template>
          <template v-else-if="getIssueCTA(issue).type === 'pass'">
            <span style="color: var(--text-faint); font-size: 12px; font-family: var(--font-mono);">✓ verified</span>
          </template>
          <template v-else>
            <a style="color: var(--text-muted); font-size: 13px; cursor: pointer; font-family: var(--font-display);">Learn more →</a>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
