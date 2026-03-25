<script setup lang="ts">
const props = defineProps<{ animate?: boolean; class?: string }>()

onMounted(async () => {
  if (props.animate === false) return
  const anime = (await import('animejs')).default
  anime({ targets: '.radar-sweep', rotate: 360, duration: 4000, easing: 'linear', loop: true })
  anime({ targets: '.pulse-ring', scale: [1, 2], opacity: [0.5, 0], duration: 2000, easing: 'easeOutCubic', loop: true, delay: (_: Element, i: number) => i * 600 })
  anime({ targets: '.logo-center', scale: [1, 1.15, 1], duration: 1500, easing: 'easeInOutSine', loop: true })
})
</script>

<template>
  <svg
    viewBox="0 0 48 48"
    :class="props.class ?? 'w-10 h-10'"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ec3586" />
        <stop offset="100%" stop-color="#ff5fa3" />
      </linearGradient>
      <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ec3586" stop-opacity="0" />
        <stop offset="50%" stop-color="#ec3586" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#ec3586" stop-opacity="0" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="22" fill="#12121a" stroke="#2a2a3a" stroke-width="1" />
    <circle class="pulse-ring" cx="24" cy="24" r="8" fill="none" stroke="#ec3586" stroke-width="1" opacity="0.5" />
    <circle class="pulse-ring" cx="24" cy="24" r="8" fill="none" stroke="#ec3586" stroke-width="1" opacity="0.5" />
    <circle cx="24" cy="24" r="8"  fill="none" stroke="#2a2a3a" stroke-width="0.5" />
    <circle cx="24" cy="24" r="14" fill="none" stroke="#2a2a3a" stroke-width="0.5" />
    <circle cx="24" cy="24" r="20" fill="none" stroke="#2a2a3a" stroke-width="0.5" />
    <line x1="24" y1="4"  x2="24" y2="44" stroke="#2a2a3a" stroke-width="0.5" />
    <line x1="4"  y1="24" x2="44" y2="24" stroke="#2a2a3a" stroke-width="0.5" />
    <g class="radar-sweep" style="transform-origin: 24px 24px">
      <path d="M24 24 L24 4 A20 20 0 0 1 44 24 Z" fill="url(#sweepGrad)" opacity="0.3" />
      <line x1="24" y1="24" x2="24" y2="4" stroke="#ec3586" stroke-width="1.5" />
    </g>
    <circle class="logo-center" cx="24" cy="24" r="4" fill="url(#logoGrad)" />
    <circle cx="32" cy="16" r="2"   fill="#00d4aa" opacity="0.8" />
    <circle cx="14" cy="30" r="1.5" fill="#ffaa00" opacity="0.8" />
    <circle cx="36" cy="32" r="1.5" fill="#6c5ce7" opacity="0.8" />
  </svg>
</template>
