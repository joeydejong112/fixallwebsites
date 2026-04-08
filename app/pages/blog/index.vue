<script setup lang="ts">
useSeoMeta({
  title: 'Blog — ScanPulse',
  description: 'Guides on website security, performance, SEO, accessibility, and AI readiness. Learn how to fix the issues ScanPulse finds.',
  ogTitle: 'ScanPulse Blog',
  ogDescription: 'Practical guides on fixing website health issues — security headers, WCAG, Core Web Vitals, and AI readiness.',
  ogType: 'website',
})

const { origin, pathname } = useRequestURL()
useHead({
  link: [{ rel: 'canonical', href: origin + pathname }],
})

const { data: posts } = await useAsyncData('blog-list', () =>
  queryCollection('blog').order('date', 'DESC').all()
)

const pillarColors: Record<string, string> = {
  Security: '#00d4aa',
  Performance: '#ffaa00',
  SEO: '#6c5ce7',
  Accessibility: '#a29bfe',
  'AI Readiness': '#ff7675',
  DNS: '#74b9ff',
  Trust: '#fd79a8',
}
</script>

<template>
  <div class="min-h-screen" style="background:#07070a;padding-top:60px">

    <!-- Hero -->
    <section class="w-full px-6 md:px-16 xl:px-24 pt-16 pb-10">
      <p class="font-display text-xs font-semibold tracking-[0.18em] uppercase mb-3" style="color:#ec3586">
        From the ScanPulse team
      </p>
      <h1 class="font-display font-bold text-white mb-4" style="font-size:clamp(2rem,4vw,2.75rem);letter-spacing:-0.03em">
        Website health guides
      </h1>
      <p class="font-body text-white/55 max-w-xl" style="font-size:1.0625rem;line-height:1.65">
        Practical explanations of the checks ScanPulse runs — and how to fix what it finds.
      </p>
    </section>

    <!-- Divider -->
    <div class="w-full px-6 md:px-16 xl:px-24">
      <div style="height:1px;background:rgba(255,255,255,0.06)" />
    </div>

    <!-- Post grid -->
    <section class="w-full px-6 md:px-16 xl:px-24 py-12">
      <div v-if="posts && posts.length" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="post in posts"
          :key="post.slug"
          :to="`/blog/${post.slug}`"
          class="block group rounded-lg p-6 transition-colors duration-150"
          style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07)"
        >
          <!-- Pillar badge -->
          <div class="flex items-center gap-2 mb-4">
            <span
              class="font-display text-[10px] font-semibold tracking-[0.15em] uppercase px-2 py-0.5 rounded-sm"
              :style="`color:${pillarColors[post.pillar] ?? '#ec3586'};background:${pillarColors[post.pillar] ?? '#ec3586'}18`"
            >{{ post.pillar }}</span>
            <span class="font-body text-white/30 text-xs">{{ post.readingTime }}</span>
          </div>

          <!-- Title -->
          <h2
            class="font-display font-semibold text-white mb-2 group-hover:text-[#ec3586] transition-colors duration-150"
            style="font-size:1.0625rem;line-height:1.4;letter-spacing:-0.015em"
          >{{ post.title }}</h2>

          <!-- Description -->
          <p class="font-body text-white/45 text-sm leading-relaxed mb-4">{{ post.description }}</p>

          <!-- Read more -->
          <span class="font-display text-xs font-semibold tracking-[0.1em] uppercase transition-colors duration-150"
            :style="`color:${pillarColors[post.pillar] ?? '#ec3586'}`"
          >
            Read article →
          </span>
        </NuxtLink>
      </div>

      <p v-else class="font-body text-white/40 text-sm">No posts yet.</p>
    </section>

  </div>
</template>
