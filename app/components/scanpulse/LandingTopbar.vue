<script setup lang="ts">
const router = useRouter()

const emit = defineEmits<{ cta: [sectionIndex: number] }>()

function goTo(index: number) {
  // scroll to section index via parent-provided scroll container
  const event = new CustomEvent('scroll-to-section', { detail: index, bubbles: true })
  document.dispatchEvent(event)
}

const navLinks = [
  { label: 'Coverage', section: 1 },
  { label: 'How it works', section: 2 },
  { label: 'Pricing', section: 4 },
  { label: 'FAQ', section: 6 },
]
</script>

<template>
  <header
    class="sticky top-0 z-40 px-[80px] pl-[140px] py-[18px] flex items-center justify-between"
    style="background: rgba(7,7,10,0.75); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.04);"
  >
    <!-- Logo -->
    <Logo size="20" />

    <!-- Nav -->
    <nav class="flex items-center gap-7" aria-label="Main navigation">
      <template v-for="link in navLinks" :key="link.label">
        <button
          class="font-display font-medium text-white/70 text-sm cursor-pointer bg-transparent border-none p-0 transition-colors duration-150 hover:text-white"
          @click="goTo(link.section)"
        >
          {{ link.label }}
        </button>
      </template>

      <a
        href="/sign-in"
        class="font-display font-medium text-white/70 text-sm no-underline transition-colors duration-150 hover:text-white"
      >
        Sign in
      </a>

      <NuxtLink
        to="/sign-up"
        class="inline-flex items-center gap-2 bg-primary text-white font-display font-semibold rounded-[9px] transition-all duration-200 hover:bg-[#f14b95] hover:scale-[1.02] active:scale-[0.98]"
        style="height: 38px; padding: 0 18px; font-size: 14px; letter-spacing: 0.02em;"
      >
        Start free
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </NuxtLink>
    </nav>
  </header>
</template>