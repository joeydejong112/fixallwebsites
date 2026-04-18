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
  <div class="min-h-full">
    <template v-if="slug && currentToolComponent">
      <Suspense>
        <component :is="currentToolComponent" :slug="slug" />
        <template #fallback>
          <div class="flex items-center gap-3 py-[60px] justify-center text-[#6b7280] text-[13px]">
            <div class="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Loading tool…</span>
          </div>
        </template>
      </Suspense>
    </template>
    <div v-else class="flex items-center justify-center py-[80px] text-[#6b7280] text-sm">
      <span>Select a tool to get started</span>
    </div>
  </div>
</template>