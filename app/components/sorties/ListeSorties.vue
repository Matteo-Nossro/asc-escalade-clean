<template>
	<div
			class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-8xl mx-auto px-4"
			style="margin-top: 3rem; margin-bottom: 3rem"
	>
		<div
				v-for="sortie in sorties"
				:key="sortie.id"
				class="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
		>
			<NuxtLink :to="`/posts/${sortie.slug}`" class="flex flex-col h-full">

				<!-- IMAGE + BADGE -->
				<div class="relative h-64 w-full bg-gray-200 overflow-hidden">
					<img
							:src="sortie.image"
							:alt="sortie.title"
							class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 block"
							loading="lazy"
					/>

					<!-- Badge Catégorie -->
					<Tag
							:label="sortie.category"
							:color="getCategoryColor(sortie.category)"
							size="md"
							variant="solid"
							class="absolute top-4 left-4 shadow-lg z-10"
					/>
				</div>

				<!-- CONTENU -->
				<div class="p-6 md:p-8 flex-grow flex flex-col justify-between">

					<div>
						<h3 class="text-xl font-bold text-[#0F1729] mb-6 line-clamp-2 min-h-[3.5rem]">
							{{ sortie.title }}
						</h3>

						<!-- Infos -->
						<div class="space-y-3 mb-8">
							<div class="flex items-center gap-3 text-sm text-gray-600">
								<UIcon name="i-heroicons-calendar" class="w-5 h-5 text-[#7FD857] flex-shrink-0"/>
								<span>{{ formatDate(sortie.date) }}</span>
							</div>

							<div v-if="sortie.location" class="flex items-center gap-3 text-sm text-gray-600">
								<UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-[#7FD857] flex-shrink-0 font-bold"/>
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

					<!-- FOOTER CARTE -->
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
</template>

<script setup lang="ts">
import type { Post } from '~/types/post'
import Tag from '~/components/ui/Tag.vue'

// Props pour recevoir les sorties
interface Props {
	sorties: Post[]
}

const props = defineProps<Props>()  // ✅ Enlever les {}

// Fonction pour formater la date
const formatDate = (date: string) => {
	return new Date(date).toLocaleDateString('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	})
}

// Fonction pour obtenir la couleur de la catégorie
const getCategoryColor = (category: string) => {
	const colors: Record<string, string> = {
		'Falaise': '#7FD857',
		'Bloc': '#4ECDC4',
		'Stage': '#9333EA', // purple-600
		'Climb Up': '#F97316', // orange-500
		'Cime Altitude': '#2563EB' // blue-600
	}
	return colors[category] || '#7FD857'
}

// Fonction pour calculer les places restantes
const getRemainingPlaces = (sortie: Post) => {
	if (!sortie.maxParticipants || !sortie.currentParticipants) return 0
	return sortie.maxParticipants - sortie.currentParticipants
}

// Fonction pour vérifier si complet
const isFullyBooked = (sortie: Post) => {
	return getRemainingPlaces(sortie) <= 0
}
</script>
