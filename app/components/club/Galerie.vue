<template>
	<section id="galerie" class="py-24 bg-white relative overflow-hidden">
		<div class="absolute top-20 left-0 w-96 h-96 bg-gray-50 rounded-full blur-3xl -z-10 opacity-60"></div>

		<UContainer>
			<div class="mb-16 text-center max-w-2xl mx-auto">
				<h2 class="text-4xl font-black text-[#0F1729] mb-4 tracking-tight">Instants Verticaux</h2>
				<p class="text-gray-500 text-lg font-medium">L'escalade, c'est avant tout des moments partagés.</p>
			</div>

			<div class="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
				<div
						v-for="(photo, index) in photos"
						:key="index"
						class="break-inside-avoid group relative rounded-2xl overflow-hidden cursor-zoom-in shadow-sm hover:shadow-xl transition-all duration-300"
						@click="openLightbox(photo)"
				>
					<img :src="photo.src" :alt="photo.alt" class="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105" loading="lazy" />
					<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
						<span class="text-white font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{{ photo.alt }}</span>
					</div>
				</div>
			</div>
		</UContainer>

		<!--
			PLAN B : MODALE FAITE MAISON (SANS NUXT UI)
			Impossible que ça rate : C'est du HTML/CSS standard posé par-dessus le site.
		-->
		<Teleport to="body">
			<Transition name="fade">
				<div
						v-if="isOpen"
						class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
						@click.self="isOpen = false"
				>

					<!-- Bouton Fermer -->
					<button
							@click="isOpen = false"
							class="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all cursor-pointer z-50"
					>
						<!-- Croix SVG simple -->
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>

					<!-- Conteneur Image -->
					<div class="relative w-full max-w-7xl max-h-screen flex flex-col items-center rounded">
						<img
								v-if="selectedPhoto"
								:src="selectedPhoto.src"
								:alt="selectedPhoto.alt"
								class="max-w-full max-h-[85vh] object-contain rounded shadow-2xl select-none"
						/>
						<p class="mt-4 text-white/80 font-medium text-lg">{{ selectedPhoto?.alt }}</p>
					</div>

				</div>
			</Transition>
		</Teleport>
	</section>
</template>

<script setup>
const isOpen = ref(false)
const selectedPhoto = ref(null)

const openLightbox = (photo) => {
	selectedPhoto.value = photo
	isOpen.value = true
}

// Touche ECHAP pour fermer
onMounted(() => {
	window.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && isOpen.value) isOpen.value = false
	})
})

const photos = [
	{ src: 'https://images.unsplash.com/photo-1516592673881-b63665536f19?w=800&q=80', alt: 'Orpierre - Grande Voie' },
	{ src: 'https://images.unsplash.com/photo-1601224748193-d34f112e31e6?w=600&q=80', alt: 'Chamonix - Le sommet' },
	{ src: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80', alt: 'Bloc Indoor - Finale' },
	{ src: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80', alt: 'L\'équipe de compétition' },
	{ src: 'https://images.unsplash.com/photo-1583693248386-b4d0812bd2d5?w=600&q=80', alt: 'Cours Enfants' },
	{ src: 'https://images.unsplash.com/photo-1505250469679-0539f972d54e?w=800&q=80', alt: 'Stage d\'été' },
	{ src: 'https://images.unsplash.com/photo-1458829550379-37c223cb99eb?w=600&q=80', alt: 'Soirée du Club' }
]
</script>

<style scoped>
.break-inside-avoid {
	break-inside: avoid;
}

/* Animation d'ouverture fluide */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	transform: scale(0.95);
}
</style>
