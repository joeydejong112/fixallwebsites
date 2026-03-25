<script setup lang="ts">
const { isSignedIn } = useAuth()
</script>

<template>
  <nav class="fixed top-0 inset-x-0 z-50 border-b border-dark-border bg-dark/80 backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-3">
        <Logo class="w-9 h-9" />
        <span class="font-display font-bold text-lg text-white">ScanPulse</span>
      </NuxtLink>

      <div class="flex items-center gap-3">
        <SignedIn>
          <NuxtLink to="/dashboard" class="btn-ghost text-sm">Dashboard</NuxtLink>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <NuxtLink to="/sign-in" class="btn-ghost text-sm">Sign in</NuxtLink>
          <NuxtLink to="/sign-up" class="btn-primary text-sm py-2">Get started free</NuxtLink>
        </SignedOut>
      </div>
    </div>
  </nav>
</template>
