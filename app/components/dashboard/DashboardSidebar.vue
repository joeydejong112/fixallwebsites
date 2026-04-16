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
  <aside class="ds-sidebar">
    <div class="ds-logo">
      <NuxtLink to="/" class="ds-logo-inner">
        <Logo class="w-[28px] h-[28px]" :animate="false" />
        <span class="ds-logo-text">ScanPulse</span>
      </NuxtLink>
      <span v-if="convexUser" class="ds-plan-badge" :class="convexUser.plan === 'pro' ? 'ds-plan-pro' : 'ds-plan-free'">
        {{ convexUser.plan === 'pro' ? 'PRO' : 'FREE' }}
      </span>
    </div>

    <nav class="ds-nav">
      <div class="ds-nav-section">Main</div>
      <button @click="emit('set-view', 'overview')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'overview' }">
        <svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
        Overview
      </button>
      <button @click="emit('set-view', 'scan')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'scan' }">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3" stroke-linecap="round"/></svg>
        Scan
      </button>
      <button @click="emit('set-view', 'history')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'history' }">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2.5 2.5" stroke-linecap="round"/></svg>
        Scan History
        <span v-if="scans.length" class="ds-nav-badge">{{ scans.length }}</span>
      </button>
      <button @click="emit('set-view', 'charts')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'charts' }">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="9" width="2" height="5" rx="1"/><rect x="7" y="5" width="2" height="9" rx="1"/><rect x="12" y="2" width="2" height="12" rx="1"/></svg>
        Charts
      </button>
      <button @click="emit('set-view', 'compare')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'compare' }">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8h10M9 4l4 4-4 4M7 4L3 8l4 4"/></svg>
        Compare
        <span v-if="recentComparisons.length" class="ds-nav-count">{{ recentComparisons.length }}</span>
      </button>
      <button @click="emit('set-view', 'bulk')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'bulk' }">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="3" rx="1"/><rect x="2" y="7" width="12" height="3" rx="1"/><rect x="2" y="12" width="8" height="2" rx="1"/></svg>
        Bulk Scan
        <span v-if="bulkScans.length" class="ds-nav-count">{{ bulkScans.length }}</span>
      </button>

      <div class="ds-nav-section" style="margin-top:10px;">Tools</div>
      <button @click="emit('toggle-tools'); emit('set-view', 'tools')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'tools' }">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 2l-1.5 1.5 4 4L14 6l-4-4zM6.5 5.5l-5 5 .7 3.3 3.3.7 5-5-4-4zM2 14l1.5-1.5"/></svg>
        Tools
        <svg class="ds-nav-chevron" :class="{ 'ds-nav-chevron--open': toolsExpanded }" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 7l3 3 3-3"/></svg>
      </button>
      <div v-show="toolsExpanded" class="ds-tools-dropdown">
        <button v-for="t in allTools" :key="t.slug" class="ds-tools-sub-item" :class="{ 'ds-tools-sub-active': selectedTool === t.slug && currentView === 'tool-detail' }" :style="selectedTool === t.slug && currentView === 'tool-detail' ? `--ac:${t.color}` : ''" @click="emit('open-tool', t.slug)">
          <div class="ds-tools-sub-dot" :style="{ background: t.color }"></div>
          <span>{{ t.title }}</span>
        </button>
      </div>

      <div class="ds-nav-section" style="margin-top:10px;">Monitored Sites</div>
      <div v-if="!monitors.length" class="ds-nav-empty">No sites monitored yet</div>
      <template v-else>
        <button
          v-for="m in monitors.slice(0, 6)"
          :key="m._id"
          @click="emit('open-scan-by-url', m.url)"
          class="ds-nav-item"
          :class="{ 'ds-nav-active': currentView === 'result' && selectedScanUrl === m.url }"
        >
          <div class="ds-site-dot" :style="{ background: fmt.scoreBg(m.lastScore) }"></div>
          <span class="ds-site-name">{{ fmt.hostname(m.url) }}</span>
        </button>
      </template>

      <div class="ds-nav-section" style="margin-top:10px;">Account</div>
      <NuxtLink to="/settings" class="ds-nav-item">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>
        Settings
      </NuxtLink>
      <NuxtLink to="/pricing" class="ds-nav-item">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2l1.5 3 3.5.5-2.5 2.5.6 3.5L8 10l-3.1 1.5.6-3.5L3 5.5 6.5 5z"/></svg>
        Upgrade
      </NuxtLink>
    </nav>

    <div class="ds-user">
      <div class="ds-user-avatar">{{ userId?.slice(5, 7)?.toUpperCase() || 'ME' }}</div>
      <div class="ds-user-info">
        <div class="ds-user-plan">{{ convexUser?.plan === 'pro' ? 'Pro Plan' : 'Free Plan' }}</div>
        <div v-if="convexUser && convexUser.plan !== 'pro'" class="ds-user-sub">{{ convexUser.scanCount }} / 1 scans used</div>
        <div v-else-if="convexUser" class="ds-user-sub">Unlimited scans</div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* ── Sidebar ──────────────────────────────────────────── */
.ds-sidebar {
  width: 220px; flex-shrink: 0;
  background: #0f0f14;
  border-right: 1px solid #1e1e28;
  display: flex; flex-direction: column;
  overflow-y: auto;
  scrollbar-width: none;
}
.ds-sidebar::-webkit-scrollbar { display: none; }
.ds-logo { padding: 18px 16px; border-bottom: 1px solid #1e1e28; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ds-logo-inner { display: flex; align-items: center; gap: 9px; text-decoration: none; }
.ds-logo-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15px; color: #e8e8f0; }
.ds-plan-badge { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; margin-left: auto; }
.ds-plan-pro { background: rgba(236,53,134,0.12); color: #ec3586; border: 1px solid rgba(236,53,134,0.25); }
.ds-plan-free { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); }

.ds-nav-section { padding: 8px 16px 4px; font-size: 9px; font-weight: 700; color: #6b7280; letter-spacing: 0.1em; text-transform: uppercase; }
.ds-nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 16px; color: #9898b0; font-size: 13px;
  text-decoration: none; background: none; border: none; border-left: 2px solid transparent;
  width: 100%; text-align: left; cursor: pointer;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
}
.ds-nav-item:hover { color: #e8e8f0; background: rgba(255,255,255,0.04); }
.ds-nav-active { color: #e8e8f0 !important; background: rgba(236,53,134,0.08) !important; border-left-color: #ec3586 !important; }
.ds-nav-item svg { width: 14px; height: 14px; opacity: 0.7; flex-shrink: 0; }
.ds-nav-badge { margin-left: auto; font-size: 10px; background: #ec3586; color: white; border-radius: 10px; padding: 1px 6px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; }
.ds-nav-count { margin-left: auto; font-size: 10px; color: #9898b0; background: #16161e; border: 1px solid #1e1e28; border-radius: 4px; padding: 1px 5px; }
.ds-site-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.ds-site-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; }
.ds-nav-empty { padding: 6px 16px; font-size: 11px; color: rgba(255,255,255,0.2); }

.ds-user { padding: 14px 16px; border-top: 1px solid #1e1e28; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.ds-user-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #ec3586, #8b1a5e); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; font-family: 'Space Grotesk', sans-serif; }
.ds-user-info { min-width: 0; }
.ds-user-plan { font-size: 12px; font-weight: 600; color: #e8e8f0; font-family: 'Space Grotesk', sans-serif; }
.ds-user-sub { font-size: 10px; color: #6b7280; margin-top: 1px; }

.ds-nav { padding: 12px 0; flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(236,53,134,0.2) transparent; }
.ds-nav::-webkit-scrollbar { width: 3px; }
.ds-nav::-webkit-scrollbar-track { background: transparent; }
.ds-nav::-webkit-scrollbar-thumb { background: rgba(236,53,134,0.2); border-radius: 4px; }
.ds-nav::-webkit-scrollbar-thumb:hover { background: rgba(236,53,134,0.45); }

/* ── Tools dropdown ────────────────────────────────────── */
.ds-nav-chevron { width: 12px; height: 12px; margin-left: auto; transition: transform 0.2s; opacity: 0.5; flex-shrink: 0; }
.ds-nav-chevron--open { transform: rotate(180deg); }
.ds-tools-dropdown { padding: 2px 0 6px 28px; display: flex; flex-direction: column; gap: 1px; }
.ds-tools-sub-item {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 10px 5px 0; color: #6b7280; font-size: 12px;
  text-decoration: none; background: none; border: none;
  width: 100%; text-align: left; cursor: pointer;
  transition: color 0.1s; border-radius: 5px;
}
.ds-tools-sub-item:hover { color: #e8e8f0; }
.ds-tools-sub-active { color: white !important; background: color-mix(in srgb, var(--ac) 10%, transparent) !important; }
.ds-tools-sub-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
</style>