<script setup lang="ts">
const route = useRoute()
const slug = String(route.params.slug)

const { data: post } = await useAsyncData(`blog-${slug}`, () =>
  queryCollection('blog').where('slug', '==', slug).first()
)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

const { origin } = useRequestURL()
const canonicalUrl = `${origin}/blog/${slug}`

useSeoMeta({
  title: `${post.value.title} — ScanPulse`,
  description: post.value.description,
  ogTitle: post.value.title,
  ogDescription: post.value.description,
  ogType: 'article',
  articlePublishedTime: post.value.date,
  articleAuthor: post.value.author,
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.value.title,
        description: post.value.description,
        datePublished: post.value.date,
        author: { '@type': 'Organization', name: post.value.author },
        publisher: { '@type': 'Organization', name: 'ScanPulse' },
        url: canonicalUrl,
      }),
    },
  ],
})

const pillarColors: Record<string, string> = {
  Security: '#00d4aa',
  Performance: '#ffaa00',
  SEO: '#6c5ce7',
  Accessibility: '#a29bfe',
  'AI Readiness': '#ff7675',
  DNS: '#74b9ff',
  Trust: '#fd79a8',
}

const pillarColor = computed(() => pillarColors[post.value?.pillar ?? ''] ?? '#ec3586')
</script>

<template>
  <div class="min-h-screen" style="background:#07070a;padding-top:60px">
    <article class="w-full px-6 md:px-16 xl:px-24 py-14 max-w-[860px]">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 mb-8 font-body text-sm" style="color:rgba(255,255,255,0.35)">
        <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
        <span>/</span>
        <NuxtLink to="/blog" class="hover:text-white transition-colors">Blog</NuxtLink>
        <span>/</span>
        <span style="color:rgba(255,255,255,0.6)">{{ post!.title }}</span>
      </nav>

      <!-- Pillar + meta row -->
      <div class="flex items-center gap-3 mb-5">
        <span
          class="font-display text-[10px] font-semibold tracking-[0.15em] uppercase px-2 py-0.5 rounded-sm"
          :style="`color:${pillarColor};background:${pillarColor}18`"
        >{{ post!.pillar }}</span>
        <span class="font-body text-white/30 text-xs">{{ post!.readingTime }}</span>
        <span class="font-body text-white/30 text-xs">{{ post!.date }}</span>
      </div>

      <!-- Title -->
      <h1
        class="font-display font-bold text-white mb-6"
        style="font-size:clamp(1.75rem,3.5vw,2.5rem);line-height:1.22;letter-spacing:-0.03em"
      >{{ post!.title }}</h1>

      <!-- Divider -->
      <div class="mb-10" style="height:1px;background:rgba(255,255,255,0.07)" />

      <!-- Body -->
      <div class="prose-scanpulse">
        <ContentRenderer :value="post!" />
      </div>

      <!-- Footer nav -->
      <div class="mt-14 pt-8 flex items-center justify-between" style="border-top:1px solid rgba(255,255,255,0.07)">
        <NuxtLink to="/blog" class="font-display text-xs font-semibold tracking-[0.1em] uppercase transition-colors hover:text-white" style="color:rgba(255,255,255,0.4)">
          ← All articles
        </NuxtLink>
        <NuxtLink to="/" class="font-display text-xs font-semibold tracking-[0.1em] uppercase transition-colors" :style="`color:${pillarColor}`">
          Run a free scan →
        </NuxtLink>
      </div>

    </article>
  </div>
</template>

<style>
/* Prose styles for blog post body */
.prose-scanpulse {
  color: rgba(255, 255, 255, 0.72);
  font-family: 'DM Sans', sans-serif;
  font-size: 1.0rem;
  line-height: 1.75;
}

.prose-scanpulse h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: #fff;
  margin-top: 2.5rem;
  margin-bottom: 0.75rem;
  letter-spacing: -0.02em;
}

.prose-scanpulse h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 1.0625rem;
  color: #fff;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
}

.prose-scanpulse p {
  margin-bottom: 1.25rem;
}

.prose-scanpulse a {
  color: #ec3586;
  text-decoration: none;
  transition: opacity 0.15s;
}
.prose-scanpulse a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.prose-scanpulse strong {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.prose-scanpulse code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.875em;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 0.1em 0.4em;
  color: #00d4aa;
}

.prose-scanpulse pre {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}

.prose-scanpulse pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.78);
}

.prose-scanpulse ul,
.prose-scanpulse ol {
  padding-left: 1.5rem;
  margin-bottom: 1.25rem;
}

.prose-scanpulse li {
  margin-bottom: 0.4rem;
}

.prose-scanpulse blockquote {
  border-left: 3px solid #ec3586;
  padding-left: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  margin: 1.5rem 0;
}

.prose-scanpulse table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.9rem;
}

.prose-scanpulse th {
  text-align: left;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  padding: 0.6rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.prose-scanpulse td {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.65);
}

.prose-scanpulse tr:last-child td {
  border-bottom: none;
}

.prose-scanpulse hr {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  margin: 2rem 0;
}
</style>
