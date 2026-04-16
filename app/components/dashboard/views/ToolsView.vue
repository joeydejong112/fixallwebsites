<script setup lang="ts">
import { allTools, toolPillars } from '~/lib/dashboard/tools'

const emit = defineEmits<{
  (e: 'open-tool', slug: string): void
}>()

const toolsFilter = ref('all')
const toolsFiltered = computed(() =>
  toolsFilter.value === 'all' ? allTools : allTools.filter(t => t.pillar === toolsFilter.value),
)
const toolsFeatured = computed(() => toolsFiltered.value[0] ?? null)
const toolsRest = computed(() => toolsFiltered.value.slice(1))
const toolsPillarCount = (key: string) =>
  key === 'all' ? allTools.length : allTools.filter(t => t.pillar === key).length

function openTool(slug: string) {
  emit('open-tool', slug)
}
</script>

<template>
  <div>
    <!-- Filter tabs -->
    <div class="tl-tabs">
      <button
        v-for="p in toolPillars"
        :key="p.key"
        class="tl-tab"
        :class="{ 'tl-tab--active': toolsFilter === p.key }"
        :style="toolsFilter === p.key ? `--tc:${p.color}` : ''"
        @click="toolsFilter = p.key"
      >
        <span v-if="p.key !== 'all'" class="tl-tdot" :style="`background:${p.color}`" />
        {{ p.label }}
        <span class="tl-tcount">{{ toolsPillarCount(p.key) }}</span>
      </button>
    </div>

    <TransitionGroup name="tl-fade">
      <!-- Featured card -->
      <div
        v-if="toolsFeatured"
        :key="'feat-' + toolsFeatured.slug"
        class="tl-feat"
        :style="`--pc:${toolsFeatured.color}`"
        @click="openTool(toolsFeatured.slug)"
      >
        <div class="tl-feat-shimmer" />
        <div class="tl-feat-glow" :style="`background:radial-gradient(ellipse at 75% 50%, ${toolsFeatured.color}1a 0%, transparent 65%)`" />
        <div class="tl-feat-deco" :style="`color:${toolsFeatured.color}`">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" v-html="toolsFeatured.icon" />
        </div>
        <div class="tl-feat-body">
          <div class="tl-feat-top">
            <div class="tl-feat-ring" :style="`color:${toolsFeatured.color};background:${toolsFeatured.color}15;border-color:${toolsFeatured.color}30`">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" v-html="toolsFeatured.icon" />
            </div>
            <div class="tl-feat-badges">
              <span class="tl-fbadge" :style="`color:${toolsFeatured.color};background:${toolsFeatured.color}12;border-color:${toolsFeatured.color}30`">{{ toolsFeatured.pillar }}</span>
              <span class="tl-fbadge tl-fbadge--free">Free</span>
              <span class="tl-fbadge tl-fbadge--feat">Featured</span>
            </div>
          </div>
          <h2 class="tl-feat-title">{{ toolsFeatured.title }}</h2>
          <p class="tl-feat-desc">{{ toolsFeatured.desc }}</p>
          <div class="tl-feat-foot">
            <span class="tl-feat-checks" :style="`color:${toolsFeatured.color}`">
              {{ toolsFeatured.fixes ? `✓ Fixes ${toolsFeatured.fixes} scan checks` : '✓ WCAG accessibility' }}
            </span>
            <span class="tl-feat-cta" :style="`background:${toolsFeatured.color};color:#07070a`">Open tool →</span>
          </div>
        </div>
      </div>

      <!-- Rest grid -->
      <div v-if="toolsRest.length" key="rest-grid" class="tl-rest-grid">
        <div
          v-for="(t, i) in toolsRest"
          :key="t.slug"
          class="tl-rcard"
          :style="`--pc:${t.color};--i:${i}`"
          @click="openTool(t.slug)"
        >
          <div class="tl-rcard-accent" :style="`background:${t.color}`" />
          <div class="tl-rcard-inner">
            <div class="tl-rcard-head">
              <div class="tl-rcard-icon" :style="`color:${t.color};background:${t.color}12;border:1px solid ${t.color}25`">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" v-html="t.icon" />
              </div>
              <span class="tl-rcard-pillar" :style="`color:${t.color}`">{{ t.pillar }}</span>
              <span class="tl-rcard-free">Free</span>
            </div>
            <h3 class="tl-rcard-title">{{ t.title }}</h3>
            <p class="tl-rcard-desc">{{ t.short }}</p>
            <div class="tl-rcard-foot">
              <span class="tl-rcard-checks" :style="`color:${t.color};background:${t.color}10;border:1px solid ${t.color}20`">
                {{ t.fixes ? `${t.fixes} checks` : 'WCAG' }}
              </span>
              <span class="tl-rcard-cta">Open →</span>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* ── Tools view ─────────────────────────────────────────── */
.tl-tabs { display: flex; gap: 0; overflow-x: auto; border-bottom: 1px solid rgba(255,255,255,0.05); scrollbar-width: none; flex-shrink: 0; }
.tl-tabs::-webkit-scrollbar { display: none; }
.tl-tab { display: inline-flex; align-items: center; gap: 7px; font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700; padding: 12px 14px; color: rgba(255,255,255,0.28); background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 0.15s, border-color 0.15s; white-space: nowrap; }
.tl-tab:hover { color: rgba(255,255,255,0.6); }
.tl-tab--active { color: var(--tc); border-bottom-color: var(--tc); }
.tl-tdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.tl-tcount { font-family: 'Space Grotesk', sans-serif; font-size: 9px; background: rgba(255,255,255,0.06); border-radius: 4px; padding: 1px 5px; color: rgba(255,255,255,0.22); }
.tl-tab--active .tl-tcount { background: color-mix(in srgb, var(--tc) 15%, transparent); color: var(--tc); }

.tl-feat { position: relative; overflow: hidden; display: flex; align-items: stretch; border-radius: 14px; background: #0e0e13; border: 1px solid rgba(255,255,255,0.07); text-decoration: none; min-height: 200px; transition: border-color 0.25s, transform 0.2s, box-shadow 0.25s; }
.tl-feat:hover { border-color: var(--pc); transform: translateY(-2px); box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px var(--pc); }
.tl-feat-shimmer { position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--pc), transparent); opacity: 0; transition: opacity 0.3s; }
.tl-feat:hover .tl-feat-shimmer { opacity: 1; }
.tl-feat-glow { position: absolute; inset: 0; pointer-events: none; }
.tl-feat-deco { position: absolute; right: -20px; bottom: -20px; opacity: 0.045; pointer-events: none; transition: opacity 0.3s; }
.tl-feat:hover .tl-feat-deco { opacity: 0.07; }
.tl-feat-body { position: relative; z-index: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 14px; flex: 1; }
.tl-feat-top { display: flex; align-items: center; gap: 12px; }
.tl-feat-ring { width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid; }
.tl-feat-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.tl-fbadge { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; border: 1px solid; }
.tl-fbadge--free { color: #00d4aa; background: rgba(0,212,170,0.08); border-color: rgba(0,212,170,0.22); }
.tl-fbadge--feat { color: #ec3586; background: rgba(236,53,134,0.08); border-color: rgba(236,53,134,0.22); }
.tl-feat-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.3rem, 2.5vw, 1.9rem); font-weight: 800; color: white; letter-spacing: -0.03em; margin: 0; line-height: 1.1; }
.tl-feat-desc { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.36); line-height: 1.6; margin: 0; flex: 1; }
.tl-feat-foot { display: flex; align-items: center; gap: 16px; margin-top: auto; }
.tl-feat-checks { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; flex: 1; }
.tl-feat-cta { display: inline-flex; align-items: center; font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 9px 18px; border-radius: 6px; transition: filter 0.15s, transform 0.15s; flex-shrink: 0; }
.tl-feat:hover .tl-feat-cta { filter: brightness(1.1); transform: translateX(2px); }

.tl-rest-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.tl-rcard { display: flex; position: relative; overflow: hidden; border-radius: 12px; background: #0e0e13; border: 1px solid rgba(255,255,255,0.055); text-decoration: none; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; animation: tl-card-in 0.3s ease both; animation-delay: calc(var(--i) * 40ms); }
@keyframes tl-card-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.tl-rcard:hover { border-color: var(--pc); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px var(--pc); }
.tl-rcard-accent { width: 3px; flex-shrink: 0; opacity: 0.5; transition: opacity 0.2s; }
.tl-rcard:hover .tl-rcard-accent { opacity: 1; }
.tl-rcard-inner { display: flex; flex-direction: column; gap: 9px; padding: 18px 18px 18px 16px; flex: 1; }
.tl-rcard-head { display: flex; align-items: center; gap: 8px; }
.tl-rcard-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tl-rcard-pillar { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; flex: 1; }
.tl-rcard-free { font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; padding: 2px 5px; }
.tl-rcard-title { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.88); margin: 0; line-height: 1.3; transition: color 0.15s; }
.tl-rcard:hover .tl-rcard-title { color: white; }
.tl-rcard-desc { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.26); line-height: 1.5; margin: 0; flex: 1; }
.tl-rcard-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.tl-rcard-checks { font-family: 'Space Grotesk', sans-serif; font-size: 10px; padding: 2px 7px; border-radius: 4px; }
.tl-rcard-cta { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; color: var(--pc); letter-spacing: 0.04em; transition: letter-spacing 0.15s; }
.tl-rcard:hover .tl-rcard-cta { letter-spacing: 0.08em; }

.tl-fade-enter-active { transition: opacity 0.2s, transform 0.2s; }
.tl-fade-leave-active { transition: opacity 0.15s; }
.tl-fade-enter-from { opacity: 0; transform: translateY(6px); }
.tl-fade-leave-to   { opacity: 0; }
</style>
