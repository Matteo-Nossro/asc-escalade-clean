/**
 * Route dynamique pour /robots.txt.
 * Prend le dessus sur public/robots.txt grâce à la priorité des routes Nitro.
 * Le domaine du sitemap vient de la variable d'environnement NUXT_PUBLIC_SITE_URL.
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = (config.public.siteUrl as string) || 'https://asc-escalade.fr'

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /login',
    'Disallow: /callback',
    'Disallow: /api/',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ].join('\n')
})
