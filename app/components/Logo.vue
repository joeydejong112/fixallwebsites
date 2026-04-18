<script setup lang="ts">
const props = defineProps<{ animate?: boolean; class?: string }>()
const shouldAnimate = computed(() => props.animate !== false)
</script>

<template>
  <svg
    viewBox="0 0 48 48"
    :class="props.class ?? 'w-10 h-10'"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="ScanPulse"
  >
    <defs>
      <!-- Glow filter for the pulse line -->
      <filter id="sp-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <!-- Gradient for background card -->
      <radialGradient id="sp-bg-grad" cx="50%" cy="0%" r="80%">
        <stop offset="0%"   stop-color="#1e0d14"/>
        <stop offset="100%" stop-color="#0a0a0f"/>
      </radialGradient>
      <!-- Gradient for the pulse line itself -->
      <linearGradient id="sp-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#ec3586" stop-opacity="0.2"/>
        <stop offset="35%"  stop-color="#ec3586" stop-opacity="0.7"/>
        <stop offset="55%"  stop-color="#ff6db3" stop-opacity="1"/>
        <stop offset="75%"  stop-color="#ec3586" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#ec3586" stop-opacity="0.2"/>
      </linearGradient>
    </defs>

    <!-- Card background -->
    <rect x="1" y="1" width="46" height="46" rx="10" fill="url(#sp-bg-grad)"/>
    <!-- Card border -->
    <rect x="1" y="1" width="46" height="46" rx="10" fill="none" stroke="rgba(236,53,134,0.22)" stroke-width="1"/>
    <!-- Subtle top sheen -->
    <rect x="1" y="1" width="46" height="12" rx="10" fill="rgba(255,255,255,0.025)"/>

    <!-- Corner brackets — the "scan frame" -->
    <g fill="none" stroke="#ec3586" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
       :class="shouldAnimate ? 'logo-brackets' : ''">
      <!-- top-left -->
      <path d="M8 15 L8 8 L15 8"/>
      <!-- top-right -->
      <path d="M33 8 L40 8 L40 15"/>
      <!-- bottom-left -->
      <path d="M8 33 L8 40 L15 40"/>
      <!-- bottom-right -->
      <path d="M33 40 L40 40 L40 33"/>
    </g>

    <!-- Faint horizontal baseline -->
    <line x1="6" y1="24" x2="42" y2="24"
          stroke="rgba(236,53,134,0.12)" stroke-width="1"
          stroke-dasharray="2 3"/>

    <!-- EKG / heartbeat pulse line -->
    <!--
      Path: flat → small P-wave bump → Q dip → R spike (tall) → S dip → T wave → flat
      Baseline y=24, spike peak y=9, S dip y=33
    -->
    <path
      :class="shouldAnimate ? 'logo-pulse' : ''"
      d="M6,24 L14,24 L15.5,21 L17,24 L18,27 L19.5,24 L21,24 L23,9 L25,33 L27,24 L29,21 L31,24 L42,24"
      fill="none"
      stroke="url(#sp-line-grad)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      filter="url(#sp-glow)"
    />

    <!-- Bright dot at spike peak — the "pulse detected" indicator -->
    <circle
      :class="shouldAnimate ? 'logo-dot' : ''"
      cx="23" cy="9" r="2"
      fill="#ff6db3"
      filter="url(#sp-glow)"
    />
  </svg>
</template>

<style scoped>
/* ── Corner bracket pulse ───────────────────────────── */
.logo-brackets {
  animation: bracket-breathe 3s ease-in-out infinite;
}
@keyframes bracket-breathe {
  0%, 100% { opacity: 0.75; }
  50%       { opacity: 1; }
}

/* ── Pulse line heartbeat glow ──────────────────────── */
.logo-pulse {
  animation: pulse-glow 2s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { opacity: 0.7;  filter: url(#sp-glow); }
  40%       { opacity: 1;    filter: url(#sp-glow); }
  50%       { opacity: 1; }
  60%       { opacity: 0.8; }
}

/* ── Spike dot blink ────────────────────────────────── */
.logo-dot {
  animation: dot-blink 2s ease-in-out infinite;
}
@keyframes dot-blink {
  0%, 30%, 100% { opacity: 0; transform: scale(0.6); }
  45%, 65%      { opacity: 1; transform: scale(1);   }
}

@media (prefers-reduced-motion: reduce) {
  .logo-brackets { animation: none; }
  .logo-pulse { animation: none; }
  .logo-dot { animation: none; }
}
</style>
