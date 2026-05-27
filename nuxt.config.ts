// https://nuxt.com/docs/api/configuration/nuxt-config

import mkcert from "vite-plugin-mkcert";

const isDev = process.env.NODE_ENV === 'development'

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@storyblok/nuxt', '@nuxt/image', '@nuxtjs/supabase', '@nuxtjs/sitemap'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://asc-escalade.fr',
    name: 'ASC Escalade',
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: ['/login', '/callback', '/admin/**'],
  },

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
        { name: 'color-scheme', content: 'light' },
        { property: 'og:site_name', content: 'ASC Escalade' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        // Preconnect vers les origines critiques (réduit le TTFB Storyblok de ~300ms)
        { rel: 'preconnect', href: 'https://api.storyblok.com' },
        { rel: 'preconnect', href: 'https://a.storyblok.com' },
        // Préchargement de la police principale Public Sans (chemin stable car basé sur le contenu du fichier)
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/_fonts/GsKUclqeNLJ96g5AU593ug6yanivOiwjW_7zESNPChw-jHA4tBeM1bjF7LATGUpfBuSTyomIFrWBTzjF7txVYfg.woff2', crossorigin: 'anonymous' },
        // DNS prefetch pour Umami (analytics non critique)
        { rel: 'dns-prefetch', href: 'https://api-gateway.umami.dev' },
        { rel: 'dns-prefetch', href: 'https://cloud.umami.is' },
      ],
        script: [
           {
          defer: true,
          src: 'https://cloud.umami.is/script.js',
          'data-website-id': '14e7efde-22ce-4be5-b6f3-b0b0bb5acfbe',
        },
      ],
    },
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    secretKey: process.env.SUPABASE_SECRET_KEY || '',
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
    '/': { isr: true, sitemap: { priority: 1.0, changefreq: 'weekly' } },
    '/club': { isr: true, sitemap: { priority: 0.8, changefreq: 'monthly' } },
    '/tarifs': { isr: true, sitemap: { priority: 0.8, changefreq: 'monthly' } },
    '/contact': { isr: true, sitemap: { priority: 0.8, changefreq: 'monthly' } },
    '/sorties': { isr: true, sitemap: { priority: 0.8, changefreq: 'monthly' } },
    '/actualites': { isr: true, sitemap: { priority: 0.8, changefreq: 'monthly' } },
    '/posts/**': { isr: true, sitemap: { priority: 0.6, changefreq: 'never' } },
    // Redirections 301 — restructuration URLs de l'ancien site (nouveaux chemins)
    '/actualites/**': { redirect: { to: '/posts/**', statusCode: 301 } },
    '/sorties/**': { redirect: { to: '/posts/**', statusCode: 301 } },
    // Redirections 301 — ancien site www.escalade-chevigny.fr → pages club
    '/le-club-p21.html': { redirect: { to: '/club', statusCode: 301 } },
    '/presentation-p35.html': { redirect: { to: '/club', statusCode: 301 } },
    '/le-staff-p33.html': { redirect: { to: '/club', statusCode: 301 } },
    '/lebureau-p31.html': { redirect: { to: '/club', statusCode: 301 } },
    '/le-mur-p24.html': { redirect: { to: '/club', statusCode: 301 } },
    '/evolutiondumur-p36.html': { redirect: { to: '/club', statusCode: 301 } },
    '/anneespassees-p37.html': { redirect: { to: '/club', statusCode: 301 } },
    '/l-asc-escalade-est-labellise-ffme-sport-sante-p27.html': { redirect: { to: '/club', statusCode: 301 } },
    '/reglement-p38.html': { redirect: { to: '/club', statusCode: 301 } },
    '/violences-p40.html': { redirect: { to: '/club', statusCode: 301 } },
    // Redirections 301 — ancien site → tarifs
    '/tarifs-inscription-p29.html': { redirect: { to: '/tarifs', statusCode: 301 } },
    '/horaires-des-entrainements-p32.html': { redirect: { to: '/tarifs', statusCode: 301 } },
    // Redirections 301 — ancien site → contact
    '/nous-contacter-p1.html': { redirect: { to: '/contact', statusCode: 301 } },
    '/plan-d-acces-p2.html': { redirect: { to: '/contact', statusCode: 301 } },
    // Redirections 301 — ancien site → sorties
    '/sorties-falaise-pour-les-adultes-asc-escalade-p26.html': { redirect: { to: '/sorties', statusCode: 301 } },
    // Redirections 301 — ancien site → actualités (liste + pagination)
    '/actualites-p6.html': { redirect: { to: '/actualites', statusCode: 301 } },
    // Pages non indexées
    '/login': { sitemap: false },
    '/callback': { sitemap: false },
    '/admin/**': { sitemap: false },
    // En-têtes de sécurité sur toutes les routes publiques
    '/**': {
      headers: {
        // X-Frame-Options retiré : incompatible avec le live preview Storyblok (iframe depuis app.storyblok.com)
        // On utilise CSP frame-ancestors à la place, qui supporte les allowlists de domaines
        'Content-Security-Policy': "frame-ancestors 'self' https://app.storyblok.com",
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'X-Content-Type-Options': 'nosniff',
      }
    }
  },

    devServer: {
    https: isDev,
  },
  runtimeConfig: {
    storyblokWebhookSecret: process.env.STORYBLOK_WEBHOOK_SECRET || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    public: {
      storyblokVersion: process.env.STORYBLOK_VERSION || 'published',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://asc-escalade.fr',
    }
  },

  vite: {
    plugins: isDev ? [mkcert()] : [],
  },
})