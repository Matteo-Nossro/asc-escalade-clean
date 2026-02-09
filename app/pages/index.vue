<template>
	<div>
		<HomeHero v-if="homeContent?.hero" :content="homeContent.hero" />
		<HomeActualites v-if="homeContent?.actualites?.enabled" :content="homeContent.actualites" />
		<HomeProchainsEvenements v-if="homeContent?.evenements?.enabled" :content="homeContent.evenements" />
		<HomeCtaRejoindre v-if="homeContent?.cta?.enabled" :content="homeContent.cta" />
	</div>
</template>

<script setup lang="ts">
const query = groq`*[_type == "homeContent"][0] {
  hero {
    surtitle,
    title,
    titleHighlight,
    subtitle,
    backgroundImage {
      asset-> {
        _ref,
        url
      }
    },
    primaryButtonText,
    primaryButtonLink,
    secondaryButtonText,
    secondaryButtonLink
  },
  actualites {
    enabled,
    title,
    subtitle,
    limit
  },
  evenements {
    enabled,
    title,
    subtitle,
    limit
  },
  cta {
    enabled,
    title,
    subtitle,
    buttonText,
    buttonLink,
    backgroundImage {
      asset-> {
        _ref,
        url
      }
    }
  }
}`

const { data: homeContent } = await useSanityQuery(query)
</script>
