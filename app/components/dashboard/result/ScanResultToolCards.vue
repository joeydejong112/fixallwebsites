<script setup lang="ts">
import { allTools } from '~/lib/dashboard/tools'

const props = defineProps<{
  toolCards: { tool: any; count: number; hasCritical: boolean; issues?: any[] }[]
}>()

const emit = defineEmits<{
  (e: 'open-tool', slug: string): void
}>()

const dashboardNavigate = inject<((href: string) => void) | null>('dashboardNavigate', null)

const navigate = (href: string) => {
  if (dashboardNavigate) dashboardNavigate(href)
}
</script>

<template>
  <div class="flex flex-col gap-3.5 p-4 rounded-[12px] mb-5 bg-white/[0.015] border border-white/5">
    <div class="flex items-center justify-between">
      <span class="flex items-center gap-1.5 font-display text-[11px] font-extrabold tracking-wide text-primary">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
        FIX NOW
      </span>
      <span class="font-body text-[11px] text-white/25">Tools that directly address your open issues</span>
    </div>
    <div class="flex gap-3 overflow-x-auto pb-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded">
      <div
        v-for="{ tool, count, hasCritical, issues: toolIssues } in toolCards"
        :key="tool.slug"
        class="relative flex flex-col w-[220px] flex-shrink-0 rounded-[10px] bg-[#0f0f14] border border-white/6 p-3.5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
        :style="`--tc:${tool.color}`"
        :class="hasCritical ? 'hover:border-red-400/40' : ''"
      >
        <div class="absolute top-0 left-0 right-0 h-0.5 opacity-80" :style="`background: ${tool.color}`" />
        <div class="self-end font-display text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded mb-2" :class="hasCritical ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'">
          {{ count }} {{ hasCritical ? 'critical' : 'warning' }}{{ count === 1 ? '' : 's' }}
        </div>
        <div class="flex flex-col gap-2 flex-1 mb-4">
          <div class="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" :style="`color:${tool.color}`" v-html="tool.icon"/>
          </div>
          <div class="font-display text-[14px] font-bold text-white/90">{{ tool.title }}</div>
          <div class="font-body text-[11px] text-white/40 leading-relaxed line-clamp-2">{{ toolIssues?.slice(0,2).map((i:any) => i.title).join(', ') || tool.description }}</div>
        </div>
        <button class="font-display text-[10px] font-extrabold tracking-widest uppercase text-left cursor-pointer transition-all duration-200 hover:brightness-125 p-0 bg-transparent border-none" :style="`color: ${tool.color}`" @click="navigate(`/tools/${tool.slug}`)">
          FIX ISSUES →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { allTools } from '~/lib/dashboard/tools'

const props = defineProps<{
  toolCards: { tool: any; count: number; hasCritical: boolean; issues?: any[] }[]
}>()

const emit = defineEmits<{
  (e: 'open-tool', slug: string): void
}>()

const dashboardNavigate = inject<((href: string) => void) | null>('dashboardNavigate', null)

const navigate = (href: string) => {
  if (dashboardNavigate) dashboardNavigate(href)
}
</script>
