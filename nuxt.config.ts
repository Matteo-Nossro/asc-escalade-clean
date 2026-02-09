// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    dataValue: 'light',
    classSuffix: ''
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  // Configuration Sanity uniquement
  runtimeConfig: {
    // Variables publiques (accessibles côté client et serveur)
    public: {
      sanityProjectId: process.env.NUXT_PUBLIC_SANITY_PROJECT_ID || '',
      sanityDataset: process.env.NUXT_PUBLIC_SANITY_DATASET || 'production',
      sanityApiVersion: process.env.NUXT_PUBLIC_SANITY_API_VERSION || '2024-02-09',
    }
  }
})
