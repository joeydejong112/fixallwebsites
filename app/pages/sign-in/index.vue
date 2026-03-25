<script setup lang="ts">
const appearance = useClerkAppearance()
</script>

<template>
  <div class="min-h-screen bg-dark flex items-center justify-center relative">
    <!-- Grid bg -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="background-image:
        linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),
        linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px);
        background-size:64px 64px"
    />
    <!-- Pink glow behind card -->
    <div class="absolute pointer-events-none" style="top:20%;left:50%;transform:translateX(-50%);width:500px;height:400px;background:radial-gradient(ellipse at 50% 40%,rgba(236,53,134,0.07) 0%,transparent 70%)" />

    <div class="relative z-10 w-full max-w-md px-6">
      <!-- Logo -->
      <div class="flex items-center gap-3 justify-center mb-8">
        <Logo class="w-8 h-8" />
        <span class="font-display font-bold text-white" style="font-size:1.15rem;letter-spacing:-0.02em">ScanPulse</span>
      </div>
      <SignIn :appearance="appearance" />
    </div>
  </div>
</template>
