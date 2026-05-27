// composables/useEvents.ts
export const useEvents = () => {
  const storyblokApi = useStoryblokApi()

  const getEvents = async () => {
    const { data } = await storyblokApi.get('cdn/stories', {
      version: (useRuntimeConfig().public.storyblokVersion as 'draft' | 'published') || 'published',
      starts_with: 'posts/',
      per_page: 100
    })

    return data.stories.filter((story: any) => !!story.content.eventDate).map((story: any) => {
      const [date, time] = story.content.eventDate.split(' ')
      return {
        id: story.id,
        slug: story.slug,
        type: story.content.type ?? 'actualite',
        title: story.content.title,
        date,                          // "2026-03-13"
        time: time ?? null,            // "10:30" ou null si absent
        category: story.content.category
      }
    })
  }

  return { getEvents }
}
