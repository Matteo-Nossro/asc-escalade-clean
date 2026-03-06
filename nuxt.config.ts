// https://nuxt.com/docs/api/configuration/nuxt-config

import mkcert from "vite-plugin-mkcert";

export default defineNuxtConfig({
  modules: ['@nuxt/ui','@storyblok/nuxt'],

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  storyblok: {
      bridge: true,
      accessToken: process.env.STORYBLOK_TOKEN,
      apiOptions: {
        region: process.env.STORYBLOK_REGION || "eu",
        endpoint: process.env.STORYBLOK_API_BASE_URL
          ? `${new URL(process.env.STORYBLOK_API_BASE_URL).origin}/v2`
          : undefined,
      },
    },

  colorMode: {
    preference: 'light', // Mode par défaut
    fallback: 'light', // Mode de repli
    // Optionnel : empêcher l'utilisateur de changer de mode
    dataValue: 'light',
    classSuffix: ''
  },
  css: ['~/assets/css/main.css'],

  ssr:true,
  
  routeRules: {
    '/': { prerender: true }
  },

    devServer: {
    https: true,
  },

  vite: {
    plugins: [mkcert()],
  },
})
