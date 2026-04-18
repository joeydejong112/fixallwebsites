<script setup lang="ts">
const route = useRoute()

// Dynamic breadcrumb label from route
const breadcrumb = computed(() => {
  const path = route.path
  if (path === '/dashboard') return 'Dashboard'
  if (path.startsWith('/scan')) return `Scan · ${route.params.scanId ?? 'acme.design'}`
  if (path === '/tools') return 'Tools'
  if (path.includes('csp')) return 'Tools · CSP Builder'
  return '—'
})

const scanDomain = ref('https://acme.design')
</script>

<template>
  <header class="top-strip">
    <!-- Logo + breadcrumb -->
    <div class="top-strip-brand">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-label="ScanPulse">
        <circle cx="12" cy="12" r="10" stroke="#ec3586" stroke-width="1.6" />
        <path d="M3 12h4l2-5 3 10 2-6 2 3h5" stroke="#ec3586" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="top-strip-brand-name">scanpulse</span>
      <div class="top-strip-divider" />
      <span class="top-strip-breadcrumb">{{ breadcrumb }}</span>
    </div>

    <!-- Scan input -->
    <div class="top-strip-search">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round">
        <circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" />
      </svg>
      <input
        v-model="scanDomain"
        type="url"
        class="search-input"
        placeholder="https://yoursite.com"
        aria-label="Website URL to scan"
      />
      <button class="btn btn-primary scan-btn">Scan</button>
    </div>

    <!-- Right section -->
    <div class="top-strip-right">
      <!-- Pro badge -->
      <div class="pro-badge">
        <span class="pulse-dot" />
        Pro
      </div>

      <!-- Scans remaining -->
      <span class="scans-count">142 / ∞ scans</span>

      <!-- Avatar -->
      <div class="user-avatar" aria-label="User avatar KM">
        <span>KM</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.top-strip {
  height: 60px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 20px;
  position: sticky;
  top: 0;
  z-index: 9;
}

.top-strip-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.top-strip-brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: -0.04em;
  color: var(--text);
}

.top-strip-divider {
  width: 1px;
  height: 22px;
  background: var(--border);
}

.top-strip-breadcrumb {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 13px;
  color: var(--text-muted);
}

.top-strip-search {
  flex: 1;
  max-width: 520px;
  height: 38px;
  border-radius: 9px;
  background: var(--elevated);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 6px 0 14px;
  gap: 10px;
}

.search-icon {
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text);
  outline: none;
  font-family: var(--font-mono);
  font-size: 13px;
}
.search-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.scan-btn {
  height: 28px;
  padding: 0 14px;
  font-size: 12px;
  flex-shrink: 0;
}

.top-strip-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 14px;
}

.pro-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid rgba(236, 53, 134, 0.3);
  background: var(--brand-soft);
  color: var(--brand);
}

.scans-count {
  font-family: var(--font-display);
  font-size: 13px;
  color: var(--text-muted);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ec3586, #6c5ce7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  color: #fff;
}
</style>
