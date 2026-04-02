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
            <NuxtLink to="/dashboard" class="nav-link">Dashboard</NuxtLink>
            <UserButton :appearance="clerkAppearance" :user-profile-props="{ appearance: clerkAppearance }" />
          </template>
          <template v-else>
            <NuxtLink to="/pricing" class="nav-link">Pricing</NuxtLink>
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
