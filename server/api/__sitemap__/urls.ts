/**
 * Source dynamique pour @nuxtjs/sitemap.
 * Récupère depuis l'API CDN Storyblok :
 *   - les posts (posts/*) → /posts/:slug
 *   - les pages Storyblok (content_type: 'page', hors accueil/admin)
 */

interface StoryblokStory {
  slug: string
  full_slug: string
  published_at: string | null
}

interface StoryblokResponse {
  stories: StoryblokStory[]
}

const EXCLUDED_SLUGS = new Set(['accueil', 'login', 'callback'])

export default defineEventHandler(async () => {
  const token = process.env.STORYBLOK_TOKEN
  const region = process.env.STORYBLOK_REGION || 'eu'
  const apiBase =
    region === 'us'
      ? 'https://api-us.storyblok.com/v2/cdn/stories'
      : 'https://api.storyblok.com/v2/cdn/stories'

  const urls: { loc: string; lastmod?: string; priority?: number; changefreq?: string }[] = []

  // Posts
  try {
    const data = await $fetch<StoryblokResponse>(apiBase, {
      params: { token, version: 'published', starts_with: 'posts/', per_page: 100 }
    })
    for (const story of data.stories) {
      urls.push({
        loc: `/posts/${story.slug}`,
        priority: 0.6,
        changefreq: 'never',
        ...(story.published_at ? { lastmod: story.published_at } : {})
      })
    }
  } catch (err) {
    console.error('[sitemap] Erreur lors de la récupération des posts Storyblok:', err)
  }

  // Pages Storyblok (hors accueil, login, callback, admin)
  try {
    const data = await $fetch<StoryblokResponse>(apiBase, {
      params: { token, version: 'published', content_type: 'page', per_page: 100 }
    })
    for (const story of data.stories) {
      if (EXCLUDED_SLUGS.has(story.slug)) continue
      if (story.full_slug.startsWith('admin/')) continue
      urls.push({
        loc: `/${story.full_slug}`,
        priority: 0.5,
        changefreq: 'monthly',
        ...(story.published_at ? { lastmod: story.published_at } : {})
      })
    }
  } catch (err) {
    console.error('[sitemap] Erreur lors de la récupération des pages Storyblok:', err)
  }

  return urls
})
