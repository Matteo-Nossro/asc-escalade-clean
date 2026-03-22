// https://nuxt.com/docs/api/configuration/nuxt-config

import mkcert from "vite-plugin-mkcert";

const isDev = process.env.NODE_ENV === 'development'

export default defineNuxtConfig({
  modules: ['@nuxt/ui','@storyblok/nuxt','@nuxt/image'],

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  storyblok: {
      bridge: true,
      accessToken: process.env.STORYBLOK_TOKEN,
      apiOptions: {
        region: process.env.STORYBLOK_REGION || "eu",
        version: (process.env.STORYBLOK_VERSION as 'draft' | 'published') || 'published',
      },
    },

  image: {
    provider: 'storyblok',
    storyblok: {
      baseURL: 'https://a.storyblok.com' // CDN Storyblok EU
    }
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
  
  routeRules: {},

    devServer: {
    https: isDev,
  },
  runtimeConfig: {
    public: {
      storyblokVersion: process.env.STORYBLOK_VERSION || 'published'
    }
  },

  vite: {
    plugins: isDev ? [mkcert()] : [],
  },
})