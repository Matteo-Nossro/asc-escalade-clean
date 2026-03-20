<template>
	<section v-editable="blok" id="equipe" class="py-20 bg-white">
		<UContainer>
			<h2 class="text-3xl font-bold text-center text-[#0F1729] mb-12">
				{{ blok.title || 'Le Bureau & Les Coachs' }}
			</h2>

			<UCarousel
					v-slot="{ item }"
					:items="members"
					:ui="{
          item: 'basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 px-4'
        }"
					class="w-full"
					arrows
			>
				<div class="flex flex-col items-center">
					<div class="w-full aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-gray-100">
						<NuxtImg
								v-if="item.image?.filename"
								provider="storyblok"
								:src="item.image.filename"
								:alt="item.image.alt || item.name"
								format="webp"
								:quality="80"
								:width="400"
								:height="533"
								class="w-full h-full object-cover"
								draggable="false"
						/>
						<img
								v-else-if="item.image_url"
								:src="item.image_url"
								:alt="item.name"
								class="w-full h-full object-cover"
								draggable="false"
						/>
					</div>

					<h3 class="text-lg font-bold text-[#0F1729]">{{ item.name }}</h3>
					<span class="text-sm font-medium text-[#7FD857] uppercase">{{ item.role }}</span>
				</div>
			</UCarousel>

		</UContainer>
	</section>
</template>

<script setup>
const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

// blok.members est un array de bloks Storyblok avec les champs name, role, image
// Fallback sur des données statiques si pas de contenu Storyblok
const members = computed(() => {
	if (props.blok.members?.length) return props.blok.members
	return [
		{ name: 'Thomas D.', role: 'Président', image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80' },
		{ name: 'Sarah L.', role: 'Trésorière', image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80' },
		{ name: 'Julien M.', role: 'Coach BE', image_url: 'https://images.unsplash.com/photo-1531384441138-2736e62e0597?w=500&q=80' },
		{ name: 'Marie C.', role: 'Secrétaire', image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80' },
		{ name: 'Alex R.', role: 'Ouvreur', image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80' }
	]
})
</script>
