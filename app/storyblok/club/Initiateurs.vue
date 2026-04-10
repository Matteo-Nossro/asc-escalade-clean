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

		<!-- Ligne 1 : gauche → droite -->
		<div class="relative w-full max-w-[100vw] mb-10">
			<div class="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
			<div class="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

			<div class="flex w-max animate-marquee hover:pause">
				<div class="flex items-start gap-8 px-8">
					<div
						v-for="(item, i) in filledRow1"
						:key="`a1-${i}`"
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
							<span class="text-gray-400 text-xs">Photo</span>
						</div>
						<span class="text-sm font-medium text-gray-700 text-center w-28 leading-tight">{{ item.Nom }}</span>
					</div>
				</div>
				<!-- Duplicata pour la boucle infinie -->
				<div class="flex items-start gap-8 px-8">
					<div
						v-for="(item, i) in filledRow1"
						:key="`b1-${i}`"
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
							<span class="text-gray-400 text-xs">Photo</span>
						</div>
						<span class="text-sm font-medium text-gray-700 text-center w-28 leading-tight">{{ item.Nom }}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Ligne 2 : droite → gauche -->
		<div class="relative w-full max-w-[100vw]">
			<div class="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
			<div class="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

			<div class="flex w-max animate-marquee-reverse hover:pause">
				<div class="flex items-start gap-8 px-8">
					<div
						v-for="(item, i) in filledRow2"
						:key="`a2-${i}`"
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
							<span class="text-gray-400 text-xs">Photo</span>
						</div>
						<span class="text-sm font-medium text-gray-700 text-center w-28 leading-tight">{{ item.Nom }}</span>
					</div>
				</div>
				<!-- Duplicata pour la boucle infinie -->
				<div class="flex items-start gap-8 px-8">
					<div
						v-for="(item, i) in filledRow2"
						:key="`b2-${i}`"
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
							<span class="text-gray-400 text-xs">Photo</span>
						</div>
						<span class="text-sm font-medium text-gray-700 text-center w-28 leading-tight">{{ item.Nom }}</span>
					</div>
				</div>
			</div>
		</div>

	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

const viewportWidth = ref(1920)

onMounted(() => {
	viewportWidth.value = window.innerWidth
})

const initiateurs = computed(() => {
	return props.blok.initiateurs || []
})


// Divise la liste en deux moitiés automatiquement
const half1 = computed(() => {
	const all = initiateurs.value
	return all.slice(0, Math.ceil(all.length / 2))
})

const half2 = computed(() => {
	const all = initiateurs.value
	return all.slice(Math.ceil(all.length / 2))
})

// Chaque carte fait ~144px (w-28=112px + gap-8=32px).
// On répète les items pour couvrir au moins la largeur du viewport.
function fillItems(items) {
	if (!items.length) return []
	const itemWidth = 144
	const minCount = Math.ceil(viewportWidth.value / itemWidth) + 4
	const times = Math.ceil(minCount / items.length)
	return Array.from({ length: times }, () => items).flat()
}

const filledRow1 = computed(() => fillItems(half1.value))
const filledRow2 = computed(() => fillItems(half2.value))
</script>

<style scoped>
.animate-marquee {
	animation: marquee 35s linear infinite;
}

.animate-marquee-reverse {
	animation: marquee-reverse 35s linear infinite;
}

.hover\:pause:hover {
	animation-play-state: paused;
}

@keyframes marquee {
	0%   { transform: translateX(0); }
	100% { transform: translateX(-50%); }
}

@keyframes marquee-reverse {
	0%   { transform: translateX(-50%); }
	100% { transform: translateX(0); }
}
</style>
