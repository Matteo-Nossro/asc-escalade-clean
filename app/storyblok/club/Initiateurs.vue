<template>
	<section v-editable="blok" class="py-24 bg-gray-50 border-t border-gray-200 overflow-x-hidden">

		<div class="text-center max-w-2xl mx-auto mb-12 px-4">
			<h2 class="text-3xl font-black text-[#0F1729] mb-4">
				{{ blok.title || 'Nos initiateurs' }}
			</h2>
			<p class="text-gray-600 text-lg">
				{{ blok.subtitle || 'Les bénévoles qui encadrent et transmettent la passion de l\'escalade.' }}
			</p>
		</div>

		<!--
			Marquee CSS pur : chaque initiateur est rendu UNE seule fois par ligne.
			Le second groupe (aria-hidden) est un clone purement visuel pour la boucle
			sans couture ; il n'est pas exposé aux lecteurs d'écran ni compté comme
			contenu distinct.
		-->
		<div
			v-for="(row, rowIndex) in rows"
			:key="`row-${rowIndex}`"
			class="relative w-full max-w-[100vw]"
			:class="rowIndex === 0 ? 'mb-10' : ''"
		>
			<div class="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
			<div class="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

			<div class="marquee" :class="rowIndex === 1 ? 'marquee--reverse' : ''">
				<ul
					v-for="group in 2"
					:key="group"
					class="marquee__track"
					:aria-hidden="group === 2 ? 'true' : undefined"
				>
					<li
						v-for="(item, i) in row"
						:key="`${rowIndex}-${group}-${i}`"
						class="flex flex-col items-center gap-2 group cursor-default"
					>
						<NuxtImg
							v-if="item.image?.filename"
							provider="storyblok"
							:src="item.image.filename"
							:alt="item.Nom || item.image.alt || ''"
							format="webp"
							:quality="80"
							width="112"
							height="112"
							class="w-28 h-28 object-cover rounded-xl grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 transition-all duration-300"
						/>
						<div
							v-else
							class="w-28 h-28 rounded-xl bg-gray-200 flex items-center justify-center"
						>
							<span class="text-gray-400 text-xs">{{ item.Nom || 'Initiateur' }}</span>
						</div>
						<span class="text-sm font-medium text-gray-700 text-center w-28 leading-tight">{{ item.Nom }}</span>
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

const initiateurs = computed(() => props.blok.initiateurs || [])

// Répartition de la liste réelle sur deux lignes (aucune duplication de contenu).
const half1 = computed(() => {
	const all = initiateurs.value
	return all.slice(0, Math.ceil(all.length / 2))
})

const half2 = computed(() => {
	const all = initiateurs.value
	return all.slice(Math.ceil(all.length / 2))
})

const rows = computed(() => [half1.value, half2.value])
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
	align-items: flex-start;
	justify-content: space-around;
	gap: 2rem;
	min-width: 100%;
	padding: 0 2rem;
	margin: 0;
	list-style: none;
	animation: marquee-scroll 35s linear infinite;
}

.marquee--reverse .marquee__track {
	animation-direction: reverse;
}

.marquee:hover .marquee__track {
	animation-play-state: paused;
}

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
