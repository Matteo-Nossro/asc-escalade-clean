<!--<template>-->
<!--	<section class="py-24 bg-gray-50 border-t border-gray-200">-->
<!--		<UContainer>-->

<!--			&lt;!&ndash; En-tête de section &ndash;&gt;-->
<!--			<div class="text-center max-w-2xl mx-auto mb-16">-->
<!--				<h2 class="text-3xl font-black text-[#0F1729] mb-4">-->
<!--					Ils nous soutiennent-->
<!--				</h2>-->
<!--				<p class="text-gray-600 text-lg">-->
<!--					Grâce à nos partenaires institutionnels et privés, Vertical Pulse continue de grimper toujours plus haut.-->
<!--				</p>-->
<!--			</div>-->

<!--			&lt;!&ndash; Grille des Logos (8 partenaires) &ndash;&gt;-->
<!--			<div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center justify-items-center">-->

<!--				<div-->
<!--						v-for="(partner, index) in partners"-->
<!--						:key="index"-->
<!--						class="group flex items-center justify-center w-full h-32 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300"-->
<!--				>-->
<!--					<img-->
<!--							:src="partner.logo"-->
<!--							:alt="partner.name"-->
<!--							class="max-h-16 w-auto object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"-->
<!--					/>-->
<!--				</div>-->

<!--			</div>-->

<!--		</UContainer>-->
<!--	</section>-->
<!--</template>-->

<!--<script setup>-->
<!--const partners = [-->
<!--	// Institutions Locales-->
<!--	{ name: 'Mairie de Dole', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/52/Logo_Ville_de_Dole.svg/1200px-Logo_Ville_de_Dole.svg.png' },-->
<!--	{ name: 'Département Jura', logo: 'https://upload.wikimedia.org/wikipedia/fr/6/60/Logo_du_d%C3%A9partement_du_Jura.svg' },-->
<!--	{ name: 'Région BFC', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/87/Logo_R%C3%A9gion_Bourgogne-Franche-Comt%C3%A9_2016.svg/1200px-Logo_R%C3%A9gion_Bourgogne-Franche-Comt%C3%A9_2016.svg.png' },-->
<!--	{ name: 'FFME', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/86/Ffme-logo-2016.svg/1200px-Ffme-logo-2016.svg.png' },-->

<!--	// Sponsors Privés / Marques-->
<!--	{ name: 'Intersport', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Intersport_Logo.svg/1200px-Intersport_Logo.svg.png' },-->
<!--	{ name: 'Petzl', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8b/Petzl_logo.svg/1200px-Petzl_logo.svg.png' },-->
<!--	{ name: 'Beal', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Beal_logo.png' },-->
<!--	{ name: 'Vieux Campeur', logo: 'https://upload.wikimedia.org/wikipedia/fr/3/35/Au_Vieux_Campeur_Logo.jpg' }-->
<!--]-->
<!--</script>-->

<template>
	<section class="py-24 bg-gray-50 border-t border-gray-200 overflow-hidden">

		<!-- En-tête -->
		<div class="text-center max-w-2xl mx-auto mb-12 px-4">
			<h2 class="text-3xl font-black text-[#0F1729] mb-4">
				Ils nous soutiennent
			</h2>
			<p class="text-gray-600 text-lg">
				Nos partenaires institutionnels et privés.
			</p>
		</div>

		<!-- Container du Marquee -->
		<div class="relative w-full max-w-[100vw]">

			<!-- Masques en dégradé (Fade effect) sur les côtés pour faire joli -->
			<div class="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10"></div>
			<div class="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10"></div>

			<!-- La piste qui défile (On duplique la liste pour la boucle infinie) -->
			<div class="flex w-max animate-marquee hover:pause">

				<!-- GROUPE 1 -->
				<div class="flex items-center gap-16 px-8">
					<div
							v-for="(partner, index) in partners"
							:key="`a-${index}`"
							class="flex items-center justify-center h-24 w-32 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
					>
						<img :src="partner.logo" :alt="partner.name" class="max-h-16 w-auto object-contain" />
					</div>
				</div>

				<!-- GROUPE 2 (Duplicata pour l'illusion d'infini) -->
				<div class="flex items-center gap-16 px-8">
					<div
							v-for="(partner, index) in partners"
							:key="`b-${index}`"
							class="flex items-center justify-center h-24 w-32 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
					>
						<img :src="partner.logo" :alt="partner.name" class="max-h-16 w-auto object-contain" />
					</div>
				</div>

			</div>
		</div>

	</section>
</template>

<script setup>
const partners = [
	{ name: 'Mairie de Dole', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/52/Logo_Ville_de_Dole.svg/1200px-Logo_Ville_de_Dole.svg.png' },
	{ name: 'Département Jura', logo: 'https://upload.wikimedia.org/wikipedia/fr/6/60/Logo_du_d%C3%A9partement_du_Jura.svg' },
	{ name: 'Région BFC', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/87/Logo_R%C3%A9gion_Bourgogne-Franche-Comt%C3%A9_2016.svg/1200px-Logo_R%C3%A9gion_Bourgogne-Franche-Comt%C3%A9_2016.svg.png' },
	{ name: 'FFME', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/86/Ffme-logo-2016.svg/1200px-Ffme-logo-2016.svg.png' },
	{ name: 'Intersport', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Intersport_Logo.svg/1200px-Intersport_Logo.svg.png' },
	{ name: 'Petzl', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8b/Petzl_logo.svg/1200px-Petzl_logo.svg.png' },
	{ name: 'Beal', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Beal_logo.png' },
	{ name: 'Vieux Campeur', logo: 'https://upload.wikimedia.org/wikipedia/fr/3/35/Au_Vieux_Campeur_Logo.jpg' }
]
</script>

<style scoped>
/* Animation personnalisée */
.animate-marquee {
	animation: marquee 30s linear infinite;
}

/* Pause au survol (optionnel, supprimez si vous ne voulez pas) */
.hover\:pause:hover {
	animation-play-state: paused;
}

@keyframes marquee {
	0% {
		transform: translateX(0);
	}
	100% {
		/* On déplace de -50% car le contenu est dupliqué (2 blocs) */
		transform: translateX(-50%);
	}
}
</style>

