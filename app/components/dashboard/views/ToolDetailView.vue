<script setup lang="ts">
import { toolComponentMap } from '~/lib/dashboard/toolComponentMap'

const props = defineProps<{
  slug: string | null
}>()

const currentToolComponent = computed(() => {
  if (!props.slug) return null
  return toolComponentMap[props.slug] ?? null
})
</script>

<template>
  <div class="ds-tool-detail">
    <template v-if="slug && currentToolComponent">
      <Suspense>
        <component :is="currentToolComponent" />
        <template #fallback>
          <div class="ds-tool-loading">
            <div class="ds-tool-loading-dot" />
            <span>Loading tool…</span>
          </div>
        </template>
      </Suspense>
    </template>
    <div v-else class="ds-tool-empty">
      <span>Select a tool to get started</span>
    </div>
  </div>
</template>

<style scoped>
.ds-tool-detail { min-height: 100%; }
.ds-tool-loading { display: flex; align-items: center; gap: 12px; padding: 60px 0; justify-content: center; color: #6b7280; font-size: 13px; }
.ds-tool-loading-dot { width: 8px; height: 8px; border-radius: 50%; background: #ec3586; animation: pulse 1s infinite; }
.ds-tool-empty { display: flex; align-items: center; justify-content: center; padding: 80px 0; color: #6b7280; font-size: 14px; }
</style>