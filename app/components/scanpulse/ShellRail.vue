<script setup lang="ts">
import { useClerkProvide } from 'clerk-vue3'

const { isSignedIn } = useAuth()
const route = useRoute()

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'scan',      label: 'Scan Result', icon: 'doc' },
  { key: 'tools',     label: 'Tools', icon: 'wrench' },
  { key: 'tools/csp-builder', label: 'CSP Builder', icon: 'code' },
]

const isActive = (key: string) => {
  if (key === 'dashboard') return route.path === '/dashboard'
  if (key === 'scan') return route.path.startsWith('/scan')
  if (key === 'tools') return route.path.startsWith('/tools')
  return route.path.includes(key)
}
</script>

<template>
  <aside class="rail">
    <!-- Logo mark -->
    <div class="rail-logo">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="ScanPulse">
        <circle cx="12" cy="12" r="10" stroke="#ec3586" stroke-width="1.6" />
        <path d="M3 12h4l2-5 3 10 2-6 2 3h5" stroke="#ec3586" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>

    <!-- Nav buttons -->
    <nav class="rail-nav" aria-label="Primary navigation">
      <NuxtLink
        v-for="item in NAV_ITEMS"
        :key="item.key"
        :to="item.key === 'dashboard' ? '/dashboard' : `/${item.key}`"
        class="rail-btn"
        :class="{ 'rail-btn--active': isActive(item.key) }"
        :title="item.label"
        :aria-current="isActive(item.key) ? 'page' : undefined"
      >
        <RailIcon :name="item.icon" />
        <span v-if="isActive(item.key)" class="rail-active-bar" aria-hidden="true" />
      </NuxtLink>
    </nav>

    <!-- Bottom section -->
    <div class="rail-bottom">
      <NuxtLink to="/settings" class="rail-btn" title="Settings">
        <RailIcon name="settings" />
      </NuxtLink>

      <!-- Avatar — Clerk user or demo initials -->
      <div class="rail-avatar">
        <span>KM</span>
      </div>
    </div>
  </aside>
</template>

<script lang="ts">
// RailIcon sub-component — same icon set as HTML shell L1067–1079
const RailIcon = defineComponent({
  props: { name: String, size: { type: Number, default: 18 } },
  setup(props) {
    const p = computed(() => ({
      width: props.size, height: props.size,
      viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      'stroke-width': 1.7, 'stroke-linecap': 'round' as const, 'stroke-linejoin': 'round' as const,
    }))
    return () => {
      const name = props.name ?? 'circle'
      const s = props.size ?? 18
      const attrs = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }
      switch (name) {
        case 'home':    return h('svg', attrs, [h('path', { d: 'M4 11l8-7 8 7v9a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1v-9z' })])
        case 'grid':    return h('svg', attrs, [h('rect', { x: 3, y: 3, width: 7, height: 7, rx: 1 }), h('rect', { x: 14, y: 3, width: 7, height: 7, rx: 1 }), h('rect', { x: 3, y: 14, width: 7, height: 7, rx: 1 }), h('rect', { x: 14, y: 14, width: 7, height: 7, rx: 1 })])
        case 'doc':     return h('svg', attrs, [h('path', { d: 'M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z' }), h('path', { d: 'M14 3v6h6M8 14h8M8 18h6' })])
        case 'wrench':  return h('svg', attrs, [h('path', { d: 'M14 6a4 4 0 105 5l3 3-3 3-3-3a4 4 0 01-5-5L4 4l3-3 7 5z' })])
        case 'code':    return h('svg', attrs, [h('path', { d: 'M8 8l-5 4 5 4M16 8l5 4-5 4M14 4l-4 16' })])
        case 'monitor': return h('svg', attrs, [h('path', { d: 'M3 5h18v12H3zM8 21h8M12 17v4' })])
        case 'settings':return h('svg', attrs, [h('circle', { cx: 12, cy: 12, r: 3 }), h('path', { d: 'M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z' })])
        default:       return h('svg', attrs, [h('circle', { cx: 12, cy: 12, r: 8 })])
      }
    }
  },
})
</script>

<style scoped>
.rail {
  width: 56px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 18px;
  gap: 4px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 10;
}

.rail-logo {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rail-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 0 8px;
}

.rail-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  border-radius: 9px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background 0.15s, color 0.15s;
  text-decoration: none;
}
.rail-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.85);
}
.rail-btn--active {
  background: var(--brand-soft);
  color: var(--brand);
}

.rail-active-bar {
  position: absolute;
  left: -1px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--brand);
  border-radius: 2px;
}

.rail-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  padding-bottom: 14px;
}

.rail-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ec3586, #6c5ce7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 11px;
  color: #fff;
}
</style>
