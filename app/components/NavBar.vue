<script setup lang="ts">
const { isSignedIn } = useAuth()
const clerkAppearance = useClerkAppearance()
</script>

<template>
  <header class="fixed top-0 inset-x-0 z-50">

    <!-- Three-pillar identity strip -->
    <div class="flex h-[2px]">
      <div class="flex-1" style="background:#00d4aa" />
      <div class="flex-1" style="background:#ffaa00" />
      <div class="flex-1" style="background:#6c5ce7" />
    </div>

    <!-- Main bar -->
    <div class="relative overflow-hidden" style="background:rgba(7,7,10,0.96);border-bottom:1px solid rgba(255,255,255,0.055)">

      <!-- Animated scan line on bottom edge -->
      <div class="scan-sweep" />

      <div class="w-full px-16 xl:px-24 h-[60px] flex items-center justify-between gap-8">

        <!-- ── Logo ── -->
        <NuxtLink to="/" class="flex items-center gap-2.5 shrink-0 group">
          <Logo class="w-[30px] h-[30px]" :animate="false" />
          <span
            class="font-display font-bold text-white tracking-[-0.025em]"
            style="font-size:17px"
          >ScanPulse</span>
        </NuxtLink>

        <!-- ── Center: live status ── -->
        <div class="hidden md:flex items-center gap-2">
          <div class="live-ring">
            <div class="live-core" />
          </div>
          <span
            class="font-display text-white/30 tracking-[0.1em] uppercase"
            style="font-size:11px"
          >3,847 scans today</span>
        </div>

        <!-- ── Right: actions ── -->
        <div class="flex items-center gap-5 shrink-0">
          <template v-if="isSignedIn">
            <NuxtLink to="/pricing" class="nav-link">Pricing</NuxtLink>
            <NuxtLink to="/tools" class="nav-link">Tools</NuxtLink>
            <NuxtLink to="/dashboard" class="nav-link">Dashboard</NuxtLink>
            <NuxtLink to="/settings" class="nav-icon" aria-label="Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
            </NuxtLink>
            <UserButton :appearance="clerkAppearance" :user-profile-props="{ appearance: clerkAppearance }" />
          </template>
          <template v-else>
            <NuxtLink to="/pricing" class="nav-link">Pricing</NuxtLink>
            <NuxtLink to="/tools" class="nav-link">Tools</NuxtLink>
            <NuxtLink to="/sign-in" class="nav-link">Sign in</NuxtLink>
            <NuxtLink
              to="/sign-up"
              class="scan-btn"
            >
              <span>Scan now</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="btn-arrow">
                <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </NuxtLink>
          </template>
        </div>

      </div>
    </div>
  </header>
</template>

<style scoped>
/* ── Scan sweep animation ─────────────────────────────── */
.scan-sweep {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent 0%,
    transparent 40%,
    rgba(236, 53, 134, 0.9) 50%,
    transparent 60%,
    transparent 100%
  );
  background-size: 300% 100%;
  animation: scanSweep 4s ease-in-out infinite;
}

@keyframes scanSweep {
  0%   { background-position: 200% center; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { background-position: -100% center; opacity: 0; }
}

/* ── Live pulse ring ──────────────────────────────────── */
.live-ring {
  position: relative;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.live-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(0, 212, 170, 0.35);
  animation: ringPulse 2s ease-out infinite;
}
.live-core {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #00d4aa;
}

@keyframes ringPulse {
  0%   { transform: scale(0.7); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* ── Nav link ─────────────────────────────────────────── */
.nav-link {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.42);
  letter-spacing: 0.01em;
  transition: color 0.15s ease;
  text-decoration: none;
}
.nav-link:hover {
  color: rgba(255, 255, 255, 0.9);
}

/* ── Settings icon link ───────────────────────────────── */
.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.35);
  transition: color 0.15s ease;
  text-decoration: none;
}
.nav-icon:hover {
  color: rgba(255, 255, 255, 0.8);
}

/* ── Scan now button ──────────────────────────────────── */
.scan-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #ec3586;
  color: white;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  padding: 9px 18px;
  border-radius: 3px;
  transition: background 0.15s ease, transform 0.15s ease;
}
.scan-btn:hover {
  background: #d42e77;
  transform: translateY(-1px);
}
.scan-btn:hover .btn-arrow {
  transform: translateX(2px);
}
.btn-arrow {
  transition: transform 0.15s ease;
  flex-shrink: 0;
}
</style>
