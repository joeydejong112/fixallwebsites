<script setup lang="ts">
// Icons from ~/lib/dashboard/tools are static — v-html is safe here
import { allTools, toolPillars } from '~/lib/dashboard/tools'

defineEmits<{
  (e: 'open-tool', slug: string): void
}>()

const toolsFilter = ref('all')
const toolsFiltered = computed(() =>
  toolsFilter.value === 'all' ? allTools : allTools.filter(t => t.pillar === toolsFilter.value),
)
const toolsFeatured = computed(() => toolsFiltered.value[0] ?? null)
const toolsRest = computed(() => toolsFiltered.value.slice(1))
const pillarCounts = computed(() => {
  const m = new Map<string, number>()
  for (const p of toolPillars) {
    m.set(p.key, p.key === 'all' ? allTools.length : allTools.filter(t => t.pillar === p.key).length)
  }
  return m
})
</script>

<template>
  <div>
    <!-- Filter tabs -->
    <div class="flex gap-0 overflow-x-auto border-b border-white/5 scrollbar-none shrink-0">
      <button
        v-for="p in toolPillars"
        :key="p.key"
        class="inline-flex items-center gap-[7px] font-display text-xs font-bold px-3 py-3 text-white/[0.28] bg-none border-none cursor-pointer border-b-2 border-transparent mb-[-1px] transition-colors duration-150 whitespace-nowrap hover:text-white/60"
        :class="{ '!text-[var(--tc)] !border-b-2 !border-[var(--tc)]': toolsFilter === p.key }"
        :style="toolsFilter === p.key ? `--tc:${p.color}` : ''"
        @click="toolsFilter = p.key"
      >
        <span v-if="p.key !== 'all'" class="w-[5px] h-[5px] rounded-full shrink-0" :style="`background:${p.color}`" />
        {{ p.label }}
        <span class="font-display text-[9px] bg-white/6 rounded px-[5px] py-px text-white/[0.22]">{{ pillarCounts.get(p.key) }}</span>
      </button>
    </div>

    <TransitionGroup name="tl-fade">
      <!-- Featured card -->
      <div
        v-if="toolsFeatured"
        :key="'feat-' + toolsFeatured.slug"
        class="relative overflow-hidden flex items-stretch rounded-[14px] bg-[#0e0e13] border border-white/7 text-decoration-none min-h-[200px] transition-all duration-200 hover:border-[var(--pc)] hover:translate-y-[-2px] hover:shadow-xl"
        :style="`--pc:${toolsFeatured.color}`"
        role="button"
        tabindex="0"
        @click="$emit('open-tool', toolsFeatured.slug)"
        @keydown.enter="$emit('open-tool', toolsFeatured.slug)"
      >
        <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--pc)] to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
        <div class="absolute inset-0 pointer-events-none" :style="`background:radial-gradient(ellipse at 75% 50%, ${toolsFeatured.color}1a 0%, transparent 65%)`" />
        <div class="absolute right-[-20px] bottom-[-20px] opacity-[0.045] pointer-events-none transition-opacity duration-300 hover:opacity-70" :style="`color:${toolsFeatured.color}`">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" v-html="toolsFeatured.icon" />
        </div>
        <div class="relative z-10 px-8 py-7 flex flex-col gap-[14px] flex-1">
          <div class="flex items-center gap-3">
            <div class="w-[46px] h-[46px] rounded-[12px] shrink-0 flex items-center justify-center border" :style="`color:${toolsFeatured.color};background:${toolsFeatured.color}15;border-color:${toolsFeatured.color}30`">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" v-html="toolsFeatured.icon" />
            </div>
            <div class="flex gap-[6px] items-center flex-wrap">
              <span class="font-display text-[9px] font-bold tracking-[0.12em] uppercase px-[8px] py-[3px] rounded border" :style="`color:${toolsFeatured.color};background:${toolsFeatured.color}12;border-color:${toolsFeatured.color}30`">{{ toolsFeatured.pillar }}</span>
              <span class="font-display text-[9px] font-bold tracking-[0.12em] uppercase px-[8px] py-[3px] rounded border text-[#00d4aa] bg-[#00d4aa]/8 border-[#00d4aa]/22">Free</span>
              <span class="font-display text-[9px] font-bold tracking-[0.12em] uppercase px-[8px] py-[3px] rounded border text-[#ec3586] bg-[#ec3586]/8 border-[#ec3586]/22">Featured</span>
            </div>
          </div>
          <h2 class="font-display text-[clamp(1.3rem,2.5vw,1.9rem)] font-extrabold text-white tracking-[-0.03em] m-0 leading-tight">{{ toolsFeatured.title }}</h2>
          <p class="font-body text-[13px] text-white/[0.36] leading-relaxed m-0 flex-1">{{ toolsFeatured.desc }}</p>
          <div class="flex items-center gap-4 mt-auto">
            <span class="font-body text-[12px] font-semibold flex-1" :style="`color:${toolsFeatured.color}`">
              {{ toolsFeatured.fixes ? `✓ Fixes ${toolsFeatured.fixes} scan checks` : '✓ WCAG accessibility' }}
            </span>
            <span class="inline-flex items-center font-display text-[11px] font-extrabold tracking-[0.08em] uppercase px-[18px] py-[9px] rounded-[6px] transition-all duration-150 hover:brightness-110 hover:translate-x-[2px] shrink-0" :style="`background:${toolsFeatured.color};color:#07070a`">Open tool →</span>
          </div>
        </div>
      </div>

      <!-- Rest grid -->
      <div v-if="toolsRest.length" key="rest-grid" class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        <div
          v-for="(t, i) in toolsRest"
          :key="t.slug"
          class="relative flex overflow-hidden rounded-[12px] bg-[#0e0e13] border border-white/[0.055] text-decoration-none transition-all duration-200 hover:border-[var(--pc)] hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.4),0_0_0_1px_var(--pc)] animate-[tl-card-in_0.3s_ease_both]"
          :style="`--pc:${t.color};--i:${i};animation-delay:calc(var(--i)*0.05s)`"
          role="button"
          tabindex="0"
          @click="$emit('open-tool', t.slug)"
          @keydown.enter="$emit('open-tool', t.slug)"
        >
          <div class="w-[3px] shrink-0 opacity-50 transition-opacity duration-200 hover:opacity-100" :style="`background:${t.color}`" />
          <div class="flex flex-col gap-[9px] px-4 py-[18px] flex-1">
            <div class="flex items-center gap-2">
              <div class="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center shrink-0" :style="`color:${t.color};background:${t.color}12;border:1px solid ${t.color}25`">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" v-html="t.icon" />
              </div>
              <span class="font-display text-[9px] font-bold tracking-[0.12em] uppercase flex-1" :style="`color:${t.color}`">{{ t.pillar }}</span>
              <span class="font-display text-[8px] font-bold tracking-[0.1em] uppercase text-white/[0.2] bg-white/[0.04] border border-white/[0.08] rounded-[3px] px-[5px] py-[2px]">Free</span>
            </div>
            <h3 class="font-display text-[13px] font-bold text-white/[0.88] m-0 leading-snug transition-colors duration-150 hover:text-white">{{ t.title }}</h3>
            <p class="font-body text-[11px] text-white/[0.26] leading-relaxed m-0 flex-1">{{ t.short }}</p>
            <div class="flex items-center justify-between mt-1">
              <span class="font-display text-[10px] px-[7px] py-px rounded-[4px]" :style="`color:${t.color};background:${t.color}10;border:1px solid ${t.color}20`">
                {{ t.fixes ? `${t.fixes} checks` : 'WCAG' }}
              </span>
              <span class="font-display text-[11px] font-bold tracking-[0.04em] transition-all duration-150 hover:tracking-[0.08em]" :style="`color:var(--pc)`">Open →</span>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* ── TransitionGroup animations ─────────────────────────── */
.tl-fade-enter-active { transition: opacity 0.2s, transform 0.2s; }
.tl-fade-leave-active { transition: opacity 0.15s; }
.tl-fade-enter-from { opacity: 0; transform: translateY(6px); }
.tl-fade-leave-to   { opacity: 0; }

/* ── Card entrance animation ────────────────────────────── */
@keyframes tl-card-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

</style>
