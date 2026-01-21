<template>
	<section class="py-20 bg-white">
		<UContainer>
			<!-- En-tête de section avec bouton -->
			<div class="flex items-end justify-between mb-12">
				<div>
					<h2 class="text-3xl font-bold text-[#0F1729]">
						Actualités
					</h2>
					<p class="text-gray-600 mt-2">
						Suivez les dernières nouvelles du club
					</p>
				</div>

				<!-- Bouton Desktop -->
				<UButton
						to="/actualites"
						variant="ghost"
						color="neutral"
						trailing-icon="i-heroicons-arrow-right-20-solid"
						label="Toutes les actualités"
						class="hidden md:flex text-[#0F1729] hover:text-[#7FD857] font-bold"
				/>
			</div>

			<!-- Grille d'actualités -->
			<div v-if="actualites.length > 0" class="grid grid-cols-1 md:grid-cols-12 gap-6">

				<!-- Article Principal (Grande image) - Colonne gauche -->
				<div
						v-if="featuredPost"
						class="md:col-span-8 relative group overflow-hidden rounded-2xl h-[400px]"
				>
					<!-- Image de fond -->
					<img
							:src="featuredPost.image"
							:alt="featuredPost.title"
							class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>

					<!-- Overlay dégradé -->
					<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

					<!-- Contenu -->
					<div class="absolute bottom-0 left-0 p-8 w-full">
						<Tag
								:label="featuredPost.category"
								:color="getCategoryColor(featuredPost.category)"
								size="md"
								variant="solid"
								class="mb-3"
						/>

						<h3 class="text-2xl font-bold text-white mb-2 leading-tight">
							{{ featuredPost.title }}
						</h3>

						<p class="text-gray-200 text-sm line-clamp-2 md:w-3/4">
							{{ featuredPost.excerpt }}
						</p>

						<div class="flex items-center gap-3 text-white/80 text-xs mt-3">
							<UIcon name="i-heroicons-calendar" class="w-4 h-4" />
							<span>{{ formatDate(featuredPost.date) }}</span>
						</div>
					</div>

					<!-- Lien global sur la card -->
					<NuxtLink :to="`/posts/${featuredPost.slug}`" class="absolute inset-0 z-10" />
				</div>

				<!-- Colonne droite - Liste verticale -->
				<div class="md:col-span-4 flex flex-col gap-6 h-[400px]">

					<!-- Article 2 (Petit) -->
					<div
							v-if="secondaryPosts[0]"
							class="bg-[#F5F7FA] rounded-2xl p-6 flex flex-col justify-between h-full relative hover:bg-gray-100 transition-colors"
					>
						<div class="flex justify-between items-start mb-4">
              <span class="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded">
                {{ formatDateShort(secondaryPosts[0].date) }}
              </span>
							<UButton
									icon="i-heroicons-arrow-right"
									variant="ghost"
									color="neutral"
									class="bg-white hover:bg-gray-50 rounded-lg"
							/>
						</div>

						<div>
							<Tag
									:label="secondaryPosts[0].category"
									:color="getCategoryColor(secondaryPosts[0].category)"
									size="sm"
									variant="soft"
									class="mb-2"
							/>

							<h3 class="text-lg font-bold text-[#0F1729] mb-2">
								{{ secondaryPosts[0].title }}
							</h3>
							<p class="text-sm text-gray-600 line-clamp-2">
								{{ secondaryPosts[0].excerpt }}
							</p>
						</div>

						<NuxtLink :to="`/posts/${secondaryPosts[0].slug}`" class="absolute inset-0 z-10" />
					</div>

					<!-- Article 3 (Petit - Dark) -->
					<div
							v-if="secondaryPosts[1]"
							class="bg-[#0F1729] rounded-2xl p-6 flex flex-col justify-between h-full relative group overflow-hidden"
					>
						<!-- Décoration de fond légère -->
						<div class="absolute top-0 right-0 w-24 h-24 bg-[#7FD857] opacity-10 rounded-full blur-2xl -mr-8 -mt-8"></div>

						<div class="flex justify-between items-start mb-4 relative z-10">
              <span class="text-xs font-semibold text-gray-400 border border-gray-700 px-2 py-1 rounded">
                {{ formatDateShort(secondaryPosts[1].date) }}
              </span>
						</div>

						<div class="relative z-10">
							<Tag
									:label="secondaryPosts[1].category"
									:color="getCategoryColor(secondaryPosts[1].category)"
									size="sm"
									variant="soft"
									class="mb-2"
							/>

							<h3 class="text-lg font-bold text-white mb-2 group-hover:text-[#7FD857] transition-colors">
								{{ secondaryPosts[1].title }}
							</h3>
							<p class="text-sm text-gray-400 line-clamp-2">
								{{ secondaryPosts[1].excerpt }}
							</p>
						</div>

						<NuxtLink :to="`/posts/${secondaryPosts[1].slug}`" class="absolute inset-0 z-10" />
					</div>

				</div>

			</div>

			<!-- Message si pas d'actualités -->
			<div v-else class="text-center py-16 bg-gray-50 rounded-2xl">
				<UIcon name="i-heroicons-newspaper" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
				<p class="text-gray-500 text-lg">Aucune actualité pour le moment</p>
			</div>

			<!-- Bouton Mobile "Voir toutes les actualités" -->
			<div class="md:hidden mt-8 text-center">
				<UButton
						to="/actualites"
						block
						variant="outline"
						color="neutral"
						label="Voir toutes les actualités"
						trailing-icon="i-heroicons-arrow-right-20-solid"
						class="border-2 border-[#0F1729] text-[#0F1729] hover:bg-[#0F1729] hover:text-white font-bold"
				/>
			</div>

		</UContainer>
	</section>
</template>

<script setup lang="ts">
import type { Post } from '~/types/post'
import Tag from '~/components/ui/Tag.vue'

// Récupération des 3 dernières actualités
const { getPosts } = usePosts()
const actualites = await getPosts('actualite')

// Trier par date décroissante et prendre les 3 plus récentes
const recentActualites = computed(() => {
	return actualites
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 3)
})

// Article principal (featured) - soit marqué featured, soit le plus récent
const featuredPost = computed(() => {
	return recentActualites.value.find(post => post.featured) || recentActualites.value[0]
})

// Articles secondaires (2 suivants)
const secondaryPosts = computed(() => {
	return recentActualites.value
			.filter(post => post.id !== featuredPost.value?.id)
			.slice(0, 2)
})

// Fonction pour formater la date complète
const formatDate = (date: string) => {
	return new Date(date).toLocaleDateString('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	})
}

// Fonction pour formater la date courte
const formatDateShort = (date: string) => {
	return new Date(date).toLocaleDateString('fr-FR', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	})
}

// Fonction pour obtenir la couleur de la catégorie
const getCategoryColor = (category: string) => {
	const colors: Record<string, string> = {
		'Infrastructure': '#7FD857',
		'Compétition': '#EF4444',
		'Événement': '#F59E0B',
		'Club': '#3B82F6',
		'Formation': '#8B5CF6',
		'Sortie Falaise': '#7FD857'
	}
	return colors[category] || '#7FD857'
}
</script>
