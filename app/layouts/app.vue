<script setup lang="ts">
// App shell layout: Rail + TopStrip + page content + grid-bg
// Applied via definePageMeta({ layout: 'app' }) on authed routes.
</script>

<template>
  <div class="app-shell">
    <!-- Left rail -->
    <ShellRail />

    <!-- Main area -->
    <div class="app-main">
      <!-- Top strip -->
      <ShellTopStrip />

      <!-- Page content with grid background -->
      <main class="app-content grid-bg" role="main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--canvas);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-content {
  flex: 1;
  position: relative;
  /* Grid overlay — 64px grid, rgba white lines at low opacity */
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
  background-size: 64px 64px;
  background-position: center center;
}
</style>
