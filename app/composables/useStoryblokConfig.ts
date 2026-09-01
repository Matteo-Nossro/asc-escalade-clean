export const useStoryblokConfig = () => {
  const storyblokApi = useStoryblokApi()

  const { data } = useAsyncData('storyblok-site-config', async () => {
    try {
      const response = await storyblokApi.get('cdn/stories/global/site-config', {
        version: (useRuntimeConfig().public.storyblokVersion as 'draft' | 'published') || 'published',
      })
      return response.data.story?.content || null
    } catch (e) {
      console.warn('[useStoryblokConfig] fetch failed:', e)
      return null
    }
  })

  return data
}
