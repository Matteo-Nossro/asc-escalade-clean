// composables/usePosts.ts
import type { Post } from '~/types/post'

// NB : le rendu rich-text (renderRichText) tire tout l'éditeur Storyblok (~250 Ko).
// Les vues liste (accueil, actualités, sorties) n'affichent que titre/excerpt/image :
// on ne rend donc PAS `content` ici. Le corps d'article est rendu dans posts/[slug].vue.

export const usePosts = (versionOverride?: 'draft' | 'published') => {
  const storyblokApi = useStoryblokApi()
  const version: 'draft' | 'published' = versionOverride
    ?? ((useRuntimeConfig().public.storyblokVersion as 'draft' | 'published') || 'published')

  const getPosts = async (type?: 'sortie' | 'actualite'): Promise<Post[]> => {
    const params: Record<string, any> = {
      version,
      starts_with: 'posts/',
      sort_by: 'content.date:desc',
      per_page: 100
    }

    if (type) {
      params.filter_query = {
        type: { in: type }
      }
    }

    const { data } = await storyblokApi.get('cdn/stories', params)

    return data.stories.map((story: any): Post => ({
      id: story.id,
      slug: story.slug,
      type: story.content.type,
      title: story.content.title,
      excerpt: story.content.excerpt,
      content: '',
      image: story.content.image?.filename ?? '',
      category: story.content.category,
      date: story.content.date,
      author: {
        name: story.content.authorName,
        avatar: story.content.authorAvatar
      },
      tags: story.content.tags ?? [],
      location: story.content.location,
      maxParticipants: story.content.maxParticipants,
      currentParticipants: story.content.currentParticipants,
      price: story.content.price,
      difficulty: story.content.difficulty,
      featured: story.content.featured ?? false,
      eventDate: story.content.eventDate
    }))
  }

  const getPostBySlug = async (slug: string): Promise<Post | null> => {
    try {
      const { data } = await storyblokApi.get(`cdn/stories/posts/${slug}`, {
        version,
      })
      const story = data.story
      return {
        id: story.id,
        slug: story.slug,
        type: story.content.type,
        title: story.content.title,
        excerpt: story.content.excerpt,
        content: '',
        image: story.content.image?.filename ?? '',
        category: story.content.category,
        date: story.content.date,
        author: {
          name: story.content.authorName,
          avatar: story.content.authorAvatar
        },
        tags: story.content.tags ?? [],
        location: story.content.location,
        maxParticipants: story.content.maxParticipants,
        currentParticipants: story.content.currentParticipants,
        price: story.content.price,
        difficulty: story.content.difficulty,
        featured: story.content.featured ?? false,
        eventDate: story.content.eventDate
      }
    } catch (e) {
      console.error('[usePosts] getPostBySlug error:', e)
      return null
    }
  }

  return { getPosts, getPostBySlug }
}
