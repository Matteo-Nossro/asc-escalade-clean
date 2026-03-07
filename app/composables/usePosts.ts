// composables/usePosts.ts
import type { Post } from '~/types/post'

export const usePosts = () => {
  const storyblokApi = useStoryblokApi()

  const getPosts = async (type?: 'sortie' | 'actualite'): Promise<Post[]> => {
    const params: Record<string, any> = {
      version: 'draft',
      starts_with: 'posts/',
      sort_by: 'content.date:desc',
      per_page: 100
    }

    // Filtre par type directement dans la requête Storyblok
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
      content: renderRichText(story.content.content), // rich text → HTML
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
      featured: story.content.featured ?? false
    }))
  }

  const getPostBySlug = async (slug: string): Promise<Post | null> => {
    try {
      const { data } = await storyblokApi.get(`cdn/stories/posts/${slug}`, {
        version: 'draft'
      })
      const story = data.story
      return {
        id: story.id,
        slug: story.slug,
        type: story.content.type,
        title: story.content.title,
        excerpt: story.content.excerpt,
        content: renderRichText(story.content.content),
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
        featured: story.content.featured ?? false
      }
    } catch {
      return null
    }
  }

  return { getPosts, getPostBySlug }
}
