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
  <div class="rs2-fix-panel">
    <div class="rs2-fix-panel-head">
      <span class="rs2-fix-panel-label">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
        FIX NOW
      </span>
      <span class="rs2-fix-panel-sub">Tools that directly address your open issues</span>
    </div>
    <div class="rs2-fix-cards">
      <div
        v-for="{ tool, count, hasCritical, issues: toolIssues } in toolCards"
        :key="tool.slug"
        class="rs2-fix-card"
        :class="{ 'rs2-fix-card--critical': hasCritical }"
        :style="`--tc:${tool.color}`"
      >
        <div class="rs2-fix-card-badge" :class="hasCritical ? 'rs2-fix-card-badge--crit' : 'rs2-fix-card-badge--warn'">
          {{ count }} {{ hasCritical ? 'critical' : 'warning' }}{{ count === 1 ? '' : 's' }}
        </div>
        <div class="rs2-fix-card-body">
          <div class="rs2-fix-card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" :style="`color:${tool.color}`" v-html="tool.icon"/>
          </div>
          <div class="rs2-fix-card-title">{{ tool.title }}</div>
          <div class="rs2-fix-card-desc">{{ toolIssues?.slice(0,2).map((i:any) => i.title).join(', ') || tool.description }}</div>
        </div>
        <button class="rs2-fix-card-cta" @click="navigate(`/tools/${tool.slug}`)">
          FIX ISSUES →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Result v2: fix now panel ────────────────────────── */
.rs2-fix-panel {
  display: flex; flex-direction: column; gap: 14px;
  padding: 16px; border-radius: 12px; margin-bottom: 20px;
  background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05);
}
.rs2-fix-panel-head { display: flex; align-items: center; justify-content: space-between; }
.rs2-fix-panel-label {
  display: flex; align-items: center; gap: 6px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 800;
  letter-spacing: 0.08em; color: #ec3586;
}
.rs2-fix-panel-sub { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.25); }

.rs2-fix-cards { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 6px; }
.rs2-fix-cards::-webkit-scrollbar { height: 6px; }
.rs2-fix-cards::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

.rs2-fix-card {
  display: flex; flex-direction: column; width: 220px; flex-shrink: 0;
  border-radius: 10px; background: #0f0f14; border: 1px solid rgba(255,255,255,0.06);
  padding: 14px; position: relative; overflow: hidden; transition: transform 0.2s, border-color 0.2s;
}
.rs2-fix-card:hover { transform: translateY(-2px); border-color: var(--tc); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
.rs2-fix-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--tc); opacity: 0.8; }
.rs2-fix-card-badge { align-self: flex-end; font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; margin-bottom: 8px; }
.rs2-fix-card-badge--crit { background: rgba(255,71,87,0.1); color: #ff4757; }
.rs2-fix-card-badge--warn { background: rgba(255,170,0,0.1); color: #ffaa00; }

.rs2-fix-card-body { display: flex; flex-direction: column; gap: 8px; flex: 1; margin-bottom: 16px; }
.rs2-fix-card-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; }
.rs2-fix-card-title { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.9); }
.rs2-fix-card-desc { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }

.rs2-fix-card-cta { font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; color: var(--tc); text-transform: uppercase; background: none; border: none; cursor: pointer; text-align: left; padding: 0; transition: filter 0.2s; }
.rs2-fix-card-cta:hover { filter: brightness(1.2); }
</style>
