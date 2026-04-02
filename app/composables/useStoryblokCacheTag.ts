/**
 * Ajoute un header Netlify-Cache-Tag sur la réponse SSR
 * pour permettre l'invalidation ciblée du cache CDN.
 *
 * Ne fait rien côté client ni en mode dev.
 *
 * @param slugs - Un ou plusieurs slugs Storyblok à tagger (ex: 'accueil', 'posts/mon-article')
 */
export const useStoryblokCacheTag = (...slugs: string[]) => {
  if (!import.meta.server) return

  const event = useRequestEvent()
  if (!event) return

  const tags = slugs
    .filter(Boolean)
    .map(slug => `storyblok-${slug.replace(/^\/+|\/+$/g, '')}`)

  if (tags.length === 0) return

  // Récupère les tags déjà présents pour les combiner
  const existing = event.node.res.getHeader('Netlify-Cache-Tag') as string | undefined
  const allTags = existing ? `${existing},${tags.join(',')}` : tags.join(',')

  event.node.res.setHeader('Netlify-Cache-Tag', allTags)
}
