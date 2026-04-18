<script setup lang="ts">
import { STATIC_TOOLS, STATIC_PILLARS } from '~/types/scanpulse'

const props = defineProps<{
  filter: string
}>()

const filtered = computed(() => {
  if (props.filter === 'all') return STATIC_TOOLS
  return STATIC_TOOLS.filter((t) => t.pillar === props.filter)
})

function pillarFor(tool: { pillar: string }) {
  return STATIC_PILLARS.find(p => p.key === tool.pillar) ?? STATIC_PILLARS[0]
}
</script>

<template>
  <div class="tool-grid">
    <ToolCard
      v-for="tool in filtered"
      :key="tool.id"
      :tool="tool"
      :pillar="pillarFor(tool)"
    />
  </div>
</template>

<style scoped>
.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

@media (max-width: 1024px) {
  .tool-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>
