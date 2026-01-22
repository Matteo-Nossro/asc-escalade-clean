<template>
	<div class="max-w-5xl mx-auto px-4 mt-24 mb-20">

		<h2 class="text-3xl font-bold text-center text-[#0F1729] mb-12">
			Planning des Cours 2025-2026
		</h2>

		<!-- ACCORDÉON NUXT UI -->
		<!-- On utilise le slot #item pour afficher le contenu (ici une UTable) -->
		<UAccordion
				:items="categories"
				multiple
				variant="soft"
				size="xl"
				:ui="{
        wrapper: 'space-y-4',
        item: {
          base: 'border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden mb-4',
          padding: 'p-0',
          icon: 'text-gray-400 w-5 h-5'
        },
        default: {
          class: 'p-6 w-full text-lg font-bold text-[#0F1729] hover:bg-gray-50 border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden mb-4'
        }
      }"
		>

			<!-- CONTENU : TABLEAU NUXT UI -->
			<template #content="{ item }">
				<div class="bg-gray-50/30 border-t border-gray-100 p-4">

					<UTable
							:data="item.coursList"
							:columns="columns"
							:ui="{
              th: { base: 'uppercase text-xs font-bold text-gray-500 tracking-wider bg-transparent' },
              td: { base: 'text-sm font-medium text-gray-900 py-4' },
              wrapper: 'bg-transparent shadow-none ring-0'
            }"
					>

						<!-- Custom Slot: Jour & Heure -->
						<template #jour-data="{ row }">
							<div>
								<div class="font-bold text-[#0F1729]">{{ row.jour }}</div>
								<div class="text-xs text-gray-500 mt-1">{{ row.horaire }}</div>
							</div>
						</template>

						<!-- Custom Slot: Niveau (Badge) -->
						<template #niveau-data="{ row }">
              <span
									class="inline-flex px-2.5 py-1 rounded text-xs font-bold uppercase"
									:class="getLevelColor(row.niveau)"
							>
                {{ row.niveau }}
              </span>
						</template>

						<!-- Custom Slot: Prix (Gras + Droite) -->
						<template #prix-data="{ row }">
							<div class="text-right font-black text-[#0F1729] text-base">
								{{ row.prix }}€
							</div>
						</template>

					</UTable>

				</div>
			</template>

		</UAccordion>

	</div>
</template>

<script setup>
// Définition des colonnes pour UTable
const columns = [
	{ id:1, accessorKey: 'jour', label: 'Jour & Heure' },
	{ id:2, accessorKey: 'niveau', label: 'Niveau' },
	{ id:3, accessorKey: 'annee', label: 'Année Réf.' },
	{ id:4, accessorKey: 'effectif', label: 'Effectif', class: 'text-center' },
	{ id:5, accessorKey: 'prix', label: 'Prix', class: 'text-right' }
]

// Couleurs des badges
const getLevelColor = (niveau) => {
	switch (niveau) {
		case 'Débutant': return 'bg-green-100 text-green-700'
		case 'Initié': return 'bg-blue-100 text-blue-700'
		case 'Confirmé': return 'bg-purple-100 text-purple-700'
		case 'Autonomie': return 'bg-orange-100 text-orange-700'
		default: return 'bg-gray-100 text-gray-600'
	}
}

// Données
const categories = [
	{
		label: 'Baby 4-6 ans',
		coursList: [
			{ jour: 'Mercredi', horaire: '10:00 - 11:00', niveau: 'Débutant', annee: '2019-2021', effectif: 8, prix: 160 }
		]
	},
	{
		label: 'Baby 5-6 ans',
		coursList: [
			{ jour: 'Samedi', horaire: '09:30 - 10:30', niveau: 'Débutant', annee: '2019-2020', effectif: 8, prix: 160 }
		]
	},
	{
		label: 'Enfants 7-9 ans',
		coursList: [
			{ jour: 'Mercredi', horaire: '15:00 - 16:30', niveau: 'Initié', annee: '2016-2018', effectif: 12, prix: 210 },
			{ jour: 'Samedi', horaire: '14:00 - 15:30', niveau: 'Débutant', annee: '2016-2018', effectif: 12, prix: 210 }
		]
	},
	{
		label: 'Ados 10-13 ans',
		coursList: [
			{ jour: 'Mardi', horaire: '17:30 - 19:00', niveau: 'Confirmé', annee: '2012-2015', effectif: 14, prix: 230 },
			{ jour: 'Jeudi', horaire: '17:30 - 19:00', niveau: 'Tous Niveaux', annee: '2012-2015', effectif: 14, prix: 230 }
		]
	},
	{
		label: 'Ados 14-17 ans',
		coursList: [
			{ jour: 'Jeudi', horaire: '18:00 - 20:00', niveau: 'Confirmé', annee: '2008-2011', effectif: 16, prix: 250 }
		]
	},
	{
		label: 'Adultes',
		coursList: [
			{ jour: 'Lundi', horaire: '20:00 - 22:00', niveau: 'Débutant', annee: 'Avant 2007', effectif: 20, prix: 280 },
			{ jour: 'Jeudi', horaire: '20:00 - 22:00', niveau: 'Autonomie', annee: 'Avant 2007', effectif: 20, prix: 280 }
		]
	},
	{
		label: 'Escalade Famille',
		coursList: [
			{ jour: 'Dimanche', horaire: '10:00 - 12:00', niveau: 'Tous Niveaux', annee: 'Toutes', effectif: 30, prix: 100 }
		]
	}
]
</script>
