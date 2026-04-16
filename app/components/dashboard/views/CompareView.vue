<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const hostname = (url: string) => {
  try { return new URL(url).hostname } catch { return url }
}

const compareUrlA = ref('')
const compareUrlB = ref('')

const submitCompare = () => {
  if (!compareUrlA.value.trim() || !compareUrlB.value.trim()) return
  router.push(`/compare?urlA=${encodeURIComponent(compareUrlA.value.trim())}&urlB=${encodeURIComponent(compareUrlB.value.trim())}`)
}

defineProps({})
defineEmits([])
</script>

<template>
  <div>
    <div class="rounded-card bg-[#1e1e28]" style="padding:20px;">
      <div class="flex items-center justify-between mb-4">
        <div class="text-[13px] font-semibold text-white/70 font-['Space_Grotesk']">New Comparison</div>
      </div>
      <div class="rounded-card bg-[#0f0f14]" style="padding:16px;">
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <label class="block text-[11px] font-semibold text-white/40 font-['Space_Grotesk'] uppercase tracking-[0.06em] mb-[6px]">Site A</label>
            <input v-model="compareUrlA" class="w-full bg-[#16161e] border border-white/[0.06] rounded-lg px-3 py-[9px] text-[13px] outline-none text-[#e8e8f0] placeholder:text-white/20 transition-colors duration-150 focus:border-primary/30" placeholder="https://yoursite.com" />
          </div>
          <div class="text-[11px] font-bold text-white/20 font-['Space_Grotesk'] px-1 flex-shrink-0 mt-5">vs</div>
          <div class="flex-1 min-w-0">
            <label class="block text-[11px] font-semibold text-white/40 font-['Space_Grotesk'] uppercase tracking-[0.06em] mb-[6px]">Site B (Competitor)</label>
            <input v-model="compareUrlB" class="w-full bg-[#16161e] border border-white/[0.06] rounded-lg px-3 py-[9px] text-[13px] outline-none text-[#e8e8f0] placeholder:text-white/20 transition-colors duration-150 focus:border-primary/30" placeholder="https://competitor.com" />
          </div>
          <button @click="submitCompare" class="flex-shrink-0 mt-5 px-4 py-[9px] rounded-lg bg-primary text-white text-[13px] font-semibold font-['Space_Grotesk'] cursor-pointer border-none transition-all duration-150 hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed" :disabled="!compareUrlA.trim() || !compareUrlB.trim()">
            Compare →
          </button>
        </div>
      </div>
    </div>

    <div class="rounded-card bg-[#1e1e28]" style="padding:20px;margin-top:16px;">
      <div class="flex items-center justify-between mb-4">
        <div class="text-[13px] font-semibold text-white/70 font-['Space_Grotesk']">Past Comparisons</div>
      </div>
      <div v-if="!data.recentComparisons.value.length" class="rounded-card bg-[#0f0f14] flex flex-col items-center justify-center" style="padding:40px 0;">
        <p class="text-[13px] text-white/40">No comparisons yet</p>
        <p class="text-[12px] text-white/25 mt-1">Enter two URLs above to compare sites side by side.</p>
      </div>
      <NuxtLink v-else v-for="c in data.recentComparisons.value" :key="`${c.scanIdA}-${c.scanIdB}`" :to="`/compare/${c.scanIdA}/${c.scanIdB}`" class="flex items-center gap-3 px-4 py-3 rounded-lg mb-2 last:mb-0 bg-[#0f0f14] hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer">
        <div class="flex-1 min-w-0">
          <div class="text-[13px] font-['DM_Sans'] truncate">
            <span class="text-[#e8e8f0]">{{ hostname(c.urlA) }}</span>
            <span class="text-[#6b7280] mx-2">vs</span>
            <span class="text-[#9898b0]">{{ hostname(c.urlB) }}</span>
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
      </NuxtLink>
    </div>
  </div>
</template>
