<script setup lang="ts">
import type { Issue, PillarKey, Pillar } from '~/types/scanpulse'

type StatusFilter = 'all' | 'crit' | 'warn' | 'pass'

interface Props {
  issues: Record<PillarKey, Issue[]> | Ref<Record<PillarKey, Issue[]>>
  pillars: Pillar[] | Ref<Pillar[]>
  filter: StatusFilter
  pillarFilter: PillarKey | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'open-tool', toolId: string): void
}>()

// Unwrap refs in script (template auto-unwraps top-level refs, but props don't)
const issues = computed(() => toValue(props.issues))
const pillars = computed(() => toValue(props.pillars))

// Track which accordion groups are open
const openGroups = ref<Set<PillarKey>>(new Set(pillars.value.map((p: Pillar) => p.key)))

// Auto-open groups when filter changes
watch(() => props.filter, () => {
  pillars.value.forEach((p: Pillar) => {
    const hasMatching = issues.value[p.key]?.some((i: Issue) => props.filter === 'all' || i.status === props.filter)
    if (hasMatching) openGroups.value.add(p.key)
  })
})

function toggleGroup(key: PillarKey) {
  const s = new Set(openGroups.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  openGroups.value = s
}

const activePillars = computed(() =>
  props.pillarFilter
    ? pillars.value.filter((p: Pillar) => p.key === props.pillarFilter)
    : pillars.value
)

function getFilteredIssues(pillarKey: PillarKey): Issue[] {
  const issuesForPillar = issues.value[pillarKey] ?? []
  if (props.filter === 'all') return issuesForPillar
  return issuesForPillar.filter((i: Issue) => i.status === props.filter)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 14px;">
    <IssueAccordion
      v-for="p in activePillars"
      :key="p.key"
      :pillar-key="p.key"
      :pillar-label="p.label"
      :pillar-color="p.color"
      :pillar-score="p.score"
      :issues="getFilteredIssues(p.key)"
      :open="openGroups.has(p.key)"
      @toggle="toggleGroup(p.key)"
      @open-tool="emit('open-tool', $event)"
    />
  </div>
</template>
