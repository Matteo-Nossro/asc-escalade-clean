// https://nuxt.com/docs/api/configuration/nuxt-config

import mkcert from "vite-plugin-mkcert";

const isDev = process.env.NODE_ENV === 'development'

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@storyblok/nuxt', '@nuxt/image', '@nuxtjs/supabase'],

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'ASC Escalade',
      meta: [
        {
          name: 'description',
          content: "Club d'escalade de Chevigny-Saint-Sauveur. Séances en salle et en falaise pour tous les niveaux.",
        },
        { property: 'og:site_name', content: 'ASC Escalade' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    redirect: false,
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: true,
    },
  },

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

  ssr: true,

  routeRules: {
    // Pages de contenu Storyblok — ISR avec revalidation on-demand via Netlify
    '/': { isr: true },
    '/club': { isr: true },
    '/tarifs': { isr: true },
    '/contact': { isr: true },
    '/sorties': { isr: true },
    '/actualites': { isr: true },
    '/posts/**': { isr: true },
    // Pages dynamiques (admin, login, profil…) — pas d'ISR
  },

    devServer: {
    https: isDev,
  },
  runtimeConfig: {
    // Secret partagé avec le webhook Storyblok pour l'invalidation du cache
    storyblokWebhookSecret: process.env.STORYBLOK_WEBHOOK_SECRET || '',
    public: {
      storyblokVersion: process.env.STORYBLOK_VERSION || 'published'
    }
  },

  vite: {
    plugins: isDev ? [mkcert()] : [],
  },
})