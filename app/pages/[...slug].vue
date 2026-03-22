<script setup>
const route = useRoute()
const slug = route.params.slug

// Si on est dans l'éditeur Storyblok, utilise draft
const isInEditor = !!route.query._storyblok

const { story } = await useAsyncStoryblok(
  slug && slug.length > 0 ? slug.join('/') : 'accueil',
  {
    api: {
      version: isInEditor ? 'draft' : 'published',
    },
    bridge: {},
  },
)
</script>

<template>
  <StoryblokComponent v-if="story" :blok="story.content" />
</template>