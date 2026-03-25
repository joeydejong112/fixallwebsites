// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@primevue/nuxt-module',
    '@nuxtjs/tailwindcss',
    '@clerk/nuxt',
  ],

  primevue: {
    options: {
      theme: 'none', // using Tailwind for styling
    },
  },

  runtimeConfig: {
    public: {
      convexUrl: process.env.NUXT_PUBLIC_CONVEX_URL,
    },
  },
})
