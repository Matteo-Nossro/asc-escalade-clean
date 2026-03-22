<script setup>
const route = useRoute()
const slug = route.params.slug

const runtimeConfig = useRuntimeConfig()
const version = runtimeConfig.public.storyblokVersion || 'published'

const story = await useAsyncStoryblok(
  slug && slug.length > 0 ? slug.join('/') : 'accueil',
  { version },
)
</script>

<template>
  <div>
    <StoryblokComponent v-if="story" :blok="story.content" />
    <div v-else>
      <!-- debug temporaire : à supprimer après -->
      <p>Story non trouvée - slug: {{ $route.params.slug }}</p>
    </div>
  </div>
</template>