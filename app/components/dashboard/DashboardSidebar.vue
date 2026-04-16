<script setup lang="ts">
import { allTools } from '~/lib/dashboard/tools'
import { useScoreFormat } from '~/composables/dashboard/useScoreFormat'

const props = defineProps<{
  currentView: string
  toolsExpanded: boolean
  selectedTool: string | null
  selectedScanUrl: string | null
  scans: any[]
  bulkScans: any[]
  recentComparisons: any[]
  monitors: any[]
  convexUser: { plan: 'free' | 'pro'; scanCount: number } | null
  userId: string | null | undefined
}>()

const emit = defineEmits<{
  (e: 'set-view', v: string): void
  (e: 'toggle-tools'): void
  (e: 'open-tool', slug: string): void
  (e: 'open-scan-by-url', url: string): void
}>()

const fmt = useScoreFormat()
</script>

<template>
  <aside class="w-[220px] flex-shrink-0 bg-[#0f0f14] border-r border-[#1e1e28] flex flex-col overflow-y-auto scrollbar-none">
    <div class="p-[18px_16px] border-b border-[#1e1e28] flex items-center gap-2 flex-shrink-0">
      <NuxtLink to="/" class="flex items-center gap-[9px] no-underline">
        <Logo class="w-[28px] h-[28px]" :animate="false" />
        <span class="font-display font-bold text-[15px] text-[#e8e8f0]">ScanPulse</span>
      </NuxtLink>
      <span v-if="convexUser" class="font-display text-[9px] font-bold tracking-[0.08em] uppercase p-[2px_6px] rounded-[4px] ml-auto" :class="convexUser.plan === 'pro' ? 'bg-primary/10 text-primary border border-primary/25' : 'bg-white/5 text-white/40 border border-white/10'">
        {{ convexUser.plan === 'pro' ? 'PRO' : 'FREE' }}
      </span>
    </div>

    <nav class="p-[12px_0] flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
      <div class="p-[8px_16px_4px] text-[9px] font-bold text-[#6b7280] tracking-[0.1em] uppercase">Main</div>
      <button @click="emit('set-view', 'overview')" class="flex items-center gap-[9px] p-[7px_16px] text-[#9898b0] text-[13px] no-underline bg-none border-none border-l-2 border-l-transparent w-full text-left cursor-pointer transition-colors duration-100 hover:text-[#e8e8f0] hover:bg-white/5" :class="{ '!text-[#e8e8f0] !bg-primary/10 !border-l-primary': currentView === 'overview' }">
        <svg viewBox="0 0 16 16" fill="currentColor" class="w-[14px] h-[14px] opacity-70 flex-shrink-0"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
        Overview
      </button>
      <button @click="emit('set-view', 'scan')" class="flex items-center gap-[9px] p-[7px_16px] text-[#9898b0] text-[13px] no-underline bg-none border-none border-l-2 border-l-transparent w-full text-left cursor-pointer transition-colors duration-100 hover:text-[#e8e8f0] hover:bg-white/5" :class="{ '!text-[#e8e8f0] !bg-primary/10 !border-l-primary': currentView === 'scan' }">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="w-[14px] h-[14px] opacity-70 flex-shrink-0"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3" stroke-linecap="round"/></svg>
        Scan
      </button>
      <button @click="emit('set-view', 'history')" class="flex items-center gap-[9px] p-[7px_16px] text-[#9898b0] text-[13px] no-underline bg-none border-none border-l-2 border-l-transparent w-full text-left cursor-pointer transition-colors duration-100 hover:text-[#e8e8f0] hover:bg-white/5" :class="{ '!text-[#e8e8f0] !bg-primary/10 !border-l-primary': currentView === 'history' }">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="w-[14px] h-[14px] opacity-70 flex-shrink-0"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2.5 2.5" stroke-linecap="round"/></svg>
        Scan History
        <span v-if="scans.length" class="ml-auto text-[10px] bg-primary text-white rounded-[10px] p-[1px_6px] font-display font-bold">{{ scans.length }}</span>
      </button>
      <button @click="emit('set-view', 'charts')" class="flex items-center gap-[9px] p-[7px_16px] text-[#9898b0] text-[13px] no-underline bg-none border-none border-l-2 border-l-transparent w-full text-left cursor-pointer transition-colors duration-100 hover:text-[#e8e8f0] hover:bg-white/5" :class="{ '!text-[#e8e8f0] !bg-primary/10 !border-l-primary': currentView === 'charts' }">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="w-[14px] h-[14px] opacity-70 flex-shrink-0"><rect x="2" y="9" width="2" height="5" rx="1"/><rect x="7" y="5" width="2" height="9" rx="1"/><rect x="12" y="2" width="2" height="12" rx="1"/></svg>
        Charts
      </button>
      <button @click="emit('set-view', 'compare')" class="flex items-center gap-[9px] p-[7px_16px] text-[#9898b0] text-[13px] no-underline bg-none border-none border-l-2 border-l-transparent w-full text-left cursor-pointer transition-colors duration-100 hover:text-[#e8e8f0] hover:bg-white/5" :class="{ '!text-[#e8e8f0] !bg-primary/10 !border-l-primary': currentView === 'compare' }">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="w-[14px] h-[14px] opacity-70 flex-shrink-0"><path d="M3 8h10M9 4l4 4-4 4M7 4L3 8l4 4"/></svg>
        Compare
        <span v-if="recentComparisons.length" class="ml-auto text-[10px] text-[#9898b0] bg-[#16161e] border border-[#1e1e28] rounded-[4px] p-[1px_5px]">{{ recentComparisons.length }}</span>
      </button>
      <button @click="emit('set-view', 'bulk')" class="flex items-center gap-[9px] p-[7px_16px] text-[#9898b0] text-[13px] no-underline bg-none border-none border-l-2 border-l-transparent w-full text-left cursor-pointer transition-colors duration-100 hover:text-[#e8e8f0] hover:bg-white/5" :class="{ '!text-[#e8e8f0] !bg-primary/10 !border-l-primary': currentView === 'bulk' }">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="w-[14px] h-[14px] opacity-70 flex-shrink-0"><rect x="2" y="2" width="12" height="3" rx="1"/><rect x="2" y="7" width="12" height="3" rx="1"/><rect x="2" y="12" width="8" height="2" rx="1"/></svg>
        Bulk Scan
        <span v-if="bulkScans.length" class="ml-auto text-[10px] text-[#9898b0] bg-[#16161e] border border-[#1e1e28] rounded-[4px] p-[1px_5px]">{{ bulkScans.length }}</span>
      </button>

      <div class="p-[8px_16px_4px] text-[9px] font-bold text-[#6b7280] tracking-[0.1em] uppercase mt-[10px]">Tools</div>
      <button @click="emit('toggle-tools'); emit('set-view', 'tools')" class="flex items-center gap-[9px] p-[7px_16px] text-[#9898b0] text-[13px] no-underline bg-none border-none border-l-2 border-l-transparent w-full text-left cursor-pointer transition-colors duration-100 hover:text-[#e8e8f0] hover:bg-white/5" :class="{ '!text-[#e8e8f0] !bg-primary/10 !border-l-primary': currentView === 'tools' }">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="w-[14px] h-[14px] opacity-70 flex-shrink-0"><path d="M10 2l-1.5 1.5 4 4L14 6l-4-4zM6.5 5.5l-5 5 .7 3.3 3.3.7 5-5-4-4zM2 14l1.5-1.5"/></svg>
        Tools
        <svg class="w-[12px] h-[12px] ml-auto transition-transform duration-200 opacity-50 flex-shrink-0" :class="{ 'rotate-180': toolsExpanded }" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 7l3 3 3-3"/></svg>
      </button>
      <div v-show="toolsExpanded" class="p-[2px_0_6px_28px] flex flex-col gap-[1px]">
        <button v-for="t in allTools" :key="t.slug" class="flex items-center gap-2 p-[5px_10px_5px_0] text-[#6b7280] text-[12px] no-underline bg-none border-none w-full text-left cursor-pointer transition-colors duration-100 rounded-[5px] hover:text-[#e8e8f0]" :class="{ '!text-white !bg-[color-mix(in_srgb,var(--ac)_10%,transparent)]': selectedTool === t.slug && currentView === 'tool-detail' }" :style="selectedTool === t.slug && currentView === 'tool-detail' ? `--ac:${t.color}` : ''" @click="emit('open-tool', t.slug)">
          <div class="w-[5px] h-[5px] rounded-full flex-shrink-0" :style="{ background: t.color }"></div>
          <span>{{ t.title }}</span>
        </button>
      </div>

      <div class="p-[8px_16px_4px] text-[9px] font-bold text-[#6b7280] tracking-[0.1em] uppercase mt-[10px]">Monitored Sites</div>
      <div v-if="!monitors.length" class="p-[6px_16px] text-[11px] text-white/20">No sites monitored yet</div>
      <template v-else>
        <button
          v-for="m in monitors.slice(0, 6)"
          :key="m._id"
          @click="emit('open-scan-by-url', m.url)"
          class="flex items-center gap-[9px] p-[7px_16px] text-[#9898b0] text-[13px] no-underline bg-none border-none border-l-2 border-l-transparent w-full text-left cursor-pointer transition-colors duration-100 hover:text-[#e8e8f0] hover:bg-white/5"
          :class="{ '!text-[#e8e8f0] !bg-primary/10 !border-l-primary': currentView === 'result' && selectedScanUrl === m.url }"
        >
          <div class="w-[6px] h-[6px] rounded-full flex-shrink-0" :style="{ background: fmt.scoreBg(m.lastScore) }"></div>
          <span class="whitespace-nowrap overflow-hidden text-ellipsis text-[12px]">{{ fmt.hostname(m.url) }}</span>
        </button>
      </template>

      <div class="p-[8px_16px_4px] text-[9px] font-bold text-[#6b7280] tracking-[0.1em] uppercase mt-[10px]">Account</div>
      <NuxtLink to="/settings" class="flex items-center gap-[9px] p-[7px_16px] text-[#9898b0] text-[13px] no-underline bg-none border-none border-l-2 border-l-transparent w-full text-left cursor-pointer transition-colors duration-100 hover:text-[#e8e8f0] hover:bg-white/5">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="w-[14px] h-[14px] opacity-70 flex-shrink-0"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>
        Settings
      </NuxtLink>
      <NuxtLink to="/pricing" class="flex items-center gap-[9px] p-[7px_16px] text-[#9898b0] text-[13px] no-underline bg-none border-none border-l-2 border-l-transparent w-full text-left cursor-pointer transition-colors duration-100 hover:text-[#e8e8f0] hover:bg-white/5">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="w-[14px] h-[14px] opacity-70 flex-shrink-0"><path d="M8 2l1.5 3 3.5.5-2.5 2.5.6 3.5L8 10l-3.1 1.5.6-3.5L3 5.5 6.5 5z"/></svg>
        Upgrade
      </NuxtLink>
    </nav>

    <div class="p-[14px_16px] border-t border-[#1e1e28] flex items-center gap-[10px] flex-shrink-0">
      <div class="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-primary to-[#8b1a5e] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 font-display">{{ userId?.slice(5, 7)?.toUpperCase() || 'ME' }}</div>
      <div class="min-w-0">
        <div class="text-[12px] font-semibold text-[#e8e8f0] font-display">{{ convexUser?.plan === 'pro' ? 'Pro Plan' : 'Free Plan' }}</div>
        <div v-if="convexUser && convexUser.plan !== 'pro'" class="text-[10px] text-[#6b7280] mt-px">{{ convexUser.scanCount }} / 1 scans used</div>
        <div v-else-if="convexUser" class="text-[10px] text-[#6b7280] mt-px">Unlimited scans</div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-thin { scrollbar-width: thin; }
.scrollbar-thumb-primary\/20::-webkit-scrollbar-thumb { background: rgba(236,53,134,0.2); border-radius: 4px; }
.scrollbar-thumb-primary\/20::-webkit-scrollbar-thumb:hover { background: rgba(236,53,134,0.45); }
.scrollbar-track-transparent::-webkit-scrollbar-track { background: transparent; }
</style>