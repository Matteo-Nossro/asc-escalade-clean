<template>
	<section class="py-20 bg-white">
		<UContainer>
			<!-- En-tête de section -->
			<div class="flex items-end justify-between mb-12">
				<h2 class="text-3xl font-bold text-[#0F1729]">
					Actualités
				</h2>

				<UButton
						to="/actualites"
						variant="ghost"
						color="neutral"
						trailing-icon="i-heroicons-arrow-right-20-solid"
						label="Toutes les actus"
						class="hidden md:flex text-[#0F1729] hover:text-[#7FD857]"
				/>
			</div>

			<!-- Grille d'actualités -->
			<div class="grid grid-cols-1 md:grid-cols-12 gap-6">

				<!-- Article Principal (Grande image) - Colonne gauche -->
				<div class="md:col-span-8 relative group overflow-hidden rounded-2xl h-[400px]">
					<!-- Image de fond -->
					<img
							src="https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=2003&auto=format&fit=crop"
							alt="Escalade calanques"
							class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>

					<!-- Overlay dégradé -->
					<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

					<!-- Contenu -->
					<div class="absolute bottom-0 left-0 p-8 w-full">
						<UBadge
								label="Sortie Falaise"
								class="bg-[#7FD857] text-[#0F1729] font-bold mb-3 border-none rounded-md px-3 py-1"
						/>

						<h3 class="text-2xl font-bold text-white mb-2 leading-tight">
							Retour sur le stage d'été dans les Calanques
						</h3>

						<p class="text-gray-200 text-sm line-clamp-2 md:w-3/4">
							Une semaine intense de grimpe, de soleil et de convivialité. Découvrez le résumé en images de notre aventure annuelle.
						</p>
					</div>

					<!-- Lien global sur la card -->
					<NuxtLink to="/actualites/stage-calanques" class="absolute inset-0 z-10" />
				</div>

				<!-- Colonne droite - Liste verticale -->
				<div class="md:col-span-4 flex flex-col gap-6 h-[400px]">

					<!-- Article 2 (Petit) -->
					<div class="bg-[#F5F7FA] rounded-2xl p-6 flex flex-col justify-between h-full relative hover:bg-gray-100 transition-colors">
						<div class="flex justify-between items-start mb-4">
							<span class="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded">12 Jan 2026</span>
							<UButton
									icon="i-heroicons-arrow-right"
									variant="ghost"
									color="neutral"
									class="bg-white hover:bg-gray-50 rounded-lg"
							/>
						</div>

						<div>
							<h3 class="text-lg font-bold text-[#0F1729] mb-2">
								Inscriptions cours 2026
							</h3>
							<p class="text-sm text-gray-600 line-clamp-2">
								Les réinscriptions sont ouvertes pour la saison prochaine. Pensez à renouveler votre licence.
							</p>
						</div>

						<NuxtLink to="/actualites/inscriptions-2026" class="absolute inset-0 z-10" />
					</div>

					<!-- Article 3 (Petit - Dark) -->
					<div class="bg-[#0F1729] rounded-2xl p-6 flex flex-col justify-between h-full relative group overflow-hidden">
						<!-- Décoration de fond légère -->
						<div class="absolute top-0 right-0 w-24 h-24 bg-[#7FD857] opacity-10 rounded-full blur-2xl -mr-8 -mt-8"></div>

						<div class="flex justify-between items-start mb-4 relative z-10">
							<span class="text-xs font-semibold text-gray-400 border border-gray-700 px-2 py-1 rounded">08 Jan 2026</span>
						</div>

						<div class="relative z-10">
							<h3 class="text-lg font-bold text-white mb-2 group-hover:text-[#7FD857] transition-colors">
								Compétition Départementale
							</h3>
							<p class="text-sm text-gray-400 line-clamp-2">
								Bravo à nos 5 jeunes qualifiés pour les régionaux ! Résultats complets ici.
							</p>
						</div>

						<NuxtLink to="/actualites/competition-departementale" class="absolute inset-0 z-10" />
					</div>

				</div>

				<!-- Bouton mobile "Voir toutes les actus" -->
				<div class="md:hidden col-span-1 mt-4">
					<UButton
							to="/actualites"
							block
							variant="outline"
							color="neutral"
							label="Voir toutes les actualités"
							trailing-icon="i-heroicons-arrow-right-20-solid"
					/>
				</div>

			</div>
		</UContainer>
	</section>
</template>

<script setup>
// Pas de script complexe nécessaire pour l'affichage statique
</script>

<style scoped>
/* Pas de styles custom nécessaires grâce à Tailwind */
</style>
