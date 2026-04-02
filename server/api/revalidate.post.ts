import { purgeCache } from '@netlify/functions'

/**
 * Endpoint de revalidation ISR appelé par le webhook Storyblok.
 *
 * - Vérifie le secret partagé via le header `webhook-secret`
 * - Extrait le full_slug de la story modifiée depuis le body
 * - Purge le cache Netlify CDN pour le tag correspondant
 * - Si pas de slug, purge tout le cache en fallback
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // --- Vérification du secret ---
  const secret = getHeader(event, 'webhook-secret')
  if (!secret || secret !== config.storyblokWebhookSecret) {
    console.warn('[revalidate] Secret invalide ou manquant')
    throw createError({ statusCode: 401, statusMessage: 'Secret invalide' })
  }

  // --- Extraction du slug depuis le payload Storyblok ---
  const body = await readBody(event)
  const fullSlug: string | undefined =
    body?.story?.full_slug ?? body?.full_slug

  if (fullSlug) {
    const tag = `storyblok-${fullSlug.replace(/^\/+|\/+$/g, '')}`
    console.log(`[revalidate] Purge du cache pour le tag : ${tag}`)
    await purgeCache({ tags: [tag] })
  } else {
    // Fallback : purge globale si on ne peut pas identifier la page
    console.log('[revalidate] Pas de slug — purge globale du cache')
    await purgeCache()
  }

  return { status: 202, purged: fullSlug || 'all' }
})
