// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      link: [
        // Preconnect for Google Fonts — eliminates render-blocking DNS + TLS round trips
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        // Preload critical body font — DM Sans 400 (all other fonts use font-display:swap)
        {
          rel: 'preload',
          as: 'font',
          crossorigin: '',
          href: 'https://fonts.gstatic.com/s/dmsans/v15/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K4.woff2',
          type: 'font/woff2',
        },
        { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
        // DNS prefetch for Convex cloud (exact subdomain varies per project)
        { rel: 'dns-prefetch', href: 'https://convex.cloud' },
      ],
      meta: [
        // Default Twitter Card type — individual pages set twitter:image via useSeoMeta
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@scanpulse' },
      ],
    },
  },

  modules: [
    '@primevue/nuxt-module',
    '@nuxtjs/tailwindcss',
    '@clerk/nuxt',
    '@nuxt/content',
  ],

  primevue: {
    options: {
      theme: 'none', // using Tailwind for styling
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      convexUrl: process.env.NUXT_PUBLIC_CONVEX_URL,
    },
  },

  clerk: {
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
    afterSignInUrl: '/dashboard',
    afterSignUpUrl: '/dashboard',
  },
})
