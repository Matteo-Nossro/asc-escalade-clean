<script setup>
const slug = useRoute().params.slug;

const { story } = await useAsyncStoryblok(
	slug && slug.length > 0 ? slug.join('/') : 'accueil',
	{
		api: {
			version: 'published',
        // version: 'draft',
		},
		bridge: {},
	},
);
</script>

<template>
	<StoryblokComponent v-if="story" :blok="story.content" />
</template>