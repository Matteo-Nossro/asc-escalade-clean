<template>
	<div v-editable="blok" class="min-h-screen bg-gray-50">

		<!-- Bloks statiques (Header, etc.) -->
		<StoryblokComponent
			v-for="currentBlok in blok.body"
			:key="currentBlok._uid"
			:blok="currentBlok"
		/>

		<!-- Filtres -->
		<UContainer class="py-8">
			<div class="flex flex-wrap items-center gap-3">
				<span class="text-sm font-bold text-gray-600">Catégorie :</span>
				<UButton
					v-for="cat in categories"
					:key="cat.value"
					:variant="selectedCategory === cat.value ? 'solid' : 'soft'"
					:color="selectedCategory === cat.value ? 'primary' : 'neutral'"
					size="sm"
					:label="cat.label"
					@click="selectedCategory = cat.value; currentPage = 1"
					:class="selectedCategory === cat.value ? 'bg-[#7FD857] text-[#0F1729]' : ''"
				/>
			</div>
		</UContainer>

		<!-- Grille d'articles -->
		<UContainer class="pb-16">

			<div v-if="paginatedPosts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<NuxtLink
					v-for="post in paginatedPosts"
					:key="post.id"
					:to="`/posts/${post.slug}`"
					class="group"
				>
					<article class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">

						<!-- Image + badges -->
						<div class="relative h-56 overflow-hidden">
							<img
								:src="post.image"
								:alt="post.title"
								class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
							/>
							<Tag
								:label="post.category"
								:color="getCategoryColor(post.category)"
								size="md"
								variant="solid"
								class="absolute top-4 left-4 shadow-lg"
							/>
							<!-- Badge date d'événement -->
							<div v-if="post.eventDate" class="absolute bottom-4 left-4">
								<div class="bg-[#0F1729] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
									<UIcon name="i-heroicons-calendar-days" class="w-3.5 h-3.5 text-[#7FD857]" />
									{{ formatDate(post.eventDate.split(' ')[0]) }}
								</div>
							</div>
						</div>

						<!-- Contenu -->
						<div class="p-6 flex-grow flex flex-col">

							<!-- Meta date + auteur -->
							<div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
								<div class="flex items-center gap-2">
									<UIcon name="i-heroicons-calendar" class="w-4 h-4" />
									<span>{{ formatDate(post.date) }}</span>
								</div>
								<div v-if="post.type === 'actualite' && post.author?.name" class="flex items-center gap-2">
									<UIcon name="i-heroicons-user" class="w-4 h-4" />
									<span>{{ post.author.name }}</span>
								</div>
							</div>

							<h2 class="text-xl font-bold text-[#0F1729] mb-3 line-clamp-2 group-hover:text-[#7FD857] transition-colors">
								{{ post.title }}
							</h2>

							<!-- Infos spécifiques aux sorties -->
							<div v-if="post.type === 'sortie'" class="space-y-2 mb-4 flex-grow">
								<div v-if="post.location" class="flex items-center gap-2 text-sm text-gray-600">
									<UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-[#7FD857] flex-shrink-0" />
									<span>{{ post.location }}</span>
								</div>
								<div v-if="post.difficulty" class="flex items-center gap-2 text-sm text-gray-600">
									<UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-[#7FD857] flex-shrink-0" />
									<span>{{ post.difficulty }}</span>
								</div>
								<div v-if="post.price" class="flex items-center gap-2 text-sm text-gray-600">
									<UIcon name="i-heroicons-currency-euro" class="w-4 h-4 text-[#7FD857] flex-shrink-0" />
									<span class="font-bold">{{ post.price }}€</span>
								</div>
							</div>

							<!-- Infos spécifiques aux actualités -->
							<template v-if="post.type === 'actualite'">
								<p class="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">{{ post.excerpt }}</p>
								<div class="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
									<Tag
										v-for="tag in post.tags.slice(0, 3)"
										:key="tag"
										:label="tag"
										color="#6B7280"
										size="xs"
										variant="soft"
									/>
								</div>
							</template>

							<!-- CTA -->
							<div class="mt-auto pt-4 flex items-center justify-between">
								<template v-if="post.type === 'sortie'">
									<span class="text-xs text-gray-500">
										{{ getRemainingPlaces(post) }} place(s) restante(s)
									</span>
									<span
										class="px-4 py-2 rounded-lg text-sm font-bold"
										:class="isFullyBooked(post) ? 'bg-gray-200 text-gray-500' : 'bg-[#0F1729] text-white'"
									>
										{{ isFullyBooked(post) ? 'Complet' : 'S\'inscrire' }}
									</span>
								</template>
								<template v-else>
									<div class="flex items-center gap-2 text-[#7FD857] font-bold text-sm group-hover:gap-3 transition-all">
										<span>Lire la suite</span>
										<UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
									</div>
								</template>
							</div>

						</div>
					</article>
				</NuxtLink>
			</div>

			<div v-else class="text-center py-16 bg-white rounded-3xl shadow-lg">
				<UIcon name="i-heroicons-newspaper" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
				<p class="text-gray-500 text-lg mb-2">Aucun article trouvé</p>
				<p class="text-gray-400 text-sm">Essayez de changer les filtres</p>
			</div>

			<div v-if="filteredPosts.length > pageSize" class="flex justify-center mt-12">
				<UPagination
					v-model="currentPage"
					:page-count="pageSize"
					:total="filteredPosts.length"
				/>
			</div>

		</UContainer>

	</div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Tag from '~/components/ui/Tag.vue'
import { useSeo } from '../../composables/useSeo'

const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

const { getPosts } = usePosts()
const allPosts = await getPosts()

const selectedCategory = ref('all')
const currentPage = ref(1)
const pageSize = 9

const categories = computed(() => {
	const cats = new Set(allPosts.map(p => p.category).filter(Boolean))
	return [
		{ label: 'Toutes', value: 'all' },
		...Array.from(cats).map(cat => ({ label: cat, value: cat }))
	]
})

const sortedPosts = computed(() =>
	[...allPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
)

const filteredPosts = computed(() => {
	if (selectedCategory.value === 'all') return sortedPosts.value
	return sortedPosts.value.filter(p => p.category === selectedCategory.value)
})

const paginatedPosts = computed(() => {
	const start = (currentPage.value - 1) * pageSize
	return filteredPosts.value.slice(start, start + pageSize)
})

const formatDate = (date) =>
	new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const getCategoryColor = (category) => {
	const colors = {
		'Infrastructure': '#7FD857',
		'Compétition': '#EF4444',
		'Événement': '#F59E0B',
		'Club': '#3B82F6',
		'Formation': '#8B5CF6',
		'Falaise': '#7FD857',
		'Sortie Falaise': '#7FD857',
		'Bloc': '#4ECDC4',
		'Stage': '#9333EA',
		'Climb Up': '#F97316',
		'Cime Altitude': '#2563EB'
	}
	return colors[category] || '#7FD857'
}

const getRemainingPlaces = (post) => {
	if (!post.maxParticipants) return '?'
	return Math.max(0, post.maxParticipants - (post.currentParticipants ?? 0))
}

const isFullyBooked = (post) => {
	if (!post.maxParticipants) return false
	return (post.currentParticipants ?? 0) >= post.maxParticipants
}

useSeo({
	blok: props.blok,
	title: props.blok.seo_title || 'Actualités & Sorties',
	description: props.blok.seo_description || 'Suivez toute l\'actualité du club ASC Escalade : événements, sorties, compétitions, nouveautés et vie du club.',
})
</script>
