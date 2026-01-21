<template>
	<div class="min-h-screen bg-gray-50 relative pb-32 overflow-hidden">

		<!-- DÉCO FOND (Triangles gris) -->
		<svg class="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 1440 800" fill="none" preserveAspectRatio="none">
			<path d="M-100 0 L600 800 L1500 0 Z" fill="#F3F4F6"/>
			<path d="M1200 800 L800 0 L1600 0 Z" fill="#E5E7EB" opacity="0.5"/>
		</svg>

		<UContainer class="relative z-10 page-content bg-gray-50">

			<SortiesHeader />
			<SortiesConcept />
			<SortiesListeSorties :sorties="sorties" />

			<!-- Lien Footer discret -->
			<div class="text-center mt-20">
				<a target="_blank"  href="https://www.ffme.fr/" class="text-gray-400 hover:text-gray-600 text-m flex items-center justify-center gap-1 transition-colors hover:text-[#7FD857]">
					Consulter les infos falaises sur le site FFME
					<UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
				</a>
			</div>

		</UContainer>

	</div>
</template>


<script setup lang="ts">
// Récupération des sorties via le composable
const { getPosts } = usePosts()
const sorties = await getPosts('sortie')

// Meta tags
useHead({
	title: 'Sorties & Stages - Vertical Pulse',
	meta: [
		{ name: 'description', content: 'Découvrez nos sorties en falaise, stages et événements d\'escalade organisés par Vertical Pulse.' }
	]
})
</script>