<template>
	<section id="equipe" class="py-20 bg-white">
		<UContainer>
			<h2 class="text-3xl font-bold text-center text-[#0F1729] mb-12">
				Le Bureau & Les Coachs
			</h2>

			<!-- Carrousel avec contraintes de largeur explicites -->
			<UCarousel
					v-slot="{ item }"
					:items="members"
					:ui="{
          item: 'basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 px-4' // Force la largeur des colonnes
        }"
					class="w-full"
					arrows
			>
				<div class="flex flex-col items-center">
					<!-- Wrapper image avec ratio forcé -->
					<div class="w-full aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-gray-100">
						<img
								:src="item.image"
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
const members = [
	{ name: 'Thomas D.', role: 'Président', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80' },
	{ name: 'Sarah L.', role: 'Trésorière', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80' },
	{ name: 'Julien M.', role: 'Coach BE', image: 'https://images.unsplash.com/photo-1531384441138-2736e62e0597?w=500&q=80' },
	{ name: 'Marie C.', role: 'Secrétaire', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80' },
	{ name: 'Alex R.', role: 'Ouvreur', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80' }
]
</script>
