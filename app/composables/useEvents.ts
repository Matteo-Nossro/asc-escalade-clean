// composables/useEvents.ts
export const useEvents = () => {
  const storyblokApi = useStoryblokApi()

  const getEvents = async () => {
    const { data } = await storyblokApi.get('cdn/stories', {
      version: (useRuntimeConfig().public.storyblokVersion as 'draft' | 'published') || 'published',
      starts_with: 'posts/',
      per_page: 100
    })

    return data.stories.filter((story: any) => !!story.content.eventDate).map((story: any) => ({
      id: story.id,
      slug: story.slug,
      type: story.content.type,
      title: story.content.title,
      date: story.content.eventDate.split(' ')[0],   // "2026-03-13 00:00" → "2026-03-13"
      category: story.content.category
    }))
  }

  return { getEvents }
}
