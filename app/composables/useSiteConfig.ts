export const useSiteConfig = async () => {
  const storyblokApi = useStoryblokApi()
  
  const { data } = await useAsyncData('site-config', async () => {
    try {
      const response = await storyblokApi.get('cdn/stories/global/site-config', {
        version: 'draft'
      })
      return response.data.story?.content || null
    } catch (e) {
      // Silencieux → le header/footer affichera les valeurs par défaut
      return null
    }
  })

  return data
}
