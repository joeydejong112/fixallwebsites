<script setup lang="ts">
const { current, prev, next } = useToolNav()
const palette = ref<{ openPalette: () => void } | null>(null)
</script>

<template>
  <div class="tool-layout">
    <NavBar />

    <div class="tool-body">

      <!-- ── Sidebar ─────────────────────────────────────── -->
      <aside class="sidebar">
        <!-- Header -->
        <div class="sb-header">
          <NuxtLink to="/tools" class="sb-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 12H5M11 6l-6 6 6 6"/>
            </svg>
            All tools
          </NuxtLink>
          <button class="sb-cmd" @click="palette?.openPalette()" title="Cmd+K">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <kbd>⌘K</kbd>
          </button>
        </div>

        <!-- Tool list grouped by pillar -->
        <nav class="sb-nav">
          <div v-for="p in PILLARS" :key="p.key" class="sb-group">
            <div class="sb-pillar">
              <span class="sb-dot" :style="`background:${p.color}`"/>
              {{ p.key }}
            </div>
            <NuxtLink
              v-for="t in TOOLS.filter(x => x.pillar === p.key)"
              :key="t.slug"
              :to="`/tools/${t.slug}`"
              class="sb-item"
              :class="{ 'sb-item--active': current?.slug === t.slug }"
              :style="current?.slug === t.slug ? `--ac:${t.color}` : ''"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" class="sb-icon" v-html="t.icon"/>
              <span class="sb-label">{{ t.title }}</span>
            </NuxtLink>
          </div>
        </nav>
      </aside>

      <!-- ── Main content ────────────────────────────────── -->
      <main class="tool-main">
        <slot />
      </main>

    </div>

    <!-- ── Fixed prev / next ──────────────────────────────── -->
    <NuxtLink
      v-if="prev"
      :to="`/tools/${prev.slug}`"
      class="pn-fixed pn-fixed--prev"
      :style="`--pc:${prev.color}`"
    >
      <div class="pn-fixed-arrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M19 12H5M11 6l-6 6 6 6"/>
        </svg>
      </div>
      <div class="pn-fixed-info">
        <span class="pn-fixed-label">Previous</span>
        <span class="pn-fixed-title">{{ prev.title }}</span>
      </div>
    </NuxtLink>

    <NuxtLink
      v-if="next"
      :to="`/tools/${next.slug}`"
      class="pn-fixed pn-fixed--next"
      :style="`--pc:${next.color}`"
    >
      <div class="pn-fixed-info pn-fixed-info--right">
        <span class="pn-fixed-label">Next</span>
        <span class="pn-fixed-title">{{ next.title }}</span>
      </div>
      <div class="pn-fixed-arrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
      </div>
    </NuxtLink>

    <!-- Command palette (client-only — uses window/Teleport) -->
    <ClientOnly>
      <ToolCommandPalette ref="palette" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.tool-layout { min-height: 100vh; background: #07070a; }

.tool-body {
  display: flex; align-items: flex-start;
  padding-top: 64px; /* navbar height */
}

/* ── Sidebar ──────────────────────────────────────── */
.sidebar {
  width: 236px; flex-shrink: 0;
  position: sticky; top: 64px;
  height: calc(100vh - 64px); overflow-y: auto;
  background: #0c0c12;
  border-right: 1px solid rgba(255,255,255,0.08);
  display: flex; flex-direction: column;
  scrollbar-width: none;
}
.sidebar::-webkit-scrollbar { display: none; }

.sb-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 16px 12px; gap: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.sb-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  letter-spacing: 0.04em; color: rgba(255,255,255,0.55);
  text-decoration: none; transition: color 0.15s;
}
.sb-back:hover { color: white; }

.sb-cmd {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px; padding: 4px 8px; cursor: pointer;
  color: rgba(255,255,255,0.4); transition: all 0.15s;
}
.sb-cmd:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
.sb-cmd kbd {
  font-family: 'Fira Mono', monospace; font-size: 9px; color: inherit;
  background: none; border: none; padding: 0;
}

.sb-nav { padding: 12px 0 32px; flex: 1; }

.sb-group { margin-bottom: 4px; }
.sb-pillar {
  display: flex; align-items: center; gap: 6px;
  font-family: 'Space Grotesk', sans-serif; font-size: 8.5px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(255,255,255,0.50); padding: 12px 16px 4px;
}
.sb-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

.sb-item {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 16px; text-decoration: none;
  border-left: 2px solid transparent;
  transition: background 0.12s, border-color 0.12s;
}
.sb-item:hover { background: rgba(255,255,255,0.05); }
.sb-item--active {
  background: color-mix(in srgb, var(--ac) 10%, transparent) !important;
  border-left-color: var(--ac);
}
.sb-icon { flex-shrink: 0; color: rgba(255,255,255,0.3); transition: color 0.12s; }
.sb-item--active .sb-icon { color: var(--ac); }
.sb-label {
  font-family: 'DM Sans', sans-serif; font-size: 12.5px;
  color: rgba(255,255,255,0.55); transition: color 0.12s;
  line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sb-item:hover .sb-label { color: rgba(255,255,255,0.85); }
.sb-item--active .sb-label { color: white; font-weight: 600; }

/* ── Main ─────────────────────────────────────────── */
.tool-main { flex: 1; min-width: 0; }

/* ── Fixed Prev / Next ────────────────────────────── */
.pn-fixed {
  position: fixed; top: 50%; z-index: 50;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px 10px 10px;
  background: #13131a; border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; text-decoration: none;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s, opacity 0.2s;
  opacity: 0.55; max-width: 180px;
}
.pn-fixed:hover {
  border-color: var(--pc); opacity: 1;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px var(--pc);
}

.pn-fixed--prev {
  left: 244px; transform: translateY(-50%); /* 236px sidebar + 8px gap */
  flex-direction: row;
}
.pn-fixed--prev:hover { transform: translateY(-50%) translateX(3px); }

.pn-fixed--next {
  right: 8px; transform: translateY(-50%);
  flex-direction: row-reverse;
}
.pn-fixed--next:hover { transform: translateY(-50%) translateX(-3px); }

.pn-fixed-arrow {
  width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--pc) 15%, transparent);
  color: var(--pc); transition: background 0.15s;
}
.pn-fixed:hover .pn-fixed-arrow { background: color-mix(in srgb, var(--pc) 25%, transparent); }

.pn-fixed-info {
  display: flex; flex-direction: column; gap: 2px;
  overflow: hidden; min-width: 0;
}
.pn-fixed-info--right { text-align: right; }

.pn-fixed-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.45);
}
.pn-fixed-title {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: rgba(255,255,255,0.6); line-height: 1.3;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: color 0.15s;
}
.pn-fixed:hover .pn-fixed-title { color: white; }

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .pn-fixed { display: none; }
  .pn-fixed--prev { left: 8px; }
}
</style>
