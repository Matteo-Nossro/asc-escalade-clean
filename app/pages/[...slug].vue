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

// Cache tag Netlify pour l'invalidation ISR ciblée
const resolvedSlug = slug && slug.length > 0 ? slug.join('/') : 'accueil'
useStoryblokCacheTag(resolvedSlug)

// SEO : lit seo_title / seo_description / seo_og_image depuis le blok Storyblok
// Ces champs sont à ajouter sur chaque content-type de page dans Storyblok.
// En leur absence, les valeurs par défaut du site sont utilisées.
if (story.value) {
  useSeo({ blok: story.value.content })
}
</script>

<template>
  <StoryblokComponent v-if="story" :blok="story.content" />
</template>