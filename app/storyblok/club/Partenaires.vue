<template>
	<section v-editable="blok" class="py-24 bg-gray-50 border-t border-gray-200 overflow-hidden">

		<div class="text-center max-w-2xl mx-auto mb-12 px-4">
			<h2 class="text-3xl font-black text-[#0F1729] mb-4">
				{{ blok.title || 'Ils nous soutiennent' }}
			</h2>
			<p class="text-gray-600 text-lg">
				{{ blok.subtitle || 'Nos partenaires institutionnels et privés.' }}
			</p>
		</div>

		<div class="relative w-full max-w-[100vw]">

			<div class="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10"></div>
			<div class="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10"></div>

			<div class="flex w-max animate-marquee hover:pause">

				<!-- GROUPE 1 -->
				<div class="flex items-center gap-16 px-8">
					<div
							v-for="(partner, index) in partners"
							:key="`a-${index}`"
							class="flex items-center justify-center h-24 w-32 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
					>
						<NuxtImg
								v-if="partner.logo?.filename"
								provider="storyblok"
								:src="partner.logo.filename"
								:alt="partner.name || partner.logo.alt || ''"
								format="webp"
								:quality="80"
								:height="64"
								class="max-h-16 w-auto object-contain"
						/>
						<img
								v-else-if="partner.logo_url"
								:src="partner.logo_url"
								:alt="partner.name || ''"
								class="max-h-16 w-auto object-contain"
						/>
					</div>
				</div>

				<!-- GROUPE 2 (Duplicata pour l'illusion d'infini) -->
				<div class="flex items-center gap-16 px-8">
					<div
							v-for="(partner, index) in partners"
							:key="`b-${index}`"
							class="flex items-center justify-center h-24 w-32 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
					>
						<NuxtImg
								v-if="partner.logo?.filename"
								provider="storyblok"
								:src="partner.logo.filename"
								:alt="partner.name || partner.logo.alt || ''"
								format="webp"
								:quality="80"
								:height="64"
								class="max-h-16 w-auto object-contain"
						/>
						<img
								v-else-if="partner.logo_url"
								:src="partner.logo_url"
								:alt="partner.name || ''"
								class="max-h-16 w-auto object-contain"
						/>
					</div>
				</div>

			</div>
		</div>

	</section>
</template>

<script setup>
const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

// blok.partners est un array de bloks Storyblok avec les champs name et logo (asset)
// Fallback sur des données statiques si pas de contenu Storyblok
const partners = computed(() => {
	if (props.blok.partners?.length) return props.blok.partners
	return [
		{ name: 'Mairie de Dole', logo_url: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/52/Logo_Ville_de_Dole.svg/1200px-Logo_Ville_de_Dole.svg.png' },
		{ name: 'Département Jura', logo_url: 'https://upload.wikimedia.org/wikipedia/fr/6/60/Logo_du_d%C3%A9partement_du_Jura.svg' },
		{ name: 'Région BFC', logo_url: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/87/Logo_R%C3%A9gion_Bourgogne-Franche-Comt%C3%A9_2016.svg/1200px-Logo_R%C3%A9gion_Bourgogne-Franche-Comt%C3%A9_2016.svg.png' },
		{ name: 'FFME', logo_url: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/86/Ffme-logo-2016.svg/1200px-Ffme-logo-2016.svg.png' },
		{ name: 'Intersport', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Intersport_Logo.svg/1200px-Intersport_Logo.svg.png' },
		{ name: 'Petzl', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8b/Petzl_logo.svg/1200px-Petzl_logo.svg.png' },
		{ name: 'Beal', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Beal_logo.png' },
		{ name: 'Vieux Campeur', logo_url: 'https://upload.wikimedia.org/wikipedia/fr/3/35/Au_Vieux_Campeur_Logo.jpg' }
	]
})
</script>

<style scoped>
.animate-marquee {
	animation: marquee 30s linear infinite;
}

.hover\:pause:hover {
	animation-play-state: paused;
}

@keyframes marquee {
	0% { transform: translateX(0); }
	100% { transform: translateX(-50%); }
}
</style>
