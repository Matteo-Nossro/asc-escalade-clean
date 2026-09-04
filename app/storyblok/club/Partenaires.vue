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

			<div class="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
			<div class="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

			<!--
				Marquee CSS pur : la liste réelle est rendue UNE seule fois.
				Le second groupe (aria-hidden) est un simple clone visuel nécessaire
				à la boucle sans couture ; il est ignoré par les lecteurs d'écran
				et n'ajoute pas de contenu indexable distinct.
			-->
			<div class="marquee">
				<ul
					v-for="group in 2"
					:key="group"
					class="marquee__track"
					:aria-hidden="group === 2 ? 'true' : undefined"
				>
					<li
						v-for="(partner, index) in partners"
						:key="`${group}-${index}`"
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
					</li>
				</ul>
			</div>
		</div>

	</section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

const partners = computed(() => {
	if (props.blok.partners?.length) return props.blok.partners
	return [
		{ name: 'Mairie de Dole', logo_url: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/52/Logo_Ville_de_Dole.svg/1200px-Logo_Ville_de_Dole.svg.png' },
		{ name: 'Département Jura', logo_url: 'https://upload.wikimedia.org/wikipedia/fr/6/60/Logo_du_d%C3%A9partement_du_Jura.svg' },
		{ name: 'Région BFC', logo_url: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/87/Logo_R%C3%A9gion_Bourgogne-Franche-Comt%C3%A9_2016.svg/1200px-Logo_R%C3%A9gion_Bourgogne-Franche-Comt%C3%A9_2016.svg.png' },
		{ name: 'FFME', logo_url: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/86/Ffme-logo-2016.svg/1200px-Ffme-logo-2016.svg.png' },
		{ name: 'Intersport', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Intersport_Logo.svg/1200px-Intersport_Logo.svg.png' },
		{ name: 'Petzl', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8b/Petzl_logo.svg/1200px-Petzl_logo.svg.png' },
	]
})
</script>

<style scoped>
.marquee {
	display: flex;
	width: 100%;
	overflow: hidden;
	user-select: none;
}

.marquee__track {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: space-around;
	gap: 4rem;
	min-width: 100%;
	padding: 0 2rem;
	margin: 0;
	list-style: none;
	animation: marquee-scroll 30s linear infinite;
}

.marquee:hover .marquee__track {
	animation-play-state: paused;
}

/* La boucle : chaque groupe fait au moins 100% de large, le décalage d'une
   largeur de groupe complète amène le clone exactement à la place de l'original. */
@keyframes marquee-scroll {
	to { transform: translateX(-100%); }
}

@media (prefers-reduced-motion: reduce) {
	.marquee {
		overflow-x: auto;
	}
	.marquee__track {
		animation: none;
		min-width: 0;
		justify-content: flex-start;
	}
	.marquee__track[aria-hidden='true'] {
		display: none;
	}
}
</style>
