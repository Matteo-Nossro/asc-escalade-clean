<template>
  <UApp>
    <LayoutHeader />
    <UMain>
      <NuxtPage />
    </UMain>
    <LayoutFooter />
  </UApp>
</template>

<script setup>
const colorMode = useColorMode()
colorMode.preference = 'light'

// DEBUG TEMPORAIRE
const storyblokApi = useStoryblokApi()
const { data, error } = await useAsyncData('debug-config', async () => {
  const response = await storyblokApi.get('cdn/stories/global/site-config', {
    version: 'draft'
  })
  return response.data
})

console.log('✅ Data:', data.value)
console.log('❌ Error:', error.value)
</script>
