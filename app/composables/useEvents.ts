// composables/useEvents.ts
export const useEvents = () => {
  const storyblokApi = useStoryblokApi()

  const getEvents = async () => {
    const { data } = await storyblokApi.get('cdn/stories', {
      version: 'published',
      starts_with: 'evenements/',
      sort_by: 'content.date:asc',
      per_page: 100
    })

    return data.stories.map((story: any) => ({
      id: story.id,
      slug: story.slug,
      title: story.content.title,
      date: story.content.date,     // format YYYY-MM-DD
      time: story.content.time,     // format HH:MM
      category: story.content.category
    }))
  }

  return { getEvents }
}
