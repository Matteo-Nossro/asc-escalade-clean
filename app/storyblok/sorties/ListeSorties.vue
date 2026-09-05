<template>
	<div
		v-editable="blok"
		class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-8xl mx-auto px-4"
		style="margin-top: 3rem; margin-bottom: 3rem"
	>
		<div
			v-for="sortie in sorties"
			:key="sortie._uid || sortie.id"
			class="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
		>
			<NuxtLink :to="`/sorties/${sortie.slug}`" class="flex flex-col h-full">

				<!-- IMAGE + BADGE -->
				<div class="relative h-64 w-full bg-gray-200 overflow-hidden">
					<NuxtImg
						v-if="sortie.image?.filename"
						provider="storyblok"
						:src="sortie.image.filename"
						:alt="sortie.image.alt || sortie.title"
						format="webp"
						:quality="75"
						:width="600"
						:height="256"
						class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 block"
						loading="lazy"
					/>
					<img
						v-else-if="sortie.image_url"
						:src="sortie.image_url"
						:alt="sortie.title"
						class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 block"
						loading="lazy"
					/>

					<!-- Badge Catégorie -->
					<Tag
						v-if="sortie.category"
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
import { computed } from 'vue'
import Tag from '~/components/ui/Tag.vue'

const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

// blok.sorties est un array de bloks nestables (sorties_item)
// avec : title, slug, image (Asset), image_url (fallback), category, date,
//        location, difficulty, price, max_participants, current_participants
const sorties = computed(() => {
	if (props.blok.sorties?.length) return props.blok.sorties
	return [
		{
			_uid: '1',
			slug: 'sortie-falaise-buoux',
			title: 'Sortie falaise à Buoux',
			image_url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&q=75',
			category: 'Falaise',
			date: '2025-05-10',
			location: 'Buoux, Luberon',
			difficulty: 'Intermédiaire',
			price: 15,
			max_participants: 12,
			current_participants: 8
		},
		{
			_uid: '2',
			slug: 'stage-debutants-climb-up',
			title: 'Stage débutants Climb Up',
			image_url: 'https://images.unsplash.com/photo-1507034589631-9433cc6bc453?w=600&q=75',
			category: 'Stage',
			date: '2025-05-24',
			location: 'Climb Up Marseille',
			difficulty: 'Débutant',
			price: 30,
			max_participants: 10,
			current_participants: 10
		},
		{
			_uid: '3',
			slug: 'sortie-calanques',
			title: 'Escalade dans les Calanques',
			image_url: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=600&q=75',
			category: 'Falaise',
			date: '2025-06-07',
			location: 'Calanques de Marseille',
			difficulty: 'Confirmé',
			price: 20,
			max_participants: 8,
			current_participants: 3
		}
	]
})

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
		'Cime Altitude': '#2563EB'
	}
	return colors[category] || '#7FD857'
}

const getRemainingPlaces = (sortie: any) => {
	if (sortie.max_participants == null) return 0
	return Math.max(0, sortie.max_participants - (sortie.current_participants ?? 0))
}

const isFullyBooked = (sortie: any) => {
	return sortie.max_participants != null && getRemainingPlaces(sortie) <= 0
}
</script>
