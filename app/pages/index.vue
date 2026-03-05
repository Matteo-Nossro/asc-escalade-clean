<template>
	<div>
		<HomeHero
				v-if="homeContent?.hero"
				:content="homeContent.hero"
				document-id="homeContent"
		/>
		<HomeActualites
				v-if="homeContent?.actualites?.enabled"
				:content="homeContent.actualites"
				:encode-data-attribute="encodeDataAttribute"
		/>
		<HomeProchainsEvenements
				v-if="homeContent?.evenements?.enabled"
				:content="homeContent.evenements"
				:encode-data-attribute="encodeDataAttribute"
		/>
		<HomeCtaRejoindre
				v-if="homeContent?.cta?.enabled"
				:content="homeContent.cta"
				:encode-data-attribute="encodeDataAttribute"
		/>
	</div>
</template>

<script setup lang="ts">
const { perspective } = useSanityPreview()

const query = groq`*[_type == "homeContent"][0] {
  _id,
  _type,
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
//
// // ✨ Utiliser encodeDataAttribute de useSanityQuery
// const { data: homeContent, encodeDataAttribute } = await useSanityQuery(query, {}, {
// 	perspective: perspective.value,
// 	useCdn: false
// })




const { data: homeContent } = await useSanityQuery(query, {}, {
	perspective: perspective.value,
	useCdn: false
})
// console.log('Test encode:', encodeDataAttribute)

</script>
