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
				<span class="text-sm font-bold text-gray-600">Filtrer par :</span>
				<UButton
					v-for="cat in categories"
					:key="cat.value"
					:variant="selectedCategory === cat.value ? 'solid' : 'soft'"
					:color="selectedCategory === cat.value ? 'primary' : 'neutral'"
					size="sm"
					:label="cat.label"
					@click="selectedCategory = cat.value"
					:class="selectedCategory === cat.value ? 'bg-[#7FD857] text-[#0F1729]' : ''"
				/>
			</div>
		</UContainer>

		<!-- Liste des actualités -->
		<UContainer class="pb-16">

			<div v-if="filteredActualites.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<NuxtLink
					v-for="actualite in filteredActualites"
					:key="actualite.id"
					:to="`/posts/${actualite.slug}`"
					class="group"
				>
					<article class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">

						<div class="relative h-56 overflow-hidden">
							<img
								:src="actualite.image"
								:alt="actualite.title"
								class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
							/>
							<Tag
								:label="actualite.category"
								:color="getCategoryColor(actualite.category)"
								size="md"
								variant="solid"
								class="absolute top-4 left-4 shadow-lg"
							/>
							<div v-if="actualite.featured" class="absolute top-4 right-4">
								<Tag label="À la une" color="#F59E0B" size="sm" variant="solid" icon="i-heroicons-star" />
							</div>
						</div>

						<div class="p-6 flex-grow flex flex-col">
							<div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
								<div class="flex items-center gap-2">
									<UIcon name="i-heroicons-calendar" class="w-4 h-4" />
									<span>{{ formatDate(actualite.date) }}</span>
								</div>
								<div class="flex items-center gap-2">
									<UIcon name="i-heroicons-user" class="w-4 h-4" />
									<span>{{ actualite.author.name }}</span>
								</div>
							</div>

							<h2 class="text-xl font-bold text-[#0F1729] mb-3 line-clamp-2 group-hover:text-[#7FD857] transition-colors">
								{{ actualite.title }}
							</h2>

							<p class="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
								{{ actualite.excerpt }}
							</p>

							<div class="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-100">
								<Tag
									v-for="tag in actualite.tags.slice(0, 3)"
									:key="tag"
									:label="tag"
									color="#6B7280"
									size="xs"
									variant="soft"
								/>
							</div>

							<div class="flex items-center gap-2 text-[#7FD857] font-bold text-sm mt-4 group-hover:gap-3 transition-all">
								<span>Lire la suite</span>
								<UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
							</div>
						</div>
					</article>
				</NuxtLink>
			</div>

			<div v-else class="text-center py-16 bg-white rounded-3xl shadow-lg">
				<UIcon name="i-heroicons-newspaper" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
				<p class="text-gray-500 text-lg mb-2">Aucune actualité trouvée</p>
				<p class="text-gray-400 text-sm">Essayez de changer les filtres</p>
			</div>

			<div v-if="filteredActualites.length > 9" class="flex justify-center mt-12">
				<UPagination
					v-model="currentPage"
					:page-count="pageSize"
					:total="filteredActualites.length"
				/>
			</div>

		</UContainer>

	</div>
</template>

<script setup lang="ts">
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
const actualites = await getPosts('actualite')

const selectedCategory = ref<string>('all')
const currentPage = ref(1)
const pageSize = 9

const categories = computed(() => {
	const cats = new Set(actualites.map((a: any) => a.category))
	return [
		{ label: 'Toutes', value: 'all' },
		...Array.from(cats).map((cat: any) => ({ label: cat, value: cat }))
	]
})

const sortedActualites = computed(() =>
	[...actualites].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
)

const filteredActualites = computed(() => {
	if (selectedCategory.value === 'all') return sortedActualites.value
	return sortedActualites.value.filter((a: any) => a.category === selectedCategory.value)
})

const formatDate = (date: string) =>
	new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

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

useSeo({
	blok: props.blok,
	title: props.blok.seo_title || 'Actualités',
	description: props.blok.seo_description || 'Suivez toute l\'actualité du club l\'ASC Escalade : événements, compétitions, nouveautés et vie du club d\'escalade.',
})
</script>
