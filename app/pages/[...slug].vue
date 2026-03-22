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
    <!-- Debug temporaire -->
    <pre style="background:yellow;padding:10px;">
      story: {{ !!story }}
      component: {{ story?.content?.component }}
    </pre>

    <StoryblokComponent v-if="story" :blok="story.content" />
  </div>
</template>