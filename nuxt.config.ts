// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxtjs/sanity'
  ],

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    dataValue: 'light',
    classSuffix: ''
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    sanityPreviewSecret: process.env.NUXT_SANITY_PREVIEW_SECRET,
  },

  sanity: {
    projectId: process.env.NUXT_PUBLIC_SANITY_PROJECT_ID || 'l2rphl1o',
    dataset: process.env.NUXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-05-15',
    useCdn: false, // Important

    visualEditing: {
      token: process.env.NUXT_SANITY_TOKEN,
      studioUrl: process.env.SANITY_STUDIO_URL || 'http://localhost:3333',
      stega: {
        enabled: true,
        studioUrl: process.env.SANITY_STUDIO_URL || 'http://localhost:3333'
      }
    }
  },

  routeRules: {
    '/': { prerender: true }
  }
})
