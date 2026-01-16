<template>
	<section id="histoire" class="py-20 bg-white">
		<UContainer>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

				<!-- Colonne Gauche : Texte -->
				<div class="flex flex-col gap-6">
					<!-- Titre avec icône -->
					<div class="flex items-center gap-3 mb-2">
						<UIcon name="i-heroicons-clock" class="w-8 h-8 text-[#7FD857]" />
						<h2 class="text-3xl font-bold text-[#0F1729]">
							Notre Histoire
						</h2>
					</div>

					<div class="space-y-6 text-gray-600 leading-relaxed text-justify">
						<p>
							Fondé en 1998 par une poignée de passionnés, Vertical Pulse n'était au départ qu'un petit groupe d'amis se réunissant pour grimper sur les falaises locales.
						</p>
						<p>
							Aujourd'hui, l'association a bien grandi mais l'esprit reste le même : convivialité, partage et dépassement de soi. Nous avons pour mission de rendre l'escalade accessible à tous, quel que soit l'âge, le niveau ou la condition physique.
						</p>
						<p>
							Affiliés à la FFME et labellisés Handisport, nous nous engageons pour une pratique sécurisée et inclusive.
						</p>
					</div>
				</div>

				<!-- Colonne Droite : Visuel 1998 -->
				<div class="relative h-[400px] bg-gray-50 rounded-3xl overflow-hidden flex items-center justify-center group">

					<!-- Montagne en fond (SVG décoratif) -->
					<svg
							class="absolute bottom-0 w-full text-gray-200 opacity-50 transition-transform duration-700 group-hover:scale-105"
							viewBox="0 0 1440 320"
							preserveAspectRatio="none"
					>
						<path fill="currentColor" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
					</svg>

					<!-- Cercle central subtil -->
					<div class="absolute w-64 h-64 border border-gray-200 rounded-full opacity-50"></div>
					<div class="absolute w-80 h-80 border border-gray-100 rounded-full opacity-30"></div>

					<!-- Année 1998 -->
					<div class="relative z-10 flex flex-col items-center">
						<!-- Triangle stylisé derrière le texte -->
						<div class="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] border-b-gray-100 mb-[-60px]"></div>

						<span class="text-6xl font-extrabold text-[#0F1729]/10 select-none tracking-widest">
               1998
             </span>

						<!-- Petit texte "Fondation" par dessus pour l'accessibilité/style -->
						<span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-[#0F1729] bg-white px-4 py-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               Création
             </span>
					</div>

				</div>

			</div>
		</UContainer>
	</section>
</template>
