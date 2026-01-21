<script setup lang="ts">
import type { Post } from '~/types/post'
import Tag from '~/components/ui/Tag.vue'

const route = useRoute()
const slug = route.params.slug as string

// Récupération du post par slug
const { getPostBySlug, getPosts } = usePosts()
const post = await getPostBySlug(slug)

// Redirection si le post n'existe pas
if (!post) {
	throw createError({
		statusCode: 404,
		statusMessage: 'Article non trouvé'
	})
}

// Posts similaires du même type
const allPosts = await getPosts(post.type)
const relatedPosts = computed(() => {
	return allPosts
			.filter(p => p.id !== post.id)
			.slice(0, 3)
})

// Navigation précédent/suivant
const currentIndex = allPosts.findIndex(p => p.id === post.id)
const previousPost = computed(() => currentIndex > 0 ? allPosts[currentIndex - 1] : null)
const nextPost = computed(() => currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null)

// Fonctions utilitaires
const formatDate = (date: string) => {
	return new Date(date).toLocaleDateString('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	})
}

const getCategoryColor = (category: string) => {
	const colors: Record<string, string> = {
		'Falaise': '#7FD857',
		'Bloc': '#4ECDC4',
		'Stage': '#9333EA',
		'Climb Up': '#F97316',
		'Cime Altitude': '#2563EB',
		'Infrastructure': '#7FD857',
		'Compétition': '#EF4444',
		'Événement': '#F59E0B',
		'Club': '#3B82F6',
		'Formation': '#8B5CF6'
	}
	return colors[category] || '#7FD857'
}

const getDifficultyColor = (difficulty?: string) => {
	if (!difficulty) return '#6B7280'
	const colors: Record<string, string> = {
		'Débutant': '#10B981',
		'Intermédiaire': '#F59E0B',
		'Confirmé': '#EF4444',
		'Expert': '#7C3AED'
	}
	return colors[difficulty] || '#6B7280'
}

// Meta tags
useHead({
	title: post.title,
	meta: [
		{ name: 'description', content: post.excerpt },
		{ property: 'og:title', content: post.title },
		{ property: 'og:description', content: post.excerpt },
		{ property: 'og:image', content: post.image },
	]
})
</script>

<template>
	<div class="min-h-screen bg-gray-50">

		<!-- Hero avec image -->
		<div class="relative h-[60vh] overflow-hidden">
			<img
					:src="post.image"
					:alt="post.title"
					class="absolute inset-0 w-full h-full object-cover"
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

			<!-- Breadcrumb -->
			<div class="absolute top-0 left-0 right-0 pt-24">
				<UContainer>
					<nav class="flex items-center gap-2 text-white/80 text-sm mb-4">
						<NuxtLink to="/" class="hover:text-white transition-colors">Accueil</NuxtLink>
						<UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
						<NuxtLink
								:to="post.type === 'sortie' ? '/sorties' : '/'"
								class="hover:text-white transition-colors"
						>
							{{ post.type === 'sortie' ? 'Sorties' : 'Actualités' }}
						</NuxtLink>
						<UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
						<span class="text-white">{{ post.title }}</span>
					</nav>
				</UContainer>
			</div>

			<!-- Contenu Hero -->
			<div class="absolute bottom-0 left-0 right-0 pb-12">
				<UContainer>
					<!-- Tag catégorie -->
					<Tag
							:label="post.category"
							:color="getCategoryColor(post.category)"
							size="md"
							variant="solid"
							class="mb-4"
					/>

					<!-- Titre -->
					<h1 class="text-4xl md:text-5xl font-bold text-white mb-4 max-w-4xl">
						{{ post.title }}
					</h1>

					<!-- Meta informations -->
					<div class="flex flex-wrap items-center gap-4 text-white/90">
						<div class="flex items-center gap-2">
							<UAvatar
									:alt="post.author.name"
									size="sm"
									class="bg-[#7FD857]"
							>
								{{ post.author.name.split(' ').map(n => n[0]).join('').toUpperCase() }}
							</UAvatar>
							<span class="font-medium">{{ post.author.name }}</span>
						</div>

						<div class="flex items-center gap-2">
							<UIcon name="i-heroicons-calendar" class="w-5 h-5" />
							<span>{{ formatDate(post.date) }}</span>
						</div>

						<div v-if="post.location" class="flex items-center gap-2">
							<UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
							<span>{{ post.location }}</span>
						</div>

						<div v-if="post.difficulty" class="flex items-center gap-2">
							<UIcon name="i-heroicons-signal" class="w-5 h-5" />
							<span>{{ post.difficulty }}</span>
						</div>
					</div>
				</UContainer>
			</div>
		</div>

		<!-- Contenu principal -->
		<UContainer class="py-12">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

				<!-- Contenu de l'article -->
				<div class="lg:col-span-2">
					<div class="bg-white rounded-3xl shadow-lg p-8 md:p-12">

						<!-- Contenu riche -->
						<div class="prose prose-lg max-w-none" v-html="post.content"></div>

						<!-- Tags -->
						<div class="mt-8 pt-8 border-t border-gray-200">
							<h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
								Tags
							</h3>
							<div class="flex flex-wrap gap-2">
								<Tag
										v-for="tag in post.tags"
										:key="tag"
										:label="tag"
										color="#7FD857"
										size="sm"
										variant="soft"
								/>
							</div>
						</div>

						<!-- Partage -->
						<div class="mt-8 pt-8 border-t border-gray-200">
							<h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
								Partager
							</h3>
							<div class="flex gap-3">
								<UButton
										icon="i-heroicons-share"
										color="neutral"
										variant="soft"
										size="lg"
										label="Facebook"
								/>
								<UButton
										icon="i-heroicons-share"
										color="neutral"
										variant="soft"
										size="lg"
										label="Twitter"
								/>
								<UButton
										icon="i-heroicons-link"
										color="neutral"
										variant="soft"
										size="lg"
										label="Copier"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Sidebar -->
				<div class="lg:col-span-1">

					<!-- Card Inscription (pour les sorties) -->
					<div v-if="post.type === 'sortie'" class="bg-white rounded-3xl shadow-lg p-6 mb-6 sticky top-24">
						<h3 class="text-xl font-bold text-[#0F1729] mb-4">Informations</h3>

						<div class="space-y-4 mb-6">
							<div v-if="post.price" class="flex justify-between items-center pb-3 border-b border-gray-100">
								<span class="text-gray-600">Tarif</span>
								<span class="text-2xl font-bold text-[#7FD857]">{{ post.price }}€</span>
							</div>

							<div v-if="post.maxParticipants" class="flex justify-between items-center pb-3 border-b border-gray-100">
								<span class="text-gray-600">Places</span>
								<span class="font-bold text-gray-900">
                  {{ post.currentParticipants }} / {{ post.maxParticipants }}
                </span>
							</div>

							<div v-if="post.difficulty" class="flex justify-between items-center pb-3 border-b border-gray-100">
								<span class="text-gray-600">Niveau</span>
								<Tag
										:label="post.difficulty"
										:color="getDifficultyColor(post.difficulty)"
										size="sm"
										variant="subtle"
								/>
							</div>

							<div class="flex justify-between items-center pb-3">
								<span class="text-gray-600">Date</span>
								<span class="font-medium text-gray-900">{{ formatDate(post.date) }}</span>
							</div>
						</div>

						<!-- Progression des places -->
						<div v-if="post.maxParticipants && post.currentParticipants" class="mb-6">
							<div class="h-2 bg-gray-100 rounded-full overflow-hidden">
								<div
										class="h-full bg-[#7FD857] transition-all duration-300"
										:style="{ width: `${(post.currentParticipants / post.maxParticipants) * 100}%` }"
								></div>
							</div>
							<p class="text-xs text-gray-500 mt-2">
								{{ post.maxParticipants - post.currentParticipants }} place(s) restante(s)
							</p>
						</div>

						<UButton
								size="xl"
								block
								class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold"
								icon="i-heroicons-check"
								:disabled="post.currentParticipants && post.maxParticipants && post.currentParticipants >= post.maxParticipants"
						>
							{{ (post.currentParticipants && post.maxParticipants && post.currentParticipants >= post.maxParticipants) ? 'Complet' : 'S\'inscrire' }}
						</UButton>

						<p class="text-xs text-gray-500 text-center mt-3">
							Réservé aux membres du club
						</p>
					</div>

					<!-- Card Contact (pour les actualités) -->
					<div v-else class="bg-[#0F1729] rounded-3xl shadow-lg p-6 mb-6 text-white sticky top-24">
						<h3 class="text-xl font-bold mb-2">Une question ?</h3>
						<p class="text-white/80 mb-6">
							Contactez-nous pour plus d'informations
						</p>
						<UButton
								to="/contact"
								size="lg"
								block
								class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold"
								icon="i-heroicons-envelope"
						>
							Nous contacter
						</UButton>
					</div>

					<!-- Articles similaires -->
					<div v-if="relatedPosts.length > 0" class="bg-white rounded-3xl shadow-lg p-6">
						<h3 class="text-xl font-bold text-[#0F1729] mb-4">
							{{ post.type === 'sortie' ? 'Autres sorties' : 'Autres actualités' }}
						</h3>

						<div class="space-y-4">
							<NuxtLink
									v-for="related in relatedPosts"
									:key="related.id"
									:to="`/posts/${related.slug}`"
									class="block group"
							>
								<div class="flex gap-3">
									<img
											:src="related.image"
											:alt="related.title"
											class="w-20 h-20 object-cover rounded-lg"
									/>
									<div class="flex-1 min-w-0">
										<h4 class="font-bold text-sm text-gray-900 group-hover:text-[#7FD857] transition-colors line-clamp-2 mb-1">
											{{ related.title }}
										</h4>
										<p class="text-xs text-gray-500">{{ formatDate(related.date) }}</p>
									</div>
								</div>
							</NuxtLink>
						</div>
					</div>

				</div>

			</div>
		</UContainer>

		<!-- Navigation Précédent/Suivant -->
		<UContainer v-if="previousPost || nextPost" class="py-12">
			<div class="bg-white rounded-3xl shadow-lg p-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<NuxtLink
							v-if="previousPost"
							:to="`/posts/${previousPost.slug}`"
							class="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
					>
						<UIcon name="i-heroicons-arrow-left" class="w-6 h-6 text-gray-400 group-hover:text-[#7FD857] transition-colors flex-shrink-0" />
						<div class="flex-1 min-w-0">
							<p class="text-xs text-gray-500 uppercase font-bold mb-1">Précédent</p>
							<h4 class="font-bold text-gray-900 group-hover:text-[#7FD857] transition-colors truncate">
								{{ previousPost.title }}
							</h4>
						</div>
					</NuxtLink>

					<NuxtLink
							v-if="nextPost"
							:to="`/posts/${nextPost.slug}`"
							class="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group text-right md:ml-auto"
					>
						<div class="flex-1 min-w-0 text-left md:text-right">
							<p class="text-xs text-gray-500 uppercase font-bold mb-1">Suivant</p>
							<h4 class="font-bold text-gray-900 group-hover:text-[#7FD857] transition-colors truncate">
								{{ nextPost.title }}
							</h4>
						</div>
						<UIcon name="i-heroicons-arrow-right" class="w-6 h-6 text-gray-400 group-hover:text-[#7FD857] transition-colors flex-shrink-0" />
					</NuxtLink>
				</div>
			</div>
		</UContainer>

	</div>
</template>

<style scoped>
:deep(.prose) {
	color: #374151;
}

:deep(.prose h2) {
	color: #0F1729;
	font-size: 1.75rem;
	font-weight: 700;
	margin-top: 2rem;
	margin-bottom: 1rem;
}

:deep(.prose h3) {
	color: #0F1729;
	font-size: 1.25rem;
	font-weight: 600;
	margin-top: 1.5rem;
	margin-bottom: 0.75rem;
}

:deep(.prose p) {
	margin-bottom: 1rem;
	line-height: 1.75;
}

:deep(.prose ul) {
	list-style: disc;
	padding-left: 1.5rem;
	margin-bottom: 1rem;
}

:deep(.prose li) {
	margin-bottom: 0.5rem;
}
</style>
