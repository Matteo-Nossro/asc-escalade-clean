<template>
	<!-- Ajout d'une marge négative en haut pour "remonter" sur le Concept si voulu,
			 ou marge positive pour espacer. Ici, j'espace pour éviter le chevauchement. -->
	<div
			class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-8xl mx-auto px-4"
			style="margin-top: 3rem; margin-bottom: 3rem"
	>
		<div
				v-for="(sortie, index) in sorties"
				:key="index"
				class="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
		>
			<!-- IMAGE + BADGE -->
			<div class="relative h-64 w-full bg-gray-200 overflow-hidden">
				<img
						:src="sortie.image"
						:alt="sortie.titre"
						class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 block"
						loading="lazy"
				/>

				<!-- Badge Catégorie -->
				<span
						class="absolute top-4 left-4 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide text-white shadow-sm z-10"
						:class="sortie.badgeColor"
				>
          {{ sortie.categorie }}
        </span>
			</div>

			<!-- CONTENU -->
			<div class="p-6 md:p-8 flex-grow flex flex-col justify-between">

				<div>
					<h3 class="text-xl font-bold text-[#0F1729] mb-6 line-clamp-2 min-h-[3.5rem]">{{ sortie.titre }}</h3>

					<!-- Infos -->
					<div class="space-y-3 mb-8">
						<div class="flex items-center gap-3 text-sm text-gray-600">
							<UIcon name="i-heroicons-calendar" class="w-5 h-5 text-[#7FD857] flex-shrink-0"/>
							<span>{{ sortie.date }}</span>
						</div>
						<div class="flex items-center gap-3 text-sm text-gray-600">
							<UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-[#7FD857] flex-shrink-0 font-bold"/>
							<span>{{ sortie.lieu }}</span>
						</div>
						<div class="flex items-center gap-3 text-sm text-gray-600">
							<UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-[#7FD857] flex-shrink-0"/>
							<span >{{ sortie.niveau }}</span>
						</div>
					</div>
				</div>

				<!-- FOOTER CARTE -->
				<div class="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto pt-4">
					<div class="flex flex-col">
						<span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Places</span>
						<span class="text-sm font-bold text-gray-900">{{ sortie.places }} restantes</span>
					</div>

					<UButton
							to="#"
							color="neutral"
							variant="solid"
							size="xl"
							class="px-6 font-bold transition-transform active:scale-95"
					>
						S'inscrire
					</UButton>
<!--					<UButton-->
<!--							color="neutral"-->
<!--							variant="solid"-->
<!--							size="xl"-->
<!--							label="Connexion"-->
<!--							block-->
<!--					>-->
<!--						S'inscrire-->
<!--					</UButton>-->

				</div>


			</div>
		</div>

	</div>
</template>

<script setup>
const sorties = [
	{
		titre: 'Stage Grandes Voies Verdon',
		categorie: 'Stage',
		badgeColor: 'bg-purple-600',
		image: 'https://images.unsplash.com/photo-1516592673881-b63665536f19?w=800&q=80',
		date: '14 - 17 Mai 2026',
		lieu: 'Gorges du Verdon',
		niveau: 'Confirmé (6a min)',
		places: 3
	},
	{
		titre: 'Sortie Bloc Fontainebleau',
		categorie: 'Falaise',
		badgeColor: 'bg-[#7FD857]',
		image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80',
		date: '02 - 03 Juin 2026',
		lieu: 'Forêt de Fontainebleau',
		niveau: 'Tous niveaux',
		places: 12
	},
	{
		titre: 'Soirée Climb Up',
		categorie: 'Climb Up',
		badgeColor: 'bg-orange-500',
		image: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80',
		date: 'Chaque Jeudi Soir',
		lieu: 'Climb Up Annecy',
		niveau: 'Autonomie requise',
		places: 20
	},
	{
		titre: 'Alpinisme Estival',
		categorie: 'Cime Altitude',
		badgeColor: 'bg-blue-600',
		image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
		date: '10 - 12 Juillet 2026',
		lieu: 'Massif du Mont-Blanc',
		niveau: 'Initié',
		places: 5
	}
]
</script>
