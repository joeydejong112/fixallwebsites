<script setup lang="ts">
import type { BulkScan } from '~/types/dashboard'
defineProps<{ bulkScans: BulkScan[] }>()
</script>

<template>
  <div class="bg-[#0f0f14] border border-[#1e1e28] rounded-card p-[18px]">
    <div class="flex items-center justify-between mb-4">
      <div class="font-display font-semibold text-[13px] text-white/70">Bulk Scans</div>
      <NuxtLink to="/bulk-scan" class="text-[12px] text-primary hover:opacity-75 transition-opacity duration-150">Open bulk scan tool →</NuxtLink>
    </div>
    <div v-if="!bulkScans.length" class="flex flex-col items-center justify-center py-6 text-[13px] text-white/30 text-center gap-1.5">
      <p>No bulk scans yet</p>
      <p class="text-[12px] text-white/20">Scan up to 50 URLs in a single job — Pro feature.</p>
      <NuxtLink to="/bulk-scan" class="inline-block bg-primary text-white text-[13px] font-medium px-[18px] py-2 rounded-lg mt-3">Start a bulk scan</NuxtLink>
    </div>
    <template v-else>
      <NuxtLink v-for="b in bulkScans" :key="b._id" :to="`/bulk-scan/${b._id}`" class="flex items-center gap-3 px-[18px] py-[13px] border-b border-[#1e1e28] hover:bg-white/5 transition-colors duration-100 w-full text-left cursor-pointer no-underline text-inherit">
        <div class="flex-1 min-w-0">
          <div class="text-[13px] font-medium text-white/80 truncate">{{ b.name }}</div>
          <div class="text-[11px] text-white/40 mt-0.5">{{ b.totalUrls }} URLs · {{ b.completedUrls }} complete</div>
        </div>
        <div v-if="b.status === 'running' || b.status === 'pending'" class="flex-1 max-w-[120px] h-1 bg-[#1e1e28] rounded-sm overflow-hidden">
          <div class="h-full bg-primary rounded-sm transition-all duration-300" :style="{ width: (b.totalUrls ? Math.round((b.completedUrls / b.totalUrls) * 100) : 0) + '%' }"></div>
        </div>
        <span :aria-label="`Status: ${b.status}`" class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-display flex-shrink-0" :class="{
          'bg-[#00d4aa]/10 text-[#00d4aa]': b.status === 'done',
          'bg-primary/10 text-primary': b.status === 'running',
          'bg-white/5 text-white/30': b.status === 'pending',
          'bg-[#ff4757]/10 text-[#ff4757]': b.status === 'error',
        }">{{ b.status }}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
      </NuxtLink>
    </template>
  </div>
</template>
