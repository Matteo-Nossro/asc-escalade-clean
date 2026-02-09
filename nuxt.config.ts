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

  // Configuration Sanity
  sanity: {
    projectId: process.env.NUXT_PUBLIC_SANITY_PROJECT_ID || '',
    dataset: process.env.NUXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-02-09',

    // Options avancées (optionnel)
    useCdn: true,  // Active le CDN Sanity pour la prod
    visualEditing: {
      studioUrl: 'http://localhost:3333'  // URL de ton studio
    }
  },

  routeRules: {
    '/': { prerender: true }
  }
})
