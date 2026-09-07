<template>
	<div v-editable="blok" class="min-h-screen relative pb-32 overflow-hidden">

		<!-- Déco fond (triangles gris) -->
		<svg class="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 1440 800" fill="none" preserveAspectRatio="none">
			<path d="M-100 0 L600 800 L1500 0 Z" fill="#F3F4F6"/>
			<path d="M1200 800 L800 0 L1600 0 Z" fill="#E5E7EB" opacity="0.5"/>
		</svg>

		<UContainer class="relative z-10">

			<!-- Bloks statiques (Header, Concept, etc.) -->
			<StoryblokComponent
				v-for="currentBlok in blok.body"
				:key="currentBlok._uid"
				:blok="currentBlok"
			/>

			<!-- Liste des sorties fetchées depuis Storyblok -->
			<div
				v-if="sorties.length > 0"
				class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-8xl mx-auto px-4"
				style="margin-top: 3rem; margin-bottom: 3rem"
			>
				<div
					v-for="sortie in sorties"
					:key="sortie.id"
					class="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
				>
					<NuxtLink :to="`/posts/${sortie.slug}`" class="flex flex-col h-full">

						<div class="relative h-64 w-full bg-gray-200 overflow-hidden">
							<img
								:src="sortie.image"
								:alt="sortie.title"
								class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 block"
								loading="lazy"
							/>
							<Tag
								v-if="sortie.category"
								:label="sortie.category"
								:color="getCategoryColor(sortie.category)"
								size="md"
								variant="solid"
								class="absolute top-4 left-4 shadow-lg z-10"
							/>
						</div>

						<div class="p-6 md:p-8 flex-grow flex flex-col justify-between">
							<div>
								<h3 class="text-xl font-bold text-[#0F1729] mb-6 line-clamp-2 min-h-[3.5rem]">
									{{ sortie.title }}
								</h3>

								<div class="space-y-3 mb-8">
									<div class="flex items-center gap-3 text-sm text-gray-600">
										<UIcon name="i-heroicons-calendar" class="w-5 h-5 text-[#7FD857] flex-shrink-0"/>
										<span>{{ formatDate(sortie.date) }}</span>
									</div>
									<div v-if="sortie.location" class="flex items-center gap-3 text-sm text-gray-600">
										<UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-[#7FD857] flex-shrink-0"/>
										<span>{{ sortie.location }}</span>
									</div>
									<div v-if="sortie.difficulty" class="flex items-center gap-3 text-sm text-gray-600">
										<UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-[#7FD857] flex-shrink-0"/>
										<span>{{ sortie.difficulty }}</span>
									</div>
									<div v-if="sortie.price" class="flex items-center gap-3 text-sm text-gray-600">
										<UIcon name="i-heroicons-currency-euro" class="w-5 h-5 text-[#7FD857] flex-shrink-0"/>
										<span class="font-bold">{{ sortie.price }}€</span>
									</div>
								</div>
							</div>

							<div class="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto">
								<div class="flex flex-col">
									<span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Places</span>
									<span class="text-sm font-bold text-gray-900">
										{{ getRemainingPlaces(sortie) }} restante(s)
									</span>
								</div>
								<UButton
									color="neutral"
									variant="solid"
									size="xl"
									:disabled="isFullyBooked(sortie)"
									class="px-6 font-bold transition-transform active:scale-95"
									:class="isFullyBooked(sortie) ? 'opacity-50 cursor-not-allowed' : ''"
								>
									{{ isFullyBooked(sortie) ? 'Complet' : 'S\'inscrire' }}
								</UButton>
							</div>
						</div>
					</NuxtLink>
				</div>
			</div>

			<!-- Message si aucune sortie -->
			<div v-else class="text-center py-16 bg-white rounded-3xl shadow-lg mx-4" style="margin-top: 3rem">
				<UIcon name="i-heroicons-map" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
				<p class="text-gray-500 text-lg mb-2">Aucune sortie programmée</p>
				<p class="text-gray-400 text-sm">Revenez bientôt pour découvrir nos prochaines sorties</p>
			</div>

			<!-- Lien FFME -->
			<div class="text-center mt-20">
				<a
					target="_blank"
					href="https://www.ffme.fr/"
					class="text-gray-400 hover:text-gray-600 text-m flex items-center justify-center gap-1 transition-colors hover:text-[#7FD857]"
				>
					Consulter les infos falaises sur le site FFME
					<UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
				</a>
			</div>

		</UContainer>
	</div>
</template>

<script setup lang="ts">
import Tag from '~/components/ui/Tag.vue'
import { useSeo } from '../../composables/useSeo'

const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

const { getPosts } = usePosts()
const sorties = await getPosts('sortie')

const formatDate = (date: string) =>
	new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const getCategoryColor = (category: string) => {
	const colors: Record<string, string> = {
		'Falaise': '#7FD857',
		'Bloc': '#4ECDC4',
		'Stage': '#9333EA',
		'Climb Up': '#F97316',
		'Cime Altitude': '#2563EB'
	}
	return colors[category] || '#7FD857'
}

const getRemainingPlaces = (sortie: any) => {
	if (sortie.maxParticipants == null) return 0
	return Math.max(0, sortie.maxParticipants - (sortie.currentParticipants ?? 0))
}

const isFullyBooked = (sortie: any) =>
	sortie.maxParticipants != null && getRemainingPlaces(sortie) <= 0

useSeo({
	blok: props.blok,
	title: props.blok.seo_title || 'Sorties & Stages',
	description: props.blok.seo_description || 'Découvrez nos sorties en falaise, stages et événements d\'escalade organisés par l\'ASC Escalade.',
})
</script>
